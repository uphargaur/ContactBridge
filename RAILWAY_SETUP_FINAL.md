# 🚀 Railway Setup - Final Guide

## ✅ **Your Railway PostgreSQL is Working!**

**Public URL:** `postgresql://postgres:NNQKMWkwEMPYmmhXVZKobxUUxJVqfJMr@switchyard.proxy.rlwy.net:15003/railway`

## 🔧 **Step 1: Set Environment Variables in Your App Service**

1. **Go to your Railway project dashboard**
2. **Click on your ContactBridge app service** (NOT the PostgreSQL service)
3. **Go to "Variables" tab**
4. **Add/Update these variables:**

```bash
DATABASE_URL=postgresql://postgres:NNQKMWkwEMPYmmhXVZKobxUUxJVqfJMr@switchyard.proxy.rlwy.net:15003/railway
NODE_ENV=production
LOG_LEVEL=info
CORS_ORIGIN=*
API_PREFIX=/api/v1
```

5. **Click "Save"**
6. **Railway will automatically redeploy**

## 🎯 **Step 2: Verify Deployment**

After deployment, check the logs. You should see:
- `"Initializing database connection with DATABASE_URL"`
- `"Database connected successfully"`
- `"Server started successfully"`

## 🌐 **Your API will be available at:**
`https://your-app-name.railway.app`

## 📊 **Test Your API:**

```bash
# Health check
curl https://your-app-name.railway.app/health

# Test identify endpoint
curl -X POST https://your-app-name.railway.app/api/v1/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "phoneNumber": "123456"}'
```

## 🔍 **Troubleshooting:**

If you still see `localhost:5432` errors:
1. Make sure you're setting variables in the **app service**, not the PostgreSQL service
2. Check that the `DATABASE_URL` is exactly as shown above
3. Wait for Railway to redeploy after saving variables 