import { OAuthState, OAuthRes, Session } from "./types";
import { createOAuthStateString, generateCodeChallenge } from "./utils";

/**
 * test credentials intended for docs only
 */
const API_BASE_URL = "https://data-v2.novorender.com"
const OAUTH_URL = "https://auth.novorender.com"
const OAUTH_CLIENT_ID = "Bye0B7KMblEggrDS9YXHzDwZonyOBjuB"
const OAUTH_CLIENT_SECRET = "e2Sdr2F5BA1AuE1D1tw9VrfBskIdWqEA"

/**
 * Retrieves OAuth state from sessionStorage based on the key obtained from the URL query parameters.
 * @returns {OAuthState | undefined} The OAuth state object if found, otherwise undefined.
 */
export function getOAuthState(): OAuthState | undefined {
    const key = new URLSearchParams(window.location.search).get("state");

    if (!key) {
        return;
    }

    const state = sessionStorage.getItem(key);

    if (!state) {
        console.warn("OAuth state mismatch.");
        return;
    }

    try {
        sessionStorage.removeItem(key);
        return JSON.parse(state);
    } catch (e) {
        console.warn(e);
        return;
    }
}

/**
 * Handles the authentication callback from the OAuth server.
 * @param {OAuthState} state - The OAuth state object.
 * @param {string} code - The authorization code obtained from the callback.
 * @returns {Promise<string | undefined>} A promise that resolves with the access token if authentication is successful, otherwise undefined.
 */
export async function handleAuthCallback(state: OAuthState, code: string): Promise<string | undefined> {
    window.history.replaceState(null, "", `${state.path}${state.query ?? ""}`);
    const res: OAuthRes | undefined = await fetch(`${OAUTH_URL}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            code,
            grant_type: "authorization_code",
            client_id: OAUTH_CLIENT_ID,
            client_secret: OAUTH_CLIENT_SECRET,
            redirect_uri: window.location.origin,
            code_verifier: localStorage.getItem('code_verifier') ?? "",
        }),
    })
        .then((res) => {
            if (!res.ok) {
                throw new Error(res.statusText);
            }

            return res.json();
        })
        .then((res) => {
            if (!res.access_token) {
                throw new Error("Authentication failed: missing access_token");
            }
            return res;
        })
        .catch((e) => console.warn(e));

    localStorage.removeItem('code_verifier');

    if (!res) {
        return;
    }

    localStorage.setItem(
        'refresh_token',
        JSON.stringify({
            token: res.refresh_token,
            expires: Date.now() + res.refresh_token_expires_in * 1000,
        }),
    );

    return res.access_token;
}

/**
 * Initiates the login redirection to the OAuth server.
 */
export async function handleLoginRedirect() {
    const state = createOAuthStateString({
        service: "self",
        path: window.location.pathname,
        query: window.location.search,
    });

    const [verifier, challenge] = await generateCodeChallenge();
    localStorage.setItem("code_verifier", verifier);

    window.location.assign(
        OAUTH_URL +
        `/auth` +
        "?response_type=code" +
        `&client_id=${OAUTH_CLIENT_ID}` +
        `&redirect_uri=${window.location.origin}` +
        `&state=${state}` +
        `&code_challenge=${challenge}` +
        `&code_challenge_method=S256`
    );
}

/**
 * Retrieves session information from the API using the provided access token.
 * @param {string} accessToken - The access token used to authenticate the request.
 * @returns {Promise<Session | undefined>} A promise that resolves with the session information if successful, otherwise undefined.
 */
export async function getSession(accessToken: string): Promise<Session | undefined> {
    return fetch(`${API_BASE_URL}/user`, {
        headers: { authorization: `Bearer ${accessToken}` },
    })
        .then((res) => res.json())
        .then((res) => ({ ...res, accessToken }))
        .catch((e) => {
            console.warn(e);
        });
}

/**
 * Handles the refresh token process for obtaining a new access token.
 * @param {string} token - The refresh token.
 */
export async function handleRefreshToken(token: string) {
    try {
        const parsed: { token: string; expires: number } = JSON.parse(token);

        const res: OAuthRes = await fetch(`${OAUTH_URL}/token`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                client_id: OAUTH_CLIENT_ID,
                client_secret: OAUTH_CLIENT_SECRET,
                refresh_token: parsed.token,
            }),
        })
            .then((res) => {
                if (!res.ok) {
                    throw res.statusText;
                }
                return res.json();
            })
            .then((res) => {
                if (!res.access_token) {
                    throw new Error("Refresh token failed: missing access_token");
                }
                return res;
            });

        if (!res) {
            return;
        }

        localStorage.setItem(
            'refresh_token',
            JSON.stringify({
                token: res.refresh_token,
                expires: parsed.expires,
            }),
        );

        return res.access_token;
    } catch (e) {
        console.warn(e);
    }
}