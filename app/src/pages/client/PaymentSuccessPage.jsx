import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Calendar, Receipt } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { clientSidebarItems } from '../../components/client/clientNav';
import { clientAPI } from '../../api';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const txRef = searchParams.get('tx_ref');

  const [status, setStatus] = useState('verifying'); // verifying | success | failed
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    if (!txRef) { setStatus('failed'); return; }
    clientAPI.verifyPayment(txRef)
      .then(res => {
        setPayment(res.data.payment);
        setStatus(res.data.success ? 'success' : 'failed');
      })
      .catch(() => setStatus('failed'));
  }, [txRef]);

  if (status === 'verifying') {
    return (
      <DashboardLayout sidebarItems={clientSidebarItems}>
        <div className="max-w-md mx-auto text-center py-20">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Verifying your payment...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (status === 'failed') {
    return (
      <DashboardLayout sidebarItems={clientSidebarItems}>
        <div className="max-w-md mx-auto text-center py-20">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle size={40} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Payment Failed</h1>
          <p className="text-gray-500 text-sm mb-6">We couldn't verify your payment. No amount was charged.</p>
          <button onClick={() => navigate('/client/appointments')}
            className="bg-primary text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-600 transition">
            Back to Appointments
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const appointment = payment?.appointmentId;

  return (
    <DashboardLayout sidebarItems={clientSidebarItems}>
      <div className="max-w-lg mx-auto">
        {/* Success Banner */}
        <div className="bg-gradient-to-br from-teal-50 to-green-50 border border-teal-100 rounded-3xl p-8 text-center mb-6">
          <div className="w-20 h-20 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-200">
            <CheckCircle size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Payment Successful!</h1>
          <p className="text-gray-500 text-sm">Your session has been confirmed. See you soon!</p>
          <div className="mt-3 inline-block bg-white px-4 py-1.5 rounded-full text-xs font-mono text-gray-500 border border-gray-100">
            Ref: {txRef}
          </div>
        </div>

        {/* Receipt */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
          <div className="bg-primary px-5 py-4 flex items-center gap-2">
            <Receipt size={16} className="text-white" />
            <span className="text-white font-semibold text-sm">Payment Receipt</span>
          </div>
          <div className="p-5 space-y-3 text-sm">
            {[
              ['Transaction Ref', txRef],
              ['Amount Paid', `ETB ${payment?.amount}`],
              ['Status', 'Paid'],
              ['Date', appointment?.date ? new Date(appointment.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'],
              ['Time', appointment?.time || '—'],
              ['Payment Date', new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-400">{label}</span>
                <span className={`font-medium ${label === 'Status' ? 'text-teal-600' : 'text-slate-700'}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => navigate('/client/appointments')}
          className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition">
          <Calendar size={15} /> View Appointments
        </button>
      </div>
    </DashboardLayout>
  );
}
