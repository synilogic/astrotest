import User from '../_models/users.js';
import sequelize from '../_config/db.js';

/**
 * Script to find a vendor by phone or user_uni_id
 */

const searchTerm = process.argv[2];

if (!searchTerm) {
  console.error('❌ Please provide a search term (phone or user_uni_id)');
  process.exit(1);
}

async function findVendor() {
  try {
    console.log(`[Find Vendor] Searching for: ${searchTerm}\n`);
    
    // Search by user_uni_id
    const byUniId = await User.findOne({
      where: {
        user_uni_id: searchTerm,
        role_id: 3,
        trash: 0
      }
    });
    
    if (byUniId) {
      console.log('✅ Found by user_uni_id:');
      console.log(JSON.stringify(byUniId.toJSON(), null, 2));
      return;
    }
    
    // Search by phone (exact)
    const byPhoneExact = await User.findOne({
      where: {
        phone: searchTerm,
        role_id: 3,
        trash: 0
      }
    });
    
    if (byPhoneExact) {
      console.log('✅ Found by phone (exact):');
      console.log(JSON.stringify(byPhoneExact.toJSON(), null, 2));
      return;
    }
    
    // Search by phone (normalized - last 10 digits)
    const cleanPhone = searchTerm.replace(/\D/g, '').slice(-10);
    const byPhoneNormalized = await User.findOne({
      where: {
        phone: cleanPhone,
        role_id: 3,
        trash: 0
      }
    });
    
    if (byPhoneNormalized) {
      console.log('✅ Found by phone (normalized):');
      console.log(JSON.stringify(byPhoneNormalized.toJSON(), null, 2));
      return;
    }
    
    // Search by phone with +91 prefix
    if (!searchTerm.startsWith('+91') && cleanPhone.length === 10) {
      const phoneWithPrefix = `+91${cleanPhone}`;
      const byPhoneWithPrefix = await User.findOne({
        where: {
          phone: phoneWithPrefix,
          role_id: 3,
          trash: 0
        }
      });
      
      if (byPhoneWithPrefix) {
        console.log('✅ Found by phone (+91 prefix):');
        console.log(JSON.stringify(byPhoneWithPrefix.toJSON(), null, 2));
        return;
      }
    }
    
    // Search all vendors with similar phone
    const allVendors = await User.findAll({
      where: {
        role_id: 3,
        trash: 0
      },
      attributes: ['id', 'user_uni_id', 'name', 'phone', 'status'],
      limit: 50
    });
    
    console.log('❌ Vendor not found. Searching for similar phones...\n');
    console.log(`Found ${allVendors.length} vendors. Checking for similar phones...\n`);
    
    const searchDigits = cleanPhone;
    const similar = allVendors.filter(v => {
      if (!v.phone) return false;
      const vendorDigits = v.phone.replace(/\D/g, '').slice(-10);
      return vendorDigits === searchDigits || vendorDigits.includes(searchDigits) || searchDigits.includes(vendorDigits);
    });
    
    if (similar.length > 0) {
      console.log(`Found ${similar.length} vendors with similar phones:`);
      similar.forEach(v => {
        console.log(`  - ${v.user_uni_id}: ${v.name || 'N/A'} | Phone: ${v.phone} | Status: ${v.status}`);
      });
    } else {
      console.log('No similar phones found.');
      console.log('\nAll vendors (first 20):');
      allVendors.slice(0, 20).forEach(v => {
        console.log(`  - ${v.user_uni_id}: ${v.name || 'N/A'} | Phone: ${v.phone || 'N/A'} | Status: ${v.status}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error finding vendor:', error);
    process.exit(1);
  }
}

findVendor();

