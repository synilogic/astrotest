# Appointment Orders Integration - Complete Guide

## Overview
Successfully integrated the `slot_bookings` table (appointment orders) data fetching and display in the frontend.

## Features Implemented ✅

### 1. Backend API Endpoint
- **Location**: `html/product/slotBookingRoutes.js`
- **Endpoint**: `POST /api/slotBookingList`
- **Port**: 8007 (Product Service)
- **Features**:
  - Fetch appointment bookings for customers
  - Filter by status (pending, in-progress, completed, cancel)
  - Pagination support
  - Includes astrologer details (name, image)
  - Secure authentication check

### 2. Frontend API Function
- **Location**: `react_theme/src/utils/api.js`
- **Function**: `fetchAppointmentOrders(offset, status)`
- **Features**:
  - User authentication validation
  - Error handling and logging
  - Pagination support
  - Status filtering capability

### 3. Standalone Appointments Page
- **Location**: `react_theme/src/pages/Appointments.jsx`
- **Route**: `/appointments`
- **Features**:
  - Beautiful card-based layout
  - Complete appointment details display
  - Astrologer information with image
  - Status badges with color coding
  - Date, time, duration display
  - Load more functionality
  - Status filter dropdown
  - Responsive design

### 4. Customer Dashboard Integration
- **Location**: `react_theme/src/pages/Customer_Dashboard.jsx`
- **Tab**: "My Appointments"
- **Features**:
  - Table format display
  - Complete appointment information
  - Status badges
  - Load more functionality
  - Integrated with existing dashboard tabs

## How to Use 📱

### For Users

#### Dashboard Access:
1. Login to your account
2. Go to Customer Dashboard (`/customer-dashboard`)
3. Click on "My Appointments" tab
4. View all your appointment bookings

#### Direct Page Access:
1. Login to your account
2. Navigate to `/appointments`
3. View appointments in card format
4. Use status filter to filter appointments
5. Click "Load More" to see more appointments

### For Developers

#### API Function Call:
```javascript
import { fetchAppointmentOrders } from '../utils/api'

// Fetch first page
const result = await fetchAppointmentOrders(0, '')

// Fetch next page (offset = 10)
const nextPage = await fetchAppointmentOrders(10, '')

// Filter by status
const pendingOnly = await fetchAppointmentOrders(0, 'pending')
```

#### Response Format:
```javascript
{
  status: 1,
  offset: 10,
  data: [
    {
      id: 1,
      order_id: "APT-123",
      astrologer_uni_id: "ASTRO001",
      astrologer_name: "Astrologer Name",
      astrologer_img: "http://localhost:8002/uploads/astrologer/image.jpg",
      slot_date: "2025-12-15",
      slot_start: "10:00 AM",
      slot_end: "11:00 AM",
      slot_duration: "60 minutes",
      charge: 500.00,
      serial_no: 1,
      status: "pending",  // pending, in-progress, completed, cancel
      created_at: "2025-12-13T10:30:00.000Z",
      updated_at: "2025-12-13T10:30:00.000Z"
    }
  ],
  msg: "Appointment bookings retrieved successfully"
}
```

## Backend API Details 🔗

### Endpoint
- **URL**: `POST /api/slotBookingList`
- **Port**: 8007 (Product Service)
- **Required Parameters**:
  - `api_key`: User's API key
  - `customer_uni_id` or `user_uni_id`: Customer ID
- **Optional Parameters**:
  - `offset`: Pagination offset (default: 0)
  - `status`: Filter by status (default: all)

### Status Values
- `pending`: Appointment is scheduled but not started
- `in-progress`: Appointment is currently ongoing
- `completed`: Appointment has been completed
- `cancel`: Appointment has been cancelled

## Database Table

### Table: `slot_bookings`
```sql
CREATE TABLE slot_bookings (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  astrologer_uni_id VARCHAR(255),
  customer_uni_id VARCHAR(255),
  order_id VARCHAR(255),
  slot_date VARCHAR(255),
  slot_start VARCHAR(255),
  slot_end VARCHAR(255),
  slot_duration VARCHAR(255),
  charge DECIMAL(16,2) DEFAULT 0.00,
  serial_no INT DEFAULT 0,
  status VARCHAR(255) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Files Modified/Created 📝

### Backend:
1. **html/product/slotBookingRoutes.js** (NEW)
   - Created API endpoint for slot bookings list

2. **html/product/index.js** (MODIFIED)
   - Added import and route for slot bookings

3. **html/_models/associateModels.js** (MODIFIED)
   - Added associations for SlotBooking model with User, Astrologer, and Customer

### Frontend:
1. **react_theme/src/utils/api.js** (MODIFIED)
   - Added `fetchAppointmentOrders()` function

2. **react_theme/src/pages/Appointments.jsx** (NEW)
   - Created standalone appointments page

3. **react_theme/src/pages/Customer_Dashboard.jsx** (MODIFIED)
   - Added appointments state management
   - Added `fetchAppointmentsData()` function
   - Added `renderAppointmentsSection()` function
   - Added "My Appointments" tab
   - Added useEffect for fetching appointments

4. **react_theme/src/App.jsx** (MODIFIED)
   - Added route for `/appointments`

## Testing Checklist ✓

1. ✅ Backend endpoint created and configured
2. ✅ Database model associations added
3. ✅ Frontend API function implemented
4. ✅ Standalone page created with routing
5. ✅ Customer Dashboard tab added
6. ✅ No linter errors
7. ✅ Error handling implemented
8. ✅ Loading states implemented
9. ✅ Pagination support added
10. ✅ Status filtering implemented

## Usage Examples

### Filter appointments by status:
```javascript
// Get only pending appointments
const pending = await fetchAppointmentOrders(0, 'pending')

// Get only completed appointments
const completed = await fetchAppointmentOrders(0, 'completed')
```

### Load more appointments:
```javascript
// In component
const [offset, setOffset] = useState(0)

const loadMore = async () => {
  const result = await fetchAppointmentOrders(offset, statusFilter)
  if (result.status === 1) {
    setAppointments(prev => [...prev, ...result.data])
    setOffset(result.offset)
  }
}
```

## Notes

- The backend service must be running on port 8007 (Product Service)
- User must be logged in to access appointment data
- Pagination limit is set to 10 records per page (configurable in backend constants)
- All dates and times are displayed in a user-friendly format
- Status badges use color coding for easy identification

## Support

If you encounter any issues:
1. Check if the Product service is running (port 8007)
2. Verify user is logged in with valid credentials
3. Check console logs for detailed error messages
4. Ensure database has the `slot_bookings` table

---

**Integration Completed**: December 13, 2025
**Status**: ✅ Production Ready

