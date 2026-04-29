const express = require('express');

const router = express.Router();
const product_controller = require('./../CONTROLLERS/product_controller')
const auth_controller = require('../CONTROLLERS/auth_controller');
router.route('/add-product/:branchid').post(product_controller.add_product);

router.route('/update-product/:branchid/:productcode').patch(product_controller.update_product_information);
router.route('/get-products/:branchid').get(
    auth_controller.protect_owner,
    product_controller.get_products
);


module.exports = router;