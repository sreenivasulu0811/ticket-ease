import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  AuthUser,
  Event,
  Show,
  ShowSeatMap,
  Booking,
  WaitlistEntry,
  Venue,
  DashboardStats,
  AnalyticsData,
} from '../types';

// Normalize base URL: ensure no trailing slash, and ensure /api path exists
let rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api').trim();
rawBaseUrl = rawBaseUrl.replace(/\/+$/, '');
if (!rawBaseUrl.endsWith('/api') && !rawBaseUrl.includes('/api/')) {
  rawBaseUrl = `${rawBaseUrl}/api`;
}

export const API_BASE_URL = rawBaseUrl;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT access token to every outgoing request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('ticketease_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  code?: string;
}

// ----------------- AUTH APIS -----------------
export const authApi = {
  register: (data: any) =>
    api.post<ApiResponse<{ user: AuthUser; accessToken: string; refreshToken: string }>>(
      '/auth/register',
      data
    ),
  login: (data: any) =>
    api.post<ApiResponse<{ user: AuthUser; accessToken: string; refreshToken: string }>>(
      '/auth/login',
      data
    ),
  getMe: () => api.get<ApiResponse<AuthUser>>('/auth/me'),
  logout: () => api.post<ApiResponse<null>>('/auth/logout'),
};

// ----------------- EVENT APIS -----------------
export const eventsApi = {
  getAll: (params?: any) => api.get<ApiResponse<Event[]>>('/events', { params }),
  getFeatured: () => api.get<ApiResponse<Event[]>>('/events/featured'),
  getById: (id: string) => api.get<ApiResponse<Event>>(`/events/${id}`),
  create: (data: any) => api.post<ApiResponse<Event>>('/events', data),
  update: (id: string, data: any) => api.put<ApiResponse<Event>>(`/events/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/events/${id}`),
};

// ----------------- VENUE & SCREEN APIS -----------------
export const venuesApi = {
  getAll: () => api.get<ApiResponse<Venue[]>>('/venues'),
  create: (data: any) => api.post<ApiResponse<Venue>>('/venues', data),
  createScreen: (venueId: string, data: any) =>
    api.post<ApiResponse<any>>(`/venues/${venueId}/screens`, data),
};

// ----------------- SHOW APIS -----------------
export const showsApi = {
  getAll: (params?: any) => api.get<ApiResponse<Show[]>>('/shows', { params }),
  getById: (id: string) => api.get<ApiResponse<Show>>(`/shows/${id}`),
  create: (data: any) => api.post<ApiResponse<Show>>('/shows', data),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/shows/${id}`),
};

// ----------------- SEAT & HOLD APIS -----------------
export const seatsApi = {
  getShowSeats: (showId: string, holdToken?: string) =>
    api.get<ApiResponse<ShowSeatMap>>(`/shows/${showId}/seats`, {
      params: { holdToken },
    }),
  holdSeats: (showId: string, seatIds: string[]) =>
    api.post<
      ApiResponse<{
        holdToken: string;
        holdExpiresAt: string;
        pricing: {
          subtotal: number;
          convenienceFee: number;
          totalAmount: number;
          seatCount: number;
        };
      }>
    >(`/shows/${showId}/hold`, { seatIds }),
  releaseHold: (showId: string, holdToken: string) =>
    api.post<ApiResponse<{ releasedCount: number }>>(`/shows/${showId}/release`, { holdToken }),
};

// ----------------- BOOKING APIS -----------------
export const bookingsApi = {
  create: (data: {
    showId: string;
    holdToken?: string;
    waitlistEntryId?: string;
    paymentMethod: string;
    simulateStatus?: 'SUCCESS' | 'FAILED';
  }) => api.post<ApiResponse<Booking>>('/bookings', data),
  getMyBookings: () => api.get<ApiResponse<Booking[]>>('/bookings/my'),
  getById: (id: string) => api.get<ApiResponse<Booking>>(`/bookings/${id}`),
  cancel: (id: string) => api.post<ApiResponse<{ refundAmount: number }>>(`/bookings/${id}/cancel`),
};

// ----------------- WAITLIST APIS -----------------
export const waitlistApi = {
  join: (data: { showId: string; requestedSeats: number }) =>
    api.post<ApiResponse<WaitlistEntry>>('/waitlist', data),
  getMyWaitlist: () => api.get<ApiResponse<WaitlistEntry[]>>('/waitlist/my'),
  declineOffer: (id: string) => api.post<ApiResponse<null>>(`/waitlist/${id}/decline`),
};

// ----------------- TICKET VALIDATION APIS -----------------
export const ticketsApi = {
  validate: (code: string) => api.post<ApiResponse<Booking>>('/tickets/validate', { code }),
};

// ----------------- ADMIN DASHBOARD APIS -----------------
export const adminApi = {
  getStats: () => api.get<ApiResponse<DashboardStats>>('/admin/stats'),
  getReports: () => api.get<ApiResponse<AnalyticsData>>('/admin/reports'),
  getAllBookings: (params?: any) => api.get<ApiResponse<Booking[]>>('/admin/bookings', { params }),
  getAllUsers: () => api.get<ApiResponse<AuthUser[]>>('/admin/users'),
  getAllWaitlist: () => api.get<ApiResponse<WaitlistEntry[]>>('/admin/waitlist'),
};
