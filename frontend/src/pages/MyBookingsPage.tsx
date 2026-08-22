import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingsApi } from '../services/api';
import { Booking } from '../types';
import toast from 'react-hot-toast';
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  QrCode,
  AlertCircle,
  XCircle,
  CheckCircle2,
  ArrowRight,
  Printer,
} from 'lucide-react';

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'PAST' | 'CANCELLED'>('UPCOMING');
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const res = await bookingsApi.getMyBookings();
      if (res.data.success) {
        setBookings(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
      toast.error('Failed to load bookings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleConfirmCancel = async () => {
    if (!cancellingBooking) return;
    setIsCancelling(true);
    try {
      const res = await bookingsApi.cancel(cancellingBooking.id);
      if (res.data.success) {
        toast.success(res.data.message || 'Booking cancelled and refund processed.');
        setCancellingBooking(null);
        fetchBookings();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to cancel booking.';
      toast.error(msg);
    } finally {
      setIsCancelling(false);
    }
  };

  // Filter bookings based on active tab
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'CANCELLED') return b.status === 'CANCELLED';
    if (activeTab === 'PAST') return b.status !== 'CANCELLED' && b.isPast;
    // UPCOMING
    return b.status === 'CONFIRMED' && !b.isPast;
  });

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              My Bookings
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-light">
              Manage your confirmed tickets, view QR passes, or process cancellations.
            </p>
          </div>

          <Link
            to="/events"
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors shadow-md shadow-brand-600/20"
          >
            Explore More Events
          </Link>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-8">
          <button
            onClick={() => setActiveTab('UPCOMING')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'UPCOMING'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Upcoming (
            {bookings.filter((b) => b.status === 'CONFIRMED' && !b.isPast).length})
          </button>

          <button
            onClick={() => setActiveTab('PAST')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'PAST'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Past ({bookings.filter((b) => b.status !== 'CANCELLED' && b.isPast).length})
          </button>

          <button
            onClick={() => setActiveTab('CANCELLED')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'CANCELLED'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Cancelled ({bookings.filter((b) => b.status === 'CANCELLED').length})
          </button>
        </div>

        {/* Bookings List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-slate-900 rounded-3xl h-48 animate-pulse border border-slate-800"></div>
            ))}
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-slate-800 max-w-lg mx-auto space-y-4">
            <Ticket className="w-12 h-12 text-slate-600 mx-auto" />
            <div>
              <h3 className="text-base font-bold text-white">No bookings in this tab</h3>
              <p className="text-xs text-slate-400 mt-1">
                {activeTab === 'UPCOMING'
                  ? "You don't have any upcoming shows booked."
                  : activeTab === 'PAST'
                  ? "You have no past show attendance records."
                  : 'You have no cancelled tickets.'}
              </p>
            </div>
            <Link
              to="/events"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors"
            >
              Browse Events
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredBookings.map((booking) => {
              const showDate = new Date(booking.show.startTime);
              const formattedDate = showDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              const formattedTime = showDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              });

              const seatLabels = booking.bookingSeats
                ?.map(
                  (bs) =>
                    `${bs.showSeat?.seat.rowLabel || ''}${bs.showSeat?.seat.seatNumber || ''}`
                )
                .filter(Boolean)
                .join(', ');

              return (
                <div
                  key={booking.id}
                  className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-slate-700 transition-colors"
                >
                  {/* Left: Poster + Details */}
                  <div className="flex gap-4 items-start sm:items-center w-full md:w-auto">
                    {booking.show.event.posterUrl && (
                      <img
                        src={booking.show.event.posterUrl}
                        alt={booking.show.event.title}
                        className="w-20 h-28 object-cover rounded-2xl border border-slate-700 flex-shrink-0"
                      />
                    )}

                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-900/60 text-brand-300 border border-brand-700/50">
                          {booking.show.event.type}
                        </span>
                        <span className="font-mono text-xs text-brand-400 font-bold">
                          {booking.bookingReference}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white leading-tight">
                        {booking.show.event.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                        <span className="flex items-center gap-1 font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-brand-400" />
                          {formattedDate}
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" />
                          {formattedTime}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {booking.show.screen.venue.name} &bull; {booking.show.screen.name} ({booking.show.screen.venue.city})
                        </span>
                      </div>

                      <div className="pt-1 text-xs">
                        <span className="text-slate-400">Seats: </span>
                        <strong className="text-white font-mono font-bold text-sm">
                          {seatLabels || 'Assigned'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Right: Pricing, Status, & Actions */}
                  <div className="flex flex-col sm:flex-row md:flex-col items-end justify-between gap-3 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-800">
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Total Paid</div>
                      <div className="text-xl font-black text-emerald-400 font-mono">
                        ₹{booking.totalAmount.toFixed(2)}
                      </div>
                      <span className="text-[10px] text-slate-500 capitalize">
                        {booking.paymentMethod?.toLowerCase().replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {booking.status === 'CONFIRMED' && (
                        <>
                          <Link
                            to={`/ticket/${booking.id}`}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors shadow-md shadow-brand-600/20"
                          >
                            <QrCode className="w-4 h-4" />
                            View Ticket
                          </Link>

                          {booking.isCancellable && (
                            <button
                              onClick={() => setCancellingBooking(booking)}
                              className="px-3 py-2 rounded-xl border border-red-500/30 hover:bg-red-950/30 text-red-400 text-xs font-semibold transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </>
                      )}

                      {booking.status === 'CANCELLED' && (
                        <div className="flex items-center gap-1.5 text-xs text-red-400 font-semibold px-3 py-1.5 rounded-xl bg-red-950/30 border border-red-900/50">
                          <XCircle className="w-4 h-4" />
                          Cancelled &amp; Refunded
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cancellation Confirmation Modal */}
        {cancellingBooking && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Cancel Booking?</h3>
                  <p className="text-xs text-slate-400">
                    Ref: <span className="font-mono text-brand-400">{cancellingBooking.bookingReference}</span>
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs space-y-2 text-slate-300">
                <p>
                  Are you sure you want to cancel your booking for{' '}
                  <strong className="text-white">{cancellingBooking.show.event.title}</strong>?
                </p>
                <div className="pt-2 border-t border-slate-800 text-slate-400">
                  A simulated refund of{' '}
                  <strong className="text-emerald-400 font-mono">
                    ₹{cancellingBooking.totalAmount.toFixed(2)}
                  </strong>{' '}
                  will be credited back, and seats will immediately be reallocated to any waiting customers.
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={() => setCancellingBooking(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Keep Booking
                </button>

                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={handleConfirmCancel}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-lg shadow-red-600/20 flex items-center gap-1.5"
                >
                  {isCancelling ? 'Processing...' : 'Yes, Cancel & Refund'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
