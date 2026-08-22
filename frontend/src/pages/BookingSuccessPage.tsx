import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { bookingsApi } from '../services/api';
import { Booking } from '../types';
import DigitalTicketCard from '../components/ticket/DigitalTicketCard';
import { CheckCircle2, Ticket, ArrowRight, Home } from 'lucide-react';

export default function BookingSuccessPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [booking, setBooking] = useState<Booking | null>(location.state?.booking || null);
  const [isLoading, setIsLoading] = useState(!booking);

  useEffect(() => {
    // Trigger celebration confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    if (!booking && id) {
      bookingsApi
        .getById(id)
        .then((res) => {
          if (res.data.success) {
            setBooking(res.data.data);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    }
  }, [id, booking]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-400">Loading your digital ticket...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold">Booking Not Found</h2>
        <Link to="/" className="mt-4 text-brand-400 text-sm hover:underline">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Celebration Banner */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-2 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 block">
            Payment Confirmed
          </span>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            You're Going to {booking.show.event.title}! 🎉
          </h1>

          <p className="text-sm text-slate-400 max-w-md mx-auto font-light">
            Your booking reference is{' '}
            <strong className="text-brand-400 font-mono font-bold">{booking.bookingReference}</strong>.
            A confirmation email has been dispatched with your digital voucher.
          </p>
        </div>

        {/* Digital Ticket */}
        <DigitalTicketCard booking={booking} />

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            to="/my-bookings"
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm transition-all shadow-lg shadow-brand-600/30"
          >
            <Ticket className="w-4 h-4" />
            View in My Bookings
          </Link>

          <Link
            to="/"
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-sm border border-slate-800 transition-colors"
          >
            <Home className="w-4 h-4" />
            Explore More Events
          </Link>
        </div>
      </div>
    </div>
  );
}
