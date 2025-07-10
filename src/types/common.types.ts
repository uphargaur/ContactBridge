export interface ApiError {
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
}

export interface ValidationError extends ApiError {
  errors: string[];
}

export interface DatabaseError extends ApiError {
  code?: string;
}

export type Environment = 'development' | 'production' | 'test';

export interface AppConfig {
  port: number;
  nodeEnv: Environment;
  databaseUrl: string;
  logLevel: string;
  corsOrigin: string;
  apiPrefix: string;
} 