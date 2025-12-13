import User from '../_models/users.js';
import sequelize from '../_config/db.js';

/**
 * Script to activate vendor using the same search logic as vendor login
 * This matches the backend vendor-login endpoint search logic
 */

const phone = process.argv[2];

if (!phone) {
  console.error('❌ Please provide a phone number');
  console.log('Usage: node vendor/activateVendorByLogin.js <phone_number>');
  console.log('Example: node vendor/activateVendorByLogin.js +918561987650');
  process.exit(1);
}

async function activateVendor() {
  try {
    console.log(`[Activate Vendor] Using login search logic for phone: ${phone}\n`);
    
    let searchPhone = phone;
    const searchAttempts = [];
    
    // Same logic as backend vendor-login
    if (phone.startsWith('+')) {
      const digitsOnly = phone.replace(/\D/g, '');
      searchPhone = digitsOnly.slice(-10);
      console.log(`[Activate Vendor] Normalized phone (last 10 digits): ${searchPhone}`);
      searchAttempts.push({ format: 'normalized (last 10)', phone: searchPhone });
    } else {
      searchPhone = phone.replace(/\D/g, '');
      console.log(`[Activate Vendor] Cleaned phone (digits only): ${searchPhone}`);
      searchAttempts.push({ format: 'cleaned (digits only)', phone: searchPhone });
    }
    
    // Try to find user with normalized phone
    console.log(`[Activate Vendor] Attempting search with normalized phone: ${searchPhone}`);
    let user = await User.findOne({ 
      where: { 
        phone: searchPhone, 
        role_id: 3, // Vendor role ID
        trash: 0 
      } 
    });
    
    if (user) {
      console.log(`✅ Vendor found with normalized phone`);
    } else {
      console.log(`❌ Vendor not found with normalized phone`);
    }
    
    // If not found, try with original phone
    if (!user) {
      console.log(`[Activate Vendor] Trying search with original phone: ${phone}`);
      searchAttempts.push({ format: 'original', phone: phone });
      user = await User.findOne({ 
        where: { 
          phone: phone, 
          role_id: 3,
          trash: 0 
        } 
      });
      
      if (user) {
        console.log(`✅ Vendor found with original phone`);
      }
    }
    
    // If still not found, try with phone without any + or spaces
    if (!user) {
      const cleanPhone = phone.replace(/[+\s]/g, '');
      console.log(`[Activate Vendor] Trying search with clean phone (no + or spaces): ${cleanPhone}`);
      searchAttempts.push({ format: 'clean (no + or spaces)', phone: cleanPhone });
      user = await User.findOne({ 
        where: { 
          phone: cleanPhone, 
          role_id: 3,
          trash: 0 
        } 
      });
      
      if (user) {
        console.log(`✅ Vendor found with clean phone`);
      }
    }
    
    // If still not found, try with phone starting from index 3 (skip +91)
    if (!user && phone.startsWith('+91') && phone.length > 3) {
      const phoneWithoutCountry = phone.substring(3);
      console.log(`[Activate Vendor] Trying search with phone without +91: ${phoneWithoutCountry}`);
      searchAttempts.push({ format: 'without +91', phone: phoneWithoutCountry });
      user = await User.findOne({ 
        where: { 
          phone: phoneWithoutCountry, 
          role_id: 3,
          trash: 0 
        } 
      });
      
      if (user) {
        console.log(`✅ Vendor found with phone without +91`);
      }
    }
    
    if (!user) {
      console.error(`❌ Vendor not found after all search attempts:`);
      searchAttempts.forEach(attempt => {
        console.error(`   - ${attempt.format}: ${attempt.phone}`);
      });
      process.exit(1);
    }
    
    console.log(`\n✅ Vendor found:`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   User Uni ID: ${user.user_uni_id}`);
    console.log(`   Name: ${user.name || 'N/A'}`);
    console.log(`   Phone: ${user.phone}`);
    console.log(`   Current Status: ${user.status}`);
    
    if (user.status === 1) {
      console.log('\n✅ Vendor is already activated!');
      process.exit(0);
    }
    
    // Activate vendor
    await user.update({ status: 1 });
    
    // Verify update
    await user.reload();
    
    console.log(`\n✅ Vendor activated successfully!`);
    console.log(`   Status changed from 0 to ${user.status}`);
    console.log(`   User Uni ID: ${user.user_uni_id}`);
    console.log(`   Phone: ${user.phone}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error activating vendor:', error);
    process.exit(1);
  }
}

activateVendor();

