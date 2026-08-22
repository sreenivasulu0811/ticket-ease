import { useMemo } from 'react';
import { FormattedSeat } from '../../types';
import { Lock, Check, Crown, Sparkles } from 'lucide-react';

interface SeatMapProps {
  seats: FormattedSeat[];
  selectedSeatIds: string[];
  onToggleSeat: (seat: FormattedSeat) => void;
  rows: number;
  columns: number;
  disabled?: boolean;
}

export default function SeatMap({
  seats,
  selectedSeatIds,
  onToggleSeat,
  disabled = false,
}: SeatMapProps) {
  // Group seats by rowLabel (A, B, C...)
  const rowGroups = useMemo(() => {
    const map = new Map<string, FormattedSeat[]>();
    seats.forEach((seat) => {
      if (!map.has(seat.rowLabel)) {
        map.set(seat.rowLabel, []);
      }
      map.get(seat.rowLabel)!.push(seat);
    });

    // Sort rows alphabetically and seats within row by seatNumber
    const sortedEntries = Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
    return sortedEntries.map(([rowLabel, rowSeats]) => ({
      rowLabel,
      seats: rowSeats.sort((a, b) => a.seatNumber - b.seatNumber),
    }));
  }, [seats]);

  const getSeatStyling = (seat: FormattedSeat, isSelected: boolean) => {
    if (isSelected) {
      return 'bg-brand-600 border-brand-400 text-white shadow-lg shadow-brand-500/50 scale-105 ring-2 ring-brand-400 z-10';
    }

    switch (seat.status) {
      case 'BOOKED':
        return 'bg-slate-900/90 border-slate-800 text-slate-600 cursor-not-allowed opacity-40';
      case 'HELD':
        return seat.isHeldByMe
          ? 'bg-brand-700 border-brand-400 text-white animate-pulse'
          : 'bg-amber-950/80 border-amber-800/80 text-amber-500/80 cursor-not-allowed opacity-75';
      case 'BLOCKED':
        return 'bg-slate-900 border-slate-800 text-slate-700 cursor-not-allowed';
      case 'AVAILABLE':
      default:
        if (seat.seatType === 'VIP') {
          return 'bg-amber-950/30 border-amber-500/60 text-amber-300 hover:border-amber-400 hover:bg-amber-900/50 hover:scale-105';
        }
        if (seat.seatType === 'PREMIUM') {
          return 'bg-purple-950/30 border-purple-500/60 text-purple-300 hover:border-purple-400 hover:bg-purple-900/50 hover:scale-105';
        }
        return 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-brand-500 hover:bg-brand-950/40 hover:text-white hover:scale-105';
    }
  };

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* Screen Graphic */}
      <div className="w-full max-w-2xl mb-10 flex flex-col items-center">
        <div className="w-3/4 h-2 bg-gradient-to-r from-transparent via-brand-500 to-transparent rounded-full shadow-[0_0_20px_rgba(59,130,246,0.6)]"></div>
        <div className="w-full h-12 bg-gradient-to-b from-brand-500/10 to-transparent clip-path-trapezoid flex items-center justify-center">
          <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-brand-400">
            SCREEN THIS WAY
          </span>
        </div>
      </div>

      {/* Seat Grid Layout */}
      <div className="w-full overflow-x-auto pb-6 flex justify-center">
        <div className="min-w-fit px-4 space-y-3">
          {rowGroups.map(({ rowLabel, seats: rowSeats }) => (
            <div key={rowLabel} className="flex items-center gap-3 justify-center">
              {/* Left Row Label */}
              <span className="w-6 text-xs font-bold text-slate-400 text-right">
                {rowLabel}
              </span>

              {/* Seats in row */}
              <div className="flex items-center gap-2">
                {rowSeats.map((seat, index) => {
                  const isSelected = selectedSeatIds.includes(seat.id) || selectedSeatIds.includes(seat.seatId);
                  const isClickable = !disabled && (seat.status === 'AVAILABLE' || seat.isHeldByMe || isSelected);

                  // Add an aisle gap in the middle if more than 6 columns
                  const hasAisle = rowSeats.length > 6 && index === Math.floor(rowSeats.length / 2) - 1;

                  return (
                    <div key={seat.id} className="flex items-center">
                      <button
                        type="button"
                        disabled={!isClickable}
                        onClick={() => onToggleSeat(seat)}
                        title={`Seat ${seat.rowLabel}${seat.seatNumber} (${seat.seatType}) — ₹${seat.price} [${seat.status}]`}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg border text-xs font-medium flex items-center justify-center transition-all duration-150 relative group ${getSeatStyling(
                          seat,
                          isSelected
                        )}`}
                      >
                        {isSelected ? (
                          <Check className="w-4 h-4 text-white stroke-[3]" />
                        ) : seat.status === 'HELD' && !seat.isHeldByMe ? (
                          <Lock className="w-3.5 h-3.5" />
                        ) : (
                          <span>{seat.seatNumber}</span>
                        )}

                        {/* VIP / Premium mini badge indicator */}
                        {seat.status === 'AVAILABLE' && seat.seatType === 'VIP' && (
                          <Crown className="w-2.5 h-2.5 absolute -top-1 -right-1 text-amber-400" />
                        )}
                        {seat.status === 'AVAILABLE' && seat.seatType === 'PREMIUM' && (
                          <Sparkles className="w-2.5 h-2.5 absolute -top-1 -right-1 text-purple-400" />
                        )}
                      </button>

                      {hasAisle && <div className="w-6 sm:w-8" />}
                    </div>
                  );
                })}
              </div>

              {/* Right Row Label */}
              <span className="w-6 text-xs font-bold text-slate-400 text-left">
                {rowLabel}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 pt-6 border-t border-slate-800/80 w-full max-w-3xl flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border border-slate-600 bg-slate-800"></div>
          <span>Available (Regular)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border border-purple-500 bg-purple-950/40"></div>
          <span>Premium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border border-amber-500 bg-amber-950/40"></div>
          <span>VIP</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-brand-600 border border-brand-400"></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-950/80 border border-amber-800 text-amber-500 flex items-center justify-center">
            <Lock className="w-2.5 h-2.5" />
          </div>
          <span>Held (Reserved)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-900 border border-slate-800 opacity-50"></div>
          <span>Sold Out</span>
        </div>
      </div>
    </div>
  );
}
