import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, CheckCircle, Smartphone, Building2, CreditCard, Landmark } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { clientSidebarItems } from '../../components/client/clientNav';
import { clientAPI } from '../../api';

const paymentMethods = [
  { id: 'telebirr', label: 'Telebirr', desc: 'Fast mobile payment', icon: Smartphone, color: 'text-orange-500 bg-orange-50' },
  { id: 'cbe', label: 'CBE Birr', desc: 'Secure bank wallet payment', icon: Building2, color: 'text-blue-600 bg-blue-50' },
  { id: 'bank', label: 'Bank Transfer', desc: 'Direct bank payment', icon: Landmark, color: 'text-teal-600 bg-teal-50' },
  { id: 'card', label: 'Card Payment', desc: 'Debit / Credit card', icon: CreditCard, color: 'text-purple-600 bg-purple-50' },
];

export default function PaymentCheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { appointmentId, therapistName, specialization, amount, date, time } = location.state || {};

  const [method, setMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!appointmentId) {
    return (
      <DashboardLayout sidebarItems={clientSidebarItems}>
        <div className="max-w-md mx-auto text-center py-20">
          <p className="text-gray-500 mb-4">No appointment selected.</p>
          <button onClick={() => navigate('/client/therapists')}
            className="bg-primary text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-600 transition">
            Find a Therapist
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const handlePay = async () => {
    if (!method || !appointmentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await clientAPI.initializePayment({ appointmentId });
      window.location.href = res.data.checkout_url;
    } catch (err) {
      const msg = err.response?.data?.error?.message
        || err.response?.data?.message
        || err.message
        || 'Failed to initialize payment';
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <DashboardLayout sidebarItems={clientSidebarItems}>
      <div className="max-w-2xl">
        <h1 className="text-xl font-semibold text-slate-800 mb-1">Complete Your Payment</h1>
        <p className="text-sm text-gray-500 mb-6">Review your session details and choose a payment method</p>

        {/* Session Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
          <h2 className="font-semibold text-slate-800 mb-4 text-sm uppercase tracking-wide text-gray-400">Session Summary</h2>
          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
              {therapistName?.[0] || 'T'}
            </div>
            <div>
              <p className="font-semibold text-slate-800">{therapistName || 'Therapist'}</p>
              <p className="text-xs text-gray-500">{specialization || ''}</p>
              <div className="flex items-center gap-1 mt-1">
                <CheckCircle size={11} className="text-teal-500" />
                <span className="text-xs text-teal-600 font-medium">System Verified</span>
              </div>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            {[
              ['Session Type', 'Video Consultation'],
              ['Date', date ? new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—'],
              ['Time', time || '—'],
              ['Duration', '50 minutes'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-slate-700">{value}</span>
              </div>
            ))}
            <div className="flex justify-between pt-3 border-t border-gray-100 mt-2">
              <span className="font-semibold text-slate-800">Consultation Fee</span>
              <span className="font-bold text-xl text-primary">ETB {amount || '—'}</span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
          <h2 className="font-semibold text-slate-800 mb-4">Select Payment Method</h2>
          <p className="text-xs text-gray-400 mb-3">You will be redirected to Chapa's secure checkout to complete payment.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {paymentMethods.map(m => (
              <button key={m.id} onClick={() => setMethod(m.id)}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition ${method === m.id ? 'border-primary bg-blue-50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${m.color}`}>
                  <m.icon size={20} />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{m.label}</p>
                  <p className="text-xs text-gray-500">{m.desc}</p>
                </div>
                {method === m.id && <CheckCircle size={16} className="text-primary ml-auto flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4 text-sm text-red-600">{error}</div>
        )}

        {/* Security note */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-5">
          <ShieldCheck size={14} className="text-teal-500" />
          Payments are processed securely by Chapa. MindBridge never stores your payment credentials.
        </div>

        <button onClick={handlePay} disabled={!method || loading || !appointmentId}
          className="w-full bg-primary text-white py-3.5 rounded-2xl font-bold text-base hover:bg-blue-600 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {loading ? (
            <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Redirecting to Chapa...</>
          ) : `Pay ETB ${amount || ''} via Chapa`}
        </button>
      </div>
    </DashboardLayout>
  );
}
