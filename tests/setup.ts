import { PrismaClient } from '@prisma/client';

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    contact: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
    $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
    $on: jest.fn(),
  })),
}));

// Mock logger to prevent console output during tests
jest.mock('../src/utils/logger', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }
}));

// Mock config manager for tests
jest.mock('../src/config/app.config', () => ({
  default: {
    getInstance: jest.fn(() => ({
      get: jest.fn((key: string) => {
        const config: any = {
          port: 3000,
          nodeEnv: 'test',
          databaseUrl: 'postgresql://test:test@localhost:5432/test_db',
          logLevel: 'error',
          corsOrigin: '*',
          apiPrefix: '/api/v1'
        };
        return config[key];
      }),
      getConfig: jest.fn(() => ({
        port: 3000,
        nodeEnv: 'test',
        databaseUrl: 'postgresql://test:test@localhost:5432/test_db',
        logLevel: 'error',
        corsOrigin: '*',
        apiPrefix: '/api/v1'
      })),
      isDevelopment: jest.fn(() => false),
      isProduction: jest.fn(() => false),
      isTest: jest.fn(() => true),
    }))
  }
}));

// Mock database connection
jest.mock('../src/config/database', () => ({
  default: {
    getInstance: jest.fn(() => ({
      getClient: jest.fn(() => new PrismaClient()),
      connect: jest.fn(),
      disconnect: jest.fn(),
      healthCheck: jest.fn().mockResolvedValue(true),
    })),
  }
}));

// Set test environment variables
process.env['NODE_ENV'] = 'test';
process.env['DATABASE_URL'] = 'postgresql://test:test@localhost:5432/test_db';

// Global test timeout
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global test utilities
export const createMockContact = (overrides = {}) => ({
  id: 1,
  email: 'test@example.com',
  phoneNumber: '1234567890',
  linkedId: null,
  linkPrecedence: 'primary' as const,
  createdAt: new Date('2023-01-01T00:00:00Z'),
  updatedAt: new Date('2023-01-01T00:00:00Z'),
  deletedAt: null,
  ...overrides,
});

export const createMockSecondaryContact = (primaryId: number, overrides = {}) => ({
  id: 2,
  email: 'secondary@example.com',
  phoneNumber: '0987654321',
  linkedId: primaryId,
  linkPrecedence: 'secondary' as const,
  createdAt: new Date('2023-01-02T00:00:00Z'),
  updatedAt: new Date('2023-01-02T00:00:00Z'),
  deletedAt: null,
  ...overrides,
});

export const createMockConsolidatedContact = (overrides = {}) => ({
  primaryContactId: 1,
  emails: ['test@example.com'],
  phoneNumbers: ['1234567890'],
  secondaryContactIds: [],
  ...overrides,
}); 