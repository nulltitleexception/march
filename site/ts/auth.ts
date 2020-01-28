export function setCookie(name: string, value: string, days: number) {
    let expires = '';
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + (value || '') + expires + '; path=/';
}
export function getCookie(name: string) {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let c of ca) {
        while (c.charAt(0) === ' ') {
            c = c.substring(1, c.length);
        }
        if (c.indexOf(nameEQ) === 0) {
            return c.substring(nameEQ.length, c.length);
        }
    }
    return null;
}
export function deleteCookie(name: string) {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}
export function cacheCredentials(creds: Credentials) {
    setCookie('user', creds.user || '', 3);
    setCookie('auth', creds.auth || '', 3);
}
export function clearCredentials() {
    deleteCookie('user');
    deleteCookie('auth');
}
export interface Credentials {
    user?: string;
    auth?: string;
}
export function loadCredentials() {
    const creds: Credentials = {};
    const user = getCookie('user');
    const auth = getCookie('auth');
    if (user !== null) {
        creds.user = user;
    }
    if (auth !== null) {
        creds.auth = auth;
    }
    return creds;
}
