#!/usr/bin/env node

console.log('🔍 Railway Environment Debug Script');
console.log('==================================');

console.log('\n📋 Current Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');

if (process.env.DATABASE_URL) {
  // Hide password in logs
  const url = process.env.DATABASE_URL.replace(/:[^:@]*@/, ':****@');
  console.log('DATABASE_URL (masked):', url);
} else {
  console.log('❌ DATABASE_URL is not set!');
  console.log('\n🔧 To fix this:');
  console.log('1. Go to your Railway project dashboard');
  console.log('2. Click on your ContactBridge app service');
  console.log('3. Go to "Variables" tab');
  console.log('4. Add: DATABASE_URL=postgresql://postgres:NNQKMWkwEMPYmmhXVZKobxUUxJVqfJMr@switchyard.proxy.rlwy.net:15003/railway');
  console.log('5. Click "Save"');
  console.log('6. Railway will redeploy automatically');
}

console.log('\n🎯 Expected Railway PostgreSQL URL:');
console.log('postgresql://postgres:NNQKMWkwEMPYmmhXVZKobxUUxJVqfJMr@switchyard.proxy.rlwy.net:15003/railway');

process.exit(0); 