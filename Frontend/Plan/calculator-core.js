/* Byte2Bite — Serving Calculator Core
 * Merged: Bcalc.js algorithm (array-of-groups input) + calculator.js validation/config patterns.
 * Exposes window.Byte2BiteCalculator.
 * No build step. No imports. Drop-in <script>.
 */
window.Byte2BiteCalculator = (function () {
  "use strict";

  // ------------------------------------------------------------------
  // DEFAULT CONFIG  (Bcalc values, structured like calculator.js)
  // ------------------------------------------------------------------
  const DEFAULT_CONFIG = {
    reference_weight_kg: 60,

    activity_multipliers: { low: 0.85, moderate: 1.0, high: 1.25 },
    distribution_sensitivity: 0.02,
    gender_multipliers: { male: 1, female: 1, other: 1 },
    age_group_multipliers: {
      children: 1,
      adolescents: 1,
      adults: 1,
      elderly: 1
    },

    portion_sizes: {
      breakfast: { staple: 0.12, protein: 0.06, vegetable: 0.05, side: 0.03 },
      lunch:     { staple: 0.18, protein: 0.09, vegetable: 0.08, side: 0.04 },
      dinner:    { staple: 0.16, protein: 0.08, vegetable: 0.07, side: 0.04 }
    },

    ingredient_yields: {
      rice:         { cooking_yield: 0.35, water_absorption_factor: 2.8, cooking_loss_factor: 0.05 },
      wheat_flour:  { cooking_yield: 0.90, water_absorption_factor: 1.6, cooking_loss_factor: 0.05 },
      dal:          { cooking_yield: 0.40, water_absorption_factor: 2.5, cooking_loss_factor: 0.05 },
      vegetables:   { cooking_yield: 0.85, water_absorption_factor: 1.0, cooking_loss_factor: 0.10 },
      paneer:       { cooking_yield: 0.95, water_absorption_factor: 1.0, cooking_loss_factor: 0.05 },
      soyabean:     { cooking_yield: 0.40, water_absorption_factor: 2.5, cooking_loss_factor: 0.05 },
      side:         { cooking_yield: 0.90, water_absorption_factor: 1.0, cooking_loss_factor: 0.05 }
    }
  };

  // ------------------------------------------------------------------
  // HELPERS
  // ------------------------------------------------------------------
  function round(n, d = 3) {
    const p = Math.pow(10, d);
    return Math.round((n + Number.EPSILON) * p) / p;
  }

  function isFiniteNumber(v) { return typeof v === "number" && Number.isFinite(v); }
  function nonNegative(v)    { return isFiniteNumber(v) && v >= 0; }

  function err(factor, code, message, details) {
    return { success: false, error: { factor, code, message, details: details || null } };
  }

  // ------------------------------------------------------------------
  // CONFIG MERGE  (from calculator.js)
  // ------------------------------------------------------------------
  function mergeConfig(base, override) {
    if (!override || typeof override !== "object") return base;
    return {
      ...base,
      ...override,
      activity_multipliers: { ...base.activity_multipliers, ...(override.activity_multipliers || {}) },
      gender_multipliers:   { ...base.gender_multipliers,   ...(override.gender_multipliers   || {}) },
      age_group_multipliers:{ ...base.age_group_multipliers, ...(override.age_group_multipliers|| {}) },
      portion_sizes:        { ...base.portion_sizes,        ...(override.portion_sizes        || {}) },
      ingredient_yields:    { ...base.ingredient_yields,    ...(override.ingredient_yields    || {}) }
    };
  }

  // ------------------------------------------------------------------
  // POPULATION FACTORS  (Bcalc algorithm + finite guards)
  // ------------------------------------------------------------------
  function weightedAverage(items) {
    let sum = 0, weight = 0;
    for (const item of items) {
      const v = Number(item.value), w = Number(item.weight);
      if (Number.isFinite(v) && Number.isFinite(w) && w >= 0) { sum += v * w; weight += w; }
    }
    return weight ? sum / weight : 0;
  }

  function activityFactor(data, multipliers) {
    if (!data) return 1;
    let sum = 0, weight = 0;
    for (const [level, p] of Object.entries(data)) {
      const w = Number(p);
      if (Number.isFinite(w) && w >= 0) {
        sum += (multipliers[level] != null ? multipliers[level] : 1) * w;
        weight += w;
      }
    }
    return weight ? sum / weight : 1;
  }

  function genderFactor(data, multipliers) {
    if (!data) return 1;
    let sum = 0, weight = 0;
    for (const [g, p] of Object.entries(data)) {
      const w = Number(p);
      if (Number.isFinite(w) && w >= 0) {
        sum += (multipliers[g] != null ? multipliers[g] : 1) * w;
        weight += w;
      }
    }
    return weight ? sum / weight : 1;
  }

  function distributionFactor(bands, sensitivity) {
    if (!Array.isArray(bands) || !bands.length) return 1;
    let min = Infinity, max = -Infinity;
    const values = [];
    for (const band of bands) {
      const a = Number(band.min_kg), b = Number(band.max_kg), p = Number(band.proportion) || 0;
      if (Number.isFinite(a) && Number.isFinite(b)) {
        min = Math.min(min, a);
        max = Math.max(max, b);
        values.push({ value: (a + b) / 2, weight: p });
      }
    }
    const avg = weightedAverage(values);
    if (!avg || !Number.isFinite(min) || !Number.isFinite(max)) return 1;
    return 1 + sensitivity * ((max - min) / avg);
  }

  // ------------------------------------------------------------------
  // MAIN
  // ------------------------------------------------------------------
  function calculateFoodRequirement(populationData, options, configOverride) {
    const cfg = mergeConfig(DEFAULT_CONFIG, configOverride);
    const opts = options || {};

    // ---- input validation ----
    if (!Array.isArray(populationData) || !populationData.length) {
      return err("population", "MISSING_POPULATION_DATA",
        "Population data is required and must be a non-empty array.");
    }

    const meal    = opts.meal    || "lunch";
    const staple  = opts.staple  || "rice";
    const protein = opts.protein || "dal";
    const buffer  = Number(opts.buffer_percent != null ? opts.buffer_percent : 5);

    if (!cfg.portion_sizes[meal]) {
      return err("portion", "UNKNOWN_MEAL_TYPE",
        'Invalid meal "' + meal + '". Expected breakfast | lunch | dinner.');
    }
    if (["rice", "roti", "both"].indexOf(staple) === -1) {
      return err("portion", "INVALID_STAPLE",
        'Invalid staple "' + staple + '". Expected rice | roti | both.');
    }
    if (["dal", "paneer", "soyabean"].indexOf(protein) === -1) {
      return err("portion", "INVALID_PROTEIN",
        'Invalid protein "' + protein + '". Expected dal | paneer | soyabean.');
    }
    if (!Number.isFinite(buffer) || buffer < 0 || buffer > 100) {
      return err("input", "INVALID_BUFFER",
        "Safety buffer must be between 0 and 100.");
    }

    // ---- population factor ----
    let totalPopulation = 0;
    let effectivePopulation = 0;
    const breakdown = [];

    for (const group of populationData) {
      const population = Number(group.population != null ? group.population : 0);
      const avgWeight  = Number(group.average_weight_kg != null ? group.average_weight_kg : 0);

      if (!Number.isFinite(population) || population < 0) continue;
      if (!Number.isFinite(avgWeight) || avgWeight <= 0) continue;

      const wf  = avgWeight / cfg.reference_weight_kg;
      const af  = activityFactor(group.activity_distribution, cfg.activity_multipliers);
      const df  = distributionFactor(group.weight_bands, cfg.distribution_sensitivity);
      const gf  = genderFactor(group.gender_distribution, cfg.gender_multipliers);
      const agf = cfg.age_group_multipliers[group.age_group] != null
                    ? cfg.age_group_multipliers[group.age_group] : 1;

      const effective = population * wf * af * df * gf * agf;

      totalPopulation += population;
      effectivePopulation += effective;

      breakdown.push({
        age_group: group.age_group,
        population: round(population),
        average_weight_kg: round(avgWeight),
        W_g: round(wf, 6),
        A_g: round(af, 6),
        D_g: round(df, 6),
        G_g: round(gf, 6),
        age_group_factor: agf,
        E_g: round(effective)
      });
    }

    if (totalPopulation <= 0) {
      return err("population", "INVALID_TOTAL_POPULATION",
        "Total population must be greater than zero.");
    }

    // ---- portion factor ----
    const portions = cfg.portion_sizes[meal];
    const cooked = {};

    if (staple === "both") {
      cooked.rice = round(effectivePopulation * portions.staple * 0.5);
      cooked.roti = round(effectivePopulation * portions.staple * 0.5);
    } else {
      cooked[staple] = round(effectivePopulation * portions.staple);
    }

    cooked[protein]     = round(effectivePopulation * portions.protein);
    cooked.vegetable   = round(effectivePopulation * portions.vegetable);
    cooked.side        = round(effectivePopulation * portions.side);

    // ---- cooking yield factor ----
    const ingredientMap = {
      rice: "rice",
      roti: "wheat_flour",
      dal: "dal",
      paneer: "paneer",
      soyabean: "soyabean",
      vegetable: "vegetables",
      side: "side"
    };

    const raw = {};
    const details = {};
    let totalCooked = 0, totalRaw = 0;

    for (const [category, cookedQty] of Object.entries(cooked)) {
      const ingredientKey = ingredientMap[category];
      const y = cfg.ingredient_yields[ingredientKey];

      if (!y) {
        return err("cooking_yield", "MISSING_INGREDIENT_CONFIG",
          'No yield data for ingredient "' + ingredientKey + '".');
      }

      const effectiveYield = y.cooking_yield * y.water_absorption_factor * (1 - y.cooking_loss_factor);

      if (!Number.isFinite(effectiveYield) || effectiveYield <= 0) {
        return err("cooking_yield", "INVALID_EFFECTIVE_YIELD",
          'Invalid effective yield for "' + ingredientKey + '".');
      }

      const rawQty = cookedQty / effectiveYield;

      raw[ingredientKey] = round((raw[ingredientKey] || 0) + rawQty);
      totalCooked += cookedQty;
      totalRaw += rawQty;

      details[category] = {
        ingredient: ingredientKey,
        cooked_quantity_kg: round(cookedQty),
        raw_quantity_kg: round(rawQty),
        effective_yield: round(effectiveYield, 6)
      };
    }

    // ---- buffer / preparation target ----
    const multiplier = 1 + buffer / 100;
    const targetCooked = totalCooked * multiplier;
    const targetRaw = totalRaw * multiplier;
    const targetIngredients = {};

    for (const [ingredient, qty] of Object.entries(raw)) {
      targetIngredients[ingredient] = round(qty * multiplier);
    }

    return {
      success: true,

      meal: meal,
      staple_choice: staple,
      protein_choice: protein,

      population: {
        total_population: round(totalPopulation),
        effective_population: round(effectivePopulation),
        population_factor: round(effectivePopulation / totalPopulation, 6),
        breakdown: breakdown
      },

      food: {
        cooked_by_category: cooked,
        total_cooked_kg: round(totalCooked)
      },

      raw: {
        ingredients_kg: raw,
        total_raw_kg: round(totalRaw),
        breakdown: details
      },

      buffer: {
        percent: buffer,
        additional_cooked_kg: round(totalCooked * (multiplier - 1)),
        additional_raw_kg: round(totalRaw * (multiplier - 1))
      },

      preparation_target: {
        cooked_food_kg: round(targetCooked),
        raw_ingredients_kg: round(targetRaw),
        raw_ingredients: targetIngredients
      },

      formula_trace: {
        population: "E_g = N_g × W_g × A_g × D_g × G_g × AgeGroupFactor_g; " +
                    "D_g = 1 + sensitivity × spread; Effective = Σ E_g",
        portion:    "required_cooked_kg = effective_population × portion_size_per_person_kg",
        yield:      "effective_yield = cooking_yield × water_absorption × (1 − cooking_loss); " +
                    "raw_kg = cooked_kg ÷ effective_yield",
        buffer:     "target = base × (1 + buffer_percent / 100)"
      }
    };
  }

  // ------------------------------------------------------------------
  // TEST POPULATION  (from Bcalc.js, unchanged shape)
  // ------------------------------------------------------------------
  function createTestPopulation(total) {
    if (total == null) total = 1000;

    const groups = [
      {
        age_group: "children", population: 280, average_weight_kg: 18,
        gender_distribution: { male: 0.52, female: 0.46, other: 0.02 },
        weight_bands: [
          { min_kg: 10, max_kg: 15, proportion: 0.22 },
          { min_kg: 15, max_kg: 18, proportion: 0.38 },
          { min_kg: 18, max_kg: 22, proportion: 0.28 },
          { min_kg: 22, max_kg: 28, proportion: 0.12 }],
        activity_distribution: { low: 0.20, moderate: 0.55, high: 0.25 }
      },
      {
        age_group: "adolescents", population: 180, average_weight_kg: 45,
        gender_distribution: { male: 0.51, female: 0.47, other: 0.02 },
        weight_bands: [
          { min_kg: 35, max_kg: 42, proportion: 0.18 },
          { min_kg: 42, max_kg: 48, proportion: 0.34 },
          { min_kg: 48, max_kg: 55, proportion: 0.30 },
          { min_kg: 55, max_kg: 65, proportion: 0.18 }],
        activity_distribution: { low: 0.18, moderate: 0.52, high: 0.30 }
      },
      {
        age_group: "adults", population: 440, average_weight_kg: 62,
        gender_distribution: { male: 0.50, female: 0.48, other: 0.02 },
        weight_bands: [
          { min_kg: 45, max_kg: 55, proportion: 0.20 },
          { min_kg: 55, max_kg: 65, proportion: 0.32 },
          { min_kg: 65, max_kg: 75, proportion: 0.30 },
          { min_kg: 75, max_kg: 90, proportion: 0.18 }],
        activity_distribution: { low: 0.25, moderate: 0.50, high: 0.25 }
      },
      {
        age_group: "elderly", population: 100, average_weight_kg: 58,
        gender_distribution: { male: 0.47, female: 0.51, other: 0.02 },
        weight_bands: [
          { min_kg: 42, max_kg: 52, proportion: 0.24 },
          { min_kg: 52, max_kg: 62, proportion: 0.36 },
          { min_kg: 62, max_kg: 72, proportion: 0.28 },
          { min_kg: 72, max_kg: 85, proportion: 0.12 }],
        activity_distribution: { low: 0.45, moderate: 0.40, high: 0.15 }
      }
    ];

    const factor = total / 1000;
    return groups.map(function (g) {
      return Object.assign({}, g, { population: g.population * factor });
    });
  }

  return {
    calculateFoodRequirement: calculateFoodRequirement,
    createTestPopulation: createTestPopulation,
    DEFAULT_CONFIG: DEFAULT_CONFIG
  };
})();