## Backend Fix for Ask Questions API

### Problem
500 Internal Server Error - AskQuestion model associations were missing

### Solution
Added AskQuestion model associations in `html/_models/associateModels.js`:

```javascript
import AskQuestion from './askQustion.js';

// AskQuestion associations
AskQuestion.belongsTo(UserModel, { 
  as: 'user_customer', 
  foreignKey: 'customer_uni_id', 
  targetKey: 'user_uni_id' 
});

AskQuestion.belongsTo(CustomerModel, { 
  as: 'customer', 
  foreignKey: 'customer_uni_id', 
  targetKey: 'customer_uni_id' 
});

AskQuestion.belongsTo(UserModel, { 
  as: 'user_astrologer', 
  foreignKey: 'astrologer_uni_id', 
  targetKey: 'user_uni_id' 
});

AskQuestion.belongsTo(Astrologer, { 
  as: 'astrologer', 
  foreignKey: 'astrologer_uni_id', 
  targetKey: 'astrologer_uni_id' 
});
```

### Steps to Fix

1. **Modified File**: `html/_models/associateModels.js`
   - Added import for AskQuestion model
   - Added all 4 required associations

2. **Restart Backend**:
   ```bash
   # Navigate to backend directory
   cd html
   
   # If using PM2
   pm2 restart welcome
   
   # OR if running directly
   # Stop the current process (Ctrl+C) and restart
   npm start
   ```

3. **Test the API**:
   - Login to frontend
   - Navigate to Customer Dashboard → "My Questions" tab
   - OR visit `/ask-questions` page
   - Data should load without errors

### Why This Happened

The `askQuestionList()` helper function in `html/_helpers/helper.js` uses Sequelize includes:

```javascript
include: [
  { model: User, as: 'user_customer', attributes: [] },
  { model: Customer, as: 'customer', attributes: [] },
  { model: User, as: 'user_astrologer', attributes: [] },
  { model: Astrologer, as: 'astrologer', attributes: [] },
]
```

These associations must be defined in `associateModels.js` for Sequelize to work properly. Without them, Sequelize throws an error causing the 500 status.

### Verification

After restart, check:
1. ✅ No console errors in browser
2. ✅ Questions load in dashboard
3. ✅ API returns status 1
4. ✅ Data displays correctly

### Files Modified
- `html/_models/associateModels.js` (added AskQuestion associations)

### Backend Services
Make sure Welcome service (Port 8005) is running:
```bash
# Check if running
pm2 status

# Or check logs
pm2 logs welcome
```

---

**Status**: ✅ Fixed - Restart Required
**Impact**: Backend only
**Testing**: Required after restart

