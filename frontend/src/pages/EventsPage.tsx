import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { eventsApi } from '../services/api';
import { Event } from '../types';
import {
  Film,
  Music,
  Search,
  SlidersHorizontal,
  Star,
  Clock,
  ArrowUpDown,
  X,
} from 'lucide-react';

export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [type, setType] = useState(searchParams.get('type') || 'ALL');
  const [category, setCategory] = useState(searchParams.get('category') || 'ALL');
  const [city, setCity] = useState(searchParams.get('city') || 'ALL');
  const [language, setLanguage] = useState(searchParams.get('language') || 'ALL');
  const [sort, setSort] = useState(searchParams.get('sort') || 'popular');

  useEffect(() => {
    const fetchFilteredEvents = async () => {
      setIsLoading(true);
      try {
        const query: any = {};
        if (search) query.search = search;
        if (type !== 'ALL') query.type = type;
        if (category !== 'ALL') query.category = category;
        if (city !== 'ALL') query.city = city;
        if (language !== 'ALL') query.language = language;
        if (sort) query.sort = sort;

        const res = await eventsApi.getAll(query);
        if (res.data.success) {
          let list = res.data.data;
          // Apply client-side sorting if needed
          if (sort === 'price_asc') {
            list = [...list].sort((a, b) => (a.minPrice || 0) - (b.minPrice || 0));
          } else if (sort === 'price_desc') {
            list = [...list].sort((a, b) => (b.minPrice || 0) - (a.minPrice || 0));
          }
          setEvents(list);
        }
      } catch (err) {
        console.error('Failed to load filtered events:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFilteredEvents();
  }, [search, type, category, city, language, sort]);

  const handleResetFilters = () => {
    setSearch('');
    setType('ALL');
    setCategory('ALL');
    setCity('ALL');
    setLanguage('ALL');
    setSort('popular');
    setSearchParams({});
  };

  const categories = ['ALL', 'Action / Drama', 'Pop / Live Concert', 'Biography / Thriller', 'Rock / Alternative', 'Sci-Fi / Adventure'];
  const cities = ['ALL', 'Bengaluru', 'Mumbai', 'Delhi NCR'];
  const languages = ['ALL', 'English', 'Telugu / Hindi'];

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Explore Movies &amp; Concerts
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-light">
            Browse upcoming shows, view live seat availability, and book tickets instantly.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 mb-10 shadow-xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search titles, artists, keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                aria-label="Filter by Event Type"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="ALL">All Event Types</option>
                <option value="MOVIE">Movies Only</option>
                <option value="CONCERT">Concerts Only</option>
              </select>
            </div>

            {/* City Filter */}
            <div>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                aria-label="Filter by City"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="ALL">All Cities</option>
                {cities.filter((c) => c !== 'ALL').map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Sort Events"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="popular">Most Popular</option>
                <option value="newest">Newest Releases</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Secondary Filter Chips */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-500 font-semibold uppercase text-[10px]">Genre / Category:</span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    category === cat
                      ? 'bg-brand-600 text-white font-semibold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {cat === 'ALL' ? 'All Genres' : cat.split(' / ')[0]}
                </button>
              ))}
            </div>

            {(search || type !== 'ALL' || category !== 'ALL' || city !== 'ALL' || language !== 'ALL') && (
              <button
                onClick={handleResetFilters}
                className="text-brand-400 hover:text-brand-300 font-medium hover:underline"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Results Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-slate-900 rounded-2xl h-96 animate-pulse border border-slate-800"></div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800 max-w-lg mx-auto">
            <Film className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white">No matching events found</h3>
            <p className="text-sm text-slate-400 mt-1">Try adjusting your keyword, city, or genre filters.</p>
            <button
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-500"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {events.map((event) => (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="group bg-slate-900 rounded-2xl border border-slate-800/80 hover:border-brand-500/60 overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1.5 shadow-xl"
              >
                {/* Poster */}
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-800">
                  <img
                    src={event.posterUrl}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80"></div>

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

                {/* Content */}
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
                      <span className="text-[10px] text-slate-500 uppercase block">From</span>
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
      </div>
    </div>
  );
}
