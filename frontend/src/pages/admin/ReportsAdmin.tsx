import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { AnalyticsData } from '../../types';
import AdminLayout from '../../components/admin/AdminLayout';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { BarChart3, TrendingUp, DollarSign, Building2, Film } from 'lucide-react';

export default function ReportsAdmin() {
  const [reports, setReports] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getReports()
      .then((res) => {
        if (res.data.success) setReports(res.data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <AdminLayout
      title="Analytics &amp; Financial Reports"
      subtitle="Detailed reporting on revenue streams, ticket velocity, and venue capacity utilization."
    >
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          <div className="bg-slate-900 rounded-3xl h-80 border border-slate-800"></div>
          <div className="bg-slate-900 rounded-3xl h-80 border border-slate-800"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Daily Booking Velocity */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand-400" />
                Daily Ticket Booking Velocity
              </h3>
              <p className="text-xs text-slate-400">Total ticket volume over the last 30 days</p>

              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reports?.dailyTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="bookings" name="Bookings Count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Daily Gross Revenue */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Daily Gross Revenue (₹)
              </h3>
              <p className="text-xs text-slate-400">Gross transaction earnings</p>

              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reports?.dailyTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Line type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#10b981" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Venue Occupancy Deep Dive */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-400" />
              Venue Seat Capacity &amp; Occupancy Performance
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                    <th className="py-3 px-4">Venue</th>
                    <th className="py-3 px-4">City</th>
                    <th className="py-3 px-4">Total Capacity</th>
                    <th className="py-3 px-4">Sold Seats</th>
                    <th className="py-3 px-4 text-right">Occupancy Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {(reports?.venueOccupancy || []).map((v, i) => (
                    <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-white">{v.venueName}</td>
                      <td className="py-3 px-4 text-slate-300">{v.city}</td>
                      <td className="py-3 px-4 font-mono">{v.totalSeats} seats</td>
                      <td className="py-3 px-4 font-mono font-semibold text-emerald-400">{v.bookedSeats} booked</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-purple-400 text-sm">
                        {v.occupancyRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
