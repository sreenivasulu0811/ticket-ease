import { useState, useEffect } from 'react';
import { eventsApi } from '../../services/api';
import { Event } from '../../types';
import AdminLayout from '../../components/admin/AdminLayout';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Film, Star, Clock, X, Check } from 'lucide-react';

export default function EventsAdmin() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'MOVIE' as 'MOVIE' | 'CONCERT',
    language: 'English',
    duration: 120,
    category: 'Action',
    castOrArtist: '',
    posterUrl: '',
    backdropUrl: '',
    status: 'ACTIVE' as 'ACTIVE' | 'UPCOMING' | 'DRAFT' | 'ARCHIVED',
    rating: 4.5,
  });

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const res = await eventsApi.getAll();
      if (res.data.success) setEvents(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const openCreateModal = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      description: '',
      type: 'MOVIE',
      language: 'English',
      duration: 120,
      category: 'Action',
      castOrArtist: '',
      posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80',
      backdropUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80',
      status: 'ACTIVE',
      rating: 4.5,
    });
    setModalOpen(true);
  };

  const openEditModal = (ev: Event) => {
    setEditingEvent(ev);
    setFormData({
      title: ev.title,
      description: ev.description,
      type: ev.type,
      language: ev.language,
      duration: ev.duration,
      category: ev.category,
      castOrArtist: ev.castOrArtist || '',
      posterUrl: ev.posterUrl,
      backdropUrl: ev.backdropUrl || '',
      status: ev.status,
      rating: ev.rating || 4.5,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        await eventsApi.update(editingEvent.id, formData);
        toast.success('Event updated successfully');
      } else {
        await eventsApi.create(formData);
        toast.success('Event created successfully');
      }
      setModalOpen(false);
      fetchEvents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save event');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event? All scheduled shows will also be removed.')) return;
    try {
      await eventsApi.delete(id);
      toast.success('Event deleted');
      fetchEvents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete event');
    }
  };

  return (
    <AdminLayout
      title="Events Management"
      subtitle="Create, publish, edit and manage movies and live concert events."
      actions={
        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors shadow-md shadow-brand-600/20"
        >
          <Plus className="w-4 h-4" />
          Add New Event
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
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Genre / Category</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-white flex items-center gap-3">
                      {ev.posterUrl && (
                        <img src={ev.posterUrl} alt="" className="w-9 h-12 object-cover rounded-lg flex-shrink-0" />
                      )}
                      <div>
                        <span className="text-sm font-bold block text-white">{ev.title}</span>
                        <span className="text-[11px] text-slate-400 font-light">{ev.language}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 uppercase text-[10px] font-bold text-brand-400">
                      {ev.type}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-medium">{ev.category}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono">{ev.duration} mins</td>
                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-1 font-bold text-amber-400">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {ev.rating || 4.5}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {ev.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(ev)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="Edit Event"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(ev.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950/40 text-red-400 transition-colors"
                        title="Delete Event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white">
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-slate-300 font-semibold block mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Event Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="MOVIE">Movie</option>
                    <option value="CONCERT">Concert</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Category / Genre</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Action / Thriller, Pop"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Language</label>
                  <input
                    type="text"
                    required
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    required
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-slate-300 font-semibold block mb-1">Cast / Artists</label>
                  <input
                    type="text"
                    value={formData.castOrArtist}
                    onChange={(e) => setFormData({ ...formData, castOrArtist: e.target.value })}
                    placeholder="e.g. Actor 1, Actor 2 or Band Name"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-slate-300 font-semibold block mb-1">Description</label>
                  <textarea
                    rows={3}
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-slate-300 font-semibold block mb-1">Poster Image URL</label>
                  <input
                    type="url"
                    required
                    value={formData.posterUrl}
                    onChange={(e) => setFormData({ ...formData, posterUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold transition-colors"
                >
                  {editingEvent ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
