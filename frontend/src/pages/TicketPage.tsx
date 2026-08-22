import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bookingsApi } from '../services/api';
import { Booking } from '../types';
import DigitalTicketCard from '../components/ticket/DigitalTicketCard';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export default function TicketPage() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    bookingsApi
      .getById(id)
      .then((res) => {
        if (res.data.success) {
          setBooking(res.data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-400">Loading digital ticket...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
        <h2 className="text-xl font-bold">Ticket Not Found</h2>
        <Link to="/my-bookings" className="mt-4 text-brand-400 text-sm hover:underline">
          Return to My Bookings
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link
            to="/my-bookings"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-white">Digital Admission Ticket</h1>
        </div>

        <DigitalTicketCard booking={booking} />
      </div>
    </div>
  );
}
