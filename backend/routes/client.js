const express = require('express');
const AppointmentController = require('../controllers/appointmentController');
const PaymentController = require('../controllers/paymentController');
const AssessmentController = require('../controllers/assessmentController');
const ReviewController = require('../controllers/reviewController');
const Therapist = require('../models/Therapist');
const User = require('../models/User');
const auth = require('../middleware/auth');
const roleAuth = require('../middleware/roleAuth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);
router.use(roleAuth(['client']));

// Dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const [
      upcomingAppointments,
      recentAssessments,
      recentPayments
    ] = await Promise.all([
      require('../models/Appointment').find({
        clientId: req.user._id,
        date: { $gte: new Date() },
        status: { $in: ['pending', 'confirmed'] }
      })
      .populate({
        path: 'therapistId',
        populate: {
          path: 'userId',
          select: 'name email'
        }
      })
      .sort({ date: 1 })
      .limit(5),

      require('../models/Assessment').find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(3),

      require('../models/Payment').find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
    ]);

    res.json({
      upcomingAppointments,
      recentAssessments,
      recentPayments
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get dashboard data', error: error.message });
  }
});

// Therapists
router.get('/therapists', async (req, res) => {
  try {
    const { specialization, location, page = 1, limit = 10 } = req.query;

    let query = { 'verification.status': 'VERIFIED' };

    if (specialization) {
      query.specialization = { $in: [specialization] };
    }

    const therapists = await Therapist.find(query)
      .populate('userId', 'name email phone profileImage')
      .select('specialization experienceYears bio workplace hourlyRate')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Therapist.countDocuments(query);

    res.json({
      therapists,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get therapists', error: error.message });
  }
});

// Appointments
router.get('/appointments', AppointmentController.getAppointments);
router.post('/appointments', AppointmentController.createAppointment);
router.put('/appointments/:id/status', AppointmentController.updateAppointmentStatus);
router.delete('/appointments/:id', AppointmentController.cancelAppointment);

// Payments
router.get('/payments', PaymentController.getPayments);
router.get('/payments/:id', PaymentController.getPaymentById);

// Assessments — AI-powered scoring & therapist matching
router.get('/assessment/questions/:type', AssessmentController.getQuestions);
router.post('/assessment', AssessmentController.submitAssessment);          // returns score + matched therapists
router.post('/assessment/process', AssessmentController.processAssessment); // severity + Python matching
router.get('/assessment/results', AssessmentController.getAssessmentResults);
router.get('/assessment/latest', AssessmentController.getLatestAssessment);
router.get('/assessment/recommendations', AssessmentController.getRecommendations); // re-run matching on latest

// Reviews
router.get('/reviews', ReviewController.getUserReviews);
router.post('/reviews', ReviewController.createReview);
router.put('/reviews/:id', ReviewController.updateReview);
router.delete('/reviews/:id', ReviewController.deleteReview);

module.exports = router;