import { OAuthState } from "./types";

/**
 * Generates a random string of specified length.
 * @returns {string} The generated random string.
 */
function generateRandomString(): string {
    const array = new Uint32Array(56 / 2);
    window.crypto.getRandomValues(array);
    return Array.from(array, (num) => ("0" + num.toString(16)).substr(-2)).join("");
}

/**
 * Calculates the SHA-256 hash of the input string.
 * @param {string} plain - The input string to be hashed.
 * @returns {Promise<ArrayBuffer>} A promise that resolves with the hashed value.
 */
export function sha256(plain: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest("SHA-256", data);
}

/**
 * Encodes a buffer into a base64url string.
 * @param {ArrayBuffer} buffer - The buffer to be encoded.
 * @returns {string} The base64url encoded string.
 */
export function base64UrlEncode(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    let str = "";
    for (let i = 0; i < len; i++) {
        str += String.fromCharCode(bytes[i]);
    }
    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Generates a code verifier and its challenge for OAuth 2.0 PKCE.
 * @returns {Promise<[verifier: string, challenge: string]>} A promise that resolves with the generated verifier and challenge.
 */
export async function generateCodeChallenge(): Promise<[verifier: string, challenge: string]> {
    const verifier = generateRandomString();
    const hashed = await sha256(verifier);
    return [verifier, base64UrlEncode(hashed)];
}

/**
 * Creates an OAuth state string and stores it in sessionStorage.
 * @param {OAuthState} state - The OAuth state object to be stored.
 * @returns {string} The generated OAuth state string.
 */
export function createOAuthStateString(state: OAuthState): string {
    const id = window.crypto.randomUUID();
    const stateStr = JSON.stringify(state);
    sessionStorage.setItem(id, stateStr);
    return id;
}
