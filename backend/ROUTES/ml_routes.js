// ROUTES/ml_routes.js
const express        = require('express');
const router         = express.Router();
const mlService      = require('../SERVICES/mlService');
const { protect_owner } = require('../CONTROLLERS/auth_controller');
const { requireDemandModel, requireCreditModel } = require('../MIDDLEWARE/mlProxy');

// ── ALL ML ROUTES REQUIRE OWNER AUTH ─────────────────────────

// ── TRAINING ─────────────────────────────────────────────────

// Owner triggers demand model training for their branch
router.post('/demand/train', protect_owner, async (req, res) => {
    try {
        const { branch_code } = req.body;
        const business_code   = req.user.business_code;

        if (!branch_code) {
            return res.status(400).json({
                status:  'failure',
                message: 'branch_code is required'
            });
        }

        const result = await mlService.trainDemandModel(branch_code, business_code);
        return res.status(200).json({
            status:       'success',
            message:      `Demand model trained for branch ${branch_code}`,
            branch_code,
            business_code,
            model_metrics: result.metrics
        });
    } catch (err) {
        if (err.code === 'ECONNREFUSED') {
            return res.status(503).json({
                status:  'failure',
                message: 'ML service unavailable'
            });
        }
        return res.status(500).json({
            status:  'failure',
            message: err.response?.data?.detail || err.message
        });
    }
});

// Owner triggers credit model training for their branch
router.post('/credit/train', protect_owner, async (req, res) => {
    try {
        const { branch_code } = req.body;
        const business_code   = req.user.business_code;

        if (!branch_code) {
            return res.status(400).json({
                status:  'failure',
                message: 'branch_code is required'
            });
        }

        const result = await mlService.trainCreditModel(branch_code, business_code);
        return res.status(200).json({
            status:        'success',
            message:       `Credit model trained for branch ${branch_code}`,
            branch_code,
            business_code,
            model_metrics: result.metrics
        });
    } catch (err) {
        if (err.code === 'ECONNREFUSED') {
            return res.status(503).json({
                status:  'failure',
                message: 'ML service unavailable'
            });
        }
        return res.status(500).json({
            status:  'failure',
            message: err.response?.data?.detail || err.message
        });
    }
});

// ── STATUS ────────────────────────────────────────────────────

// Check if models are trained for a branch
router.get('/status', protect_owner, async (req, res) => {
    try {
        const { branch_code } = req.query;
        if (!branch_code) {
            return res.status(400).json({
                status:  'failure',
                message: 'branch_code is required'
            });
        }
        const [demandStatus, creditStatus] = await Promise.all([
            mlService.getDemandModelStatus(branch_code),
            mlService.getCreditModelStatus(branch_code)
        ]);
        return res.status(200).json({
            status:      'success',
            branch_code,
            demand_model: demandStatus,
            credit_model: creditStatus
        });
    } catch (err) {
        return res.status(500).json({
            status:  'failure',
            message: err.message
        });
    }
});

// ── DEMAND PREDICTIONS ────────────────────────────────────────

// Get restock recommendations — requires trained model
router.get('/demand/restock',
    protect_owner,
    requireDemandModel,
    async (req, res) => {
        try {
            const branch_code = req.query.branch_code;
            const days        = parseInt(req.query.days) || 7;
            const result      = await mlService.getRestock(branch_code, days);
            return res.status(200).json({
                status: 'success',
                data:   result
            });
        } catch (err) {
            return res.status(500).json({
                status:  'failure',
                message: err.response?.data?.detail || err.message
            });
        }
    }
);

// ── CREDIT PREDICTIONS ────────────────────────────────────────

// Get high risk credits for a branch
// router.get('/credit/high-risk',
//     protect_owner,
//     requireCreditModel,
//     async (req, res) => {
//         try {
//             const branch_code = req.query.branch_code;
//             const threshold   = parseFloat(req.query.threshold) || 0.65;
//             const result      = await mlService.getHighRisk(branch_code, threshold);
//             return res.status(200).json({
//                 status: 'success',
//                 data:   result
//             });
//         } catch (err) {
//             return res.status(500).json({
//                 status:  'failure',
//                 message: err.response?.data?.detail || err.message
//             });
//         }
//     }
// );

router.get('/credit/high-risk',
    protect_owner,
    requireCreditModel,
    async (req, res) => {
        try {
            const branch_code = req.query.branch_code;
            const threshold   = parseFloat(req.query.threshold) || 0.65;

            // Get risk scores from ML
            const result     = await mlService.getHighRisk(branch_code, threshold);
            const rawCredits = result?.high_risk_credits || [];

            if (rawCredits.length === 0) {
                return res.status(200).json({
                    status: 'success',
                    data:   { ...result, high_risk_credits: [] }
                });
            }

            const Credit   = require('../MODELS/credit');
            const Customer = require('../MODELS/customer');

            // ── Strategy: ML gives us credit_codes + risk scores ──
            // We fetch all real data from our own credit collection
            const creditCodes = rawCredits
                .map(c => c.credit_code)
                .filter(Boolean);

            // Fetch real credit documents
            const creditDocs = await Credit.find({
                credit_code: { $in: creditCodes },
                credit_state: 'ACTIVE'
            })
            .select('credit_code customer_code total_amount remaining_amount amount_paid status items')
            .lean();

            const creditMap = new Map(
                creditDocs.map(c => [c.credit_code, c])
            );

            // Get unique customer codes
            const customerCodes = [...new Set(
                creditDocs.map(c => c.customer_code).filter(Boolean)
            )];

            // Fetch customer details
            const customerDocs = await Customer.find({
                customer_code: { $in: customerCodes }
            })
            .select('customer_code customer_name customer_phonenumber customer_email')
            .lean();

            const customerMap = new Map(
                customerDocs.map(c => [c.customer_code, c])
            );

            // ── Merge ML risk scores with real credit data ──────────
            const enriched = rawCredits
                .map(mlCredit => {
                    const realCredit = creditMap.get(mlCredit.credit_code);
                    if (!realCredit) return null; // skip if not in real DB

                    const customer = customerMap.get(realCredit.customer_code) || {};

                    return {
                        // Credit info from real DB
                        credit_code:      mlCredit.credit_code,
                        customer_code:    realCredit.customer_code || "—",
                        customer_name:    customer.customer_name   || "—",
                        customer_phone:   customer.customer_phonenumber || "—",
                        customer_email:   customer.customer_email  || "—",
                        total_amount:     realCredit.total_amount   || 0,
                        remaining_amount: realCredit.remaining_amount || 0,
                        amount_paid:      realCredit.amount_paid    || 0,
                        status:           realCredit.status         || "—",
                        items:            realCredit.items          || [],

                        // Risk scores from ML
                        risk_score:       mlCredit.risk_score,
                        risk_label:       mlCredit.risk_label,
                        branch_code:      mlCredit.branch_code,
                    };
                })
                .filter(Boolean) // remove nulls (credits not in real DB)
                .sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0));

            return res.status(200).json({
                status: 'success',
                data: {
                    threshold,
                    branch_code,
                    count:             enriched.length,
                    high_risk_credits: enriched,
                }
            });

        } catch (err) {
            return res.status(500).json({
                status:  'failure',
                message: err.response?.data?.detail || err.message
            });
        }
    }
);

// Pre-check before issuing credit to a customer
// Called internally by credit_controller.js before issueCredit
router.post('/credit/precheck',
    protect_owner,
    requireCreditModel,
    async (req, res) => {
        try {
            const { branch_code, phoneNumber,
                    customer_code, creditAmount } = req.body;

            // Validate — need customer identifier
            if (!phoneNumber && !customer_code) {
                return res.status(400).json({
                    status:  'failure',
                    message: 'Either phoneNumber or customer_code is required'
                });
            }
            if (!creditAmount) {
                return res.status(400).json({
                    status:  'failure',
                    message: 'creditAmount is required'
                });
            }

            const result = await mlService.precheckCredit(req.body);
            return res.status(200).json({
                status: 'success',
                data:   result
            });
        } catch (err) {
            return res.status(500).json({
                status:  'failure',
                message: err.response?.data?.detail || err.message
            });
        }
    }
);

module.exports = router;