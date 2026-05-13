const axios = require('axios');
const Payment = require('../models/Payment');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { notify } = require('../services/notificationService');
const { sendEmail } = require('../services/emailService');

const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;
const CHAPA_BASE_URL = process.env.CHAPA_BASE_URL || 'https://api.chapa.co/v1';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

class PaymentController {
  // Initialize Chapa payment
  static async initializePayment(req, res) {
    try {
      const { appointmentId } = req.body;

      const appointment = await Appointment.findById(appointmentId).populate('therapistId');
      if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

      if (appointment.clientId.toString() !== req.user._id.toString())
        return res.status(403).json({ message: 'Access denied' });

      if (appointment.paymentStatus === 'paid')
        return res.status(400).json({ message: 'Appointment already paid' });

      const user = await User.findById(req.user._id);
      const amount = appointment.therapistId?.hourlyRate || 500;
      const txRef = `MBR-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      // Create pending payment record
      const payment = await Payment.create({
        userId: req.user._id,
        appointmentId,
        therapistId: appointment.therapistId?._id,
        amount,
        currency: 'ETB',
        paymentMethod: 'Telebirr',
        status: 'pending',
        chapaRef: txRef,
        description: `Session on ${new Date(appointment.date).toDateString()}`,
      });

      const [firstName, ...rest] = (user.name || 'Client User').split(' ');

      // Call Chapa initialize
      const chapaRes = await axios.post(
        `${CHAPA_BASE_URL}/transaction/initialize`,
        {
          amount: amount.toString(),
          currency: 'ETB',
          email: user.email,
          first_name: firstName,
          last_name: rest.join(' ') || 'User',
          tx_ref: txRef,
          callback_url: `${FRONTEND_URL}/client/payment/success?tx_ref=${txRef}`,
          return_url: `${FRONTEND_URL}/client/payment/success?tx_ref=${txRef}`,
          customization: {
            title: 'MindBridge Session Payment',
            description: payment.description,
          },
        },
        { headers: { Authorization: `Bearer ${CHAPA_SECRET_KEY}` } }
      );

      res.json({
        checkout_url: chapaRes.data.data.checkout_url,
        txRef,
        paymentId: payment._id,
      });
    } catch (error) {
      console.error('Chapa init error:', error.response?.data || error.message);
      res.status(500).json({ message: 'Failed to initialize payment', error: error.response?.data || error.message });
    }
  }

  // Verify Chapa payment (called after redirect)
  static async verifyPayment(req, res) {
    try {
      const { tx_ref } = req.params;

      const chapaRes = await axios.get(
        `${CHAPA_BASE_URL}/transaction/verify/${tx_ref}`,
        { headers: { Authorization: `Bearer ${CHAPA_SECRET_KEY}` } }
      );

      const chapaData = chapaRes.data.data;
      const isSuccess = chapaData.status === 'success';

      const payment = await Payment.findOne({ chapaRef: tx_ref });
      if (!payment) return res.status(404).json({ message: 'Payment record not found' });

      payment.status = isSuccess ? 'paid' : 'failed';
      payment.transactionId = chapaData.reference || tx_ref;
      payment.paymentDetails = chapaData;
      await payment.save();

      if (isSuccess) {
        await Appointment.findByIdAndUpdate(payment.appointmentId, { paymentStatus: 'paid' });

        const user = await User.findById(payment.userId);
        await notify(payment.userId, `Payment of ${payment.amount} ETB successful`, 'payment_success', payment._id);
        sendEmail(user.email, 'paymentConfirmation', {
          name: user.name,
          amount: payment.amount,
          transactionId: payment.transactionId,
        });
      }

      const populated = await Payment.findById(payment._id).populate('appointmentId');
      res.json({ success: isSuccess, payment: populated });
    } catch (error) {
      console.error('Chapa verify error:', error.response?.data || error.message);
      res.status(500).json({ message: 'Verification failed', error: error.response?.data || error.message });
    }
  }

  // Get user payments
  static async getPayments(req, res) {
    try {
      const query = req.user.role === 'admin' ? {} : { userId: req.user._id };
      const payments = await Payment.find(query).populate('appointmentId').sort({ createdAt: -1 });
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get payments', error: error.message });
    }
  }

  // Get payment by ID
  static async getPaymentById(req, res) {
    try {
      const payment = await Payment.findById(req.params.id).populate('appointmentId');
      if (!payment) return res.status(404).json({ message: 'Payment not found' });

      if (payment.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin')
        return res.status(403).json({ message: 'Access denied' });

      res.json(payment);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get payment', error: error.message });
    }
  }

  // Admin: update payment status
  static async updatePaymentStatus(req, res) {
    try {
      const payment = await Payment.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true }
      ).populate('appointmentId');

      if (!payment) return res.status(404).json({ message: 'Payment not found' });

      if (req.body.status === 'refunded')
        await Appointment.findByIdAndUpdate(payment.appointmentId, { paymentStatus: 'refunded' });

      res.json({ message: 'Payment status updated', payment });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update payment status', error: error.message });
    }
  }
}

module.exports = PaymentController;
