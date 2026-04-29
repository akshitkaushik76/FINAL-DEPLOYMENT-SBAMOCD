const express = require('express');

const credit_controller = require('./../CONTROLLERS/credit_controller');
const auth_controller = require('./../CONTROLLERS/auth_controller');
const router = express.Router();

router.route('/add-credit/:branchid').post(auth_controller.protect_owner,credit_controller.add_credit);
router.route('/update-credit/:credit_code').patch(auth_controller.protect_owner,credit_controller.update_credit);
router.route('/settle-credit-chunk').post(auth_controller.protect_owner,credit_controller.bulk_settle_credit);
router.route('/settle-credit/:credit_code').patch(auth_controller.protect_owner,credit_controller.settle_credit_with_code);
router.route('/get-credit/:credit_code/:branchid').get(auth_controller.protect_owner,credit_controller.get_credit);
router.route('/get-credit-status/:branchid').get(auth_controller.protect_owner,credit_controller.get_credit_by_status);
router.route('/search-customers').get(auth_controller.protect_owner, credit_controller.search_customers);

router.route('/customer-credits/:customer_code/:branchid').get(auth_controller.protect_owner, credit_controller.get_credits_by_customer);
module.exports = router;