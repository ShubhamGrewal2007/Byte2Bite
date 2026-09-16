const CONFIG = {
    reference_weight_kg: 60,
    activity_multipliers: { low: .85, moderate: 1, high: 1.25 },
    distribution_sensitivity: .02,
    gender_multipliers: { male: 1, female: 1, other: 1 },
    age_group_multipliers: { children: 1, adolescents: 1, adults: 1, elderly: 1 },
    portion_sizes: {
        breakfast: { staple: .120, protein: .060, vegetable: .050, side: .030 },
        lunch: { staple: .180, protein: .090, vegetable: .080, side: .040 },
        dinner: { staple: .160, protein: .080, vegetable: .070, side: .040 }
    },
    ingredient_yields: {
        rice: { cooking_yield: .35, water_absorption_factor: 2.8, cooking_loss_factor: .05 },
        wheat_flour: { cooking_yield: .90, water_absorption_factor: 1.6, cooking_loss_factor: .05 },
        dal: { cooking_yield: .40, water_absorption_factor: 2.5, cooking_loss_factor: .05 },
        vegetables: { cooking_yield: .85, water_absorption_factor: 1, cooking_loss_factor: .10 },
        paneer: { cooking_yield: .95, water_absorption_factor: 1, cooking_loss_factor: .05 },
        soyabean: { cooking_yield: .40, water_absorption_factor: 2.5, cooking_loss_factor: .05 },
        side: { cooking_yield: .90, water_absorption_factor: 1, cooking_loss_factor: .05 }
    }
};

function round(n, d = 3) {
    const p = 10 ** d;
    return Math.round((n + Number.EPSILON) * p) / p;
}

function weightedAverage(items) {
    let sum = 0, weight = 0;
    for (const item of items) {
        const v = Number(item.value), w = Number(item.weight);
        if (Number.isFinite(v) && Number.isFinite(w) && w >= 0) { sum += v * w; weight += w; }
    }
    return weight ? sum / weight : 0;
}

function activityFactor(data) {
    if (!data) return 1;
    let sum = 0, weight = 0;
    for (const [level, p] of Object.entries(data)) {
        const w = Number(p);
        if (Number.isFinite(w) && w >= 0) {
            sum += (CONFIG.activity_multipliers[level] ?? 1) * w;
            weight += w;
        }
    }
    return weight ? sum / weight : 1;
}

function genderFactor(data) {
    if (!data) return 1;
    let sum = 0, weight = 0;
    for (const [gender, p] of Object.entries(data)) {
        const w = Number(p);
        if (Number.isFinite(w) && w >= 0) {
            sum += (CONFIG.gender_multipliers[gender] ?? 1) * w;
            weight += w;
        }
    }
    return weight ? sum / weight : 1;
}

function distributionFactor(bands) {
    if (!Array.isArray(bands) || !bands.length) return 1;
    let min = Infinity, max = -Infinity;
    const values = [];
    for (const band of bands) {
        const a = Number(band.min_kg), b = Number(band.max_kg), p = Number(band.proportion) || 0;
        if (Number.isFinite(a) && Number.isFinite(b)) {
            min = Math.min(min, a); max = Math.max(max, b);
            values.push({ value: (a + b) / 2, weight: p });
        }
    }
    const avg = weightedAverage(values);
    if (!avg || !Number.isFinite(min) || !Number.isFinite(max)) return 1;
    return 1 + CONFIG.distribution_sensitivity * ((max - min) / avg);
}

function calculateFoodRequirement(populationData, options = {}) {
    if (!Array.isArray(populationData) || !populationData.length)
        return { success: false, error: "Population data is required." };

    const meal = options.meal || "lunch";
    const staple = options.staple || "rice";
    const protein = options.protein || "dal";
    const buffer = Number(options.buffer_percent ?? 5);

    if (!CONFIG.portion_sizes[meal])
        return { success: false, error: "Invalid meal selected." };
    if (!["rice", "roti", "both"].includes(staple))
        return { success: false, error: "Invalid staple selected." };
    if (!["dal", "paneer", "soyabean"].includes(protein))
        return { success: false, error: "Invalid protein selected." };
    if (!Number.isFinite(buffer) || buffer < 0 || buffer > 100)
        return { success: false, error: "Safety buffer must be between 0 and 100%." };

    let totalPopulation = 0, effectivePopulation = 0;
    const breakdown = [];

    for (const group of populationData) {
        const population = Number(group.population ?? 0);
        const averageWeight = Number(group.average_weight_kg ?? 0);
        if (!Number.isFinite(population) || population < 0 || !Number.isFinite(averageWeight) || averageWeight <= 0) continue;

        const wf = averageWeight / CONFIG.reference_weight_kg;
        const af = activityFactor(group.activity_distribution);
        const df = distributionFactor(group.weight_bands);
        const gf = genderFactor(group.gender_distribution);
        const agf = CONFIG.age_group_multipliers[group.age_group] ?? 1;
        const effective = population * wf * af * df * gf * agf;

        totalPopulation += population;
        effectivePopulation += effective;

        breakdown.push({
            age_group: group.age_group,
            population: round(population),
            effective_population: round(effective)
        });
    }

    if (totalPopulation <= 0) return { success: false, error: "Population must be greater than zero." };

    const portions = CONFIG.portion_sizes[meal];
    const cooked = {};

    if (staple === "both") {
        cooked.rice = round(effectivePopulation * portions.staple * .5);
        cooked.roti = round(effectivePopulation * portions.staple * .5);
    } else {
        cooked[staple] = round(effectivePopulation * portions.staple);
    }

    cooked[protein] = round(effectivePopulation * portions.protein);
    cooked.vegetable = round(effectivePopulation * portions.vegetable);
    cooked.side = round(effectivePopulation * portions.side);

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
        const ingredient = ingredientMap[category];
        const y = CONFIG.ingredient_yields[ingredient];
        if (!y) return { success: false, error: "Missing yield data." };

        const effectiveYield = y.cooking_yield * y.water_absorption_factor * (1 - y.cooking_loss_factor);
        const rawQty = cookedQty / effectiveYield;

        raw[ingredient] = round((raw[ingredient] || 0) + rawQty);
        totalCooked += cookedQty;
        totalRaw += rawQty;

        details[category] = {
            ingredient,
            cooked_quantity_kg: round(cookedQty),
            raw_quantity_kg: round(rawQty),
            effective_yield: round(effectiveYield, 6)
        };
    }

    const multiplier = 1 + buffer / 100;
    const targetCooked = totalCooked * multiplier;
    const targetRaw = totalRaw * multiplier;
    const targetIngredients = {};

    for (const [ingredient, qty] of Object.entries(raw))
        targetIngredients[ingredient] = round(qty * multiplier);

    return {
        success: true,
        meal,
        staple_choice: staple,
        protein_choice: protein,
        population: {
            total_population: round(totalPopulation),
            effective_population: round(effectivePopulation),
            population_factor: round(effectivePopulation / totalPopulation, 6),
            breakdown
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
        }
    };
}

function createTestPopulation(total = 1000) {
    const groups = [
        {
            age_group: "children", population: 280, average_weight_kg: 18,
            gender_distribution: { male: .52, female: .46, other: .02 },
            weight_bands: [
                { min_kg: 10, max_kg: 15, proportion: .22 },
                { min_kg: 15, max_kg: 18, proportion: .38 },
                { min_kg: 18, max_kg: 22, proportion: .28 },
                { min_kg: 22, max_kg: 28, proportion: .12 }],
            activity_distribution: { low: .20, moderate: .55, high: .25 }
        },
        {
            age_group: "adolescents", population: 180, average_weight_kg: 45,
            gender_distribution: { male: .51, female: .47, other: .02 },
            weight_bands: [
                { min_kg: 35, max_kg: 42, proportion: .18 },
                { min_kg: 42, max_kg: 48, proportion: .34 },
                { min_kg: 48, max_kg: 55, proportion: .30 },
                { min_kg: 55, max_kg: 65, proportion: .18 }],
            activity_distribution: { low: .18, moderate: .52, high: .30 }
        },
        {
            age_group: "adults", population: 440, average_weight_kg: 62,
            gender_distribution: { male: .50, female: .48, other: .02 },
            weight_bands: [
                { min_kg: 45, max_kg: 55, proportion: .20 },
                { min_kg: 55, max_kg: 65, proportion: .32 },
                { min_kg: 65, max_kg: 75, proportion: .30 },
                { min_kg: 75, max_kg: 90, proportion: .18 }],
            activity_distribution: { low: .25, moderate: .50, high: .25 }
        },
        {
            age_group: "elderly", population: 100, average_weight_kg: 58,
            gender_distribution: { male: .47, female: .51, other: .02 },
            weight_bands: [
                { min_kg: 42, max_kg: 52, proportion: .24 },
                { min_kg: 52, max_kg: 62, proportion: .36 },
                { min_kg: 62, max_kg: 72, proportion: .28 },
                { min_kg: 72, max_kg: 85, proportion: .12 }],
            activity_distribution: { low: .45, moderate: .40, high: .15 }
        }
    ];

    const factor = total / 1000;
    return groups.map(g => ({ ...g, population: g.population * factor }));
}

function runCalculator() {
    const error = document.getElementById("error");
    error.style.display = "none";

    try {
        const result = calculateFoodRequirement(
            createTestPopulation(Number(document.getElementById("population").value)),
            {
                meal: document.getElementById("meal").value,
                staple: document.getElementById("staple").value,
                protein: document.getElementById("protein").value,
                buffer_percent: Number(document.getElementById("buffer").value)
            }
        );

        if (!result.success) {
            error.textContent = result.error;
            error.style.display = "block";
            document.getElementById("results").style.display = "none";
            return;
        }

        document.getElementById("results").style.display = "block";
        document.getElementById("totalPopulation").textContent = result.population.total_population;
        document.getElementById("effectivePopulation").textContent = result.population.effective_population;
        document.getElementById("baseCooked").textContent = result.food.total_cooked_kg + " kg";
        document.getElementById("targetCooked").textContent = result.preparation_target.cooked_food_kg + " kg";
        document.getElementById("bufferPercent").textContent = result.buffer.percent + "%";
        document.getElementById("extraCooked").textContent = result.buffer.additional_cooked_kg + " kg";
        document.getElementById("baseRaw").textContent = result.raw.total_raw_kg + " kg";
        document.getElementById("targetRaw").textContent = result.preparation_target.raw_ingredients_kg + " kg";

        const table = document.getElementById("foodTable");
        table.innerHTML = "";

        for (const [category, data] of Object.entries(result.raw.breakdown)) {
            const row = document.createElement("tr");
            row.innerHTML = "<td>" + category + "</td><td>" + data.cooked_quantity_kg.toFixed(2) + "</td><td>" + data.ingredient + "</td><td>" + data.raw_quantity_kg.toFixed(2) + "</td>";
            table.appendChild(row);
        }
    } catch (e) {
        error.textContent = "Calculator error: " + e.message;
        error.style.display = "block";
    }
}

document.getElementById("calculateBtn").addEventListener("click", runCalculator);
runCalculator();