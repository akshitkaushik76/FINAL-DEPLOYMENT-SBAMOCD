const express = require('express');

const router = express.Router();

const customer_controller = require('./../CONTROLLERS/customer_controller');
const auth_controller = require('./../CONTROLLERS/auth_controller');


router.route('/customer-payload').get(auth_controller.protect_customer,customer_controller.customer_test_payload);
router.route('/subscribe-new-business').post(auth_controller.protect_customer,customer_controller.subscribe_to_business);
router.route('/my-businesses').get(
    auth_controller.protect_customer,
    customer_controller.get_subscribed_businesses
);
router.route('/branch-products/:branchid').get(
    auth_controller.protect_customer,
    customer_controller.get_branch_products
);
router.route('/my-credits/:branchid').get(
    auth_controller.protect_customer,
    customer_controller.get_my_credits
);
router.route('/get-branches/:business_code').get(customer_controller.get_branches);
module.exports = router;