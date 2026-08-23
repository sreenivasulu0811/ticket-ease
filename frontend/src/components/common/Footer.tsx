import { Ticket, Shield, Zap, RefreshCw, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Col 1: Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
                <Ticket className="w-4 h-4 transform -rotate-12" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Ticket<span className="text-brand-400">Ease</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Smart, concurrency-safe movie & concert ticket booking platform with real-time seat reservation, instant QR check-in, and automatic FIFO waitlist allocation.
            </p>
          </div>

          {/* Col 2: Platform Features */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Platform Features</h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center gap-2 text-slate-400">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                5-Minute Concurrency-Safe Seat Hold
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                FIFO Automatic Waitlist Allocation
              </li>
              <li className="flex items-center gap-2 text-slate-400">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Tamper-Proof Scannable QR Tickets
              </li>
            </ul>
          </div>

          {/* Col 3: Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Explore</h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/events?type=MOVIE" className="hover:text-white transition-colors">
                  Latest Movies
                </Link>
              </li>
              <li>
                <Link to="/events?type=CONCERT" className="hover:text-white transition-colors">
                  Live Music & Concerts
                </Link>
              </li>
              <li>
                <Link to="/my-bookings" className="hover:text-white transition-colors">
                  Manage My Bookings
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-amber-300 transition-colors">
                  Admin & Operator Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2026 TicketEase. All rights reserved.</p>
          <p className="flex items-center gap-1.5 text-slate-400">
            <Mail className="w-3.5 h-3.5" /> support@ticketease.demo
          </p>
        </div>
      </div>
    </footer>
  );
}
