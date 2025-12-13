import User from '../_models/users.js';
import sequelize from '../_config/db.js';

/**
 * Script to activate vendor by user_uni_id
 * Usage: node vendor/activateVendorById.js <user_uni_id>
 */

const userUniId = process.argv[2];

if (!userUniId) {
  console.error('❌ Please provide a user_uni_id');
  console.log('Usage: node vendor/activateVendorById.js <user_uni_id>');
  console.log('Example: node vendor/activateVendorById.js VEND0006');
  process.exit(1);
}

async function activateVendor() {
  try {
    console.log(`[Activate Vendor] Looking for vendor with user_uni_id: ${userUniId}\n`);
    
    // Find vendor by user_uni_id (try multiple role_ids: 3, 5, etc.)
    let vendor = await User.findOne({
      where: {
        user_uni_id: userUniId,
        role_id: 3, // Vendor role ID (common)
        trash: 0
      }
    });
    
    // If not found with role_id 3, try role_id 5
    if (!vendor) {
      vendor = await User.findOne({
        where: {
          user_uni_id: userUniId,
          role_id: 5, // Alternative vendor role ID
          trash: 0
        }
      });
    }
    
    // If still not found, try without role_id filter
    if (!vendor) {
      vendor = await User.findOne({
        where: {
          user_uni_id: userUniId,
          trash: 0
        }
      });
      
      if (vendor) {
        console.log(`⚠️  Found user but role_id is ${vendor.role_id} (expected 3 or 5 for vendor)`);
      }
    }
    
    if (!vendor) {
      console.error(`❌ Vendor not found with user_uni_id: ${userUniId}`);
      process.exit(1);
    }
    
    console.log(`✅ Vendor found:`);
    console.log(`   User ID: ${vendor.id}`);
    console.log(`   User Uni ID: ${vendor.user_uni_id}`);
    console.log(`   Name: ${vendor.name || 'N/A'}`);
    console.log(`   Phone: ${vendor.phone || 'N/A'}`);
    console.log(`   Email: ${vendor.email || 'N/A'}`);
    console.log(`   Current Status: ${vendor.status}`);
    console.log(`   Role ID: ${vendor.role_id}`);
    
    if (vendor.status === 1) {
      console.log('\n✅ Vendor is already activated!');
      process.exit(0);
    }
    
    // Activate vendor - update both status and isVerified if field exists
    console.log(`\n[Activate Vendor] Updating status from ${vendor.status} to 1...`);
    
    // Try to update both status and isVerified using raw SQL
    try {
      // First check if isVerified column exists
      const [columns] = await sequelize.query(
        `SHOW COLUMNS FROM users LIKE 'isVerified'`,
        { type: sequelize.QueryTypes.SELECT }
      );
      
      if (columns && columns.length > 0) {
        // Column exists, update both (don't filter by role_id since we already found the vendor)
        await sequelize.query(
          `UPDATE users SET status = 1, isVerified = 1 WHERE user_uni_id = :userUniId`,
          {
            replacements: { userUniId },
            type: sequelize.QueryTypes.UPDATE
          }
        );
        console.log(`[Activate Vendor] Updated status and isVerified via SQL`);
      } else {
        // Column doesn't exist, just update status
        await vendor.update({ status: 1 });
        console.log(`[Activate Vendor] Updated status only (isVerified column not found)`);
      }
    } catch (sqlError) {
      // Fallback to Sequelize update if SQL fails
      console.log(`[Activate Vendor] SQL update failed, using Sequelize update:`, sqlError.message);
      await vendor.update({ status: 1 });
    }
    
    // Verify update
    await vendor.reload();
    
    console.log(`\n✅ Vendor activated successfully!`);
    console.log(`   Status: ${vendor.status === 1 ? '✅ Active' : '❌ Still Inactive'}`);
    console.log(`   User Uni ID: ${vendor.user_uni_id}`);
    console.log(`   Phone: ${vendor.phone}`);
    console.log(`   Name: ${vendor.name || 'N/A'}`);
    
    // Check isVerified if it exists
    try {
      const [result] = await sequelize.query(
        `SELECT isVerified FROM users WHERE user_uni_id = :userUniId`,
        {
          replacements: { userUniId },
          type: sequelize.QueryTypes.SELECT
        }
      );
      if (result && 'isVerified' in result) {
        console.log(`   isVerified: ${result.isVerified === 1 ? '✅ Verified' : '❌ Not Verified'}`);
      }
    } catch (e) {
      // isVerified column doesn't exist, skip
    }
    
    if (vendor.status !== 1) {
      console.error(`\n❌ Warning: Status update may have failed. Current status: ${vendor.status}`);
      process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error activating vendor:', error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

activateVendor();

