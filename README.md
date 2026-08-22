# TicketEase — Smart Movie &amp; Concert Ticket Booking Platform

> **Production-grade full-stack ticket booking platform** featuring real-time interactive seat selection, concurrency-safe 5-minute seat holding, automatic hold expiration, simulated multi-method payments, tamper-proof digital QR-coded admission tickets, email notifications, automated FIFO waitlist seat reallocation upon cancellation, gate admission QR validation, and an executive administration dashboard.

---

## 1. Project Overview

TicketEase solves the fundamental challenge of ticketing platforms: **guaranteeing that two customers can never successfully book or hold the same seat simultaneously**, while maintaining an ultra-fast, responsive user experience. 

Built with **React 18, Vite, TypeScript, Tailwind CSS, Node.js, Express, and PostgreSQL with Prisma ORM**, TicketEase provides end-to-end capabilities for customers, venue operators, and administrators.

---

## 2. Key Features

- 🎟️ **Movies &amp; Live Concerts**: Full support for multiplex cinemas, concert halls, music arenas, and auditoriums.
- 💺 **Dynamic Visual Seat Map**: Interactive seat grid generated dynamically from database layouts (Rows A–Z, columns 1–N) with real-time status indicators (Available, Selected, Held, Sold Out, VIP, Premium, Regular).
- 🔒 **5-Minute Concurrency-Safe Seat Hold**: Transactional locking with database-level isolation and compound unique constraints ensuring zero double-bookings under concurrent traffic.
- ⏳ **Dual-Engine Hold Expiration**:
  - **Lazy Expiration**: Automatically reclaims expired holds on any seat query.
  - **Background Worker**: Scheduled cron/worker runs every 30 seconds to release abandoned holds across all venues.
- 💳 **Realistic Payment Simulation**: Supports UPI, Credit/Debit Card, and Net Banking with immediate simulated Success and Failure modes (releasing held seats on failure).
- 🎫 **Digital Scannable QR Tickets**: Generates HMAC-signed tamper-proof QR vouchers with single-use gate validation to prevent duplicate admissions.
- 📋 **Automated FIFO Waitlist System**: Customers can join waitlists on sold-out shows. When a confirmed booking is cancelled, released seats are automatically offered to the earliest waiting user with a 5-minute acceptance window.
- 🛡️ **Role-Based Access Control**: Strict server-side JWT authentication and authorization (`CUSTOMER`, `ADMIN`, `OPERATOR`).
- 📊 **Executive Admin Dashboard**: Real-time KPI metrics, 30-day revenue trend area charts, venue occupancy bar charts, full CRUD for Events, Venues, Screens, Shows, Bookings, Users, and Waitlists.
- 📱 **Fully Responsive UI**: Mobile, tablet, and desktop optimized with dark-mode aesthetic.

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, React Router v6, Lucide Icons, Recharts, React Hot Toast, Axios, Canvas Confetti |
| **Backend** | Node.js, Express.js, TypeScript, Prisma ORM, Zod Validation, JWT (`jsonwebtoken`), `bcryptjs`, `qrcode`, `nodemailer`, `morgan` |
| **Database** | PostgreSQL with Prisma ORM (with indexes, compound unique constraints, and foreign key cascades) |
| **Testing** | Vitest, Supertest (Unit tests, integration tests, and concurrency race condition simulation) |

---

## 4. Architecture &amp; System Design

```mermaid
graph TD
    Client["Frontend SPA (React 18 + Vite + Tailwind)"]
    API["Backend REST API (Node.js + Express + TypeScript)"]
    DB[("PostgreSQL Database (Prisma ORM)")]
    Worker["Background Worker (Hold & Waitlist Cleanup Scheduler)"]
    QR["QR Signing & Validation Engine"]
    Mail["Email Notification Service"]

    Client -->|REST API + JWT Bearer| API
    API -->|ACID Transactions & Locking| DB
    Worker -->|Periodic Expiry Scan (30s)| DB
    API -->|Generate Signed QR| QR
    API -->|HTML Confirmations| Mail
```

### Double-Booking Prevention Mechanism
1. When a user requests seats, backend initiates `prisma.$transaction`.
2. First runs lazy cleanup to release any stale holds.
3. Validates that **all requested seats** have `status = 'AVAILABLE'`.
4. If any seat is already HELD or BOOKED, transaction aborts and returns `409 Conflict: Seat is no longer available`.
5. If available, atomically transitions seats to `status = 'HELD'`, attaches unique `holdToken`, sets `holdExpiresAt = now + 5 minutes`, and returns the hold session.

---

## 5. Database Schema

The schema is defined in `prisma/schema.prisma`:

- **`User`**: `id`, `name`, `email` (unique), `phone`, `passwordHash`, `role` (`CUSTOMER` / `ADMIN` / `OPERATOR`), `createdAt`, `updatedAt`
- **`Venue`**: `id`, `name`, `location`, `address`, `city`, `capacity`, `type` (`MOVIE_THEATRE`, `CONCERT_HALL`, `ARENA`, `AUDITORIUM`), `imageUrl`
- **`Screen`**: `id`, `venueId`, `name`, `rows`, `columns`, `capacity`
- **`Seat`**: `id`, `screenId`, `rowLabel`, `seatNumber`, `seatType` (`REGULAR`, `PREMIUM`, `VIP`), `priceMultiplier`, `@@unique([screenId, rowLabel, seatNumber])`
- **`Event`**: `id`, `title`, `description`, `type` (`MOVIE`, `CONCERT`), `language`, `duration`, `posterUrl`, `backdropUrl`, `category`, `castOrArtist`, `status`, `rating`
- **`Show`**: `id`, `eventId`, `screenId`, `startTime`, `endTime`, `basePrice`, `status` (`SCHEDULED`, `CANCELLED`, `COMPLETED`)
- **`ShowSeat`**: `id`, `showId`, `seatId`, `status` (`AVAILABLE`, `HELD`, `BOOKED`, `BLOCKED`), `holdToken`, `holdExpiresAt`, `heldByUserId`, `bookingId`, `@@unique([showId, seatId])`
- **`Booking`**: `id`, `bookingReference` (unique, e.g. `TE-2026-ABC123`), `userId`, `showId`, `subtotal`, `convenienceFee`, `totalAmount`, `status` (`CONFIRMED`, `CANCELLED`), `paymentStatus`, `paymentMethod`, `paymentId`, `qrCodeData`, `ticketStatus` (`VALID`, `USED`, `CANCELLED`), `usedAt`, `cancelledAt`
- **`BookingSeat`**: `id`, `bookingId`, `showSeatId`, `price`, `@@unique([bookingId, showSeatId])`
- **`WaitlistEntry`**: `id`, `userId`, `showId`, `requestedSeats`, `status` (`WAITING`, `OFFERED`, `ACCEPTED`, `DECLINED`, `EXPIRED`), `offerExpiresAt`, `offeredSeatIds`, `allocatedAt`

---

## 6. API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new account
- `POST /api/auth/login` — Sign in and receive JWT tokens
- `GET  /api/auth/me` — Get authenticated user profile
- `POST /api/auth/logout` — Invalidate session

### Events (`/api/events`)
- `GET    /api/events` — Catalog search with filters (type, city, genre, date, sorting)
- `GET    /api/events/featured` — Top-rated trending movies & concerts
- `GET    /api/events/:id` — Event details, synopsis, cast, and upcoming showtimes
- `POST   /api/events` — *(Admin)* Create new event
- `PUT    /api/events/:id` — *(Admin)* Update event
- `DELETE /api/events/:id` — *(Admin)* Delete event

### Venues & Screens (`/api/venues`)
- `GET  /api/venues` — List venues and screens
- `POST /api/venues` — *(Admin)* Create venue
- `POST /api/venues/:id/screens` — *(Admin)* Generate screen seat grid layout

### Shows & Seat Inventory (`/api/shows`)
- `GET    /api/shows` — List shows with filters
- `POST   /api/shows` — *(Admin)* Schedule show (checks for room schedule conflicts)
- `GET    /api/shows/:showId/seats` — Get seat map with real-time availability
- `POST   /api/shows/:showId/hold` — Concurrency-safe 5-minute seat reservation
- `POST   /api/shows/:showId/release` — Manually release held seats

### Bookings (`/api/bookings`)
- `POST /api/bookings` — Transactional checkout & payment simulation
- `GET  /api/bookings/my` — Get user's bookings (Upcoming, Past, Cancelled)
- `GET  /api/bookings/:id` — Get single booking details & QR ticket
- `POST /api/bookings/:id/cancel` — Cancel booking, process refund, release seats, and trigger FIFO waitlist

### Waitlist (`/api/waitlist`)
- `POST /api/waitlist` — Join waitlist for sold-out show
- `GET  /api/waitlist/my` — View user's waitlist position & active seat offers
- `POST /api/waitlist/:id/decline` — Decline offer and pass seats to next user

### Staff QR Gate Validation (`/api/tickets`)
- `POST /api/tickets/validate` — *(Staff/Admin)* Verify QR ticket & mark single-use check-in

### Admin Dashboard & Reports (`/api/admin`)
- `GET /api/admin/stats` — Real-time KPIs (Revenue, Occupancy, Bookings, Users)
- `GET /api/admin/reports` — Analytics trends (30-day revenue, venue occupancy)
- `GET /api/admin/bookings` — Full audit log of all bookings
- `GET /api/admin/users` — Registered accounts directory
- `GET /api/admin/waitlist` — System-wide waitlist activity monitor

---

## 7. Local Setup Instructions

### Prerequisites
- **Node.js**: v18+ (Node.js 20+ LTS recommended)
- **PostgreSQL**: Local instance or cloud database (Neon, Supabase, Render, Railway, Docker)

### 1. Clone / Navigate to project
```bash
cd ticket-ease
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `DATABASE_URL` points to your PostgreSQL database:
```env
DATABASE_URL="postgresql://ticketease:ticketease@localhost:5432/ticketease?schema=public"
```

### 3. Install Dependencies
```bash
# Install backend packages
cd backend
npm install

# Install frontend packages
cd ../frontend
npm install
```

### 4. Setup Database &amp; Seed Demo Data
```bash
cd backend
# Push schema to database
npx prisma db push

# Seed comprehensive demo data (venues, screens, shows, seats, test accounts)
npm run prisma:seed
```

### 5. Start Application

**Start Backend API** (Port 8080):
```bash
cd backend
npm run dev
```

**Start Frontend** (Port 5173):
```bash
cd frontend
npm run dev
```

Open your browser at **http://localhost:5173**.

---

## 8. Test Accounts

The seed script automatically provisions the following test accounts:

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin@ticketease.demo` | `Demo@Password123` | Full dashboard, event/venue/show CRUD, reports, QR check-in |
| **Customer** | `customer@ticketease.demo` | `Demo@Password123` | Browse, hold seats, simulated payment, QR tickets, cancellations |
| **Customer 2** | `alice@example.com` | `Demo@Password123` | Secondary customer for waitlist / concurrency tests |
| **Customer 3** | `bob@example.com` | `Demo@Password123` | Third customer for FIFO queue verification |

*(Quick-fill buttons for demo credentials are provided on the Login page for convenience!)*

---

## 9. Running Automated Tests

Run the test suite with Vitest:
```bash
cd backend
npm test
```

Included test suites:
- `concurrency.test.ts` — Verifies that simultaneous booking requests on the same seat result in **exactly 1 winner** and reject the competitor.
- `auth.test.ts` — Validates JWT token creation, signing, and verification.
- `qr.test.ts` — Tests secure QR payload generation and signature verification.

---

## 10. Deployment Instructions

### Frontend (Vercel / Netlify)
1. Set Root Directory to `frontend`.
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. Set Environment Variable: `VITE_API_BASE_URL=https://your-backend-api.com/api`

### Backend (Render / Railway / Fly.io)
1. Set Root Directory to `backend`.
2. Build Command: `npm run build && npx prisma generate`
3. Start Command: `npm start`
4. Set Environment Variables from `.env.example` including `DATABASE_URL`.
