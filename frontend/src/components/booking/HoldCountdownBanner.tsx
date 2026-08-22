import { Clock, AlertTriangle } from 'lucide-react';
import { useHoldTimer } from '../../hooks/useHoldTimer';

interface HoldCountdownBannerProps {
  expiresAt: string | null | undefined;
  onExpire: () => void;
  onRelease?: () => void;
  seatLabels: string[];
}

export default function HoldCountdownBanner({
  expiresAt,
  onExpire,
  onRelease,
  seatLabels,
}: HoldCountdownBannerProps) {
  const { formatted, isExpired, totalSeconds } = useHoldTimer(expiresAt, onExpire);

  if (!expiresAt) return null;

  const isUrgent = totalSeconds < 60;

  return (
    <div
      className={`sticky top-16 z-40 w-full px-4 py-2.5 transition-colors border-b flex items-center justify-between shadow-md ${
        isExpired
          ? 'bg-red-900/90 text-red-100 border-red-700'
          : isUrgent
          ? 'bg-amber-900/90 text-amber-100 border-amber-700 animate-pulse'
          : 'bg-indigo-950/90 text-indigo-100 border-indigo-800 backdrop-blur'
      }`}
    >
      <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          {isExpired ? (
            <AlertTriangle className="w-5 h-5 text-red-300" />
          ) : (
            <Clock className={`w-5 h-5 ${isUrgent ? 'text-amber-300' : 'text-indigo-300'}`} />
          )}

          <span>
            {isExpired ? (
              <strong className="font-bold">Hold expired!</strong>
            ) : (
              <>
                Seats <strong className="text-white font-bold">{seatLabels.join(', ')}</strong> reserved for you
              </>
            )}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-mono text-base font-bold bg-black/40 px-3 py-1 rounded-lg border border-white/10">
            <span className={isUrgent ? 'text-amber-300' : 'text-white'}>{formatted}</span>
          </div>

          {onRelease && !isExpired && (
            <button
              onClick={onRelease}
              className="text-xs text-slate-300 hover:text-white underline transition-colors"
            >
              Release Seats
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
