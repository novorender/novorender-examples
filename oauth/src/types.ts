export type OAuthRes = {
    access_token: string;
    expires_in: number;
    refresh_token: string;
    refresh_token_expires_in: number;
    token_type: string;
};

export type OAuthState = {
    service: "self";
    path: string;
    query?: string;
};

export type Session = {
    login: string;
    name: string;
    roles: string[];
    accessToken: string;
};