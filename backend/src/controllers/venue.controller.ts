import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { venueService } from '../services/venue.service.js';

export const createVenueSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    location: z.string().min(1, 'Location is required'),
    address: z.string().min(1, 'Address is required'),
    city: z.string().min(1, 'City is required'),
    capacity: z.number().or(z.string()).optional(),
    type: z.enum(['MOVIE_THEATRE', 'CONCERT_HALL', 'ARENA', 'AUDITORIUM']).optional(),
    imageUrl: z.string().url().optional(),
  }),
});

export const createScreenSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    name: z.string().min(1, 'Screen name is required'),
    rows: z.number().min(1).max(26),
    columns: z.number().min(1).max(30),
  }),
});

export const venueController = {
  async getAllVenues(req: Request, res: Response, next: NextFunction) {
    try {
      const venues = await venueService.getAllVenues();
      res.status(200).json({
        success: true,
        data: venues,
      });
    } catch (error) {
      next(error);
    }
  },

  async getVenueById(req: Request, res: Response, next: NextFunction) {
    try {
      const venue = await venueService.getVenueById(req.params.id);
      res.status(200).json({
        success: true,
        data: venue,
      });
    } catch (error) {
      next(error);
    }
  },

  async createVenue(req: Request, res: Response, next: NextFunction) {
    try {
      const venue = await venueService.createVenue(req.body);
      res.status(201).json({
        success: true,
        message: 'Venue created successfully.',
        data: venue,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateVenue(req: Request, res: Response, next: NextFunction) {
    try {
      const venue = await venueService.updateVenue(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Venue updated successfully.',
        data: venue,
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteVenue(req: Request, res: Response, next: NextFunction) {
    try {
      await venueService.deleteVenue(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Venue deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  },

  async createScreen(req: Request, res: Response, next: NextFunction) {
    try {
      const screen = await venueService.createScreen(req.params.id, req.body);
      res.status(201).json({
        success: true,
        message: 'Screen layout generated successfully.',
        data: screen,
      });
    } catch (error) {
      next(error);
    }
  },
};
