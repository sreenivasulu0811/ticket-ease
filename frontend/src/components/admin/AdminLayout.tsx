import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Film,
  Building2,
  CalendarDays,
  Ticket,
  Users,
  ListOrdered,
  BarChart3,
  QrCode,
  ArrowLeft,
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function AdminLayout({ children, title, subtitle, actions }: AdminLayoutProps) {
  const location = useLocation();

  const navItems = [
    { label: 'Overview', path: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'Events', path: '/admin/events', icon: Film },
    { label: 'Venues & Screens', path: '/admin/venues', icon: Building2 },
    { label: 'Shows Schedule', path: '/admin/shows', icon: CalendarDays },
    { label: 'Bookings', path: '/admin/bookings', icon: Ticket },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Waitlists', path: '/admin/waitlist', icon: ListOrdered },
    { label: 'Analytics Reports', path: '/admin/reports', icon: BarChart3 },
    { label: 'Staff QR Check-In', path: '/admin/tickets/validate', icon: QrCode },
  ];

  const isNavActive = (item: (typeof navItems)[0]) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex-shrink-0">
        <div className="p-4 md:p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-amber-400">Admin Console</span>
            <h2 className="text-lg font-bold text-white tracking-tight">TicketEase</h2>
          </div>
          <Link
            to="/"
            title="Return to Public Site"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        <nav className="p-3 md:p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isNavActive(item);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8 bg-slate-950">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>

        {/* Page Body */}
        {children}
      </main>
    </div>
  );
}
