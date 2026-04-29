
const customers = require('./../MODELS/customer');
const customer_business = require('./../MODELS/customer_buisness');
const Branches = require('../MODELS/branch');
exports.customer_test_payload = async(req,res,next)=>{
    try{
       

        const customer_data = await customers.findById(req.user._id);

        res.status(200).json({
            status:'success',
            customer_data
        })
    } catch(error) {
        console.log("error occured->",error);
        res.status(500).json({
            status:'failure',
            message:error.message
        })
    }
}

exports.subscribe_to_business = async(req,res,next)=>{
    try{
        const user = req.user;
        const business_code = req.body.business_code;
        const customer_id = user._id;
        const customer_code = user.customer_code
        const data = {
            customer_id,
            business_code,
            customer_code,
            enrolled_At:new Date()
        }
        const relational_data = await customer_business.create(data);

        res.status(200).json({
            status:'success',
            relational_data
        })

    }catch(error) {
        console.log("error occured->",error);
        res.status(500).json({
            status:'failure! internal server error',
            message:error.message
        })
    }
}

exports.get_subscribed_businesses = async (req, res) => {
    try {
        const customer_code = req.user.customer_code;
        const subscriptions = await customer_business.find({ customer_code }).lean();

        if (!subscriptions.length) {
            return res.status(200).json({
                status: 'success',
                businesses: []
            });
        }

        res.status(200).json({
            status:    'success',
            businesses: subscriptions
        });
    } catch (error) {
        res.status(500).json({ status:'failure', message: error.message });
    }
};

exports.get_branches = async(req,res,next)=>{
    try{
        const business_code = req.params.business_code;

        const branches = await Branches.find({business_code});
        if(!branches || branches.length === 0) {
            throw new Error('invalid business code');
        }
        res.status(200).json({
            status:'success',
            branch_data:branches
        })
    }catch(error) {
        res.status(500).json({
            status:'failure',
            message:error.message
        })
    }
}

exports.get_branch_products = async (req, res) => {
    try {
        const { branchid } = req.params;
        const mongoose = require('mongoose');
        const product  = require('../MODELS/product');

        if (!mongoose.Types.ObjectId.isValid(branchid)) {
            return res.status(400).json({
                status:'failure', message:'invalid branch id'
            });
        }

        const products = await product.find({
            branch_id: new mongoose.Types.ObjectId(branchid)
        })
        .select('product_name product_code selling_price quantity inclusion_date')
        .lean();

        res.status(200).json({ status:'success', products });
    } catch (error) {
        res.status(500).json({ status:'failure', message: error.message });
    }
};

exports.get_my_credits = async (req, res) => {
    try {
        const customer_code = req.user.customer_code;
        const { branchid }  = req.params;
        const mongoose      = require('mongoose');
        const credit        = require('../MODELS/credit');

        const query = {
            customer_code,
            credit_state: 'ACTIVE',
        };

        if (branchid && mongoose.Types.ObjectId.isValid(branchid)) {
            query.branchid = new mongoose.Types.ObjectId(branchid);
        }

        const [unsettled, partial, settled] = await Promise.all([
            credit.find({ ...query, status:'unsettled' })
                  .select('credit_code total_amount remaining_amount amount_paid status items risk_suggestion createdAt issueDate')
                  .sort({ createdAt:-1 }).lean(),
            credit.find({ ...query, status:'partial-settled' })
                  .select('credit_code total_amount remaining_amount amount_paid status items risk_suggestion createdAt issueDate')
                  .sort({ createdAt:-1 }).lean(),
            credit.find({ ...query, status:'settled' })
                  .select('credit_code total_amount remaining_amount amount_paid status items risk_suggestion createdAt issueDate')
                  .sort({ createdAt:-1 }).lean(),
        ]);

        const total_outstanding =
            [...unsettled, ...partial].reduce((s, c) =>
                s + (c.remaining_amount || 0), 0);

        const total_credited =
            [...unsettled, ...partial, ...settled].reduce((s, c) =>
                s + (c.total_amount || 0), 0);

        // Compute overall risk from latest unsettled credit
        const latest = [...unsettled, ...partial]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
        const overall_risk = latest?.risk_suggestion?.risk_score || null;
        const overall_decision = latest?.risk_suggestion?.decision || null;

        res.status(200).json({
            status: 'success',
            total_credited,
            total_outstanding,
            overall_risk,
            overall_decision,
            unsettled_count: unsettled.length,
            partial_count:   partial.length,
            settled_count:   settled.length,
            unsettled,
            partial,
            settled,
        });
    } catch (error) {
        res.status(500).json({ status:'failure', message: error.message });
    }
};