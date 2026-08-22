import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { eventService } from '../services/event.service.js';

export const createEventSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    type: z.enum(['MOVIE', 'CONCERT']),
    language: z.string().default('English'),
    duration: z.number().or(z.string()),
    posterUrl: z.string().url('Poster URL must be a valid URL'),
    backdropUrl: z.string().url().optional(),
    category: z.string().min(1, 'Category/Genre is required'),
    castOrArtist: z.string().optional(),
    status: z.enum(['ACTIVE', 'UPCOMING', 'DRAFT', 'ARCHIVED']).optional(),
    rating: z.number().or(z.string()).optional(),
  }),
});

export const eventController = {
  async getAllEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const events = await eventService.getAllEvents(req.query as any);
      res.status(200).json({
        success: true,
        data: events,
      });
    } catch (error) {
      next(error);
    }
  },

  async getFeaturedEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const featured = await eventService.getFeaturedEvents();
      res.status(200).json({
        success: true,
        data: featured,
      });
    } catch (error) {
      next(error);
    }
  },

  async getEventById(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await eventService.getEventById(req.params.id);
      res.status(200).json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  },

  async createEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await eventService.createEvent(req.body);
      res.status(201).json({
        success: true,
        message: 'Event created successfully.',
        data: event,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const event = await eventService.updateEvent(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Event updated successfully.',
        data: event,
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteEvent(req: Request, res: Response, next: NextFunction) {
    try {
      await eventService.deleteEvent(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Event deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  },
};
