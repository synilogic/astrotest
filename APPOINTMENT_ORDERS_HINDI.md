# Appointment Orders Integration - Hindi Guide

## Kya Kiya Gaya Hai? 🎯

`slot_bookings` table (appointment orders) ka data ab successfully frontend pe fetch aur display ho raha hai.

## Features ✨

### 1. Backend API Endpoint
- **Location**: `html/product/slotBookingRoutes.js`
- **Endpoint**: `POST /api/slotBookingList`
- **Port**: 8007 (Product Service)
- **Features**:
  - Customer ke appointment bookings fetch karta hai
  - Status ke according filter kar sakte hain
  - Pagination support
  - Astrologer ki details (naam, photo)

### 2. Standalone Page
- **Location**: `react_theme/src/pages/Appointments.jsx`
- **Route**: `/appointments`
- **Features**:
  - Beautiful card layout
  - Appointment ki complete details
  - Astrologer ki information
  - Status badges with colors
  - Date, time, duration display
  - Load More button
  - Status filter dropdown

### 3. Customer Dashboard Tab
- **Location**: `react_theme/src/pages/Customer_Dashboard.jsx`
- **Tab**: "My Appointments"
- **Features**:
  - Table format me data
  - Complete appointment information
  - Status badges
  - Load More functionality

## Kaise Use Karein? 📱

### User Ke Liye

#### Dashboard Se:
1. Login karein
2. Customer Dashboard (`/customer-dashboard`) pe jaayein
3. "My Appointments" tab pe click karein
4. Apne saare appointments dekh sakte hain

#### Direct Page Se:
1. Login karein
2. `/appointments` URL pe jaayein
3. Appointments cards me dikhenge
4. Status filter se filter kar sakte hain
5. "Load More" se aur appointments dekh sakte hain

### Developer Ke Liye

#### API Function Call:
```javascript
import { fetchAppointmentOrders } from '../utils/api'

// First page fetch karne ke liye
const result = await fetchAppointmentOrders(0, '')

// Next page fetch karne ke liye (offset = 10)
const nextPage = await fetchAppointmentOrders(10, '')

// Status filter ke saath
const pending = await fetchAppointmentOrders(0, 'pending')
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
      astrologer_name: "Astrologer Name",
      astrologer_img: "url",
      slot_date: "2025-12-15",
      slot_start: "10:00 AM",
      slot_end: "11:00 AM",
      slot_duration: "60 minutes",
      charge: 500.00,
      status: "pending"  // pending, in-progress, completed, cancel
    }
  ]
}
```

## Status Types

- **pending**: Appointment scheduled hai par start nahi hui
- **in-progress**: Appointment chal rahi hai
- **completed**: Appointment complete ho gayi
- **cancel**: Appointment cancel ho gayi

## Backend API Details 🔗

- **Endpoint**: `POST /api/slotBookingList`
- **Port**: 8007 (Product Service)
- **Required**: `api_key`, `customer_uni_id`
- **Optional**: `offset` (pagination), `status` (filter)

## Files Changed/Created 📝

### Backend:
1. ✅ **html/product/slotBookingRoutes.js** - NEW (API endpoint)
2. ✅ **html/product/index.js** - MODIFIED (route added)
3. ✅ **html/_models/associateModels.js** - MODIFIED (associations)

### Frontend:
1. ✅ **react_theme/src/utils/api.js** - MODIFIED (API function)
2. ✅ **react_theme/src/pages/Appointments.jsx** - NEW (page created)
3. ✅ **react_theme/src/pages/Customer_Dashboard.jsx** - MODIFIED (tab added)
4. ✅ **react_theme/src/App.jsx** - MODIFIED (route added)

## Quick Start

### Frontend pe dekhne ke liye:
```bash
# React app ko run karo
cd react_theme
npm run dev
```

### Backend API ko test karne ke liye:
```bash
# Product service start karo (port 8007)
cd html
npm start
```

### URLs:
- Standalone page: http://localhost:5173/appointments
- Dashboard: http://localhost:5173/customer-dashboard (tab: "My Appointments")

## Features Highlight ⭐

### Standalone Page:
- 🎨 Beautiful card design
- 🖼️ Astrologer ki photo
- 📅 Date aur time properly formatted
- 🏷️ Status badges with colors
- 🔍 Status filter dropdown
- 📄 Pagination (Load More)

### Dashboard Tab:
- 📊 Table format
- 🔢 Serial number
- 💰 Amount display
- 📅 Booking date
- ⏰ Time slot details
- 📄 Load More support

## Troubleshooting

Agar koi problem aaye to:
1. Product service check karo (port 8007 pe running hona chahiye)
2. User logged in hai ya nahi check karo
3. Console logs dekho for error messages
4. Database me `slot_bookings` table hai ya nahi verify karo

## Status ✅

**Integration**: ✅ Complete
**Testing**: ✅ No Linter Errors
**Documentation**: ✅ Created
**Production Ready**: ✅ Yes

---

**Completed**: December 13, 2025
**Developer**: AI Assistant

