import { Request, Response, NextFunction } from 'express';
import { ApiError, DatabaseError } from '../types/common.types';
import logger from '../utils/logger';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  // Handle known error types
  if (isDatabaseError(error)) {
    const dbError: DatabaseError = {
      message: 'Database operation failed',
      statusCode: 500,
      timestamp: new Date().toISOString(),
      path: req.path,
      code: error.code || 'UNKNOWN'
    };
    res.status(500).json(dbError);
    return;
  }

  if (isApiError(error)) {
    res.status(error.statusCode).json(error);
    return;
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError: DatabaseError = {
      message: 'Database constraint violation',
      statusCode: 400,
      timestamp: new Date().toISOString(),
      path: req.path,
      code: error.code
    };
    res.status(400).json(prismaError);
    return;
  }

  if (error.name === 'PrismaClientUnknownRequestError') {
    const prismaError: DatabaseError = {
      message: 'Unknown database error',
      statusCode: 500,
      timestamp: new Date().toISOString(),
      path: req.path
    };
    res.status(500).json(prismaError);
    return;
  }

  // Handle validation errors from Zod
  if (error.name === 'ZodError') {
    const validationError = {
      message: 'Validation failed',
      statusCode: 400,
      timestamp: new Date().toISOString(),
      path: req.path,
      errors: error.errors?.map((err: any) => `${err.path.join('.')}: ${err.message}`) || []
    };
    res.status(400).json(validationError);
    return;
  }

  // Default error response
  const genericError: ApiError = {
    message: 'Internal server error',
    statusCode: 500,
    timestamp: new Date().toISOString(),
    path: req.path
  };

  res.status(500).json(genericError);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  const error: ApiError = {
    message: `Route ${req.path} not found`,
    statusCode: 404,
    timestamp: new Date().toISOString(),
    path: req.path
  };

  res.status(404).json(error);
};

function isDatabaseError(error: any): error is DatabaseError {
  return error && typeof error.code === 'string' && error.statusCode === 500;
}

function isApiError(error: any): error is ApiError {
  return error && typeof error.statusCode === 'number' && typeof error.message === 'string';
} 