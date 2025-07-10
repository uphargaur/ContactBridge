# Railway Deployment Setup Guide

## 🚀 Quick Setup

### 1. Set Environment Variables in Railway

Go to your Railway project dashboard and add these environment variables:

```bash
# Required Environment Variables
DATABASE_URL=postgresql://username:password@host:port/database
NODE_ENV=production
LOG_LEVEL=info
CORS_ORIGIN=*
API_PREFIX=/api/v1
```

### 2. Database Setup Options

#### Option A: Railway PostgreSQL (Recommended)
1. Add a PostgreSQL service to your Railway project
2. Railway will automatically provide the DATABASE_URL
3. Copy the DATABASE_URL to your app service environment variables

#### Option B: External Database
- Use any PostgreSQL provider (Supabase, PlanetScale, etc.)
- Copy the connection string to DATABASE_URL

### 3. Deploy

The deployment should now work! Your API will be available at:
`https://your-app-name.railway.app`

## 🔧 Troubleshooting

### If you get DATABASE_URL errors:
- Make sure DATABASE_URL is set in Railway environment variables
- Check that the database is accessible from Railway

### If you get Prisma errors:
- The Dockerfile has been updated to use Debian (more compatible)
- OpenSSL is properly installed
- Binary targets are configured

### If the app doesn't start:
- Check Railway logs for specific error messages
- Verify all environment variables are set correctly

## 📋 Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ Yes | - | PostgreSQL connection string |
| `NODE_ENV` | ❌ No | `development` | Environment mode |
| `PORT` | ❌ No | `3000` | Server port (Railway sets this) |
| `LOG_LEVEL` | ❌ No | `info` | Logging level |
| `CORS_ORIGIN` | ❌ No | `*` | CORS allowed origins |
| `API_PREFIX` | ❌ No | `/api/v1` | API route prefix |

## 🎯 API Endpoints

Once deployed, your API will have these endpoints:

- `GET /health` - Health check
- `POST /api/v1/identify` - Main identity reconciliation endpoint
- `GET /api/v1/contacts/:id/chain` - Get contact chain

## 📊 Monitoring

- Check Railway dashboard for logs and metrics
- Use the `/health` endpoint for monitoring
- Railway provides automatic health checks 