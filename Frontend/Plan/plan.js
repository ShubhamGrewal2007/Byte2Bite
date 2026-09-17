/* Byte2Bite — Plan page controller.
 * Loads plan.json, renders all sections, wires the serving calculator.
 * Modular: each renderer is standalone; swap DATA_SOURCE to move to /api/plan.
 */
(function () {
  "use strict";

  const DATA_SOURCE = "./plan.json";   // → change to "/api/plan" later

  let PLAN_DATA = null;

  // Task 2 §7: in-memory only. No localStorage, no backend.
  // Holds the most recent calculation result for potential reuse.
  let lastCalculatedPlan = null;

  // ---------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------
  async function loadPlanData() {
    const res = await fetch(DATA_SOURCE, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load plan data: " + res.status);
    return res.json();
  }

  // ---------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------
  function $(id) { return document.getElementById(id); }

  function formatDate(iso) {
    const d = new Date(iso + "T00:00:00");
    if (isNaN(d)) return iso;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }

  function formatHeaderDate() {
    const now = new Date();
    return now.toLocaleDateString("en-GB", {
      weekday: "short", day: "numeric", month: "short", year: "numeric"
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatQty(n, decimals) {
    if (!Number.isFinite(n)) return "—";
    const d = (typeof decimals === "number") ? decimals : 2;
    return Number(n).toLocaleString("en-IN", {
      minimumFractionDigits: d,
      maximumFractionDigits: d
    });
  }

  function labelForMeal(v) {
    return ({ breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner" })[v] || v;
  }
  function labelForStaple(v) {
    return ({ rice: "Rice", roti: "Wheat flour (Roti)", both: "Rice + Roti" })[v] || v;
  }
  function labelForProtein(v) {
    return ({ dal: "Dal", paneer: "Paneer", soyabean: "Soyabean" })[v] || v;
  }
  function labelForIngredient(k) {
    return ({
      rice: "Rice",
      wheat_flour: "Wheat flour",
      dal: "Dal",
      paneer: "Paneer",
      soyabean: "Soyabean",
      vegetables: "Vegetables",
      side: "Side / Misc"
    })[k] || k;
  }

  // ---------------------------------------------------------------
  // Renderers (non-calculator sections)
  // ---------------------------------------------------------------
  function renderHeaderDate() {
    $("headerDate").textContent = formatHeaderDate();
  }

  function renderSnapshot() {
    const s = PLAN_DATA.snapshot;
    const cards = [
      { label: "Expected Servings",  value: s.expectedServings.toLocaleString(), hint: "today" },
      { label: "Planned Production", value: s.plannedProduction.toLocaleString(), hint: "meals" },
      { label: "Expiring Items",     value: s.expiringItems, hint: "need attention" },
      { label: "Estimated Surplus",  value: s.estimatedSurplus + " servings", hint: "projected" }
    ];

    $("snapshotMetrics").innerHTML = cards.map(function (c) {
      return '' +
        '<div class="metric">' +
          '<span class="metric-label">' + escapeHtml(c.label) + '</span>' +
          '<span class="metric-value">' + escapeHtml(c.value) + '</span>' +
          '<span class="metric-hint">'  + escapeHtml(c.hint)  + '</span>' +
        '</div>';
    }).join("");
  }

  // Task 3 — Expiry Intelligence
  function renderExpiry() {
    const items = (PLAN_DATA.expiry || []).slice();
    const tbody = $("expiryBody");
    const summaryEl = $("expirySummary");
    const noteEl = $("expiryNote");

    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="4">No inventory data available.</td></tr>';
      if (summaryEl) summaryEl.innerHTML = "";
      if (noteEl) noteEl.hidden = true;
      return;
    }

    // Counters
    let safe = 0, warning = 0, danger = 0;
    items.forEach(function (it) {
      if (it.status === "danger") danger++;
      else if (it.status === "warning") warning++;
      else safe++;
    });

    if (summaryEl) {
      summaryEl.innerHTML = '' +
        '<span class="count safe"><i class="fas fa-circle-check"></i> Safe ' + safe + '</span>' +
        '<span class="count warning"><i class="fas fa-triangle-exclamation"></i> Warning ' + warning + '</span>' +
        '<span class="count danger"><i class="fas fa-circle-exclamation"></i> Danger ' + danger + '</span>';
    }

    // Display sorted ascending by days remaining (does not mutate plan.json)
    items.sort(function (a, b) { return (a.daysRemaining || 0) - (b.daysRemaining || 0); });

    tbody.innerHTML = items.map(function (it) {
      const days = Number(it.daysRemaining) || 0;
      const urgencyPct = Math.max(8, Math.min(100, Math.round((1 - Math.min(days, 14) / 14) * 100)));
      const statusClass = it.status === "danger" ? "danger"
                        : it.status === "warning" ? "warning"
                        : "safe";
      const statusIcon = it.status === "danger" ? "fa-circle-exclamation"
                       : it.status === "warning" ? "fa-triangle-exclamation"
                       : "fa-circle-check";
      const category = it.category || "";

      return '' +
        '<tr>' +
          '<td>' +
            '<span class="item-name">' + escapeHtml(it.name) + '</span>' +
            (category ? '<span class="item-category">' + escapeHtml(category) + '</span>' : '') +
            '<span class="urgency-bar ' + statusClass + '">' +
              '<span style="width:' + urgencyPct + '%"></span>' +
            '</span>' +
          '</td>' +
          '<td>' + escapeHtml(it.quantity) + ' ' + escapeHtml(it.unit) + '</td>' +
          '<td>' + escapeHtml(String(days)) + ' day' + (days === 1 ? '' : 's') + '</td>' +
          '<td><span class="pill ' + statusClass + '">' +
            '<i class="fas ' + statusIcon + '"></i>' +
            escapeHtml(it.status) +
          '</span></td>' +
        '</tr>';
    }).join("");

    // Actionable note
    const urgent = items.filter(function (it) { return it.status === "warning" || it.status === "danger"; });
    if (noteEl) {
      if (urgent.length) {
        const names = urgent.slice(0, 3).map(function (it) {
          return it.name + " (" + it.quantity + " " + it.unit + ")";
        }).join(", ");
        const extra = urgent.length > 3 ? " and " + (urgent.length - 3) + " more" : "";
        noteEl.hidden = false;
        noteEl.textContent = "Prioritize: " + names + extra +
          " — use these before they expire to reduce waste.";
      } else {
        noteEl.hidden = false;
        noteEl.textContent = "All inventory is currently within safe expiry limits.";
      }
    }
  }

  // Task 4 — Recommendations
  function renderRecommendations() {
    const recs = PLAN_DATA.recommendations || [];
    const iconFor = {
      expiry: "fa-clock",
      surplus: "fa-box-open",
      review: "fa-clipboard-check"
    };

    $("recGrid").innerHTML = recs.map(function (r) {
      const type = (r.type || "review").toLowerCase();
      const icon = iconFor[type] || "fa-lightbulb";
      return '' +
        '<div class="rec-card type-' + escapeHtml(type) + '">' +
          '<div class="rec-header">' +
            '<span class="rec-icon"><i class="fas ' + icon + '"></i></span>' +
            '<div>' +
              '<span class="rec-type-label">' + escapeHtml(type) + '</span>' +
              '<h3>' + escapeHtml(r.title) + '</h3>' +
            '</div>' +
          '</div>' +
          '<p>' + escapeHtml(r.description) + '</p>' +
        '</div>';
    }).join("");
  }

  // Task 5 — Recent Plans
  function renderRecentPlans() {
    const rows = (PLAN_DATA.recentPlans || []).slice();
    const tbody = $("recentBody");
    const summaryEl = $("recentSummary");

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="5">No recent plans yet.</td></tr>';
      if (summaryEl) summaryEl.innerHTML = "";
      return;
    }

    // Sort display: date descending, then meal order (breakfast < lunch < dinner)
    const mealOrder = { breakfast: 0, lunch: 1, dinner: 2 };
    rows.sort(function (a, b) {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return (mealOrder[a.meal.toLowerCase()] || 0) - (mealOrder[b.meal.toLowerCase()] || 0);
    });

    // Summary counters (do not mutate data)
    const totalSurplus = rows.reduce(function (sum, r) { return sum + (Number(r.surplus) || 0); }, 0);
    const avgSurplus = totalSurplus / rows.length;

    if (summaryEl) {
      summaryEl.innerHTML = '' +
        '<span class="count"><i class="fas fa-list"></i> ' + rows.length + ' plans</span>' +
        '<span class="count"><i class="fas fa-chart-simple"></i> Avg surplus ' + avgSurplus.toFixed(1) + '</span>' +
        '<span class="count"><i class="fas fa-box-open"></i> Total surplus ' + totalSurplus + '</span>';
    }

    tbody.innerHTML = rows.map(function (r) {
      const surplus = Number(r.surplus) || 0;
      const surplusCell = surplus > 0
        ? '<span class="surplus-positive">' + escapeHtml(String(surplus)) + '</span>'
        : '<span class="surplus-zero">—</span>';

      return '' +
        '<tr>' +
          '<td>' + escapeHtml(formatDate(r.date)) + '</td>' +
          '<td><span class="meal-chip">' + escapeHtml(r.meal) + '</span></td>' +
          '<td>' + escapeHtml(Number(r.expected).toLocaleString("en-IN")) + '</td>' +
          '<td>' + escapeHtml(Number(r.produced).toLocaleString("en-IN")) + '</td>' +
          '<td>' + surplusCell + '</td>' +
        '</tr>';
    }).join("");
  }

  // ===============================================================
  // TASK 2 — SERVING PLANNER
  // ===============================================================
  // Integration contract (see frontend/calculator/calculator-core.js):
  //
  //   window.Byte2BiteCalculator.createTestPopulation(total)
  //     → array of age-group objects scaled to `total`
  //
  //   window.Byte2BiteCalculator.calculateFoodRequirement(population, options)
  //     options = { meal, staple, protein, buffer_percent }
  //     → on success: { success:true, meal, staple_choice, protein_choice,
  //                     population, food, raw, buffer, preparation_target, formula_trace }
  //     → on failure: { success:false, error:{ factor, code, message, details } }
  //
  // This module NEVER reimplements the calculator. It only:
  //   1) reads inputs, 2) validates them, 3) calls the core, 4) renders the result.
  // ===============================================================

  function setFieldError(fieldId, errorId, message) {
    const input = $(fieldId);
    const errEl = $(errorId);
    if (input) input.classList.add("invalid");
    if (errEl) {
      errEl.textContent = message;
      errEl.hidden = false;
    }
  }

  function clearFieldError(fieldId, errorId) {
    const input = $(fieldId);
    const errEl = $(errorId);
    if (input) input.classList.remove("invalid");
    if (errEl) {
      errEl.textContent = "";
      errEl.hidden = true;
    }
  }

  function clearAllFieldErrors() {
    clearFieldError("calcMeal",     "errCalcMeal");
    clearFieldError("calcStaple",   "errCalcStaple");
    clearFieldError("calcProtein",  "errCalcProtein");
    clearFieldError("calcServings", "errCalcServings");
    clearFieldError("calcMargin",   "errCalcMargin");
  }

  function showCalcError(msg) {
    const box = $("calcError");
    box.textContent = msg;
    box.hidden = false;
  }

  function clearCalcError() {
    const box = $("calcError");
    box.textContent = "";
    box.hidden = true;
  }

  function hydrateCalculatorDefaults() {
    const c = (PLAN_DATA && PLAN_DATA.calculator) || {};
    if (c.defaultMeal)     $("calcMeal").value     = c.defaultMeal;
    if (c.defaultStaple)   $("calcStaple").value   = c.defaultStaple;
    if (c.defaultProtein)  $("calcProtein").value  = c.defaultProtein;
    if (c.expectedServings != null) $("calcServings").value = c.expectedServings;
    if (c.safetyMargin != null)     $("calcMargin").value   = c.safetyMargin;
  }

  function readServingPlannerInputs() {
    return {
      meal:     $("calcMeal").value,
      staple:   $("calcStaple").value,
      protein:  $("calcProtein").value,
      servings: $("calcServings").value,
      margin:   $("calcMargin").value
    };
  }

  function validateServingPlannerInputs(raw) {
    clearAllFieldErrors();
    clearCalcError();

    let ok = true;

    if (!raw.meal) {
      setFieldError("calcMeal", "errCalcMeal", "Please select a meal.");
      ok = false;
    } else if (["breakfast", "lunch", "dinner"].indexOf(raw.meal) === -1) {
      setFieldError("calcMeal", "errCalcMeal", "Invalid meal selection.");
      ok = false;
    }

    if (!raw.staple) {
      setFieldError("calcStaple", "errCalcStaple", "Please select a staple.");
      ok = false;
    } else if (["rice", "roti", "both"].indexOf(raw.staple) === -1) {
      setFieldError("calcStaple", "errCalcStaple", "Invalid staple selection.");
      ok = false;
    }

    if (!raw.protein) {
      setFieldError("calcProtein", "errCalcProtein", "Please select a protein.");
      ok = false;
    } else if (["dal", "paneer", "soyabean"].indexOf(raw.protein) === -1) {
      setFieldError("calcProtein", "errCalcProtein", "Invalid protein selection.");
      ok = false;
    }

    const servings = Number(raw.servings);
    if (raw.servings === "" || !Number.isFinite(servings)) {
      setFieldError("calcServings", "errCalcServings", "Please enter expected servings.");
      ok = false;
    } else if (servings <= 0) {
      setFieldError("calcServings", "errCalcServings", "Servings must be a positive number.");
      ok = false;
    } else if (!Number.isInteger(servings)) {
      setFieldError("calcServings", "errCalcServings", "Servings must be a whole number.");
      ok = false;
    } else if (servings > 100000) {
      setFieldError("calcServings", "errCalcServings", "Servings look unrealistically high (max 100,000).");
      ok = false;
    }

    const margin = Number(raw.margin);
    if (raw.margin === "" || !Number.isFinite(margin)) {
      setFieldError("calcMargin", "errCalcMargin", "Please enter a safety margin.");
      ok = false;
    } else if (margin < 0 || margin > 100) {
      setFieldError("calcMargin", "errCalcMargin", "Safety margin must be between 0 and 100.");
      ok = false;
    }

    if (!ok) return { valid: false };

    return {
      valid: true,
      values: {
        meal: raw.meal,
        staple: raw.staple,
        protein: raw.protein,
        servings: servings,
        margin: margin
      }
    };
  }

  function calculateServingRequirement(values) {
    const Calculator = window.Byte2BiteCalculator;
    if (!Calculator) {
      showCalcError("Calculator engine is not loaded. Please refresh the page.");
      return null;
    }

    const population = Calculator.createTestPopulation(values.servings);

    const result = Calculator.calculateFoodRequirement(population, {
      meal: values.meal,
      staple: values.staple,
      protein: values.protein,
      buffer_percent: values.margin
    });

    if (!result || !result.success) {
      const msg = (result && result.error && result.error.message)
        ? result.error.message
        : "The calculator could not produce a result for these inputs.";
      showCalcError(msg);
      return null;
    }

    return result;
  }

  function renderCalculationResult(result, inputs) {
    $("calcEmpty").hidden = true;
    $("calcResult").hidden = false;

    const metrics = [
      { label: "Expected servings",    value: result.population.total_population.toLocaleString("en-IN") },
      { label: "Preparation target",   value: formatQty(result.preparation_target.cooked_food_kg) + " kg" },
      { label: "Raw requirement",      value: formatQty(result.raw.total_raw_kg) + " kg" },
      { label: "Cooked requirement",   value: formatQty(result.food.total_cooked_kg) + " kg" },
      { label: "Safety margin",        value: result.buffer.percent + "%" },
      { label: "Effective population", value: formatQty(result.population.effective_population, 0) }
    ];

    $("calcMetrics").innerHTML = metrics.map(function (m) {
      return '' +
        '<div class="metric">' +
          '<span class="metric-label">' + escapeHtml(m.label) + '</span>' +
          '<span class="metric-value">' + escapeHtml(m.value) + '</span>' +
        '</div>';
    }).join("");

    $("calcSummary").textContent =
      "Based on " + result.population.total_population.toLocaleString("en-IN") +
      " expected servings for " + labelForMeal(result.meal).toLowerCase() + ".";

    const badges = [
      { cls: "badge-meal",    icon: "fa-utensils",       text: labelForMeal(result.meal) },
      { cls: "badge-staple",  icon: "fa-wheat-awn",      text: labelForStaple(result.staple_choice) },
      { cls: "badge-protein", icon: "fa-drumstick-bite", text: labelForProtein(result.protein_choice) },
      { cls: "badge-margin",  icon: "fa-shield-halved",  text: "Margin " + result.buffer.percent + "%" }
    ];

    $("calcBadges").innerHTML = badges.map(function (b) {
      return '<span class="badge ' + b.cls + '">' +
               '<i class="fas ' + b.icon + '"></i>' +
               escapeHtml(b.text) +
             '</span>';
    }).join("");

    const rows = Object.keys(result.raw.breakdown).map(function (category) {
      const d = result.raw.breakdown[category];
      const target = (result.preparation_target.raw_ingredients &&
                      result.preparation_target.raw_ingredients[d.ingredient] != null)
        ? result.preparation_target.raw_ingredients[d.ingredient]
        : d.raw_quantity_kg;

      return '' +
        '<tr>' +
          '<td>' + escapeHtml(category) + '</td>' +
          '<td>' + escapeHtml(labelForIngredient(d.ingredient)) + '</td>' +
          '<td>' + escapeHtml(formatQty(d.cooked_quantity_kg)) + '</td>' +
          '<td>' + escapeHtml(formatQty(d.raw_quantity_kg)) + '</td>' +
          '<td>' + escapeHtml(formatQty(target)) + '</td>' +
        '</tr>';
    });
    $("calcTableBody").innerHTML = rows.join("");

    const targetRows = Object.keys(result.preparation_target.raw_ingredients).map(function (ing) {
      const qty = result.preparation_target.raw_ingredients[ing];
      return '' +
        '<tr>' +
          '<td>' + escapeHtml(labelForIngredient(ing)) + '</td>' +
          '<td>' + escapeHtml(formatQty(qty)) + '</td>' +
        '</tr>';
    });
    $("calcTargetBody").innerHTML = targetRows.join("");

    lastCalculatedPlan = {
      calculatedAt: new Date().toISOString(),
      inputs: inputs,
      result: result
    };
  }

  function clearCalculationResult() {
    $("calcResult").hidden = true;
    $("calcEmpty").hidden = false;
    $("calcMetrics").innerHTML = "";
    $("calcBadges").innerHTML = "";
    $("calcSummary").textContent = "";
    $("calcTableBody").innerHTML = "";
    $("calcTargetBody").innerHTML = "";
    clearAllFieldErrors();
    clearCalcError();
    lastCalculatedPlan = null;
  }

  function initializeServingPlanner() {
    const form = $("servingPlannerForm");
    const btn  = $("calcBtn");

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        handleCalculateClick();
      });
    } else if (btn) {
      btn.addEventListener("click", handleCalculateClick);
    }

    const fieldMap = {
      calcMeal: "errCalcMeal",
      calcStaple: "errCalcStaple",
      calcProtein: "errCalcProtein",
      calcServings: "errCalcServings",
      calcMargin: "errCalcMargin"
    };

    Object.keys(fieldMap).forEach(function (id) {
      const el = $(id);
      if (!el) return;
      el.addEventListener("input", function () {
        clearFieldError(id, fieldMap[id]);
      });
      el.addEventListener("change", function () {
        clearFieldError(id, fieldMap[id]);
      });
    });
  }

  function handleCalculateClick() {
    const raw = readServingPlannerInputs();
    const v = validateServingPlannerInputs(raw);
    if (!v.valid) return;

    const result = calculateServingRequirement(v.values);
    if (!result) return;

    renderCalculationResult(result, v.values);
  }

  // ---------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------
  async function init() {
    renderHeaderDate();

    try {
      PLAN_DATA = await loadPlanData();
    } catch (e) {
      console.error(e);
      $("snapshotMetrics").innerHTML =
        '<div class="alert">Could not load plan data. Check that plan.json is reachable.</div>';
      return;
    }

    renderSnapshot();
    renderExpiry();
    renderRecommendations();
    renderRecentPlans();

    hydrateCalculatorDefaults();
    initializeServingPlanner();
  }

  document.addEventListener("DOMContentLoaded", init);
})();