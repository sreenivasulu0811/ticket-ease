import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { eventsApi } from '../services/api';
import { Event } from '../types';
import {
  Film,
  Music,
  Search,
  Star,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
} from 'lucide-react';

export default function HomePage() {
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [activeType, setActiveType] = useState<'ALL' | 'MOVIE' | 'CONCERT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featuredRes, allRes] = await Promise.all([
          eventsApi.getFeatured(),
          eventsApi.getAll(),
        ]);
        if (featuredRes.data.success) setFeaturedEvents(featuredRes.data.data);
        if (allRes.data.success) setAllEvents(allRes.data.data);
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (activeType !== 'ALL') params.set('type', activeType);
    if (selectedCity !== 'All Cities') params.set('city', selectedCity);
    navigate(`/events?${params.toString()}`);
  };

  const filteredList = allEvents.filter((ev) => {
    if (activeType !== 'ALL' && ev.type !== activeType) return false;
    return true;
  });

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-800/80 bg-radial-gradient">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.25),rgba(255,255,255,0))]"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart Movie &amp; Live Concert Booking Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
            Book Your Seat in <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">Real-Time</span> with Zero Conflicts
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-light">
            Interactive seat map, 5-minute concurrency lock, automated waitlist allocation, and tamper-proof digital QR tickets.
          </p>

          {/* Search Box */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-10 max-w-3xl mx-auto bg-slate-900/90 backdrop-blur border border-slate-800 p-2 sm:p-3 rounded-2xl sm:rounded-full shadow-2xl flex flex-col sm:flex-row items-center gap-2"
          >
            <div className="flex-1 flex items-center gap-3 px-4 w-full">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search movies, concerts, artists, or genres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div className="w-full sm:w-auto flex items-center gap-2 px-2">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                aria-label="Filter by City"
                className="bg-slate-800 text-slate-300 text-xs sm:text-sm rounded-lg sm:rounded-full px-3 py-2 border border-slate-700 focus:outline-none w-full sm:w-auto"
              >
                <option>All Cities</option>
                <option>Bengaluru</option>
                <option>Mumbai</option>
                <option>Delhi NCR</option>
              </select>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg sm:rounded-full bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-brand-600/30 flex items-center justify-center gap-1.5"
              >
                Explore
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Quick Filter Badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setActiveType('ALL')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeType === 'ALL'
                  ? 'bg-white text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setActiveType('MOVIE')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeType === 'MOVIE'
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              Movies
            </button>
            <button
              onClick={() => setActiveType('CONCERT')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeType === 'CONCERT'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              Concerts
            </button>
          </div>
        </div>
      </section>

      {/* Featured / Trending Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs uppercase tracking-widest text-brand-400 font-bold">Don't Miss Out</span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-0.5">
              {activeType === 'ALL' ? 'Trending Events' : activeType === 'MOVIE' ? 'Popular Movies' : 'Live Concerts'}
            </h2>
          </div>

          <Link
            to={`/events?type=${activeType !== 'ALL' ? activeType : ''}`}
            className="flex items-center gap-1.5 text-sm font-semibold text-brand-400 hover:text-brand-300 transition-colors"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-slate-900 rounded-2xl h-96 animate-pulse border border-slate-800"></div>
            ))}
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800">
            <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-300">No events found</h3>
            <p className="text-sm text-slate-500 mt-1">Try switching categories or clearing search filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredList.map((event) => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="group bg-slate-900 rounded-2xl border border-slate-800/80 hover:border-brand-500/60 overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5 shadow-xl hover:shadow-brand-500/10"
              >
                {/* Poster Image */}
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-800">
                  <img
                    src={event.posterUrl}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-900/90 text-white backdrop-blur border border-white/10">
                      {event.type}
                    </span>
                  </div>

                  {event.rating && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/90 text-black text-xs font-bold shadow">
                      <Star className="w-3 h-3 fill-black text-black" />
                      <span>{event.rating.toFixed(1)}</span>
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3 right-3 text-xs text-slate-300 flex items-center justify-between">
                    <span className="truncate">{event.language}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {event.duration}m
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-brand-400 uppercase tracking-wide">
                      {event.category}
                    </span>
                    <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors line-clamp-1 mt-0.5">
                      {event.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 font-light">
                      {event.castOrArtist || event.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Starting from</span>
                      <span className="text-sm font-bold text-white font-mono">
                        ₹{event.minPrice || 250}
                      </span>
                    </div>

                    <span className="px-3 py-1.5 rounded-lg bg-brand-600 group-hover:bg-brand-500 text-white text-xs font-semibold transition-colors">
                      Book Now
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Platform Guarantees Section */}
      <section className="bg-slate-900/60 border-y border-slate-800/80 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">How TicketEase Protects Your Experience</h2>
            <p className="mt-2 text-sm text-slate-400 font-light">
              Engineered with transactional database locking and high-availability queues.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/20">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Temporary 5-Min Seat Hold</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                When you click seats, they are instantly reserved exclusively for you. No race conditions, no double bookings.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4 border border-cyan-500/20">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">FIFO Automated Waitlists</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Sold-out show? Join the waitlist. When another user cancels, released seats are offered to the next in queue automatically.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Tamper-Proof QR Tickets</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Every confirmed ticket generates an encrypted single-use QR voucher that gates validate in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
