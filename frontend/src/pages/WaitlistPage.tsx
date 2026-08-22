import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { waitlistApi, bookingsApi } from '../services/api';
import { WaitlistEntry } from '../types';
import { useHoldTimer } from '../hooks/useHoldTimer';
import toast from 'react-hot-toast';
import {
  ListOrdered,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function WaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchWaitlist = async () => {
    try {
      const res = await waitlistApi.getMyWaitlist();
      if (res.data.success) {
        setEntries(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load waitlist entries:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWaitlist();
    // Poll every 10s for new offers
    const interval = setInterval(fetchWaitlist, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAcceptOffer = async (entry: WaitlistEntry) => {
    setProcessingId(entry.id);
    try {
      // Create instant booking from waitlist offer
      const res = await bookingsApi.create({
        showId: entry.showId,
        waitlistEntryId: entry.id,
        paymentMethod: 'UPI',
        simulateStatus: 'SUCCESS',
      });

      if (res.data.success) {
        toast.success('Waitlist offer accepted! Booking confirmed.');
        navigate(`/booking-success/${res.data.data.id}`, {
          state: { booking: res.data.data },
        });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to accept offer. It may have expired.';
      toast.error(msg);
      fetchWaitlist();
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeclineOffer = async (entryId: string) => {
    setProcessingId(entryId);
    try {
      const res = await waitlistApi.declineOffer(entryId);
      if (res.data.success) {
        toast.success('Offer declined. Seats released to the next customer in queue.');
        fetchWaitlist();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to decline offer.';
      toast.error(msg);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                <ListOrdered className="w-4 h-4" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                My Waitlists &amp; Offers
              </h1>
            </div>
            <p className="text-sm text-slate-400 mt-1 font-light">
              Automatic FIFO queue allocations when tickets become available.
            </p>
          </div>

          <Link
            to="/events"
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors"
          >
            Explore Events
          </Link>
        </div>

        {/* List of Waitlists */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div key={n} className="bg-slate-900 rounded-3xl h-44 animate-pulse border border-slate-800"></div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-slate-800 max-w-lg mx-auto space-y-4">
            <ListOrdered className="w-12 h-12 text-slate-600 mx-auto" />
            <div>
              <h3 className="text-base font-bold text-white">No active waitlist entries</h3>
              <p className="text-xs text-slate-400 mt-1">
                When a show is marked "House Full", you can join its waitlist to be automatically queued for released seats.
              </p>
            </div>
            <Link
              to="/events"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors"
            >
              Browse Shows
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {entries.map((entry) => (
              <WaitlistEntryCard
                key={entry.id}
                entry={entry}
                onAccept={() => handleAcceptOffer(entry)}
                onDecline={() => handleDeclineOffer(entry.id)}
                isProcessing={processingId === entry.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WaitlistEntryCard({
  entry,
  onAccept,
  onDecline,
  isProcessing,
}: {
  entry: WaitlistEntry;
  onAccept: () => void;
  onDecline: () => void;
  isProcessing: boolean;
}) {
  const isOffered = entry.status === 'OFFERED';
  const { formatted, isExpired } = useHoldTimer(entry.offerExpiresAt);

  const showDate = new Date(entry.show.startTime);
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
    <div
      className={`rounded-3xl border p-6 transition-all shadow-xl space-y-4 ${
        isOffered && !isExpired
          ? 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/20 border-amber-500/50 shadow-amber-500/10'
          : 'bg-slate-900 border-slate-800'
      }`}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Event Details */}
        <div className="flex gap-4 items-start">
          {entry.show.event.posterUrl && (
            <img
              src={entry.show.event.posterUrl}
              alt={entry.show.event.title}
              className="w-16 h-24 object-cover rounded-2xl border border-slate-700 flex-shrink-0"
            />
          )}

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {entry.show.event.type}
              </span>
              <span className="text-xs text-slate-400">
                Requested: <strong className="text-white">{entry.requestedSeats} seat(s)</strong>
              </span>
            </div>

            <h3 className="text-lg font-bold text-white leading-tight">
              {entry.show.event.title}
            </h3>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-brand-400" />
                {formattedDate}
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                {formattedTime}
              </span>
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>{entry.show.screen.venue.name} &bull; {entry.show.screen.name}</span>
            </div>
          </div>
        </div>

        {/* Right: Status / Queue Position Badge */}
        <div className="self-end md:self-auto text-right">
          {entry.status === 'WAITING' && (
            <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-center">
              <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider block">
                Queue Position
              </span>
              <span className="text-2xl font-black text-white font-mono">
                #{entry.queuePosition || 1}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">FIFO Priority</span>
            </div>
          )}

          {entry.status === 'ACCEPTED' && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Offer Accepted
            </div>
          )}

          {entry.status === 'DECLINED' && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-bold">
              <XCircle className="w-3.5 h-3.5" />
              Declined
            </div>
          )}

          {entry.status === 'EXPIRED' && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-bold">
              <AlertCircle className="w-3.5 h-3.5" />
              Offer Expired
            </div>
          )}
        </div>
      </div>

      {/* Offer Action Banner */}
      {isOffered && !isExpired && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center font-bold flex-shrink-0 shadow-lg shadow-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-300">
                🎉 Seats Are Available For You!
              </h4>
              <p className="text-xs text-slate-300">
                {entry.requestedSeats} seat(s) allocated. Confirm before countdown expires:
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
            <div className="px-3 py-1 rounded-xl bg-black/60 border border-amber-500/40 font-mono text-sm font-bold text-amber-300">
              {formatted}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={onDecline}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Decline
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={onAccept}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-lg shadow-amber-500/20"
              >
                {isProcessing ? 'Confirming...' : 'Accept & Book'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
