import { Booking } from '../../types';
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  Printer,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';

interface DigitalTicketCardProps {
  booking: Booking;
  onCancel?: () => void;
}

export default function DigitalTicketCard({ booking, onCancel }: DigitalTicketCardProps) {
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
    ?.map((bs) => `${bs.showSeat?.seat.rowLabel || ''}${bs.showSeat?.seat.seatNumber || ''}`)
    .filter(Boolean)
    .join(', ');

  const getStatusBadge = () => {
    if (booking.ticketStatus === 'VALID' && booking.status === 'CONFIRMED') {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Valid Ticket ✓
        </div>
      );
    }
    if (booking.ticketStatus === 'USED') {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/30 text-xs font-bold uppercase tracking-wider">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Checked In / Used
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-bold uppercase tracking-wider">
        <XCircle className="w-3.5 h-3.5" />
        Cancelled
      </div>
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden text-white print:border-none print:shadow-none print:bg-white print:text-black">
      {/* Top Header Card */}
      <div className="relative p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border-b border-slate-800/80">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Ticket className="w-5 h-5 text-white transform -rotate-12" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-brand-400 font-bold">
                TicketEase E-Ticket
              </span>
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-white print:text-black">
                {booking.show.event.title}
              </div>
            </div>
          </div>
          <div>{getStatusBadge()}</div>
        </div>
      </div>

      {/* Ticket Details & QR Body */}
      <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Left Column: Event & Venue Details */}
        <div className="md:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Date & Time
              </div>
              <div className="text-sm font-semibold flex items-center gap-1.5 text-slate-200 print:text-black">
                <Calendar className="w-4 h-4 text-brand-400" />
                {formattedDate}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                {formattedTime}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Venue & Screen
              </div>
              <div className="text-sm font-semibold flex items-center gap-1.5 text-slate-200 print:text-black">
                <MapPin className="w-4 h-4 text-brand-400" />
                {booking.show.screen.venue.name}
              </div>
              <div className="text-xs text-slate-400">
                {booking.show.screen.name} ({booking.show.screen.venue.city})
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 print:bg-slate-100 print:border-slate-300">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 uppercase font-semibold">Seats</div>
                <div className="text-xl font-black text-brand-400 font-mono tracking-wide print:text-brand-700">
                  {seatLabels || 'Seats Assigned'}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400 uppercase font-semibold">Total Paid</div>
                <div className="text-lg font-bold text-emerald-400 font-mono print:text-emerald-700">
                  ₹{booking.totalAmount.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400">Ticket Holder:</span>
              <p className="font-semibold text-slate-200 print:text-black">{booking.user?.name || 'Customer'}</p>
            </div>
            <div>
              <span className="text-slate-400">Booking Reference:</span>
              <p className="font-mono font-bold text-brand-400 print:text-brand-700">{booking.bookingReference}</p>
            </div>
          </div>
        </div>

        {/* Right Column: QR Code */}
        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-200 shadow-inner">
          {booking.qrCodeData ? (
            <img
              src={booking.qrCodeData}
              alt={`QR Ticket for ${booking.bookingReference}`}
              className="w-36 h-36 object-contain"
            />
          ) : (
            <div className="w-36 h-36 bg-slate-100 flex items-center justify-center text-slate-400 text-xs text-center p-2">
              Generating secure QR Code...
            </div>
          )}
          <span className="mt-2 text-[10px] font-mono text-slate-500 font-semibold tracking-wider uppercase">
            Scan at gate for entry
          </span>
        </div>
      </div>

      {/* Perforated Divider */}
      <div className="relative flex items-center justify-between px-2">
        <div className="w-6 h-6 rounded-full bg-slate-950 -ml-3 border-r border-slate-800"></div>
        <div className="flex-1 border-t-2 border-dashed border-slate-800 mx-2"></div>
        <div className="w-6 h-6 rounded-full bg-slate-950 -mr-3 border-l border-slate-800"></div>
      </div>

      {/* Bottom Actions Footer */}
      <div className="p-4 sm:p-6 bg-slate-950 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 print:hidden">
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span>Present this digital ticket or printed copy at the entrance.</span>
        </div>

        <div className="flex items-center gap-2">
          {onCancel && booking.isCancellable && (
            <button
              onClick={onCancel}
              className="px-3 py-1.5 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-950/30 transition-colors font-medium"
            >
              Cancel Booking
            </button>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save PDF
          </button>
        </div>
      </div>
    </div>
  );
}
