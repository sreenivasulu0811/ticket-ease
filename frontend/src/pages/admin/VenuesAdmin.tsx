import { useState, useEffect } from 'react';
import { venuesApi } from '../../services/api';
import { Venue } from '../../types';
import AdminLayout from '../../components/admin/AdminLayout';
import toast from 'react-hot-toast';
import { Building2, Plus, MapPin, Grid, X } from 'lucide-react';

export default function VenuesAdmin() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [venueModalOpen, setVenueModalOpen] = useState(false);
  const [screenModalOpen, setScreenModalOpen] = useState(false);
  const [selectedVenueId, setSelectedVenueId] = useState<string>('');

  const [venueForm, setVenueForm] = useState({
    name: '',
    location: '',
    address: '',
    city: 'Bengaluru',
    type: 'MOVIE_THEATRE',
    capacity: 100,
  });

  const [screenForm, setScreenForm] = useState({
    name: 'Audi 1 (IMAX)',
    rows: 6,
    columns: 10,
  });

  const fetchVenues = async () => {
    setIsLoading(true);
    try {
      const res = await venuesApi.getAll();
      if (res.data.success) setVenues(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load venues');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  const handleCreateVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await venuesApi.create(venueForm);
      toast.success('Venue created successfully');
      setVenueModalOpen(false);
      fetchVenues();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create venue');
    }
  };

  const handleCreateScreen = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await venuesApi.createScreen(selectedVenueId, screenForm);
      toast.success(`Screen layout (${screenForm.rows * screenForm.columns} seats) generated!`);
      setScreenModalOpen(false);
      fetchVenues();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create screen');
    }
  };

  return (
    <AdminLayout
      title="Venues &amp; Screen Layouts"
      subtitle="Manage multiplex theatres, concert arenas, auditoriums, and configure dynamic seat grids."
      actions={
        <button
          onClick={() => setVenueModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors shadow-md shadow-brand-600/20"
        >
          <Plus className="w-4 h-4" />
          Add New Venue
        </button>
      }
    >
      {isLoading ? (
        <div className="bg-slate-900 rounded-3xl h-64 animate-pulse border border-slate-800"></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {venues.map((venue) => (
            <div
              key={venue.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400 font-mono">
                    {venue.type.replace('_', ' ')}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">{venue.name}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {venue.location}, {venue.city}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSelectedVenueId(venue.id);
                    setScreenModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-brand-300 text-xs font-semibold flex items-center gap-1 transition-colors border border-slate-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Screen / Hall
                </button>
              </div>

              {/* Screens List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Configured Screens / Auditoriums
                </span>

                {(!venue.screens || venue.screens.length === 0) ? (
                  <p className="text-xs text-slate-500 italic">No screens created for this venue yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {venue.screens.map((screen) => (
                      <div
                        key={screen.id}
                        className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 font-medium text-slate-200">
                          <Grid className="w-4 h-4 text-purple-400" />
                          <span>{screen.name}</span>
                        </div>
                        <span className="font-mono text-slate-400 text-[11px]">
                          {screen.rows} rows &times; {screen.columns} cols ({screen.capacity} seats)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Venue Modal */}
      {venueModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Add New Venue</h3>
              <button onClick={() => setVenueModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVenue} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Venue Name</label>
                <input
                  type="text"
                  required
                  value={venueForm.name}
                  onChange={(e) => setVenueForm({ ...venueForm, name: e.target.value })}
                  placeholder="e.g. Cinepolis Grand Central"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Venue Type</label>
                <select
                  value={venueForm.type}
                  onChange={(e) => setVenueForm({ ...venueForm, type: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="MOVIE_THEATRE">Movie Theatre / Multiplex</option>
                  <option value="CONCERT_HALL">Concert Hall / Arena</option>
                  <option value="ARENA">Sports / Music Arena</option>
                  <option value="AUDITORIUM">Auditorium</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={venueForm.city}
                    onChange={(e) => setVenueForm({ ...venueForm, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Location / Mall</label>
                  <input
                    type="text"
                    required
                    value={venueForm.location}
                    onChange={(e) => setVenueForm({ ...venueForm, location: e.target.value })}
                    placeholder="e.g. DLF Cyber City"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={venueForm.address}
                  onChange={(e) => setVenueForm({ ...venueForm, address: e.target.value })}
                  placeholder="e.g. Sector 24, Cyber Hub"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setVenueModalOpen(false)} className="px-4 py-2 text-slate-400">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 rounded-xl bg-brand-600 text-white font-bold">
                  Create Venue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Screen Layout Modal */}
      {screenModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Configure Screen Layout</h3>
              <button onClick={() => setScreenModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateScreen} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Screen / Hall Name</label>
                <input
                  type="text"
                  required
                  value={screenForm.name}
                  onChange={(e) => setScreenForm({ ...screenForm, name: e.target.value })}
                  placeholder="e.g. Audi 1 (Dolby Atmos)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Rows (A - Z)</label>
                  <input
                    type="number"
                    min={1}
                    max={26}
                    required
                    value={screenForm.rows}
                    onChange={(e) => setScreenForm({ ...screenForm, rows: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">Generates A through {String.fromCharCode(64 + screenForm.rows)}</span>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Seats per Row</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    required
                    value={screenForm.columns}
                    onChange={(e) => setScreenForm({ ...screenForm, columns: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">1 through {screenForm.columns}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p>
                  Total generated capacity:{' '}
                  <strong className="text-brand-400 font-mono font-bold">
                    {screenForm.rows * screenForm.columns} seats
                  </strong>
                </p>
                <p className="text-[10px] text-slate-500">
                  Rows A-B automatically marked VIP (1.5x), Rows C-D Premium (1.25x), remaining Regular (1.0x).
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setScreenModalOpen(false)} className="px-4 py-2 text-slate-400">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold">
                  Generate Layout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
