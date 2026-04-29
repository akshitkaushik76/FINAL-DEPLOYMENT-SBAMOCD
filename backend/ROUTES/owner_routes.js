const express = require('express');
const router = express.Router();
const auth_controller = require('./../CONTROLLERS/auth_controller');
const owner_controller = require('./../CONTROLLERS/owner_controller');

router.route('/test-payload').get(auth_controller.protect_owner,owner_controller.get_owner_information);
module.exports = router;