import User from '../_models/users.js';
import sequelize from '../_config/db.js';

/**
 * Script to activate a vendor account by phone number
 * Usage: node vendor/activateVendor.js <phone_number>
 */

const identifier = process.argv[2];

if (!identifier) {
  console.error('❌ Please provide a phone number or user_uni_id');
  console.log('Usage: node vendor/activateVendor.js <phone_number|user_uni_id>');
  console.log('Example: node vendor/activateVendor.js 8561987650');
  console.log('Example: node vendor/activateVendor.js VEND0006');
  process.exit(1);
}

async function activateVendor() {
  try {
    // Check if identifier is user_uni_id (starts with VEND) or phone number
    const isUserUniId = identifier.startsWith('VEND');
    
    let vendor;
    
    if (isUserUniId) {
      console.log(`[Activate Vendor] Looking for vendor with user_uni_id: ${identifier}`);
      vendor = await User.findOne({
        where: {
          user_uni_id: identifier,
          role_id: 3, // Vendor role ID
          trash: 0
        }
      });
    } else {
      console.log(`[Activate Vendor] Looking for vendor with phone: ${identifier}`);
      
      // Normalize phone (remove country code if present)
      const cleanPhone = identifier.replace(/\D/g, '').slice(-10);
      console.log(`[Activate Vendor] Normalized phone: ${cleanPhone}`);
      
      // Find vendor with normalized phone
      vendor = await User.findOne({
        where: {
          phone: cleanPhone,
          role_id: 3, // Vendor role ID
          trash: 0
        }
      });
      
      // If not found, try with original phone
      if (!vendor) {
        console.log(`[Activate Vendor] Trying with original phone format: ${identifier}`);
        vendor = await User.findOne({
          where: {
            phone: identifier,
            role_id: 3,
            trash: 0
          }
        });
      }
      
      // If still not found, try with +91 prefix
      if (!vendor && !identifier.startsWith('+91')) {
        const phoneWithPrefix = `+91${cleanPhone}`;
        console.log(`[Activate Vendor] Trying with +91 prefix: ${phoneWithPrefix}`);
        vendor = await User.findOne({
          where: {
            phone: phoneWithPrefix,
            role_id: 3,
            trash: 0
          }
        });
      }
    }
    
    if (!vendor) {
      console.error(`❌ Vendor not found with ${isUserUniId ? 'user_uni_id' : 'phone'}: ${identifier}`);
      process.exit(1);
    }
    
    console.log(`✅ Found vendor:`);
    console.log(`   User ID: ${vendor.id}`);
    console.log(`   User Uni ID: ${vendor.user_uni_id}`);
    console.log(`   Name: ${vendor.name}`);
    console.log(`   Phone: ${vendor.phone}`);
    console.log(`   Current Status: ${vendor.status}`);
    
    if (vendor.status === 1) {
      console.log('✅ Vendor is already activated!');
      process.exit(0);
    }
    
    // Activate vendor
    await vendor.update({ status: 1 });
    
    console.log(`✅ Vendor activated successfully!`);
    console.log(`   Status changed from ${vendor.status} to 1`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error activating vendor:', error);
    process.exit(1);
  }
}

activateVendor();

