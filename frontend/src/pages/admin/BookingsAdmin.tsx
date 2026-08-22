import { useState, useEffect } from 'react';
import { adminApi, bookingsApi } from '../../services/api';
import { Booking } from '../../types';
import AdminLayout from '../../components/admin/AdminLayout';
import toast from 'react-hot-toast';
import { Search, Ticket, Calendar, QrCode, XCircle, CheckCircle2 } from 'lucide-react';

export default function BookingsAdmin() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const query: any = {};
      if (search) query.search = search;
      if (statusFilter !== 'ALL') query.status = statusFilter;

      const res = await adminApi.getAllBookings(query);
      if (res.data.success) setBookings(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBookings();
  };

  const handleAdminCancel = async (booking: Booking) => {
    if (!confirm(`Cancel booking ${booking.bookingReference} for ${booking.user?.name}? This will refund ₹${booking.totalAmount} and reallocate seats.`)) return;
    try {
      await bookingsApi.cancel(booking.id);
      toast.success(`Booking ${booking.bookingReference} cancelled & seats reallocated.`);
      fetchBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  return (
    <AdminLayout
      title="Bookings Management &amp; Audit"
      subtitle="Complete database audit log of all confirmed, checked-in, and refunded ticket transactions."
    >
      {/* Search & Filter Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2 w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reference, customer name, email, or event..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-brand-500 w-full sm:w-auto"
          >
            <option value="ALL">All Booking Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled / Refunded</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-slate-900 rounded-3xl h-64 animate-pulse border border-slate-800"></div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold bg-slate-950/40">
                  <th className="py-3.5 px-4">Booking Ref</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Event &amp; Showtime</th>
                  <th className="py-3.5 px-4">Seats</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Ticket Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {bookings.map((b) => {
                  const showDate = new Date(b.show.startTime);
                  const seatLabels = b.bookingSeats
                    ?.map((bs) => `${bs.showSeat?.seat.rowLabel || ''}${bs.showSeat?.seat.seatNumber || ''}`)
                    .filter(Boolean)
                    .join(', ');

                  return (
                    <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-brand-400">
                        {b.bookingReference}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{b.user?.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{b.user?.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">{b.show.event.title}</div>
                        <div className="text-[11px] text-slate-400">
                          {showDate.toLocaleDateString()} at {showDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-white">
                        {seatLabels || 'Assigned'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400 text-sm">
                        ₹{b.totalAmount}
                      </td>
                      <td className="py-3 px-4">
                        {b.ticketStatus === 'VALID' && b.status === 'CONFIRMED' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Valid ✓
                          </span>
                        )}
                        {b.ticketStatus === 'USED' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-500/10 text-slate-400 border border-slate-500/20">
                            Checked In
                          </span>
                        )}
                        {b.status === 'CANCELLED' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-red-500/10 text-red-400 border border-red-500/20">
                            Cancelled
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {b.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleAdminCancel(b)}
                            className="px-2.5 py-1 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-950/40 text-[11px] font-semibold transition-colors"
                          >
                            Cancel &amp; Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
