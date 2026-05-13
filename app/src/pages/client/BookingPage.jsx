import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, CheckCircle } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { clientSidebarItems } from '../../components/client/clientNav';
import { publicAPI, clientAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';

const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'];

function getNextDays(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d.toISOString().split('T')[0];
  });
}

export default function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [therapist, setTherapist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const dates = getNextDays(5);

  useEffect(() => {
    publicAPI.getTherapistById(id)
      .then(res => setTherapist(res.data?.therapist || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const [booking, setBooking] = useState(false);

  const handleProceed = async () => {
    setBooking(true);
    try {
      const res = await clientAPI.createAppointment({
        therapistId: id,
        date: selectedDate,
        time: selectedTime,
        sessionType: 'video',
      });
      const appointment = res.data?.appointment || res.data;
      const appointmentId = appointment._id || appointment.id;
      if (!appointmentId) throw new Error('No appointment ID returned');
      navigate('/client/payment/checkout', {
        state: {
          appointmentId,
          therapistName: name,
          specialization: (therapist.specialization || []).join(', '),
          amount: rate,
          date: selectedDate,
          time: selectedTime,
        }
      });
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to create appointment');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout sidebarItems={clientSidebarItems} userName={user?.name || ''}>
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!therapist) {
    return (
      <DashboardLayout sidebarItems={clientSidebarItems} userName={user?.name || ''}>
        <p className="text-center text-gray-400 py-12">Therapist not found.</p>
      </DashboardLayout>
    );
  }

  const name = therapist.userId?.name || therapist.name || 'Therapist';
  const rate = therapist.hourlyRate || 0;

  return (
    <DashboardLayout sidebarItems={clientSidebarItems} userName={user?.name || ''}>
      <div className="max-w-2xl">
        <h1 className="text-xl font-semibold text-slate-800 mb-1">Book a Session</h1>
        <p className="text-sm text-gray-500 mb-6">Select a date and time for your session with {name}</p>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
            {name[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800">{name}</p>
            <p className="text-xs text-gray-500">{(therapist.specialization || []).join(', ')}</p>
          </div>
          <p className="font-bold text-slate-800">ETB {rate}<span className="text-xs font-normal text-gray-400">/session</span></p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Calendar size={16} className="text-primary" /> Select Date</h2>
          <div className="flex gap-2 flex-wrap">
            {dates.map(d => (
              <button key={d} onClick={() => setSelectedDate(d)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${selectedDate === d ? 'bg-primary text-white' : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                {new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </button>
            ))}
          </div>
        </div>

        {selectedDate && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Clock size={16} className="text-primary" /> Select Time</h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {timeSlots.map(time => (
                <button key={time} onClick={() => setSelectedTime(time)}
                  className={`py-2 rounded-xl text-xs font-medium transition ${selectedTime === time ? 'bg-primary text-white' : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'}`}>{time}</button>
              ))}
            </div>
          </div>
        )}

        {selectedDate && selectedTime && (
          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5">
            <h2 className="font-semibold text-slate-800 mb-3">Booking Summary</h2>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between"><span className="text-gray-500">Therapist</span><span className="font-medium">{name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-medium">{selectedDate}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Time</span><span className="font-medium">{selectedTime}</span></div>
              <div className="flex justify-between pt-2 border-t border-blue-100">
                <span className="font-semibold text-slate-800">Consultation Fee</span>
                <span className="font-bold text-primary">ETB {rate}</span>
              </div>
            </div>
            <button onClick={handleProceed} disabled={booking}
              className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition flex items-center justify-center gap-2 disabled:opacity-50">
              {booking
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating booking...</>
                : <><CheckCircle size={16} /> Proceed to Payment</>}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
