import { Link } from 'react-router-dom';
import { Ticket, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 rounded-3xl bg-brand-600/20 text-brand-400 flex items-center justify-center border border-brand-500/30 mb-6">
        <Ticket className="w-8 h-8 transform -rotate-12" />
      </div>
      <span className="text-xs font-mono font-bold text-brand-400 uppercase tracking-widest">
        404 &bull; Page Not Found
      </span>
      <h1 className="text-3xl sm:text-5xl font-black mt-2 tracking-tight">
        Lost in the Theatre?
      </h1>
      <p className="text-sm text-slate-400 mt-2 max-w-md font-light">
        The page you are looking for does not exist or may have been moved.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm transition-colors shadow-lg shadow-brand-600/30"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Homepage
      </Link>
    </div>
  );
}
