import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private prisma: PrismaClient;

  private constructor() {
    // Validate DATABASE_URL environment variable
    if (!process.env['DATABASE_URL']) {
      logger.error('DATABASE_URL environment variable is not set');
      throw new Error('DATABASE_URL environment variable is required');
    }

    // Check if we're in Railway and use Railway PostgreSQL URL if local URL is detected
    let databaseUrl = process.env['DATABASE_URL'];
    if (databaseUrl.includes('localhost:5432') || databaseUrl.includes('bitespeed_user')) {
      logger.warn('Local database URL detected, switching to Railway PostgreSQL');
      databaseUrl = 'postgresql://postgres:NNQKMWkwEMPYmmhXVZKobxUUxJVqfJMr@switchyard.proxy.rlwy.net:15003/railway';
    }

    logger.info('Initializing database connection with DATABASE_URL:', {
      url: databaseUrl.replace(/:[^:@]*@/, ':****@') // Hide password in logs
    });

    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl
        }
      },
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
    });

    // Log database queries in development
    if (process.env['NODE_ENV'] === 'development') {
      // Development logging can be added here if needed
      logger.debug('Database connection initialized in development mode');
    }
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public getClient(): PrismaClient {
    return this.prisma;
  }

  public async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      logger.info('Database disconnected successfully');
    } catch (error) {
      logger.error('Failed to disconnect from database:', error);
      throw error;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }
}

export default DatabaseConnection; 