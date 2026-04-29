const mongoose = require('mongoose');

// ── Inline schemas (no need to import your app models) ────────────────────────
const CreditTransactionSchema = new mongoose.Schema({
    credit_code:        { type: String, required: true, unique: true },
    phoneNumber:        { type: Number, required: true },
    branch_code:        { type: String, required: true },
    business_code:      { type: String, required: true },
    creditAmount:       { type: Number, required: true },
    amountPaid:         { type: Number, default: 0 },
    remainingAmount:    { type: Number, default: 0 },
    creditIssuedDate:   { type: Date, required: true },
    dueDate:            { type: Date, required: true },
    paymentStatus:      { type: String, enum: ['UNPAID', 'PARTIAL', 'PAID'], default: 'UNPAID' },
    paymentCount:       { type: Number, default: 0 },
    daysToFirstPayment: { type: Number, default: null },
    totalDaysToRepay:   { type: Number, default: null },
    delayDays:          { type: Number, default: 0 },
    wasLate:            { type: Boolean, default: false },
    wasDefault:         { type: Boolean, default: false },
    issuedDayOfWeek:    Number,
    issuedMonth:        Number,
    festivalPeriod:     Boolean,
    salaryWeek:         Boolean,
    repaymentRatio:     { type: Number, default: 0 },
    creditUtilisation:  { type: Number, default: 1 },
    lastPaymentUpdate:  Date,
    createdAt:          { type: Date, default: Date.now },
    _seeded:            { type: Boolean, default: true }
});

const ProductSaleTransactionSchema = new mongoose.Schema({
    product_code:    { type: String, required: true },
    branch_code:     { type: String, required: true },
    business_code:   { type: String, required: true },
    quantitySold:    { type: Number, required: true },
    unitPrice:       { type: Number, required: true },
    totalSaleAmount: { type: Number, required: true },
    stockBeforeSale: Number,
    stockAfterSale:  Number,
    saleDate:        { type: Date, default: Date.now },
    dayOfWeek:       Number,
    weekOfMonth:     Number,
    month:           Number,
    season:          { type: String, enum: ['WINTER', 'SUMMER', 'MONSOON'] },
    isWeekend:       Boolean,
    festivalPeriod:  Boolean,
    salaryWeek:      Boolean,
    createdAt:       { type: Date, default: Date.now },
    _seeded:         { type: Boolean, default: true }
});

const CreditTransaction     = mongoose.model('CreditTransaction',     CreditTransactionSchema);
const ProductSaleTransaction = mongoose.model('ProductSaleTransaction', ProductSaleTransactionSchema);

// ── Helpers ───────────────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/l_msme_operations'; // ← change this

function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
}

function getSeason(month) {
    if ([12, 1, 2].includes(month)) return 'WINTER';
    if ([6, 7, 8, 9].includes(month)) return 'MONSOON';
    return 'SUMMER';
}

function creditRecord({
    credit_code, phoneNumber, issuedDaysAgo, dueDaysFromIssue = 15,
    creditAmount, amountPaid, paymentCount, daysToFirstPayment,
    totalDaysToRepay, delayDays, wasLate, wasDefault,
    festivalPeriod = false, salaryWeek = false
}) {
    const issuedDate = daysAgo(issuedDaysAgo);
    const dueDate    = new Date(issuedDate); dueDate.setDate(dueDate.getDate() + dueDaysFromIssue);
    const remaining  = Math.max(creditAmount - amountPaid, 0);
    const status     = amountPaid === 0 ? 'UNPAID' : amountPaid >= creditAmount ? 'PAID' : 'PARTIAL';

    return {
        credit_code,
        phoneNumber,
        branch_code:   'SUD1-BR-1',
        business_code: 'SUD1',
        creditAmount,
        amountPaid,
        remainingAmount:    remaining,
        creditIssuedDate:   issuedDate,
        dueDate,
        paymentStatus:      status,
        paymentCount,
        daysToFirstPayment: daysToFirstPayment ?? null,
        totalDaysToRepay:   totalDaysToRepay   ?? null,
        delayDays,
        wasLate,
        wasDefault,
        issuedDayOfWeek:    issuedDate.getDay(),
        issuedMonth:        issuedDate.getMonth() + 1,
        festivalPeriod,
        salaryWeek,
        repaymentRatio:     parseFloat((amountPaid / creditAmount).toFixed(4)),
        creditUtilisation:  parseFloat((remaining  / creditAmount).toFixed(4)),
        lastPaymentUpdate:  amountPaid > 0 ? daysAgo(delayDays) : null,
        _seeded: true
    };
}

function saleRecord({ product_code, unitPrice, quantitySold, soldDaysAgo, stockBefore }) {
    const saleDate = daysAgo(soldDaysAgo);
    const month    = saleDate.getMonth() + 1;
    const dow      = saleDate.getDay();
    return {
        product_code,
        branch_code:    'SUD1-BR-1',
        business_code:  'SUD1',
        quantitySold,
        unitPrice,
        totalSaleAmount: parseFloat((unitPrice * quantitySold).toFixed(2)),
        stockBeforeSale: stockBefore,
        stockAfterSale:  stockBefore - quantitySold,
        saleDate,
        dayOfWeek:      dow,
        weekOfMonth:    Math.ceil(saleDate.getDate() / 7),
        month,
        season:         getSeason(month),
        isWeekend:      dow === 0 || dow === 6,
        festivalPeriod: [3, 10, 11, 12].includes(month),
        salaryWeek:     saleDate.getDate() <= 7,
        createdAt:      saleDate,
        _seeded:        true
    };
}

// ── CREDIT DATA ───────────────────────────────────────────────────────────────

// SANDEEP — GOOD customer: always pays on time, no defaults, low delay
const sandeepCredits = [
    creditRecord({ credit_code:'CUST-san1-01012026-1', phoneNumber:3434889850, issuedDaysAgo:109, creditAmount:500,  amountPaid:500,  paymentCount:3, daysToFirstPayment:4,  totalDaysToRepay:12, delayDays:0, wasLate:false, wasDefault:false, salaryWeek:true  }),
    creditRecord({ credit_code:'CUST-san1-15012026-2', phoneNumber:3434889850, issuedDaysAgo:95,  creditAmount:750,  amountPaid:750,  paymentCount:4, daysToFirstPayment:3,  totalDaysToRepay:10, delayDays:0, wasLate:false, wasDefault:false }),
    creditRecord({ credit_code:'CUST-san1-01022026-3', phoneNumber:3434889850, issuedDaysAgo:78,  creditAmount:400,  amountPaid:400,  paymentCount:2, daysToFirstPayment:5,  totalDaysToRepay:9,  delayDays:0, wasLate:false, wasDefault:false }),
    creditRecord({ credit_code:'CUST-san1-15022026-4', phoneNumber:3434889850, issuedDaysAgo:63,  creditAmount:600,  amountPaid:600,  paymentCount:3, daysToFirstPayment:4,  totalDaysToRepay:11, delayDays:1, wasLate:false, wasDefault:false, salaryWeek:true }),
    creditRecord({ credit_code:'CUST-san1-01032026-5', phoneNumber:3434889850, issuedDaysAgo:49,  creditAmount:800,  amountPaid:800,  paymentCount:5, daysToFirstPayment:3,  totalDaysToRepay:13, delayDays:0, wasLate:false, wasDefault:false, festivalPeriod:true }),
    creditRecord({ credit_code:'CUST-san1-15032026-6', phoneNumber:3434889850, issuedDaysAgo:35,  creditAmount:550,  amountPaid:550,  paymentCount:3, daysToFirstPayment:4,  totalDaysToRepay:10, delayDays:0, wasLate:false, wasDefault:false }),
    creditRecord({ credit_code:'CUST-san1-01042026-7', phoneNumber:3434889850, issuedDaysAgo:19,  creditAmount:700,  amountPaid:700,  paymentCount:4, daysToFirstPayment:3,  totalDaysToRepay:12, delayDays:0, wasLate:false, wasDefault:false, salaryWeek:true }),
    creditRecord({ credit_code:'CUST-san1-10042026-8', phoneNumber:3434889850, issuedDaysAgo:10,  creditAmount:300,  amountPaid:300,  paymentCount:2, daysToFirstPayment:4,  totalDaysToRepay:8,  delayDays:0, wasLate:false, wasDefault:false }),
];

// VEDANT — MEDIUM risk: sometimes late, one partial, inconsistent payments
const vedantCredits = [
    creditRecord({ credit_code:'CUST-ved1-01012026-1', phoneNumber:8451296325, issuedDaysAgo:109, creditAmount:600,  amountPaid:600,  paymentCount:4, daysToFirstPayment:8,  totalDaysToRepay:20, delayDays:5,  wasLate:true,  wasDefault:false }),
    creditRecord({ credit_code:'CUST-ved1-15012026-2', phoneNumber:8451296325, issuedDaysAgo:95,  creditAmount:800,  amountPaid:800,  paymentCount:3, daysToFirstPayment:10, totalDaysToRepay:22, delayDays:7,  wasLate:true,  wasDefault:false }),
    creditRecord({ credit_code:'CUST-ved1-01022026-3', phoneNumber:8451296325, issuedDaysAgo:78,  creditAmount:500,  amountPaid:500,  paymentCount:2, daysToFirstPayment:6,  totalDaysToRepay:15, delayDays:2,  wasLate:false, wasDefault:false }),
    creditRecord({ credit_code:'CUST-ved1-15022026-4', phoneNumber:8451296325, issuedDaysAgo:63,  creditAmount:700,  amountPaid:400,  paymentCount:2, daysToFirstPayment:12, totalDaysToRepay:null,delayDays:12, wasLate:true,  wasDefault:false }),
    creditRecord({ credit_code:'CUST-ved1-01032026-5', phoneNumber:8451296325, issuedDaysAgo:49,  creditAmount:900,  amountPaid:900,  paymentCount:5, daysToFirstPayment:7,  totalDaysToRepay:18, delayDays:4,  wasLate:true,  wasDefault:false }),
    creditRecord({ credit_code:'CUST-ved1-15032026-6', phoneNumber:8451296325, issuedDaysAgo:35,  creditAmount:450,  amountPaid:450,  paymentCount:3, daysToFirstPayment:9,  totalDaysToRepay:16, delayDays:6,  wasLate:true,  wasDefault:false }),
    creditRecord({ credit_code:'CUST-ved1-01042026-7', phoneNumber:8451296325, issuedDaysAgo:19,  creditAmount:600,  amountPaid:200,  paymentCount:1, daysToFirstPayment:14, totalDaysToRepay:null,delayDays:10, wasLate:true,  wasDefault:false }),
    creditRecord({ credit_code:'CUST-ved1-10042026-8', phoneNumber:8451296325, issuedDaysAgo:10,  creditAmount:350,  amountPaid:0,    paymentCount:0, daysToFirstPayment:null,totalDaysToRepay:null,delayDays:0,  wasLate:false, wasDefault:false }),
];

// RANBIR — HIGH risk: multiple defaults, rarely pays, very late
const ranbirCredits = [
    creditRecord({ credit_code:'CUST-ran1-01012026-1', phoneNumber:5641278459, issuedDaysAgo:109, creditAmount:700,  amountPaid:0,    paymentCount:0, daysToFirstPayment:null,totalDaysToRepay:null,delayDays:94, wasLate:true,  wasDefault:true  }),
    creditRecord({ credit_code:'CUST-ran1-15012026-2', phoneNumber:5641278459, issuedDaysAgo:95,  creditAmount:500,  amountPaid:100,  paymentCount:1, daysToFirstPayment:30, totalDaysToRepay:null,delayDays:30, wasLate:true,  wasDefault:true  }),
    creditRecord({ credit_code:'CUST-ran1-01022026-3', phoneNumber:5641278459, issuedDaysAgo:78,  creditAmount:800,  amountPaid:0,    paymentCount:0, daysToFirstPayment:null,totalDaysToRepay:null,delayDays:63, wasLate:true,  wasDefault:true  }),
    creditRecord({ credit_code:'CUST-ran1-15022026-4', phoneNumber:5641278459, issuedDaysAgo:63,  creditAmount:400,  amountPaid:400,  paymentCount:3, daysToFirstPayment:20, totalDaysToRepay:35, delayDays:20, wasLate:true,  wasDefault:false }),
    creditRecord({ credit_code:'CUST-ran1-01032026-5', phoneNumber:5641278459, issuedDaysAgo:49,  creditAmount:600,  amountPaid:0,    paymentCount:0, daysToFirstPayment:null,totalDaysToRepay:null,delayDays:34, wasLate:true,  wasDefault:true  }),
    creditRecord({ credit_code:'CUST-ran1-15032026-6', phoneNumber:5641278459, issuedDaysAgo:35,  creditAmount:750,  amountPaid:100,  paymentCount:1, daysToFirstPayment:25, totalDaysToRepay:null,delayDays:25, wasLate:true,  wasDefault:true  }),
    creditRecord({ credit_code:'CUST-ran1-01042026-7', phoneNumber:5641278459, issuedDaysAgo:19,  creditAmount:500,  amountPaid:0,    paymentCount:0, daysToFirstPayment:null,totalDaysToRepay:null,delayDays:4,  wasLate:false, wasDefault:false }),
    creditRecord({ credit_code:'CUST-ran1-10042026-8', phoneNumber:5641278459, issuedDaysAgo:10,  creditAmount:300,  amountPaid:0,    paymentCount:0, daysToFirstPayment:null,totalDaysToRepay:null,delayDays:0,  wasLate:false, wasDefault:false }),
];

// ── PRODUCT SALE DATA ─────────────────────────────────────────────────────────
// Products: doritos10(₹25), unclechips10(₹10), lays15(₹15), milk34(₹34)

const products = [
    { product_code:'doritos10',    unitPrice:25 },
    { product_code:'unclechips10', unitPrice:10 },
    { product_code:'lays15',       unitPrice:15 },
    { product_code:'milk34',       unitPrice:34 },
];

const salesData = [];
let stockTrackers = { doritos10:200, unclechips10:300, lays15:250, milk34:150 };

// Generate ~120 sale records spread over last 110 days
for (let daysBack = 110; daysBack >= 1; daysBack -= 1) {
    // 1-2 products sell each day
    const numProducts = Math.random() > 0.4 ? 2 : 1;
    const shuffled = [...products].sort(() => Math.random() - 0.5).slice(0, numProducts);

    for (const p of shuffled) {
        const qty = Math.floor(Math.random() * 8) + 1;
        if (stockTrackers[p.product_code] < qty) continue;

        salesData.push(saleRecord({
            product_code: p.product_code,
            unitPrice:    p.unitPrice,
            quantitySold: qty,
            soldDaysAgo:  daysBack,
            stockBefore:  stockTrackers[p.product_code]
        }));

        stockTrackers[p.product_code] -= qty;
    }
}

// ── SEED ──────────────────────────────────────────────────────────────────────
async function seed() {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const allCredits = [...sandeepCredits, ...vedantCredits, ...ranbirCredits];

    // Remove old seeded data for these customers only
    await CreditTransaction.deleteMany({
        phoneNumber: { $in: [3434889850, 8451296325, 5641278459] },
        _seeded: true
    });
    await ProductSaleTransaction.deleteMany({
        branch_code: 'SUD1-BR-1',
        _seeded: true
    });

    await CreditTransaction.insertMany(allCredits);
    console.log(`✅ Inserted ${allCredits.length} credit records`);

    await ProductSaleTransaction.insertMany(salesData);
    console.log(`✅ Inserted ${salesData.length} sale records`);

    await mongoose.disconnect();
    console.log('Done.');
}

seed().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});