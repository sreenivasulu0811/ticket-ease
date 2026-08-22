import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { eventsApi } from '../services/api';
import { Event, Show } from '../types';
import {
  Film,
  Star,
  Clock,
  Globe,
  MapPin,
  Calendar,
  ChevronRight,
  Sparkles,
  Users,
  AlertCircle,
} from 'lucide-react';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      try {
        const res = await eventsApi.getById(id);
        if (res.data.success) {
          setEvent(res.data.data);
          // Set initial date from first show if available
          if (res.data.data.shows && res.data.data.shows.length > 0) {
            const firstDate = new Date(res.data.data.shows[0].startTime)
              .toISOString()
              .split('T')[0];
            setSelectedDate(firstDate);
          }
        }
      } catch (err) {
        console.error('Failed to load event details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-400">Loading event details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
        <h2 className="text-xl font-bold">Event Not Found</h2>
        <Link to="/events" className="mt-4 text-brand-400 hover:underline text-sm">
          Return to Events Catalog
        </Link>
      </div>
    );
  }

  // Extract unique show dates
  const showDates = Array.from(
    new Set(
      (event.shows || []).map(
        (s) => new Date(s.startTime).toISOString().split('T')[0]
      )
    )
  ).sort();

  // Filter shows by selected date
  const filteredShows = (event.shows || []).filter((s) => {
    if (!selectedDate) return true;
    const showDate = new Date(s.startTime).toISOString().split('T')[0];
    return showDate === selectedDate;
  });

  // Group shows by Venue -> Screen
  const venueGroups = new Map<string, { venue: any; screens: Map<string, { screen: any; shows: Show[] }> }>();

  filteredShows.forEach((show) => {
    const venue = show.screen?.venue;
    const screen = show.screen;
    if (!venue || !screen) return;

    if (!venueGroups.has(venue.id)) {
      venueGroups.set(venue.id, { venue, screens: new Map() });
    }

    const vEntry = venueGroups.get(venue.id)!;
    if (!vEntry.screens.has(screen.id)) {
      vEntry.screens.set(screen.id, { screen, shows: [] });
    }

    vEntry.screens.get(screen.id)!.shows.push(show);
  });

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen">
      {/* Backdrop & Header Banner */}
      <div className="relative w-full bg-slate-900 border-b border-slate-800">
        {event.backdropUrl && (
          <div className="absolute inset-0 overflow-hidden opacity-25">
            <img
              src={event.backdropUrl}
              alt=""
              className="w-full h-full object-cover blur-md scale-105"
            />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            {/* Poster Card */}
            <div className="w-56 sm:w-64 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-slate-700/80 flex-shrink-0 bg-slate-800">
              <img
                src={event.posterUrl}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Event Metadata */}
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-600/90 text-white">
                  {event.type}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  {event.category}
                </span>
                {event.rating && (
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{event.rating.toFixed(1)} / 5.0</span>
                  </div>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                {event.title}
              </h1>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-slate-300 font-light">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-brand-400" />
                  {event.duration} minutes
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-purple-400" />
                  {event.language}
                </span>
              </div>

              <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed max-w-3xl">
                {event.description}
              </p>

              {event.castOrArtist && (
                <div className="pt-2">
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block mb-1">
                    {event.type === 'MOVIE' ? 'Cast & Crew' : 'Featured Artists'}
                  </span>
                  <p className="text-sm font-medium text-slate-200">{event.castOrArtist}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Showtimes & Booking Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 border-b border-slate-800 pb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Select Date &amp; Showtime</h2>
            <p className="text-xs text-slate-400 mt-0.5">Pick your preferred hall and show timing to choose seats.</p>
          </div>

          {/* Date Selector Tabs */}
          {showDates.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-2 sm:pb-0">
              {showDates.map((dateStr) => {
                const dateObj = new Date(dateStr + 'T00:00:00');
                const isSelected = selectedDate === dateStr;
                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`flex flex-col items-center px-4 py-2 rounded-xl transition-all border ${
                      isSelected
                        ? 'bg-brand-600 text-white border-brand-500 shadow-lg shadow-brand-600/30'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span className="text-base font-bold">
                      {dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Venues & Showtimes List */}
        {venueGroups.size === 0 ? (
          <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800">
            <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-300">No shows scheduled for this date</h3>
            <p className="text-xs text-slate-500 mt-1">Please select another date above or check back soon.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from(venueGroups.values()).map(({ venue, screens }) => (
              <div
                key={venue.id}
                className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6"
              >
                {/* Venue Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-brand-400 flex-shrink-0" />
                      {venue.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 ml-6">
                      {venue.location}, {venue.address} &bull; <strong className="text-slate-300">{venue.city}</strong>
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 uppercase self-start sm:self-auto">
                    {venue.type.replace('_', ' ')}
                  </span>
                </div>

                {/* Screens in this venue */}
                <div className="space-y-4">
                  {Array.from(screens.values()).map(({ screen, shows }) => (
                    <div key={screen.id} className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                        <span className="w-2 h-2 rounded-full bg-brand-500"></span>
                        <span>{screen.name}</span>
                        <span className="text-slate-500 text-[10px]">({screen.capacity} seats)</span>
                      </div>

                      {/* Showtime Buttons */}
                      <div className="flex flex-wrap items-center gap-3">
                        {shows.map((show) => {
                          const showTime = new Date(show.startTime);
                          const timeStr = showTime.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          });

                          return (
                            <Link
                              key={show.id}
                              to={`/seat-selection/${show.id}`}
                              className={`group relative flex flex-col p-3 rounded-xl border transition-all text-left min-w-[130px] ${
                                show.isSoldOut
                                  ? 'bg-amber-950/20 border-amber-800/40 hover:border-amber-600'
                                  : 'bg-slate-800/80 border-slate-700 hover:border-brand-400 hover:bg-brand-950/30'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-bold text-white group-hover:text-brand-300">
                                  {timeStr}
                                </span>
                                {show.isSoldOut ? (
                                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                    Full
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                                    Avail
                                  </span>
                                )}
                              </div>

                              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                                <span>₹{show.basePrice}</span>
                                {show.isSoldOut && (
                                  <span className="text-[10px] text-amber-400 underline">Join Waitlist</span>
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
