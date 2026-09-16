function calculateFoodRequirement(populationData, calculatorConfig, options) {
    const DEFAULT_CONFIG = {
        population: {
            reference_weight_kg: 60,
            activity_multipliers: {
                low: 0.85,
                moderate: 1.0,
                high: 1.25
            },
            distribution_sensitivity: 0.02,
            gender_multipliers: {
                male: 1.0,
                female: 1.0,
                other: 1.0
            },
            age_group_multipliers: {
                children: 1.0,
                adolescents: 1.0,
                adults: 1.0,
                elderly: 1.0
            }
        },

        portions: {
            breakfast: {
                staple: 0.120,
                protein: 0.060,
                vegetable: 0.050,
                side: 0.030
            },

            lunch: {
                staple: 0.180,
                protein: 0.090,
                vegetable: 0.080,
                side: 0.040
            },

            dinner: {
                staple: 0.160,
                protein: 0.080,
                vegetable: 0.070,
                side: 0.040
            }
        },

        cookingYield: {
            defaults: {
                cooking_yield: 1.0,
                water_absorption_factor: 1.0,
                cooking_loss_factor: 0.0
            },

            ingredients: {
                rice: {
                    label: "Rice",
                    cooking_yield: 0.35,
                    water_absorption_factor: 2.80,
                    cooking_loss_factor: 0.05
                },

                wheat_flour: {
                    label: "Wheat / Flour",
                    cooking_yield: 0.90,
                    water_absorption_factor: 1.60,
                    cooking_loss_factor: 0.05
                },

                pulses: {
                    label: "Pulses / Lentils",
                    cooking_yield: 0.40,
                    water_absorption_factor: 2.50,
                    cooking_loss_factor: 0.05
                },

                vegetables: {
                    label: "Vegetables",
                    cooking_yield: 0.85,
                    water_absorption_factor: 1.00,
                    cooking_loss_factor: 0.10
                },

                potatoes: {
                    label: "Potatoes",
                    cooking_yield: 0.90,
                    water_absorption_factor: 1.00,
                    cooking_loss_factor: 0.05
                },

                paneer_protein: {
                    label: "Paneer / Protein",
                    cooking_yield: 0.95,
                    water_absorption_factor: 1.00,
                    cooking_loss_factor: 0.05
                },

                side: {
                    label: "Side / Misc",
                    cooking_yield: 0.90,
                    water_absorption_factor: 1.00,
                    cooking_loss_factor: 0.05
                }
            },

            category_to_ingredient_map: {
                staple: "rice",
                protein: "paneer_protein",
                vegetable: "vegetables",
                side: "side"
            }
        }
    };

    // --------------------------------------------------
    // Helpers
    // --------------------------------------------------

    function error(factor, code, message, details = null) {
        return {
            success: false,
            error: {
                factor,
                code,
                message,
                details
            }
        };
    }

    function finiteNumber(value) {
        return typeof value === "number" && Number.isFinite(value);
    }

    function nonNegative(value) {
        return finiteNumber(value) && value >= 0;
    }

    function mergeConfig(base, override) {
        if (!override || typeof override !== "object") {
            return base;
        }

        return {
            population: {
                ...base.population,
                ...(override.population || {}),

                activity_multipliers: {
                    ...base.population.activity_multipliers,
                    ...(override.population?.activity_multipliers || {})
                },

                gender_multipliers: {
                    ...base.population.gender_multipliers,
                    ...(override.population?.gender_multipliers || {})
                },

                age_group_multipliers: {
                    ...base.population.age_group_multipliers,
                    ...(override.population?.age_group_multipliers || {})
                }
            },

            portions: {
                ...base.portions,
                ...(override.portions || {})
            },

            cookingYield: {
                ...base.cookingYield,
                ...(override.cookingYield || {}),

                defaults: {
                    ...base.cookingYield.defaults,
                    ...(override.cookingYield?.defaults || {})
                },

                ingredients: {
                    ...base.cookingYield.ingredients,
                    ...(override.cookingYield?.ingredients || {})
                },

                category_to_ingredient_map: {
                    ...base.cookingYield.category_to_ingredient_map,
                    ...(override.cookingYield?.category_to_ingredient_map || {})
                }
            }
        };
    }

    const config = mergeConfig(
        DEFAULT_CONFIG,
        calculatorConfig
    );

    const opts = options || {};
    const mealType = opts.meal_type || opts.mealType;

    // --------------------------------------------------
    // Basic validation
    // --------------------------------------------------

    if (!populationData || typeof populationData !== "object") {
        return error(
            "population",
            "MISSING_POPULATION_DATA",
            "populationData is missing or not an object."
        );
    }

    if (
        !finiteNumber(populationData.total_population) ||
        populationData.total_population <= 0
    ) {
        return error(
            "population",
            "INVALID_TOTAL_POPULATION",
            "total_population must be a positive finite number."
        );
    }

    if (
        !Array.isArray(populationData.age_groups) ||
        populationData.age_groups.length === 0
    ) {
        return error(
            "population",
            "INVALID_AGE_GROUPS",
            "age_groups must be a non-empty array."
        );
    }

    if (!mealType || typeof mealType !== "string") {
        return error(
            "input",
            "MISSING_MEAL_TYPE",
            "options.meal_type is required."
        );
    }

    // --------------------------------------------------
    // FACTOR 1 — POPULATION
    // --------------------------------------------------

    const populationConfig = config.population;

    const referenceWeight =
        populationConfig.reference_weight_kg;

    const activityMultipliers =
        populationConfig.activity_multipliers;

    const distributionSensitivity =
        populationConfig.distribution_sensitivity;

    const genderMultipliers =
        populationConfig.gender_multipliers;

    const ageGroupMultipliers =
        populationConfig.age_group_multipliers;

    if (
        !finiteNumber(referenceWeight) ||
        referenceWeight <= 0
    ) {
        return error(
            "population",
            "INVALID_REFERENCE_WEIGHT",
            "reference_weight_kg must be positive."
        );
    }

    let effectivePopulation = 0;
    const populationBreakdown = [];

    for (const group of populationData.age_groups) {

        if (!group || typeof group !== "object") {
            return error(
                "population",
                "INVALID_AGE_GROUP_ENTRY",
                "Each age group must be an object."
            );
        }

        if (!nonNegative(group.population_count)) {
            return error(
                "population",
                "INVALID_POPULATION_COUNT",
                "population_count must be non-negative."
            );
        }

        if (
            !finiteNumber(group.average_weight_kg) ||
            group.average_weight_kg <= 0
        ) {
            return error(
                "population",
                "INVALID_AVERAGE_WEIGHT",
                "average_weight_kg must be positive."
            );
        }

        // -----------------------------
        // Activity distribution
        // -----------------------------

        if (
            !group.activity_distribution ||
            typeof group.activity_distribution !== "object"
        ) {
            return error(
                "population",
                "MISSING_ACTIVITY_DISTRIBUTION",
                "activity_distribution is required."
            );
        }

        let activitySum = 0;

        for (const key of [
            "low",
            "moderate",
            "high"
        ]) {

            const value =
                group.activity_distribution[key];

            if (!nonNegative(value)) {
                return error(
                    "population",
                    "INVALID_ACTIVITY_PERCENTAGE",
                    `activity_distribution.${key} must be non-negative.`
                );
            }

            activitySum += value;
        }

        if (Math.abs(activitySum - 1) > 1e-6) {
            return error(
                "population",
                "ACTIVITY_PERCENTAGES_DO_NOT_SUM_TO_1",
                "Activity percentages must sum to 1."
            );
        }

        // -----------------------------
        // Weight bands
        // -----------------------------

        if (
            !Array.isArray(group.weight_bands) ||
            group.weight_bands.length === 0
        ) {
            return error(
                "population",
                "MISSING_WEIGHT_BANDS",
                "weight_bands are required."
            );
        }

        let weightBandSum = 0;
        let minBand = Infinity;
        let maxBand = -Infinity;

        for (const band of group.weight_bands) {

            if (!band || typeof band !== "object") {
                return error(
                    "population",
                    "INVALID_WEIGHT_BAND",
                    "Invalid weight band."
                );
            }

            if (
                !nonNegative(band.min_kg) ||
                !nonNegative(band.max_kg) ||
                band.max_kg < band.min_kg
            ) {
                return error(
                    "population",
                    "INVALID_WEIGHT_BAND_RANGE",
                    "Weight band range is invalid."
                );
            }

            if (!nonNegative(band.percentage)) {
                return error(
                    "population",
                    "INVALID_WEIGHT_BAND_PERCENTAGE",
                    "Weight band percentage must be non-negative."
                );
            }

            weightBandSum += band.percentage;

            minBand = Math.min(
                minBand,
                band.min_kg
            );

            maxBand = Math.max(
                maxBand,
                band.max_kg
            );
        }

        if (Math.abs(weightBandSum - 1) > 1e-6) {
            return error(
                "population",
                "WEIGHT_BANDS_DO_NOT_SUM_TO_1",
                "Weight band percentages must sum to 1."
            );
        }

        // -----------------------------
        // Gender distribution
        // -----------------------------

        if (
            !group.gender_distribution ||
            typeof group.gender_distribution !== "object"
        ) {
            return error(
                "population",
                "MISSING_GENDER_DISTRIBUTION",
                "gender_distribution is required."
            );
        }

        let genderSum = 0;

        for (const key of [
            "male",
            "female",
            "other"
        ]) {

            const value =
                group.gender_distribution[key];

            if (!nonNegative(value)) {
                return error(
                    "population",
                    "INVALID_GENDER_PERCENTAGE",
                    `gender_distribution.${key} must be non-negative.`
                );
            }

            genderSum += value;
        }

        if (Math.abs(genderSum - 1) > 1e-6) {
            return error(
                "population",
                "GENDER_PERCENTAGES_DO_NOT_SUM_TO_1",
                "Gender percentages must sum to 1."
            );
        }

        // -----------------------------
        // Population calculations
        // -----------------------------

        const W_g =
            group.average_weight_kg /
            referenceWeight;

        const A_g =
            group.activity_distribution.low *
            activityMultipliers.low +

            group.activity_distribution.moderate *
            activityMultipliers.moderate +

            group.activity_distribution.high *
            activityMultipliers.high;

        // IMPORTANT:
        // Original spread-based formula.
        const spread =
            (maxBand - minBand) /
            group.average_weight_kg;

        const D_g =
            1 +
            distributionSensitivity * spread;

        const G_g =
            group.gender_distribution.male *
            genderMultipliers.male +

            group.gender_distribution.female *
            genderMultipliers.female +

            group.gender_distribution.other *
            genderMultipliers.other;

        const groupKey =
            String(group.group || "").toLowerCase();

        const ageGroupFactor =
            ageGroupMultipliers[groupKey];

        if (ageGroupFactor === undefined) {
            return error(
                "population",
                "UNKNOWN_AGE_GROUP",
                `No age group multiplier configured for "${group.group}".`
            );
        }

        const E_g =
            group.population_count *
            W_g *
            A_g *
            D_g *
            G_g *
            ageGroupFactor;

        effectivePopulation += E_g;

        populationBreakdown.push({
            group: group.group,
            population_count: group.population_count,
            average_weight_kg: group.average_weight_kg,

            min_weight_band_kg: minBand,
            max_weight_band_kg: maxBand,

            W_g,
            A_g,
            spread,
            D_g,
            G_g,

            age_group_factor: ageGroupFactor,

            E_g
        });
    }

    const populationFactor =
        effectivePopulation /
        populationData.total_population;

    // --------------------------------------------------
    // FACTOR 2 — PORTION SIZE
    // --------------------------------------------------

    const mealPortions =
        config.portions[mealType];

    if (
        !mealPortions ||
        typeof mealPortions !== "object"
    ) {
        return error(
            "portion",
            "UNKNOWN_MEAL_TYPE",
            `No portion configuration found for "${mealType}".`
        );
    }

    const categories = [
        "staple",
        "protein",
        "vegetable",
        "side"
    ];

    const portionSizePerPersonKg = {};
    const requiredCookedQuantityKg = {};

    let totalRequiredCooked = 0;

    for (const category of categories) {

        const portion =
            mealPortions[category];

        if (!nonNegative(portion)) {
            return error(
                "portion",
                "INVALID_PORTION_VALUE",
                `Invalid portion value for ${category}.`
            );
        }

        portionSizePerPersonKg[category] =
            portion;

        const cookedQuantity =
            effectivePopulation * portion;

        requiredCookedQuantityKg[category] =
            cookedQuantity;

        totalRequiredCooked +=
            cookedQuantity;
    }

    // --------------------------------------------------
    // FACTOR 3 — COOKING YIELD
    // --------------------------------------------------

    const yieldConfig =
        config.cookingYield;

    const ingredients =
        yieldConfig.ingredients;

    const mapping =
        yieldConfig.category_to_ingredient_map;

    const defaults =
        yieldConfig.defaults || {};

    const ingredientResults = {};
    const rawByIngredient = {};

    let totalRaw = 0;

    for (
        const [category, cookedQuantity]
        of Object.entries(requiredCookedQuantityKg)
    ) {

        const ingredientKey =
            mapping[category];

        if (!ingredientKey) {
            return error(
                "cooking_yield",
                "MISSING_INGREDIENT_MAPPING",
                `No ingredient mapping for "${category}".`
            );
        }

        const ingredient =
            ingredients[ingredientKey];

        if (
            !ingredient ||
            typeof ingredient !== "object"
        ) {
            return error(
                "cooking_yield",
                "MISSING_INGREDIENT_CONFIG",
                `No ingredient configuration for "${ingredientKey}".`
            );
        }

        const cookingYield =
            ingredient.cooking_yield ??
            defaults.cooking_yield;

        const waterAbsorption =
            ingredient.water_absorption_factor ??
            defaults.water_absorption_factor;

        const cookingLoss =
            ingredient.cooking_loss_factor ??
            defaults.cooking_loss_factor;

        if (
            !finiteNumber(cookingYield) ||
            cookingYield <= 0
        ) {
            return error(
                "cooking_yield",
                "INVALID_COOKING_YIELD",
                `Invalid cooking yield for ${ingredientKey}.`
            );
        }

        if (
            !finiteNumber(waterAbsorption) ||
            waterAbsorption <= 0
        ) {
            return error(
                "cooking_yield",
                "INVALID_ABSORPTION_FACTOR",
                `Invalid water absorption factor for ${ingredientKey}.`
            );
        }

        if (
            !finiteNumber(cookingLoss) ||
            cookingLoss < 0 ||
            cookingLoss >= 1
        ) {
            return error(
                "cooking_yield",
                "INVALID_COOKING_LOSS",
                `Invalid cooking loss factor for ${ingredientKey}.`
            );
        }

        const effectiveYield =
            cookingYield *
            waterAbsorption *
            (1 - cookingLoss);

        if (
            !finiteNumber(effectiveYield) ||
            effectiveYield <= 0
        ) {
            return error(
                "cooking_yield",
                "INVALID_EFFECTIVE_YIELD",
                `Invalid effective yield for ${ingredientKey}.`
            );
        }

        const rawQuantity =
            cookedQuantity /
            effectiveYield;

        ingredientResults[ingredientKey] = {
            label:
                ingredient.label ||
                ingredientKey,

            category,

            cooking_yield:
                cookingYield,

            water_absorption_factor:
                waterAbsorption,

            cooking_loss_factor:
                cookingLoss,

            effective_yield:
                effectiveYield,

            required_cooked_quantity_kg:
                cookedQuantity,

            required_raw_quantity_kg:
                rawQuantity
        };

        rawByIngredient[ingredientKey] =
            (rawByIngredient[ingredientKey] || 0) +
            rawQuantity;

        totalRaw += rawQuantity;
    }

    // --------------------------------------------------
    // FINAL RESULT
    // --------------------------------------------------

    return {
        success: true,

        data_type: "synthetic",

        input: {
            meal_type: mealType,
            total_population:
                populationData.total_population
        },

        population_factor: {
            total_population:
                populationData.total_population,

            effective_population:
                effectivePopulation,

            population_factor:
                populationFactor,

            breakdown:
                populationBreakdown
        },

        portion_factor: {
            meal_type: mealType,

            portion_size_per_person_kg:
                portionSizePerPersonKg,

            required_cooked_quantity_kg:
                requiredCookedQuantityKg,

            total_required_cooked_food_kg:
                totalRequiredCooked
        },

        cooking_yield_factor: {
            ingredients:
                ingredientResults,

            raw_by_ingredient:
                rawByIngredient
        },

        final_requirements: {
            total_cooked_food_kg:
                totalRequiredCooked,

            total_raw_ingredients_kg:
                totalRaw,

            ingredients:
                rawByIngredient
        },

        formula_trace: {
            population:
                "E_g = N_g × W_g × A_g × D_g × G_g × AgeGroupFactor_g; " +
                "spread = (max_weight_band − min_weight_band) / average_weight_kg; " +
                "D_g = 1 + distribution_sensitivity × spread; " +
                "EffectivePopulation = Σ E_g; " +
                "PopulationFactor = EffectivePopulation / TotalPopulation",

            portion:
                "required_cooked_quantity_kg = effective_population × portion_size_per_person_kg",

            yield:
                "effective_yield = cooking_yield × water_absorption_factor × (1 − cooking_loss_factor); " +
                "raw_quantity = required_cooked_quantity ÷ effective_yield"
        }
    };
}