import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { DashboardStats, AnalyticsData } from '../../types';
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
} from 'recharts';
import {
  DollarSign,
  Ticket,
  Users,
  Percent,
  Calendar,
  Film,
  Building2,
  ListOrdered,
  TrendingUp,
} from 'lucide-react';

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reports, setReports] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [statsRes, reportsRes] = await Promise.all([
          adminApi.getStats(),
          adminApi.getReports(),
        ]);
        if (statsRes.data.success) setStats(statsRes.data.data);
        if (reportsRes.data.success) setReports(reportsRes.data.data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const kpis = stats?.kpis;

  return (
    <AdminLayout
      title="Admin Dashboard"
      subtitle="Real-time ticket booking statistics, revenue analytics, and system health."
    >
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="bg-slate-900 rounded-3xl h-32 border border-slate-800"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* KPI Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Total Revenue */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Revenue</span>
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                  ₹{kpis?.totalRevenue.toLocaleString() || 0}
                </span>
                <div className="text-xs text-emerald-400 mt-1 font-semibold">
                  +₹{kpis?.todayRevenue.toLocaleString() || 0} today
                </div>
              </div>
            </div>

            {/* Total Bookings */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Confirmed Bookings</span>
                <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center border border-brand-500/20">
                  <Ticket className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                  {kpis?.totalBookings || 0}
                </span>
                <div className="text-xs text-brand-400 mt-1 font-semibold">
                  {kpis?.todayBookings || 0} bookings today
                </div>
              </div>
            </div>

            {/* Occupancy Rate */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Seat Occupancy</span>
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                  <Percent className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                  {kpis?.occupancyRate || '0.0%'}
                </span>
                <div className="text-xs text-slate-400 mt-1">
                  {kpis?.soldSeats || 0} sold of {kpis?.totalSeats || 0} total
                </div>
              </div>
            </div>

            {/* Active Customers */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Registered Users</span>
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                  {kpis?.totalUsers || 0}
                </span>
                <div className="text-xs text-cyan-400 mt-1 font-semibold">
                  {kpis?.waitlistedUsers || 0} currently on waitlists
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Revenue Trend Area Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    30-Day Revenue Trend
                  </h3>
                  <p className="text-xs text-slate-400">Daily gross booking revenue</p>
                </div>
              </div>

              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={reports?.dailyTrend || []}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
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
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue (₹)"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#revenueGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Venue Occupancy Bar Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-400" />
                    Venue Occupancy Rate (%)
                  </h3>
                  <p className="text-xs text-slate-400">Current ticket fill percentage across venues</p>
                </div>
              </div>

              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reports?.venueOccupancy || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="venueName" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} unit="%" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="occupancyRate" name="Occupancy %" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top Popular Events Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-brand-400" />
              Most Popular Events by Gross Revenue
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                    <th className="py-3 px-4">Event Title</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Confirmed Bookings</th>
                    <th className="py-3 px-4 text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {(reports?.popularEvents || []).map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                        {ev.posterUrl && (
                          <img src={ev.posterUrl} alt="" className="w-8 h-10 object-cover rounded" />
                        )}
                        <span>{ev.title}</span>
                      </td>
                      <td className="py-3 px-4 uppercase text-[10px] font-bold text-brand-400">
                        {ev.type}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold">{ev.totalBookings} bookings</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                        ₹{ev.totalRevenue.toLocaleString()}
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
