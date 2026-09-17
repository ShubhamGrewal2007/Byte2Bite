// ============================================================
// Byte2Bite — Minimal auth overlay
// Shown ONLY when there is no valid session.
// Uses existing CSS variables. Does NOT modify Dashboard.css.
//
// Registration contract (verified against backend/auth/router.py):
//   POST /api/auth/register
//     { name, email, password, role, organization_name?, organization_type? }
//   - We NEVER send organization_id from the frontend.
//   - The backend creates the org if needed and returns the real id.
//   - ADMIN is not offered (backend rejects it too).
// ============================================================
(function () {
    'use strict';
    const API = window.Byte2BiteAPI;
    let mode = 'login';

    function injectStyles() {
        if (document.getElementById('b2b-auth-styles')) return;
        const s = document.createElement('style');
        s.id = 'b2b-auth-styles';
        s.textContent = `
            #b2bAuth{position:fixed;inset:0;z-index:9999;background:var(--beige,#F9F6F0);
                display:none;align-items:center;justify-content:center;font-family:var(--font,Inter,sans-serif);}
            #b2bAuth.open{display:flex;}
            #b2bAuth .card{background:var(--white,#fff);border-radius:var(--radius-lg,20px);
                box-shadow:var(--shadow-md,0 8px 24px rgba(0,0,0,.06));padding:32px;
                width:100%;max-width:380px;}
            #b2bAuth h2{color:var(--forest-deep,#2C452D);font-size:1.4rem;margin-bottom:6px;}
            #b2bAuth p.sub{color:var(--charcoal-soft,#5E5E5E);font-size:.85rem;margin-bottom:22px;}
            #b2bAuth label{display:block;font-size:.75rem;font-weight:600;
                color:var(--charcoal-soft,#5E5E5E);text-transform:uppercase;
                letter-spacing:.03em;margin-bottom:4px;margin-top:12px;}
            #b2bAuth input,#b2bAuth select{width:100%;padding:10px 12px;
                border:1px solid rgba(0,0,0,.08);border-radius:var(--radius-sm,12px);
                background:var(--beige,#F9F6F0);font-family:inherit;font-size:.9rem;
                color:var(--charcoal,#2E2E2E);}
            #b2bAuth input:focus,#b2bAuth select:focus{outline:none;border-color:var(--sage,#7F9F80);}
            #b2bAuth button.primary{width:100%;margin-top:20px;padding:12px;
                background:var(--forest,#3A5E3B);color:var(--white,#fff);border-radius:40px;
                font-weight:600;font-size:.9rem;cursor:pointer;border:none;transition:background .15s;}
            #b2bAuth button.primary:hover{background:var(--forest-deep,#2C452D);}
            #b2bAuth button.primary:disabled{opacity:.6;cursor:wait;}
            #b2bAuth .toggle{text-align:center;margin-top:16px;font-size:.82rem;
                color:var(--charcoal-soft,#5E5E5E);}
            #b2bAuth .toggle a{color:var(--forest,#3A5E3B);font-weight:600;cursor:pointer;}
            #b2bAuth .err{background:var(--warm-orange-soft,#FCE9DB);color:#B14A2A;
                padding:10px 12px;border-radius:var(--radius-sm,12px);
                font-size:.82rem;margin-top:14px;display:none;white-space:pre-wrap;}
            #b2bAuth .err.show{display:block;}
            #b2bAuth .hint{font-size:.72rem;color:var(--charcoal-soft,#5E5E5E);
                margin-top:-4px;margin-bottom:2px;}
        `;
        document.head.appendChild(s);
    }

    function build() {
        if (document.getElementById('b2bAuth')) return;
        const div = document.createElement('div');
        div.id = 'b2bAuth';
        div.innerHTML = `
            <div class="card">
                <h2 id="b2bTitle">Sign in</h2>
                <p class="sub" id="b2bSubtitle">Byte2Bite</p>
                <div id="b2bError" class="err"></div>

                <div id="b2bRegFields" style="display:none;">
                    <label for="b2bName">Name</label>
                    <input id="b2bName" type="text" autocomplete="name" />

                    <label for="b2bRole">Role</label>
                    <select id="b2bRole">
                        <option value="KITCHEN">KITCHEN</option>
                        <option value="NGO">NGO</option>
                        <option value="DISTRIBUTOR">DISTRIBUTOR</option>
                    </select>

                    <label for="b2bOrgName">Organization name (optional)</label>
                    <input id="b2bOrgName" type="text"
                           placeholder="e.g. Central Kitchen" />
                    <div class="hint">
                        Leave blank only if your role doesn't belong to an organization.
                    </div>
                </div>

                <label for="b2bEmail">Email</label>
                <input id="b2bEmail" type="email" autocomplete="email" />
                <label for="b2bPassword">Password</label>
                <input id="b2bPassword" type="password" autocomplete="current-password" />

                <button class="primary" id="b2bSubmit">Sign in</button>
                <div class="toggle">
                    <span id="b2bToggleText">No account?</span>
                    <a id="b2bToggle">Register</a>
                </div>
            </div>`;
        document.body.appendChild(div);

        document.getElementById('b2bToggle').addEventListener('click', () =>
            setMode(mode === 'login' ? 'register' : 'login'));
        document.getElementById('b2bSubmit').addEventListener('click', submit);
        document.getElementById('b2bPassword').addEventListener('keydown', e => {
            if (e.key === 'Enter') submit();
        });
    }

    function setMode(next) {
        mode = next;
        const r = mode === 'register';
        document.getElementById('b2bTitle').textContent    = r ? 'Create account' : 'Sign in';
        document.getElementById('b2bSubtitle').textContent = r ? 'Create a Byte2Bite account.' : 'Byte2Bite';
        document.getElementById('b2bRegFields').style.display = r ? 'block' : 'none';
        document.getElementById('b2bSubmit').textContent   = r ? 'Register' : 'Sign in';
        document.getElementById('b2bToggleText').textContent = r ? 'Already have an account?' : 'No account?';
        document.getElementById('b2bToggle').textContent   = r ? 'Sign in' : 'Register';
        hideError();
    }

    const showError = (m) => {
        const e = document.getElementById('b2bError');
        e.textContent = m;
        e.classList.add('show');
    };
    const hideError = () => document.getElementById('b2bError').classList.remove('show');

    const open  = () => { document.getElementById('b2bAuth').classList.add('open');
                          document.getElementById('b2bEmail').focus(); };
    const close = () => document.getElementById('b2bAuth').classList.remove('open');

    async function submit() {
        const btn = document.getElementById('b2bSubmit');
        const email = document.getElementById('b2bEmail').value.trim();
        const password = document.getElementById('b2bPassword').value;
        hideError();

        if (!email || !password) { showError('Email and password are required.'); return; }
        if (mode === 'register' && password.length < 8) {
            showError('Password must be at least 8 characters.'); return;
        }

        btn.disabled = true;
        btn.textContent = mode === 'register' ? 'Registering…' : 'Signing in…';

        try {
            if (mode === 'register') {
                // Build the exact payload the backend expects.
                // We NEVER send organization_id. Only organization_name.
                const payload = {
                    name: document.getElementById('b2bName').value.trim() || 'User',
                    email,
                    password,
                    role: document.getElementById('b2bRole').value,
                };
                const orgName = document.getElementById('b2bOrgName').value.trim();
                if (orgName) payload.organization_name = orgName;

                await API.register(payload);
                // Backend returns 201 { message, user }. We don't need the
                // returned user here — the login below is the source of truth.
            }

            // Login to obtain the JWT and the canonical user object.
            const res = await API.login({ email, password });
            if (!res || !res.access_token) {
                throw new Error('Login response missing access_token. Check backend contract.');
            }
            API.setToken(res.access_token);
            if (res.user) API.setUser(res.user);

            // Refresh user via /me (canonical, same shape as login.user).
            const me = await API.me();
            API.setUser(me);

            close();
            window.dispatchEvent(new CustomEvent('byte2bite:authenticated', { detail: me }));
        } catch (err) {
            // err.message is the backend's `detail` for HTTP errors,
            // or a genuine "Cannot reach backend..." string for network failures.
            showError(err.message || 'Authentication failed');
        } finally {
            btn.disabled = false;
            btn.textContent = mode === 'register' ? 'Register' : 'Sign in';
        }
    }

    function init() {
        injectStyles();
        build();
        window.addEventListener('byte2bite:auth-required', open);
        if (!API.getToken()) open();
    }

    window.Byte2BiteAuth = { open, close, init };
})();