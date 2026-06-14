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
router.route('/update-quantity/:branch_id/:business_code/:product_code').patch(auth_controller.protect_owner,product_controller.updatequantity);
router.route('/delete-product/:business_code/:branch_id/:product_code').delete(auth_controller.protect_owner,product_controller.delete_product_information);


module.exports = router;