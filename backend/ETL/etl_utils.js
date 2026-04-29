// 
// ETL/etl_utils.js

const CreditTransaction = require('../MODELS_ML/credit_transaction');

// ─────────────────────────────────────────────────────────────
// 1. DATE NORMALIZATION (IST SAFE)
// ─────────────────────────────────────────────────────────────
function toLocalDateString(date) {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .split('T')[0];
}

// ─────────────────────────────────────────────────────────────
// 2. CUSTOM DATE PARSER (CRITICAL FIX)
// ─────────────────────────────────────────────────────────────
function parseCustomDate(dateStr) {
    // Example: "January 1, 2026, Thursday"

    try {
        const parts = dateStr.split(',');
        const datePart = parts[0] + ',' + parts[1]; // "January 1, 2026"

        const parsed = new Date(datePart.trim());

        if (isNaN(parsed)) return null;

        return new Date(
            parsed.getFullYear(),
            parsed.getMonth(),
            parsed.getDate()
        );
    } catch (err) {
        return null;
    }
}

// ─────────────────────────────────────────────────────────────
// 3. FESTIVAL CALENDAR LOADER
// ─────────────────────────────────────────────────────────────
const festivalSet = new Set();

function loadCalendar(year) {
    try {
        const cal = require(`./calendar-bharat/${year}.json`);

        Object.keys(cal[year]).forEach(monthKey => {

            const monthData = cal[year][monthKey];

            Object.keys(monthData).forEach(dateStr => {

                const entry = monthData[dateStr];

                if (
                    entry.type === 'Religional Festival' ||
                    entry.type === 'Government Holiday'
                ) {

                    const parsedDate = parseCustomDate(dateStr);

                    if (parsedDate) {
                        const normalized = toLocalDateString(parsedDate);
                        festivalSet.add(normalized);
                    }
                }
            });
        });

        console.log(`Calendar loaded for ${year}`);

    } catch (err) {
        console.warn(`Calendar for ${year} not found`);
    }
}

// preload current + next year
const currentYear = new Date().getFullYear();
loadCalendar(currentYear);
loadCalendar(currentYear + 1);

// ─────────────────────────────────────────────────────────────
// 4. FESTIVAL FLAG
// ─────────────────────────────────────────────────────────────
function getFestivalFlag(date) {
    return festivalSet.has(toLocalDateString(date));
}

// ─────────────────────────────────────────────────────────────
// 5. CALENDAR FEATURES
// ─────────────────────────────────────────────────────────────
function getCalendarFeatures(date) {

    const day = date.getDay(); // 0 = Sunday
    const month = date.getMonth() + 1;
    const dom = date.getDate();

    let season;

    if (month >= 11 || month <= 2) season = 'WINTER';
    else if (month >= 3 && month <= 6) season = 'SUMMER';
    else season = 'MONSOON';

    return {
        dayOfWeek: day,
        weekOfMonth: Math.ceil(dom / 7),
        month,
        season,
        isWeekend: day === 0 || day === 6
    };
}

// ─────────────────────────────────────────────────────────────
// 6. ADAPTIVE SALARY WEEK (ROBUST)
// ─────────────────────────────────────────────────────────────

 async function computeAdaptiveSalaryWeek(phoneNumber, business_code, date) {

    if (!phoneNumber) {
        return {
            salaryWeek: false,
            source: 'not_applicable'
        };
    }

    const past = await CreditTransaction.find({
        phoneNumber,
        business_code,
        lastPaymentUpdate: { $exists: true }
    })
    .sort({ lastPaymentUpdate: -1 })
    .limit(10)
    .lean();

    // fallback
    if (past.length < 3) {
        return {
            salaryWeek: date.getDate() <= 7,
            source: 'heuristic'
        };
    }

    // median-based learning (robust)
    const days = past
        .map(t => new Date(t.lastPaymentUpdate).getDate())
        .sort((a, b) => a - b);

    const median = days[Math.floor(days.length / 2)];

    return {
        salaryWeek: Math.abs(date.getDate() - median) <= 4,
        source: past.length >= 6 ? 'high_confidence' : 'learning',
        learnedPayDay: median
    };
}

// ─────────────────────────────────────────────────────────────
// 7. MASTER ENRICHMENT FUNCTION
// ─────────────────────────────────────────────────────────────
async function enrichTransaction(date, phoneNumber, business_code) {

    const [salaryData, festivalPeriod] = await Promise.all([
        computeAdaptiveSalaryWeek(phoneNumber, business_code, date),
        Promise.resolve(getFestivalFlag(date))
    ]);

    const calendar = getCalendarFeatures(date);

    return {
        ...calendar,

        festivalPeriod,
        salaryWeek: salaryData.salaryWeek,

        // optional debug fields (keep/remove in prod)
        _salarySource: salaryData.source,
        _learnedPayDay: salaryData.learnedPayDay || null
    };
}

// ─────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────
module.exports = {
    enrichTransaction,
    getFestivalFlag,
    getCalendarFeatures,
    computeAdaptiveSalaryWeek
};