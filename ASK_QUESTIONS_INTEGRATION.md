# Ask Questions Integration - Documentation

## Overview
This document describes the integration of the `ask_questions` table data from backend to frontend.

## Backend API Endpoint

### Endpoint Details
- **URL**: `POST /api/askQuestionCustomerList`
- **Service**: Welcome Service (Port 8005)
- **Authentication**: Required (api_key and customer_uni_id)

### Request Parameters
```json
{
  "api_key": "string (required)",
  "customer_uni_id": "string (required)",
  "offset": "number (optional, default: 0)"
}
```

### Response Format
```json
{
  "status": 1,
  "offset": 10,
  "data": [
    {
      "id": "number",
      "order_id": "string",
      "customer_uni_id": "string",
      "astrologer_uni_id": "string",
      "question": "string",
      "answer": "string",
      "answer_status": "number (0: pending, 1: answered)",
      "status": "number",
      "payment_status": "number",
      "total_amount": "decimal",
      "created_at": "datetime",
      "updated_at": "datetime",
      "astro_name": "string",
      "astro_img": "string (URL)"
    }
  ],
  "msg": "Get successfully"
}
```

## Frontend Implementation

### 1. API Function (`react_theme/src/utils/api.js`)

Added new function `fetchAskQuestionsList`:

```javascript
/**
 * Fetch ask questions list for customer from backend
 * Endpoint: POST /api/askQuestionCustomerList (Welcome service - port 8005)
 */
export const fetchAskQuestionsList = async (offset = 0)
```

**Features:**
- Automatically gets user credentials from localStorage
- Handles authentication validation
- Returns formatted response with status and data
- Includes error handling and logging

### 2. Customer Dashboard Integration (`react_theme/src/pages/Customer_Dashboard.jsx`)

#### Added States
```javascript
const [askQuestions, setAskQuestions] = useState([])
const [loadingAskQuestions, setLoadingAskQuestions] = useState(false)
const [askQuestionsOffset, setAskQuestionsOffset] = useState(0)
const [hasMoreAskQuestions, setHasMoreAskQuestions] = useState(true)
```

#### Added Sidebar Item
```javascript
{ id: 'ask-questions', label: 'My Questions', icon: 'fa-question-circle' }
```

#### Added Fetch Function
- `fetchAskQuestions(offset, append)` - Fetches questions from backend
- Auto-called when "My Questions" tab is activated
- Supports pagination with load more functionality

#### Added Render Section
- `renderAskQuestionsSection()` - Displays questions in a table format
- Shows: Order ID, Astrologer, Question, Answer, Amount, Date, Status
- Displays answer status (Answered/Pending) with color badges
- Truncates long questions/answers with "..." indicator
- Includes "Load More" button for pagination

### 3. Standalone Page (`react_theme/src/pages/AskQuestions.jsx`)

Created a dedicated page for viewing questions with:
- Beautiful card-based layout
- Question and answer display with proper formatting
- Astrologer information
- Status badges (Answered/Pending)
- Load more functionality
- Authentication check (redirects to dashboard if not logged in)

**Route**: `/ask-questions`

### 4. Route Configuration (`react_theme/src/App.jsx`)

Added route:
```javascript
<Route path="/ask-questions" element={<AskQuestions />} />
```

## Features Implemented

### ✅ Data Fetching
- [x] Backend API integration
- [x] User authentication validation
- [x] Error handling and logging
- [x] Pagination support with offset

### ✅ Customer Dashboard
- [x] "My Questions" tab in sidebar
- [x] Table view with all question details
- [x] Answer status indicator
- [x] Load more functionality
- [x] Auto-fetch when tab is activated

### ✅ Standalone Page
- [x] Dedicated page at `/ask-questions`
- [x] Beautiful card-based UI
- [x] Question and answer formatting
- [x] Astrologer information display
- [x] Status badges
- [x] Pagination

### ✅ UI/UX Features
- [x] Loading states
- [x] Empty state messages
- [x] Color-coded status badges (Answered: Green, Pending: Yellow)
- [x] Responsive table/card layout
- [x] Long text truncation
- [x] Professional styling

## Usage

### For Users

#### Via Customer Dashboard
1. Login to your account
2. Navigate to Customer Dashboard (`/customer-dashboard`)
3. Click on "My Questions" tab in sidebar
4. View all your questions and answers
5. Click "Load More" to see older questions

#### Via Standalone Page
1. Login to your account
2. Navigate to `/ask-questions`
3. View questions in beautiful card layout
4. Click "Load More" to see more questions

### For Developers

#### Fetch Questions Programmatically
```javascript
import { fetchAskQuestionsList } from '../utils/api'

// Fetch first page
const result = await fetchAskQuestionsList(0)

// Fetch next page (offset = 10)
const nextPage = await fetchAskQuestionsList(10)

// Check result
if (result.status === 1) {
  console.log('Questions:', result.data)
  console.log('Next offset:', result.offset)
}
```

#### Data Structure
```javascript
{
  id: number,
  orderId: string,
  question: string,
  answer: string,
  answerStatus: number,  // 0 = Pending, 1 = Answered
  status: number,
  paymentStatus: number,
  amount: number,
  date: string,
  astrologerName: string,
  astrologerImg: string
}
```

## Backend Reference

### Database Model
**File**: `html/_models/askQustion.js`

**Table**: `ask_questions`

**Key Fields**:
- `id` - Primary key
- `customer_uni_id` - Customer identifier
- `astrologer_uni_id` - Astrologer identifier
- `order_id` - Order reference
- `question` - Question text
- `answer` - Answer text (nullable)
- `answer_status` - 0: Pending, 1: Answered
- `status` - Record status
- `payment_status` - Payment status
- `total_amount` - Question charge

### Controller
**File**: `html/welcome/welcomeController.js`

**Route**: `/api/askQuestionCustomerList`

**Method**: POST

**Validation**:
- Requires `api_key` (string, required)
- Requires `customer_uni_id` (string, required)
- Accepts `offset` (number, optional)

## Testing

### Test Scenarios

1. **Test Authentication**
   - Login required
   - Invalid credentials should show error

2. **Test Data Fetching**
   - First page loads (offset = 0)
   - Pagination works (load more)
   - Empty state when no questions

3. **Test UI Components**
   - Dashboard tab shows questions table
   - Standalone page shows cards
   - Status badges display correctly
   - Long text truncates properly

4. **Test Edge Cases**
   - No questions available
   - Pending answers
   - Long questions/answers
   - Network errors

## File Changes Summary

### New Files
1. `react_theme/src/pages/AskQuestions.jsx` - Standalone questions page
2. `ASK_QUESTIONS_INTEGRATION.md` - This documentation

### Modified Files
1. `react_theme/src/utils/api.js`
   - Added `fetchAskQuestionsList()` function

2. `react_theme/src/pages/Customer_Dashboard.jsx`
   - Added states for ask questions
   - Added sidebar item
   - Added fetch function
   - Added render section
   - Added useEffect for auto-fetch

3. `react_theme/src/App.jsx`
   - Added route for `/ask-questions`
   - Added import for AskQuestions component

## Notes

- All API calls include proper error handling
- User authentication is validated before API calls
- Console logging enabled for debugging
- Response format matches backend structure
- Pagination implemented with offset-based approach
- UI follows existing design patterns
- No linter errors introduced

## Future Enhancements

Possible improvements:
1. Add search/filter functionality
2. Add date range filter
3. Add export to PDF/Excel
4. Add reply/follow-up questions
5. Add rating/feedback system
6. Add notifications for new answers
7. Add question categories/tags

---

**Integration Status**: ✅ Complete
**Date**: December 13, 2025
**Files Modified**: 4
**New Files**: 2
**Linter Errors**: 0

