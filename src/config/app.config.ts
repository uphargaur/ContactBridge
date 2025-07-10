import dotenv from 'dotenv';
import { AppConfig, Environment } from '../types/common.types';

// Load environment variables
dotenv.config();

class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig;

  private constructor() {
    this.config = {
      port: parseInt(process.env['PORT'] || '3000', 10),
      nodeEnv: (process.env['NODE_ENV'] as Environment) || 'development',
      databaseUrl: process.env['DATABASE_URL'] || 'postgresql://localhost:5432/bitespeed_db',
      logLevel: process.env['LOG_LEVEL'] || 'info',
      corsOrigin: process.env['CORS_ORIGIN'] || '*',
      apiPrefix: process.env['API_PREFIX'] || '/api/v1'
    };

    this.validateConfig();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  public getConfig(): AppConfig {
    return { ...this.config };
  }

  public get(key: keyof AppConfig): any {
    return this.config[key];
  }

  public isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  public isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }

  public isTest(): boolean {
    return this.config.nodeEnv === 'test';
  }

  private validateConfig(): void {
    const requiredEnvVars = ['DATABASE_URL'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName as keyof NodeJS.ProcessEnv]);

    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    if (this.config.port < 1 || this.config.port > 65535) {
      throw new Error('Port must be between 1 and 65535');
    }

    const validEnvs: Environment[] = ['development', 'production', 'test'];
    if (!validEnvs.includes(this.config.nodeEnv)) {
      throw new Error(`Invalid NODE_ENV: ${this.config.nodeEnv}. Must be one of: ${validEnvs.join(', ')}`);
    }
  }
}

export default ConfigManager; 