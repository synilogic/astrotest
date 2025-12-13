import User from '../_models/users.js';
import sequelize from '../_config/db.js';

/**
 * Script to list all vendors
 */

async function listVendors() {
  try {
    console.log('[List Vendors] Fetching all vendors...');
    
    const vendors = await User.findAll({
      where: {
        role_id: 3, // Vendor role ID
        trash: 0
      },
      attributes: ['id', 'user_uni_id', 'name', 'phone', 'email', 'status', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 20
    });
    
    console.log(`\n✅ Found ${vendors.length} vendors:\n`);
    
    vendors.forEach((vendor, index) => {
      console.log(`${index + 1}. Vendor:`);
      console.log(`   ID: ${vendor.id}`);
      console.log(`   User Uni ID: ${vendor.user_uni_id}`);
      console.log(`   Name: ${vendor.name || 'N/A'}`);
      console.log(`   Phone: ${vendor.phone || 'N/A'} (length: ${vendor.phone ? String(vendor.phone).length : 0})`);
      console.log(`   Email: ${vendor.email || 'N/A'}`);
      console.log(`   Status: ${vendor.status} ${vendor.status === 0 ? '❌ (Inactive)' : '✅ (Active)'}`);
      console.log(`   Created: ${vendor.created_at}`);
      console.log('');
    });
    
    // Count by status
    const activeCount = vendors.filter(v => v.status === 1).length;
    const inactiveCount = vendors.filter(v => v.status === 0).length;
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total: ${vendors.length}`);
    console.log(`   Active: ${activeCount}`);
    console.log(`   Inactive: ${inactiveCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error listing vendors:', error);
    process.exit(1);
  }
}

listVendors();

