/* ============================================================================
       MODULE 1 — DATA (unchanged)
       ============================================================================ */
const Byte2BiteData = (function () {
    const surplusSources = [
        { id: "src_hafed_mega_food_park", name: "HAFED Mega Food Park, IMT Rohtak", category: "food_park", latitude: 28.8791, longitude: 76.6252, surplusMeals: 240, foodType: "packaged_grains", priority: "high" },
        { id: "src_energy_aahar", name: "Energy Aahar Pvt. Ltd., Rohtak Food Park", category: "food_processing", latitude: 28.8834, longitude: 76.6198, surplusMeals: 180, foodType: "packaged_snacks", priority: "medium" },
        { id: "src_saba_dairy", name: "Saba Dairy Rohtak Plant", category: "dairy", latitude: 28.8912, longitude: 76.5987, surplusMeals: 150, foodType: "dairy_perishable", priority: "high" },
        { id: "src_sun_gold_foods", name: "Sun Gold Foods Industries, HSIIDC Industrial Area", category: "food_processing", latitude: 28.8867, longitude: 76.6121, surplusMeals: 200, foodType: "packaged_grains", priority: "medium" },
        { id: "src_sg_foods", name: "SG Foods Industries, HSIIDC Industrial Area", category: "food_processing", latitude: 28.8881, longitude: 76.6105, surplusMeals: 175, foodType: "packaged_snacks", priority: "medium" },
        { id: "src_ss_pure_foods", name: "SS Pure Foods / Fabzia India, Kharawar", category: "food_processing", latitude: 28.8598, longitude: 76.6642, surplusMeals: 130, foodType: "packaged_grains", priority: "low" },
        { id: "src_vedaking_foods", name: "Vedaking Foods, Gohana Road", category: "food_processing", latitude: 28.9124, longitude: 76.6021, surplusMeals: 160, foodType: "packaged_snacks", priority: "medium" },
        { id: "src_enrich_agro", name: "Enrich Agro Food Products, Sector 31B IMT", category: "food_processing", latitude: 28.8745, longitude: 76.6310, surplusMeals: 210, foodType: "packaged_grains", priority: "high" },
        { id: "src_mdu_hostels", name: "MDU Hostel Kitchens and Canteens", category: "institutional_kitchen", latitude: 28.8839, longitude: 76.6188, surplusMeals: 320, foodType: "cooked_meals", priority: "high" },
        { id: "src_iim_rohtak_mess", name: "IIM Rohtak Hostel Mess", category: "institutional_kitchen", latitude: 28.9437, longitude: 76.5792, surplusMeals: 260, foodType: "cooked_meals", priority: "high" },
        { id: "src_pgims", name: "Pt. B.D. Sharma PGIMS Food-Service Operations", category: "institutional_kitchen", latitude: 28.8790, longitude: 76.6070, surplusMeals: 400, foodType: "cooked_meals", priority: "high" },
        { id: "src_gitot_hostel", name: "GITOT Rohtak Hostel Mess", category: "institutional_kitchen", latitude: 28.8910, longitude: 76.6230, surplusMeals: 140, foodType: "cooked_meals", priority: "medium" },
        { id: "src_msme_tech_centre", name: "MSME Technology Centre Rohtak Canteen / Hostel", category: "institutional_kitchen", latitude: 28.8742, longitude: 76.6300, surplusMeals: 120, foodType: "cooked_meals", priority: "medium" },
        { id: "src_chinkara_canteen", name: "Chinkara Canteen, Model Town", category: "commercial_canteen", latitude: 28.8924, longitude: 76.6120, surplusMeals: 90, foodType: "cooked_meals", priority: "low" },
        { id: "src_ncc_csd_canteen", name: "NCC Group HQ / CSD Canteen, Sector 4", category: "commercial_canteen", latitude: 28.8878, longitude: 76.5998, surplusMeals: 80, foodType: "packaged_snacks", priority: "low" },
        { id: "src_satnam_canteen", name: "Satnam Canteen, MDU Campus", category: "commercial_canteen", latitude: 28.8845, longitude: 76.6175, surplusMeals: 70, foodType: "cooked_meals", priority: "medium" },
        { id: "src_nehras_canteen", name: "Nehra's Canteen, MDU Campus", category: "commercial_canteen", latitude: 28.8851, longitude: 76.6182, surplusMeals: 65, foodType: "cooked_meals", priority: "medium" },
        { id: "src_joshi_ki_canteen", name: "Joshi Ki Canteen, MDU Campus", category: "commercial_canteen", latitude: 28.8848, longitude: 76.6190, surplusMeals: 60, foodType: "cooked_meals", priority: "low" }
    ];
    const redistributionRecipients = [
        { id: "rec_feeding_india", name: "Feeding India", organizationType: "ngo", latitude: 28.8975, longitude: 76.6075, capacityMeals: 350, acceptedFoodTypes: ["cooked_meals", "packaged_grains", "packaged_snacks"], priority: "high" },
        { id: "rec_robin_hood_army", name: "Robin Hood Army", organizationType: "volunteer_network", latitude: 28.9012, longitude: 76.6198, capacityMeals: 250, acceptedFoodTypes: ["cooked_meals", "packaged_snacks"], priority: "high" },
        { id: "rec_india_food_banking_network", name: "India Food Banking Network", organizationType: "food_bank", latitude: 28.8898, longitude: 76.6302, capacityMeals: 500, acceptedFoodTypes: ["packaged_grains", "dairy_perishable", "packaged_snacks"], priority: "high" },
        { id: "rec_no_food_waste", name: "No Food Waste", organizationType: "ngo", latitude: 28.8770, longitude: 76.6150, capacityMeals: 200, acceptedFoodTypes: ["cooked_meals"], priority: "medium" },
        { id: "rec_roti_bank", name: "Roti Bank", organizationType: "ngo", latitude: 28.9105, longitude: 76.5985, capacityMeals: 300, acceptedFoodTypes: ["cooked_meals", "packaged_grains"], priority: "high" }
    ];
    return {
        surplusSources, redistributionRecipients,
        getSources: () => surplusSources,
        getRecipients: () => redistributionRecipients,
        getById: (id) =>
            surplusSources.find(s => s.id === id) ||
            redistributionRecipients.find(r => r.id === id) || null
    };
})();

/* ============================================================================
   MODULE 2 — MATCHING ENGINE
   Shared scoring constants. Both source→recipient and recipient→source
   ranking use the same food-family rules and priority map, but each
   direction has its own matching function (see Module 4).
   ============================================================================ */
const Byte2BiteMatcher = (function () {
    const CONFIG = {
        weights: { distance: 0.40, capacity: 0.25, compatibility: 0.20, priority: 0.15 },
        maxDistanceKm: 25,
        priorityScore: { high: 1.0, medium: 0.6, low: 0.3 },
        foodFamilies: {
            cooked_meals: ["cooked_meals"],
            packaged_grains: ["packaged_grains", "packaged_snacks"],
            packaged_snacks: ["packaged_snacks", "packaged_grains"],
            dairy_perishable: ["dairy_perishable"]
        },
        familyPartialScore: 0.4,
        excludeIncompatible: true,
        minScoreThreshold: 0,
        roundDistanceTo: 2
    };

    function haversineKm(a, b) {
        if (!a || !b) return Infinity;
        const R = 6371;
        const toRad = (d) => (d * Math.PI) / 180;
        const dLat = toRad(b.latitude - a.latitude);
        const dLon = toRad(b.longitude - a.longitude);
        const lat1 = toRad(a.latitude);
        const lat2 = toRad(b.latitude);
        const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(h));
    }

    // Does a source's foodType fit what a recipient accepts?
    function compatibilityScore(sourceFoodType, acceptedFoodTypes) {
        if (!sourceFoodType) return 0;
        const accepted = Array.isArray(acceptedFoodTypes) ? acceptedFoodTypes : [];
        if (accepted.includes(sourceFoodType)) return 1.0;
        const family = CONFIG.foodFamilies[sourceFoodType] || [sourceFoodType];
        if (accepted.some(t => family.includes(t))) return CONFIG.familyPartialScore;
        return 0;
    }

    function distanceScoreFromKm(km) {
        if (!isFinite(km)) return 0;
        const c = Math.max(0, Math.min(km, CONFIG.maxDistanceKm));
        return 1 - c / CONFIG.maxDistanceKm;
    }

    function capacityScore(surplus, capacity) {
        if (!capacity || capacity <= 0) return 0;
        return Math.max(0, Math.min(1, Math.min(surplus, capacity) / surplus));
    }

    function priorityScore(p) { return CONFIG.priorityScore[p] ?? 0; }

    return {
        CONFIG,
        haversineKm,
        compatibilityScore,
        distanceScoreFromKm,
        capacityScore,
        priorityScore
    };
})();

/* ============================================================================
   MODULE 3 — ROUTING (OSRM wrapper with cache)
   ============================================================================ */
const Byte2BiteRouting = (function () {
    const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";
    const cache = new Map();
    let consecutiveFailures = 0;
    const FAILURE_THRESHOLD = 3;

    // Direction matters for cache key: a→b and b→a may differ on one-way roads.
    function cacheKey(a, b) {
        return `${a.latitude.toFixed(5)},${a.longitude.toFixed(5)}|${b.latitude.toFixed(5)},${b.longitude.toFixed(5)}`;
    }

    function isRoutingHealthy() {
        return consecutiveFailures < FAILURE_THRESHOLD;
    }

    async function getRoadRoute(origin, destination) {
        const key = cacheKey(origin, destination);
        if (cache.has(key)) return cache.get(key);

        const url = `${OSRM_BASE}/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}` +
            `?overview=full&geometries=geojson&steps=false`;

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
            const data = await res.json();
            if (!data.routes || !data.routes[0]) throw new Error("No route in OSRM response");

            const r = data.routes[0];
            const result = {
                distanceKm: Number((r.distance / 1000).toFixed(2)),
                durationMinutes: Math.round(r.duration / 60),
                geometry: r.geometry.coordinates.map(c => [c[1], c[0]])
            };
            cache.set(key, result);
            consecutiveFailures = 0;
            return result;
        } catch (err) {
            consecutiveFailures++;
            console.warn("Byte2BiteRouting: OSRM failed for", key, err.message);
            return null;
        }
    }

    return {
        getRoadRoute,
        isRoutingHealthy,
        getCacheSize: () => cache.size,
        clearCache: () => cache.clear()
    };
})();

/* ============================================================================
   MODULE 4 — DIRECTION-AWARE ROAD MATCHING
   Two separate functions, not one symmetric one. Each direction has its
   own filtering, its own capacity semantics, and its own allocation pass.
   ============================================================================ */
const Byte2BiteRoadMatcher = (function () {

    // -------------------------------------------------------------------------
    // Direction A: SOURCE → RECIPIENTS
    //   "We have surplus — who can take it?"
    //   Source surplus caps total allocation from this source.
    // -------------------------------------------------------------------------
    async function rankRecipientsForSourceByRoad(source, recipients, remainingCapacity) {
        if (!source || !Array.isArray(recipients)) {
            return { matches: [], routingOk: false, routingHealthy: true };
        }

        const capMap = remainingCapacity instanceof Map ? remainingCapacity : null;

        // Filter incompatible + zero-capacity recipients
        const candidates = recipients.filter(r => {
            const cap = capMap ? (capMap.get(r.id) ?? r.capacityMeals) : r.capacityMeals;
            if (cap <= 0) return false;
            const compat = Byte2BiteMatcher.compatibilityScore(source.foodType, r.acceptedFoodTypes);
            if (Byte2BiteMatcher.CONFIG.excludeIncompatible && compat === 0) return false;
            return true;
        });

        // Fetch routes in parallel (source → recipient)
        const routes = await Promise.all(
            candidates.map(r => Byte2BiteRouting.getRoadRoute(source, r))
        );

        const scored = [];
        let routedCount = 0, failedCount = 0;

        candidates.forEach((r, i) => {
            const route = routes[i];
            if (!route) { failedCount++; return; }
            routedCount++;

            const cap = capMap ? (capMap.get(r.id) ?? r.capacityMeals) : r.capacityMeals;
            const compat = Byte2BiteMatcher.compatibilityScore(source.foodType, r.acceptedFoodTypes);

            const dScore = Byte2BiteMatcher.distanceScoreFromKm(route.distanceKm);
            const cScore = Byte2BiteMatcher.capacityScore(source.surplusMeals, cap);
            const pScore = Byte2BiteMatcher.priorityScore(r.priority);

            const w = Byte2BiteMatcher.CONFIG.weights;
            const raw =
                w.distance * dScore +
                w.capacity * cScore +
                w.compatibility * compat +
                w.priority * pScore;

            const score = Math.round(raw * 100);
            if (score < Byte2BiteMatcher.CONFIG.minScoreThreshold) return;

            const hardCap = Math.min(source.surplusMeals, cap);
            const recommended = Math.max(0, Math.round(hardCap * (0.5 + 0.5 * raw)));

            scored.push({
                direction: "source_to_recipient",
                recipientId: r.id,
                recipientName: r.name,
                roadDistanceKm: Number(route.distanceKm.toFixed(2)),
                durationMinutes: route.durationMinutes,
                routeGeometry: route.geometry,
                compatibility: compat,
                availableCapacity: r.capacityMeals,
                score,
                recommendedAllocation: recommended,
                recipientPriority: r.priority
            });
        });

        scored.sort((a, b) => b.score - a.score || a.roadDistanceKm - b.roadDistanceKm);

        // Greedy allocation: total out of this source ≤ its surplus
        let remaining = source.surplusMeals;
        for (const m of scored) {
            const allowed = Math.min(m.recommendedAllocation, remaining);
            m.recommendedAllocation = allowed;
            remaining -= allowed;
            if (remaining <= 0) break;
        }

        return {
            matches: scored,
            routingOk: routedCount > 0,
            routingHealthy: failedCount === 0
        };
    }

    // -------------------------------------------------------------------------
    // Direction B: RECIPIENT → SOURCES
    //   "We need meals — who has surplus for us?"
    //   Recipient capacity caps total allocation into this recipient.
    //   Scoring is from the recipient's perspective: distance (weighted),
    //   how much of the recipient's need a source can cover (capacity),
    //   food compatibility, and source priority.
    // -------------------------------------------------------------------------
    async function rankSourcesForRecipientByRoad(recipient, sources, remainingSource) {
        if (!recipient || !Array.isArray(sources)) {
            return { matches: [], routingOk: false, routingHealthy: true };
        }

        const srcRem = remainingSource instanceof Map ? remainingSource : null;
        const need = recipient.capacityMeals; // recipient's remaining need

        if (need <= 0) {
            return { matches: [], routingOk: true, routingHealthy: true };
        }

        // Filter: source must have surplus > 0 and its foodType must be accepted
        const candidates = sources.filter(s => {
            const rem = srcRem ? (srcRem.get(s.id) ?? s.surplusMeals) : s.surplusMeals;
            if (rem <= 0) return false;
            const compat = Byte2BiteMatcher.compatibilityScore(s.foodType, recipient.acceptedFoodTypes);
            if (Byte2BiteMatcher.CONFIG.excludeIncompatible && compat === 0) return false;
            return true;
        });

        // Fetch routes in parallel (source → recipient — same physical direction,
        // because the recipient is the destination in both cases)
        const routes = await Promise.all(
            candidates.map(s => Byte2BiteRouting.getRoadRoute(s, recipient))
        );

        const scored = [];
        let routedCount = 0, failedCount = 0;

        candidates.forEach((s, i) => {
            const route = routes[i];
            if (!route) { failedCount++; return; }
            routedCount++;

            const srcRemaining = srcRem ? (srcRem.get(s.id) ?? s.surplusMeals) : s.surplusMeals;
            const compat = Byte2BiteMatcher.compatibilityScore(s.foodType, recipient.acceptedFoodTypes);

            const dScore = Byte2BiteMatcher.distanceScoreFromKm(route.distanceKm);
            // Capacity component: how much of the recipient's NEED this source can cover.
            // Note the swap — the "supply" is now the recipient's need, and the "capacity"
            // is the source's remaining surplus.
            const cScore = Byte2BiteMatcher.capacityScore(need, srcRemaining);
            // Priority now uses the SOURCE's priority (the supplier we'd be picking)
            const pScore = Byte2BiteMatcher.priorityScore(s.priority);

            const w = Byte2BiteMatcher.CONFIG.weights;
            const raw =
                w.distance * dScore +
                w.capacity * cScore +
                w.compatibility * compat +
                w.priority * pScore;

            const score = Math.round(raw * 100);
            if (score < Byte2BiteMatcher.CONFIG.minScoreThreshold) return;

            // Allocation per pair: min(source surplus, recipient need), then
            // score-scaled so weaker matches don't get the full amount.
            const hardCap = Math.min(srcRemaining, need);
            const recommended = Math.max(0, Math.round(hardCap * (0.5 + 0.5 * raw)));

            scored.push({
                direction: "recipient_to_source",
                sourceId: s.id,
                sourceName: s.name,
                sourceFoodType: s.foodType,
                sourcePriority: s.priority,
                roadDistanceKm: Number(route.distanceKm.toFixed(2)),
                durationMinutes: route.durationMinutes,
                routeGeometry: route.geometry,
                compatibility: compat,
                availableSurplus: srcRemaining,
                score,
                recommendedAllocation: recommended
            });
        });

        scored.sort((a, b) => b.score - a.score || a.roadDistanceKm - b.roadDistanceKm);

        // Greedy allocation: total INTO this recipient ≤ its remaining need
        let remaining = need;
        for (const m of scored) {
            const allowed = Math.min(m.recommendedAllocation, remaining);
            m.recommendedAllocation = allowed;
            remaining -= allowed;
            if (remaining <= 0) break;
        }

        return {
            matches: scored,
            routingOk: routedCount > 0,
            routingHealthy: failedCount === 0
        };
    }

    return {
        rankRecipientsForSourceByRoad,
        rankSourcesForRecipientByRoad
    };
})();

/* ============================================================================
   MODULE 5 — MARKERS (unchanged visuals)
   ============================================================================ */
const Byte2BiteMarkers = (function () {
    const sourceMarkers = new Map();
    const recipientMarkers = new Map();
    let layerGroup = null;

    const SOURCE_ICON = L.divIcon({
        className: "b2b-marker b2b-marker--source",
        html: `<div class="b2b-pin b2b-pin--source">
      <svg viewBox="0 0 24 24" width="16" height="16"><path fill="#ffffff" d="M11 2v8H9V2H7v8H5V2H3v10a4 4 0 0 0 3 3.87V22h2v-6.13A4 4 0 0 0 11 12V2zm8 0c-1.66 0-3 1.79-3 4v6h2v10h2V2h-1z"/></svg>
    </div>`,
        iconSize: [30, 38], iconAnchor: [15, 38], popupAnchor: [0, -34]
    });
    const RECIPIENT_ICON = L.divIcon({
        className: "b2b-marker b2b-marker--recipient",
        html: `<div class="b2b-pin b2b-pin--recipient">
      <svg viewBox="0 0 24 24" width="16" height="16"><path fill="#ffffff" d="M12 21s-7-4.35-9.5-8.5C.6 9.3 2.2 5.5 5.5 5.5c1.9 0 3.4 1 4.5 2.5 1.1-1.5 2.6-2.5 4.5-2.5 3.3 0 4.9 3.8 3 7C19 16.65 12 21 12 21z"/></svg>
    </div>`,
        iconSize: [30, 38], iconAnchor: [15, 38], popupAnchor: [0, -34]
    });

    function esc(v) {
        if (v == null) return "";
        return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }
    function pretty(v) {
        if (!v) return "";
        return String(v).replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    }
    function buildSourcePopup(s) {
        return `<div class="b2b-popup">
      <h3 class="b2b-popup__title">${esc(s.name)}</h3>
      <dl class="b2b-popup__grid">
        <dt>Category</dt><dd>${esc(pretty(s.category))}</dd>
        <dt>Demo surplus</dt><dd>~${esc(s.surplusMeals)} meals</dd>
        <dt>Food type</dt><dd>${esc(pretty(s.foodType))}</dd>
        <dt>Priority</dt><dd><span class="b2b-tag b2b-tag--${esc(s.priority)}">${esc(pretty(s.priority))}</span></dd>
      </dl>
      <div class="b2b-popup__note">Synthetic demo data</div>
    </div>`;
    }
    function buildRecipientPopup(r) {
        const accepted = (r.acceptedFoodTypes || []).map(pretty).join(", ");
        return `<div class="b2b-popup">
      <h3 class="b2b-popup__title">${esc(r.name)}</h3>
      <dl class="b2b-popup__grid">
        <dt>Type</dt><dd>${esc(pretty(r.organizationType))}</dd>
        <dt>Demo capacity</dt><dd>~${esc(r.capacityMeals)} meals</dd>
        <dt>Accepts</dt><dd>${esc(accepted)}</dd>
        <dt>Priority</dt><dd><span class="b2b-tag b2b-tag--${esc(r.priority)}">${esc(pretty(r.priority))}</span></dd>
      </dl>
      <div class="b2b-popup__note">Synthetic demo location/data</div>
    </div>`;
    }

    function init(map) {
        layerGroup = L.layerGroup().addTo(map);
        Byte2BiteData.getSources().forEach(s => {
            const m = L.marker([s.latitude, s.longitude], {
                icon: SOURCE_ICON, title: s.name, riseOnHover: true, keyboard: true, alt: s.name
            });
            m.bindPopup(buildSourcePopup(s), { maxWidth: 280, minWidth: 200, autoPanPadding: [20, 20] });
            m._b2bType = "surplus_source"; m._b2bId = s.id;
            m.addTo(layerGroup);
            sourceMarkers.set(s.id, m);
        });
        Byte2BiteData.getRecipients().forEach(r => {
            const m = L.marker([r.latitude, r.longitude], {
                icon: RECIPIENT_ICON, title: r.name, riseOnHover: true, keyboard: true, alt: r.name
            });
            m.bindPopup(buildRecipientPopup(r), { maxWidth: 280, minWidth: 200, autoPanPadding: [20, 20] });
            m._b2bType = "recipient"; m._b2bId = r.id;
            m.addTo(layerGroup);
            recipientMarkers.set(r.id, m);
        });
        console.log(`✅ Markers — ${sourceMarkers.size} sources, ${recipientMarkers.size} recipients`);
    }

    return { init, sourceMarkers, recipientMarkers };
})();

/* ============================================================================
   MODULE 6 — MAP
   ============================================================================ */
const map = L.map("map", {
    center: [28.8955, 76.6066],
    zoom: 13, minZoom: 5, maxZoom: 19,
    tap: true, touchZoom: true, dragging: true,
    scrollWheelZoom: true, doubleClickZoom: true,
    boxZoom: true, keyboard: true,
    zoomControl: true, attributionControl: true
});

L.tileLayer("https://a.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    maxZoom: 19, minZoom: 5
}).addTo(map);

window.byte2biteMap = map;

/* ============================================================================
   MODULE 7 — UI
 
   Key design decisions:
   - Single / Multi is an explicit segmented control. Default: Single.
   - Two separate stores:
       state.displayedRoutes  → what's on the map right now
       state.allocationHistory → every allocation ever made this session
     "Clear routes" wipes only the display. "Reset all" wipes both, restores pools.
   - Direction-aware: state.selection.kind is "source" or "recipient".
   ============================================================================ */
const Byte2BiteUI = (function () {
    const state = {
        selection: { kind: null, id: null },   // "source" | "recipient" | null
        sourceRemaining: new Map(),
        recipientRemaining: new Map(),
        matchCache: new Map(),                 // key → { matches, routingHealthy }
        mode: "single",                        // "single" | "multi"
        displayedRoutes: [],                   // [{ polyline, label, allocationRef }]
        allocationHistory: [],                 // [{ direction, sourceId, recipientId, amount, ... }]
        selectedRoute: null,
    };

    const dom = {};
    let toastTimer = null;
    let currentRequestToken = 0;

    // -------------------------------------------------------------------------
    // Small helpers
    // -------------------------------------------------------------------------
    function esc(v) {
        if (v == null) return "";
        return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }
    function pretty(v) {
        if (!v) return "";
        return String(v).replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    }
    function scoreBadgeClass(s) {
        if (s >= 75) return "b2b-score-badge--high";
        if (s >= 50) return "b2b-score-badge--mid";
        return "b2b-score-badge--low";
    }
    function showToast(msg) {
        if (!dom.toast) return;
        dom.toast.textContent = msg;
        dom.toast.hidden = false;
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { dom.toast.hidden = true; }, 2400);
    }

    // -------------------------------------------------------------------------
    // Panel injection
    // -------------------------------------------------------------------------
    function injectPanel() {
        const el = document.createElement("aside");
        el.id = "b2b-panel";
        el.className = "b2b-panel b2b-panel--collapsed";
        el.setAttribute("aria-label", "Byte2Bite redistribution panel");
        el.innerHTML = `
      <header class="b2b-panel__header" id="b2b-panel-header">
        <div>
          <h2 class="b2b-panel__title">🍽️ Byte2Bite</h2>
          <p class="b2b-panel__subtitle">Road-aware surplus redistribution</p>
        </div>
        <div class="b2b-panel__header-actions">
          <div class="b2b-mode-switch" id="b2b-mode-switch"
               role="group" aria-label="Route display mode">
            <span class="b2b-mode-switch__option b2b-mode-switch__option--active"
                  data-mode="single" role="button" tabindex="0">Single</span>
            <span class="b2b-mode-switch__option"
                  data-mode="multi" role="button" tabindex="0">Multi</span>
          </div>
          <div class="b2b-panel__chevron" aria-hidden="true">▲</div>
        </div>
      </header>
      <div class="b2b-panel__body">
        <div class="b2b-source-select" id="b2b-source-select">
          <span class="b2b-source-select__label" id="b2b-select-label">Select a source</span>
          <button type="button" class="b2b-source-select__trigger" id="b2b-source-trigger">
            <span class="b2b-source-select__text" id="b2b-source-text">Click a green or blue pin…</span>
            <span class="b2b-source-select__caret">▼</span>
          </button>
          <div class="b2b-source-select__menu" id="b2b-source-menu" hidden></div>
        </div>
        <div id="b2b-source-card" hidden></div>
        <div id="b2b-results">
          <div class="b2b-idle">
            <div class="b2b-idle__icon">📍</div>
            <p class="b2b-idle__text">
              Click a <strong>green source</strong> pin (surplus) or a
              <strong class="blue">blue recipient</strong> pin (demand)
              to begin.
            </p>
          </div>
        </div>
        <div id="b2b-route-detail" class="b2b-route-detail"></div>
        <div class="b2b-actions">
          <button type="button" class="b2b-btn b2b-btn--ghost" id="b2b-btn-deselect" disabled>Deselect</button>
          <button type="button" class="b2b-btn b2b-btn--ghost" id="b2b-btn-analysis">Run analysis</button>
          <button type="button" class="b2b-btn b2b-btn--ghost" id="b2b-btn-clear-routes" disabled>Clear routes</button>
          <button type="button" class="b2b-btn b2b-btn--ghost" id="b2b-btn-reset">Reset all</button>
        </div>
      </div>
    `;
        // Keep the legacy map controls inside the Network map wrapper.
        // Appending to <body> made the panel overlay the global sidebar.
        const mapHost = document.querySelector(".network-map-wrap") || document.getElementById("map")?.parentElement || document.body;
        mapHost.appendChild(el);

        const toast = document.createElement("div");
        toast.className = "b2b-toast";
        toast.hidden = true;
        document.body.appendChild(toast);
    }

    function cacheDom() {
        dom.panel = document.getElementById("b2b-panel");
        dom.header = document.getElementById("b2b-panel-header");
        dom.modeSwitch = document.getElementById("b2b-mode-switch");
        dom.selectLabel = document.getElementById("b2b-select-label");
        dom.sourceSelect = document.getElementById("b2b-source-select");
        dom.sourceTrigger = document.getElementById("b2b-source-trigger");
        dom.sourceText = document.getElementById("b2b-source-text");
        dom.sourceMenu = document.getElementById("b2b-source-menu");
        dom.sourceCard = document.getElementById("b2b-source-card");
        dom.results = document.getElementById("b2b-results");
        dom.btnClearRoutes = document.getElementById("b2b-btn-clear-routes");
        dom.btnReset = document.getElementById("b2b-btn-reset");
        dom.btnDeselect = document.getElementById("b2b-btn-deselect");
        dom.btnAnalysis = document.getElementById("b2b-btn-analysis");
        dom.routeDetail = document.getElementById("b2b-route-detail");
        dom.toast = document.querySelector(".b2b-toast");
    }

    function seedPools() {
        state.sourceRemaining.clear();
        state.recipientRemaining.clear();
        state.matchCache.clear();
        Byte2BiteData.getSources().forEach(s => state.sourceRemaining.set(s.id, s.surplusMeals));
        Byte2BiteData.getRecipients().forEach(r => state.recipientRemaining.set(r.id, r.capacityMeals));
    }

    // -------------------------------------------------------------------------
    // Panel expand/collapse + dropdown
    // -------------------------------------------------------------------------
    function expandPanel() { dom.panel.classList.remove("b2b-panel--collapsed"); }
    function collapsePanel() { dom.panel.classList.add("b2b-panel--collapsed"); closeSourceMenu(); }
    function togglePanel() {
        if (dom.panel.classList.contains("b2b-panel--collapsed")) expandPanel();
        else collapsePanel();
    }
    function openSourceMenu() {
        dom.sourceMenu.hidden = false;
        dom.sourceTrigger.classList.add("b2b-source-select__trigger--open");
    }
    function closeSourceMenu() {
        dom.sourceMenu.hidden = true;
        dom.sourceTrigger.classList.remove("b2b-source-select__trigger--open");
    }
    function toggleSourceMenu() {
        if (dom.sourceMenu.hidden) openSourceMenu(); else closeSourceMenu();
    }

    // -------------------------------------------------------------------------
    // Mode switch (explicit Single / Multi)
    // -------------------------------------------------------------------------
    function setMode(mode) {
        if (mode !== "single" && mode !== "multi") return;
        state.mode = mode;
        dom.modeSwitch.querySelectorAll(".b2b-mode-switch__option").forEach(el => {
            el.classList.toggle("b2b-mode-switch__option--active", el.dataset.mode === mode);
        });
        showToast(mode === "single"
            ? "Single: new route replaces the displayed one"
            : "Multi: routes accumulate on the map");
    }

    // -------------------------------------------------------------------------
    // Source dropdown (only meaningful when a source is selected)
    // -------------------------------------------------------------------------
    function renderSourceMenu() {
        dom.sourceMenu.innerHTML = "";

        if (state.selection.kind === "recipient") {
            // Show sources as pickable list from the recipient's perspective
            Byte2BiteData.getSources().forEach(s => {
                const remaining = state.sourceRemaining.get(s.id) ?? 0;
                const opt = document.createElement("div");
                opt.className = "b2b-source-option";
                opt.innerHTML = `
          <div class="b2b-source-option__name">${esc(s.name)}</div>
          <div class="b2b-source-option__meta">
            ${remaining} meals · ${esc(pretty(s.foodType))}
            <span class="b2b-tag b2b-tag--${esc(s.priority)}">${esc(pretty(s.priority))}</span>
          </div>
        `;
                opt.addEventListener("click", () => {
                    closeSourceMenu();
                    selectSource(s.id);
                });
                dom.sourceMenu.appendChild(opt);
            });
            return;
        }

        // Default: source list
        Byte2BiteData.getSources().forEach(s => {
            const remaining = state.sourceRemaining.get(s.id) ?? 0;
            const opt = document.createElement("div");
            opt.className = "b2b-source-option";
            if (s.id === state.selection.id) opt.classList.add("b2b-source-option--selected");
            opt.innerHTML = `
        <div class="b2b-source-option__name">${esc(s.name)}</div>
        <div class="b2b-source-option__meta">
          ${remaining} meals · ${esc(pretty(s.foodType))}
          <span class="b2b-tag b2b-tag--${esc(s.priority)}">${esc(pretty(s.priority))}</span>
        </div>
      `;
            opt.addEventListener("click", () => {
                closeSourceMenu();
                selectSource(s.id);
            });
            dom.sourceMenu.appendChild(opt);
        });
    }

    // -------------------------------------------------------------------------
    // Header card + trigger text
    // -------------------------------------------------------------------------
    function renderSourceTrigger() {
        if (!state.selection.kind) {
            dom.selectLabel.textContent = "Select a source";
            dom.sourceText.innerHTML = "Click a green or blue pin…";
            return;
        }
        if (state.selection.kind === "source") {
            const s = Byte2BiteData.getById(state.selection.id);
            const remaining = state.sourceRemaining.get(s.id) ?? 0;
            dom.selectLabel.textContent = "Surplus source";
            dom.sourceText.innerHTML =
                `<span>${esc(s.name.split(",")[0])}</span> <em>· ${remaining} meals · ${esc(pretty(s.foodType))}</em>`;
        } else {
            const r = Byte2BiteData.getById(state.selection.id);
            const remaining = state.recipientRemaining.get(r.id) ?? 0;
            dom.selectLabel.textContent = "Recipient (demand)";
            dom.sourceText.innerHTML =
                `<span>${esc(r.name)}</span> <em>· needs ${remaining} meals</em>`;
        }
    }

    function renderSourceCard() {
        if (!state.selection.kind) { dom.sourceCard.hidden = true; return; }
        dom.sourceCard.hidden = false;

        if (state.selection.kind === "source") {
            const s = Byte2BiteData.getById(state.selection.id);
            const remaining = state.sourceRemaining.get(s.id) ?? 0;
            dom.sourceCard.innerHTML = `
        <div class="b2b-source-card">
          <div class="b2b-badge--surplus">SURPLUS DETECTED</div>
          <h3 class="b2b-source-card__name">${esc(s.name)}</h3>
          <dl class="b2b-source-card__meta">
            <div><dt>Available</dt><dd>${remaining} / ${s.surplusMeals}</dd></div>
            <div><dt>Food type</dt><dd>${esc(pretty(s.foodType))}</dd></div>
            <div><dt>Priority</dt><dd><span class="b2b-tag b2b-tag--${esc(s.priority)}">${esc(pretty(s.priority))}</span></dd></div>
          </dl>
        </div>
      `;
        } else {
            const r = Byte2BiteData.getById(state.selection.id);
            const remaining = state.recipientRemaining.get(r.id) ?? 0;
            dom.sourceCard.innerHTML = `
        <div class="b2b-source-card b2b-source-card--recipient">
          <div class="b2b-badge--surplus b2b-badge--recipient">DEMAND RECEIVED</div>
          <h3 class="b2b-source-card__name">${esc(r.name)}</h3>
          <dl class="b2b-source-card__meta">
            <div><dt>Capacity left</dt><dd>${remaining} / ${r.capacityMeals}</dd></div>
            <div><dt>Type</dt><dd>${esc(pretty(r.organizationType))}</dd></div>
            <div><dt>Priority</dt><dd><span class="b2b-tag b2b-tag--${esc(r.priority)}">${esc(pretty(r.priority))}</span></dd></div>
          </dl>
        </div>
      `;
        }
    }

    // -------------------------------------------------------------------------
    // Results
    // -------------------------------------------------------------------------
    function showLoadingState(direction) {
        const label = direction === "recipient_to_source"
            ? "Calculating <strong>road routes</strong> from candidate sources…"
            : "Calculating <strong>road routes</strong> to compatible recipients…";
        dom.results.innerHTML = `
      <div class="b2b-loading">
        <div class="b2b-loading__spinner"></div>
        <p class="b2b-loading__text">${label}</p>
      </div>`;
    }

    function showRoutingUnavailable() {
        dom.results.innerHTML = `
      <div class="b2b-empty" style="border-color:#fca5a5;background:#fef2f2;color:#991b1b;">
        <strong>Road routing temporarily unavailable.</strong><br>
        Matching is on hold — please try again in a moment.
      </div>`;
    }

    function renderIdle() {
        dom.results.innerHTML = `
      <div class="b2b-idle">
        <div class="b2b-idle__icon">📍</div>
        <p class="b2b-idle__text">
          Click a <strong>green source</strong> pin (surplus) or a
          <strong class="blue">blue recipient</strong> pin (demand)
          to begin.
        </p>
      </div>`;
    }

    function renderMatches(matches, routingHealthy, direction) {
        const title = direction === "recipient_to_source"
            ? "Top Matching Sources"
            : "Top Matching Recipients";
        const badgeClass = direction === "recipient_to_source"
            ? "b2b-match-count b2b-match-count--recipient"
            : "b2b-match-count";

        dom.results.innerHTML = `
      <div class="b2b-section-header">
        <h4 class="b2b-section-title">${title}</h4>
        <span class="${badgeClass}">${matches.length} match${matches.length === 1 ? "" : "es"}</span>
      </div>
      <ol class="b2b-recipient-list" id="b2b-recipient-list"></ol>
    `;
        const list = document.getElementById("b2b-recipient-list");

        if (matches.length === 0) {
            const msg = direction === "recipient_to_source"
                ? "No sources can currently supply this recipient."
                : "No compatible recipients with remaining capacity.";
            list.innerHTML = `<li class="b2b-empty">${msg}</li>`;
            return;
        }

        matches.forEach(m => {
            if (direction === "recipient_to_source") list.appendChild(renderSourceMatchCard(m));
            else list.appendChild(renderRecipientMatchCard(m));
        });

        if (!routingHealthy) {
            const note = document.createElement("li");
            note.className = "b2b-empty";
            note.style.cssText = "margin-top:8px;font-size:11px;padding:10px;";
            note.textContent = "Some counterpart locations were excluded because their road route could not be calculated.";
            list.appendChild(note);
        }
    }

    function renderRecipientMatchCard(m) {
        const li = document.createElement("li");
        li.className = "b2b-recipient-item";

        const capRemaining = state.recipientRemaining.get(m.recipientId) ?? 0;
        const compatPct = Math.round(m.compatibility * 100);
        const badgeClass = scoreBadgeClass(m.score);

        li.innerHTML = `
      <div class="b2b-recipient-header">
        <strong>${esc(m.recipientName)}</strong>
        <span class="b2b-score-badge ${badgeClass}" title="Matching score">${m.score}</span>
      </div>
      <div class="b2b-recipient-meta">
        <span class="b2b-road" title="Road distance">🚚 ${m.roadDistanceKm} km</span>
        <span title="Estimated driving time">⏱ ${m.durationMinutes} min</span>
        <span title="Remaining capacity">🛒 ${capRemaining} / ${m.availableCapacity}</span>
        <span title="Food-type compatibility">✅ ${compatPct}%</span>
      </div>
      <div class="b2b-recipient-footer">
        <span class="b2b-recipient-alloc">Recommend: <strong>${m.recommendedAllocation} meals</strong></span>
        <button type="button" class="b2b-btn-allocate-mini" data-id="${esc(m.recipientId)}">Allocate</button>
      </div>
    `;
        const btn = li.querySelector(".b2b-btn-allocate-mini");
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            allocate({ match: m, direction: "source_to_recipient" }, btn);
        });
        return li;
    }

    function renderSourceMatchCard(m) {
        const li = document.createElement("li");
        li.className = "b2b-recipient-item";

        const srcRemaining = state.sourceRemaining.get(m.sourceId) ?? 0;
        const compatPct = Math.round(m.compatibility * 100);
        const badgeClass = scoreBadgeClass(m.score);

        li.innerHTML = `
      <div class="b2b-recipient-header">
        <strong>${esc(m.sourceName)}</strong>
        <span class="b2b-score-badge ${badgeClass}" title="Matching score">${m.score}</span>
      </div>
      <div class="b2b-recipient-meta">
        <span class="b2b-road" title="Road distance">🚚 ${m.roadDistanceKm} km</span>
        <span title="Estimated driving time">⏱ ${m.durationMinutes} min</span>
        <span title="Source surplus">🍱 ${srcRemaining} / ${m.availableSurplus}</span>
        <span title="Food-type compatibility">✅ ${compatPct}%</span>
        <span title="Source priority">⚑ ${esc(pretty(m.sourcePriority))}</span>
      </div>
      <div class="b2b-recipient-footer">
        <span class="b2b-recipient-alloc">Recommend: <strong>${m.recommendedAllocation} meals</strong></span>
        <button type="button" class="b2b-btn-allocate-mini" data-id="${esc(m.sourceId)}">Allocate</button>
      </div>
    `;
        const btn = li.querySelector(".b2b-btn-allocate-mini");
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            allocate({ match: m, direction: "recipient_to_source" }, btn);
        });
        return li;
    }

    // -------------------------------------------------------------------------
    // Selection
    // -------------------------------------------------------------------------
    async function selectSource(sourceId) {
        map.closePopup();
        expandPanel();

        state.selection = { kind: "source", id: sourceId };

        renderSourceTrigger();
        renderSourceCard();
        renderSourceMenu();

        const source = Byte2BiteData.getById(sourceId);
        const remaining = state.sourceRemaining.get(sourceId) ?? 0;

        if (remaining <= 0) {
            renderMatches([], true, "source_to_recipient");
            return;
        }

        const cacheKey = "src:" + sourceId;
        if (state.matchCache.has(cacheKey)) {
            const cached = state.matchCache.get(cacheKey);
            renderMatches(cached.matches, cached.routingHealthy, "source_to_recipient");
            return;
        }

        showLoadingState("source_to_recipient");
        const token = ++currentRequestToken;

        const sourceForMatch = Object.assign({}, source, { surplusMeals: remaining });
        const result = await Byte2BiteRoadMatcher.rankRecipientsForSourceByRoad(
            sourceForMatch,
            Byte2BiteData.getRecipients(),
            state.recipientRemaining
        );

        if (token !== currentRequestToken) return;
        if (!result.routingOk) { showRoutingUnavailable(); return; }

        state.matchCache.set(cacheKey, {
            matches: result.matches,
            routingHealthy: result.routingHealthy
        });
        renderMatches(result.matches, result.routingHealthy, "source_to_recipient");
    }

    async function selectRecipient(recipientId) {
        map.closePopup();
        expandPanel();

        state.selection = { kind: "recipient", id: recipientId };

        renderSourceTrigger();
        renderSourceCard();
        renderSourceMenu();

        const recipient = Byte2BiteData.getById(recipientId);
        const remaining = state.recipientRemaining.get(recipientId) ?? 0;

        if (remaining <= 0) {
            renderMatches([], true, "recipient_to_source");
            return;
        }

        const cacheKey = "rec:" + recipientId;
        if (state.matchCache.has(cacheKey)) {
            const cached = state.matchCache.get(cacheKey);
            renderMatches(cached.matches, cached.routingHealthy, "recipient_to_source");
            return;
        }

        showLoadingState("recipient_to_source");
        const token = ++currentRequestToken;

        const result = await Byte2BiteRoadMatcher.rankSourcesForRecipientByRoad(
            Object.assign({}, recipient, { capacityMeals: remaining }),
            Byte2BiteData.getSources(),
            state.sourceRemaining
        );

        if (token !== currentRequestToken) return;
        if (!result.routingOk) { showRoutingUnavailable(); return; }

        state.matchCache.set(cacheKey, {
            matches: result.matches,
            routingHealthy: result.routingHealthy
        });
        renderMatches(result.matches, result.routingHealthy, "recipient_to_source");
    }

    // -------------------------------------------------------------------------
    // Displayed routes vs allocation history
    // -------------------------------------------------------------------------
    function drawRoute(source, recipient, route, amount) {
        const polyline = L.polyline(route.geometry, {
            color: "#0f7b3a", weight: 4, opacity: 0.85,
            lineCap: "round", lineJoin: "round"
        }).addTo(map);

        const mid = route.geometry[Math.floor(route.geometry.length / 2)];
        const label = L.marker(mid, {
            icon: L.divIcon({
                className: "b2b-route-label-wrap",
                html: `<div class="b2b-route-label">
          <strong>🚚 ${route.durationMinutes} min</strong>
          <span>${route.distanceKm} km · ${amount} meals</span>
        </div>`,
                iconSize: [140, 42], iconAnchor: [70, 21]
            }),
            interactive: false, keyboard: false, zIndexOffset: 500
        }).addTo(map);

        return { polyline, label };
    }


    function setSelectedRoute(record) {
        state.selectedRoute = record || null;
        if (!record) {
            dom.btnDeselect.disabled = true;
            dom.routeDetail.className = "b2b-route-detail";
            dom.routeDetail.innerHTML = "";
            if (window.Byte2BiteLogisticsAnalysis) window.Byte2BiteLogisticsAnalysis.showEntireMap();
            return;
        }
        dom.btnDeselect.disabled = false;
        if (window.Byte2BiteLogisticsAnalysis) window.Byte2BiteLogisticsAnalysis.showSelectedRoute(record);
        dom.routeDetail.className = "b2b-route-detail b2b-route-detail--active";
        dom.routeDetail.innerHTML = `
      <div class="b2b-route-detail__title">Selected route</div>
      <dl class="b2b-route-detail__grid">
        <dt>Source</dt><dd>${esc(record.sourceName)}</dd>
        <dt>Recipient</dt><dd>${esc(record.recipientName)}</dd>
        <dt>Meals</dt><dd>${Math.round(record.amount)}</dd>
        <dt>Food type</dt><dd>${esc(record.foodType || "—")}</dd>
        <dt>Road distance</dt><dd>${Number(record.distanceKm).toFixed(2)} km</dd>
        <dt>Road duration</dt><dd>${Number(record.durationMinutes).toFixed(1)} min</dd>
        <dt>Direction</dt><dd>${record.direction === "recipient_to_source" ? "Recipient → Source" : "Source → Recipient"}</dd>
      </dl>`;
    }

    function deselectSelection() {
        currentRequestToken++;
        state.selection = { kind: null, id: null };
        setSelectedRoute(null);
        renderSourceTrigger();
        renderSourceCard();
        renderIdle();
        renderSourceMenu();
        closeSourceMenu();
    }

    function hideAllDisplayedRoutes() {
        state.displayedRoutes.forEach(r => {
            if (r.polyline) map.removeLayer(r.polyline);
            if (r.label) map.removeLayer(r.label);
        });
        state.displayedRoutes = [];
        updateRouteActionButtons();
    }

    function updateRouteActionButtons() {
        dom.btnClearRoutes.disabled = state.displayedRoutes.length === 0;
    }

    // -------------------------------------------------------------------------
    // Allocation — direction-aware
    // -------------------------------------------------------------------------
    async function allocate({ match, direction }, buttonEl) {
        // Resolve which entity is the source and which is the recipient
        let source, recipient;
        if (direction === "source_to_recipient") {
            source = Byte2BiteData.getById(match.recipientId === null ? null : state.selection.id);
            recipient = Byte2BiteData.getById(match.recipientId);
        } else {
            source = Byte2BiteData.getById(match.sourceId);
            recipient = Byte2BiteData.getById(state.selection.id);
        }

        if (!source || !recipient) {
            showToast("⚠️ Missing source or recipient");
            return;
        }

        const srcRem = state.sourceRemaining.get(source.id) ?? 0;
        const recRem = state.recipientRemaining.get(recipient.id) ?? 0;
        if (srcRem <= 0) { showToast("Source has no surplus left"); return; }
        if (recRem <= 0) { showToast("Recipient has no capacity left"); return; }

        const amount = Math.min(match.recommendedAllocation, srcRem, recRem);
        if (amount <= 0) { showToast("Nothing to allocate"); return; }

        // Reuse the cached OSRM route from matching
        const route = await Byte2BiteRouting.getRoadRoute(source, recipient);
        if (!route) { showToast("⚠️ Route unavailable — cannot allocate"); return; }

        if (buttonEl) {
            buttonEl.disabled = true;
            buttonEl.textContent = "Drawing…";
            buttonEl.classList.add("b2b-btn-allocate-mini--loading");
        }

        // Single mode: clear displayed routes BEFORE drawing the new one
        if (state.mode === "single") hideAllDisplayedRoutes();

        // Draw
        const { polyline, label } = drawRoute(source, recipient, route, amount);

        // Record in both stores
        const allocationRecord = {
            direction,
            sourceId: source.id,
            recipientId: recipient.id,
            sourceName: source.name,
            recipientName: recipient.name,
            amount,
            foodType: source.foodType,
            distanceKm: route.distanceKm,
            durationMinutes: route.durationMinutes
        };
        state.allocationHistory.push(allocationRecord);
        state.displayedRoutes.push({ polyline, label, allocationRef: allocationRecord });
        polyline.on("click", () => setSelectedRoute(allocationRecord));
        label.setZIndexOffset(600);
        setSelectedRoute(allocationRecord);
        updateRouteActionButtons();

        // Update pools
        state.sourceRemaining.set(source.id, srcRem - amount);
        state.recipientRemaining.set(recipient.id, recRem - amount);

        // Invalidate caches for both entities (their remaining pools changed)
        state.matchCache.delete("src:" + source.id);
        state.matchCache.delete("rec:" + recipient.id);

        if (buttonEl) {
            buttonEl.classList.remove("b2b-btn-allocate-mini--loading");
            buttonEl.classList.add("b2b-btn-allocate-mini--done");
            buttonEl.textContent = "Allocated ✓";
        }

        showToast(`Allocated ${amount} meals · ${route.durationMinutes} min · ${route.distanceKm} km`);

        // Refresh UI to reflect new pools
        renderSourceTrigger();
        renderSourceCard();
        renderSourceMenu();
        // Re-run selection to show updated rankings with the new pools
        if (state.selection.kind === "source") await selectSource(state.selection.id);
        else if (state.selection.kind === "recipient") await selectRecipient(state.selection.id);
    }

    // -------------------------------------------------------------------------
    // Clear routes (display only) / Reset all (display + history + pools)
    // -------------------------------------------------------------------------
    function clearDisplayedRoutes() {
        hideAllDisplayedRoutes();
        setSelectedRoute(null);
        if (window.Byte2BiteLogisticsAnalysis) window.Byte2BiteLogisticsAnalysis.close();
        showToast("Displayed routes cleared — allocations kept");
    }

    function resetAll() {
        hideAllDisplayedRoutes();
        state.allocationHistory = [];
        state.matchCache.clear();
        currentRequestToken++;
        seedPools();
        state.selection = { kind: null, id: null };
        setSelectedRoute(null);
        renderSourceTrigger();
        renderSourceCard();
        renderIdle();
        renderSourceMenu();
        collapsePanel();
        showToast("All allocations reset");
    }

    // -------------------------------------------------------------------------
    // Marker wiring
    // -------------------------------------------------------------------------
    function attachMarkerHandlers() {
        Byte2BiteMarkers.sourceMarkers.forEach((marker, id) => {
            marker.on("click", () => selectSource(id));
        });
        Byte2BiteMarkers.recipientMarkers.forEach((marker, id) => {
            marker.on("click", () => selectRecipient(id));
        });
    }

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------
    function bindEvents() {
        dom.header.addEventListener("click", (e) => {
            // Don't toggle when clicking the mode switch
            if (e.target.closest(".b2b-mode-switch")) return;
            togglePanel();
        });
        dom.sourceTrigger.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleSourceMenu();
        });
        dom.btnClearRoutes.addEventListener("click", clearDisplayedRoutes);
        dom.btnReset.addEventListener("click", resetAll);
        dom.btnDeselect.addEventListener("click", deselectSelection);
        dom.btnAnalysis.addEventListener("click", () => window.Byte2BiteLogisticsAnalysis?.run());

        // Segmented mode switch
        dom.modeSwitch.addEventListener("click", (e) => {
            const target = e.target.closest(".b2b-mode-switch__option");
            if (!target) return;
            e.stopPropagation();
            setMode(target.dataset.mode);
        });
        dom.modeSwitch.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                const target = e.target.closest(".b2b-mode-switch__option");
                if (!target) return;
                e.preventDefault();
                e.stopPropagation();
                setMode(target.dataset.mode);
            }
        });

        document.addEventListener("click", (e) => {
            if (!dom.sourceSelect.contains(e.target)) closeSourceMenu();
        });
    }

    function init() {
        injectPanel();
        cacheDom();
        seedPools();
        bindEvents();
        attachMarkerHandlers();
        renderSourceMenu();
        renderSourceTrigger();
        renderSourceCard();
        renderIdle();
        updateRouteActionButtons();
        setMode("single"); // explicit default
    }

    function selectRouteFromAnalysis(a) {
        setSelectedRoute({
            direction: a.direction, sourceId: a.sourceId, recipientId: a.recipientId,
            sourceName: a.sourceName, recipientName: a.recipientName, amount: a.allocatedMeals,
            foodType: a.foodType, distanceKm: a.distanceKm, durationMinutes: a.durationMinutes
        });
        if (a.sourceId && a.recipientId) {
            const marker = Byte2BiteMarkers.sourceMarkers.get(a.sourceId);
            if (marker) marker.openPopup();
        }
    }

    return {
        init,
        selectSource,
        selectRecipient,
        clearDisplayedRoutes,
        resetAll,
        selectRouteFromAnalysis,
        getState: () => state
    };
})();


/* ============================================================================
   MODULE 8 — LOGISTICS OPTIMIZER + ANALYSIS
   Uses Part 1 data and Part 1 road-routing as the single source of truth.
   ============================================================================ */
window.Byte2BiteLogisticsOptimizer = (() => {
    const WEIGHTS = { distance: 0.40, capacity: 0.25, compatibility: 0.20, priority: 0.15 };
    const PRIORITY = { high: 1.0, medium: 0.6, low: 0.3 };
    const MAX_CONCURRENCY = 6;

    function priorityScore(v) { return PRIORITY[String(v || "").toLowerCase()] ?? 0.3; }
    function compat(source, recipient) {
        return Byte2BiteMatcher.compatibilityScore(source.foodType, recipient.acceptedFoodTypes);
    }
    function capacityFit(a, b) {
        if (a <= 0 || b <= 0) return 0;
        return Math.min(a, b) / Math.max(a, b);
    }
    function score(source, recipient, route, sr, rc) {
        const c = compat(source, recipient);
        if (c <= 0 || !route) return null;
        const components = {
            distance: Byte2BiteMatcher.distanceScoreFromKm(route.distanceKm),
            capacity: capacityFit(sr, rc),
            compatibility: c,
            priority: (priorityScore(source.priority) + priorityScore(recipient.priority)) / 2
        };
        const finalScore =
            components.distance * WEIGHTS.distance +
            components.capacity * WEIGHTS.capacity +
            components.compatibility * WEIGHTS.compatibility +
            components.priority * WEIGHTS.priority;
        return { ...components, finalScore };
    }

    async function routePairs(pairs) {
        const out = new Array(pairs.length);
        let cursor = 0;
        async function worker() {
            while (true) {
                const i = cursor++;
                if (i >= pairs.length) return;
                const { source, recipient } = pairs[i];
                try {
                    const route = await Byte2BiteRouting.getRoadRoute(source, recipient);
                    out[i] = { source, recipient, route, routeAvailable: !!route };
                } catch (err) {
                    out[i] = { source, recipient, route: null, routeAvailable: false, error: err.message };
                }
            }
        }
        const count = Math.min(MAX_CONCURRENCY, pairs.length);
        await Promise.all(Array.from({ length: count }, () => worker()));
        return out;
    }

    async function optimize() {
        const sources = Byte2BiteData.getSources();
        const recipients = Byte2BiteData.getRecipients();
        const sourceRemaining = new Map(sources.map(s => [s.id, Number(s.surplusMeals) || 0]));
        const recipientRemaining = new Map(recipients.map(r => [r.id, Number(r.capacityMeals) || 0]));

        const pairs = [];
        for (const s of sources) {
            for (const r of recipients) {
                if (compat(s, r) > 0 && sourceRemaining.get(s.id) > 0 && recipientRemaining.get(r.id) > 0) {
                    pairs.push({ source: s, recipient: r });
                }
            }
        }

        const routed = await routePairs(pairs);
        const allocations = [];
        while (true) {
            let best = null;
            for (const item of routed) {
                if (!item.routeAvailable) continue;
                const sr = sourceRemaining.get(item.source.id) || 0;
                const rc = recipientRemaining.get(item.recipient.id) || 0;
                if (sr <= 0 || rc <= 0) continue;
                const components = score(item.source, item.recipient, item.route, sr, rc);
                if (!components) continue;
                if (!best || components.finalScore > best.components.finalScore ||
                    (components.finalScore === best.components.finalScore && item.route.distanceKm < best.route.distanceKm)) {
                    best = { ...item, components };
                }
            }
            if (!best) break;
            const amount = Math.min(sourceRemaining.get(best.source.id), recipientRemaining.get(best.recipient.id));
            if (amount <= 0) break;
            sourceRemaining.set(best.source.id, sourceRemaining.get(best.source.id) - amount);
            recipientRemaining.set(best.recipient.id, recipientRemaining.get(best.recipient.id) - amount);
            allocations.push({
                sourceId: best.source.id, sourceName: best.source.name,
                recipientId: best.recipient.id, recipientName: best.recipient.name,
                foodType: best.source.foodType, allocatedMeals: amount,
                distanceKm: best.route.distanceKm, durationMinutes: best.route.durationMinutes,
                geometry: best.route.geometry, direction: "source_to_recipient",
                distanceScore: best.components.distance,
                capacityFitScore: best.components.capacity,
                compatibilityScore: best.components.compatibility,
                priorityScore: best.components.priority,
                finalScore: best.components.finalScore
            });
        }

        const successfulRoutes = routed.filter(r => r.routeAvailable).length;
        const failedRoutes = routed.length - successfulRoutes;
        const totalAllocatedMeals = allocations.reduce((a, b) => a + b.allocatedMeals, 0);
        const totalDistanceKm = allocations.reduce((a, b) => a + (Number(b.distanceKm) || 0), 0);
        const totalDurationMinutes = allocations.reduce((a, b) => a + (Number(b.durationMinutes) || 0), 0);
        return {
            allocations,
            unallocatedSources: sources.map(s => ({ sourceId: s.id, sourceName: s.name, remainingSurplus: sourceRemaining.get(s.id) || 0 })).filter(x => x.remainingSurplus > 0),
            unfilledRecipients: recipients.map(r => ({ recipientId: r.id, recipientName: r.name, remainingCapacity: recipientRemaining.get(r.id) || 0 })).filter(x => x.remainingCapacity > 0),
            summary: { totalRoutes: routed.length, successfulRoutes, failedRoutes, allocationCount: allocations.length, totalAllocatedMeals, totalDistanceKm: Number(totalDistanceKm.toFixed(2)), totalDurationMinutes: Number(totalDurationMinutes.toFixed(2)) }
        };
    }
    return { optimize, WEIGHTS };
})();

window.Byte2BiteLogisticsAnalysis = (() => {
    let lastPlan = null;
    let scope = "selected"; // selected | all
    let selectedRoute = null;
    const $ = id => document.getElementById(id);
    const fmt = (v, d = 1) => Number.isFinite(Number(v)) ? Number(v).toFixed(d) : "—";

    function normalizeRoute(record) {
        if (!record) return null;
        return {
            direction: record.direction || "source_to_recipient",
            sourceId: record.sourceId,
            recipientId: record.recipientId,
            sourceName: record.sourceName,
            recipientName: record.recipientName,
            amount: Number.isFinite(Number(record.amount)) ? Number(record.amount) : Number(record.allocatedMeals || 0),
            allocatedMeals: Number.isFinite(Number(record.allocatedMeals)) ? Number(record.allocatedMeals) : Number(record.amount || 0),
            foodType: record.foodType || "—",
            distanceKm: Number(record.distanceKm),
            durationMinutes: Number(record.durationMinutes),
            finalScore: Number(record.finalScore)
        };
    }

    function open() { $("b2b-analysis-panel")?.classList.add("is-open"); }
    function close() { $("b2b-analysis-panel")?.classList.remove("is-open"); }

    function updateScopeTabs() {
        const selectedTab = $("b2b-analysis-selected-tab");
        const allTab = $("b2b-analysis-all-tab");
        if (selectedTab) {
            selectedTab.disabled = !selectedRoute;
            selectedTab.classList.toggle("active", scope === "selected");
        }
        if (allTab) allTab.classList.toggle("active", scope === "all");
    }

    function setScope(next) {
        if (next !== "selected" && next !== "all") return;
        if (next === "selected" && !selectedRoute) return;
        scope = next;
        updateScopeTabs();
        const selected = $("b2b-selected-analysis");
        const all = $("b2b-analysis-all-content");
        const status = $("b2b-analysis-status");
        if (scope === "selected") {
            if (selected) selected.style.display = "block";
            if (all) all.style.display = "none";
            if (status) status.style.display = "none";
            renderSelectedRoute(selectedRoute);
        } else {
            if (selected) selected.style.display = "none";
            if (all) all.style.display = "block";
            if (status) status.style.display = "block";
        }
    }

    function renderSelectedRoute(record) {
        const el = $("b2b-selected-analysis");
        if (!el) return;
        if (!record) {
            el.innerHTML = `<div class="title">No route selected</div><div style="font-size:11.5px;color:#64748b;">Select an allocated route on the map or from the analysis list.</div>`;
            return;
        }
        const score = Number.isFinite(record.finalScore) ? record.finalScore.toFixed(3) : "—";
        el.innerHTML = `
      <div class="title">Selected route</div>
      <dl class="meta">
        <dt>Source</dt><dd>${esc(record.sourceName)}</dd>
        <dt>Recipient</dt><dd>${esc(record.recipientName)}</dd>
        <dt>Meals</dt><dd>${Math.round(record.amount)}</dd>
        <dt>Food type</dt><dd>${esc(record.foodType)}</dd>
        <dt>Road distance</dt><dd>${fmt(record.distanceKm, 2)} km</dd>
        <dt>Road duration</dt><dd>${fmt(record.durationMinutes, 1)} min</dd>
        <dt>Score</dt><dd>${score}</dd>
        <dt>Direction</dt><dd>${record.direction === "recipient_to_source" ? "Recipient → Source" : "Source → Recipient"}</dd>
      </dl>`;
    }

    function showSelectedRoute(record) {
        selectedRoute = normalizeRoute(record);
        open();
        setScope("selected");
    }

    function showEntireMap() {
        if (lastPlan) {
            scope = "all";
            open();
            setScope("all");
        } else {
            close();
        }
    }

    function render(plan) {
        lastPlan = plan;
        selectedRoute = selectedRoute || null;
        const sources = Byte2BiteData.getSources(), recipients = Byte2BiteData.getRecipients();
        const totalSurplus = sources.reduce((a, s) => a + (Number(s.surplusMeals) || 0), 0);
        const allocated = plan.summary.totalAllocatedMeals;
        $("aTotalSurplus").textContent = Math.round(totalSurplus);
        $("aAllocated").textContent = Math.round(allocated);
        $("aRemaining").textContent = Math.round(totalSurplus - allocated);
        $("aCompletion").textContent = (totalSurplus ? (allocated / totalSurplus * 100).toFixed(1) : "0.0") + "%";
        $("aSuccessRoutes").textContent = plan.summary.successfulRoutes;
        $("aFailedRoutes").textContent = plan.summary.failedRoutes;
        $("aDistance").textContent = fmt(plan.summary.totalDistanceKm, 1) + " km";
        $("aDuration").textContent = fmt(plan.summary.totalDurationMinutes, 1) + " min";

        $("aRoutes").innerHTML = plan.allocations.length ? plan.allocations.map((a, i) =>
            `<div class="b2b-a-route" data-analysis-index="${i}"><strong>${esc(a.sourceName)} → ${esc(a.recipientName)}</strong><span>${Math.round(a.allocatedMeals)} meals · ${fmt(a.distanceKm, 2)} km · ${fmt(a.durationMinutes, 1)} min · score ${fmt(a.finalScore, 3)}</span></div>`).join("") : "No allocations produced.";
        $("aRoutes").querySelectorAll("[data-analysis-index]").forEach(el => el.addEventListener("click", () => {
            const a = plan.allocations[Number(el.dataset.analysisIndex)];
            if (a) window.Byte2BiteUI.selectRouteFromAnalysis(a);
        }));

        const sourceAgg = new Map(); plan.allocations.forEach(a => sourceAgg.set(a.sourceId, (sourceAgg.get(a.sourceId) || 0) + a.allocatedMeals));
        const recipientAgg = new Map(); plan.allocations.forEach(a => recipientAgg.set(a.recipientId, (recipientAgg.get(a.recipientId) || 0) + a.allocatedMeals));
        $("aSources").innerHTML = `<table class="b2b-a-table"><thead><tr><th>Source</th><th>Original</th><th>Allocated</th><th>Remaining</th></tr></thead><tbody>` +
            sources.map(s => { const o = Number(s.surplusMeals) || 0, a = sourceAgg.get(s.id) || 0; return `<tr><td>${esc(s.name)}</td><td>${Math.round(o)}</td><td>${Math.round(a)}</td><td>${Math.max(0, Math.round(o - a))}</td></tr>` }).join("") + `</tbody></table>`;
        $("aRecipients").innerHTML = `<table class="b2b-a-table"><thead><tr><th>Recipient</th><th>Capacity</th><th>Received</th><th>Left</th></tr></thead><tbody>` +
            recipients.map(r => { const o = Number(r.capacityMeals) || 0, a = recipientAgg.get(r.id) || 0; return `<tr><td>${esc(r.name)}</td><td>${Math.round(o)}</td><td>${Math.round(a)}</td><td>${Math.max(0, Math.round(o - a))}</td></tr>` }).join("") + `</tbody></table>`;
        const food = new Map(); plan.allocations.forEach(a => food.set(a.foodType, (food.get(a.foodType) || 0) + a.allocatedMeals));
        $("aFoodTypes").innerHTML = food.size ? `<table class="b2b-a-table"><thead><tr><th>Food type</th><th>Meals</th></tr></thead><tbody>` + [...food.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${Math.round(v)}</td></tr>`).join("") + `</tbody></table>` : "No allocations produced.";
        $("b2b-analysis-status").textContent = `Analysis complete: ${plan.summary.allocationCount} allocations from ${plan.summary.totalRoutes} routed eligible pairs.`;
        open();
        setScope("all");
    }

    async function run() {
        open();
        scope = "all";
        setScope("all");
        $("b2b-analysis-status").textContent = "Calculating compatible road routes and optimizing allocations…";
        try { const plan = await window.Byte2BiteLogisticsOptimizer.optimize(); render(plan); return plan; }
        catch (err) { $("b2b-analysis-status").textContent = "Analysis failed: " + (err.message || "unknown error"); throw err; }
    }
    function esc(v) { return String(v ?? "").replace(/[&<>\"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" }[m])); }

    return {
        run, open, close, render,
        showSelectedRoute,
        showEntireMap,
        setScope,
        getLastPlan: () => lastPlan,
        getSelectedRoute: () => selectedRoute
    };
})();
/* ============================================================================
   BOOTSTRAP
   ============================================================================ */
(function bootstrap() {
    Byte2BiteMarkers.init(map);
    Byte2BiteUI.init();

    const analysisClose = document.getElementById("b2b-analysis-close");
    if (analysisClose) analysisClose.addEventListener("click", () => window.Byte2BiteLogisticsAnalysis.close());
    const selectedTab = document.getElementById("b2b-analysis-selected-tab");
    if (selectedTab) selectedTab.addEventListener("click", () => window.Byte2BiteLogisticsAnalysis.setScope("selected"));
    const allTab = document.getElementById("b2b-analysis-all-tab");
    if (allTab) allTab.addEventListener("click", () => window.Byte2BiteLogisticsAnalysis.setScope("all"));

    document.getElementById("legend-source-count").textContent = Byte2BiteData.getSources().length;
    document.getElementById("legend-recipient-count").textContent = Byte2BiteData.getRecipients().length;

    window.Byte2BiteData = Byte2BiteData;
    window.Byte2BiteMatcher = Byte2BiteMatcher;
    window.Byte2BiteRoadMatcher = Byte2BiteRoadMatcher;
    window.Byte2BiteRouting = Byte2BiteRouting;
    window.Byte2BiteMarkers = Byte2BiteMarkers;
    window.Byte2BiteUI = Byte2BiteUI;

    console.log("✅ Byte2Bite road-aware prototype ready");
    console.log("   Modules: Data · Matcher · RoadMatcher · Routing · Markers · UI");
    console.log("   Direction-aware: source→recipients AND recipient→sources");
})();