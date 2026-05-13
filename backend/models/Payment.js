const mongoose = require('mongoose');

/**
 * payments collection
 * Used by: PaymentsPage, PaymentCheckoutPage, PaymentSuccessPage,
 *          PaymentFailedPage, ClientDashboard billing summary
 *          (lastPayment, sessionsThisMonth, totalSpent),
 *          AdminPaymentsPage, EarningsPage (therapist)
 */
const paymentSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User',        required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  therapistId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Therapist',   default: null },

  amount:        { type: Number, required: true, min: 0 },
  currency:      { type: String, default: 'ETB' },
  paymentMethod: { type: String, enum: ['Telebirr', 'CBE Birr', 'Bank Transfer', 'Card'], required: true },
  status:        { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  transactionId: { type: String, sparse: true },
  chapaRef:      { type: String, unique: true, sparse: true },
  description:   { type: String, default: null },
  paymentDetails:{ type: mongoose.Schema.Types.Mixed, default: null },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

paymentSchema.pre('save', function () { this.updatedAt = Date.now(); });
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
