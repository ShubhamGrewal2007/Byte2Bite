// ============================================================
// Byte2Bite — API client (vanilla JS, no build step)
// Centralizes: base URL, JWT, JSON, errors, 401 handling.
//
// Task 2D / registration-fix:
//   * HTTP errors (4xx/5xx with a JSON body) are NEVER reported as
//     "network error". The backend's `detail` string is surfaced verbatim.
//   * "Network error" is ONLY emitted when fetch() itself rejects
//     (DNS failure, connection refused, CORS preflight failure).
// ============================================================
(function () {
    'use strict';
    const cfg = window.BYTE2BITE_CONFIG;

    // ---- token / user storage ----
    const getToken = () => localStorage.getItem(cfg.TOKEN_STORAGE_KEY);
    const setToken = (t) => t
        ? localStorage.setItem(cfg.TOKEN_STORAGE_KEY, t)
        : localStorage.removeItem(cfg.TOKEN_STORAGE_KEY);
    const getUser = () => {
        try {
            const r = localStorage.getItem(cfg.USER_STORAGE_KEY);
            return r ? JSON.parse(r) : null;
        } catch { return null; }
    };
    const setUser = (u) => u
        ? localStorage.setItem(cfg.USER_STORAGE_KEY, JSON.stringify(u))
        : localStorage.removeItem(cfg.USER_STORAGE_KEY);

    // ---- error type ----
    class ApiError extends Error {
        constructor(message, { status = 0, body = null, kind = 'http' } = {}) {
            super(message);
            this.name = 'ApiError';
            this.status = status;
            this.body = body;
            this.kind = kind; // 'http' | 'network' | 'auth'
        }
    }

    // ---- core request ----
    async function request(path, { method = 'GET', body = null, auth = true } = {}) {
        const headers = { 'Accept': 'application/json' };
        if (body !== null) headers['Content-Type'] = 'application/json';
        if (auth) {
            const t = getToken();
            if (t) headers['Authorization'] = `Bearer ${t}`;
        }

        let res;
        try {
            res = await fetch(cfg.API_BASE_URL + path, {
                method,
                headers,
                body: body === null ? undefined : JSON.stringify(body),
            });
        } catch (netErr) {
            // fetch() rejecting means the browser could not reach the server
            // at all (connection refused, DNS fail, CORS preflight fail).
            // This is the ONLY place a "network error" is emitted.
            throw new ApiError(
                'Cannot reach backend. Is the API running at ' + cfg.API_BASE_URL + '?',
                { kind: 'network' }
            );
        }

        // Read body — outside any try/catch, so a parsing failure never
        // masquerades as a network failure.
        const text = await res.text();
        let data = null;
        if (text) {
            try { data = JSON.parse(text); }
            catch { data = { raw: text }; }
        }

        if (!res.ok) {
            // Prefer FastAPI's `detail`. Fall back to `message`, then HTTP code.
            let detail = null;
            if (data && typeof data === 'object') {
                if (typeof data.detail === 'string') detail = data.detail;
                else if (Array.isArray(data.detail) && data.detail.length) {
                    // FastAPI validation error shape: [{loc, msg, type}, ...]
                    detail = data.detail
                        .map(e => (e && e.msg) ? e.msg : JSON.stringify(e))
                        .join('; ');
                } else if (typeof data.message === 'string') {
                    detail = data.message;
                }
            }
            if (!detail) detail = `HTTP ${res.status}`;

            const kind = res.status === 401 ? 'auth' : 'http';
            throw new ApiError(detail, { status: res.status, body: data, kind });
        }
        return data;
    }

    // ---- broadcast 401 so auth overlay can re-open ----
    function handleAuthFailure() {
        setToken(null);
        setUser(null);
        window.dispatchEvent(new CustomEvent('byte2bite:auth-required'));
    }

    // ---- public API ----
    window.Byte2BiteAPI = {
        // auth
        register: (payload) => request('/api/auth/register', { method: 'POST', body: payload, auth: false }),
        login:    (payload) => request('/api/auth/login',    { method: 'POST', body: payload, auth: false }),
        me:       ()        => request('/api/auth/me'),
        logout:   ()        => request('/api/auth/logout', { method: 'POST' }).catch(() => null),

        // business
        dashboard:      ()        => request('/api/dashboard'),
        organizations:  (qs = '') => request('/api/organizations' + qs),
        food:           (qs = '') => request('/api/food' + qs),
        inventory:      (qs = '') => request('/api/inventory' + qs),
        waste:          (qs = '') => request('/api/waste' + qs),
        surplus:        (qs = '') => request('/api/surplus' + qs),
        redistribution: (qs = '') => request('/api/redistribution' + qs),

        // session helpers
        getToken, setToken, getUser, setUser,

        // errors
        ApiError, handleAuthFailure,
    };
})();