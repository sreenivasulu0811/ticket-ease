import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { WaitlistEntry } from '../../types';
import AdminLayout from '../../components/admin/AdminLayout';
import toast from 'react-hot-toast';
import { ListOrdered, Clock, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

export default function WaitlistAdmin() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getAllWaitlist()
      .then((res) => {
        if (res.data.success) setEntries(res.data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <AdminLayout
      title="Waitlist Activity &amp; Allocations"
      subtitle="Monitor FIFO queue positions, active seat offers, and conversion rates across sold-out shows."
    >
      {isLoading ? (
        <div className="bg-slate-900 rounded-3xl h-64 animate-pulse border border-slate-800"></div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold bg-slate-950/40">
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Event</th>
                  <th className="py-3.5 px-4">Show Date &amp; Time</th>
                  <th className="py-3.5 px-4">Requested</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Offer Expiry</th>
                  <th className="py-3.5 px-4 text-right">Queued At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {entries.map((entry) => {
                  const showDate = new Date(entry.show.startTime);

                  return (
                    <tr key={entry.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{(entry as any).user?.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{(entry as any).user?.email}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-200">
                        {entry.show.event.title}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {showDate.toLocaleDateString()} at {showDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        {entry.requestedSeats} seat(s)
                      </td>
                      <td className="py-3 px-4">
                        {entry.status === 'WAITING' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            Waiting (FIFO)
                          </span>
                        )}
                        {entry.status === 'OFFERED' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30 animate-pulse">
                            Offer Active
                          </span>
                        )}
                        {entry.status === 'ACCEPTED' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Accepted ✓
                          </span>
                        )}
                        {entry.status === 'EXPIRED' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-red-500/10 text-red-400 border border-red-500/20">
                            Expired
                          </span>
                        )}
                        {entry.status === 'DECLINED' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-400">
                            Declined
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {entry.offerExpiresAt ? new Date(entry.offerExpiresAt).toLocaleTimeString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400">
                        {new Date(entry.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
