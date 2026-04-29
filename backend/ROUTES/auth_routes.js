const express = require('express');

const router  =  express.Router();

const auth_controller = require('./../CONTROLLERS/auth_controller');

router.route('/register-customer').post(auth_controller.register_customers);
router.route('/register-owner').post(auth_controller.register_owner);
router.route('/login-owner').post(auth_controller.login_owner);
router.route('/login-customer').post(auth_controller.login_customer);

module.exports = router;