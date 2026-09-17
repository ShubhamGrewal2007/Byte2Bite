// ============================================================
// Byte2Bite — Frontend configuration
// Single source of truth for the backend origin.
// ============================================================
window.BYTE2BITE_CONFIG = {
    // No trailing slash. Backend runs on 8000 (see main.py lifespan banner).
    API_BASE_URL: (function () {
        const h = window.location.hostname;
        if (h === 'localhost' || h === '127.0.0.1') return 'http://localhost:8000';
        return ''; // same-origin fallback
    })(),
    TOKEN_STORAGE_KEY: 'byte2bite.access_token',
    USER_STORAGE_KEY:  'byte2bite.user',
};
