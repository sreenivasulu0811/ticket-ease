import { useState, useEffect } from 'react';
import { showsApi, eventsApi, venuesApi } from '../../services/api';
import { Show, Event, Venue } from '../../types';
import AdminLayout from '../../components/admin/AdminLayout';
import toast from 'react-hot-toast';
import { Plus, Calendar, Clock, MapPin, Trash2, X } from 'lucide-react';

export default function ShowsAdmin() {
  const [shows, setShows] = useState<Show[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    eventId: '',
    venueId: '',
    screenId: '',
    startTime: '',
    endTime: '',
    basePrice: 250,
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [showsRes, eventsRes, venuesRes] = await Promise.all([
        showsApi.getAll(),
        eventsApi.getAll(),
        venuesApi.getAll(),
      ]);
      if (showsRes.data.success) setShows(showsRes.data.data);
      if (eventsRes.data.success) setEvents(eventsRes.data.data);
      if (venuesRes.data.success) setVenues(venuesRes.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load shows');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = () => {
    const defaultEvent = events[0]?.id || '';
    const defaultVenue = venues[0];
    const defaultScreen = defaultVenue?.screens?.[0]?.id || '';

    const now = new Date();
    now.setHours(now.getHours() + 2, 0, 0, 0);
    const startStr = now.toISOString().slice(0, 16);

    const end = new Date(now);
    end.setHours(end.getHours() + 3);
    const endStr = end.toISOString().slice(0, 16);

    setForm({
      eventId: defaultEvent,
      venueId: defaultVenue?.id || '',
      screenId: defaultScreen,
      startTime: startStr,
      endTime: endStr,
      basePrice: 250,
    });
    setModalOpen(true);
  };

  const handleCreateShow = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await showsApi.create({
        eventId: form.eventId,
        screenId: form.screenId,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        basePrice: form.basePrice,
      });
      toast.success('Show scheduled & seat inventory initialized!');
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to schedule show (check for overlap)');
    }
  };

  const handleDeleteShow = async (id: string) => {
    if (!confirm('Are you sure you want to delete this show?')) return;
    try {
      await showsApi.delete(id);
      toast.success('Show deleted');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete show');
    }
  };

  // Find screens for selected venue
  const currentVenue = venues.find((v) => v.id === form.venueId);
  const availableScreens = currentVenue?.screens || [];

  return (
    <AdminLayout
      title="Shows &amp; Timetable Scheduling"
      subtitle="Schedule movie and concert showtimes with automated seat inventory creation and conflict prevention."
      actions={
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors shadow-md shadow-brand-600/20"
        >
          <Plus className="w-4 h-4" />
          Schedule New Show
        </button>
      }
    >
      {isLoading ? (
        <div className="bg-slate-900 rounded-3xl h-64 animate-pulse border border-slate-800"></div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold bg-slate-950/40">
                  <th className="py-3.5 px-4">Event</th>
                  <th className="py-3.5 px-4">Venue &amp; Screen</th>
                  <th className="py-3.5 px-4">Date &amp; Timing</th>
                  <th className="py-3.5 px-4">Base Price</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {shows.map((show) => {
                  const start = new Date(show.startTime);
                  const dateStr = start.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  });
                  const timeStr = start.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={show.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-white">
                        <span className="text-sm block">{show.event?.title}</span>
                        <span className="text-[10px] text-brand-400 uppercase font-mono">
                          {show.event?.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">{show.screen?.venue?.name}</div>
                        <div className="text-[11px] text-slate-400">{show.screen?.name} ({show.screen?.venue?.city})</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-brand-400" />
                          {dateStr}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" />
                          {timeStr}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400 text-sm">
                        ₹{show.basePrice}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {show.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteShow(show.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/40 text-red-400 transition-colors"
                          title="Delete Show"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schedule Show Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Schedule New Show</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShow} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Select Event</label>
                <select
                  required
                  value={form.eventId}
                  onChange={(e) => setForm({ ...form, eventId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Select Venue</label>
                <select
                  required
                  value={form.venueId}
                  onChange={(e) => {
                    const newVenueId = e.target.value;
                    const v = venues.find((x) => x.id === newVenueId);
                    setForm({
                      ...form,
                      venueId: newVenueId,
                      screenId: v?.screens?.[0]?.id || '',
                    });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                >
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Select Screen / Auditorium</label>
                <select
                  required
                  value={form.screenId}
                  onChange={(e) => setForm({ ...form, screenId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                >
                  {availableScreens.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.capacity} seats)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Base Ticket Price (₹)</label>
                <input
                  type="number"
                  min={50}
                  step={10}
                  required
                  value={form.basePrice}
                  onChange={(e) => setForm({ ...form, totalPrice: parseFloat(e.target.value) || 250 } as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
                🛡️ System automatically enforces Rule 11 (preventing overlapping showtimes on the same screen).
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-slate-400">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 rounded-xl bg-brand-600 text-white font-bold">
                  Schedule Show
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
