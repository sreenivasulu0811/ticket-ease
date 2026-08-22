import { Routes, Route } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';

// Public Pages
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import SeatSelectionPage from './pages/SeatSelectionPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

// Customer Protected Pages
import CheckoutPage from './pages/CheckoutPage';
import BookingSuccessPage from './pages/BookingSuccessPage';
import TicketPage from './pages/TicketPage';
import MyBookingsPage from './pages/MyBookingsPage';
import WaitlistPage from './pages/WaitlistPage';

// Admin Protected Pages
import DashboardOverview from './pages/admin/DashboardOverview';
import EventsAdmin from './pages/admin/EventsAdmin';
import VenuesAdmin from './pages/admin/VenuesAdmin';
import ShowsAdmin from './pages/admin/ShowsAdmin';
import BookingsAdmin from './pages/admin/BookingsAdmin';
import UsersAdmin from './pages/admin/UsersAdmin';
import WaitlistAdmin from './pages/admin/WaitlistAdmin';
import ReportsAdmin from './pages/admin/ReportsAdmin';
import TicketValidatePage from './pages/admin/TicketValidatePage';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-100 antialiased selection:bg-brand-500 selection:text-white">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/seat-selection/:showId" element={<SeatSelectionPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Customer Protected Routes */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking-success/:id"
            element={
              <ProtectedRoute>
                <BookingSuccessPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ticket/:id"
            element={
              <ProtectedRoute>
                <TicketPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute>
                <MyBookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/waitlist"
            element={
              <ProtectedRoute>
                <WaitlistPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <DashboardOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/events"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <EventsAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/venues"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <VenuesAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/shows"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <ShowsAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <BookingsAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <UsersAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/waitlist"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <WaitlistAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <ReportsAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tickets/validate"
            element={
              <ProtectedRoute requiredRole={['ADMIN', 'OPERATOR']}>
                <TicketValidatePage />
              </ProtectedRoute>
            }
          />

          {/* 404 Catch-All */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
