import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { seatsApi, waitlistApi } from '../services/api';
import { ShowSeatMap, FormattedSeat } from '../types';
import { useAuth } from '../context/AuthContext';
import SeatMap from '../components/seatmap/SeatMap';
import HoldCountdownBanner from '../components/booking/HoldCountdownBanner';
import toast from 'react-hot-toast';
import {
  Calendar,
  Clock,
  MapPin,
  Ticket,
  ArrowLeft,
  Lock,
  Sparkles,
  Users,
  AlertTriangle,
} from 'lucide-react';

export default function SeatSelectionPage() {
  const { showId } = useParams<{ showId: string }>();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [seatMap, setSeatMap] = useState<ShowSeatMap | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<FormattedSeat[]>([]);
  const [holdToken, setHoldToken] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHolding, setIsHolding] = useState(false);
  const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false);
  const [waitlistModalOpen, setWaitlistModalOpen] = useState(false);
  const [requestedWaitlistSeats, setRequestedWaitlistSeats] = useState(2);

  // Load existing hold token from session if available
  useEffect(() => {
    const savedToken = sessionStorage.getItem(`ticketease_hold_${showId}`);
    const savedExpiry = sessionStorage.getItem(`ticketease_expiry_${showId}`);
    if (savedToken && savedExpiry) {
      if (new Date(savedExpiry).getTime() > Date.now()) {
        setHoldToken(savedToken);
        setHoldExpiresAt(savedExpiry);
      } else {
        sessionStorage.removeItem(`ticketease_hold_${showId}`);
        sessionStorage.removeItem(`ticketease_expiry_${showId}`);
      }
    }
  }, [showId]);

  // Fetch show seats & setup auto-refresh polling (every 8 seconds)
  const fetchSeatMap = useCallback(
    async (showLoading = false) => {
      if (!showId) return;
      if (showLoading) setIsLoading(true);
      try {
        const res = await seatsApi.getShowSeats(showId, holdToken || undefined);
        if (res.data.success) {
          setSeatMap(res.data.data);
        }
      } catch (err: any) {
        console.error('Failed to load seats:', err);
        toast.error('Failed to load seat layout.');
      } finally {
        if (showLoading) setIsLoading(false);
      }
    },
    [showId, holdToken]
  );

  useEffect(() => {
    fetchSeatMap(true);
    // Polling interval to reflect real-time holds and bookings from other users
    const interval = setInterval(() => {
      fetchSeatMap(false);
    }, 8000);
    return () => clearInterval(interval);
  }, [fetchSeatMap]);

  // Toggle seat selection
  const handleToggleSeat = (seat: FormattedSeat) => {
    if (seat.status !== 'AVAILABLE' && !seat.isHeldByMe) {
      toast.error(`Seat ${seat.rowLabel}${seat.seatNumber} is ${seat.status.toLowerCase()}`);
      return;
    }

    const isAlreadySelected = selectedSeats.some((s) => s.id === seat.id);

    if (isAlreadySelected) {
      setSelectedSeats(selectedSeats.filter((s) => s.id !== seat.id));
    } else {
      if (selectedSeats.length >= 10) {
        toast.error('You can select a maximum of 10 seats per booking.');
        return;
      }
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  // Hold seats and proceed to checkout
  const handleHoldAndProceed = async () => {
    if (!isAuthenticated) {
      toast('Please sign in to complete your seat reservation', { icon: '🔒' });
      navigate('/login', { state: { from: `/seat-selection/${showId}` } });
      return;
    }

    if (selectedSeats.length === 0) {
      toast.error('Please select at least one seat.');
      return;
    }

    setIsHolding(true);
    try {
      const seatIds = selectedSeats.map((s) => s.id);
      const res = await seatsApi.holdSeats(showId!, seatIds);

      if (res.data.success) {
        const { holdToken: token, holdExpiresAt: expiry, pricing } = res.data.data;
        setHoldToken(token);
        setHoldExpiresAt(expiry);
        sessionStorage.setItem(`ticketease_hold_${showId}`, token);
        sessionStorage.setItem(`ticketease_expiry_${showId}`, expiry);

        toast.success('Seats reserved for 5 minutes!');

        // Navigate directly to checkout
        navigate('/checkout', {
          state: {
            showId,
            holdToken: token,
            holdExpiresAt: expiry,
            seats: selectedSeats,
            pricing,
            event: seatMap?.show.event,
            show: seatMap?.show,
          },
        });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to hold seats. They may have been taken.';
      toast.error(msg);
      // Refresh seat map to show updated unavailable seats
      fetchSeatMap(false);
      setSelectedSeats([]);
    } finally {
      setIsHolding(false);
    }
  };

  // Release hold manually
  const handleReleaseHold = async () => {
    if (!holdToken || !showId) return;
    try {
      await seatsApi.releaseHold(showId, holdToken);
      sessionStorage.removeItem(`ticketease_hold_${showId}`);
      sessionStorage.removeItem(`ticketease_expiry_${showId}`);
      setHoldToken(null);
      setHoldExpiresAt(null);
      setSelectedSeats([]);
      toast.success('Hold released.');
      fetchSeatMap(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle hold timer expiry
  const handleHoldExpired = () => {
    sessionStorage.removeItem(`ticketease_hold_${showId}`);
    sessionStorage.removeItem(`ticketease_expiry_${showId}`);
    setHoldToken(null);
    setHoldExpiresAt(null);
    setSelectedSeats([]);
    toast.error('Your seat hold has expired. Please select your seats again.');
    fetchSeatMap(false);
  };

  // Join Waitlist for sold-out shows
  const handleJoinWaitlist = async () => {
    if (!isAuthenticated) {
      toast('Please sign in to join the waitlist', { icon: '🔒' });
      navigate('/login', { state: { from: `/seat-selection/${showId}` } });
      return;
    }

    setIsJoiningWaitlist(true);
    try {
      const res = await waitlistApi.join({
        showId: showId!,
        requestedSeats: requestedWaitlistSeats,
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Joined waitlist successfully!');
        setWaitlistModalOpen(false);
        navigate('/waitlist');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to join waitlist.';
      toast.error(msg);
    } finally {
      setIsJoiningWaitlist(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-400">Loading interactive seat layout...</p>
      </div>
    );
  }

  if (!seatMap) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <AlertTriangle className="w-12 h-12 text-red-400 mb-3" />
        <h2 className="text-xl font-bold">Show Not Available</h2>
        <Link to="/events" className="mt-4 text-brand-400 hover:underline text-sm">
          Return to Events
        </Link>
      </div>
    );
  }

  const { show, stats, seats } = seatMap;
  const showDate = new Date(show.startTime);
  const formattedDate = showDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = showDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Calculate pricing
  const subtotal = selectedSeats.reduce((sum, s) => sum + s.price, 0);
  const convenienceFee = selectedSeats.length > 0 ? 30.0 : 0;
  const grandTotal = subtotal + convenienceFee;
  const selectedSeatLabels = selectedSeats.map((s) => `${s.rowLabel}${s.seatNumber}`);

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen pb-32">
      {/* Hold Countdown Sticky Banner */}
      {holdExpiresAt && (
        <HoldCountdownBanner
          expiresAt={holdExpiresAt}
          onExpire={handleHoldExpired}
          onRelease={handleReleaseHold}
          seatLabels={selectedSeatLabels}
        />
      )}

      {/* Top Header */}
      <div className="bg-slate-900 border-b border-slate-800 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to={`/events/${show.event.id}`}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-400">
                {show.event.type} &bull; {show.event.category}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                {show.event.title}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                <span>{show.venue.name} ({show.screen.name})</span>
                <span>&bull;</span>
                <span className="text-slate-300 font-semibold">{formattedDate} at {formattedTime}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto text-xs font-mono">
            <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
              Available: <strong className="text-emerald-400">{stats.availableSeats}</strong> / {stats.totalSeats}
            </div>
          </div>
        </div>
      </div>

      {/* Main Seat Map Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {stats.isSoldOut ? (
          <div className="max-w-xl mx-auto my-12 p-8 rounded-3xl bg-slate-900 border border-amber-500/30 text-center shadow-2xl space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
              <Users className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white">House Full!</h2>
            <p className="text-sm text-slate-400 leading-relaxed font-light">
              All seats for this show are currently booked or reserved. Join the automated waitlist to be offered seats first when cancellations occur!
            </p>
            <button
              onClick={() => setWaitlistModalOpen(true)}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-colors shadow-lg shadow-amber-500/20"
            >
              Join FIFO Waitlist
            </button>
          </div>
        ) : (
          <SeatMap
            seats={seats}
            selectedSeatIds={selectedSeats.map((s) => s.id)}
            onToggleSeat={handleToggleSeat}
            rows={show.screen.rows}
            columns={show.screen.columns}
          />
        )}
      </div>

      {/* Floating Bottom Selection Bar */}
      {!stats.isSoldOut && selectedSeats.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur border-t border-slate-800 shadow-2xl p-4 sm:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 flex-shrink-0">
                <Ticket className="w-5 h-5" />
              </div>

              <div>
                <div className="text-xs text-slate-400">
                  Selected Seats ({selectedSeats.length}):
                </div>
                <div className="text-base font-bold text-white font-mono tracking-wide">
                  {selectedSeatLabels.join(', ')}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
              <div className="text-right">
                <div className="text-xs text-slate-400">
                  Subtotal: ₹{subtotal} + Fee: ₹{convenienceFee}
                </div>
                <div className="text-xl font-black text-emerald-400 font-mono">
                  ₹{grandTotal}
                </div>
              </div>

              <button
                disabled={isHolding}
                onClick={handleHoldAndProceed}
                className="px-6 sm:px-8 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-lg shadow-brand-600/30 flex items-center gap-2"
              >
                {isHolding ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Locking Seats...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Proceed to Pay</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Waitlist Modal */}
      {waitlistModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Automated Allocation
              </span>
              <h3 className="text-xl font-bold text-white mt-1">Join Show Waitlist</h3>
              <p className="text-xs text-slate-400 mt-1">
                You will be queued in strict FIFO order (First-In, First-Out). If seats open up, you get a 5-minute exclusive window to book.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Number of Requested Seats
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setRequestedWaitlistSeats(count)}
                    className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${
                      requestedWaitlistSeats === count
                        ? 'bg-amber-500 text-black border-amber-400'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                    }`}
                  >
                    {count} {count === 1 ? 'Seat' : 'Seats'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setWaitlistModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isJoiningWaitlist}
                onClick={handleJoinWaitlist}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold text-xs transition-colors shadow-lg shadow-amber-500/20"
              >
                {isJoiningWaitlist ? 'Joining...' : 'Confirm Waitlist Spot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
