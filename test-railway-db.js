#!/usr/bin/env node

const { Client } = require('pg');

async function testConnection() {
  console.log('🧪 Testing Railway PostgreSQL Connection...');
  
  const connectionString = 'postgresql://postgres:NNQKMWkwEMPYmmhXVZKobxUUxJVqfJMr@switchyard.proxy.rlwy.net:15003/railway';
  
  const client = new Client({
    connectionString: connectionString
  });

  try {
    await client.connect();
    console.log('✅ Successfully connected to Railway PostgreSQL!');
    
    const result = await client.query('SELECT NOW()');
    console.log('📅 Database time:', result.rows[0].now);
    
    await client.end();
    console.log('✅ Connection test completed successfully');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if your Railway PostgreSQL service is running');
    console.log('2. Verify the connection URL is correct');
    console.log('3. Make sure the database is accessible');
  }
}

testConnection(); 