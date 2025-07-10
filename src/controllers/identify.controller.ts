import { Request, Response, NextFunction } from 'express';
import { ContactService } from '../services/contact.service';
import { IdentifyRequestSchema } from '../models/contact.model';
import { IdentifyRequest, IdentifyResponse } from '../types/contact.types';
import { ValidationError, ApiError } from '../types/common.types';

export class IdentifyController {
  constructor(private contactService: ContactService) {}

  identify = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate request body
      const validationResult = IdentifyRequestSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const validationError: ValidationError = {
          message: 'Invalid request data',
          statusCode: 400,
          timestamp: new Date().toISOString(),
          path: req.path,
          errors: validationResult.error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
        };
        res.status(400).json(validationError);
        return;
      }

      const identifyRequest = validationResult.data as IdentifyRequest;

      // Process the identity reconciliation
      const consolidatedContact = await this.contactService.identify(identifyRequest);

      // Format response according to API specification
      const response: IdentifyResponse = {
        contact: consolidatedContact
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // Health check endpoint
  health = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'bitespeed-identity-reconciliation'
    });
  };

  // Get contact chain by ID (useful for debugging/admin)
  getContactChain = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const contactId = parseInt(id, 10);

      if (isNaN(contactId) || contactId <= 0) {
        const error: ApiError = {
          message: 'Invalid contact ID',
          statusCode: 400,
          timestamp: new Date().toISOString(),
          path: req.path
        };
        res.status(400).json(error);
        return;
      }

      const contactChain = await this.contactService.getContactChain(contactId);

      if (!contactChain) {
        const error: ApiError = {
          message: 'Contact not found',
          statusCode: 404,
          timestamp: new Date().toISOString(),
          path: req.path
        };
        res.status(404).json(error);
        return;
      }

      const response: IdentifyResponse = {
        contact: contactChain
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
} 