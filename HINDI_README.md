# Ask Questions Frontend Integration - Quick Guide

## Kya Kiya Gaya Hai? 🎯

Backend me `ask_questions` table ka data ab frontend pe successfully fetch aur display ho raha hai.

## Features ✨

### 1. Customer Dashboard Integration
- **Location**: `/customer-dashboard` → "My Questions" tab
- **Features**:
  - Sabhi questions aur answers table format me
  - Astrologer ka naam
  - Question aur Answer ka status (Pending/Answered)
  - Amount aur date
  - Load More button for pagination

### 2. Standalone Page
- **Location**: `/ask-questions`
- **Features**:
  - Beautiful card-based layout
  - Complete question aur answer display
  - Astrologer information
  - Status badges with colors
  - Load more functionality

## Kaise Use Karein? 📱

### User Ke Liye

#### Dashboard Se:
1. Login karein
2. Customer Dashboard pe jaayein
3. "My Questions" tab pe click karein
4. Apne saare questions dekh sakte hain

#### Direct Page Se:
1. Login karein
2. `/ask-questions` URL pe jaayein
3. Questions cards me dikhenge

### Developer Ke Liye

#### API Function Call:
```javascript
import { fetchAskQuestionsList } from '../utils/api'

// First page fetch karne ke liye
const result = await fetchAskQuestionsList(0)

// Next page fetch karne ke liye (offset = 10)
const nextPage = await fetchAskQuestionsList(10)
```

#### Response Format:
```javascript
{
  status: 1,
  offset: 10,
  data: [
    {
      id: 1,
      orderId: "ASK-123",
      question: "Question text...",
      answer: "Answer text..." or "Pending",
      answerStatus: 0 or 1,  // 0 = Pending, 1 = Answered
      amount: 100.00,
      date: "Dec 13, 2025",
      astrologerName: "Astrologer Name",
      astrologerImg: "url"
    }
  ]
}
```

## Backend API 🔗

- **Endpoint**: `POST /api/askQuestionCustomerList`
- **Port**: 8005 (Welcome Service)
- **Required**: api_key, customer_uni_id
- **Optional**: offset (pagination ke liye)

## Files Changed 📝

### New Files:
1. `react_theme/src/pages/AskQuestions.jsx` - Questions page
2. `ASK_QUESTIONS_INTEGRATION.md` - Detailed documentation
3. `HINDI_README.md` - Ye file

### Modified Files:
1. `react_theme/src/utils/api.js` - API function added
2. `react_theme/src/pages/Customer_Dashboard.jsx` - Dashboard integration
3. `react_theme/src/App.jsx` - Route added

## Testing Kaise Karein? 🧪

1. **Login karein** - Valid user credentials chahiye
2. **Dashboard check karein** - "My Questions" tab visible hona chahiye
3. **Questions load ho rahe hain?** - Data table me dikhna chahiye
4. **Standalone page check karein** - `/ask-questions` pe jaayein
5. **Load More test karein** - Agar 10+ questions hain to button dikhega

## Status Badges 🏷️

- **Green (Answered)**: Astrologer ne answer de diya
- **Yellow (Pending)**: Answer abhi pending hai

## Important Notes 📌

- ✅ Login required hai
- ✅ Authentication automatically handle hota hai
- ✅ Pagination supported (10 questions per page)
- ✅ Error handling implemented
- ✅ Console logs enabled for debugging
- ✅ No linter errors

## Screenshots Reference 📸

### Dashboard View:
```
┌─────────────────────────────────────────────────┐
│ My Questions                                     │
├─────┬─────────┬────────────┬──────────┬─────────┤
│ S.No│ Order ID│ Astrologer │ Question │ Status  │
├─────┼─────────┼────────────┼──────────┼─────────┤
│  1  │ ASK-123 │ John Doe   │ When...  │ Answered│
└─────┴─────────┴────────────┴──────────┴─────────┘
         [Load More Button]
```

### Standalone Page:
```
┌──────────────────────────────────────┐
│   Order ID: ASK-123                   │
│   📅 Dec 13, 2025    [Answered]      │
│   ────────────────────────────────   │
│   ❓ Your Question:                  │
│   When will I get married?           │
│   ────────────────────────────────   │
│   💡 Astrologer's Answer:            │
│   Based on your chart...             │
│   ────────────────────────────────   │
│   👔 Astrologer: John Doe            │
└──────────────────────────────────────┘
```

## Troubleshooting 🔧

### Problem: Questions nahi dikh rahe?
- Check karein: User login hai?
- Check karein: Backend API running hai?
- Console me errors check karein

### Problem: Load More kaam nahi kar raha?
- Check karein: Offset value correct hai?
- Check karein: hasMoreAskQuestions state true hai?

### Problem: Authentication error?
- Re-login karein
- localStorage clear karke try karein

## Next Steps 🚀

Integration complete hai! Ab aap:
1. Test kar sakte hain
2. UI customize kar sakte hain
3. Additional features add kar sakte hain

## Support 💬

Agar koi issue aaye to:
1. Console logs check karein
2. Network tab me API calls check karein
3. Backend logs dekh lein

---

**Status**: ✅ Complete
**Date**: 13 Dec 2025
**Version**: 1.0

