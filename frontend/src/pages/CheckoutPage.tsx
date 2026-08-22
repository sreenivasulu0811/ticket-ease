import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { bookingsApi, seatsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import HoldCountdownBanner from '../components/booking/HoldCountdownBanner';
import toast from 'react-hot-toast';
import {
  CreditCard,
  Smartphone,
  Building,
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  Ticket,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const state = location.state || {};
  const { showId, holdToken, holdExpiresAt, seats = [], pricing, event, show } = state;

  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NET_BANKING'>('UPI');
  const [upiId, setUpiId] = useState('customer@okhdfcbank');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8890');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [isProcessing, setIsProcessing] = useState(false);

  // If page loaded directly without state, redirect to events
  if (!showId || !holdToken || seats.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <AlertTriangle className="w-12 h-12 text-amber-400 mb-3" />
        <h2 className="text-xl font-bold">No Active Checkout Session</h2>
        <p className="text-sm text-slate-400 mt-1">Please select an event and reserve your seats first.</p>
        <Link to="/events" className="mt-4 px-4 py-2 bg-brand-600 rounded-xl text-sm font-semibold">
          Browse Events
        </Link>
      </div>
    );
  }

  const seatLabels = seats.map((s: any) => `${s.rowLabel}${s.seatNumber}`);

  const handleHoldExpired = () => {
    sessionStorage.removeItem(`ticketease_hold_${showId}`);
    sessionStorage.removeItem(`ticketease_expiry_${showId}`);
    toast.error('Your seat hold has expired. Please select your seats again.');
    navigate(`/seat-selection/${showId}`);
  };

  const handleReleaseHold = async () => {
    try {
      await seatsApi.releaseHold(showId, holdToken);
      sessionStorage.removeItem(`ticketease_hold_${showId}`);
      sessionStorage.removeItem(`ticketease_expiry_${showId}`);
      navigate(`/seat-selection/${showId}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePayment = async (simulateStatus: 'SUCCESS' | 'FAILED') => {
    setIsProcessing(true);
    try {
      const res = await bookingsApi.create({
        showId,
        holdToken,
        paymentMethod,
        simulateStatus,
      });

      if (res.data.success) {
        // Clear session hold
        sessionStorage.removeItem(`ticketease_hold_${showId}`);
        sessionStorage.removeItem(`ticketease_expiry_${showId}`);
        toast.success('Payment simulated successfully! Booking confirmed.');
        navigate(`/booking-success/${res.data.data.id}`, {
          state: { booking: res.data.data },
        });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Payment simulation failed.';
      toast.error(msg);
      if (simulateStatus === 'FAILED') {
        // Seats released by backend on failure
        sessionStorage.removeItem(`ticketease_hold_${showId}`);
        sessionStorage.removeItem(`ticketease_expiry_${showId}`);
        setTimeout(() => {
          navigate(`/seat-selection/${showId}`);
        }, 1500);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const showDate = show?.startTime ? new Date(show.startTime) : new Date();
  const formattedDate = showDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = showDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen pb-20">
      {/* Hold Countdown Sticky Banner */}
      <HoldCountdownBanner
        expiresAt={holdExpiresAt}
        onExpire={handleHoldExpired}
        onRelease={handleReleaseHold}
        seatLabels={seatLabels}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link
            to={`/seat-selection/${showId}`}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-brand-400">
              Step 2 of 2
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Order Review &amp; Payment Simulation
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left 2 Cols: Payment Simulator */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Method Selector */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Select Payment Method (Simulated)
              </h2>

              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`p-4 rounded-2xl border flex flex-col items-center gap-2 text-center transition-all ${
                    paymentMethod === 'UPI'
                      ? 'bg-brand-600/20 border-brand-500 text-white shadow-lg shadow-brand-500/10'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-6 h-6 text-brand-400" />
                  <span className="text-xs font-bold">UPI / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-4 rounded-2xl border flex flex-col items-center gap-2 text-center transition-all ${
                    paymentMethod === 'CARD'
                      ? 'bg-brand-600/20 border-brand-500 text-white shadow-lg shadow-brand-500/10'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-6 h-6 text-purple-400" />
                  <span className="text-xs font-bold">Credit / Debit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('NET_BANKING')}
                  className={`p-4 rounded-2xl border flex flex-col items-center gap-2 text-center transition-all ${
                    paymentMethod === 'NET_BANKING'
                      ? 'bg-brand-600/20 border-brand-500 text-white shadow-lg shadow-brand-500/10'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <Building className="w-6 h-6 text-cyan-400" />
                  <span className="text-xs font-bold">Net Banking</span>
                </button>
              </div>

              {/* Payment Details Simulator Input */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3 text-xs">
                {paymentMethod === 'UPI' && (
                  <div>
                    <label className="text-slate-400 block mb-1">Simulated UPI ID / VPA</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-brand-500"
                    />
                  </div>
                )}

                {paymentMethod === 'CARD' && (
                  <div>
                    <label className="text-slate-400 block mb-1">Simulated Test Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-brand-500"
                    />
                  </div>
                )}

                {paymentMethod === 'NET_BANKING' && (
                  <div>
                    <label className="text-slate-400 block mb-1">Select Bank</label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-500"
                    >
                      <option>HDFC Bank</option>
                      <option>ICICI Bank</option>
                      <option>State Bank of India</option>
                      <option>Axis Bank</option>
                      <option>Kotak Mahindra</option>
                    </select>
                  </div>
                )}

                <p className="text-[11px] text-slate-500 italic">
                  💡 This is an assessment simulation. Real money will not be charged.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handlePayment('SUCCESS')}
                  className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-base transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Pay ₹{pricing.totalAmount} &bull; (Simulate Success)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handlePayment('FAILED')}
                  className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-800/60 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Simulate Payment Failure (Tests Automatic Seat Release)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Col: Itemized Order Summary */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">
              Booking Summary
            </h2>

            {/* Event Mini Card */}
            <div className="flex gap-3">
              {event?.posterUrl && (
                <img
                  src={event.posterUrl}
                  alt={event.title}
                  className="w-16 h-24 object-cover rounded-xl border border-slate-700 flex-shrink-0"
                />
              )}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400">
                  {event?.category}
                </span>
                <h3 className="text-sm font-bold text-white line-clamp-1">{event?.title}</h3>
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-brand-400" />
                  <span>{formattedDate}</span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-indigo-400" />
                  <span>{formattedTime}</span>
                </div>
              </div>
            </div>

            {/* Venue & Hall */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-brand-400" />
                <span>{show?.venue?.name || 'Multiplex Venue'}</span>
              </div>
              <p className="text-slate-500 pl-5">{show?.screen?.name || 'Screen 1'}</p>
            </div>

            {/* Itemized Price Breakdown */}
            <div className="space-y-2 text-xs border-t border-slate-800 pt-4">
              <div className="flex justify-between text-slate-400">
                <span>Selected Seats ({seatLabels.join(', ')}):</span>
                <span className="font-mono text-slate-200">₹{pricing.subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Convenience Fee:</span>
                <span className="font-mono text-slate-200">₹{pricing.convenienceFee}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Integrated Taxes:</span>
                <span className="font-mono text-emerald-400">Included</span>
              </div>

              <div className="flex justify-between text-sm font-bold text-white pt-3 border-t border-slate-800">
                <span>Grand Total:</span>
                <span className="font-mono text-emerald-400 text-lg">₹{pricing.totalAmount}</span>
              </div>
            </div>

            {/* Customer Details */}
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div>Customer: <strong className="text-slate-200">{user?.name}</strong></div>
              <div>Email: <strong className="text-slate-200">{user?.email}</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
