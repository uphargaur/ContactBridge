import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import ConfigManager from './config/app.config';
import DatabaseConnection from './config/database';
import logger from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import identifyRoutes from './routes/identify.routes';

class App {
  public app: express.Application;
  private config: ConfigManager;
  private dbConnection: DatabaseConnection;

  constructor() {
    this.config = ConfigManager.getInstance();
    this.dbConnection = DatabaseConnection.getInstance();
    this.app = express();
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: this.config.get('corsOrigin'),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging middleware
    if (this.config.isDevelopment()) {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined', {
        stream: {
          write: (message: string) => {
            logger.info(message.trim());
          }
        }
      }));
    }

    // Request logging
    this.app.use((req, _res, next) => {
      logger.info('Incoming request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
      next();
    });
  }

  private initializeRoutes(): void {
    const apiPrefix = this.config.get('apiPrefix');
    
    // Health check route (outside API prefix for monitoring)
    this.app.get('/health', (_req, res) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'bitespeed-identity-reconciliation',
        version: '1.0.0'
      });
    });

    // API routes
    this.app.use(apiPrefix, identifyRoutes);

    // Root route
    this.app.get('/', (_req, res) => {
      res.status(200).json({
        message: 'Bitespeed Identity Reconciliation API',
        version: '1.0.0',
        documentation: '/api/v1/health',
        endpoints: {
          identify: `${apiPrefix}/identify`,
          health: `${apiPrefix}/health`,
          contactChain: `${apiPrefix}/contacts/:id/chain`
        }
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);
    
    // Global error handler
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await this.dbConnection.connect();
      
      // Check database health
      const isDbHealthy = await this.dbConnection.healthCheck();
      if (!isDbHealthy) {
        throw new Error('Database health check failed');
      }

      const port = this.config.get('port');
      
      this.app.listen(port, () => {
        logger.info('Server started successfully', {
          port,
          nodeEnv: this.config.get('nodeEnv'),
          apiPrefix: this.config.get('apiPrefix'),
          timestamp: new Date().toISOString()
        });
      });

      // Graceful shutdown handling
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      try {
        await this.dbConnection.disconnect();
        logger.info('Database disconnected successfully');
        
        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}

// Start the application if this file is run directly
if (require.main === module) {
  const app = new App();
  app.start();
}

export default App; 