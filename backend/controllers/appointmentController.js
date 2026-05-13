const Appointment = require('../models/Appointment');
const Therapist = require('../models/Therapist');
const User = require('../models/User');
const { notify } = require('../services/notificationService');
const { sendEmail } = require('../services/emailService');

class AppointmentController {
  // Get user appointments
  static async getAppointments(req, res) {
    try {
      let query = {};

      if (req.user.role === 'client') {
        query.clientId = req.user._id;
      } else if (req.user.role === 'therapist') {
        query.therapistId = req.user._id;
      }
      // Admin can see all

      const appointments = await Appointment.find(query)
        .populate('clientId', 'name email phone')
        .populate('therapistId', 'userId')
        .populate({
          path: 'therapistId',
          populate: {
            path: 'userId',
            select: 'name email'
          }
        })
        .sort({ date: -1, time: -1 });

      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get appointments', error: error.message });
    }
  }

  // Create appointment
  static async createAppointment(req, res) {
    try {
      const { therapistId, date, time, sessionType, notes } = req.body;

      // Check if therapist exists and is verified
      const therapist = await Therapist.findOne({
        _id: therapistId,
        'verification.status': 'VERIFIED'
      });

      if (!therapist) {
        return res.status(400).json({ message: 'Therapist not found or not verified' });
      }

      // Check for conflicting appointments
      const conflictingAppointment = await Appointment.findOne({
        therapistId: therapist._id,
        date,
        time,
        status: { $in: ['pending', 'confirmed'] }
      });

      if (conflictingAppointment) {
        return res.status(400).json({ message: 'Time slot not available' });
      }

      // Create appointment
      const appointment = new Appointment({
        clientId: req.user._id,
        therapistId: therapist._id,
        date,
        time,
        sessionType,
        notes,
        paymentStatus: 'pending'
      });

      await appointment.save();

      // Notify therapist
      await notify(therapistId, `New appointment request from ${req.user.name}`, 'appointment_reminder', appointment._id);

      // Email client confirmation
      const therapistUser = await User.findById(therapistId);
      sendEmail(req.user.email, 'appointmentBooked', {
        clientName: req.user.name,
        therapistName: therapistUser?.name || 'Your therapist',
        date: appointment.date,
        time: appointment.time,
        sessionType: appointment.sessionType || 'Online',
      });

      const populatedAppointment = await Appointment.findById(appointment._id)
        .populate('clientId', 'name email phone')
        .populate({
          path: 'therapistId',
          populate: {
            path: 'userId',
            select: 'name email'
          }
        });

      res.status(201).json({
        message: 'Appointment created successfully',
        appointment: populatedAppointment
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to create appointment', error: error.message });
    }
  }

  // Update appointment status
  static async updateAppointmentStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const appointment = await Appointment.findById(id);

      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      // Check permissions
      if (req.user.role === 'client' && appointment.clientId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
      if (req.user.role === 'therapist' && appointment.therapistId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }

      appointment.status = status;
      await appointment.save();

      // Create notification
      let notificationMessage = '';
      let notificationUserId = '';

      if (status === 'confirmed' && req.user.role === 'therapist') {
        notificationMessage = 'Your appointment has been confirmed';
        notificationUserId = appointment.clientId;
      } else if (status === 'cancelled') {
        notificationMessage = 'Your appointment has been cancelled';
        notificationUserId = req.user.role === 'therapist' ? appointment.clientId : appointment.therapistId;
      }

      if (notificationMessage && notificationUserId) {
        await notify(notificationUserId, notificationMessage, 'appointment_confirmed', appointment._id);
      }

      const updatedAppointment = await Appointment.findById(id)
        .populate('clientId', 'name email phone')
        .populate({
          path: 'therapistId',
          populate: {
            path: 'userId',
            select: 'name email'
          }
        });

      res.json({
        message: 'Appointment status updated',
        appointment: updatedAppointment
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update appointment', error: error.message });
    }
  }

  // Cancel appointment
  static async cancelAppointment(req, res) {
    try {
      const { id } = req.params;

      const appointment = await Appointment.findById(id);

      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      // Only client or therapist can cancel
      if (req.user.role === 'client' && appointment.clientId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
      if (req.user.role === 'therapist' && appointment.therapistId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }

      appointment.status = 'cancelled';
      await appointment.save();

      // Notify the other party
      const notificationUserId = req.user.role === 'client' ? appointment.therapistId : appointment.clientId;
      await notify(notificationUserId, 'Your appointment has been cancelled', 'appointment_cancelled', appointment._id);

      res.json({ message: 'Appointment cancelled successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to cancel appointment', error: error.message });
    }
  }
}

module.exports = AppointmentController;