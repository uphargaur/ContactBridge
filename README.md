# Bitespeed Identity Reconciliation Service

A robust Node.js TypeScript service for linking customer identities across multiple purchases using email and phone number reconciliation.

## 🚀 Features

- **Identity Reconciliation**: Links customer contacts across multiple purchases
- **Primary/Secondary Contact System**: Hierarchical contact linking with oldest contact as primary
- **Automatic Contact Merging**: Intelligently merges separate contact groups when connections are discovered
- **RESTful API**: Clean `/identify` endpoint following industry standards
- **Type Safety**: Full TypeScript implementation with strict type checking
- **Comprehensive Testing**: Unit tests with 80%+ coverage using Jest
- **Production Ready**: Docker containerization with health checks
- **Database Integration**: PostgreSQL with Prisma ORM
- **Logging & Monitoring**: Winston logging with structured output
- **Error Handling**: Comprehensive error handling with proper HTTP status codes

## 📋 Table of Contents

- [Installation](#-installation)
- [API Documentation](#-api-documentation)
- [Usage Examples](#-usage-examples)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Architecture](#-architecture)
- [Contributing](#-contributing)

## 🛠 Installation

### Prerequisites

- Node.js 18+ 
- PostgreSQL 13+
- Docker & Docker Compose (for containerized setup)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bitespeed-identity-reconciliation
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Start PostgreSQL database**
   ```bash
   # Using Docker
   docker run --name bitespeed-postgres \
     -e POSTGRES_DB=bitespeed_db \
     -e POSTGRES_USER=bitespeed_user \
     -e POSTGRES_PASSWORD=bitespeed_password \
     -p 5432:5432 -d postgres:15-alpine
   ```

5. **Run database migrations**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

The service will be available at `http://localhost:3000`

### Docker Setup

1. **Production deployment**
   ```bash
   docker-compose up --build
   ```

2. **Development with hot reload**
   ```bash
   docker-compose --profile dev up --build
   ```

## 📚 API Documentation

### Base URL
```
Production: https://your-deployed-app.com
Development: http://localhost:3000
```

### Endpoints

#### POST `/api/v1/identify`

Identifies and consolidates customer contacts based on email and/or phone number.

**Request Body:**
```json
{
  "email": "string (optional)",
  "phoneNumber": "string (optional)"
}
```

**Response:**
```json
{
  "contact": {
    "primaryContactId": "number",
    "emails": ["string"],
    "phoneNumbers": ["string"],
    "secondaryContactIds": ["number"]
  }
}
```

**Status Codes:**
- `200 OK`: Successfully processed request
- `400 Bad Request`: Invalid request data
- `500 Internal Server Error`: Server error

#### GET `/health`

Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2023-12-01T10:00:00Z",
  "service": "bitespeed-identity-reconciliation"
}
```

#### GET `/api/v1/contacts/:id/chain`

Returns the complete contact chain for a given contact ID.

**Response:**
```json
{
  "contact": {
    "primaryContactId": "number",
    "emails": ["string"],
    "phoneNumbers": ["string"],
    "secondaryContactIds": ["number"]
  }
}
```

## 💡 Usage Examples

### Creating a New Contact
```bash
curl -X POST http://localhost:3000/api/v1/identify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "lorraine@hillvalley.edu",
    "phoneNumber": "123456"
  }'
```

**Response:**
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["lorraine@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": []
  }
}
```

### Linking Existing Contact
```bash
curl -X POST http://localhost:3000/api/v1/identify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mcfly@hillvalley.edu",
    "phoneNumber": "123456"
  }'
```

**Response:**
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [23]
  }
}
```

### Merging Separate Contact Groups
```bash
curl -X POST http://localhost:3000/api/v1/identify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "george@hillvalley.edu",
    "phoneNumber": "717171"
  }'
```

This will merge two previously separate primary contacts into a single chain.

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Structure
- `tests/services/`: Business logic tests
- `tests/controllers/`: API endpoint tests  
- `tests/models/`: Data model tests
- `tests/repositories/`: Database operation tests

### Coverage Requirements
- Minimum 80% coverage across all metrics
- Business logic (ContactService) has comprehensive scenario testing
- API validation and error handling fully tested

## 🚢 Deployment

### Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration  
DATABASE_URL="postgresql://username:password@host:port/database"

# Logging
LOG_LEVEL=info

# CORS Configuration
CORS_ORIGIN=*

# API Configuration
API_PREFIX=/api/v1
```

### Docker Deployment

1. **Build and deploy**
   ```bash
   docker-compose up --build -d
   ```

2. **View logs**
   ```bash
   docker-compose logs -f app
   ```

3. **Scale the application**
   ```bash
   docker-compose up --scale app=3
   ```

### Cloud Deployment (Railway)

1. **Connect to Railway**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login to Railway
   railway login
   ```

2. **Deploy to Railway**
   ```bash
   # Initialize Railway project
   railway init
   
   # Deploy your application
   railway up
   ```

3. **Set Environment Variables**
   In Railway dashboard, add these environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NODE_ENV`: `production`
   - `PORT`: Railway will set this automatically
   - `LOG_LEVEL`: `info`
   - `CORS_ORIGIN`: `*`

4. **Database Setup**
   ```bash
   # Run database migrations
   railway run npx prisma db push
   ```

**Live Demo**: [Your Railway URL will appear here after deployment]

### Alternative: Render.com Deployment

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set the following build settings:
   - **Build Command**: `npm install && npm run build && npx prisma generate`
   - **Start Command**: `npm start`
4. Add environment variables in Render dashboard
5. Deploy!

### Database Migration

For production deployments:

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Or run migrations
npx prisma migrate deploy
```

## 🏗 Architecture

### Project Structure
```
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # HTTP request handlers
│   ├── middleware/      # Express middleware
│   ├── models/          # Data models and validation
│   ├── repositories/    # Database operations
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── tests/               # Test files
├── prisma/              # Database schema and migrations
└── docker-compose.yml   # Container orchestration
```

### Design Patterns
- **Repository Pattern**: Data access abstraction
- **Service Layer**: Business logic separation
- **Dependency Injection**: Loose coupling between components
- **Error Handling**: Centralized error management
- **Configuration Management**: Environment-based configuration

### Database Schema

```sql
CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR,
  email VARCHAR,
  linked_id INTEGER REFERENCES contacts(id),
  link_precedence VARCHAR NOT NULL CHECK (link_precedence IN ('primary', 'secondary')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);
```

## 🔧 Development

### Code Quality
- **ESLint**: Code linting and style enforcement
- **Prettier**: Code formatting
- **TypeScript**: Static type checking
- **Husky**: Git hooks for pre-commit checks

### Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm test             # Run tests
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new functionality
- Update documentation for API changes
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Demo**: [Your deployed URL]
- **API Documentation**: [Postman Collection or Swagger]
- **Issues**: [GitHub Issues]
- **Contact**: [Your contact information]

---

Made with ❤️ for Bitespeed Assignment 