// ============================================================
// CENTRALIZED DEMO DATA
// ============================================================
const demoData = {
    kpi: {
        expectedMeals: {
            value: 1240,
            label: 'Expected Meals',
            sub: '+2% from yesterday',
            subIcon: 'fa-arrow-up',
            icon: 'fa-users'
        },
        producedMeals: {
            value: 1210,
            label: 'Produced / Planned',
            sub: 'Optimized by AI',
            subIcon: 'fa-robot',
            icon: 'fa-utensils'
        },
        surplus: {
            value: '86 meals',
            label: 'Surplus',
            sub: '7% of production',
            subIcon: 'fa-percent',
            icon: 'fa-box-open'
        },
        wastePrevented: {
            value: '34.6 kg',
            label: 'Waste Prevented',
            sub: '≈ 82 kg CO₂e saved',
            subIcon: 'fa-leaf',
            icon: 'fa-recycle'
        }
    },

    foodFlow: [
        { label: 'Expected', value: 1240, icon: 'fa-users' },
        { label: 'Produced', value: 1210, icon: 'fa-utensils' },
        { label: 'Consumed', value: 1124, icon: 'fa-utensils' },
        { label: 'Surplus', value: 86, icon: 'fa-box-open', highlight: true },
        { label: 'Redistributed', value: 64, icon: 'fa-heart' }
    ],

    quickActions: [
        { label: 'Plan Production', icon: 'fa-calendar-plus', path: '/plan' },
        { label: 'Manage Surplus', icon: 'fa-box-open', path: '/surplus' },
        { label: 'Route Optimization', icon: 'fa-route', path: '/efficiency/route' },
        { label: 'Efficiency Monitoring', icon: 'fa-tachometer-alt', path: '/efficiency' },
        { label: 'Impact & Analytics', icon: 'fa-chart-line', path: '/impact' }
    ],

    sustainability: {
        foodWastePrevented: {
            label: 'Food waste prevented',
            value: '1,284 kg',
            icon: 'fa-apple-alt'
        },
        estimatedSavings: {
            label: 'Estimated savings',
            value: '₹72,400',
            icon: 'fa-rupee-sign'
        },
        mealsRedistributed: {
            label: 'Meals redistributed',
            value: '8,420',
            icon: 'fa-heart'
        },
        co2Avoided: {
            label: 'CO₂ avoided',
            value: '2.8 t',
            icon: 'fa-cloud'
        }
    },

    insights: [
        {
            text: 'Production exceeded demand on Tuesday.',
            detail: 'Consider reducing planned meals for similar days.',
            icon: 'fa-chart-bar'
        },
        {
            text: 'Vegetable losses are above the normal range.',
            detail: 'Check storage temperature and handling.',
            icon: 'fa-carrot'
        },
        {
            text: 'Energy use increased despite lower output.',
            detail: 'Review equipment scheduling for off-peak hours.',
            icon: 'fa-bolt'
        }
    ],

    plan: {
        demandForecast: {
            label: "Tomorrow's predicted demand",
            value: 1186,
            unit: 'meals',
            chartData: [1150, 1120, 1190, 1210, 1180, 1160, 1186]
        },

        ingredients: [
            { name: 'Rice', qty: '82 kg' },
            { name: 'Dal', qty: '34 kg' },
            { name: 'Vegetables', qty: '51 kg' },
            { name: 'Oil', qty: '12 L' },
            { name: 'Spices', qty: '4 kg' }
        ],

        viewPlanPath: '/plan'
    },

    surplus: {
        detected: 86,
        suitable: 64,

        recipients: [
            {
                name: 'Asha NGO',
                distance: '4.2 km',
                meals: 40,
                type: 'ngo'
            },
            {
                name: 'Community Kitchen',
                distance: '6.8 km',
                meals: 24,
                type: 'community'
            },
            {
                name: 'City Shelter',
                distance: '9.1 km',
                meals: 20,
                type: 'shelter'
            },
            {
                name: 'Food Bank',
                distance: '11.5 km',
                meals: 18,
                type: 'bank'
            }
        ],

        managePath: '/surplus'
    },

    route: {
        stops: [
            {
                name: 'Kitchen',
                x: 15,
                y: 65,
                type: 'kitchen'
            },
            {
                name: 'NGO',
                x: 40,
                y: 35,
                type: 'ngo'
            },
            {
                name: 'Community',
                x: 68,
                y: 55,
                type: 'community'
            },
            {
                name: 'Shelter',
                x: 88,
                y: 20,
                type: 'shelter'
            }
        ],

        stats: {
            distance: '4.2 km',
            time: '13 min',
            meals: 40,
            efficiency: '91%'
        },

        viewRoutePath: '/efficiency/route'
    },

    efficiency: {
        score: 82,
        delta: '+6%',

        chartData: {
            production: [80, 85, 82, 90, 88, 92, 82],
            waste: [12, 10, 14, 9, 11, 8, 13],
            energy: [70, 72, 68, 75, 74, 71, 69],
            machineUsage: [65, 70, 68, 72, 71, 69, 67]
        },

        tabs: [
            'Production',
            'Waste',
            'Energy',
            'Machine Usage'
        ],

        insights: [
            'Overproduction ↑ 14%',
            'Vegetable waste above baseline',
            'Energy/output ratio needs review'
        ],

        viewEfficiencyPath: '/efficiency'
    },

    impact: {
        stats: {
            foodWastePrevented: {
                value: '1,284 kg',
                label: 'Food waste prevented'
            },

            estimatedSavings: {
                value: '₹72,400',
                label: 'Estimated savings'
            },

            mealsRedistributed: {
                value: '8,420',
                label: 'Meals redistributed'
            },

            co2Avoided: {
                value: '2.8 t',
                label: 'CO₂ avoided'
            }
        },

        chartData: {
            categories: [
                'Waste',
                'Meals',
                'CO₂e',
                'Cost'
            ],

            thisMonth: [
                75,
                82,
                68,
                70
            ],

            lastMonth: [
                60,
                70,
                55,
                58
            ]
        },

        viewAnalyticsPath: '/impact'
    }
};



// ============================================================
// Task 2D — Real data loader
// Field names verified against routers/dashboard.py (DashboardSummary)
// and auth/schemas.py (UserPublic).
// ============================================================
const realState = {
    loaded: false,
    me: null,
    dashboard: null,
    error: null,
};

async function loadRealData() {
    const API = window.Byte2BiteAPI;
    try {
        const [dashboard, me] = await Promise.all([API.dashboard(), API.me()]);
        realState.dashboard = dashboard;
        realState.me = me;
        realState.loaded = true;
        realState.error = null;
        API.setUser(me);
    } catch (err) {
        realState.error = err;
        if (err && err.kind === 'auth') {
            API.handleAuthFailure();
            return;
        }
        console.warn('[Byte2Bite] Real data load failed:', err.message);
    }
}

function rerenderAll() {
    renderHeaderIdentity();
    renderKPI();
    renderFoodFlow();
    renderPreviews();
    renderSustainability();
}

// Real-data accessors — the single place field names are known.
function realDashboardNumber(key) {
    const d = realState.dashboard;
    if (!d) return null;
    const v = d[key];
    return (typeof v === 'number') ? v : null;
}

function renderHeaderIdentity() {
    const me = realState.me;
    const name = (me && me.name) ? me.name : 'Kitchen 01';
    const role = me && me.role
        ? me.role.charAt(0).toUpperCase() + me.role.slice(1).toLowerCase()
        : 'Admin';

    const h1 = document.querySelector('.greeting h1');
    if (h1) {
        const h = new Date().getHours();
        const tod = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
        h1.textContent = `Good ${tod}, ${name}!`;
    }
    const ki = document.querySelector('.kitchen-badge .kitchen-info');
    if (ki) ki.textContent = name;
    const at = document.querySelector('.admin-profile .admin-text');
    if (at) at.textContent = role;
    const av = document.querySelector('.admin-profile .avatar');
    if (av) {
        const initials = name.split(/\s+/).map(s => s[0]).filter(Boolean)
            .slice(0, 2).join('').toUpperCase();
        av.textContent = initials || 'U';
    }
    const chip = document.querySelector('.kitchen-control span');
    if (chip) chip.textContent = name;
}

window.addEventListener('byte2bite:authenticated', async () => {
    await loadRealData();
    rerenderAll();
});


// ============================================================
// NAVIGATION HELPER
// ============================================================
function navigateTo(path) {
    console.log(`Navigating to: ${path}`);
    window.location.hash = path;
}


// ============================================================
// RENDER FUNCTIONS
// ============================================================

function renderCurrentDate() {
    const el = document.getElementById('currentDate');

    const now = new Date();

    const options = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    };

    el.textContent = now.toLocaleDateString(
        'en-IN',
        options
    );
}


// ============================================================
// KPI RENDER
// ============================================================

function renderKPI() {
    const container = document.getElementById('kpiGrid');
    const kpi = demoData.kpi;

    const surplusReal = realDashboardNumber('total_surplus');
    const wasteReal   = realDashboardNumber('total_waste');

    const dbTag = ' <i class="fas fa-database" title="From database" style="font-size:.55rem;opacity:.5;"></i>';

    const c1 = kpi.expectedMeals;
    const c2 = kpi.producedMeals;

    const c3Label = 'Surplus';
    const c3Value = surplusReal !== null
        ? `${surplusReal.toLocaleString()} units`
        : kpi.surplus.value;
    const c3Sub = surplusReal !== null ? 'From database' : kpi.surplus.sub;
    const c3SubIcon = surplusReal !== null ? 'fa-database' : kpi.surplus.subIcon;
    const c3Tag = surplusReal !== null ? dbTag : '';

    const c4Label = wasteReal !== null ? 'Waste Recorded' : kpi.wastePrevented.label;
    const c4Value = wasteReal !== null
        ? `${wasteReal.toLocaleString()} units`
        : kpi.wastePrevented.value;
    const c4Sub = wasteReal !== null ? 'From database' : kpi.wastePrevented.sub;
    const c4SubIcon = wasteReal !== null ? 'fa-database' : kpi.wastePrevented.subIcon;
    const c4Tag = wasteReal !== null ? dbTag : '';

    container.innerHTML = `
        <div class="kpi-card"><div>
            <div class="kpi-label">${c1.label}</div>
            <div class="kpi-value">${c1.value.toLocaleString()}</div>
            <div class="kpi-sub"><i class="fas ${c1.subIcon}" style="color: var(--forest);"></i>
            <span>${c1.sub}</span></div>
        </div><div class="kpi-icon"><i class="fas ${c1.icon}"></i></div></div>

        <div class="kpi-card"><div>
            <div class="kpi-label">${c2.label}</div>
            <div class="kpi-value">${c2.value.toLocaleString()}</div>
            <div class="kpi-sub"><i class="fas ${c2.subIcon}" style="color: var(--sage);"></i>
            <span>${c2.sub}</span></div>
        </div><div class="kpi-icon"><i class="fas ${c2.icon}"></i></div></div>

        <div class="kpi-card"><div>
            <div class="kpi-label">${c3Label}${c3Tag}</div>
            <div class="kpi-value">${c3Value}</div>
            <div class="kpi-sub"><i class="fas ${c3SubIcon}" style="color: var(--warm-orange);"></i>
            <span>${c3Sub}</span></div>
        </div><div class="kpi-icon"><i class="fas ${kpi.surplus.icon}"></i></div></div>

        <div class="kpi-card"><div>
            <div class="kpi-label">${c4Label}${c4Tag}</div>
            <div class="kpi-value">${c4Value}</div>
            <div class="kpi-sub"><i class="fas ${c4SubIcon}" style="color: var(--forest);"></i>
            <span>${c4Sub}</span></div>
        </div><div class="kpi-icon"><i class="fas ${kpi.wastePrevented.icon}"></i></div></div>
    `;
}


// ============================================================
// FOOD FLOW
// ============================================================

function renderFoodFlow() {
    const container = document.getElementById('foodFlow');
    const base = demoData.foodFlow;

    const surplusReal = realDashboardNumber('total_surplus');
    const mealsReal   = realDashboardNumber('meals_saved');

    const steps = [
        { label: 'Expected', value: base[0].value, icon: 'fa-users' },
        { label: 'Produced', value: base[1].value, icon: 'fa-utensils' },
        { label: 'Consumed', value: base[2].value, icon: 'fa-utensils' },
        {
            label: 'Surplus',
            value: surplusReal !== null ? Math.round(surplusReal) : base[3].value,
            icon: 'fa-box-open', highlight: true,
            real: surplusReal !== null,
        },
        {
            label: 'Redistributed',
            value: mealsReal !== null ? Math.round(mealsReal) : base[4].value,
            icon: 'fa-heart',
            real: mealsReal !== null,
        },
    ];

    let html = '';
    steps.forEach((s, i) => {
        const badge = s.real
            ? ' <i class="fas fa-database" title="From database" style="font-size:.55rem;opacity:.5;"></i>'
            : '';
        html += `
            <div class="flow-step ${s.highlight ? 'highlight' : ''}">
                <div class="flow-icon"><i class="fas ${s.icon}"></i></div>
                <div class="flow-label">${s.label}${badge}</div>
                <div class="flow-value">${Number(s.value).toLocaleString()}</div>
            </div>`;
        if (i < steps.length - 1) {
            html += `<div class="flow-arrow"><i class="fas fa-arrow-right"></i></div>`;
        }
    });
    container.innerHTML = html;
}


// ============================================================
// QUICK ACTIONS
// ============================================================

function renderQuickActions() {

    const container =
        document.getElementById('quickActions');

    container.innerHTML =
        demoData.quickActions
            .map(
                action => `

                    <div
                        class="action-card"
                        data-path="${action.path}"
                        role="button"
                        tabindex="0"
                        aria-label="${action.label}"
                    >

                        <i
                            class="fas ${action.icon}"
                        ></i>

                        <span>
                            ${action.label}
                        </span>

                    </div>

                `
            )
            .join('');

    container
        .querySelectorAll('.action-card')
        .forEach(card => {

            card.addEventListener(
                'click',
                function () {

                    navigateTo(
                        this.dataset.path
                    );

                }
            );

            card.addEventListener(
                'keydown',
                function (e) {

                    if (
                        e.key === 'Enter' ||
                        e.key === ' '
                    ) {

                        e.preventDefault();

                        this.click();
                    }
                }
            );
        });
}


// ============================================================
// SUSTAINABILITY
// ============================================================

function renderSustainability() {
    const container = document.getElementById('snapshotStrip');
    const s = demoData.sustainability;

    const mealsReal = realDashboardNumber('meals_saved');
    const dbTag = ' <i class="fas fa-database" title="From database" style="font-size:.55rem;opacity:.5;"></i>';
    const mealsValue = mealsReal !== null
        ? Math.round(mealsReal).toLocaleString()
        : s.mealsRedistributed.value;

    container.innerHTML = `
        <div class="snapshot-card">
            <div class="label"><i class="fas ${s.foodWastePrevented.icon}" style="margin-right: 4px; color: var(--sage);"></i>${s.foodWastePrevented.label}</div>
            <div class="value">${s.foodWastePrevented.value}</div>
        </div>
        <div class="snapshot-card" style="border-left-color: var(--warm-orange);">
            <div class="label"><i class="fas ${s.estimatedSavings.icon}" style="margin-right: 4px; color: var(--warm-orange);"></i>${s.estimatedSavings.label}</div>
            <div class="value">${s.estimatedSavings.value}</div>
        </div>
        <div class="snapshot-card" style="border-left-color: var(--forest);">
            <div class="label"><i class="fas ${s.mealsRedistributed.icon}" style="margin-right: 4px; color: var(--forest);"></i>${s.mealsRedistributed.label}${mealsReal !== null ? dbTag : ''}</div>
            <div class="value">${mealsValue}</div>
        </div>
        <div class="snapshot-card" style="border-left-color: var(--sage);">
            <div class="label"><i class="fas ${s.co2Avoided.icon}" style="margin-right: 4px; color: var(--sage);"></i>${s.co2Avoided.label}</div>
            <div class="value">${s.co2Avoided.value}</div>
        </div>
    `;
}


// ============================================================
// AI INSIGHTS
// ============================================================

function renderInsights() {

    const container =
        document.getElementById(
            'insightList'
        );

    container.innerHTML =
        demoData.insights
            .map(
                item => `

                    <div class="insight-item">

                        <div class="insight-icon">

                            <i
                                class="fas ${item.icon}"
                            ></i>

                        </div>

                        <div class="insight-text">

                            ${item.text}

                            <small>
                                ${item.detail}
                            </small>

                        </div>

                    </div>

                `
            )
            .join('');
}


// ============================================================
// CHART HELPERS
// ============================================================

function sparkline(
    data,
    width,
    height,
    color = 'var(--forest)'
) {

    const min =
        Math.min(...data);

    const max =
        Math.max(...data);

    const range =
        max - min || 1;

    const padding = 4;

    const points =
        data
            .map(
                (v, i) => {

                    const x =
                        padding +
                        (
                            i /
                            (data.length - 1)
                        ) *
                        (
                            width -
                            2 * padding
                        );

                    const y =
                        height -
                        padding -
                        (
                            (v - min) /
                            range
                        ) *
                        (
                            height -
                            2 * padding
                        );

                    return `${x},${y}`;
                }
            )
            .join(' ');

    return `

        <svg
            viewBox="0 0 ${width} ${height}"
            preserveAspectRatio="none"
        >

            <polyline
                points="${points}"
                fill="none"
                stroke="${color}"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            />

        </svg>

    `;
}


function barChart(
    data,
    width,
    height
) {

    const maxVal =
        Math.max(
            ...data.thisMonth,
            ...data.lastMonth
        );

    const barWidth =
        (
            width - 40
        ) /
        (
            data.categories.length * 2 +
            data.categories.length * 0.5
        );

    const gap =
        barWidth * 0.5;

    let bars = '';

    data.categories.forEach(
        (cat, i) => {

            const xBase =
                30 +
                i *
                (
                    barWidth * 2 +
                    gap
                );

            const h1 =
                (
                    data.thisMonth[i] /
                    maxVal
                ) *
                (
                    height - 40
                );

            bars += `

                <rect
                    x="${xBase}"
                    y="${height - 20 - h1}"
                    width="${barWidth}"
                    height="${h1}"
                    rx="3"
                    fill="var(--forest)"
                    opacity="0.85"
                />

            `;

            const h2 =
                (
                    data.lastMonth[i] /
                    maxVal
                ) *
                (
                    height - 40
                );

            bars += `

                <rect
                    x="${xBase + barWidth + 2}"
                    y="${height - 20 - h2}"
                    width="${barWidth}"
                    height="${h2}"
                    rx="3"
                    fill="var(--sage)"
                    opacity="0.6"
                />

            `;

            bars += `

                <text
                    x="${xBase + barWidth}"
                    y="${height - 4}"
                    text-anchor="middle"
                    font-size="9"
                    fill="var(--charcoal-soft)"
                    font-family="Inter, sans-serif"
                >
                    ${cat}
                </text>

            `;
        }
    );

    return `

        <svg
            viewBox="0 0 ${width} ${height}"
            preserveAspectRatio="xMidYMid meet"
        >

            ${bars}

        </svg>

    `;
}


// ============================================================
// TEMPORARY ROUTE PREVIEW
// ============================================================

function routeMapSVG(stops) {

    const w = 300;
    const h = 150;

    let svg = `

        <svg
            viewBox="0 0 ${w} ${h}"
            preserveAspectRatio="xMidYMid meet"
        >

    `;


    // Subtle grid background

    for (
        let i = 0;
        i < 6;
        i++
    ) {

        const y =
            10 + i * 26;

        svg += `

            <line
                x1="10"
                y1="${y}"
                x2="${w - 10}"
                y2="${y}"
                stroke="rgba(0,0,0,0.035)"
                stroke-width="1"
            />

        `;
    }


    for (
        let i = 0;
        i < 8;
        i++
    ) {

        const x =
            20 + i * 38;

        svg += `

            <line
                x1="${x}"
                y1="10"
                x2="${x}"
                y2="${h - 10}"
                stroke="rgba(0,0,0,0.035)"
                stroke-width="1"
            />

        `;
    }


    // Route lines

    for (
        let i = 0;
        i < stops.length - 1;
        i++
    ) {

        const s1 =
            stops[i];

        const s2 =
            stops[i + 1];

        const x1 =
            s1.x * w / 100;

        const y1 =
            s1.y * h / 100;

        const x2 =
            s2.x * w / 100;

        const y2 =
            s2.y * h / 100;

        const isHighlight =
            i === 0;

        svg += `

            <line
                x1="${x1}"
                y1="${y1}"
                x2="${x2}"
                y2="${y2}"
                stroke="${isHighlight
                ? 'var(--warm-orange)'
                : 'var(--sage)'
            }"
                stroke-width="${isHighlight
                ? 3
                : 2
            }"
                stroke-dasharray="${isHighlight
                ? 'none'
                : '6,4'
            }"
                stroke-linecap="round"
                opacity="${isHighlight
                ? 1
                : 0.55
            }"
            />

        `;
    }


    // Stops

    stops.forEach(
        (stop, i) => {

            const cx =
                stop.x * w / 100;

            const cy =
                stop.y * h / 100;

            let fill =
                'var(--forest)';

            if (
                stop.type === 'kitchen'
            ) {

                fill =
                    'var(--warm-orange)';

            } else if (
                stop.type === 'ngo' ||
                stop.type === 'community'
            ) {

                fill =
                    'var(--sage)';

            } else if (
                stop.type === 'shelter'
            ) {

                fill =
                    'var(--forest)';
            }


            svg += `

                <circle
                    cx="${cx}"
                    cy="${cy}"
                    r="9"
                    fill="${fill}"
                    stroke="var(--white)"
                    stroke-width="2"
                />

            `;

            svg += `

                <text
                    x="${cx}"
                    y="${cy - 14}"
                    text-anchor="middle"
                    font-size="7"
                    font-weight="600"
                    fill="var(--charcoal)"
                    font-family="Inter, sans-serif"
                >
                    ${stop.name}
                </text>

            `;

            svg += `

                <text
                    x="${cx}"
                    y="${cy + 3}"
                    text-anchor="middle"
                    font-size="8"
                    font-weight="700"
                    fill="var(--white)"
                    font-family="Inter, sans-serif"
                >
                    ${i + 1}
                </text>

            `;
        }
    );


    svg += `</svg>`;

    return svg;
}


// ============================================================
// RENDER PREVIEW PANELS
// ============================================================

function renderPreviews() {

    const container =
        document.getElementById(
            'previewGrid'
        );

    const plan =
        demoData.plan;

    const surplus =
        demoData.surplus;

    const route =
        demoData.route;

    const efficiency =
        demoData.efficiency;

    const impact =
        demoData.impact;

    // Task 2D: honest disclosure that Plan/Route/Efficiency are demo.
    const demoNotice = realState.dashboard
        ? `<div style="grid-column:1/-1;font-size:.72rem;color:var(--charcoal-soft);
             background:var(--warm-orange-soft);padding:8px 14px;border-radius:12px;margin-bottom:-6px;">
             <i class="fas fa-circle-info" style="color:var(--warm-orange);margin-right:6px;"></i>
             Plan, Route, and Efficiency previews use demo data — real versions ship with the AI and OSM modules (later tasks).
           </div>`
        : '';

    const planSparkline =
        sparkline(
            plan.demandForecast.chartData,
            200,
            45,
            'var(--forest)'
        );


    const effChartData =
        efficiency
            .chartData
            .production;


    const effChart =
        sparkline(
            effChartData,
            300,
            80,
            'var(--forest)'
        );


    const impactChart =
        barChart(
            impact.chartData,
            280,
            90
        );


    container.innerHTML = demoNotice + `

        <!-- ====================================================
             1. PLAN
             ==================================================== -->

        <div class="preview-card">

            <div class="preview-header">

                <h3>

                    <i
                        class="fas fa-calendar-alt"
                    ></i>

                    Plan

                </h3>

                <span class="preview-badge">
                    Preview
                </span>

            </div>


            <div class="plan-stats">

                <div class="plan-stat">

                    <div class="label">
                        ${plan.demandForecast.label}
                    </div>

                    <div class="value">

                        ${plan.demandForecast.value.toLocaleString()}

                        <small>
                            ${plan.demandForecast.unit}
                        </small>

                    </div>

                </div>

            </div>


            <div class="mini-chart">
                ${planSparkline}
            </div>


            <div>

                <div
                    style="
                        font-size:0.68rem;
                        font-weight:600;
                        color:var(--charcoal-soft);
                        text-transform:uppercase;
                        letter-spacing:0.03em;
                        margin-bottom:4px;
                    "
                >
                    Ingredient Requirements
                </div>


                <div class="ingredient-list">

                    ${plan.ingredients.map(
        ing => `

                            <div class="ingredient-item">

                                <span class="name">
                                    ${ing.name}
                                </span>

                                <span class="qty">
                                    ${ing.qty}
                                </span>

                            </div>

                        `
    ).join('')}

                </div>

            </div>


            <button
                class="preview-btn"
                data-path="${plan.viewPlanPath}"
            >

                View Production Plan

                <i
                    class="fas fa-arrow-right"
                ></i>

            </button>

        </div>


        <!-- ====================================================
             2. SURPLUS & REDISTRIBUTION
             ==================================================== -->

        <div class="preview-card">

            <div class="preview-header">

                <h3>

                    <i
                        class="fas fa-box-open"
                    ></i>

                    Surplus & Redistribution

                </h3>

                <span class="preview-badge">
                    Preview
                </span>

            </div>


            <div class="surplus-stats">

                <div class="surplus-stat">

                    <div class="value">
                        ${(function(){ const v = realDashboardNumber('total_surplus'); return v !== null ? Math.round(v) : surplus.detected; })()} meals
                    </div>

                    <div class="label">
                        Surplus detected${realDashboardNumber('total_surplus') !== null ? ' <i class="fas fa-database" title="From database" style="font-size:.55rem;opacity:.5;"></i>' : ''}
                    </div>

                </div>


                <div class="surplus-stat">

                    <div class="value">
                        ${surplus.suitable} meals
                    </div>

                    <div class="label">
                        Suitable for redistribution
                    </div>

                </div>

            </div>


            <div>

                <div
                    style="
                        font-size:0.68rem;
                        font-weight:600;
                        color:var(--charcoal-soft);
                        text-transform:uppercase;
                        letter-spacing:0.03em;
                        margin-bottom:4px;
                    "
                >
                    Nearby Recipients
                </div>


                <div class="recipient-list">

                    ${surplus.recipients.map(
        r => `

                            <div class="recipient-item">

                                <i
                                    class="fas ${r.type === 'ngo'
                ? 'fa-heart'
                : r.type === 'community'
                    ? 'fa-utensils'
                    : r.type === 'shelter'
                        ? 'fa-home'
                        : 'fa-box'
            }"
                                ></i>

                                <span class="name">
                                    ${r.name}
                                </span>

                                <span class="distance">
                                    ${r.distance}
                                </span>

                                <span class="meals">
                                    ${r.meals}
                                </span>

                            </div>

                        `
    ).join('')}

                </div>

            </div>


            <button
                class="preview-btn"
                data-path="${surplus.managePath}"
            >

                Manage Surplus

                <i
                    class="fas fa-arrow-right"
                ></i>

            </button>

        </div>


        <!-- ====================================================
             3. ROUTE OPTIMIZATION
             ==================================================== -->

        <div class="preview-card">

            <div class="preview-header">

                <h3>

                    <i
                        class="fas fa-route"
                    ></i>

                    Route Optimization

                </h3>

                <span class="preview-badge">
                    Preview
                </span>

            </div>


            <div class="route-map">

                ${routeMapSVG(
        route.stops
    )}

            </div>


            <div class="route-stats">

                <div class="route-stat">

                    <div class="label">
                        Distance
                    </div>

                    <div class="value">
                        ${route.stats.distance}
                    </div>

                </div>


                <div class="route-stat">

                    <div class="label">
                        Time
                    </div>

                    <div class="value">
                        ${route.stats.time}
                    </div>

                </div>


                <div class="route-stat">

                    <div class="label">
                        Meals
                    </div>

                    <div class="value">
                        ${route.stats.meals}
                    </div>

                </div>


                <div class="route-stat">

                    <div class="label">
                        Efficiency
                    </div>

                    <div class="value">
                        ${route.stats.efficiency}
                    </div>

                </div>

            </div>


            <button
                class="preview-btn outline"
                data-path="${route.viewRoutePath}"
            >

                View Full Route

                <i
                    class="fas fa-arrow-right"
                ></i>

            </button>

        </div>


        <!-- ====================================================
             4. EFFICIENCY MONITORING
             ==================================================== -->

        <div class="preview-card">

            <div class="preview-header">

                <h3>

                    <i
                        class="fas fa-tachometer-alt"
                    ></i>

                    Efficiency Monitoring

                </h3>

                <span class="preview-badge">
                    Preview
                </span>

            </div>


            <div class="efficiency-score">

                <div class="score">

                    ${efficiency.score}

                    <small>
                        / 100
                    </small>

                </div>


                <div class="delta">
                    ${efficiency.delta}
                </div>

            </div>


            <div class="chart-tabs">

                ${efficiency.tabs.map(
        (tab, i) => `

                        <button
                            class="chart-tab ${i === 0
                ? 'active'
                : ''
            }"
                            data-chart="${tab
                .toLowerCase()
                .replace(/\s+/g, '')}"
                        >

                            ${tab}

                        </button>

                    `
    ).join('')}

            </div>


            <div
                class="chart-container"
                id="efficiencyChart"
            >

                ${effChart}

            </div>


            <div class="efficiency-insights">

                <div
                    style="
                        font-size:0.65rem;
                        font-weight:600;
                        color:var(--warm-orange);
                        text-transform:uppercase;
                        letter-spacing:0.03em;
                        margin-bottom:2px;
                    "
                >
                    Demo AI Insights
                </div>


                ${efficiency.insights.map(
        insight => `

                        <div class="efficiency-insight">

                            <i
                                class="fas fa-circle"
                            ></i>

                            <span>
                                ${insight}
                            </span>

                        </div>

                    `
    ).join('')}

            </div>


            <button
                class="preview-btn"
                data-path="${efficiency.viewEfficiencyPath}"
            >

                View Efficiency

                <i
                    class="fas fa-arrow-right"
                ></i>

            </button>

        </div>


        <!-- ====================================================
             5. IMPACT & ANALYTICS
             ==================================================== -->

        <div class="preview-card full-width">

            <div class="preview-header">

                <h3>

                    <i
                        class="fas fa-chart-line"
                    ></i>

                    Impact & Analytics

                </h3>

                <span class="preview-badge">
                    Preview
                </span>

            </div>


            <div class="impact-stats">

                <div class="impact-stat">

                    <div class="value">
                        ${impact.stats.foodWastePrevented.value}
                    </div>

                    <div class="label">
                        ${impact.stats.foodWastePrevented.label}
                    </div>

                </div>


                <div class="impact-stat">

                    <div class="value">
                        ${impact.stats.estimatedSavings.value}
                    </div>

                    <div class="label">
                        ${impact.stats.estimatedSavings.label}
                    </div>

                </div>


                <div class="impact-stat">

                    <div class="value">
                        ${(function(){ const v = realDashboardNumber('meals_saved'); return v !== null ? Math.round(v).toLocaleString() : impact.stats.mealsRedistributed.value; })()}
                    </div>

                    <div class="label">
                        ${impact.stats.mealsRedistributed.label}${realDashboardNumber('meals_saved') !== null ? ' <i class="fas fa-database" title="From database" style="font-size:.55rem;opacity:.5;"></i>' : ''}
                    </div>

                </div>


                <div class="impact-stat">

                    <div class="value">
                        ${impact.stats.co2Avoided.value}
                    </div>

                    <div class="label">
                        ${impact.stats.co2Avoided.label}
                    </div>

                </div>

            </div>


            <div>

                <div
                    style="
                        font-size:0.68rem;
                        font-weight:600;
                        color:var(--charcoal-soft);
                        text-transform:uppercase;
                        letter-spacing:0.03em;
                        margin-bottom:4px;
                    "
                >
                    This Month vs Last Month
                </div>


                <div class="impact-chart">

                    ${impactChart}

                </div>

            </div>


            <button
                class="preview-btn"
                data-path="${impact.viewAnalyticsPath}"
            >

                View Analytics

                <i
                    class="fas fa-arrow-right"
                ></i>

            </button>

        </div>

    `;


    // ========================================================
    // PREVIEW BUTTON LISTENERS
    // ========================================================

    container
        .querySelectorAll('.preview-btn')
        .forEach(btn => {

            btn.addEventListener(
                'click',
                function () {

                    navigateTo(
                        this.dataset.path
                    );

                }
            );

        });


    // ========================================================
    // EFFICIENCY CHART TABS
    // ========================================================

    container
        .querySelectorAll('.chart-tab')
        .forEach(tab => {

            tab.addEventListener(
                'click',
                function () {

                    this.parentElement
                        .querySelectorAll('.chart-tab')
                        .forEach(
                            t =>
                                t.classList.remove(
                                    'active'
                                )
                        );

                    this.classList.add(
                        'active'
                    );


                    const chartType =
                        this.dataset.chart;

                    const chartContainer =
                        document.getElementById(
                            'efficiencyChart'
                        );


                    let data;


                    if (
                        chartType ===
                        'production'
                    ) {

                        data =
                            efficiency
                                .chartData
                                .production;

                    } else if (
                        chartType ===
                        'waste'
                    ) {

                        data =
                            efficiency
                                .chartData
                                .waste;

                    } else if (
                        chartType ===
                        'energy'
                    ) {

                        data =
                            efficiency
                                .chartData
                                .energy;

                    } else if (
                        chartType ===
                        'machineusage'
                    ) {

                        data =
                            efficiency
                                .chartData
                                .machineUsage;
                    }


                    if (data) {

                        chartContainer.innerHTML =
                            sparkline(
                                data,
                                300,
                                80,
                                'var(--forest)'
                            );

                    }

                }
            );

        });
}


// ============================================================
// SIDEBAR & UI INTERACTIONS
// ============================================================

const sidebar =
    document.getElementById(
        'sidebar'
    );

const menuToggle =
    document.getElementById(
        'menuToggle'
    );

const overlay =
    document.getElementById(
        'overlay'
    );

const collapseBtn =
    document.getElementById(
        'collapseBtn'
    );

const collapseIcon =
    document.getElementById(
        'collapseIcon'
    );

const collapseText =
    document.getElementById(
        'collapseText'
    );


// ============================================================
// SIDEBAR COLLAPSE
// ============================================================

collapseBtn.addEventListener(
    'click',
    function () {

        sidebar.classList.toggle(
            'collapsed'
        );


        if (
            sidebar.classList.contains(
                'collapsed'
            )
        ) {

            collapseIcon.className =
                'fas fa-chevron-right';

            collapseText.textContent =
                'Expand';

        } else {

            collapseIcon.className =
                'fas fa-chevron-left';

            collapseText.textContent =
                'Collapse';
        }

    }
);


// ============================================================
// MOBILE MENU
// ============================================================

menuToggle.addEventListener(
    'click',
    function () {

        sidebar.classList.add(
            'mobile-open'
        );

        overlay.classList.add(
            'active'
        );

    }
);


overlay.addEventListener(
    'click',
    function () {

        sidebar.classList.remove(
            'mobile-open'
        );

        overlay.classList.remove(
            'active'
        );

    }
);


// ============================================================
// NAVIGATION ITEMS
// ============================================================

document
    .querySelectorAll('.nav-item')
    .forEach(item => {

        item.addEventListener(
            'click',
            function () {

                if (
                    window.innerWidth <= 900
                ) {

                    sidebar.classList.remove(
                        'mobile-open'
                    );

                    overlay.classList.remove(
                        'active'
                    );
                }


                document
                    .querySelectorAll(
                        '.nav-item'
                    )
                    .forEach(
                        n =>
                            n.classList.remove(
                                'active'
                            )
                    );


                this.classList.add(
                    'active'
                );

            }
        );

    });


// ============================================================
// NOTIFICATIONS
// ============================================================

const notificationBtn =
    document.getElementById(
        'notificationBtn'
    );

const notificationPanel =
    document.getElementById(
        'notificationPanel'
    );


notificationBtn.addEventListener(
    'click',
    function (e) {

        e.stopPropagation();

        notificationPanel.classList.toggle(
            'open'
        );

    }
);


document.addEventListener(
    'click',
    function (e) {

        if (
            !notificationPanel.contains(
                e.target
            ) &&
            e.target !==
            notificationBtn &&
            !notificationBtn.contains(
                e.target
            )
        ) {

            notificationPanel.classList.remove(
                'open'
            );
        }

    }
);


// ============================================================
// ESCAPE KEY
// ============================================================

document.addEventListener(
    'keydown',
    function (e) {

        if (
            e.key === 'Escape'
        ) {

            notificationPanel.classList.remove(
                'open'
            );

            sidebar.classList.remove(
                'mobile-open'
            );

            overlay.classList.remove(
                'active'
            );

        }

    }
);


// ============================================================
// INITIAL RENDER
// ============================================================
renderCurrentDate();
renderHeaderIdentity();
renderKPI();
renderFoodFlow();
renderPreviews();
renderQuickActions();
renderSustainability();
renderInsights();

setInterval(renderCurrentDate, 60000);

// ============================================================
// Task 2D bootstrap: if we already have a token, load real data.
// If not, auth-ui.js already opened the login overlay; the
// 'byte2bite:authenticated' event will trigger the same load.
// ============================================================
(async function bootstrap() {
    const API = window.Byte2BiteAPI;
    if (!API) return;
    if (API.getToken()) {
        await loadRealData();
        rerenderAll();
    }
})();
