import { getOAuthState, getSession, handleAuthCallback, handleLoginRedirect, handleRefreshToken } from "./auth";

// Get reference to the UI elements.
const loginBtn = document.getElementById("login_btn") as HTMLButtonElement;
const loginMsgWorking = document.getElementById("login_msg_working") as HTMLParagraphElement;
const loginMsgSuccess = document.getElementById("login_msg_success") as HTMLParagraphElement;

// Retrieve OAuth state and code from URL parameters if available.
const state = getOAuthState();
const code = new URLSearchParams(window.location.search).get("code");

// If both state and code are available, handle the authentication callback.
if (state && code) {
    const token = await handleAuthCallback(state, code);
    loginMsgWorking.style.display = "block";
    const session = token ? await getSession(token) : undefined;
    loginMsgWorking.style.display = "none";

    // If session and token are available, set access token and update URL.
    if (session && token) {
        localStorage.setItem('access_token', token);
        window.history.replaceState(null, "", `${state.path}${state.query ?? ""}`);
    } else {
        localStorage.removeItem('access_token');
    }
}

// Retrieve refresh token from localStorage if available and attempt token refresh.
const refreshToken = localStorage.getItem('refresh_token');
let token: string | undefined = undefined;

loginMsgWorking.style.display = "block";
if (refreshToken) {
    token = await handleRefreshToken(refreshToken);
}

// Retrieve session information using the obtained token.
const session = token ? await getSession(token) : undefined;
loginMsgWorking.style.display = "none";

// If session and token are available, set access token and show user alert.
if (session && token) {
    localStorage.setItem('access_token', token);
    loginMsgSuccess.style.display = "block";
    alert(`You're now logged in as ${session.name}`);
} else {
    localStorage.removeItem('access_token');
    loginBtn.style.display = "block";
}

// Event listener for login button click, initiates login redirection.
loginBtn.onclick = async () => {
    await handleLoginRedirect()
}
