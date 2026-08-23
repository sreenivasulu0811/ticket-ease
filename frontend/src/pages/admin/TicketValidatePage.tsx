import { useState } from 'react';
import { ticketsApi } from '../../services/api';
import { Booking } from '../../types';
import AdminLayout from '../../components/admin/AdminLayout';
import toast from 'react-hot-toast';
import {
  QrCode,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  RotateCcw,
  Calendar,
  Clock,
  MapPin,
  Ticket,
} from 'lucide-react';

export default function TicketValidatePage() {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    status: 'VALID' | 'USED' | 'CANCELLED' | 'INVALID';
    message: string;
    booking?: Booking;
  } | null>(null);

  const handleValidate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!code.trim()) {
      toast.error('Please enter a booking reference or QR code');
      return;
    }

    setIsValidating(true);
    setResult(null);

    try {
      const res = await ticketsApi.validate(code.trim());
      setResult({
        success: res.data.success,
        status: (res.data as any).status || (res.data.success ? 'VALID' : 'INVALID'),
        message: res.data.message || '',
        booking: res.data.data,
      });

      if (res.data.success) {
        toast.success('Ticket valid! Admission approved.');
      } else {
        toast.error(res.data.message || 'Ticket validation failed.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Validation error');
    } finally {
      setIsValidating(false);
    }
  };

  const handleReset = () => {
    setCode('');
    setResult(null);
  };

  const booking = result?.booking;
  const seatLabels = booking?.bookingSeats
    ?.map((bs) => `${bs.showSeat?.seat.rowLabel || ''}${bs.showSeat?.seat.seatNumber || ''}`)
    .filter(Boolean)
    .join(', ');

  return (
    <AdminLayout
      title="Staff QR Ticket Scanner &amp; Check-In"
      subtitle="Verify digital ticket authenticity, admit customers at venue gates, and prevent duplicate admissions."
    >
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Scanner / Input Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-600/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Scan or Enter Ticket Identifier</h2>
              <p className="text-xs text-slate-400">
                Paste QR data, booking reference (e.g. <span className="font-mono text-brand-400">TE-2026-DEMO01</span>), or booking ID.
              </p>
            </div>
          </div>

          <form onSubmit={handleValidate} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                autoFocus
                placeholder="Scan QR or enter Booking Reference..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 shadow-inner"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isValidating || !code.trim()}
                className="flex-1 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2"
              >
                {isValidating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Validate Ticket</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Validation Result Box */}
        {result && (
          <div
            className={`rounded-3xl border p-6 sm:p-8 shadow-2xl transition-all space-y-6 ${
              result.status === 'VALID'
                ? 'bg-emerald-950/30 border-emerald-500/50 shadow-emerald-500/10'
                : result.status === 'USED'
                ? 'bg-slate-900 border-slate-700'
                : 'bg-red-950/30 border-red-500/50 shadow-red-500/10'
            }`}
          >
            {/* Status Header */}
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  result.status === 'VALID'
                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
                    : result.status === 'USED'
                    ? 'bg-slate-800 text-slate-400'
                    : 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                }`}
              >
                {result.status === 'VALID' ? (
                  <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
                ) : result.status === 'USED' ? (
                  <AlertCircle className="w-8 h-8" />
                ) : (
                  <XCircle className="w-8 h-8" />
                )}
              </div>

              <div>
                <span
                  className={`text-xs font-bold uppercase tracking-widest block ${
                    result.status === 'VALID'
                      ? 'text-emerald-400'
                      : result.status === 'USED'
                      ? 'text-slate-400'
                      : 'text-red-400'
                  }`}
                >
                  {result.status === 'VALID'
                    ? 'Check-In Successful'
                    : result.status === 'USED'
                    ? 'Duplicate Check-In'
                    : 'Admission Denied'}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white">{result.message}</h3>
              </div>
            </div>

            {/* Booking Details if found */}
            {booking && (
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 uppercase font-semibold text-[10px]">Customer</span>
                    <p className="text-base font-bold text-white">{booking.user?.name}</p>
                    <p className="text-slate-400 font-mono">{booking.user?.email}</p>
                  </div>

                  <div>
                    <span className="text-slate-500 uppercase font-semibold text-[10px]">Seats</span>
                    <p className="text-xl font-black text-brand-400 font-mono">{seatLabels}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Ticket className="w-3.5 h-3.5 text-brand-400" />
                    <span>{booking.show.event.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-brand-400" />
                    <span>{booking.show.screen.venue.name} &bull; {booking.show.screen.name}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
