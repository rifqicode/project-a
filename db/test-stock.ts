/**
 * Test script to verify stock database operations
 * Run this to test and add sample data
 */

import { StockService } from './services/stock';

export async function testStockOperations() {
  console.log('=== Testing Stock Operations ===\n');

  try {
    // Test 1: Create sample stocks
    console.log('1. Creating sample stocks...');
    const stock1Id = await StockService.createStock({
      name: 'White Sugar',
      symbol: 'kg',
      sku: 'SUGAR-001',
      quantity: 100,
    });
    console.log(`✓ Created stock with ID: ${stock1Id}`);

    const stock2Id = await StockService.createStock({
      name: 'All Purpose Flour',
      symbol: 'kg',
      sku: 'FLOUR-001',
      quantity: 50,
    });
    console.log(`✓ Created stock with ID: ${stock2Id}`);

    const stock3Id = await StockService.createStock({
      name: 'Cooking Oil',
      symbol: 'liter',
      sku: 'OIL-001',
      quantity: 25,
    });
    console.log(`✓ Created stock with ID: ${stock3Id}\n`);

    // Test 2: Get all stocks
    console.log('2. Fetching all stocks...');
    const allStocks = await StockService.getAllStocks({});
    console.log(`✓ Found ${allStocks.length} stocks:`);
    allStocks.forEach(stock => {
      console.log(`  - ${stock.name} (${stock.sku}): ${stock.quantity} ${stock.symbol}`);
    });
    console.log('');

    // Test 3: Update stock
    console.log('3. Updating stock quantity...');
    await StockService.updateStock(stock1Id, {
      quantity: 120,
    });
    console.log(`✓ Updated stock ${stock1Id} quantity to 120\n`);

    // Test 4: Get stock history
    console.log('4. Fetching stock history...');
    const history = await StockService.getStockHistory(stock1Id);
    console.log(`✓ Found ${history.length} history records for stock ${stock1Id}:`);
    history.forEach(h => {
      console.log(`  - Type: ${h.transactionType}, Quantity: ${h.quantity}`);
    });
    console.log('');

    // Test 5: Search stocks
    console.log('5. Searching for "flour"...');
    const searchResults = await StockService.getAllStocks({
      searchQuery: 'flour',
    });
    console.log(`✓ Found ${searchResults.length} matching stocks\n`);

    console.log('=== All Tests Passed! ===');
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Add sample data function
export async function addSampleStockData() {
  console.log('Adding sample stock data...\n');

  const sampleStocks = [
    { name: 'White Sugar', symbol: 'kg', sku: 'SUGAR-001', quantity: 100 },
    { name: 'Brown Sugar', symbol: 'kg', sku: 'SUGAR-002', quantity: 75 },
    { name: 'All Purpose Flour', symbol: 'kg', sku: 'FLOUR-001', quantity: 150 },
    { name: 'Bread Flour', symbol: 'kg', sku: 'FLOUR-002', quantity: 80 },
    { name: 'Cooking Oil', symbol: 'liter', sku: 'OIL-001', quantity: 50 },
    { name: 'Olive Oil', symbol: 'liter', sku: 'OIL-002', quantity: 25 },
    { name: 'Salt', symbol: 'kg', sku: 'SALT-001', quantity: 200 },
    { name: 'Black Pepper', symbol: 'gram', sku: 'PEPPER-001', quantity: 500 },
    { name: 'Milk', symbol: 'liter', sku: 'MILK-001', quantity: 30 },
    { name: 'Butter', symbol: 'kg', sku: 'BUTTER-001', quantity: 20 },
  ];

  try {
    for (const stock of sampleStocks) {
      const id = await StockService.createStock(stock);
      console.log(`✓ Created: ${stock.name} (ID: ${id})`);
    }
    console.log(`\n✓ Successfully added ${sampleStocks.length} sample stocks!`);
  } catch (error) {
    console.error('❌ Failed to add sample data:', error);
    throw error;
  }
}
