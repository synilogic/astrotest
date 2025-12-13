import db from './html/_config/db.js';

(async () => {
  try {
    console.log('\n🔍 Checking orders for user CUS0041...\n');
    
    // Check product orders
    const [orders] = await db.query(
      "SELECT * FROM orders WHERE user_uni_id = 'CUS0041' LIMIT 5"
    );
    console.log('📦 Product Orders Count:', orders.length);
    if (orders.length > 0) {
      console.log('\n✅ Found product orders:');
      orders.forEach((order, i) => {
        console.log(`\n${i + 1}. Order ID: ${order.order_id}`);
        console.log(`   User: ${order.user_uni_id}`);
        console.log(`   Amount: ${order.total_amount}`);
        console.log(`   Status: ${order.order_status || order.payment_status}`);
        console.log(`   Created: ${order.created_at}`);
      });
    } else {
      console.log('⚠️ No product orders found for CUS0041');
    }
    
    // Check service orders
    const [serviceOrders] = await db.query(
      "SELECT * FROM service_orders WHERE customer_uni_id = 'CUS0041' LIMIT 5"
    );
    console.log('\n🔮 Service Orders Count:', serviceOrders.length);
    if (serviceOrders.length > 0) {
      console.log('\n✅ Found service orders:');
      serviceOrders.forEach((order, i) => {
        console.log(`\n${i + 1}. Order ID: ${order.order_id}`);
        console.log(`   Customer: ${order.customer_uni_id}`);
        console.log(`   Price: ${order.price}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Created: ${order.created_at}`);
      });
    } else {
      console.log('⚠️ No service orders found for CUS0041');
    }
    
    // Check if any orders exist at all
    const [allOrders] = await db.query("SELECT COUNT(*) as count FROM orders");
    const [allServiceOrders] = await db.query("SELECT COUNT(*) as count FROM service_orders");
    
    console.log('\n📊 Total in database:');
    console.log('   Product Orders:', allOrders[0].count);
    console.log('   Service Orders:', allServiceOrders[0].count);
    
    // If no orders for this user, check if user exists
    if (orders.length === 0 && serviceOrders.length === 0) {
      const [users] = await db.query(
        "SELECT user_uni_id, name, email FROM users WHERE user_uni_id = 'CUS0041' OR customer_uni_id = 'CUS0041'"
      );
      console.log('\n👤 User exists:', users.length > 0 ? 'Yes' : 'No');
      if (users.length > 0) {
        console.log('   User:', users[0].name, '-', users[0].email);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database Error:', error.message);
    process.exit(1);
  }
})();

