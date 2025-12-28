// Test script for dashboard API
// Run this to test if the dashboard endpoint is working

const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:4000';
const TEST_TOKEN = 'proto-token:YOUR_USER_ID'; // Replace with actual token
const TEST_COMPANY_ID = 'YOUR_COMPANY_ID'; // Replace with actual company ID

async function testDashboard() {
    try {
        console.log('Testing Dashboard API...\n');
        
        const response = await axios.get(`${API_BASE_URL}/api/dashboard/stats`, {
            headers: {
                'Authorization': TEST_TOKEN
            },
            params: {
                companyId: TEST_COMPANY_ID,
                period: 'current-month'
            }
        });

        console.log('✅ Dashboard API Response:');
        console.log(JSON.stringify(response.data, null, 2));
        
        // Verify structure
        console.log('\n📊 Data Summary:');
        console.log('- Total Sales:', response.data.businessOperations?.totalSales);
        console.log('- Total Purchases:', response.data.businessOperations?.totalPurchases);
        console.log('- Total Expenses:', response.data.businessOperations?.totalExpenses);
        console.log('- Total Income:', response.data.totalIncome?.totalIncome);
        console.log('- Low Stock Items:', response.data.lowStockItems?.length);
        console.log('- Top Sales Items:', response.data.topSalesItems?.length);

    } catch (error) {
        console.error('❌ Error testing dashboard:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

// Run the test
testDashboard();
