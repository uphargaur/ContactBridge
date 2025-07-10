#!/bin/bash

echo "🚀 Railway Environment Setup Helper"
echo "=================================="

echo ""
echo "📋 Please follow these steps:"
echo ""

echo "1. Go to your Railway project dashboard"
echo "2. Click on your ContactBridge app service"
echo "3. Go to 'Variables' tab"
echo "4. Add/Update these variables:"
echo ""

echo "DATABASE_URL=postgresql://postgres:NNQKMWkwEMPYmmhXVZKobxUUxJVqfJMr@switchyard.proxy.rlwy.net:15003/railway"
echo "NODE_ENV=production"
echo "LOG_LEVEL=info"
echo "CORS_ORIGIN=*"
echo "API_PREFIX=/api/v1"

echo ""
echo "5. Click 'Save'"
echo "6. Railway will automatically redeploy your app"
echo ""

echo "🔍 To verify the deployment:"
echo "1. Go to 'Deployments' tab"
echo "2. Check the latest deployment logs"
echo "3. Look for 'Database connected successfully' message"
echo ""

echo "🌐 Your API will be available at:"
echo "https://your-app-name.railway.app"
echo ""

echo "📊 Test endpoints:"
echo "curl https://your-app-name.railway.app/health"
echo "curl -X POST https://your-app-name.railway.app/api/v1/identify \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"email\": \"test@example.com\", \"phoneNumber\": \"123456\"}'" 