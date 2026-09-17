/* Byte2Bite — Sidebar + account behavior for the Plan page.
 * Mirrors the sidebar-related logic from Dashboard.js so the Plan page
 * has identical collapse/mobile/nav behavior without importing Dashboard.js,
 * and adds the same single-dropdown kitchen/profile component used on
 * Dashboard so both pages share one implementation pattern.
 *
 * Safe to reuse on any page that renders the same sidebar markup
 * and the same kitchen/profile control markup.
 */
(function () {
    "use strict";

    const sidebar      = document.getElementById("sidebar");
    const menuToggle   = document.getElementById("menuToggle");
    const overlay      = document.getElementById("overlay");
    const collapseBtn  = document.getElementById("collapseBtn");
    const collapseIcon = document.getElementById("collapseIcon");
    const collapseText = document.getElementById("collapseText");

    if (!sidebar) return;

    // -------- Collapse toggle (desktop only, button hidden < 901px) --------
    if (collapseBtn) {
        collapseBtn.addEventListener("click", function () {
            sidebar.classList.toggle("collapsed");
            const isCollapsed = sidebar.classList.contains("collapsed");
            if (collapseIcon) collapseIcon.className = isCollapsed
                ? "fas fa-chevron-right"
                : "fas fa-chevron-left";
            if (collapseText) collapseText.textContent = isCollapsed ? "Expand" : "Collapse";
        });
    }

    // -------- Mobile off-canvas --------
    if (menuToggle) {
        menuToggle.addEventListener("click", function () {
            sidebar.classList.add("mobile-open");
            if (overlay) overlay.classList.add("active");
        });
    }
    if (overlay) {
        overlay.addEventListener("click", function () {
            sidebar.classList.remove("mobile-open");
            overlay.classList.remove("active");
        });
    }

    // -------- Nav items: close mobile drawer; do NOT override active --------
    document.querySelectorAll(".nav-item").forEach(function (item) {
        item.addEventListener("click", function () {
            if (window.innerWidth <= 900) {
                sidebar.classList.remove("mobile-open");
                if (overlay) overlay.classList.remove("active");
            }
            // Do not remove/add .active here: on the Plan page, "Plan" must
            // stay active, and placeholder links must not steal its state.
        });
    });

    // -------- Escape closes mobile drawer (and the dropdown, handled below) --------
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            sidebar.classList.remove("mobile-open");
            if (overlay) overlay.classList.remove("active");
        }
    });

    // ============================================================
    // ACCOUNT IDENTITY
    // Reuses the same shared auth layer Dashboard uses. No second
    // identity is hardcoded. If the auth layer is unavailable or has
    // not resolved yet, falls back to the same defaults Dashboard
    // uses ('Kitchen 01' / 'Admin').
    // ============================================================
    function readIdentity() {
        const API = window.Byte2BiteAPI;
        let me = null;
        if (API && typeof API.getUser === "function") {
            try { me = API.getUser(); } catch (_) { me = null; }
        }
        const name = (me && me.name) ? me.name : "Kitchen 01";
        const role = (me && me.role)
            ? me.role.charAt(0).toUpperCase() + me.role.slice(1).toLowerCase()
            : "Admin";
        return { name: name, role: role };
    }

    function renderPlanIdentity() {
        const { name, role } = readIdentity();

        // Sidebar footer
        const ki = document.querySelector(".kitchen-badge .kitchen-info");
        if (ki) ki.textContent = name;

        const at = document.querySelector(".admin-profile .admin-text");
        if (at) at.textContent = role;

        const av = document.querySelector(".admin-profile .avatar");
        if (av) {
            const initials = name.split(/\s+/).map(function (s) { return s[0]; })
                .filter(Boolean).slice(0, 2).join("").toUpperCase();
            av.textContent = initials || "U";
        }

        // Top-right chip
        const chip = document.querySelector(".kitchen-control span");
        if (chip) chip.textContent = name;

        // Dropdown header
        const ddName = document.querySelector("#kitchenDropdown .kitchen-name");
        if (ddName) ddName.textContent = name;
        const ddRole = document.querySelector("#kitchenDropdown .kitchen-role");
        if (ddRole) ddRole.textContent = role;
    }

    // Initial render (uses whatever is available now).
    renderPlanIdentity();

    // Re-render when the auth layer resolves. Same event Dashboard listens to.
    window.addEventListener("byte2bite:authenticated", function () {
        renderPlanIdentity();
    });

    // ============================================================
    // KITCHEN / PROFILE DROPDOWN
    // ONE dropdown component (#kitchenDropdown), TWO triggers:
    //   - #kitchenControl          (top-right, in #topKitchenWrap)
    //   - #sidebarKitchenControl   (sidebar bottom, in #sidebarKitchenWrap)
    //
    // On open, #kitchenDropdown is teleported into the wrapper of the
    // trigger that opened it. On close, it returns to the top-right
    // wrapper. There is exactly ONE outside-click handler and ONE
    // Escape handler for this dropdown, both on document.
    // ============================================================
    (function initKitchenDropdown() {
        const dropdown = document.getElementById("kitchenDropdown");
        const topWrap = document.getElementById("topKitchenWrap");
        const sidebarWrap = document.getElementById("sidebarKitchenWrap");
        const topTrigger = document.getElementById("kitchenControl");
        const sidebarTrigger = document.getElementById("sidebarKitchenControl");

        if (!dropdown || !topWrap || !sidebarWrap || !topTrigger || !sidebarTrigger) {
            return;
        }

        const profileBtn = document.getElementById("kitchenProfileBtn");
        const signOutBtn = document.getElementById("kitchenSignOutBtn");

        let activeTrigger = null;

        function placeIn(wrapper, trigger) {
            if (dropdown.parentElement !== wrapper) {
                wrapper.appendChild(dropdown);
            }
            const isSidebar = wrapper === sidebarWrap;
            dropdown.classList.toggle("kitchen-dropdown--sidebar", isSidebar);

            topTrigger.setAttribute("aria-expanded", String(trigger === topTrigger));
            sidebarTrigger.setAttribute("aria-expanded", String(trigger === sidebarTrigger));

            activeTrigger = trigger;
        }

        function openFrom(trigger) {
            const wrapper = trigger === sidebarTrigger ? sidebarWrap : topWrap;
            placeIn(wrapper, trigger);
            dropdown.classList.add("open");
        }

        function close() {
            dropdown.classList.remove("open");
            topTrigger.setAttribute("aria-expanded", "false");
            sidebarTrigger.setAttribute("aria-expanded", "false");

            if (dropdown.parentElement !== topWrap) {
                topWrap.appendChild(dropdown);
            }
            dropdown.classList.remove("kitchen-dropdown--sidebar");
            activeTrigger = null;
        }

        function toggleFrom(trigger) {
            if (dropdown.classList.contains("open") && activeTrigger === trigger) {
                close();
            } else {
                openFrom(trigger);
            }
        }

        // Two button listeners, one shared handler — not a duplicate handler.
        topTrigger.addEventListener("click", function (e) {
            e.stopPropagation();
            toggleFrom(topTrigger);
        });

        sidebarTrigger.addEventListener("click", function (e) {
            e.stopPropagation();
            toggleFrom(sidebarTrigger);
        });

        // ONE outside-click handler.
        document.addEventListener("click", function (e) {
            if (!dropdown.classList.contains("open")) return;
            if (dropdown.contains(e.target)) return;
            if (topTrigger.contains(e.target)) return;
            if (sidebarTrigger.contains(e.target)) return;
            close();
        });

        // ONE Escape handler.
        document.addEventListener("keydown", function (e) {
            if (e.key !== "Escape") return;
            if (!dropdown.classList.contains("open")) return;
            close();
            if (activeTrigger) activeTrigger.focus();
        });

        // Settings is a real <a href> — nothing to wire.
        // Profile — functional UI item, inert by design.
        if (profileBtn) {
            profileBtn.addEventListener("click", function () {
                close();
            });
        }

        // Sign out — only call logout if the auth layer exposes it.
        // No alert/confirm, no fake auth, no data deletion.
        if (signOutBtn) {
            signOutBtn.addEventListener("click", function () {
                const auth = window.Byte2BiteAuth;
                if (auth && typeof auth.logout === "function") {
                    auth.logout();
                }
                close();
            });
        }
    })();
})();
