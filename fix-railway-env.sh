#!/bin/bash

echo "🔧 Railway Environment Fix"
echo "========================="

echo ""
echo "❌ Problem: Your app is using local DATABASE_URL instead of Railway PostgreSQL"
echo ""

echo "📋 Solution: Set DATABASE_URL in Railway app service"
echo ""

echo "1. Go to your Railway project dashboard"
echo "2. Click on your ContactBridge app service"
echo "3. Go to 'Variables' tab"
echo "4. Add/Update this variable:"
echo ""

echo "DATABASE_URL=postgresql://postgres:NNQKMWkwEMPYmmhXVZKobxUUxJVqfJMr@switchyard.proxy.rlwy.net:15003/railway"
echo ""

echo "5. Click 'Save'"
echo "6. Railway will automatically redeploy"
echo ""

echo "🔍 Expected logs after deployment:"
echo "- 'Initializing database connection with DATABASE_URL'"
echo "- 'Database connected successfully'"
echo "- 'Server started successfully'"
echo ""

echo "🌐 Your API will be available at:"
echo "https://your-app-name.railway.app" 