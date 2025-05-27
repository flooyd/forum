#!/usr/bin/env node
/**
 * Test script for User Management API endpoints
 * This script tests the new user management and admin endpoints
 * 
 * Usage: node test-user-management.js
 * Note: Requires a running server and valid admin token
 */

const BASE_URL = 'http://localhost:5173';

// You'll need to replace this with a valid admin token
const ADMIN_TOKEN = 'YOUR_ADMIN_TOKEN_HERE';

const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ADMIN_TOKEN}`
};

async function testEndpoint(method, url, body = null) {
    try {
        const config = {
            method,
            headers
        };
        
        if (body) {
            config.body = JSON.stringify(body);
        }
        
        console.log(`\n🧪 Testing ${method} ${url}`);
        if (body) console.log('📝 Body:', JSON.stringify(body, null, 2));
        
        const response = await fetch(`${BASE_URL}${url}`, config);
        const data = await response.json();
        
        console.log(`📊 Status: ${response.status}`);
        console.log(`📋 Response:`, JSON.stringify(data, null, 2));
        
        return { status: response.status, data };
    } catch (error) {
        console.error(`❌ Error testing ${method} ${url}:`, error.message);
        return { error: error.message };
    }
}

async function runTests() {
    console.log('🚀 Starting User Management API Tests');
    console.log('⚠️  Make sure you have a valid admin token set in the script');
    
    // Test 1: Get system stats
    await testEndpoint('GET', '/admin?action=stats');
    
    // Test 2: Get recent activity
    await testEndpoint('GET', '/admin?action=recent-activity');
    
    // Test 3: Get users (first page)
    await testEndpoint('GET', '/users?page=1&limit=5');
    
    // Test 4: Search users
    await testEndpoint('GET', '/users?search=admin');
    
    // Test 5: Promote user (you'll need to replace with actual user ID)
    // await testEndpoint('POST', '/admin', {
    //     action: 'promote-user',
    //     data: { userId: 1 }
    // });
    
    // Test 6: Update user (you'll need to replace with actual user ID)
    // await testEndpoint('PATCH', '/users', {
    //     userId: 1,
    //     updates: { displayName: 'Updated Display Name' }
    // });
    
    console.log('\n✅ Test run completed!');
    console.log('💡 Uncomment specific tests above to test user modifications');
}

// Check if admin token is set
if (ADMIN_TOKEN === 'YOUR_ADMIN_TOKEN_HERE') {
    console.log('⚠️  Please set a valid admin token in the script before running tests');
    console.log('💡 You can get a token by logging in as an admin user in the application');
    process.exit(1);
}

runTests().catch(console.error);
