import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { showService } from '../services/show.service.js';

export const createShowSchema = z.object({
  body: z.object({
    eventId: z.string().min(1, 'Event ID is required'),
    screenId: z.string().min(1, 'Screen ID is required'),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    basePrice: z.number().or(z.string().regex(/^\d+(\.\d+)?$/)),
  }),
});

export const showController = {
  async getAllShows(req: Request, res: Response, next: NextFunction) {
    try {
      const shows = await showService.getAllShows(req.query as any);
      res.status(200).json({
        success: true,
        data: shows,
      });
    } catch (error) {
      next(error);
    }
  },

  async getShowById(req: Request, res: Response, next: NextFunction) {
    try {
      const show = await showService.getShowById(req.params.id);
      res.status(200).json({
        success: true,
        data: show,
      });
    } catch (error) {
      next(error);
    }
  },

  async createShow(req: Request, res: Response, next: NextFunction) {
    try {
      const show = await showService.createShow(req.body);
      res.status(201).json({
        success: true,
        message: 'Show scheduled successfully.',
        data: show,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateShow(req: Request, res: Response, next: NextFunction) {
    try {
      const show = await showService.updateShow(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Show updated successfully.',
        data: show,
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteShow(req: Request, res: Response, next: NextFunction) {
    try {
      await showService.deleteShow(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Show deleted successfully.',
      });
    } catch (error) {
      next(error);
    }
  },
};
