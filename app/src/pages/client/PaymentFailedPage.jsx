import { useLocation, useNavigate } from 'react-router-dom';
import { XCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { clientSidebarItems } from '../../components/client/clientNav';

export default function PaymentFailedPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const s = state || {};

  return (
    <DashboardLayout sidebarItems={clientSidebarItems}>
      <div className="max-w-md mx-auto">
        <div className="bg-red-50 border border-red-100 rounded-3xl p-8 text-center mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle size={40} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Payment Failed</h1>
          <p className="text-gray-500 text-sm">We couldn't process your payment. No amount was charged.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
          <h2 className="font-semibold text-slate-800 mb-3 text-sm">What may have gone wrong?</h2>
          <ul className="space-y-2 text-sm text-gray-500">
            {[
              'Insufficient balance in your account',
              'Network or connection issue during payment',
              'Payment session timed out',
              'Card details entered incorrectly',
            ].map(r => (
              <li key={r} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 flex-shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          {s.appointmentId && (
            <button onClick={() => navigate('/client/payment/checkout', { state: s })}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition">
              <RefreshCw size={16} /> Retry Payment
            </button>
          )}
          <button onClick={() => navigate('/client/appointments')}
            className="w-full flex items-center justify-center gap-2 text-gray-400 py-2 text-sm hover:text-gray-600 transition">
            <ArrowLeft size={14} /> Back to Appointments
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
