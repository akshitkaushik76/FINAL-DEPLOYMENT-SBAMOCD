// MIDDLEWARE/mlProxy.js
const mlService = require('../SERVICES/mlService');

// Checks that a trained model exists for this branch
// before allowing access to prediction routes
const requireDemandModel = async (req, res, next) => {
    try {
        const branch_code = req.query.branch_code || req.body.branch_code;
        if (!branch_code) {
            return res.status(400).json({
                status: 'failure',
                message: 'branch_code is required'
            });
        }

        const status = await mlService.getDemandModelStatus(branch_code);

        if (!status.model_exists) {
            return res.status(400).json({
                status: 'failure',
                message: `No trained demand model found for branch ${branch_code}. Please call POST /ml/demand/train first.`,
                branch_code
            });
        }
        next();
    } catch (err) {
        // If FastAPI is down
        if (err.code === 'ECONNREFUSED') {
            return res.status(503).json({
                status: 'failure',
                message: 'ML service is unavailable. Please try again later.'
            });
        }
        return res.status(500).json({
            status: 'failure',
            message: err.message
        });
    }
};

const requireCreditModel = async (req, res, next) => {
    try {
        // For POST routes branch_code comes from body, for GET from query
        const branch_code = req.body?.branch_code || req.query?.branch_code;

        if (!branch_code) {
            return res.status(400).json({
                status:  'failure',
                message: 'branch_code is required'
            });
        }

        const status = await mlService.getCreditModelStatus(branch_code);

        if (!status.model_exists) {
            return res.status(400).json({
                status:  'failure',
                message: `No trained credit model found for branch ${branch_code}. Call POST /ml/credit/train first.`,
                branch_code
            });
        }
        next();
    } catch (err) {
        if (err.code === 'ECONNREFUSED') {
            return res.status(503).json({
                status:  'failure',
                message: 'ML service is unavailable. Please try again later.'
            });
        }
        return res.status(500).json({
            status:  'failure',
            message: err.message
        });
    }
};

module.exports = { requireDemandModel, requireCreditModel };