export type UserRole = 'CUSTOMER' | 'ADMIN' | 'OPERATOR';
export type EventType = 'MOVIE' | 'CONCERT';
export type EventStatus = 'ACTIVE' | 'UPCOMING' | 'DRAFT' | 'ARCHIVED';
export type VenueType = 'MOVIE_THEATRE' | 'CONCERT_HALL' | 'ARENA' | 'AUDITORIUM';
export type SeatType = 'REGULAR' | 'PREMIUM' | 'VIP';
export type SeatStatus = 'AVAILABLE' | 'HELD' | 'BOOKED' | 'BLOCKED';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
export type TicketStatus = 'VALID' | 'USED' | 'CANCELLED';
export type WaitlistStatus = 'WAITING' | 'OFFERED' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  createdAt?: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface Venue {
  id: string;
  name: string;
  location: string;
  address: string;
  city: string;
  capacity: number;
  type: VenueType;
  imageUrl?: string;
  screens?: Screen[];
}

export interface Screen {
  id: string;
  venueId: string;
  venue?: Venue;
  name: string;
  rows: number;
  columns: number;
  capacity: number;
  seats?: Seat[];
}

export interface Seat {
  id: string;
  screenId: string;
  rowLabel: string;
  seatNumber: number;
  seatType: SeatType;
  priceMultiplier: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  type: EventType;
  language: string;
  duration: number;
  posterUrl: string;
  backdropUrl?: string;
  category: string;
  castOrArtist?: string;
  status: EventStatus;
  rating?: number;
  minPrice?: number;
  cities?: string[];
  shows?: Show[];
  createdAt?: string;
}

export interface Show {
  id: string;
  eventId: string;
  event?: Event;
  screenId: string;
  screen?: Screen;
  startTime: string;
  endTime: string;
  basePrice: number;
  status: 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';
  totalSeats?: number;
  availableSeats?: number;
  isSoldOut?: boolean;
}

export interface FormattedSeat {
  id: string;
  seatId: string;
  rowLabel: string;
  seatNumber: number;
  seatType: SeatType;
  priceMultiplier: number;
  price: number;
  status: SeatStatus;
  isHeldByMe?: boolean;
  holdExpiresAt?: string;
}

export interface ShowSeatMap {
  show: {
    id: string;
    startTime: string;
    endTime: string;
    basePrice: number;
    status: string;
    event: Event;
    venue: Venue;
    screen: {
      id: string;
      name: string;
      rows: number;
      columns: number;
      capacity: number;
    };
  };
  stats: {
    totalSeats: number;
    availableSeats: number;
    bookedSeats: number;
    heldSeats: number;
    isSoldOut: boolean;
  };
  seats: FormattedSeat[];
}

export interface BookingSeat {
  id: string;
  bookingId: string;
  showSeatId: string;
  price: number;
  showSeat?: {
    seat: Seat;
  };
}

export interface Booking {
  id: string;
  bookingReference: string;
  userId: string;
  user?: AuthUser;
  showId: string;
  show: Show & {
    event: Event;
    screen: Screen & { venue: Venue };
  };
  subtotal: number;
  convenienceFee: number;
  totalAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  paymentId?: string;
  qrCodeData?: string;
  ticketStatus: TicketStatus;
  usedAt?: string;
  cancelledAt?: string;
  isPast?: boolean;
  isCancellable?: boolean;
  hoursUntilShow?: number;
  bookingSeats: BookingSeat[];
  createdAt: string;
  updatedAt: string;
}

export interface WaitlistEntry {
  id: string;
  userId: string;
  showId: string;
  requestedSeats: number;
  status: WaitlistStatus;
  offerExpiresAt?: string;
  offeredSeatIds?: string;
  allocatedAt?: string;
  queuePosition?: number;
  offeredSeatsDetails?: Array<{
    id: string;
    seat: Seat;
  }>;
  show: Show & {
    event: Event;
    screen: Screen & { venue: Venue };
  };
  createdAt: string;
}

export interface DashboardStats {
  kpis: {
    totalRevenue: number;
    todayRevenue: number;
    totalBookings: number;
    todayBookings: number;
    cancelledBookings: number;
    cancellationRate: string;
    totalUsers: number;
    totalEvents: number;
    totalVenues: number;
    totalShows: number;
    totalSeats: number;
    soldSeats: number;
    heldSeats: number;
    availableSeats: number;
    occupancyRate: string;
    waitlistedUsers: number;
  };
}

export interface AnalyticsData {
  dailyTrend: Array<{
    date: string;
    revenue: number;
    bookings: number;
  }>;
  popularEvents: Array<{
    id: string;
    title: string;
    type: EventType;
    posterUrl: string;
    totalBookings: number;
    totalRevenue: number;
  }>;
  venueOccupancy: Array<{
    venueName: string;
    city: string;
    totalSeats: number;
    bookedSeats: number;
    occupancyRate: number;
  }>;
}
