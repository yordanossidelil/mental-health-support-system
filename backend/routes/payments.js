const express = require('express');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');
const PaymentController = require('../controllers/paymentController');

const router = express.Router();

router.post('/initialize', auth, PaymentController.initializePayment);
router.get('/verify/:tx_ref', auth, PaymentController.verifyPayment);
router.get('/', auth, PaymentController.getPayments);
router.get('/:id', auth, PaymentController.getPaymentById);
router.put('/:id/status', auth, roleAuth(['admin']), PaymentController.updatePaymentStatus);

module.exports = router;
