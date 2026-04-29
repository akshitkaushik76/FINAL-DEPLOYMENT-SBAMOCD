const express = require('express');

const router = express.Router();
const branch_controller = require('./../CONTROLLERS/branch_controller');
const auth_controller = require('./../CONTROLLERS/auth_controller');
router.route('/create-branch').post(auth_controller.protect_owner,branch_controller.create_branch);
router.route('/get-profit-branch/:branch_code').get(auth_controller.protect_owner,branch_controller.get_profits_per_branch)
router.route('/get-profit-business/:business_code').get(auth_controller.protect_owner,branch_controller.get_profits_per_business);
router.route('/get-product-investment/:branchid').get(branch_controller.get_investment_per_branch)
router.route('/get-active-customer/:business_code').get(branch_controller.get_active_customer_business);
router.route('/get-branches/:business_code').get(auth_controller.protect_owner,branch_controller.get_branches)
module.exports = router;