import { Request, Response, NextFunction } from 'express';
import { IdentifyController } from '../../src/controllers/identify.controller';
import { ContactService } from '../../src/services/contact.service';
import { createMockConsolidatedContact } from '../setup';

describe('IdentifyController', () => {
  let identifyController: IdentifyController;
  let mockContactService: jest.Mocked<ContactService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockContactService = {
      identify: jest.fn(),
      getContactById: jest.fn(),
      getContactChain: jest.fn(),
    } as any;

    mockRequest = {
      body: {},
      path: '/api/v1/identify',
      params: {}
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    identifyController = new IdentifyController(mockContactService);
  });

  describe('identify', () => {
    it('should successfully process valid identify request', async () => {
      const requestBody = {
        email: 'test@example.com',
        phoneNumber: '1234567890'
      };

      const consolidatedContact = createMockConsolidatedContact();

      mockRequest.body = requestBody;
      mockContactService.identify.mockResolvedValue(consolidatedContact);

      await identifyController.identify(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockContactService.identify).toHaveBeenCalledWith(requestBody);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        contact: consolidatedContact
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle request with only email', async () => {
      const requestBody = {
        email: 'test@example.com'
      };

      const consolidatedContact = createMockConsolidatedContact({
        phoneNumbers: []
      });

      mockRequest.body = requestBody;
      mockContactService.identify.mockResolvedValue(consolidatedContact);

      await identifyController.identify(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockContactService.identify).toHaveBeenCalledWith(requestBody);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should handle request with only phone number', async () => {
      const requestBody = {
        phoneNumber: '1234567890'
      };

      const consolidatedContact = createMockConsolidatedContact({
        emails: []
      });

      mockRequest.body = requestBody;
      mockContactService.identify.mockResolvedValue(consolidatedContact);

      await identifyController.identify(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockContactService.identify).toHaveBeenCalledWith(requestBody);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 for invalid request body', async () => {
      const invalidRequestBody = {}; // Neither email nor phone

      mockRequest.body = invalidRequestBody;

      await identifyController.identify(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid request data',
        statusCode: 400,
        timestamp: expect.any(String),
        path: '/api/v1/identify',
        errors: expect.any(Array)
      });
      expect(mockContactService.identify).not.toHaveBeenCalled();
    });

    it('should return 400 for invalid email format', async () => {
      const invalidRequestBody = {
        email: 'invalid-email'
      };

      mockRequest.body = invalidRequestBody;

      await identifyController.identify(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockContactService.identify).not.toHaveBeenCalled();
    });

    it('should call next with error when service throws', async () => {
      const requestBody = {
        email: 'test@example.com',
        phoneNumber: '1234567890'
      };

      const serviceError = new Error('Database connection failed');

      mockRequest.body = requestBody;
      mockContactService.identify.mockRejectedValue(serviceError);

      await identifyController.identify(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('health', () => {
    it('should return health status', async () => {
      await identifyController.health(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'healthy',
        timestamp: expect.any(String),
        service: 'bitespeed-identity-reconciliation'
      });
    });
  });

  describe('getContactChain', () => {
    it('should return contact chain for valid ID', async () => {
      const consolidatedContact = createMockConsolidatedContact();

      mockRequest.params = { id: '1' };
      mockContactService.getContactChain.mockResolvedValue(consolidatedContact);

      await identifyController.getContactChain(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockContactService.getContactChain).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        contact: consolidatedContact
      });
    });

    it('should return 400 for invalid contact ID', async () => {
      mockRequest.params = { id: 'invalid' };

      await identifyController.getContactChain(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid contact ID',
        statusCode: 400,
        timestamp: expect.any(String),
        path: expect.any(String)
      });
      expect(mockContactService.getContactChain).not.toHaveBeenCalled();
    });

    it('should return 400 for negative contact ID', async () => {
      mockRequest.params = { id: '-1' };

      await identifyController.getContactChain(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockContactService.getContactChain).not.toHaveBeenCalled();
    });

    it('should return 404 when contact not found', async () => {
      mockRequest.params = { id: '999' };
      mockContactService.getContactChain.mockResolvedValue(null);

      await identifyController.getContactChain(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Contact not found',
        statusCode: 404,
        timestamp: expect.any(String),
        path: expect.any(String)
      });
    });

    it('should call next with error when service throws', async () => {
      const serviceError = new Error('Database error');

      mockRequest.params = { id: '1' };
      mockContactService.getContactChain.mockRejectedValue(serviceError);

      await identifyController.getContactChain(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });
}); 