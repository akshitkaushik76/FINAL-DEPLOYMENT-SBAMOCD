const express = require('express');
const sales_controller = require('./../CONTROLLERS/sales_controller');
const auth_controller = require('./../CONTROLLERS/auth_controller');
const router = express.Router();

router.route('/add-sales/:branch_code/:branch_id').post(sales_controller.add_sales);

router.route('/get-sales/:branch_code')
    .get(auth_controller.protect_owner, sales_controller.get_sales);

router.route('/search-products/:branchid')
    .get(auth_controller.protect_owner, sales_controller.search_products);

module.exports = router;