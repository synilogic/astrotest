import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import { getCurrentUser, getCustomerDashboard, getWalletBalance, updateCustomerProfile, fetchUserKundaliRequests, getKundaliChart, getWalletTransactions, fetchUserCallHistory, getChatChannels, getRechargeVouchers, proceedPaymentRequest, updateOnlinePayment, fetchWelcomeData, getUserAddresses, addUserAddress, updateUserAddress, deleteUserAddress, fetchPublicCountryList, fetchPublicStateList, fetchPublicCityList, fetchProductOrders, getCustomerServiceOrders, fetchAskQuestionsList, getAdminChatChannels, getAdminChatChannelHistory, getAppointmentDurations, fetchAppointmentOrders, fetchArchitectRooms, fetchArchitectServiceOrders, fetchUserGiftHistory, getUserApiKey, getFileOnCall, fetchCourses, fetchMyCourses, getCustomerRefunds, getCoverImages, getGroupPujaOrders, fetchIntakes, fetchModuleAccesses, fetchOffers, fetchOfflineServiceCategories, fetchOfflineServiceAssigns, fetchOfflineServiceGalleries, fetchOfflineServiceOrders, fetchOpenAiPredictions, fetchOpenAiProfiles, fetchOrders, fetchOurServices, fetchPackages } from '../utils/api'

// Helper function to convert date to YYYY-MM-DD format (for HTML5 date input)
const formatDateForInput = (dateStr) => {
  if (!dateStr) return ''
  
  // If already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr
  }
  
  // Try to parse DD/MM/YYYY or DD-MM-YYYY format
  const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }
  
  // Try to parse YYYY/MM/DD or YYYY-MM-DD format
  const yyyymmddMatch = dateStr.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/)
  if (yyyymmddMatch) {
    const [, year, month, day] = yyyymmddMatch
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }
  
  // Try to parse as Date object
  try {
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  } catch (e) {
    // Ignore
  }
  
  return ''
}

// Helper function to convert time to HH:mm format (for HTML5 time input)
const formatTimeForInput = (timeStr) => {
  if (!timeStr) return ''
  
  // If already in HH:mm or HH:mm:ss format (24-hour), return HH:mm
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(timeStr)) {
    const parts = timeStr.split(':')
    return `${parts[0].padStart(2, '0')}:${parts[1]}`
  }
  
  // Try to parse 12-hour format with AM/PM (e.g., "10:50 AM", "2:30 PM")
  const ampmMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (ampmMatch) {
    let [, hours, minutes, ampm] = ampmMatch
    hours = parseInt(hours, 10)
    minutes = minutes.padStart(2, '0')
    
    if (ampm.toUpperCase() === 'PM' && hours !== 12) {
      hours += 12
    } else if (ampm.toUpperCase() === 'AM' && hours === 12) {
      hours = 0
    }
    
    return `${String(hours).padStart(2, '0')}:${minutes}`
  }
  
  return ''
}

const My_Account = () => {
  const location = useLocation()
  const navigate = useNavigate()
  // Get activeTab from navigation state, default to 'profile'
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'profile')
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(null) // null = checking, true = authenticated, false = not authenticated
  const [userData, setUserData] = useState(null)
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    email: '',
    gender: '',
    birthDate: '',
    birthTime: '',
    placeOfBirth: ''
  })
  const [selectedProfileImage, setSelectedProfileImage] = useState(null)
  const [profileImagePreview, setProfileImagePreview] = useState(null)
  const [imageRefreshKey, setImageRefreshKey] = useState(0) // Force image refresh
  const fileInputRef = useRef(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [rechargeAmount, setRechargeAmount] = useState('')
  const [rechargeVouchers, setRechargeVouchers] = useState([])
  const [loadingRecharge, setLoadingRecharge] = useState(false)
  const [selectedPaymentGateway, setSelectedPaymentGateway] = useState('razorpay')
  const [availablePaymentGateways, setAvailablePaymentGateways] = useState([])
  const [loadingPaymentGateways, setLoadingPaymentGateways] = useState(false)

  // Pagination state per table
  const [walletPage, setWalletPage] = useState(1)
  const [walletPageSize, setWalletPageSize] = useState(10)
  const [ordersPage, setOrdersPage] = useState(1)
  const [ordersPageSize, setOrdersPageSize] = useState(10)
  const [ordersSearch, setOrdersSearch] = useState('')
  const [ordersFromDate, setOrdersFromDate] = useState('')
  const [ordersToDate, setOrdersToDate] = useState('')
  const [serviceOrdersPage, setServiceOrdersPage] = useState(1)
  const [serviceOrdersPageSize, setServiceOrdersPageSize] = useState(10)
  const [kundlisPage, setKundlisPage] = useState(1)
  const [kundlisPageSize, setKundlisPageSize] = useState(10)
  const [chatPage, setChatPage] = useState(1)
  const [chatPageSize, setChatPageSize] = useState(10)
  const [waitingPage, setWaitingPage] = useState(1)
  const [waitingPageSize, setWaitingPageSize] = useState(10)
  const [callPage, setCallPage] = useState(1)
  const [callPageSize, setCallPageSize] = useState(10)
  const [callSearch, setCallSearch] = useState('')
  const [supportPage, setSupportPage] = useState(1)
  const [supportPageSize, setSupportPageSize] = useState(10)

  const getPaginatedItems = (items, page, size) => {
    const start = (page - 1) * size
    return items.slice(start, start + size)
  }

  // State for wallet transactions (fetched from backend)
  const [walletTransactions, setWalletTransactions] = useState([])
  const [loadingWalletTransactions, setLoadingWalletTransactions] = useState(false)
  
  // State for gift history (fetched from backend)
  const [giftHistory, setGiftHistory] = useState([])
  const [loadingGiftHistory, setLoadingGiftHistory] = useState(false)
  const [giftPage, setGiftPage] = useState(1)
  const giftPageSize = 10
  
  // State for courses
  const [courses, setCourses] = useState([])
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [coursesPage, setCoursesPage] = useState(1)
  const coursesPageSize = 10
  
  // State for purchased courses (course orders)
  const [purchasedCourses, setPurchasedCourses] = useState([])
  const [loadingPurchasedCourses, setLoadingPurchasedCourses] = useState(false)
  const [purchasedCoursesPage, setPurchasedCoursesPage] = useState(1)
  const purchasedCoursesPageSize = 10
  const [coursesViewMode, setCoursesViewMode] = useState('purchased') // 'purchased' or 'all'
  
  // State for refunds
  const [refunds, setRefunds] = useState([])
  const [loadingRefunds, setLoadingRefunds] = useState(false)
  const [refundsPage, setRefundsPage] = useState(1)
  const refundsPageSize = 10
  const [refundsTotal, setRefundsTotal] = useState(0)

  // Offers state
  const [offers, setOffers] = useState([])
  const [loadingOffers, setLoadingOffers] = useState(false)
  const [offersPage, setOffersPage] = useState(1)
  const offersPageSize = 10

  // Offline Services state
  const [offlineServices, setOfflineServices] = useState([])
  const [loadingOfflineServices, setLoadingOfflineServices] = useState(false)
  const [offlineServicesPage, setOfflineServicesPage] = useState(1)
  const offlineServicesPageSize = 10

  // Offline Service Assigns state
  const [offlineServiceAssigns, setOfflineServiceAssigns] = useState([])
  const [loadingOfflineServiceAssigns, setLoadingOfflineServiceAssigns] = useState(false)
  const [offlineServiceAssignsPage, setOfflineServiceAssignsPage] = useState(1)
  const offlineServiceAssignsPageSize = 10

  // Offline Service Galleries state
  const [serviceGalleries, setServiceGalleries] = useState([])
  const [loadingServiceGalleries, setLoadingServiceGalleries] = useState(false)
  const [serviceGalleriesPage, setServiceGalleriesPage] = useState(1)
  const serviceGalleriesPageSize = 12

  // Offline Service Orders state
  const [offlineOrders, setOfflineOrders] = useState([])
  const [loadingOfflineOrders, setLoadingOfflineOrders] = useState(false)
  const [offlineOrdersPage, setOfflineOrdersPage] = useState(1)
  const offlineOrdersPageSize = 10

  // OpenAI Predictions state
  const [aiPredictions, setAiPredictions] = useState([])
  const [loadingAiPredictions, setLoadingAiPredictions] = useState(false)
  const [aiPredictionsPage, setAiPredictionsPage] = useState(1)
  const aiPredictionsPageSize = 10
  const [selectedPrediction, setSelectedPrediction] = useState(null)

  // OpenAI Profiles state
  const [aiProfiles, setAiProfiles] = useState([])
  const [loadingAiProfiles, setLoadingAiProfiles] = useState(false)
  const [aiProfilesPage, setAiProfilesPage] = useState(1)
  const aiProfilesPageSize = 10

  // Our Services state
  const [ourServices, setOurServices] = useState([])
  const [loadingOurServices, setLoadingOurServices] = useState(false)
  const [ourServicesPage, setOurServicesPage] = useState(1)
  const ourServicesPageSize = 10

  // Packages state
  const [packages, setPackages] = useState([])
  const [loadingPackages, setLoadingPackages] = useState(false)
  const [packagesPage, setPackagesPage] = useState(1)
  const packagesPageSize = 10
  
  // State for cover images
  const [coverImages, setCoverImages] = useState([])
  const [loadingCoverImages, setLoadingCoverImages] = useState(false)
  const [selectedCoverImage, setSelectedCoverImage] = useState('')
  const [showCoverSelector, setShowCoverSelector] = useState(false)
  
  // State for orders (fetched from backend)
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [ordersOffset, setOrdersOffset] = useState(0)
  const [hasMoreOrders, setHasMoreOrders] = useState(true)
  
  // State for service orders (fetched from backend)
  const [serviceOrders, setServiceOrders] = useState([])
  const [loadingServiceOrders, setLoadingServiceOrders] = useState(false)
  const [serviceOrdersOffset, setServiceOrdersOffset] = useState(0)
  const [hasMoreServiceOrders, setHasMoreServiceOrders] = useState(true)
  const isFetchingServiceOrders = useRef(false)
  
  // State for ask questions (fetched from backend)
  const [askQuestions, setAskQuestions] = useState([])
  const [loadingAskQuestions, setLoadingAskQuestions] = useState(false)
  const [askQuestionsOffset, setAskQuestionsOffset] = useState(0)
  const [hasMoreAskQuestions, setHasMoreAskQuestions] = useState(true)

  // State for appointments (fetched from backend)
  const [appointments, setAppointments] = useState([])
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  const [appointmentsOffset, setAppointmentsOffset] = useState(0)
  const [hasMoreAppointments, setHasMoreAppointments] = useState(true)

  // State for architect rooms (fetched from backend)
  const [architectRooms, setArchitectRooms] = useState([])
  const [loadingArchitectRooms, setLoadingArchitectRooms] = useState(false)
  const [architectRoomsOffset, setArchitectRoomsOffset] = useState(0)
  const [hasMoreArchitectRooms, setHasMoreArchitectRooms] = useState(true)

  // State for architect service orders (fetched from backend)
  const [architectServiceOrders, setArchitectServiceOrders] = useState([])
  const [loadingArchitectServiceOrders, setLoadingArchitectServiceOrders] = useState(false)
  const [architectServiceOrdersOffset, setArchitectServiceOrdersOffset] = useState(0)
  const [hasMoreArchitectServiceOrders, setHasMoreArchitectServiceOrders] = useState(true)

  // State for puja bookings (fetched from backend)
  const [pujaBookings, setPujaBookings] = useState([])
  const [loadingPujaBookings, setLoadingPujaBookings] = useState(false)
  const [pujaBookingsPage, setPujaBookingsPage] = useState(1)
  const pujaBookingsPageSize = 10
  const [pujaBookingsTotal, setPujaBookingsTotal] = useState(0)
  const [selectedPujaBooking, setSelectedPujaBooking] = useState(null)
  const [showPujaBookingDetails, setShowPujaBookingDetails] = useState(false)

  // State for intakes (fetched from backend)
  const [intakes, setIntakes] = useState([])
  const [loadingIntakes, setLoadingIntakes] = useState(false)
  const [intakesOffset, setIntakesOffset] = useState(0)
  const [hasMoreIntakes, setHasMoreIntakes] = useState(true)
  const [selectedIntake, setSelectedIntake] = useState(null)
  const [showIntakeDetails, setShowIntakeDetails] = useState(false)

  // State for module accesses (fetched from backend)
  const [moduleAccesses, setModuleAccesses] = useState([])
  const [loadingModuleAccesses, setLoadingModuleAccesses] = useState(false)
  const [moduleAccessesOffset, setModuleAccessesOffset] = useState(0)
  const [hasMoreModuleAccesses, setHasMoreModuleAccesses] = useState(true)

  // Use ref to prevent multiple simultaneous calls
  const isFetchingOrders = useRef(false)

  // Fetch orders from backend
  const fetchOrders = async (offset = 0, append = false) => {
    // Prevent multiple simultaneous calls
    if (isFetchingOrders.current) {
      console.log('[Customer Dashboard] ⚠️ fetchOrders already in progress, skipping...')
      return
    }
    
    console.log('[Customer Dashboard] ===== fetchOrders called =====')
    console.log('[Customer Dashboard] Offset:', offset, 'Append:', append)
    
    const user = getCurrentUser()
    if (!user) {
      console.error('[Customer Dashboard] ❌ User not logged in')
      setOrders([])
      setLoadingOrders(false)
      return
    }
    
    console.log('[Customer Dashboard] User credentials:', {
      hasApiKey: !!(user.api_key || user.user_api_key),
      hasUserId: !!(user.user_uni_id || user.customer_uni_id),
      userId: user.user_uni_id || user.customer_uni_id
    })
    
    isFetchingOrders.current = true
    setLoadingOrders(true)
    try {
      const result = await fetchProductOrders(offset)
      console.log('[Customer Dashboard] ===== Orders API Response =====')
      console.log('[Customer Dashboard] Full response:', JSON.stringify(result, null, 2))
      console.log('[Customer Dashboard] Status:', result.status)
      console.log('[Customer Dashboard] Data type:', typeof result.data)
      console.log('[Customer Dashboard] Data is array:', Array.isArray(result.data))
      console.log('[Customer Dashboard] Data length:', result.data?.length || 0)
      console.log('[Customer Dashboard] Message:', result.msg)
      
      if (result.status === 1 && Array.isArray(result.data) && result.data.length > 0) {
        console.log('[Customer Dashboard] ✅ Processing', result.data.length, 'orders from backend')
        
        const formattedOrders = result.data.map((order, index) => {
          const orderProduct = order.order_products?.[0] || {}
          const product = orderProduct.product || {}
          
          console.log(`[Customer Dashboard] Order ${index + 1} details:`, {
            orderId: order.order_id,
            orderIdAlt: order.orderId,
            productName: product.product_name || product.name,
            totalAmount: order.total_amount || order.total,
            status: order.order_status || order.status || order.payment_status,
            hasProduct: !!product,
            hasOrderProduct: !!orderProduct
          })
          
          return {
            id: order.id,
            orderId: order.order_id || order.orderId || `ORD-${order.id}`,
            productName: product.product_name || product.name || 'N/A',
            productImage: product.product_image || '',
            orderedDate: order.created_at || order.order_date || '',
            totalAmount: parseFloat(order.total_amount || order.total || 0),
            status: order.order_status || order.status || order.payment_status || 'pending',
            quantity: orderProduct.quantity || 1,
            price: parseFloat(orderProduct.price || 0),
            invoiceUrl: order.invoice_url || order.invoiceUrl || ''
          }
        })
        
        console.log('[Customer Dashboard] ✅ Formatted orders:', formattedOrders.length)
        console.log('[Customer Dashboard] First formatted order:', formattedOrders[0])
        
        if (append) {
          setOrders(prev => {
            const updated = [...prev, ...formattedOrders]
            console.log('[Customer Dashboard] Appended orders. Total:', updated.length)
            return updated
          })
        } else {
          console.log('[Customer Dashboard] Setting orders state with', formattedOrders.length, 'orders')
          setOrders(formattedOrders)
          console.log('[Customer Dashboard] ✅ Orders state updated. Total:', formattedOrders.length)
          if (formattedOrders.length > 0) {
            console.log('[Customer Dashboard] First order sample:', formattedOrders[0])
          }
        }
        
        setOrdersOffset(result.offset || offset + formattedOrders.length)
        setHasMoreOrders(formattedOrders.length >= 10) // Assuming limit is 10
        console.log('[Customer Dashboard] ✅ Orders loaded successfully:', formattedOrders.length, 'orders')
      } else {
        console.warn('[Customer Dashboard] ⚠️ No orders found or invalid response:', {
          status: result.status,
          dataType: typeof result.data,
          isArray: Array.isArray(result.data),
          dataLength: result.data?.length || 0,
          msg: result.msg,
          errorCode: result.error_code
        })
        if (!append) {
          setOrders([])
          console.log('[Customer Dashboard] Orders array cleared')
        }
        setHasMoreOrders(false)
      }
    } catch (error) {
      console.error('[Customer Dashboard] ❌ Error fetching orders:', error)
      console.error('[Customer Dashboard] Error stack:', error.stack)
      if (!append) {
        setOrders([])
      }
    } finally {
      setLoadingOrders(false)
      isFetchingOrders.current = false
      console.log('[Customer Dashboard] ===== fetchOrders completed =====')
    }
  }

  // Fetch service orders from backend
  const fetchServiceOrders = async (offset = 0, append = false) => {
    // Prevent multiple simultaneous calls
    if (isFetchingServiceOrders.current) {
      console.log('[Customer Dashboard] ⚠️ fetchServiceOrders already in progress, skipping...')
      return
    }
    
    console.log('[Customer Dashboard] ===== fetchServiceOrders called =====')
    console.log('[Customer Dashboard] Offset:', offset, 'Append:', append)
    
    const user = getCurrentUser()
    if (!user) {
      console.error('[Customer Dashboard] ❌ User not logged in')
      setServiceOrders([])
      setLoadingServiceOrders(false)
      return
    }
    
    const userId = user.user_uni_id || user.customer_uni_id
    if (!userId) {
      console.error('[Customer Dashboard] ❌ User missing user_uni_id')
      console.error('[Customer Dashboard] User object:', { 
        hasUserUniId: !!user.user_uni_id, 
        hasCustomerUniId: !!user.customer_uni_id,
        userKeys: Object.keys(user)
      })
      setServiceOrders([])
      setLoadingServiceOrders(false)
      return
    }
    
    isFetchingServiceOrders.current = true
    setLoadingServiceOrders(true)
    try {
      const result = await getCustomerServiceOrders(userId, offset, 15)
      console.log('[Customer Dashboard] ===== Service Orders API Response =====')
      console.log('[Customer Dashboard] Full response:', JSON.stringify(result, null, 2))
      console.log('[Customer Dashboard] Status:', result.status)
      console.log('[Customer Dashboard] Data length:', result.data?.length || 0)
      
      // Check if we have data (even if status is 0, sometimes data might still be returned)
      if (Array.isArray(result.data)) {
        console.log('[Customer Dashboard] ✅ Data array found, length:', result.data.length)
        console.log('[Customer Dashboard] Response status:', result.status)
        
        if (result.data.length > 0) {
          console.log('[Customer Dashboard] ✅ Processing', result.data.length, 'service orders from backend')
          
          const formattedOrders = result.data.map((order, index) => {
          const serviceAssign = order.service_assign || {}
          const service = serviceAssign.service || {}
          
          console.log(`[Customer Dashboard] Service Order ${index + 1}:`, {
            orderId: order.order_id,
            price: order.price,
            status: order.status,
            date: order.date || order.created_at,
            serviceName: service.service_name
          })
          
          // Format date properly
          let orderDate = order.date || order.created_at || ''
          if (orderDate && typeof orderDate === 'string') {
            // If date is in format "YYYY-MM-DD HH:mm:ss", extract just the date part
            orderDate = orderDate.split(' ')[0] || orderDate
          }
          
          return {
            id: order.id,
            orderId: order.order_id || `SVC-${order.id}`,
            referenceId: order.service_assign_id || order.id,
            amount: parseFloat(order.price || 0),
            date: orderDate,
            status: order.status || order.payment_status || 'pending',
            serviceName: service.service_name || 'N/A',
            astrologerName: order.astrologer?.display_name || order.user_astrologer?.name || 'N/A'
          }
          })
          
          console.log('[Customer Dashboard] ✅ Formatted service orders:', formattedOrders.length)
          console.log('[Customer Dashboard] First formatted order sample:', formattedOrders[0])
          
          if (append) {
            setServiceOrders(prev => {
              const updated = [...prev, ...formattedOrders]
              console.log('[Customer Dashboard] Appended orders. Total:', updated.length)
              return updated
            })
          } else {
            console.log('[Customer Dashboard] Setting service orders state with', formattedOrders.length, 'orders')
            setServiceOrders(formattedOrders)
            console.log('[Customer Dashboard] ✅ Service orders state updated. Total:', formattedOrders.length)
          }
          
          setServiceOrdersOffset(result.offset || offset + formattedOrders.length)
          setHasMoreServiceOrders(formattedOrders.length >= 15)
          console.log('[Customer Dashboard] ✅ Service orders loaded successfully:', formattedOrders.length, 'orders')
        } else {
          console.warn('[Customer Dashboard] ⚠️ Empty data array received:', {
            status: result.status,
            dataLength: result.data.length,
            msg: result.msg
          })
          if (!append) {
            setServiceOrders([])
            console.log('[Customer Dashboard] Service orders array cleared (empty data)')
          }
          setHasMoreServiceOrders(false)
        }
      } else {
        console.warn('[Customer Dashboard] ⚠️ Invalid response format:', {
          status: result.status,
          hasData: !!result.data,
          dataType: typeof result.data,
          isArray: Array.isArray(result.data),
          msg: result.msg,
          fullResult: result
        })
        if (!append) {
          setServiceOrders([])
          console.log('[Customer Dashboard] Service orders array cleared (invalid format)')
        }
        setHasMoreServiceOrders(false)
      }
    } catch (error) {
      console.error('[Customer Dashboard] ❌ Error fetching service orders:', error)
      console.error('[Customer Dashboard] Error stack:', error.stack)
      if (!append) {
        setServiceOrders([])
      }
    } finally {
      setLoadingServiceOrders(false)
      isFetchingServiceOrders.current = false
      console.log('[Customer Dashboard] ===== fetchServiceOrders completed =====')
    }
  }

  const [kundlis, setKundlis] = useState([])
  const [loadingKundlis, setLoadingKundlis] = useState(false)
  const [viewKundaliModal, setViewKundaliModal] = useState(false)
  const [selectedKundali, setSelectedKundali] = useState(null)
  const [kundaliChart, setKundaliChart] = useState(null)
  const [loadingChart, setLoadingChart] = useState(false)
  // State for chat history (fetched from backend)
  const [chats, setChats] = useState([])
  const [loadingChats, setLoadingChats] = useState(false)
  const waitingList = []
  const [calls, setCalls] = useState([])
  const [loadingCalls, setLoadingCalls] = useState(false)
  const [selectedCall, setSelectedCall] = useState(null)
  const [callImages, setCallImages] = useState([])
  const [loadingCallImages, setLoadingCallImages] = useState(false)
  const [showCallDetailModal, setShowCallDetailModal] = useState(false)
  const [adminChatChannels, setAdminChatChannels] = useState([])
  const [loadingAdminChats, setLoadingAdminChats] = useState(false)
  const [adminChatOffset, setAdminChatOffset] = useState(0)
  const [hasMoreAdminChats, setHasMoreAdminChats] = useState(true)
  const [adminChatHistory, setAdminChatHistory] = useState([])
  const [loadingAdminChatHistory, setLoadingAdminChatHistory] = useState(false)
  const [adminChatHistoryOffset, setAdminChatHistoryOffset] = useState(0)
  const [hasMoreAdminChatHistory, setHasMoreAdminChatHistory] = useState(true)
  const [selectedChannel, setSelectedChannel] = useState('')
  const [appointmentDurations, setAppointmentDurations] = useState([])
  const [loadingAppointmentDurations, setLoadingAppointmentDurations] = useState(false)
  const [appointmentDurationsOffset, setAppointmentDurationsOffset] = useState(0)
  const [hasMoreAppointmentDurations, setHasMoreAppointmentDurations] = useState(true)
  const tickets = []

  // Fetch ask questions from backend
  const fetchAskQuestions = async (offset = 0, append = false) => {
    const user = getCurrentUser()
    if (!user) {
      console.error('[Customer Dashboard] ❌ User not logged in')
      setAskQuestions([])
      setLoadingAskQuestions(false)
      return
    }
    
    const userId = user.user_uni_id || user.customer_uni_id
    if (!userId) {
      console.error('[Customer Dashboard] ❌ User missing user_uni_id')
      setAskQuestions([])
      setLoadingAskQuestions(false)
      return
    }
    
    setLoadingAskQuestions(true)
    try {
      const result = await fetchAskQuestionsList(offset)
      console.log('[Customer Dashboard] ===== Ask Questions API Response =====')
      console.log('[Customer Dashboard] Status:', result.status)
      console.log('[Customer Dashboard] Data length:', result.data?.length || 0)
      
      if (Array.isArray(result.data)) {
        console.log('[Customer Dashboard] ✅ Data array found, length:', result.data.length)
        
        if (result.data.length > 0) {
          console.log('[Customer Dashboard] ✅ Processing', result.data.length, 'ask questions from backend')
          
          const formattedQuestions = result.data.map((item, index) => {
            console.log(`[Customer Dashboard] Question ${index + 1}:`, {
              orderId: item.order_id,
              question: item.question?.substring(0, 50),
              answer: item.answer?.substring(0, 50),
              answerStatus: item.answer_status,
              status: item.status,
              date: item.created_at
            })
            
            // Format date properly
            let questionDate = item.created_at || ''
            if (questionDate && typeof questionDate === 'string') {
              questionDate = questionDate.split(' ')[0] || questionDate
            }
            
            return {
              id: item.id,
              orderId: item.order_id || `ASK-${item.id}`,
              question: item.question || 'N/A',
              answer: item.answer || 'Pending',
              answerStatus: item.answer_status || 0,
              status: item.status || 1,
              paymentStatus: item.payment_status || 0,
              amount: parseFloat(item.total_amount || 0),
              date: questionDate,
              astrologerName: item.astro_name || 'N/A',
              astrologerImg: item.astro_img || null
            }
          })
          
          console.log('[Customer Dashboard] ✅ Formatted ask questions:', formattedQuestions.length)
          
          if (append) {
            setAskQuestions(prev => [...prev, ...formattedQuestions])
          } else {
            setAskQuestions(formattedQuestions)
          }
          
          setAskQuestionsOffset(result.offset || (offset + formattedQuestions.length))
          setHasMoreAskQuestions(formattedQuestions.length >= 10)
        } else {
          console.log('[Customer Dashboard] ⚠️ Empty data array')
          if (!append) {
            setAskQuestions([])
          }
          setHasMoreAskQuestions(false)
        }
      } else {
        console.warn('[Customer Dashboard] ❌ Invalid response format:', result)
        if (!append) {
          setAskQuestions([])
        }
        setHasMoreAskQuestions(false)
      }
    } catch (err) {
      console.error('[Customer Dashboard] Error fetching ask questions:', err)
      if (!append) {
        setAskQuestions([])
      }
      setHasMoreAskQuestions(false)
    } finally {
      setLoadingAskQuestions(false)
    }
  }

  // Fetch appointments from backend
  const fetchAppointmentsData = async (offset = 0, append = false) => {
    const user = getCurrentUser()
    if (!user) {
      console.error('[Customer Dashboard] ❌ User not logged in')
      setAppointments([])
      setLoadingAppointments(false)
      return
    }
    
    setLoadingAppointments(true)
    try {
      const result = await fetchAppointmentOrders(offset, '')
      console.log('[Customer Dashboard] ===== Appointments API Response =====')
      console.log('[Customer Dashboard] Status:', result.status)
      console.log('[Customer Dashboard] Data length:', result.data?.length || 0)
      
      if (result.status === 1 && Array.isArray(result.data)) {
        if (append) {
          setAppointments(prev => [...prev, ...result.data])
        } else {
          setAppointments(result.data)
        }
        setAppointmentsOffset(result.offset || offset + 10)
        setHasMoreAppointments(result.data.length >= 10)
      } else {
        if (!append) {
          setAppointments([])
        }
        setHasMoreAppointments(false)
      }
    } catch (err) {
      console.error('[Customer Dashboard] Error fetching appointments:', err)
      if (!append) {
        setAppointments([])
      }
      setHasMoreAppointments(false)
    } finally {
      setLoadingAppointments(false)
    }
  }

  // Fetch architect rooms from backend
  const fetchArchitectRoomsData = async (offset = 0, append = false) => {
    const user = getCurrentUser()
    if (!user) {
      console.error('[Customer Dashboard] ❌ User not logged in')
      setArchitectRooms([])
      setLoadingArchitectRooms(false)
      return
    }
    
    setLoadingArchitectRooms(true)
    try {
      const result = await fetchArchitectRooms(offset, '', null)
      console.log('[Customer Dashboard] ===== Architect Rooms API Response =====')
      console.log('[Customer Dashboard] Status:', result.status)
      console.log('[Customer Dashboard] Data length:', result.data?.length || 0)
      
      if (result.status === 1 && Array.isArray(result.data)) {
        if (append) {
          setArchitectRooms(prev => [...prev, ...result.data])
        } else {
          setArchitectRooms(result.data)
        }
        setArchitectRoomsOffset(result.offset || offset + 10)
        setHasMoreArchitectRooms(result.data.length >= 10)
      } else {
        if (!append) {
          setArchitectRooms([])
        }
        setHasMoreArchitectRooms(false)
      }
    } catch (err) {
      console.error('[Customer Dashboard] Error fetching architect rooms:', err)
      if (!append) {
        setArchitectRooms([])
      }
      setHasMoreArchitectRooms(false)
    } finally {
      setLoadingArchitectRooms(false)
    }
  }

  // Fetch architect service orders from backend
  const fetchArchitectServiceOrdersData = async (offset = 0, append = false) => {
    const user = getCurrentUser()
    if (!user) {
      console.error('[Customer Dashboard] ❌ User not logged in')
      setArchitectServiceOrders([])
      setLoadingArchitectServiceOrders(false)
      return
    }
    
    setLoadingArchitectServiceOrders(true)
    try {
      const result = await fetchArchitectServiceOrders(offset, '', '', '')
      console.log('[Customer Dashboard] ===== Architect Service Orders API Response =====')
      console.log('[Customer Dashboard] Status:', result.status)
      console.log('[Customer Dashboard] Data length:', result.data?.length || 0)
      
      if (result.status === 1 && Array.isArray(result.data)) {
        if (append) {
          setArchitectServiceOrders(prev => [...prev, ...result.data])
        } else {
          setArchitectServiceOrders(result.data)
        }
        setArchitectServiceOrdersOffset(result.offset || offset + 10)
        setHasMoreArchitectServiceOrders(result.data.length >= 10)
      } else {
        if (!append) {
          setArchitectServiceOrders([])
        }
        setHasMoreArchitectServiceOrders(false)
      }
    } catch (err) {
      console.error('[Customer Dashboard] Error fetching architect service orders:', err)
      if (!append) {
        setArchitectServiceOrders([])
      }
      setHasMoreArchitectServiceOrders(false)
    } finally {
      setLoadingArchitectServiceOrders(false)
    }
  }

  // Fetch puja bookings from backend
  const fetchPujaBookingsData = async (page = 1) => {
    const user = getCurrentUser()
    if (!user) {
      console.error('[Customer Dashboard] ❌ User not logged in')
      setPujaBookings([])
      setLoadingPujaBookings(false)
      return
    }
    
    setLoadingPujaBookings(true)
    try {
      const result = await getGroupPujaOrders({ page, limit: pujaBookingsPageSize })
      console.log('[Customer Dashboard] ===== Puja Bookings API Response =====')
      console.log('[Customer Dashboard] Status:', result.status)
      console.log('[Customer Dashboard] Data length:', result.data?.length || 0)
      console.log('[Customer Dashboard] Total:', result.total)
      
      if (result.status === 1 && Array.isArray(result.data)) {
        setPujaBookings(result.data)
        setPujaBookingsTotal(result.total || result.data.length)
        setPujaBookingsPage(page)
      } else {
        setPujaBookings([])
        setPujaBookingsTotal(0)
      }
    } catch (err) {
      console.error('[Customer Dashboard] Error fetching puja bookings:', err)
      setPujaBookings([])
      setPujaBookingsTotal(0)
    } finally {
      setLoadingPujaBookings(false)
    }
  }

  // Fetch intakes from backend
  const fetchIntakesData = async (offset = 0, append = false) => {
    const user = getCurrentUser()
    if (!user) {
      console.error('[Customer Dashboard] ❌ User not logged in')
      setIntakes([])
      setLoadingIntakes(false)
      return
    }
    
    setLoadingIntakes(true)
    try {
      const result = await fetchIntakes(offset, 20)
      console.log('[Customer Dashboard] ===== Intakes API Response =====')
      console.log('[Customer Dashboard] Status:', result.status)
      console.log('[Customer Dashboard] Data length:', result.data?.length || 0)
      console.log('[Customer Dashboard] Total:', result.total)
      
      if (result.status === 1 && Array.isArray(result.data)) {
        if (append) {
          setIntakes(prev => [...prev, ...result.data])
        } else {
          setIntakes(result.data)
        }
        setIntakesOffset(result.offset || offset + result.data.length)
        setHasMoreIntakes(result.data.length >= 20)
      } else {
        if (!append) {
          setIntakes([])
        }
        setHasMoreIntakes(false)
      }
    } catch (err) {
      console.error('[Customer Dashboard] Error fetching intakes:', err)
      if (!append) {
        setIntakes([])
      }
      setHasMoreIntakes(false)
    } finally {
      setLoadingIntakes(false)
    }
  }

  // Fetch module accesses from backend
  const fetchModuleAccessesData = async (offset = 0, append = false) => {
    setLoadingModuleAccesses(true)
    try {
      const result = await fetchModuleAccesses(offset)
      console.log('[Customer Dashboard] ===== Module Accesses API Response =====')
      console.log('[Customer Dashboard] Status:', result.status)
      console.log('[Customer Dashboard] Data length:', result.data?.length || 0)
      
      if (result.status === 1 && Array.isArray(result.data)) {
        if (append) {
          setModuleAccesses(prev => [...prev, ...result.data])
        } else {
          setModuleAccesses(result.data)
        }
        setModuleAccessesOffset(result.offset || offset + result.data.length)
        setHasMoreModuleAccesses(result.data.length >= 20)
      } else {
        if (!append) {
          setModuleAccesses([])
        }
        setHasMoreModuleAccesses(false)
      }
    } catch (err) {
      console.error('[Customer Dashboard] Error fetching module accesses:', err)
      if (!append) {
        setModuleAccesses([])
      }
      setHasMoreModuleAccesses(false)
    } finally {
      setLoadingModuleAccesses(false)
    }
  }

  // Fetch admin chat channels from backend
  const fetchAdminChatChannels = async (offset = 0, append = false) => {
    const user = getCurrentUser()
    if (!user) {
      console.error('[Customer Dashboard] ❌ User not logged in')
      setAdminChatChannels([])
      setLoadingAdminChats(false)
      return
    }
    
    setLoadingAdminChats(true)
    try {
      const result = await getAdminChatChannels(offset)
      console.log('[Customer Dashboard] ===== Admin Chat Channels API Response =====')
      console.log('[Customer Dashboard] Status:', result.status)
      console.log('[Customer Dashboard] Data length:', result.data?.length || 0)
      
      if (result.status === 1 && Array.isArray(result.data)) {
        console.log('[Customer Dashboard] ✅ Data array found, length:', result.data.length)
        
        if (result.data.length > 0) {
          console.log('[Customer Dashboard] ✅ Processing', result.data.length, 'admin chat channels from backend')
          
          const formattedChannels = result.data.map((item, index) => ({
            id: item.id,
            channelName: item.channel_name || 'N/A',
            status: item.status || 0,
            trash: item.trash || 0,
            createdAt: item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A',
            updatedAt: item.updated_at ? new Date(item.updated_at).toLocaleString() : 'N/A'
          }))
          
          console.log('[Customer Dashboard] ✅ Formatted admin chat channels:', formattedChannels.length)
          
          if (append) {
            setAdminChatChannels(prev => [...prev, ...formattedChannels])
          } else {
            setAdminChatChannels(formattedChannels)
          }
          
          setAdminChatOffset(offset + formattedChannels.length)
          setHasMoreAdminChats(formattedChannels.length >= 10)
        } else {
          console.log('[Customer Dashboard] ⚠️ Empty data array')
          if (!append) {
            setAdminChatChannels([])
          }
          setHasMoreAdminChats(false)
        }
      } else {
        console.log('[Customer Dashboard] ⚠️ Invalid response or no data:', result)
        if (!append) {
          setAdminChatChannels([])
        }
        setHasMoreAdminChats(false)
      }
    } catch (error) {
      console.error('[Customer Dashboard] ❌ Error fetching admin chat channels:', error)
      if (!append) {
        setAdminChatChannels([])
      }
      setHasMoreAdminChats(false)
    } finally {
      setLoadingAdminChats(false)
    }
  }

  // Fetch admin chat channel history from backend
  const fetchAdminChatHistory = async (channelName = '', offset = 0, append = false) => {
    const user = getCurrentUser()
    if (!user) {
      console.error('[Customer Dashboard] ❌ User not logged in')
      setAdminChatHistory([])
      setLoadingAdminChatHistory(false)
      return
    }
    
    setLoadingAdminChatHistory(true)
    try {
      const result = await getAdminChatChannelHistory(channelName, offset)
      console.log('[Customer Dashboard] ===== Admin Chat History API Response =====')
      console.log('[Customer Dashboard] Status:', result.status)
      console.log('[Customer Dashboard] Data length:', result.data?.length || 0)
      
      if (result.status === 1 && Array.isArray(result.data)) {
        console.log('[Customer Dashboard] ✅ Data array found, length:', result.data.length)
        
        if (result.data.length > 0) {
          console.log('[Customer Dashboard] ✅ Processing', result.data.length, 'admin chat messages from backend')
          
          const formattedHistory = result.data.map((item, index) => ({
            id: item.id,
            parentId: item.parent_id || 0,
            channelName: item.channel_name || 'N/A',
            uniqeid: item.uniqeid || 'N/A',
            message: item.message || '',
            selectedText: item.selected_text || '',
            selectedType: item.selected_type || '',
            fileUrl: item.file_url || '',
            messageType: item.message_type || 'Text',
            status: item.status || 0,
            createdAt: item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A',
            updatedAt: item.updated_at ? new Date(item.updated_at).toLocaleString() : 'N/A'
          }))
          
          console.log('[Customer Dashboard] ✅ Formatted admin chat history:', formattedHistory.length)
          
          if (append) {
            setAdminChatHistory(prev => [...prev, ...formattedHistory])
          } else {
            setAdminChatHistory(formattedHistory)
          }
          
          setAdminChatHistoryOffset(offset + formattedHistory.length)
          setHasMoreAdminChatHistory(formattedHistory.length >= 10)
        } else {
          console.log('[Customer Dashboard] ⚠️ Empty data array')
          if (!append) {
            setAdminChatHistory([])
          }
          setHasMoreAdminChatHistory(false)
        }
      } else {
        console.log('[Customer Dashboard] ⚠️ Invalid response or no data:', result)
        if (!append) {
          setAdminChatHistory([])
        }
        setHasMoreAdminChatHistory(false)
      }
    } catch (error) {
      console.error('[Customer Dashboard] ❌ Error fetching admin chat history:', error)
      if (!append) {
        setAdminChatHistory([])
      }
      setHasMoreAdminChatHistory(false)
    } finally {
      setLoadingAdminChatHistory(false)
    }
  }

  // Fetch appointment durations from backend
  const fetchAppointmentDurations = async (offset = 0, append = false) => {
    const user = getCurrentUser()
    if (!user) {
      console.error('[Customer Dashboard] ❌ User not logged in')
      setAppointmentDurations([])
      setLoadingAppointmentDurations(false)
      return
    }
    
    setLoadingAppointmentDurations(true)
    try {
      const result = await getAppointmentDurations(offset)
      console.log('[Customer Dashboard] ===== Appointment Durations API Response =====')
      console.log('[Customer Dashboard] Status:', result.status)
      console.log('[Customer Dashboard] Data length:', result.data?.length || 0)
      
      if (result.status === 1 && Array.isArray(result.data)) {
        console.log('[Customer Dashboard] ✅ Data array found, length:', result.data.length)
        
        if (result.data.length > 0) {
          console.log('[Customer Dashboard] ✅ Processing', result.data.length, 'appointment durations from backend')
          
          const formattedDurations = result.data.map((item, index) => ({
            id: item.id,
            userUniId: item.user_uni_id || 'Public',
            duration: item.duration || 0,
            durationType: item.duration_type || 'minutes',
            price: parseFloat(item.price || 0),
            status: item.status || 0,
            createdAt: item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A',
            updatedAt: item.updated_at ? new Date(item.updated_at).toLocaleString() : 'N/A'
          }))
          
          console.log('[Customer Dashboard] ✅ Formatted appointment durations:', formattedDurations.length)
          
          if (append) {
            setAppointmentDurations(prev => [...prev, ...formattedDurations])
          } else {
            setAppointmentDurations(formattedDurations)
          }
          
          setAppointmentDurationsOffset(offset + formattedDurations.length)
          setHasMoreAppointmentDurations(formattedDurations.length >= 10)
        } else {
          console.log('[Customer Dashboard] ⚠️ Empty data array')
          if (!append) {
            setAppointmentDurations([])
          }
          setHasMoreAppointmentDurations(false)
        }
      } else {
        console.log('[Customer Dashboard] ⚠️ Invalid response or no data:', result)
        if (!append) {
          setAppointmentDurations([])
        }
        setHasMoreAppointmentDurations(false)
      }
    } catch (error) {
      console.error('[Customer Dashboard] ❌ Error fetching appointment durations:', error)
      if (!append) {
        setAppointmentDurations([])
      }
      setHasMoreAppointmentDurations(false)
    } finally {
      setLoadingAppointmentDurations(false)
    }
  }

  // Addresses state
  const [addresses, setAddresses] = useState([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [addressModalOpen, setAddressModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [countries, setCountries] = useState([])
  const [loadingCountries, setLoadingCountries] = useState(false)
  const [states, setStates] = useState([])
  const [loadingStates, setLoadingStates] = useState(false)
  const [cities, setCities] = useState([])
  const [loadingCities, setLoadingCities] = useState(false)
  const [selectedCountryId, setSelectedCountryId] = useState(null)
  const [selectedStateId, setSelectedStateId] = useState(null)
  const addressFormRef = useRef(null)

  // Fetch addresses from backend
  const fetchAddresses = async () => {
    setLoadingAddresses(true)
    try {
      const result = await getUserAddresses()
      if (result.status === 1 && result.data) {
        // Map backend fields to frontend format
        const mappedAddresses = result.data.map(addr => ({
          id: addr.id,
          name: addr.name,
          phone: addr.phone,
          email: addr.email,
          houseNo: addr.house_no || '',
          street: addr.street_area || '',
          landmark: addr.landmark || '',
          pincode: addr.pincode || '',
          city: addr.city || '',
          state: addr.state || '',
          country: addr.country || '',
          address: addr.address || '',
          latitude: addr.latitude || '',
          longitude: addr.longitude || ''
        }))
        setAddresses(mappedAddresses)
        console.log('[Customer Dashboard] Addresses loaded:', mappedAddresses)
      } else {
        console.warn('[Customer Dashboard] No addresses found or error:', result.msg)
        setAddresses([])
      }
    } catch (error) {
      console.error('[Customer Dashboard] Error fetching addresses:', error)
      setAddresses([])
    } finally {
      setLoadingAddresses(false)
    }
  }

  // Fetch countries list
  const fetchCountries = async () => {
    if (countries.length > 0) return // Already loaded
    
    setLoadingCountries(true)
    try {
      const result = await fetchPublicCountryList()
      if (result.status === 1 && Array.isArray(result.data) && result.data.length > 0) {
        const countryList = result.data.map(country => ({
          id: country.id,
          name: country.nicename || country.name || '',
          code: country.iso || '',
          phonecode: country.phonecode || ''
        }))
        setCountries(countryList)
        console.log('[Customer Dashboard] Countries loaded:', countryList.length)
      } else {
        // Fallback to common countries if API fails
        setCountries([
          { id: 1, name: 'India', code: 'IN' },
          { id: 2, name: 'United States', code: 'US' },
          { id: 3, name: 'United Kingdom', code: 'GB' },
          { id: 4, name: 'Canada', code: 'CA' },
          { id: 5, name: 'Australia', code: 'AU' }
        ])
      }
    } catch (error) {
      console.error('[Customer Dashboard] Error fetching countries:', error)
      // Fallback to common countries
      setCountries([
        { id: 1, name: 'India', code: 'IN' },
        { id: 2, name: 'United States', code: 'US' },
        { id: 3, name: 'United Kingdom', code: 'GB' }
      ])
    } finally {
      setLoadingCountries(false)
    }
  }

  // Fetch states by country
  const fetchStates = async (countryId) => {
    if (!countryId) {
      setStates([])
      setCities([])
      setLoadingStates(false)
      return
    }

    console.log('[Customer Dashboard] fetchStates called with countryId:', countryId)
    setLoadingStates(true)
    setCities([]) // Clear cities when country changes
    setSelectedStateId(null)
    
    try {
      console.log('[Customer Dashboard] Calling fetchPublicStateList API...')
      const result = await fetchPublicStateList(countryId)
      console.log('[Customer Dashboard] State API response:', result)
      console.log('[Customer Dashboard] State API data sample (first item):', result.data?.[0])
      
      if (result.status === 1 && Array.isArray(result.data) && result.data.length > 0) {
        // Backend now returns plain JSON objects with 'state_name' field
        const stateList = result.data.map((state, index) => {
          // Backend uses 'state_name' field
          const stateName = state.state_name || state.name || ''
          
          return {
            id: state.id || index,
            name: stateName
          }
        }).filter(state => state.name && state.name.trim() !== '') // Filter out empty names
        
        console.log('[Customer Dashboard] ✅ States loaded successfully:', stateList.length, 'states')
        setStates(stateList)
      } else {
        console.warn('[Customer Dashboard] ⚠️ No states found for country:', countryId, 'Result:', result)
        setStates([])
      }
    } catch (error) {
      console.error('[Customer Dashboard] ❌ Error fetching states:', error)
      console.error('[Customer Dashboard] Error details:', error.message, error.stack)
      setStates([])
    } finally {
      console.log('[Customer Dashboard] Setting loadingStates to false')
      setLoadingStates(false)
    }
  }

  // Fetch cities by state
  const fetchCities = async (stateId) => {
    if (!stateId) {
      setCities([])
      return
    }

    setLoadingCities(true)
    try {
      const result = await fetchPublicCityList(stateId)
      console.log('[Customer Dashboard] City API response:', result)
      console.log('[Customer Dashboard] City API data sample (first item):', result.data?.[0])
      
      if (result.status === 1 && Array.isArray(result.data) && result.data.length > 0) {
        // Backend now returns plain JSON objects with 'city_name' field
        const cityList = result.data.map((city, index) => {
          // Backend uses 'city_name' field
          const cityName = city.city_name || city.name || ''
          
          return {
            id: city.id || index,
            name: cityName
          }
        }).filter(city => city.name && city.name.trim() !== '')
        
        console.log('[Customer Dashboard] Cities loaded:', cityList.length, cityList)
        setCities(cityList)
      } else {
        console.log('[Customer Dashboard] No cities found for state:', stateId)
        setCities([])
      }
    } catch (error) {
      console.error('[Customer Dashboard] Error fetching cities:', error)
      setCities([])
    } finally {
      setLoadingCities(false)
    }
  }

  const openAddAddress = () => {
    setEditingAddress(null)
    setSelectedCountryId(null)
    setSelectedStateId(null)
    setStates([])
    setCities([])
    setAddressModalOpen(true)
    fetchCountries() // Load countries when modal opens
  }

  const openEditAddress = (addr) => {
    console.log('[Customer Dashboard] Opening edit address modal for:', addr)
    setEditingAddress(addr)
    setSelectedCountryId(null)
    setSelectedStateId(null)
    setStates([])
    setCities([])
    setAddressModalOpen(true)
    fetchCountries() // Load countries when modal opens
    console.log('[Customer Dashboard] Modal state set - editingAddress:', addr, 'addressModalOpen: true')
  }

  // Load states and cities when editing address with country/state
  useEffect(() => {
    if (!addressModalOpen || !editingAddress || countries.length === 0) return

    const loadEditData = async () => {
      // Find country and load states
      if (editingAddress.country) {
        const country = countries.find(c => c.name === editingAddress.country)
        if (country) {
          console.log('[Customer Dashboard] Loading states for country:', country.id, country.name)
          setSelectedCountryId(country.id)
          await fetchStates(country.id)
        }
      }
    }

    loadEditData()
  }, [addressModalOpen, editingAddress, countries])

  // Load cities when states are loaded and editing address has state
  useEffect(() => {
    if (!addressModalOpen || !editingAddress || !selectedCountryId || states.length === 0) return

    const loadCityData = async () => {
      if (editingAddress.state) {
        const state = states.find(s => s.name === editingAddress.state)
        if (state) {
          console.log('[Customer Dashboard] Loading cities for state:', state.id, state.name)
          setSelectedStateId(state.id)
          await fetchCities(state.id)
        }
      }
    }

    loadCityData()
  }, [addressModalOpen, editingAddress, selectedCountryId, states])

  // Auto-load states when country is selected (for new address or when country changes)
  useEffect(() => {
    if (!addressModalOpen || countries.length === 0) return
    
    // If editing, don't auto-select (handled by other useEffect)
    if (editingAddress) return
    
    // If no country selected but countries are loaded, auto-select India
    if (!selectedCountryId && countries.length > 0) {
      const india = countries.find(c => c.name === 'India')
      if (india) {
        console.log('[Customer Dashboard] Auto-selecting India (ID:', india.id, ')')
        setSelectedCountryId(india.id)
        // fetchStates will be called by the next useEffect when selectedCountryId changes
      }
    }
  }, [addressModalOpen, countries, editingAddress, selectedCountryId])

  // Auto-load states when selectedCountryId changes (for both new and edit)
  useEffect(() => {
    if (!addressModalOpen || !selectedCountryId) return
    
    // Avoid duplicate calls if already loading or states already loaded
    if (loadingStates) {
      console.log('[Customer Dashboard] Already loading states, skipping duplicate call')
      return
    }
    
    console.log('[Customer Dashboard] selectedCountryId changed to:', selectedCountryId, 'Current states count:', states.length)
    
    // Always fetch states when country changes (clear previous states)
    fetchStates(selectedCountryId)
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountryId, addressModalOpen]) // Don't include loadingStates or states to avoid loop

  const deleteAddress = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return
    }

    console.log('[Customer Dashboard] Deleting address with ID:', id)

    try {
      const result = await deleteUserAddress(id)
      console.log('[Customer Dashboard] Delete address response:', result)
      
      if (result.status === 1) {
        // Refresh addresses list
        await fetchAddresses()
        alert('Address deleted successfully!')
      } else {
        console.error('[Customer Dashboard] Delete address failed:', result.msg)
        alert(result.msg || 'Failed to delete address')
      }
    } catch (error) {
      console.error('[Customer Dashboard] Error deleting address:', error)
      console.error('[Customer Dashboard] Error details:', {
        message: error.message,
        stack: error.stack
      })
      alert('Error deleting address. Please try again.')
    }
  }

  const handleSaveAddress = async (e) => {
    e.preventDefault()
    const form = e.target
    const formData = Object.fromEntries(new FormData(form).entries())
    
    try {
      let result
      if (editingAddress) {
        // Update existing address
        result = await updateUserAddress(editingAddress.id, formData)
      } else {
        // Add new address
        result = await addUserAddress(formData)
      }

      if (result.status === 1) {
        // Refresh addresses list
        await fetchAddresses()
        setAddressModalOpen(false)
        alert(editingAddress ? 'Address updated successfully!' : 'Address added successfully!')
      } else {
        alert(result.msg || 'Failed to save address')
      }
    } catch (error) {
      console.error('[Customer Dashboard] Error saving address:', error)
      alert('Error saving address. Please try again.')
    }
  }

  const sidebarItems = [
    { id: 'profile', label: 'My Profile', icon: 'fa-user' },
    { id: 'wallet', label: 'My Wallet', icon: 'fa-wallet' },
    { id: 'gifts', label: 'Gift History', icon: 'fa-gift' },
    { id: 'addresses', label: 'My Addresses', icon: 'fa-map-marker-alt' },
    { id: 'orders', label: 'My Orders', icon: 'fa-shopping-bag' },
    { id: 'service-orders', label: 'My Service Orders', icon: 'fa-concierge-bell' },
    { id: 'puja-bookings', label: 'My Puja Bookings', icon: 'fa-om' },
    { id: 'ask-questions', label: 'My Questions', icon: 'fa-question-circle' },
    { id: 'appointments', label: 'My Appointments', icon: 'fa-calendar-check' },
    { id: 'architect-rooms', label: 'My Architect Rooms', icon: 'fa-home' },
    { id: 'architect-service-orders', label: 'My Architect Orders', icon: 'fa-clipboard-list' },
    { id: 'kundlis', label: 'My Kundli List', icon: 'fa-star' },
    { id: 'intakes', label: 'My Intakes', icon: 'fa-file-alt' },
    { id: 'chat-history', label: 'My Chat History', icon: 'fa-comments' },
    { id: 'waiting-list', label: 'My Waiting List', icon: 'fa-clock' },
    { id: 'call-history', label: 'My Call History', icon: 'fa-phone' },
    { id: 'horoscope', label: 'My Daily Horoscope', icon: 'fa-sun' },
    { id: 'support', label: 'My Support Ticket', icon: 'fa-ticket-alt' },
    { id: 'courses', label: 'My Courses', icon: 'fa-graduation-cap' },
    { id: 'refunds', label: 'My Refunds', icon: 'fa-undo-alt' },
    { id: 'offers', label: 'Offers', icon: 'fa-tags' },
    { id: 'offline-services', label: 'Offline Services', icon: 'fa-concierge-bell' },
    { id: 'service-assigns', label: 'Service Assigns', icon: 'fa-user-cog' },
    { id: 'service-gallery', label: 'Service Gallery', icon: 'fa-images' },
    { id: 'offline-orders', label: 'Offline Orders', icon: 'fa-file-invoice' },
    { id: 'ai-predictions', label: 'AI Predictions', icon: 'fa-robot' },
    { id: 'ai-profiles', label: 'AI Profiles', icon: 'fa-user-astronaut' },
    { id: 'our-services', label: 'Our Services', icon: 'fa-th-large' },
    { id: 'packages', label: 'Packages', icon: 'fa-box-open' },
    { id: 'module-accesses', label: 'Module Accesses', icon: 'fa-key' }
  ]

  // Check if user is admin (role_id === 1 typically means admin)
  const currentUser = getCurrentUser()
  const isAdmin = currentUser?.role_id === 1 || currentUser?.role_id === '1' || currentUser?.type === 'admin'

  // Add admin-only items if user is admin
  if (isAdmin) {
    sidebarItems.push(
      { id: 'admin-chats', label: 'Admin Chat Channels', icon: 'fa-user-shield' },
      { id: 'admin-chat-history', label: 'Admin Chat History', icon: 'fa-comment-dots' },
      { id: 'appointment-durations', label: 'Appointment Durations', icon: 'fa-clock' }
    )
  }

  const rechargeOptions = [50, 100, 200, 500, 1000, 2000, 5000]

  // Helper function to create SVG data URI
  const createSvgDataUri = (initial) => {
    const safeInitial = String(initial || 'U').charAt(0).toUpperCase();

    // Create SVG as a single line without any special characters
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#ee5a24"/><text x="60" y="75" fill="white" font-size="48" font-weight="bold" font-family="Arial" text-anchor="middle">${safeInitial}</text></svg>`;

    // Use base64 encoding which is more reliable
    try {
      const base64 = btoa(unescape(encodeURIComponent(svg)));
      return `data:image/svg+xml;base64,${base64}`;
    } catch (err) {
      // Fallback: use URI encoding if base64 fails
      const encoded = encodeURIComponent(svg);
      return `data:image/svg+xml,${encoded}`;
    }
  }

  // Helper function to normalize image URL path (fix singular/plural mismatch)
  const normalizeImagePath = (url) => {
    if (!url) return url
    
    // Fix path mismatch: /uploads/customer/ -> /uploads/customers/
    // Backend sometimes returns singular but files are stored in plural directory
    if (url.includes('/uploads/customer/') && !url.includes('/uploads/customers/')) {
      const normalized = url.replace('/uploads/customer/', '/uploads/customers/')
      console.log('[Customer Dashboard] 🔧 Normalized image path:', { original: url, normalized })
      return normalized
    }
    
    return url
  }

  // Helper function to get customer image URL
  const getCustomerImageUrl = (customerImg, name, forceRefresh = false) => {
    // First check if we have a valid image URL
    if (customerImg && customerImg.trim() !== "") {
      let cleanUrl = customerImg.trim();
      
      // Normalize path (fix singular/plural mismatch)
      cleanUrl = normalizeImagePath(cleanUrl)
      
      // PRIORITY 1: Check if it's an uploaded image (uploads/customers/) - ALWAYS use these
      if (cleanUrl.includes('uploads/customers/') || cleanUrl.includes('uploads/customer/')) {
        // If it's already a full URL, use it
        if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
          if (forceRefresh) {
            const separator = cleanUrl.includes('?') ? '&' : '?'
            const urlWithCache = `${cleanUrl}${separator}_t=${Date.now()}`
            console.log('[Customer Dashboard] ✅ Using uploaded image URL with cache-busting:', urlWithCache)
            return urlWithCache
          }
          console.log('[Customer Dashboard] ✅ Using uploaded image URL (full):', cleanUrl)
          return cleanUrl;
        }
        // If it's a relative path, construct full URL
        const baseUrl = import.meta.env.VITE_USERS_API?.replace('/api', '') || 'http://localhost:8000'
        const fullUrl = cleanUrl.startsWith('/') ? `${baseUrl}${cleanUrl}` : `${baseUrl}/${cleanUrl}`
        console.log('[Customer Dashboard] ✅ Constructed full URL for uploaded image:', fullUrl)
        return forceRefresh ? `${fullUrl}?_t=${Date.now()}` : fullUrl
      }
      
      // Check if it's already a data URI (SVG) - don't use it
      if (cleanUrl.startsWith('data:image/svg')) {
        console.log('[Customer Dashboard] ❌ SVG data URI detected, using SVG fallback instead')
        return createSvgDataUri(name);
      }
      
      // Check for invalid/default placeholder paths that don't exist
      const invalidPatterns = [
        'assets/img/customer.png',
        'out of api calls',
        'renew subscription',
        'error',
        'failed',
        'null',
        'undefined',
        '62096.png', // Exclude static default (but only if not in uploads/customers)
        'karmleela.com/uploads/setting', // Exclude static default path
        'karmleela.com/assets/img/customer.png' // Exclude static default
      ];
      
      // Only check invalid patterns if it's NOT an uploaded image
      // Allow 'customer.png' if it's in uploads/customers path
      if (!cleanUrl.includes('uploads/customers/') && !cleanUrl.includes('uploads/customer/')) {
        if (invalidPatterns.some(pattern => cleanUrl.toLowerCase().includes(pattern.toLowerCase()))) {
          console.log('[Customer Dashboard] ❌ Invalid image pattern detected, using SVG fallback:', cleanUrl)
          return createSvgDataUri(name);
        }
        // Also check for standalone customer.png (not in uploads path)
        if (cleanUrl.toLowerCase().includes('customer.png') && !cleanUrl.includes('uploads/')) {
          console.log('[Customer Dashboard] ❌ Static customer.png detected, using SVG fallback:', cleanUrl)
          return createSvgDataUri(name);
        }
      }
      
      // Check if it's a valid HTTP/HTTPS URL
      if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
        // If it's HTTP but contains static patterns (and not in uploads), reject it
        if (!cleanUrl.includes('uploads/customers/') && !cleanUrl.includes('uploads/customer/')) {
          if (cleanUrl.includes('customer.png') || cleanUrl.includes('62096.png') || cleanUrl.includes('assets/img/customer.png')) {
            console.log('[Customer Dashboard] ❌ HTTP URL but contains static pattern, using SVG fallback:', cleanUrl)
            return createSvgDataUri(name);
          }
        }
        console.log('[Customer Dashboard] ✅ Using HTTP/HTTPS image URL:', cleanUrl)
        return forceRefresh && cleanUrl.includes('?') ? `${cleanUrl}&_t=${Date.now()}` : (forceRefresh ? `${cleanUrl}?_t=${Date.now()}` : cleanUrl)
      }
      
      // If it's a relative path, construct full URL
      if (cleanUrl.startsWith('/') || cleanUrl.startsWith('uploads/')) {
        const baseUrl = import.meta.env.VITE_USERS_API?.replace('/api', '') || 'http://localhost:8000'
        const fullUrl = cleanUrl.startsWith('/') ? `${baseUrl}${cleanUrl}` : `${baseUrl}/${cleanUrl}`
        console.log('[Customer Dashboard] ✅ Constructed full URL from relative path:', fullUrl)
        return forceRefresh ? `${fullUrl}?_t=${Date.now()}` : fullUrl
      }
      
      console.log('[Customer Dashboard] ⚠️ Unknown URL format, using as-is:', cleanUrl)
      return cleanUrl;
    }
    // If no image → return SVG avatar
    console.log('[Customer Dashboard] ❌ No customer_img found, using SVG fallback. customerImg:', customerImg)
    return createSvgDataUri(name);
  }

  // Handle image load errors
  const handleImageError = (e, name) => {
    // Prevent infinite loop if fallback also fails
    if (e.target.dataset.fallbackUsed) {
      return
    }
    
    // Log the error for debugging
    const failedSrc = e.target.src
    console.warn('[Customer Dashboard] Image failed to load:', failedSrc)
    
    // If it's already a data URI (SVG), don't do anything
    if (failedSrc.startsWith('data:image/svg')) {
      return
    }
    
    // If it's an uploaded image, try with cache-busting first
    if (failedSrc.includes('uploads/customers/') || failedSrc.includes('uploads/customer/')) {
      // Remove any existing cache-busting parameter
      const urlWithoutParams = failedSrc.split('?')[0].split('&')[0]
      const retryUrl = `${urlWithoutParams}?_t=${Date.now()}`
      console.log('[Customer Dashboard] 🔄 Retrying uploaded image with cache-busting:', retryUrl)
      e.target.src = retryUrl
      // Mark that we've tried once, next failure will use SVG
      e.target.dataset.retryAttempted = 'true'
      return
    }
    
    // If retry was already attempted, use SVG fallback
    if (e.target.dataset.retryAttempted) {
      e.target.onerror = null // Prevent subsequent calls
      const initial = (name || 'U').charAt(0).toUpperCase()
      e.target.src = createSvgDataUri(initial)
      e.target.dataset.fallbackUsed = 'true' // Mark that fallback has been used
      console.log('[Customer Dashboard] Using SVG fallback after retry failed')
      return
    }
    
    // For non-uploaded images, use SVG fallback immediately
    e.target.onerror = null // Prevent subsequent calls
    const initial = (name || 'U').charAt(0).toUpperCase()
    e.target.src = createSvgDataUri(initial)
    e.target.dataset.fallbackUsed = 'true' // Mark that fallback has been used
    console.log('[Customer Dashboard] Using SVG fallback due to image load error')
  }

  // Fetch user data on component mount
  // Fetch kundalis from backend
  const fetchKundalis = useCallback(async () => {
    const currentUser = getCurrentUser()
    if (!currentUser || !currentUser.api_key || !currentUser.user_uni_id) {
      setKundlis([])
      return
    }
    
    setLoadingKundlis(true)
    try {
      const result = await fetchUserKundaliRequests({
        // api_key and user_uni_id are now automatically fetched from getCurrentUser() in the API function
        kundali_type: 'kundli', // Only fetch single kundlis, not matching
        kundali_method: '', // Empty string to fetch all methods
        offset: (kundlisPage - 1) * kundlisPageSize
      })
      
      if (result.status === 1 && Array.isArray(result.data)) {
        // Transform backend data to match frontend format
        const transformedKundlis = result.data.map((kundli, index) => {
          const requestBody = kundli.request_body || {}
          // Parse request_body if it's a string
          let parsedRequestBody = requestBody
          if (typeof requestBody === 'string') {
            try {
              parsedRequestBody = JSON.parse(requestBody)
            } catch (e) {
              parsedRequestBody = {}
            }
          }
          
          return {
            id: kundli.id,
            kundaliId: kundli.id || `KUNDLI${index + 1}`,
            name: kundli.name || parsedRequestBody.name || 'N/A',
            email: parsedRequestBody.email || currentUser.email || 'N/A',
            phone: parsedRequestBody.phone || currentUser.phone || 'N/A',
            status: 'Active',
            method: kundli.kundali_method || 'd1',
            dob: parsedRequestBody.dob || 'N/A',
            tob: parsedRequestBody.tob || 'N/A',
            place: parsedRequestBody.place || 'N/A',
            created_at: kundli.created_at ? new Date(kundli.created_at).toLocaleDateString('en-US', { 
              weekday: 'short', 
              day: 'numeric', 
              month: 'short', 
              year: 'numeric' 
            }) : 'N/A'
          }
        })
        setKundlis(transformedKundlis)
      } else {
        setKundlis([])
      }
    } catch (err) {
      console.error('[Customer Dashboard] Error fetching kundalis:', err)
      setKundlis([])
    } finally {
      setLoadingKundlis(false)
    }
  }, [kundlisPage, kundlisPageSize])

  // Fetch chat history from backend
  const fetchChatHistory = useCallback(async () => {
    const currentUser = getCurrentUser()
    if (!currentUser || !currentUser.api_key || !currentUser.user_uni_id) {
      setChats([])
      return
    }

    setLoadingChats(true)
    try {
      const result = await getChatChannels(chatPage, 0) // page, is_assistant_chat = 0 (regular chats)

      if (result.status === 1 && Array.isArray(result.data)) {
        // Transform backend data to match frontend format
        const transformedChats = result.data.map((chat, index) => {
          // Extract uniqeid from channel data or use a default
          const uniqeid = chat.uniqeid || chat.unique_id || `CHAT${index + 1}`
          
          // Parse dates from updated_at or created_at
          const chatDate = chat.updated_at || chat.created_at || new Date()
          const formattedDate = new Date(chatDate).toLocaleDateString('en-US', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })

          // Normalize status
          let normalizedStatus = chat.status || 'Active'
          if (typeof normalizedStatus === 'number') {
            normalizedStatus = normalizedStatus === 1 ? 'Active' : normalizedStatus === 0 ? 'Completed' : 'Pending'
          } else if (typeof normalizedStatus === 'string') {
            normalizedStatus = normalizedStatus.toLowerCase()
            if (normalizedStatus === '1' || normalizedStatus === 'active') {
              normalizedStatus = 'Active'
            } else if (normalizedStatus === '0' || normalizedStatus === 'complete' || normalizedStatus === 'completed') {
              normalizedStatus = 'Completed'
            } else if (normalizedStatus === 'declined' || normalizedStatus === 'decline') {
              normalizedStatus = 'Declined'
            } else {
              normalizedStatus = normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1)
            }
          }

          return {
            sn: (chatPage - 1) * chatPageSize + index + 1,
            astrologer: chat.display_name || chat.astrologer_uni_id || 'N/A',
            uniqueId: uniqeid,
            orderDate: formattedDate,
            start: chat.created_at ? new Date(chat.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '-',
            end: chat.updated_at ? new Date(chat.updated_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '-',
            duration: chat.created_at && chat.updated_at ? (() => {
              const start = new Date(chat.created_at)
              const end = new Date(chat.updated_at)
              const diffMs = end - start
              const diffMins = Math.floor(diffMs / 60000)
              return diffMins > 0 ? `${diffMins} min` : '< 1 min'
            })() : '-',
            status: normalizedStatus,
            type: 'Chat',
            channel_name: chat.channel_name || '',
            astrologer_uni_id: chat.astrologer_uni_id || ''
          }
        })
        setChats(transformedChats)
        console.log('[Customer Dashboard] Chat history loaded:', transformedChats.length)
      } else {
        setChats([])
      }
    } catch (err) {
      console.error('[Customer Dashboard] Error fetching chat history:', err)
      setChats([])
    } finally {
      setLoadingChats(false)
    }
  }, [chatPage, chatPageSize])

  // Fetch chat history when chat history tab becomes active
  useEffect(() => {
    if (activeTab === 'chat-history') {
      fetchChatHistory()
    }
  }, [activeTab, chatPage, chatPageSize, fetchChatHistory])

  // CRITICAL: Check authentication and redirect if not logged in or if vendor
  useEffect(() => {
    const checkAuth = () => {
      const currentUser = getCurrentUser()
      
      // If no user, redirect to home
      if (!currentUser) {
        console.log('[Customer Dashboard] No user found, redirecting to home')
        setIsAuthenticated(false)
        navigate('/', { replace: true })
        return false
      }
      
      // Check if user is a vendor (vendors should use vendor dashboard)
      const userRole = currentUser?.role_id || currentUser?.type
      const userId = currentUser?.user_uni_id || currentUser?.customer_uni_id || ''
      const isVendor = userRole === 5 || userRole === 'Vendor' || currentUser?.type === 'Vendor' || (userId && userId.startsWith('VEND'))
      
      // If vendor, redirect to vendor dashboard
      if (isVendor) {
        console.log('[Customer Dashboard] Vendor detected, redirecting to Vendor Dashboard:', {
          user_uni_id: userId,
          role_id: userRole,
          type: currentUser?.type
        })
        setIsAuthenticated(false)
        navigate('/vendor-dashboard', { replace: true })
        return false
      }
      
      setIsAuthenticated(true)
      return true
    }
    
    // Check immediately
    const authResult = checkAuth()
    
    // Listen to auth changes (logout events)
    const handleAuthChange = (e) => {
      const user = e.detail?.user
      if (!user) {
        console.log('[Customer Dashboard] User logged out, redirecting to home')
        setIsAuthenticated(false)
        navigate('/', { replace: true })
      } else {
        // Re-check if user is still a customer (not vendor)
        checkAuth()
      }
    }
    
    // Listen to storage changes (logout from other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'user' && !e.newValue) {
        console.log('[Customer Dashboard] User logged out (storage change), redirecting to home')
        setIsAuthenticated(false)
        navigate('/', { replace: true })
      }
    }
    
    window.addEventListener('auth:change', handleAuthChange)
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('auth:change', handleAuthChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [navigate])

  // Fetch call history from backend
  useEffect(() => {
    const loadCallHistory = async () => {
      const user = getCurrentUser()
      
      // Handle multiple field name variations (user_uni_id vs customer_uni_id)
      const userId = user?.user_uni_id || user?.customer_uni_id || ''
      
      if (!user || !userId) {
        console.warn('[Customer Dashboard] User not logged in, cannot fetch call history.')
        setCalls([])
        return
      }

      setLoadingCalls(true)
      try {
        const offset = (callPage - 1) * callPageSize
        const result = await fetchUserCallHistory({
          // user_uni_id is now handled internally by fetchUserCallHistory
          offset: offset,
          call_type: '', // Empty to get all call types
          status: '' // Empty to get all statuses
        })

        if (result.status === 1 && Array.isArray(result.data)) {
          // Transform backend data to match frontend format
          const transformedCalls = result.data.map((call, index) => ({
            sn: offset + index + 1,
            astrologer: call.astrologer?.display_name || call.astrologer_uni_id || 'N/A',
            uniqueId: call.uniqeid || call.unique_id || 'N/A',
            orderDate: call.order_date ? new Date(call.order_date).toLocaleDateString('en-US', { 
              weekday: 'short', 
              day: 'numeric', 
              month: 'short', 
              year: 'numeric' 
            }) : 'N/A',
            start: call.call_start ? new Date(call.call_start).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }) : '-',
            end: call.call_end ? new Date(call.call_end).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }) : '-',
            duration: call.duration ? (() => {
              const durationNum = typeof call.duration === 'string' ? parseInt(call.duration) : call.duration
              if (isNaN(durationNum)) return '0:00'
              const minutes = Math.floor(durationNum / 60)
              const seconds = durationNum % 60
              return `${minutes}:${String(seconds).padStart(2, '0')}`
            })() : '0:00',
            status: call.status || 'N/A',
            type: call.call_type === 'call' ? 'Voice Call' : call.call_type === 'chat' ? 'Chat' : call.call_type === 'video' ? 'Video Call' : call.call_type || 'Call',
            charge: call.charge || 0,
            astrologer_uni_id: call.astrologer_uni_id,
            astrologer_img: call.astrologer?.astro_img || ''
          }))
          setCalls(transformedCalls)
          console.log('[Customer Dashboard] Call history loaded:', transformedCalls.length)
        } else {
          setCalls([])
        }
      } catch (err) {
        console.error('[Customer Dashboard] Error fetching call history:', err)
        setCalls([])
      } finally {
        setLoadingCalls(false)
      }
    }

    // Only fetch if call-history tab is active
    if (activeTab === 'call-history') {
      loadCallHistory()
    }
  }, [activeTab, callPage, callPageSize])

  // Handle viewing call details with images
  const handleViewCallDetails = async (call) => {
    setSelectedCall(call)
    setShowCallDetailModal(true)
    setLoadingCallImages(true)
    setCallImages([])

    try {
      const result = await getFileOnCall(call.uniqueId)
      console.log('[Customer Dashboard] Call images result:', result)
      if (result.status === 1 && Array.isArray(result.data)) {
        setCallImages(result.data)
      } else {
        setCallImages([])
      }
    } catch (err) {
      console.error('[Customer Dashboard] Error fetching call images:', err)
      setCallImages([])
    } finally {
      setLoadingCallImages(false)
    }
  }

  // Close call detail modal
  const closeCallDetailModal = () => {
    setShowCallDetailModal(false)
    setSelectedCall(null)
    setCallImages([])
  }

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = getCurrentUser()
        
        // Check for multiple field name variations
        const userId = user?.user_uni_id || user?.customer_uni_id
        const apiKey = user?.user_api_key || user?.api_key
        
        console.log('[Customer Dashboard] User check on mount:', {
          hasUser: !!user,
          hasUserId: !!userId,
          hasApiKey: !!apiKey,
          userIdValue: userId || 'MISSING',
          userKeys: user ? Object.keys(user) : []
        })
        
        if (!user || !userId || !apiKey) {
          console.error('[Customer Dashboard] User not logged in, redirecting to home')
          // Redirect to home if not logged in
          navigate('/', { replace: true })
          return
        }

        setUserData(user)

        // Set initial profile data from localStorage
        // Convert date and time formats for HTML5 inputs
        setProfileData({
          name: user.name || '',
          phone: user.phone || user.mobile || '',
          email: user.email || '',
          gender: user.gender || '',
          birthDate: formatDateForInput(user.birth_date || ''),
          birthTime: formatTimeForInput(user.birth_time || ''),
          placeOfBirth: user.birth_place || ''
        })

        // Fetch customer dashboard data
        const dashboardResult = await getCustomerDashboard(user.user_uni_id)
        console.log('[Customer Dashboard] Dashboard result:', dashboardResult)
        
        if (dashboardResult.status === 1 && dashboardResult.data) {
          const data = dashboardResult.data
          console.log('[Customer Dashboard] Dashboard data keys:', Object.keys(data))
          console.log('[Customer Dashboard] customer_profile:', data.customer_profile)
          
          // Update profile data from backend (from customer_profile if available)
          const customerProfile = data.customer_profile || {}
          console.log('[Customer Dashboard] Customer profile data:', {
            hasCustomerProfile: !!customerProfile,
            customerProfileKeys: Object.keys(customerProfile),
            customerImg: customerProfile.customer_img,
            name: customerProfile.name,
            email: customerProfile.email
          })
          
          if (customerProfile.name || customerProfile.email || customerProfile.phone) {
            setProfileData(prev => ({
              ...prev,
              name: customerProfile.name || prev.name,
              email: customerProfile.email || prev.email,
              phone: customerProfile.phone || prev.phone,
              gender: customerProfile.gender || prev.gender,
              birthDate: formatDateForInput(customerProfile.birth_date || prev.birthDate || ''),
              birthTime: formatTimeForInput(customerProfile.birth_time || prev.birthTime || ''),
              placeOfBirth: customerProfile.birth_place || prev.placeOfBirth
            }))
          }
          
          // Update userData with customer_img from backend
          if (customerProfile.customer_img) {
            let backendImgUrl = customerProfile.customer_img
            
            // Normalize path (fix singular/plural mismatch: /uploads/customer/ -> /uploads/customers/)
            backendImgUrl = normalizeImagePath(backendImgUrl)
            
            console.log('[Customer Dashboard] 📸 Backend customer_img received:', backendImgUrl)
            console.log('[Customer Dashboard] Image URL validation:', {
              url: backendImgUrl,
              isStatic: backendImgUrl.includes('customer.png') || backendImgUrl.includes('62096.png') || backendImgUrl.includes('assets/img/customer.png'),
              isDataUri: backendImgUrl.startsWith('data:'),
              isHttp: backendImgUrl.startsWith('http'),
              containsUploadsCustomers: backendImgUrl.includes('uploads/customers/')
            })
            
            // Only update if it's a valid image URL (not static default, not SVG data URI)
            if (backendImgUrl && 
                !backendImgUrl.includes('customer.png') && 
                !backendImgUrl.includes('62096.png') &&
                !backendImgUrl.includes('assets/img/customer.png') &&
                !backendImgUrl.startsWith('data:image/svg')) {
              setUserData(prev => ({
                ...prev,
                customer_img: backendImgUrl
              }))
              
              // Also update localStorage
              const currentUser = getCurrentUser()
              if (currentUser) {
                const updatedUser = { ...currentUser, customer_img: backendImgUrl }
                localStorage.setItem('user', JSON.stringify(updatedUser))
                console.log('[Customer Dashboard] ✅ Updated userData and localStorage with backend image:', backendImgUrl)
              }
            } else {
              console.warn('[Customer Dashboard] ⚠️ Backend returned invalid/static image, not updating:', backendImgUrl)
            }
          } else {
            console.warn('[Customer Dashboard] ⚠️ No customer_img in customerProfile. Full profile:', customerProfile)
          }
        } else {
          console.warn('[Customer Dashboard] ⚠️ Dashboard fetch failed or no data:', dashboardResult)
        }

        // Update userData with latest data from localStorage (fallback)
        const updatedUser = getCurrentUser()
        if (updatedUser && !userData?.customer_img) {
          setUserData(updatedUser)
        }

        // Fetch wallet balance
        const walletResult = await getWalletBalance(user.user_uni_id)
        if (walletResult.status === 1) {
          setWalletBalance(walletResult.data || 0)
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
    // Note: fetchKundalis is called separately when kundlis tab is active
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount
  
  // Fetch kundalis when kundlis tab becomes active or page changes
  useEffect(() => {
    if (activeTab === 'kundlis') {
      fetchKundalis()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, kundlisPage, kundlisPageSize]) // fetchKundalis is stable useCallback with correct deps

  // Fetch addresses when addresses tab becomes active
  useEffect(() => {
    if (activeTab === 'addresses') {
      fetchAddresses()
    }
  }, [activeTab])

  // Fetch orders when orders tab becomes active
  useEffect(() => {
    if (activeTab === 'orders') {
      console.log('[Customer Dashboard] ===== Orders tab activated =====')
      console.log('[Customer Dashboard] Current orders count:', orders.length)
      console.log('[Customer Dashboard] Loading state:', loadingOrders)
      console.log('[Customer Dashboard] Is fetching:', isFetchingOrders.current)
      
      // Always fetch when tab is activated (if not already fetching)
      // This ensures fresh data is loaded every time user opens the tab
      if (!isFetchingOrders.current) {
        console.log('[Customer Dashboard] ✅ Calling fetchOrders...')
        fetchOrders(0, false)
      } else {
        console.log('[Customer Dashboard] ⚠️ Skipping fetch - already in progress')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]) // Only depend on activeTab to avoid infinite loop

  // Fetch service orders when service-orders tab becomes active
  useEffect(() => {
    if (activeTab === 'service-orders') {
      console.log('[Customer Dashboard] ===== Service Orders tab activated =====')
      console.log('[Customer Dashboard] Current service orders count:', serviceOrders.length)
      console.log('[Customer Dashboard] Loading state:', loadingServiceOrders)
      console.log('[Customer Dashboard] Is fetching:', isFetchingServiceOrders.current)
      
      // Always fetch when tab is activated (if not already fetching)
      // This ensures fresh data is loaded every time user opens the tab
      if (!isFetchingServiceOrders.current) {
        console.log('[Customer Dashboard] ✅ Calling fetchServiceOrders...')
        fetchServiceOrders(0, false)
      } else {
        console.log('[Customer Dashboard] ⚠️ Skipping fetch - already in progress')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]) // Only depend on activeTab to avoid infinite loop

  // Fetch ask questions when ask-questions tab becomes active
  useEffect(() => {
    if (activeTab === 'ask-questions') {
      console.log('[Customer Dashboard] ===== Ask Questions tab activated =====')
      console.log('[Customer Dashboard] Current ask questions count:', askQuestions.length)
      console.log('[Customer Dashboard] Loading state:', loadingAskQuestions)
      
      // Always fetch when tab is activated
      // This ensures fresh data is loaded every time user opens the tab
      if (!loadingAskQuestions) {
        console.log('[Customer Dashboard] ✅ Calling fetchAskQuestions...')
        fetchAskQuestions(0, false)
      } else {
        console.log('[Customer Dashboard] ⚠️ Skipping fetch - already in progress')
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // Fetch appointments when appointments tab becomes active
  useEffect(() => {
    if (activeTab === 'appointments') {
      console.log('[Customer Dashboard] ===== Appointments tab activated =====')
      if (!loadingAppointments) {
        fetchAppointmentsData(0, false)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // Fetch architect rooms when architect-rooms tab becomes active
  useEffect(() => {
    if (activeTab === 'architect-rooms') {
      console.log('[Customer Dashboard] ===== Architect Rooms tab activated =====')
      if (!loadingArchitectRooms) {
        fetchArchitectRoomsData(0, false)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // Fetch architect service orders when architect-service-orders tab becomes active
  useEffect(() => {
    if (activeTab === 'architect-service-orders') {
      console.log('[Customer Dashboard] ===== Architect Service Orders tab activated =====')
      if (!loadingArchitectServiceOrders) {
        fetchArchitectServiceOrdersData(0, false)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // Fetch puja bookings when puja-bookings tab becomes active
  useEffect(() => {
    if (activeTab === 'puja-bookings') {
      console.log('[Customer Dashboard] ===== Puja Bookings tab activated =====')
      if (!loadingPujaBookings && pujaBookings.length === 0) {
        fetchPujaBookingsData(1)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // Fetch intakes when intakes tab becomes active
  useEffect(() => {
    if (activeTab === 'intakes') {
      console.log('[Customer Dashboard] ===== Intakes tab activated =====')
      if (!loadingIntakes && intakes.length === 0) {
        fetchIntakesData(0, false)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // Fetch module accesses when module-accesses tab becomes active
  useEffect(() => {
    if (activeTab === 'module-accesses') {
      console.log('[Customer Dashboard] ===== Module Accesses tab activated =====')
      if (!loadingModuleAccesses && moduleAccesses.length === 0) {
        fetchModuleAccessesData(0, false)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // Fetch admin chat channels when admin-chats tab becomes active
  useEffect(() => {
    if (activeTab === 'admin-chats') {
      console.log('[Customer Dashboard] ===== Admin Chat Channels tab activated =====')
      console.log('[Customer Dashboard] Current channels count:', adminChatChannels.length)
      console.log('[Customer Dashboard] Loading state:', loadingAdminChats)
      
      // Always fetch when tab is activated
      if (!loadingAdminChats) {
        console.log('[Customer Dashboard] ✅ Calling fetchAdminChatChannels...')
        fetchAdminChatChannels(0, false)
      } else {
        console.log('[Customer Dashboard] ⚠️ Skipping fetch - already in progress')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]) // Only depend on activeTab to avoid infinite loop

  // Fetch admin chat history when admin-chat-history tab becomes active
  useEffect(() => {
    if (activeTab === 'admin-chat-history') {
      console.log('[Customer Dashboard] ===== Admin Chat History tab activated =====')
      console.log('[Customer Dashboard] Current history count:', adminChatHistory.length)
      console.log('[Customer Dashboard] Loading state:', loadingAdminChatHistory)
      
      // Always fetch when tab is activated
      if (!loadingAdminChatHistory) {
        console.log('[Customer Dashboard] ✅ Calling fetchAdminChatHistory...')
        fetchAdminChatHistory(selectedChannel, 0, false)
      } else {
        console.log('[Customer Dashboard] ⚠️ Skipping fetch - already in progress')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]) // Only depend on activeTab to avoid infinite loop

  // Fetch appointment durations when appointment-durations tab becomes active
  useEffect(() => {
    if (activeTab === 'appointment-durations') {
      console.log('[Customer Dashboard] ===== Appointment Durations tab activated =====')
      console.log('[Customer Dashboard] Current durations count:', appointmentDurations.length)
      console.log('[Customer Dashboard] Loading state:', loadingAppointmentDurations)
      
      // Always fetch when tab is activated
      if (!loadingAppointmentDurations) {
        console.log('[Customer Dashboard] ✅ Calling fetchAppointmentDurations...')
        fetchAppointmentDurations(0, false)
      } else {
        console.log('[Customer Dashboard] ⚠️ Skipping fetch - already in progress')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]) // Only depend on activeTab to avoid infinite loop

  // Fetch wallet transactions
  const fetchWalletTransactions = useCallback(async () => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      console.warn('[Customer Dashboard] No user found, cannot fetch wallet transactions')
      setWalletTransactions([])
      return
    }
    
    const userId = currentUser.user_uni_id || currentUser.customer_uni_id
    if (!userId) {
      console.warn('[Customer Dashboard] No user_uni_id found, cannot fetch wallet transactions')
      setWalletTransactions([])
      return
    }
    
    setLoadingWalletTransactions(true)
    try {
      console.log('[Customer Dashboard] Fetching wallet transactions:', {
        userId,
        offset: (walletPage - 1) * walletPageSize,
        limit: walletPageSize
      })
      
      const result = await getWalletTransactions(
        userId,
        (walletPage - 1) * walletPageSize,
        walletPageSize
      )
      
      console.log('[Customer Dashboard] Wallet transactions result:', {
        status: result.status,
        dataLength: Array.isArray(result.data) ? result.data.length : 0,
        msg: result.msg,
        data: result.data
      })
      
      if (result.status === 1 && Array.isArray(result.data)) {
        setWalletTransactions(result.data)
        console.log('[Customer Dashboard] ✅ Wallet transactions loaded:', result.data.length)
      } else {
        console.warn('[Customer Dashboard] ⚠️ No wallet transactions or invalid response:', result)
        setWalletTransactions([])
      }
    } catch (err) {
      console.error('[Customer Dashboard] Error fetching wallet transactions:', err)
      setWalletTransactions([])
    } finally {
      setLoadingWalletTransactions(false)
    }
  }, [walletPage, walletPageSize])

  // Fetch wallet transactions when wallet tab becomes active or page changes
  useEffect(() => {
    if (activeTab === 'wallet') {
      fetchWalletTransactions()
    }
  }, [activeTab, walletPage, walletPageSize, fetchWalletTransactions])

  // Fetch gift history
  const fetchGiftHistory = useCallback(async () => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      console.warn('[Customer Dashboard] No user found, cannot fetch gift history')
      setGiftHistory([])
      return
    }
    
    const userId = currentUser.user_uni_id || currentUser.customer_uni_id
    if (!userId) {
      console.warn('[Customer Dashboard] No user_uni_id found, cannot fetch gift history')
      setGiftHistory([])
      return
    }
    
    setLoadingGiftHistory(true)
    try {
      console.log('[Customer Dashboard] Fetching gift history:', {
        userId,
        offset: (giftPage - 1) * giftPageSize
      })
      
      const result = await fetchUserGiftHistory((giftPage - 1) * giftPageSize)
      
      console.log('[Customer Dashboard] Gift history result:', {
        status: result.status,
        dataLength: Array.isArray(result.data) ? result.data.length : 0,
        msg: result.msg
      })
      
      if (result.status === 1 && Array.isArray(result.data)) {
        setGiftHistory(result.data)
        console.log('[Customer Dashboard] ✅ Gift history loaded:', result.data.length)
      } else {
        console.warn('[Customer Dashboard] ⚠️ No gift history or invalid response:', result)
        setGiftHistory([])
      }
    } catch (err) {
      console.error('[Customer Dashboard] Error fetching gift history:', err)
      setGiftHistory([])
    } finally {
      setLoadingGiftHistory(false)
    }
  }, [giftPage, giftPageSize])

  // Fetch gift history when gifts tab becomes active or page changes
  useEffect(() => {
    if (activeTab === 'gifts') {
      fetchGiftHistory()
    }
  }, [activeTab, giftPage, fetchGiftHistory])

  // Fetch courses function
  const loadCourses = useCallback(async () => {
    setLoadingCourses(true)
    try {
      const result = await fetchCourses({
        page: coursesPage,
        limit: coursesPageSize,
        offset: (coursesPage - 1) * coursesPageSize
      })
      if (result.status === 1 && Array.isArray(result.data)) {
        setCourses(result.data)
      } else {
        setCourses([])
      }
    } catch (err) {
      console.error('[Customer Dashboard] Error fetching courses:', err)
      setCourses([])
    } finally {
      setLoadingCourses(false)
    }
  }, [coursesPage, coursesPageSize])

  // Fetch courses when courses tab becomes active or page changes
  useEffect(() => {
    if (activeTab === 'courses' && coursesViewMode === 'all') {
      loadCourses()
    }
  }, [activeTab, coursesPage, loadCourses, coursesViewMode])

  // Fetch purchased courses function
  const loadPurchasedCourses = useCallback(async () => {
    setLoadingPurchasedCourses(true)
    try {
      const offset = (purchasedCoursesPage - 1) * purchasedCoursesPageSize
      const result = await fetchMyCourses(offset)
      if (result.status === 1 && Array.isArray(result.data)) {
        setPurchasedCourses(result.data)
      } else {
        setPurchasedCourses([])
      }
    } catch (err) {
      console.error('[Customer Dashboard] Error fetching purchased courses:', err)
      setPurchasedCourses([])
    } finally {
      setLoadingPurchasedCourses(false)
    }
  }, [purchasedCoursesPage, purchasedCoursesPageSize])

  // Fetch purchased courses when courses tab becomes active
  useEffect(() => {
    if (activeTab === 'courses' && coursesViewMode === 'purchased') {
      loadPurchasedCourses()
    }
  }, [activeTab, purchasedCoursesPage, loadPurchasedCourses, coursesViewMode])

  // Fetch refunds function
  const loadRefunds = useCallback(async () => {
    setLoadingRefunds(true)
    try {
      const offset = (refundsPage - 1) * refundsPageSize
      const result = await getCustomerRefunds(offset, refundsPageSize)
      if (result.status === 1 && Array.isArray(result.data)) {
        setRefunds(result.data)
        setRefundsTotal(result.total || result.data.length)
      } else {
        setRefunds([])
        setRefundsTotal(0)
      }
    } catch (err) {
      console.error('[Customer Dashboard] Error fetching refunds:', err)
      setRefunds([])
      setRefundsTotal(0)
    } finally {
      setLoadingRefunds(false)
    }
  }, [refundsPage, refundsPageSize])

  // Fetch refunds when refunds tab becomes active
  useEffect(() => {
    if (activeTab === 'refunds') {
      loadRefunds()
    }
  }, [activeTab, refundsPage, loadRefunds])

  // Load offers from API
  const loadOffers = useCallback(async () => {
    setLoadingOffers(true)
    try {
      const offset = (offersPage - 1) * offersPageSize
      const result = await fetchOffers({ offset })
      console.log('[Customer Dashboard] Offers result:', result)
      
      if (result.status === 1 && Array.isArray(result.data)) {
        setOffers(result.data)
        console.log('[Customer Dashboard] ✅ Offers loaded:', result.data.length)
      } else {
        setOffers([])
      }
    } catch (error) {
      console.error('[Customer Dashboard] Error loading offers:', error)
      setOffers([])
    } finally {
      setLoadingOffers(false)
    }
  }, [offersPage, offersPageSize])

  // Fetch offers when offers tab becomes active
  useEffect(() => {
    if (activeTab === 'offers') {
      loadOffers()
    }
  }, [activeTab, offersPage, loadOffers])

  // Load offline service categories from API
  const loadOfflineServices = useCallback(async () => {
    setLoadingOfflineServices(true)
    try {
      const offset = (offlineServicesPage - 1) * offlineServicesPageSize
      const result = await fetchOfflineServiceCategories(offset)
      console.log('[Customer Dashboard] Offline Services result:', result)
      
      if (result.status === 1 && Array.isArray(result.data)) {
        setOfflineServices(result.data)
        console.log('[Customer Dashboard] ✅ Offline Services loaded:', result.data.length)
      } else {
        setOfflineServices([])
      }
    } catch (error) {
      console.error('[Customer Dashboard] Error loading offline services:', error)
      setOfflineServices([])
    } finally {
      setLoadingOfflineServices(false)
    }
  }, [offlineServicesPage, offlineServicesPageSize])

  // Fetch offline services when tab becomes active
  useEffect(() => {
    if (activeTab === 'offline-services') {
      loadOfflineServices()
    }
  }, [activeTab, offlineServicesPage, loadOfflineServices])

  // Load offline service assigns from API
  const loadOfflineServiceAssigns = useCallback(async () => {
    setLoadingOfflineServiceAssigns(true)
    try {
      const offset = (offlineServiceAssignsPage - 1) * offlineServiceAssignsPageSize
      const result = await fetchOfflineServiceAssigns(offset)
      console.log('[Customer Dashboard] Offline Service Assigns result:', result)
      
      if (result.status === 1 && Array.isArray(result.data)) {
        setOfflineServiceAssigns(result.data)
        console.log('[Customer Dashboard] ✅ Offline Service Assigns loaded:', result.data.length)
      } else {
        setOfflineServiceAssigns([])
      }
    } catch (error) {
      console.error('[Customer Dashboard] Error loading offline service assigns:', error)
      setOfflineServiceAssigns([])
    } finally {
      setLoadingOfflineServiceAssigns(false)
    }
  }, [offlineServiceAssignsPage, offlineServiceAssignsPageSize])

  // Fetch offline service assigns when tab becomes active
  useEffect(() => {
    if (activeTab === 'service-assigns') {
      loadOfflineServiceAssigns()
    }
  }, [activeTab, offlineServiceAssignsPage, loadOfflineServiceAssigns])

  // Load offline service galleries from API
  const loadServiceGalleries = useCallback(async () => {
    setLoadingServiceGalleries(true)
    try {
      const offset = (serviceGalleriesPage - 1) * serviceGalleriesPageSize
      const result = await fetchOfflineServiceGalleries(offset)
      console.log('[Customer Dashboard] Service Galleries result:', result)
      
      if (result.status === 1 && Array.isArray(result.data)) {
        setServiceGalleries(result.data)
        console.log('[Customer Dashboard] ✅ Service Galleries loaded:', result.data.length)
      } else {
        setServiceGalleries([])
      }
    } catch (error) {
      console.error('[Customer Dashboard] Error loading service galleries:', error)
      setServiceGalleries([])
    } finally {
      setLoadingServiceGalleries(false)
    }
  }, [serviceGalleriesPage, serviceGalleriesPageSize])

  // Fetch service galleries when tab becomes active
  useEffect(() => {
    if (activeTab === 'service-gallery') {
      loadServiceGalleries()
    }
  }, [activeTab, serviceGalleriesPage, loadServiceGalleries])

  // Load offline service orders from API
  const loadOfflineOrders = useCallback(async () => {
    setLoadingOfflineOrders(true)
    try {
      const offset = (offlineOrdersPage - 1) * offlineOrdersPageSize
      const result = await fetchOfflineServiceOrders(offset)
      console.log('[Customer Dashboard] Offline Orders result:', result)
      
      if (result.status === 1 && Array.isArray(result.data)) {
        setOfflineOrders(result.data)
        console.log('[Customer Dashboard] ✅ Offline Orders loaded:', result.data.length)
      } else {
        setOfflineOrders([])
      }
    } catch (error) {
      console.error('[Customer Dashboard] Error loading offline orders:', error)
      setOfflineOrders([])
    } finally {
      setLoadingOfflineOrders(false)
    }
  }, [offlineOrdersPage, offlineOrdersPageSize])

  // Fetch offline orders when tab becomes active
  useEffect(() => {
    if (activeTab === 'offline-orders') {
      loadOfflineOrders()
    }
  }, [activeTab, offlineOrdersPage, loadOfflineOrders])

  // Load OpenAI predictions from API
  const loadAiPredictions = useCallback(async () => {
    setLoadingAiPredictions(true)
    try {
      const offset = (aiPredictionsPage - 1) * aiPredictionsPageSize
      const result = await fetchOpenAiPredictions(offset)
      console.log('[Customer Dashboard] AI Predictions result:', result)
      
      if (result.status === 1 && Array.isArray(result.data)) {
        setAiPredictions(result.data)
        console.log('[Customer Dashboard] ✅ AI Predictions loaded:', result.data.length)
      } else {
        setAiPredictions([])
      }
    } catch (error) {
      console.error('[Customer Dashboard] Error loading AI predictions:', error)
      setAiPredictions([])
    } finally {
      setLoadingAiPredictions(false)
    }
  }, [aiPredictionsPage, aiPredictionsPageSize])

  // Fetch AI predictions when tab becomes active
  useEffect(() => {
    if (activeTab === 'ai-predictions') {
      loadAiPredictions()
    }
  }, [activeTab, aiPredictionsPage, loadAiPredictions])

  // Load OpenAI profiles from API
  const loadAiProfiles = useCallback(async () => {
    setLoadingAiProfiles(true)
    try {
      const offset = (aiProfilesPage - 1) * aiProfilesPageSize
      const result = await fetchOpenAiProfiles(offset)
      console.log('[Customer Dashboard] AI Profiles result:', result)
      
      if (result.status === 1 && Array.isArray(result.data)) {
        setAiProfiles(result.data)
        console.log('[Customer Dashboard] ✅ AI Profiles loaded:', result.data.length)
      } else {
        setAiProfiles([])
      }
    } catch (error) {
      console.error('[Customer Dashboard] Error loading AI profiles:', error)
      setAiProfiles([])
    } finally {
      setLoadingAiProfiles(false)
    }
  }, [aiProfilesPage, aiProfilesPageSize])

  // Fetch AI profiles when tab becomes active
  useEffect(() => {
    if (activeTab === 'ai-profiles') {
      loadAiProfiles()
    }
  }, [activeTab, aiProfilesPage, loadAiProfiles])

  // Load our services from API
  const loadOurServices = useCallback(async () => {
    setLoadingOurServices(true)
    try {
      const offset = (ourServicesPage - 1) * ourServicesPageSize
      const result = await fetchOurServices(offset)
      console.log('[Customer Dashboard] Our Services result:', result)
      
      if (result.status === 1 && Array.isArray(result.data)) {
        setOurServices(result.data)
        console.log('[Customer Dashboard] ✅ Our Services loaded:', result.data.length)
      } else {
        setOurServices([])
      }
    } catch (error) {
      console.error('[Customer Dashboard] Error loading our services:', error)
      setOurServices([])
    } finally {
      setLoadingOurServices(false)
    }
  }, [ourServicesPage, ourServicesPageSize])

  // Fetch our services when tab becomes active
  useEffect(() => {
    if (activeTab === 'our-services') {
      loadOurServices()
    }
  }, [activeTab, ourServicesPage, loadOurServices])

  // Load packages from API
  const loadPackages = useCallback(async () => {
    setLoadingPackages(true)
    try {
      const offset = (packagesPage - 1) * packagesPageSize
      const result = await fetchPackages(offset)
      console.log('[Customer Dashboard] Packages result:', result)
      
      if (result.status === 1 && Array.isArray(result.data)) {
        setPackages(result.data)
        console.log('[Customer Dashboard] ✅ Packages loaded:', result.data.length)
      } else {
        setPackages([])
      }
    } catch (error) {
      console.error('[Customer Dashboard] Error loading packages:', error)
      setPackages([])
    } finally {
      setLoadingPackages(false)
    }
  }, [packagesPage, packagesPageSize])

  // Fetch packages when tab becomes active
  useEffect(() => {
    if (activeTab === 'packages') {
      loadPackages()
    }
  }, [activeTab, packagesPage, loadPackages])

  // Fetch cover images function
  const loadCoverImages = useCallback(async () => {
    setLoadingCoverImages(true)
    try {
      const result = await getCoverImages()
      if (result.status === 1 && Array.isArray(result.data)) {
        setCoverImages(result.data)
      } else {
        setCoverImages([])
      }
    } catch (err) {
      console.error('[Customer Dashboard] Error fetching cover images:', err)
      setCoverImages([])
    } finally {
      setLoadingCoverImages(false)
    }
  }, [])

  // Load cover images when profile tab is active and selector is shown
  useEffect(() => {
    if (showCoverSelector && coverImages.length === 0) {
      loadCoverImages()
    }
  }, [showCoverSelector, coverImages.length, loadCoverImages])

  // Set selected cover image from user data
  useEffect(() => {
    if (userData?.cover_img) {
      setSelectedCoverImage(userData.cover_img)
    }
  }, [userData?.cover_img])

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    try {
      const user = getCurrentUser()
      if (!user || !user.user_uni_id) {
        alert('Please login to update profile')
        return
      }

      // Validate required fields
      if (!profileData.name || !profileData.email || !profileData.phone || 
          !profileData.gender || !profileData.birthDate || !profileData.birthTime || 
          !profileData.placeOfBirth) {
        alert('Please fill all required fields')
        return
      }

      // Format birth_time to HH:mm:ss format (backend requires this format)
      let formattedBirthTime = profileData.birthTime
      if (formattedBirthTime && !formattedBirthTime.includes(':')) {
        // If time is not in correct format, use default
        formattedBirthTime = '00:00:00'
      } else if (formattedBirthTime && formattedBirthTime.split(':').length === 2) {
        // Convert HH:mm to HH:mm:ss
        formattedBirthTime = `${formattedBirthTime}:00`
      } else if (!formattedBirthTime) {
        // Default to midnight if not provided
        formattedBirthTime = '00:00:00'
      }

      // Helper function to safely trim strings (handle numbers and null/undefined)
      const safeTrim = (value) => {
        if (value === null || value === undefined) return ''
        return String(value).trim()
      }

      // Format birth date and time
      const updateData = {
        name: safeTrim(profileData.name),
        email: safeTrim(profileData.email),
        phone: safeTrim(profileData.phone),
        gender: profileData.gender,
        birth_date: profileData.birthDate,
        birth_time: formattedBirthTime, // HH:mm:ss format
        birth_place: safeTrim(profileData.placeOfBirth),
        profileImage: selectedProfileImage, // Add selected image file
        cover_img: selectedCoverImage // Add selected cover image
      }

      // CRITICAL: Verify user is actually a customer before calling customer endpoint
      const currentUser = getCurrentUser()
      
      // Validate user exists and has required credentials
      if (!currentUser) {
        alert('Error: User not logged in. Please login again.')
        return
      }
      
      // Extract API key using helper function
      const apiKey = getUserApiKey(currentUser)
      const userId = currentUser?.user_uni_id || currentUser?.customer_uni_id || ''
      
      // Validate API key and user ID before making request
      if (!apiKey || !userId) {
        console.error('[Customer Dashboard] Missing credentials:', {
          hasApiKey: !!apiKey,
          hasUserId: !!userId,
          userKeys: Object.keys(currentUser)
        })
        alert('Error: Missing authentication credentials. Please login again.')
        return
      }
      
      const userRole = currentUser?.role_id || currentUser?.type
      const isVendor = userRole === 5 || userRole === 'Vendor' || currentUser?.type === 'Vendor'
      
      console.log('[Customer Dashboard] User check before update:', {
        user_uni_id: currentUser?.user_uni_id,
        customer_uni_id: currentUser?.customer_uni_id,
        role_id: userRole,
        type: currentUser?.type,
        isVendor: isVendor,
        userId: userId,
        userIdPrefix: userId ? userId.substring(0, 3) : 'MISSING', // Check if VEND or CUS
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey ? apiKey.length : 0
      })
      
      if (isVendor) {
        console.log('[Customer Dashboard] Vendor detected during profile update, redirecting...')
        navigate('/vendor-dashboard', { replace: true })
        return
      }
      
      // CRITICAL: Verify ID format - customer IDs should start with CUS, not VEND
      if (userId && userId.startsWith('VEND')) {
        console.error('[Customer Dashboard] ❌ CRITICAL: Vendor ID detected in customer endpoint!', {
          userId: userId,
          userRole: userRole,
          type: currentUser?.type
        })
        alert('Error: Invalid user type. Please login as a customer.')
        return
      }

      console.log('[Customer Dashboard] Updating profile with data:', updateData)

      const result = await updateCustomerProfile(updateData)
      console.log('[Customer Dashboard] Update profile result (FULL):', JSON.stringify(result, null, 2))
      console.log('[Customer Dashboard] Update profile result status:', result?.status)
      console.log('[Customer Dashboard] Update profile result msg:', result?.msg)
      console.log('[Customer Dashboard] Update profile result errors:', result?.errors)
      
      if (result.status === 1) {
        alert('Profile updated successfully!')
        
        // Extract customer_img from response - check multiple possible locations
        let updatedCustomerImg = null
        
        // Check result.data.customer_img (direct)
        if (result.data?.customer_img) {
          updatedCustomerImg = result.data.customer_img
          console.log('[Customer Dashboard] Found customer_img in result.data.customer_img:', updatedCustomerImg)
        }
        // Check result.data.user_data.customer_img
        else if (result.data?.user_data?.customer_img) {
          updatedCustomerImg = result.data.user_data.customer_img
          console.log('[Customer Dashboard] Found customer_img in result.data.user_data.customer_img:', updatedCustomerImg)
        }
        // Check result.customer_img (root level)
        else if (result.customer_img) {
          updatedCustomerImg = result.customer_img
          console.log('[Customer Dashboard] Found customer_img in result.customer_img:', updatedCustomerImg)
        }
        // Check result.data (if it's the customer_img directly)
        else if (result.data && typeof result.data === 'string' && result.data.includes('uploads/customers')) {
          updatedCustomerImg = result.data
          console.log('[Customer Dashboard] Found customer_img in result.data (string):', updatedCustomerImg)
        }
        
        console.log('[Customer Dashboard] Extracted customer_img:', updatedCustomerImg)
        console.log('[Customer Dashboard] Image validation:', {
          hasImage: !!updatedCustomerImg,
          isStatic: updatedCustomerImg ? (updatedCustomerImg.includes('customer.png') || updatedCustomerImg.includes('62096.png') || updatedCustomerImg.includes('karmleela.com/assets/img/customer.png')) : false,
          isDataUri: updatedCustomerImg ? updatedCustomerImg.startsWith('data:') : false,
          isHttp: updatedCustomerImg ? updatedCustomerImg.startsWith('http') : false,
          containsUploads: updatedCustomerImg ? updatedCustomerImg.includes('uploads/customers') : false
        })
        
        // Only proceed if we have a valid non-static image URL
        if (updatedCustomerImg && 
            !updatedCustomerImg.includes('customer.png') && 
            !updatedCustomerImg.includes('62096.png') &&
            !updatedCustomerImg.includes('karmleela.com/assets/img/customer.png') &&
            !updatedCustomerImg.startsWith('data:image/svg')) {
          
          // Update localStorage user data
          const updatedUser = { 
            ...user, 
            ...result.data,
            customer_img: updatedCustomerImg // Use the extracted image URL
          }
          localStorage.setItem('user', JSON.stringify(updatedUser))
          console.log('[Customer Dashboard] ✅ Updated localStorage user with image:', updatedCustomerImg)
          
          // Dispatch custom event to notify UserDropdown of profile update
          window.dispatchEvent(new Event('userProfileUpdated'))
          
          // Update userData state with new image URL - FORCE UPDATE
          setUserData(prev => {
            const newUserData = {
              ...prev,
              ...updatedUser,
              customer_img: updatedCustomerImg // Force use the new image URL
            }
            console.log('[Customer Dashboard] ✅ Updated userData state with image:', updatedCustomerImg)
            console.log('[Customer Dashboard] userData.customer_img after update:', newUserData.customer_img)
            return newUserData
          })
          
          // Force image refresh by updating key immediately
          setImageRefreshKey(prev => {
            const newKey = prev + 1
            console.log('[Customer Dashboard] ✅ Updated imageRefreshKey to:', newKey)
            return newKey
          })
        } else {
          console.warn('[Customer Dashboard] ⚠️ Extracted image is invalid/static, not updating:', updatedCustomerImg)
          
          // Still update other user data, but keep existing image
          const updatedUser = { 
            ...user, 
            ...result.data
            // Don't update customer_img if it's invalid
          }
          localStorage.setItem('user', JSON.stringify(updatedUser))
        }
        
        // If image was uploaded, clear preview to use the new backend URL
        if (selectedProfileImage) {
          setProfileImagePreview(null) // Clear preview, use backend URL
          console.log('[Customer Dashboard] Cleared profileImagePreview, will use backend URL')
        }
        
        // Clear selected image after successful update
        setSelectedProfileImage(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        
        // Wait a bit then refresh dashboard data to get latest image URL
        // Use multiple attempts to ensure we get the updated image
        let refreshAttempts = 0
        const maxAttempts = 3
        
        const refreshImage = async () => {
          try {
            refreshAttempts++
            console.log(`[Customer Dashboard] Dashboard refresh attempt ${refreshAttempts}/${maxAttempts}`)
            
            const dashboardResult = await getCustomerDashboard(user.user_uni_id)
            console.log('[Customer Dashboard] Dashboard refresh result:', dashboardResult)
            
            if (dashboardResult.status === 1 && dashboardResult.data?.customer_profile?.customer_img) {
              const latestImg = dashboardResult.data.customer_profile.customer_img
              console.log('[Customer Dashboard] Latest image URL from backend:', latestImg)
              
              // Only update if it's a valid image URL (not SVG or static default)
              if (latestImg && 
                  !latestImg.includes('data:image/svg') && 
                  !latestImg.includes('62096.png') &&
                  !latestImg.includes('customer.png') &&
                  !latestImg.includes('karmleela.com/uploads/setting') &&
                  !latestImg.includes('karmleela.com/assets/img/customer.png') &&
                  latestImg.includes('uploads/customers/')) { // Must contain uploads/customers/ to be valid
                
                setUserData(prev => {
                  const newData = {
                    ...prev,
                    customer_img: latestImg
                  }
                  console.log('[Customer Dashboard] ✅ Updated userData with latest image:', latestImg)
                  return newData
                })
                
                // Update localStorage with latest image
                const currentUser = getCurrentUser()
                if (currentUser) {
                  const latestUser = { ...currentUser, customer_img: latestImg }
                  localStorage.setItem('user', JSON.stringify(latestUser))
                  console.log('[Customer Dashboard] ✅ Updated localStorage with latest image')
                }
                
                // Dispatch event to notify UserDropdown
                window.dispatchEvent(new Event('userProfileUpdated'))
                
                // Force image refresh by updating key
                setImageRefreshKey(prev => {
                  const newKey = prev + 1
                  console.log('[Customer Dashboard] ✅ Updated imageRefreshKey to:', newKey)
                  return newKey
                })
                console.log('[Customer Dashboard] ✅ Image updated successfully from dashboard refresh:', latestImg)
              } else {
                console.warn('[Customer Dashboard] ⚠️ Latest image is invalid/static:', latestImg)
                // Retry if we haven't reached max attempts and image is still invalid
                if (refreshAttempts < maxAttempts && (!latestImg || latestImg.includes('customer.png') || latestImg.includes('62096.png'))) {
                  console.log(`[Customer Dashboard] Retrying in 2 seconds... (attempt ${refreshAttempts + 1}/${maxAttempts})`)
                  setTimeout(refreshImage, 2000)
                }
              }
            } else {
              console.warn('[Customer Dashboard] ⚠️ No customer_profile.customer_img in dashboard response')
              // Retry if we haven't reached max attempts
              if (refreshAttempts < maxAttempts) {
                console.log(`[Customer Dashboard] Retrying in 2 seconds... (attempt ${refreshAttempts + 1}/${maxAttempts})`)
                setTimeout(refreshImage, 2000)
              }
            }
          } catch (refreshError) {
            console.warn('[Customer Dashboard] Failed to refresh dashboard data:', refreshError)
            // Retry if we haven't reached max attempts
            if (refreshAttempts < maxAttempts) {
              console.log(`[Customer Dashboard] Retrying after error in 2 seconds... (attempt ${refreshAttempts + 1}/${maxAttempts})`)
              setTimeout(refreshImage, 2000)
            }
          }
        }
        
        // Start refresh after 1 second
        setTimeout(refreshImage, 1000)
        
        // Force image refresh
        if (selectedProfileImage) {
          setImageRefreshKey(prev => prev + 1)
        }
      } else {
        // Show detailed error message
        let errorMsg = result.msg || result.message || 'Failed to update profile'
        
        // If there are validation errors, include them
        if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
          const validationErrors = result.errors.map(err => {
            if (typeof err === 'string') return err
            if (err.message) return err.message
            if (err.msg) return err.msg
            return JSON.stringify(err)
          }).join('\n')
          errorMsg = `${errorMsg}\n\nValidation Errors:\n${validationErrors}`
        }
        
        console.error('[Customer Dashboard] Profile update failed:', {
          status: result.status,
          msg: result.msg,
          message: result.message,
          errors: result.errors,
          fullResult: result
        })
        alert(`Error: ${errorMsg}`)
      }
    } catch (error) {
      console.error('[Customer Dashboard] Exception during profile update:', error)
      console.error('[Customer Dashboard] Error stack:', error.stack)
      alert(`Error updating profile: ${error.message || 'An unexpected error occurred. Please check console for details.'}`)
    }
  }

  const handleRecharge = (amount) => {
    setRechargeAmount(amount)
  }

  // Fetch recharge vouchers
  const fetchRechargeVouchers = useCallback(async () => {
    const currentUser = getCurrentUser()
    if (!currentUser || !currentUser.api_key || !currentUser.user_uni_id) {
      setRechargeVouchers([])
      return
    }
    
    try {
      const result = await getRechargeVouchers()
      if (result.status === 1 && Array.isArray(result.data)) {
        setRechargeVouchers(result.data)
        // Update wallet balance from response
        if (result.wallet !== undefined) {
          setWalletBalance(result.wallet)
        }
      } else {
        setRechargeVouchers([])
      }
    } catch (err) {
      console.error('[Customer Dashboard] Error fetching recharge vouchers:', err)
      setRechargeVouchers([])
    }
  }, [])

  // Fetch payment gateways from backend
  const fetchPaymentGateways = useCallback(async () => {
    setLoadingPaymentGateways(true)
    try {
      const result = await fetchWelcomeData()
      if (result.status === 1 && result.data && result.data.payment) {
        const paymentData = result.data.payment
        const gateways = []
        
        // Map backend payment gateway names to frontend values
        // Note: Backend expects specific case (Payu, PhonePe, CCAvenue, etc.)
        const gatewayMap = {
          'razorpay': { value: 'razorpay', backendValue: 'razorpay', label: 'Razorpay' },
          'phonepe': { value: 'phonepe', backendValue: 'PhonePe', label: 'PhonePe' },
          'ccavenue': { value: 'ccavenue', backendValue: 'CCAvenue', label: 'CCAvenue' },
          'cashfree': { value: 'cashfree', backendValue: 'Cashfree', label: 'Cashfree' },
          'payu': { value: 'payu', backendValue: 'Payu', label: 'PayU' },
          'paypal': { value: 'paypal', backendValue: 'Paypal', label: 'PayPal' }
        }
        
        // Check each gateway and add if active
        Object.keys(gatewayMap).forEach(key => {
          if (paymentData[key] === true) {
            gateways.push(gatewayMap[key])
          }
        })
        
        console.log('[Customer Dashboard] Available payment gateways:', gateways)
        setAvailablePaymentGateways(gateways)
        
        // Set default gateway if available (only if current selection is not valid)
        if (gateways.length > 0) {
          const currentGatewayExists = gateways.find(g => g.value === selectedPaymentGateway)
          if (!currentGatewayExists) {
            const defaultGateway = paymentData.default_payment_gateway 
              ? gateways.find(g => g.value === paymentData.default_payment_gateway.toLowerCase()) || gateways[0]
              : gateways[0]
            setSelectedPaymentGateway(defaultGateway.value)
            console.log('[Customer Dashboard] Default payment gateway set to:', defaultGateway.value)
          }
        }
      } else {
        // Fallback to default gateways if API fails
        console.warn('[Customer Dashboard] Failed to fetch payment gateways, using defaults')
        setAvailablePaymentGateways([
          { value: 'razorpay', label: 'Razorpay' },
          { value: 'payu', label: 'PayU' },
          { value: 'phonepe', label: 'PhonePe' },
          { value: 'cashfree', label: 'Cashfree' },
          { value: 'ccavenue', label: 'CCAvenue' }
        ])
      }
    } catch (err) {
      console.error('[Customer Dashboard] Error fetching payment gateways:', err)
      // Fallback to default gateways on error
      setAvailablePaymentGateways([
        { value: 'razorpay', label: 'Razorpay' },
        { value: 'payu', label: 'PayU' },
        { value: 'phonepe', label: 'PhonePe' },
        { value: 'cashfree', label: 'Cashfree' },
        { value: 'ccavenue', label: 'CCAvenue' }
      ])
    } finally {
      setLoadingPaymentGateways(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Remove selectedPaymentGateway from deps to avoid infinite loop

  // Fetch recharge vouchers when wallet tab becomes active
  useEffect(() => {
    if (activeTab === 'wallet') {
      fetchRechargeVouchers()
      fetchPaymentGateways()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]) // Only depend on activeTab to avoid infinite loop

  // Handle recharge button click
  const handleRechargeSubmit = async (e) => {
    e?.preventDefault?.() // Prevent form submission if button is in a form
    e?.stopPropagation?.() // Stop event bubbling
    
    console.log('[Customer Dashboard] ===== RECHARGE BUTTON CLICKED =====')
    console.log('[Customer Dashboard] rechargeAmount:', rechargeAmount)
    console.log('[Customer Dashboard] loadingRecharge:', loadingRecharge)
    
    const currentUser = getCurrentUser()
    console.log('[Customer Dashboard] Current user:', currentUser ? 'Logged in' : 'Not logged in')
    
    if (!currentUser || !currentUser.api_key || !currentUser.user_uni_id) {
      alert('Please login to recharge wallet')
      return
    }

    const amount = parseFloat(rechargeAmount)
    console.log('[Customer Dashboard] Parsed amount:', amount)
    
    if (!amount || amount <= 0 || isNaN(amount)) {
      alert('Please enter a valid recharge amount')
      return
    }

    // Find matching voucher or use first available voucher
    let selectedVoucher = null
    
    // First, try to find exact match
    selectedVoucher = rechargeVouchers.find(v => parseFloat(v.wallet_amount) === amount)
    
    // If no exact match, try to find closest match
    if (!selectedVoucher && rechargeVouchers.length > 0) {
      // For custom amounts, we might need to use a voucher that allows custom amounts
      // For now, use the first voucher as fallback (backend might handle custom amounts)
      selectedVoucher = rechargeVouchers[0]
    }

    if (!selectedVoucher && rechargeVouchers.length === 0) {
      alert('No recharge options available. Please try again later.')
      return
    }

    setLoadingRecharge(true)
    console.log('[Customer Dashboard] ===== STARTING RECHARGE =====')
    console.log('[Customer Dashboard] Amount:', amount)
    console.log('[Customer Dashboard] Payment Gateway:', selectedPaymentGateway)
    console.log('[Customer Dashboard] Voucher ID:', selectedVoucher?.id)
    
    try {
      // Map frontend gateway value to backend expected format
      const gatewayBackendMap = {
        'razorpay': 'razorpay',
        'payu': 'Payu',        // Backend expects 'Payu' (capital P)
        'phonepe': 'PhonePe',  // Backend expects 'PhonePe'
        'cashfree': 'Cashfree', // Backend expects 'Cashfree'
        'ccavenue': 'CCAvenue'  // Backend expects 'CCAvenue'
      }
      
      const backendPaymentMethod = gatewayBackendMap[selectedPaymentGateway] || selectedPaymentGateway
      
      // Use selected payment gateway
      console.log('[Customer Dashboard] Calling proceedPaymentRequest API...')
      console.log('[Customer Dashboard] Frontend gateway:', selectedPaymentGateway)
      console.log('[Customer Dashboard] Backend gateway:', backendPaymentMethod)
      const paymentResult = await proceedPaymentRequest({
        payment_method: backendPaymentMethod, // Map to backend expected format
        wallet_id: selectedVoucher.id,
        amount: amount, // Custom amount if different from voucher amount
        is_updated: false
      })
      
      console.log('[Customer Dashboard] proceedPaymentRequest response:', paymentResult)
      console.log('[Customer Dashboard] Response status:', paymentResult?.status)
      console.log('[Customer Dashboard] Full response:', JSON.stringify(paymentResult, null, 2))
      
      if (paymentResult.status === 1) {
        console.log('[Customer Dashboard] ✅ Payment result status is 1')
        console.log('[Customer Dashboard] Selected Payment Gateway:', selectedPaymentGateway)
        console.log('[Customer Dashboard] Available keys in response:', Object.keys(paymentResult))
        console.log('[Customer Dashboard] Full response:', JSON.stringify(paymentResult, null, 2))
        
        // Handle based on selected payment gateway
        if (selectedPaymentGateway === 'razorpay') {
          // Handle Razorpay payment
          const responseData = paymentResult.data || paymentResult
          const orderId = responseData?.order_id
          const razorpayId = responseData?.razorpay_id
          
          console.log('[Customer Dashboard] Razorpay - order_id:', orderId)
          console.log('[Customer Dashboard] Razorpay - razorpay_id:', razorpayId ? 'Present' : 'Missing')
          
          if (orderId && razorpayId) {
            console.log('[Customer Dashboard] ✅ All Razorpay data is valid')
            
            // Prepare razorpay data object for Razorpay SDK
            const finalRazorpayData = {
              order_id: orderId,
              key: razorpayId, // razorpay_id is the key
              amount: responseData.amount ? (responseData.amount * 100) : (amount * 100), // Convert to paise
              currency: responseData.currency_code || 'INR'
            }
            
            console.log('[Customer Dashboard] Final Razorpay data:', JSON.stringify(finalRazorpayData, null, 2))
            
            // Load Razorpay script if not already loaded
            if (!window.Razorpay) {
              console.log('[Customer Dashboard] Loading Razorpay script...')
              const script = document.createElement('script')
              script.src = 'https://checkout.razorpay.com/v1/checkout.js'
              script.onload = () => {
                console.log('[Customer Dashboard] ✅ Razorpay script loaded successfully')
                initializeRazorpay(finalRazorpayData, amount, currentUser)
              }
              script.onerror = (error) => {
                console.error('[Customer Dashboard] ❌ Failed to load Razorpay script:', error)
                alert('Failed to load Razorpay payment gateway. Please try again.')
                setLoadingRecharge(false)
              }
              document.body.appendChild(script)
            } else {
              console.log('[Customer Dashboard] ✅ Razorpay already loaded, initializing...')
              initializeRazorpay(finalRazorpayData, amount, currentUser)
            }
            
            function initializeRazorpay(razorpayData, amount, currentUser) {
              const originalOrderId = razorpayData.order_id
              console.log('[Customer Dashboard] ===== INITIALIZING RAZORPAY =====')
              console.log('[Customer Dashboard] Order ID:', originalOrderId)
              console.log('[Customer Dashboard] Amount:', razorpayData.amount)
              console.log('[Customer Dashboard] Key:', razorpayData.key ? 'Present' : 'Missing')
              
              const options = {
                key: razorpayData.key,
                amount: razorpayData.amount,
                currency: razorpayData.currency || 'INR',
                name: 'Astrology Wallet Recharge',
                description: `Recharge wallet with ₹${amount}`,
                order_id: originalOrderId,
                handler: async function (response) {
                  console.log('[Customer Dashboard] ===== PAYMENT SUCCESS HANDLER CALLED =====')
                  console.log('[Customer Dashboard] Full Razorpay response:', JSON.stringify(response, null, 2))
                  
                  try {
                    const orderIdToUse = response.razorpay_order_id || originalOrderId
                    console.log('[Customer Dashboard] Using order_id for update:', orderIdToUse)
                    
                    const updateResult = await updateOnlinePayment({
                      payment_method: 'razorpay',
                      order_id: orderIdToUse,
                      payment_id: response.razorpay_payment_id,
                      signature: response.razorpay_signature,
                      order_status: 'success',
                      is_razorpay_webhook: false
                    })
                    
                    console.log('[Customer Dashboard] Payment update result:', updateResult)
                    
                    if (updateResult.status === 1) {
                      alert('Wallet recharged successfully!')
                      const balanceResult = await getWalletBalance(currentUser.user_uni_id)
                      if (balanceResult.status === 1) {
                        setWalletBalance(balanceResult.data || 0)
                      }
                      fetchRechargeVouchers()
                      setTimeout(() => {
                        fetchWalletTransactions()
                      }, 2000)
                      setRechargeAmount('')
                    } else {
                      alert(updateResult.msg || 'Payment verification failed')
                    }
                  } catch (error) {
                    console.error('[Customer Dashboard] Error updating payment:', error)
                    alert('Error verifying payment. Please contact support.')
                  }
                },
                prefill: {
                  name: currentUser.name || '',
                  email: currentUser.email || '',
                  contact: currentUser.phone || ''
                },
                theme: {
                  color: '#3399cc'
                },
                modal: {
                  ondismiss: function() {
                    console.log('[Customer Dashboard] Razorpay modal dismissed by user')
                    setLoadingRecharge(false)
                  }
                }
              }
              
              try {
                const razorpay = new window.Razorpay(options)
                console.log('[Customer Dashboard] Razorpay instance created, opening payment modal...')
                razorpay.open()
              } catch (error) {
                console.error('[Customer Dashboard] Error creating/opening Razorpay:', error)
                alert('Error opening payment gateway: ' + error.message)
                setLoadingRecharge(false)
              }
            }
            return; // Exit function - Razorpay modal is open
          } else {
            console.log('[Customer Dashboard] ❌ Razorpay data incomplete')
            alert('Razorpay payment data is incomplete. Please try again or contact support.')
            setLoadingRecharge(false)
            return
          }
        } else if (selectedPaymentGateway === 'payu') {
          // Handle PayU payment
          console.log('[Customer Dashboard] Processing PayU payment...')
          console.log('[Customer Dashboard] PayU - paymentResult keys:', Object.keys(paymentResult))
          console.log('[Customer Dashboard] PayU - payu_data:', paymentResult.payu_data)
          
          if (paymentResult.payu_data) {
            const payuUrl = paymentResult.payu_data.paymentLink || 
                           paymentResult.payu_data.payment_url ||
                           paymentResult.payu_data.url
            if (payuUrl) {
              console.log('[Customer Dashboard] PayU payment URL found:', payuUrl)
              console.log('[Customer Dashboard] Redirecting to PayU payment page...')
              window.location.href = payuUrl
              return
            } else {
              console.error('[Customer Dashboard] PayU payment URL not found in response')
              console.log('[Customer Dashboard] PayU data structure:', JSON.stringify(paymentResult.payu_data, null, 2))
              alert('PayU payment link not found. Please try again or contact support.')
              setLoadingRecharge(false)
              return
            }
          } else {
            console.error('[Customer Dashboard] PayU data not found in response')
            console.log('[Customer Dashboard] Full paymentResult:', JSON.stringify(paymentResult, null, 2))
            alert('PayU payment data not found. Please try again or contact support.')
            setLoadingRecharge(false)
            return
          }
        } else if (selectedPaymentGateway === 'phonepe') {
          // Handle PhonePe payment
          console.log('[Customer Dashboard] Processing PhonePe payment...')
          if (paymentResult.phonepe_data) {
            const phonepeUrl = paymentResult.phonepe_data.paymentUrl || 
                              paymentResult.phonepe_data.paymentLink || 
                              paymentResult.phonepe_data.redirectUrl
            if (phonepeUrl) {
              console.log('[Customer Dashboard] PhonePe payment URL found, redirecting...')
              window.location.href = phonepeUrl
              return
            } else {
              console.error('[Customer Dashboard] PhonePe payment URL not found in response')
              console.log('[Customer Dashboard] PhonePe data:', paymentResult.phonepe_data)
              alert('PhonePe payment URL not found. Please try again or contact support.')
              setLoadingRecharge(false)
              return
            }
          } else {
            console.error('[Customer Dashboard] PhonePe data not found in response')
            alert('PhonePe payment data not found. Please try again or contact support.')
            setLoadingRecharge(false)
            return
          }
        } else if (selectedPaymentGateway === 'cashfree') {
          // Handle Cashfree payment
          console.log('[Customer Dashboard] Processing Cashfree payment...')
          if (paymentResult.cashfree_data) {
            const cashfreeUrl = paymentResult.cashfree_data.paymentLink || 
                               paymentResult.cashfree_data.payment_url ||
                               paymentResult.cashfree_data.url
            if (cashfreeUrl) {
              console.log('[Customer Dashboard] Cashfree payment URL found, redirecting...')
              window.location.href = cashfreeUrl
              return
            } else {
              console.error('[Customer Dashboard] Cashfree payment URL not found in response')
              console.log('[Customer Dashboard] Cashfree data:', paymentResult.cashfree_data)
              alert('Cashfree payment URL not found. Please try again or contact support.')
              setLoadingRecharge(false)
              return
            }
          } else {
            console.error('[Customer Dashboard] Cashfree data not found in response')
            alert('Cashfree payment data not found. Please try again or contact support.')
            setLoadingRecharge(false)
            return
          }
        } else if (selectedPaymentGateway === 'ccavenue') {
          // Handle CCAvenue payment
          console.log('[Customer Dashboard] Processing CCAvenue payment...')
          if (paymentResult.ccavenue_data && paymentResult.ccavenue_data.enc_val) {
            console.log('[Customer Dashboard] CCAvenue data found, redirecting to payment page...')
            // CCAvenue requires form submission with encrypted data
            const form = document.createElement('form')
            form.method = 'POST'
            form.action = 'https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction'
            
            Object.keys(paymentResult.ccavenue_data).forEach(key => {
              const input = document.createElement('input')
              input.type = 'hidden'
              input.name = key
              input.value = paymentResult.ccavenue_data[key]
              form.appendChild(input)
            })
            
            document.body.appendChild(form)
            form.submit()
            return
          } else {
            console.error('[Customer Dashboard] CCAvenue data not found in response')
            alert('CCAvenue payment data not found. Please try again or contact support.')
            setLoadingRecharge(false)
            return
          }
        } else {
          console.error('[Customer Dashboard] Unknown payment gateway:', selectedPaymentGateway)
          alert(`Payment gateway "${selectedPaymentGateway}" is not supported. Please select a different gateway.`)
          setLoadingRecharge(false)
          return
        }
      } else {
        console.log('[Customer Dashboard] ❌ Payment result status is not 1')
        console.log('[Customer Dashboard] Error message:', paymentResult.msg)
        console.log('[Customer Dashboard] Full error response:', paymentResult)
        
        // Parse error message to show user-friendly message
        let errorMessage = paymentResult.msg || 'Failed to initiate payment. Please try again.'
        
        // Check if error contains gateway configuration issues
        try {
          const errorText = paymentResult.msg || ''
          const errorObj = paymentResult.error || null // Direct error object from API
          
          console.log('[Customer Dashboard] Parsing error:', {
            errorText,
            errorObj,
            hasErrorObj: !!errorObj
          })
          
          // Check direct error object first (from API response)
          if (errorObj) {
            // Check for BLOCKED_MERCHANT or Invalid Merchant errors
            if (errorObj.code === 'BLOCKED_MERCHANT' || 
                errorObj.message?.includes('Invalid Merchant') ||
                errorObj.message?.includes('blacklisted') ||
                errorObj.message?.includes('disabled') ||
                errorObj.message?.includes('not present')) {
              errorMessage = `${selectedPaymentGateway.charAt(0).toUpperCase() + selectedPaymentGateway.slice(1)} payment gateway is not configured or merchant account is invalid/disabled. Please try Razorpay or contact support.`
            } else if (errorObj.message) {
              // Use specific error message from error object
              errorMessage = `${selectedPaymentGateway.charAt(0).toUpperCase() + selectedPaymentGateway.slice(1)}: ${errorObj.message}. Please try another payment method.`
            } else if (errorObj.code) {
              errorMessage = `${selectedPaymentGateway.charAt(0).toUpperCase() + selectedPaymentGateway.slice(1)} error (${errorObj.code}). Please try another payment method.`
            }
          } else {
            // Fallback: Try to parse nested JSON error if present in error text
            let parsedError = null
            try {
              // Check if errorText contains JSON
              if (errorText.includes('{') && errorText.includes('}')) {
                // Extract JSON from error text
                const jsonMatch = errorText.match(/\{.*\}/s)
                if (jsonMatch) {
                  parsedError = JSON.parse(jsonMatch[0])
                }
              }
            } catch (jsonParseError) {
              console.log('[Customer Dashboard] Could not parse error JSON, using text error')
            }
            
            // Check for BLOCKED_MERCHANT or Invalid Merchant errors in parsed JSON
            if (errorText.includes('BLOCKED_MERCHANT') || errorText.includes('Invalid Merchant') || 
                parsedError?.error?.code === 'BLOCKED_MERCHANT' || 
                parsedError?.error?.message?.includes('Invalid Merchant')) {
              errorMessage = `${selectedPaymentGateway.charAt(0).toUpperCase() + selectedPaymentGateway.slice(1)} payment gateway credentials are invalid or merchant account is disabled. Please contact support or try another payment method.`
            } else if (errorText.includes('Payment gateway error') || parsedError?.msg?.includes('Payment gateway error')) {
              // Extract specific error message from nested error object
              const specificError = parsedError?.error?.message || 
                                  parsedError?.error?.code || 
                                  parsedError?.msg ||
                                  errorText.match(/"message":"([^"]+)"/)?.[1]
              
              if (specificError) {
                errorMessage = `${selectedPaymentGateway.charAt(0).toUpperCase() + selectedPaymentGateway.slice(1)}: ${specificError}. Please try another payment method.`
              } else {
                errorMessage = `${selectedPaymentGateway.charAt(0).toUpperCase() + selectedPaymentGateway.slice(1)} payment gateway is temporarily unavailable. Please try another payment method.`
              }
            } else if (parsedError?.error) {
              // Use parsed error message if available
              const specificError = parsedError.error.message || parsedError.error.code || parsedError.msg
              if (specificError) {
                errorMessage = `${selectedPaymentGateway.charAt(0).toUpperCase() + selectedPaymentGateway.slice(1)}: ${specificError}. Please try another payment method.`
              }
            }
          }
        } catch (parseError) {
          console.error('[Customer Dashboard] Error parsing error message:', parseError)
          // Keep default error message
        }
        
        alert(errorMessage)
        setLoadingRecharge(false)
      }
    } catch (error) {
      console.error('[Customer Dashboard] Error processing recharge:', error)
      alert('Error processing recharge: ' + (error.message || 'Please try again'))
    } finally {
      setLoadingRecharge(false)
    }
  }

  const renderProfileSection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>Edit Profile</h2>
        <p>Update your personal information</p>
      </div>
      
      <div className="react-profile-picture-section">
        <div className="react-profile-picture">
          <img 
            key={`profile-img-${imageRefreshKey}-${userData?.customer_img || 'default'}`} // Force re-render when image URL changes
            src={(() => {
              // Priority 1: Preview image (if file selected)
              if (profileImagePreview) {
                console.log('[Customer Dashboard] Using profileImagePreview:', profileImagePreview.substring(0, 50) + '...')
                return profileImagePreview
              }
              
              // Priority 2: Backend image URL from userData
              const imgUrl = userData?.customer_img
              if (imgUrl) {
                const finalUrl = getCustomerImageUrl(imgUrl, profileData.name, imageRefreshKey > 0)
                console.log('[Customer Dashboard] Using userData.customer_img:', {
                  original: imgUrl,
                  final: finalUrl.substring(0, 100) + (finalUrl.length > 100 ? '...' : ''),
                  isSvg: finalUrl.startsWith('data:image/svg')
                })
                return finalUrl
              }
              
              // Fallback: SVG
              console.log('[Customer Dashboard] No image found, using SVG fallback')
              return getCustomerImageUrl(null, profileData.name)
            })()}
            alt="Profile"
            onError={(e) => {
              console.error('[Customer Dashboard] Image load error:', e.target.src)
              handleImageError(e, profileData.name)
            }}
          />
          <div className="react-profile-overlay">
            <i className="fas fa-camera"></i>
          </div>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              setSelectedProfileImage(file)
              // Create preview
              const reader = new FileReader()
              reader.onloadend = () => {
                setProfileImagePreview(reader.result)
              }
              reader.readAsDataURL(file)
            }
          }}
        />
        <button 
          type="button"
          className="react-btn react-btn-outline react-choose-file-btn"
          onClick={() => fileInputRef.current?.click()}
        >
          <i className="fas fa-upload"></i>
          {selectedProfileImage ? selectedProfileImage.name : 'Choose File'}
        </button>
        {selectedProfileImage && (
          <button
            type="button"
            className="react-btn react-btn-outline"
            onClick={() => {
              setSelectedProfileImage(null)
              setProfileImagePreview(null)
              if (fileInputRef.current) {
                fileInputRef.current.value = ''
              }
            }}
            style={{ marginLeft: '10px', fontSize: '12px', padding: '5px 10px' }}
          >
            <i className="fas fa-times"></i> Remove
          </button>
        )}
      </div>

      <form onSubmit={handleProfileUpdate} className="react-profile-form">
        <div className="react-form-row">
          <div className="react-form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              value={profileData.name}
              onChange={(e) => setProfileData({...profileData, name: e.target.value})}
              className="react-form-input"
            />
          </div>
          <div className="react-form-group">
            <label htmlFor="phone">Phone No.</label>
            <div className="react-phone-input-group">
              <select className="react-country-code">
                <option value="+91">+91</option>
                <option value="+1">+1</option>
              </select>
              <input
                type="tel"
                id="phone"
                value={profileData.phone}
                onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                className="react-form-input" style={{width: '100%'}}
              />
            </div>
          </div>
        </div>

        <div className="react-form-row">
          <div className="react-form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={profileData.email}
              onChange={(e) => setProfileData({...profileData, email: e.target.value})}
              className="react-form-input"
            />
          </div>
          <div className="react-form-group">
            <label>Gender</label>
            <div className="react-radio-group">
              <label className="react-radio-label">
                <input
                  type="radio"
                  name="gender"
                  value="Male"
                  checked={profileData.gender === 'Male'}
                  onChange={(e) => setProfileData({...profileData, gender: e.target.value})}
                />
                <span className="react-radio-custom"></span>
                Male
              </label>
              <label className="react-radio-label">
                <input
                  type="radio"
                  name="gender"
                  value="Female"
                  checked={profileData.gender === 'Female'}
                  onChange={(e) => setProfileData({...profileData, gender: e.target.value})}
                />
                <span className="react-radio-custom"></span>
                Female
              </label>
              <label className="react-radio-label">
                <input
                  type="radio"
                  name="gender"
                  value="Other"
                  checked={profileData.gender === 'Other'}
                  onChange={(e) => setProfileData({...profileData, gender: e.target.value})}
                />
                <span className="react-radio-custom"></span>
                Other
              </label>
            </div>
          </div>
        </div>

        <div className="react-form-row">
          <div className="react-form-group">
            <label htmlFor="birthDate">Birth Date</label>
            <div className="react-date-input-group">
              <input
                type="date"
                id="birthDate"
                value={profileData.birthDate}
                onChange={(e) => setProfileData({...profileData, birthDate: e.target.value})}
                className="react-form-input" style={{width: '100%'}}
              />
              {/* <i className="fas fa-calendar-alt"></i> */}
            </div>
          </div>
          <div className="react-form-group">
            <label htmlFor="birthTime">Birth Time</label>
            <div className="react-time-input-group">
              <input
                type="time"
                id="birthTime"
                value={profileData.birthTime}
                onChange={(e) => setProfileData({...profileData, birthTime: e.target.value})}
                className="react-form-input"
              />
              {/* <i className="fas fa-clock"></i> */}
            </div>
          </div>
        </div>

        <div className="react-form-group">
          <label htmlFor="placeOfBirth">Place Of Birth *</label>
          <input
            type="text"
            id="placeOfBirth"
            value={profileData.placeOfBirth}
            onChange={(e) => setProfileData({...profileData, placeOfBirth: e.target.value})}
            className="react-form-input"
            required
          />
        </div>

        <button type="submit" className="react-btn react-btn-primary react-update-profile-btn">
          <i className="fas fa-save"></i>
          Update Profile
        </button>
      </form>
    </div>
  )

  const renderWalletSection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>My Wallet</h2>
        <p>Manage your wallet balance and transactions</p>
      </div>

      <div className="react-wallet-balance-card">
        <div className="react-balance-info">
          <h3>Available Funds</h3>
          <div className="react-balance-amount">₹{walletBalance}</div>
        </div>
        <div className="react-balance-icon">
          <i className="fas fa-wallet"></i>
        </div>
      </div>

      <div className="react-recharge-section">
        <h3>Recharge With</h3>
        <div className="react-recharge-options">
          {rechargeOptions.map((amount) => (
            <button
              key={amount}
              className={`react-recharge-option ${rechargeAmount === amount ? 'active' : ''}`}
              onClick={() => handleRecharge(amount)}
            >
              ₹{amount}
            </button>
          ))}
        </div>
        <div className="react-custom-amount">
          <input
            type="number"
            placeholder="Enter custom amount"
            value={rechargeAmount}
            onChange={(e) => setRechargeAmount(e.target.value)}
            className="react-form-input"
          />
        </div>

        <div className="react-payment-gateway-section" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
          <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600' }}>Select Payment Gateway</h4>
          {loadingPaymentGateways ? (
            <p style={{ color: '#999', fontSize: '0.875rem' }}>Loading payment gateways...</p>
          ) : availablePaymentGateways.length > 0 ? (
            <div className="react-payment-gateway-options" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {availablePaymentGateways.map((gateway) => (
                <label 
                  key={gateway.value}
                  className="react-payment-gateway-option" 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    border: selectedPaymentGateway === gateway.value ? '2px solid #3399cc' : '2px solid #e0e0e0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: selectedPaymentGateway === gateway.value ? '#f0f8ff' : '#fff',
                    transition: 'all 0.2s'
                  }}
                >
                  <input
                    type="radio"
                    name="paymentGateway"
                    value={gateway.value}
                    checked={selectedPaymentGateway === gateway.value}
                    onChange={(e) => setSelectedPaymentGateway(e.target.value)}
                    style={{ margin: 0 }}
                  />
                  <span>{gateway.label}</span>
                </label>
              ))}
            </div>
          ) : (
            <p style={{ color: '#999', fontSize: '0.875rem' }}>No payment gateways available</p>
          )}
        </div>

        <div style={{ marginTop: '1rem' }}>
          <button 
            className="react-btn react-btn-primary" 
            onClick={(e) => {
              console.log('[Customer Dashboard] ===== RECHARGE BUTTON CLICKED =====')
              console.log('[Customer Dashboard] rechargeAmount:', rechargeAmount)
              console.log('[Customer Dashboard] loadingRecharge:', loadingRecharge)
              e?.preventDefault?.()
              e?.stopPropagation?.()
              handleRechargeSubmit(e)
            }}
            disabled={loadingRecharge || !rechargeAmount || parseFloat(rechargeAmount) <= 0 || isNaN(parseFloat(rechargeAmount))}
            style={{ width: '100%', padding: '0.75rem 1.5rem' }}
            type="button"
          >
            {loadingRecharge ? 'Processing...' : `Recharge with ${selectedPaymentGateway.charAt(0).toUpperCase() + selectedPaymentGateway.slice(1)}`}
          </button>
          {(!rechargeAmount || parseFloat(rechargeAmount) <= 0 || isNaN(parseFloat(rechargeAmount))) && (
            <p style={{ marginTop: '0.5rem', color: '#999', fontSize: '0.875rem', textAlign: 'center' }}>
              Please select or enter a recharge amount
            </p>
          )}
        </div>
      </div>

      <div className="transaction-history">
        <div className="react-section-subheader">
          <h3>Transaction History</h3>
          <div className="react-filter-options">
            <select className="react-filter-select">
              <option>All Transactions</option>
              <option>Credits</option>
              <option>Debits</option>
            </select>
          </div>
        </div>
        
        <div className="react-table-container">
          <table className="react-data-table">
            <thead>
              <tr>
                <th>S. No.</th>
                <th>Order Id</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Credit/Debit</th>
                <th>Narration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loadingWalletTransactions ? (
                <tr>
                  <td colSpan="7" className="react-no-data">Loading transactions...</td>
                </tr>
              ) : walletTransactions.length > 0 ? (
                walletTransactions.map((row, idx) => (
                  <tr key={`${row.id || row.referenceId || idx}`}>
                    <td>{row.sn || (walletPage - 1) * walletPageSize + idx + 1}</td>
                    <td>{row.referenceId || row.paymentId || '-'}</td>
                    <td>{row.date || '-'}</td>
                    <td>{row.amount || '-'}</td>
                    <td>
                      <span className={`react-badge ${row.type === 'cr' || row.type === 'credit' ? 'credit' : 'debit'}`}>
                        {row.type === 'cr' || row.type === 'credit' ? 'Credit' : row.type === 'dr' || row.type === 'debit' ? 'Debit' : row.type || '-'}
                      </span>
                    </td>
                    <td>{row.narration || '-'}</td>
                    <td>
                      {(() => {
                        // Handle both string and numeric status values
                        let statusValue = row.status
                        if (typeof statusValue === 'number') {
                          // Backend sends status as 0 (pending) or 1 (complete)
                          statusValue = statusValue === 1 ? 'Complete' : statusValue === 2 ? 'Failed' : statusValue === 3 ? 'Declined' : 'Pending'
                        }
                        
                        const status = (statusValue || '').toString().toLowerCase().trim()
                        let badgeClass = ''
                        let displayStatus = statusValue || '-'
                        
                        if (status === 'complete' || status === 'completed' || status === 'success' || status === 'successful' || status === '1') {
                          badgeClass = 'react-success'
                          displayStatus = 'Completed'
                        } else if (status === 'pending' || status === 'processing' || status === 'in-progress' || status === '0' || status === '') {
                          badgeClass = 'react-warning'
                          displayStatus = 'Pending'
                        } else if (status === 'failed' || status === 'fail' || status === 'error' || status === 'cancelled' || status === 'canceled' || status === '2') {
                          badgeClass = 'react-danger'
                          displayStatus = status === 'cancelled' || status === 'canceled' ? 'Cancelled' : 'Failed'
                        } else if (status === 'refunded' || status === 'refund') {
                          badgeClass = 'react-info'
                          displayStatus = 'Refunded'
                        } else if (status === 'declined' || status === '3') {
                          badgeClass = 'react-danger'
                          displayStatus = 'Declined'
                        } else {
                          // Default: show original status with warning badge if it looks like pending
                          badgeClass = status.includes('pending') || status.includes('pending') ? 'react-warning' : ''
                          displayStatus = statusValue || '-'
                        }
                        
                        return (
                          <span className={`react-badge ${badgeClass}`}>
                            {displayStatus}
                          </span>
                        )
                      })()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="react-no-data">No Records Found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={walletPage}
          totalItems={walletTransactions.length}
          pageSize={walletPageSize}
          onPageChange={(page) => { setWalletPage(page); fetchWalletTransactions() }}
          onPageSizeChange={(s) => { setWalletPageSize(s); setWalletPage(1); fetchWalletTransactions() }}
        />
      </div>
    </div>
  )

  const renderGiftHistorySection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>🎁 Gift History</h2>
        <p>View all gifts you've sent to astrologers</p>
      </div>

      <div className="transaction-history">
        <div className="react-table-container">
          <table className="react-data-table">
            <thead>
              <tr>
                <th>S. No.</th>
                <th>Astrologer</th>
                <th>Gift</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loadingGiftHistory ? (
                <tr>
                  <td colSpan="6" className="react-no-data">Loading gifts...</td>
                </tr>
              ) : giftHistory.length > 0 ? (
                giftHistory.map((gift, idx) => (
                  <tr key={gift.id || idx}>
                    <td>{(giftPage - 1) * giftPageSize + idx + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {gift.astrologer?.astro_img && (
                          <img 
                            src={gift.astrologer.astro_img} 
                            alt={gift.astrologer.display_name || 'Astrologer'}
                            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.style.display = 'none'
                            }}
                          />
                        )}
                        <div>
                          <div style={{ fontWeight: '600' }}>
                            {gift.astrologer?.display_name || gift.user_astrologer?.name || 'N/A'}
                          </div>
                          {gift.user_astrologer?.avg_rating && (
                            <div style={{ fontSize: '0.85rem', color: '#666' }}>
                              ⭐ {parseFloat(gift.user_astrologer.avg_rating).toFixed(1)}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {gift.gift?.gift_image && (
                          <img 
                            src={gift.gift.gift_image} 
                            alt={gift.gift.gift_name || 'Gift'}
                            style={{ width: '35px', height: '35px', objectFit: 'contain' }}
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="35" height="35"%3E%3Ctext x="50%25" y="50%25" font-size="20" text-anchor="middle" dy=".3em"%3E🎁%3C/text%3E%3C/svg%3E'
                            }}
                          />
                        )}
                        <span style={{ fontWeight: '500' }}>
                          {gift.gift?.gift_name || 'Gift'}
                        </span>
                      </div>
                    </td>
                    <td style={{ fontWeight: '600', color: '#e91e63' }}>
                      ₹{parseFloat(gift.amount || 0).toFixed(2)}
                    </td>
                    <td>
                      <span className={`react-badge ${gift.livechannel ? 'react-info' : 'react-success'}`}>
                        {gift.livechannel ? '🔴 Live' : '👤 Profile'}
                      </span>
                    </td>
                    <td>
                      {gift.created_at ? new Date(gift.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="react-no-data">
                    <div style={{ padding: '40px 20px' }}>
                      <i className="fas fa-gift" style={{ fontSize: '3rem', color: '#ddd', marginBottom: '15px' }}></i>
                      <h4 style={{ color: '#666', marginBottom: '10px' }}>No Gifts Sent Yet</h4>
                      <p style={{ color: '#999', fontSize: '0.9rem' }}>
                        You haven't sent any gifts to astrologers yet.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {giftHistory.length > 0 && (
          <Pagination
            currentPage={giftPage}
            totalItems={giftHistory.length}
            pageSize={giftPageSize}
            onPageChange={(page) => { setGiftPage(page); fetchGiftHistory() }}
            onPageSizeChange={(s) => { setGiftPageSize(s); setGiftPage(1); fetchGiftHistory() }}
          />
        )}
      </div>
    </div>
  )

  const renderAddressSection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:'1rem', flexWrap:'wrap'}}>
          <div>
            <h2>Saved Address</h2>
            <p>Manage your delivery addresses</p>
          </div>
          <button className="react-btn react-btn-primary" onClick={openAddAddress}>
            <i className="fas fa-plus" style={{marginRight:'6px'}}></i>
            Add New Address
          </button>
        </div>
      </div>
      {/* Address Cards */}
      {loadingAddresses ? (
        <div className="react-loading" style={{padding: '2rem', textAlign: 'center'}}>
          <i className="fas fa-spinner fa-spin" style={{fontSize: '2rem', color: '#ee5a24'}}></i>
          <p>Loading addresses...</p>
        </div>
      ) : (
        <div className="react-address-grid">
          {addresses.map((addr) => (
            <div className="react-address-card" key={addr.id}>
              <div className="react-address-card-header">
                <h4>{addr.name}</h4>
                <div className="react-address-actions">
                  <button 
                    type="button"
                    className="react-btn react-btn-outline react-small" 
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      openEditAddress(addr)
                    }}
                  >
                    <i className="fas fa-edit"></i> Edit
                  </button>
                  <button 
                    type="button"
                    className="react-btn react-btn-outline react-small" 
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      deleteAddress(addr.id)
                    }}
                  >
                    <i className="fas fa-trash"></i> Delete
                  </button>
                </div>
              </div>
              <div className="react-address-lines">
                {addr.address && <p>{addr.address}</p>}
                {addr.houseNo && addr.street && <p>{addr.houseNo}, {addr.street}</p>}
                {!addr.address && addr.houseNo && <p>{addr.houseNo}</p>}
                {!addr.address && addr.street && <p>{addr.street}</p>}
                {addr.landmark && <p>{addr.landmark}</p>}
                <p>{addr.city}, {addr.state} - {addr.pincode}</p>
                <p>{addr.country}</p>
              </div>
              <div className="react-address-meta">
                <span><i className="fas fa-phone"></i> {addr.phone}</span>
                <span><i className="fas fa-envelope"></i> {addr.email}</span>
              </div>
            </div>
          ))}
          {addresses.length === 0 && (
            <div className="react-no-data" style={{width:'100%'}}>No Saved Addresses</div>
          )}
        </div>
      )}

      {/* Add/Edit Address Modal */}
      <Modal
        isOpen={addressModalOpen}
        onClose={() => {
          console.log('[Customer Dashboard] Closing address modal')
          setAddressModalOpen(false)
          setEditingAddress(null)
        }}
        title={editingAddress ? 'Edit Address' : 'Add New Address'}
        footer={
          <div style={{display:'flex', gap:'0.75rem', justifyContent:'flex-end', flexWrap:'wrap'}}>
            <button 
              type="button" 
              className="react-btn react-btn-outline" 
              onClick={() => {
                setAddressModalOpen(false)
                setEditingAddress(null)
              }}
            >
              Cancel
            </button>
            <button 
              type="button"
              className="react-btn react-btn-primary"
              onClick={(e) => {
                e.preventDefault()
                if (addressFormRef.current) {
                  addressFormRef.current.requestSubmit()
                }
              }}
            >
              {editingAddress ? 'Update Address' : 'Save Address'}
            </button>
          </div>
        }
      >
        <form 
          ref={addressFormRef}
          key={editingAddress?.id || 'new-address'} 
          className="react-address-form" 
          onSubmit={handleSaveAddress}
        >
          <div className="react-form-row">
            <div className="react-form-group">
              <label>Name</label>
              <input name="name" defaultValue={editingAddress?.name || ''} className="react-form-input" required />
            </div>
            <div className="react-form-group">
              <label>Email</label>
              <input type="email" name="email" defaultValue={editingAddress?.email || ''} className="react-form-input" />
            </div>
          </div>
          <div className="react-form-group">
            <label>Phone</label>
            <input name="phone" defaultValue={editingAddress?.phone || ''} className="react-form-input" required />
          </div>
          <div className="react-form-row">
            <div className="react-form-group">
              <label>House No</label>
              <input name="houseNo" defaultValue={editingAddress?.houseNo || ''} className="react-form-input" />
            </div>
            <div className="react-form-group">
              <label>Street Area</label>
              <input name="street" defaultValue={editingAddress?.street || ''} className="react-form-input" />
            </div>
          </div>
          <div className="react-form-row">
            <div className="react-form-group">
              <label>State</label>
              <select 
                name="state" 
                defaultValue={editingAddress?.state || ''} 
                className="react-form-input"
                disabled={!selectedCountryId || loadingStates}
                onChange={(e) => {
                  const stateName = e.target.value
                  const state = states.find(s => s.name === stateName)
                  if (state) {
                    setSelectedStateId(state.id)
                    fetchCities(state.id)
                  } else {
                    setSelectedStateId(null)
                    setCities([])
                  }
                }}
              >
                <option value="">Select State</option>
                {loadingStates ? (
                  <option value="">Loading states...</option>
                ) : states.length > 0 ? (
                  states.map((state) => (
                    <option key={state.id} value={state.name}>
                      {state.name}
                    </option>
                  ))
                ) : selectedCountryId ? (
                  <option value="">No states available</option>
                ) : (
                  <option value="">Select country first</option>
                )}
              </select>
            </div>
            <div className="react-form-group">
              <label>City</label>
              <select 
                name="city" 
                defaultValue={editingAddress?.city || ''} 
                className="react-form-input"
                disabled={!selectedStateId || loadingCities}
              >
                <option value="">Select City</option>
                {loadingCities ? (
                  <option value="">Loading cities...</option>
                ) : cities.length > 0 ? (
                  cities.map((city) => (
                    <option key={city.id} value={city.name}>
                      {city.name}
                    </option>
                  ))
                ) : selectedStateId ? (
                  <option value="">No cities available</option>
                ) : (
                  <option value="">Select state first</option>
                )}
              </select>
            </div>
          </div>
          <div className="react-form-row">
            <div className="react-form-group">
              <label>Pincode</label>
              <input name="pincode" defaultValue={editingAddress?.pincode || ''} className="react-form-input" />
            </div>
            <div className="react-form-group">
              <label>Country</label>
              <select 
                name="country" 
                value={(() => {
                  // If editing, use editingAddress.country
                  if (editingAddress?.country) {
                    return editingAddress.country
                  }
                  // Find country by selectedCountryId
                  if (selectedCountryId) {
                    const country = countries.find(c => c.id === selectedCountryId)
                    return country?.name || ''
                  }
                  // Default to India if available
                  const india = countries.find(c => c.name === 'India')
                  return india?.name || ''
                })()}
                className="react-form-input"
                required
                disabled={loadingCountries}
                onChange={(e) => {
                  const countryName = e.target.value
                  console.log('[Customer Dashboard] Country selected:', countryName)
                  const country = countries.find(c => c.name === countryName)
                  if (country) {
                    console.log('[Customer Dashboard] Found country:', country.id, country.name)
                    setSelectedCountryId(country.id)
                    fetchStates(country.id)
                  } else {
                    console.log('[Customer Dashboard] Country not found')
                    setSelectedCountryId(null)
                    setStates([])
                    setCities([])
                  }
                }}
              >
                {loadingCountries ? (
                  <option value="">Loading countries...</option>
                ) : countries.length > 0 ? (
                  <>
                    <option value="">Select Country</option>
                    {countries.map((country) => (
                      <option key={country.id} value={country.name}>
                        {country.name}
                      </option>
                    ))}
                  </>
                ) : (
                  <>
                    <option value="India">India</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                  </>
                )}
              </select>
            </div>
          </div>
          <div className="react-form-group">
            <label>Address</label>
            <textarea name="address" defaultValue={editingAddress?.address || ''} className="react-form-textarea" rows="3"></textarea>
          </div>
        </form>
      </Modal>
    </div>
  )

  const renderOrdersSection = () => {
    console.log('[Customer Dashboard] renderOrdersSection - orders:', orders.length, 'loading:', loadingOrders, 'isFetching:', isFetchingOrders.current)
    
    if (loadingOrders && orders.length === 0) {
      return (
        <div className="react-account-section">
          <div className="react-section-header">
            <h2>My Orders</h2>
            <p>Track your order history</p>
          </div>
          <div className="react-no-data" style={{padding: '2rem'}}>Loading orders...</div>
        </div>
      )
    }

    const query = ordersSearch.trim().toLowerCase()
    const filteredByQuery = query
      ? orders.filter((o) =>
          String(o.orderId || '').toLowerCase().includes(query) ||
          String(o.productName || '').toLowerCase().includes(query)
        )
      : orders

    // Date range filter (expects row.orderedDate in a parseable format like YYYY-MM-DD HH:mm:ss)
    const parseDate = (value) => {
      if (!value) return null
      // Try ISO first
      const iso = new Date(value)
      if (!isNaN(iso.getTime())) return iso
      // Try YYYY-MM-DD HH:mm:ss format
      const dateStr = String(value).split(' ')[0] // Get date part only
      const d = new Date(dateStr)
      if (!isNaN(d.getTime())) return d
      return null
    }

    const fromDate = parseDate(ordersFromDate)
    const toDate = parseDate(ordersToDate)

    const filtered = filteredByQuery.filter((row) => {
      if (!fromDate && !toDate) return true
      const rowDate = parseDate(row.orderedDate)
      if (!rowDate) return false
      if (fromDate && rowDate < fromDate) return false
      if (toDate) {
        // include entire end day
        const end = new Date(toDate)
        end.setHours(23, 59, 59, 999)
        if (rowDate > end) return false
      }
      return true
    })
    const data = getPaginatedItems(filtered, ordersPage, ordersPageSize)
    return (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>My Orders</h2>
        <p>Track your order history</p>
      </div>

      <div className="react-filter-section">
        <div className="react-filter-options" style={{width:'100%', gap:'0.75rem', justifyContent:'space-between', flexWrap:'wrap'}}>
          <div style={{display:'flex', gap:'0.75rem', alignItems:'center', flexWrap:'wrap'}}>
            <input
              type="text"
              value={ordersSearch}
              onChange={(e)=>{ setOrdersSearch(e.target.value); setOrdersPage(1) }}
              className="react-form-input"
              placeholder="Search by Order Id or Product Name"
              style={{maxWidth:'360px'}}
              aria-label="Search orders"
            />
            <div style={{display:'flex', gap:'0.5rem', alignItems:'center', flexWrap:'wrap'}}>
              <label style={{fontSize:'0.85rem', color:'var(--text-secondary)'}}>From</label>
              <input
                type="date"
                value={ordersFromDate}
                onChange={(e)=>{ setOrdersFromDate(e.target.value); setOrdersPage(1) }}
                className="react-form-input"
                style={{minWidth:'160px'}}
                aria-label="From date"
              />
              <label style={{fontSize:'0.85rem', color:'var(--text-secondary)'}}>To</label>
              <input
                type="date"
                value={ordersToDate}
                onChange={(e)=>{ setOrdersToDate(e.target.value); setOrdersPage(1) }}
                className="react-form-input"
                style={{minWidth:'160px'}}
                aria-label="To date"
              />
            </div>
          </div>
          <select className="react-filter-select">
            <option>All Orders</option>
            <option>Pending</option>
            <option>Completed</option>
            <option>Cancelled</option>
          </select>
        </div>
      </div>

      <div className="react-table-container">
        <table className="react-data-table">
          <thead>
            <tr>
              <th>S. No.</th>
              <th>Image</th>
              <th>Order Id</th>
              <th>Product</th>
              <th>Ordered Date</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => {
              const formattedDate = row.orderedDate 
                ? new Date(row.orderedDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })
                : 'N/A'
              
              const formattedAmount = row.totalAmount 
                ? `₹${parseFloat(row.totalAmount).toFixed(2)}`
                : '₹0.00'
              
              const statusClass = row.status?.toLowerCase() === 'completed' 
                ? 'react-status-success' 
                : row.status?.toLowerCase() === 'pending' 
                ? 'react-status-warning' 
                : row.status?.toLowerCase() === 'cancelled' 
                ? 'react-status-danger' 
                : ''
              
              return (
                <tr key={row.id || idx}>
                  <td>{(ordersPage - 1) * ordersPageSize + idx + 1}</td>
                  <td>
                    {row.productImage ? (
                      <img 
                        src={row.productImage} 
                        alt={row.productName || 'Product'} 
                        style={{width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px'}}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/50'
                        }}
                      />
                    ) : (
                      <div style={{width: '50px', height: '50px', backgroundColor: '#f0f0f0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        <i className="fas fa-image" style={{color: '#ccc'}}></i>
                      </div>
                    )}
                  </td>
                  <td>{row.orderId}</td>
                  <td>{row.productName || 'N/A'}</td>
                  <td>{formattedDate}</td>
                  <td>{formattedAmount}</td>
                  <td>
                    <span className={statusClass} style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      textTransform: 'capitalize',
                      backgroundColor: row.status?.toLowerCase() === 'completed' ? '#d4edda' : row.status?.toLowerCase() === 'pending' ? '#fff3cd' : row.status?.toLowerCase() === 'cancelled' ? '#f8d7da' : '#e9ecef',
                      color: row.status?.toLowerCase() === 'completed' ? '#155724' : row.status?.toLowerCase() === 'pending' ? '#856404' : row.status?.toLowerCase() === 'cancelled' ? '#721c24' : '#495057'
                    }}>
                      {row.status || 'Pending'}
                    </span>
                  </td>
                  <td>
                    {row.invoiceUrl ? (
                      <a 
                        href={row.invoiceUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="react-btn react-btn-outline react-small"
                        style={{textDecoration: 'none'}}
                      >
                        <i className="fas fa-download"></i> Invoice
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              )
            })}
            {data.length === 0 && !loadingOrders && (
              <tr>
                <td colSpan="8" className="react-no-data">
                  {orders.length === 0 
                    ? 'No Records Found' 
                    : `No orders match your filters (${orders.length} total orders)`}
                </td>
              </tr>
            )}
            {loadingOrders && data.length === 0 && (
              <tr>
                <td colSpan="8" className="react-no-data" style={{padding: '1rem'}}>Loading orders...</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={ordersPage}
        totalItems={filtered.length}
        pageSize={ordersPageSize}
        onPageChange={setOrdersPage}
        onPageSizeChange={(s) => { setOrdersPageSize(s); setOrdersPage(1) }}
      />
    </div>
  )}

  const renderServiceOrdersSection = () => {
    console.log('[Customer Dashboard] renderServiceOrdersSection - orders:', serviceOrders.length, 'loading:', loadingServiceOrders, 'isFetching:', isFetchingServiceOrders.current)
    
    if (loadingServiceOrders && serviceOrders.length === 0) {
      return (
        <div className="react-account-section">
          <div className="react-section-header">
            <h2>My Service Orders</h2>
            <p>Track your service orders</p>
          </div>
          <div className="react-no-data" style={{padding: '2rem'}}>Loading service orders...</div>
        </div>
      )
    }

    const data = getPaginatedItems(serviceOrders, serviceOrdersPage, serviceOrdersPageSize)
    
    return (
      <div className="react-account-section">
        <div className="react-section-header">
          <h2>My Service Orders</h2>
          <p>Track your service orders</p>
        </div>

        <div className="react-filter-section">
          <div className="react-filter-options">
            <select className="react-filter-select">
              <option>All Service Orders</option>
              <option>Pending</option>
              <option>Completed</option>
              <option>Cancelled</option>
            </select>
          </div>
        </div>

        <div className="react-table-container">
          <table className="react-data-table">
            <thead>
              <tr>
                <th>S. No.</th>
                <th>Order ID</th>
                <th>Reference ID</th>
                <th>Total Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => {
                // Parse date with fallback for different formats
                const parseDate = (value) => {
                  if (!value) return null
                  // Try ISO first
                  const iso = new Date(value)
                  if (!isNaN(iso.getTime())) return iso
                  // Try YYYY-MM-DD format
                  const dateStr = String(value).split(' ')[0] // Get date part only
                  const d = new Date(dateStr)
                  if (!isNaN(d.getTime())) return d
                  return null
                }
                
                const dateObj = parseDate(row.date)
                const formattedDate = dateObj 
                  ? dateObj.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })
                  : row.date || 'N/A'
                
                const formattedAmount = row.amount 
                  ? `₹${parseFloat(row.amount).toFixed(2)}`
                  : '₹0.00'
                
                const statusClass = row.status?.toLowerCase() === 'approved' || row.status?.toLowerCase() === 'completed'
                  ? 'react-status-success' 
                  : row.status?.toLowerCase() === 'pending' 
                  ? 'react-status-warning' 
                  : row.status?.toLowerCase() === 'cancelled' 
                  ? 'react-status-danger' 
                  : ''
                
                return (
                  <tr key={row.id || idx}>
                    <td>{(serviceOrdersPage - 1) * serviceOrdersPageSize + idx + 1}</td>
                    <td>{row.orderId}</td>
                    <td>{row.referenceId}</td>
                    <td>{formattedAmount}</td>
                    <td>{formattedDate}</td>
                    <td>
                      <span className={statusClass} style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        textTransform: 'capitalize',
                        backgroundColor: row.status?.toLowerCase() === 'approved' || row.status?.toLowerCase() === 'completed' ? '#d4edda' : row.status?.toLowerCase() === 'pending' ? '#fff3cd' : row.status?.toLowerCase() === 'cancelled' ? '#f8d7da' : '#e9ecef',
                        color: row.status?.toLowerCase() === 'approved' || row.status?.toLowerCase() === 'completed' ? '#155724' : row.status?.toLowerCase() === 'pending' ? '#856404' : row.status?.toLowerCase() === 'cancelled' ? '#721c24' : '#495057'
                      }}>
                        {row.status || 'Pending'}
                      </span>
                    </td>
                    <td>-</td>
                  </tr>
                )
              })}
              {data.length === 0 && !loadingServiceOrders && (
                <tr>
                  <td colSpan="7" className="react-no-data">
                    {serviceOrders.length === 0 
                      ? 'No Records Found' 
                      : `No orders match your filters (${serviceOrders.length} total orders)`}
                  </td>
                </tr>
              )}
              {loadingServiceOrders && data.length === 0 && (
                <tr>
                  <td colSpan="7" className="react-no-data" style={{padding: '1rem'}}>Loading service orders...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={serviceOrdersPage}
          totalItems={serviceOrders.length}
          pageSize={serviceOrdersPageSize}
          onPageChange={setServiceOrdersPage}
          onPageSizeChange={(s) => { setServiceOrdersPageSize(s); setServiceOrdersPage(1) }}
        />
      </div>
    )
  }

  const renderAskQuestionsSection = () => {
    console.log('[Customer Dashboard] renderAskQuestionsSection - questions:', askQuestions.length, 'loading:', loadingAskQuestions)
    
    if (loadingAskQuestions && askQuestions.length === 0) {
      return (
        <div className="react-account-section">
          <div className="react-section-header">
            <h2>My Questions</h2>
            <p>View your questions and answers from astrologers</p>
          </div>
          <div className="react-no-data" style={{padding: '2rem'}}>Loading questions...</div>
        </div>
      )
    }

    const pageSize = 10
    const startIdx = (askQuestionsOffset / pageSize) 
    const currentPageQuestions = askQuestions.slice(startIdx * pageSize, (startIdx + 1) * pageSize)
    
    return (
      <div className="react-account-section">
        <div className="react-section-header">
          <h2>My Questions</h2>
          <p>View your questions and answers from astrologers</p>
        </div>

        <div className="react-table-container">
          <table className="react-data-table">
            <thead>
              <tr>
                <th>S. No.</th>
                <th>Order ID</th>
                <th>Astrologer</th>
                <th>Question</th>
                <th>Answer</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {currentPageQuestions.map((row, idx) => {
                // Parse date with fallback for different formats
                const parseDate = (value) => {
                  if (!value) return null
                  const iso = new Date(value)
                  if (!isNaN(iso.getTime())) return iso
                  const dateStr = String(value).split(' ')[0]
                  const d = new Date(dateStr)
                  if (!isNaN(d.getTime())) return d
                  return null
                }
                
                const dateObj = parseDate(row.date)
                const formattedDate = dateObj 
                  ? dateObj.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })
                  : row.date || 'N/A'
                
                const formattedAmount = row.amount 
                  ? `₹${parseFloat(row.amount).toFixed(2)}`
                  : '₹0.00'
                
                // Determine answer status
                const answerStatusLabel = row.answerStatus === 1 ? 'Answered' : 'Pending'
                const statusClass = row.answerStatus === 1
                  ? 'react-status-success' 
                  : 'react-status-warning'
                
                return (
                  <tr key={row.id || idx}>
                    <td>{startIdx * pageSize + idx + 1}</td>
                    <td>{row.orderId}</td>
                    <td>{row.astrologerName}</td>
                    <td style={{ maxWidth: '200px', whiteSpace: 'normal', wordWrap: 'break-word' }}>
                      {row.question?.substring(0, 100)}
                      {row.question?.length > 100 ? '...' : ''}
                    </td>
                    <td style={{ maxWidth: '200px', whiteSpace: 'normal', wordWrap: 'break-word' }}>
                      {row.answerStatus === 1 ? (
                        <>
                          {row.answer?.substring(0, 100)}
                          {row.answer?.length > 100 ? '...' : ''}
                        </>
                      ) : (
                        <span style={{ color: '#856404', fontStyle: 'italic' }}>Pending</span>
                      )}
                    </td>
                    <td>{formattedAmount}</td>
                    <td>{formattedDate}</td>
                    <td>
                      <span className={statusClass} style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        textTransform: 'capitalize',
                        backgroundColor: row.answerStatus === 1 ? '#d4edda' : '#fff3cd',
                        color: row.answerStatus === 1 ? '#155724' : '#856404'
                      }}>
                        {answerStatusLabel}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {currentPageQuestions.length === 0 && !loadingAskQuestions && (
                <tr>
                  <td colSpan="8" className="react-no-data">
                    {askQuestions.length === 0 
                      ? 'No Records Found' 
                      : 'No questions on this page'}
                  </td>
                </tr>
              )}
              {loadingAskQuestions && currentPageQuestions.length === 0 && (
                <tr>
                  <td colSpan="8" className="react-no-data" style={{padding: '1rem'}}>Loading questions...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {hasMoreAskQuestions && askQuestions.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button 
              className="react-load-more-btn"
              onClick={() => fetchAskQuestions(askQuestionsOffset, true)}
              disabled={loadingAskQuestions}
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: '#ee5a24',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loadingAskQuestions ? 'not-allowed' : 'pointer',
                opacity: loadingAskQuestions ? 0.6 : 1
              }}
            >
              {loadingAskQuestions ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    )
  }

  const renderAppointmentsSection = () => {
    const getStatusBadgeClass = (status) => {
      switch (status?.toLowerCase()) {
        case 'completed':
          return { bg: '#d4edda', color: '#155724' }
        case 'in-progress':
          return { bg: '#cfe2ff', color: '#084298' }
        case 'pending':
          return { bg: '#fff3cd', color: '#856404' }
        case 'cancel':
          return { bg: '#f8d7da', color: '#721c24' }
        default:
          return { bg: '#e9ecef', color: '#6c757d' }
      }
    }

    const formatDate = (dateStr) => {
      if (!dateStr) return 'N/A'
      try {
        return new Date(dateStr).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      } catch {
        return dateStr
      }
    }

    if (loadingAppointments && appointments.length === 0) {
      return (
        <div className="react-account-section">
          <div className="react-section-header">
            <h2>My Appointments</h2>
            <p>View your appointment bookings</p>
          </div>
          <div className="react-no-data" style={{padding: '2rem'}}>Loading appointments...</div>
        </div>
      )
    }

    if (appointments.length === 0) {
      return (
        <div className="react-account-section">
          <div className="react-section-header">
            <h2>My Appointments</h2>
            <p>View your appointment bookings</p>
          </div>
          <div className="react-no-data">No appointments found</div>
        </div>
      )
    }

    return (
      <div className="react-account-section">
        <div className="react-section-header">
          <h2>My Appointments</h2>
          <p>View your appointment bookings</p>
        </div>

        <div className="react-table-container">
          <table className="react-data-table">
            <thead>
              <tr>
                <th>S. No.</th>
                <th>Order ID</th>
                <th>Astrologer</th>
                <th>Date</th>
                <th>Time</th>
                <th>Duration</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment, idx) => {
                const statusStyle = getStatusBadgeClass(appointment.status)
                
                return (
                  <tr key={appointment.id || idx}>
                    <td>{idx + 1}</td>
                    <td>{appointment.order_id || 'N/A'}</td>
                    <td>{appointment.astrologer_name}</td>
                    <td>{formatDate(appointment.slot_date)}</td>
                    <td>{appointment.slot_start} - {appointment.slot_end}</td>
                    <td>{appointment.slot_duration || 'N/A'}</td>
                    <td>₹{parseFloat(appointment.charge).toFixed(2)}</td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        textTransform: 'capitalize',
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.color
                      }}>
                        {appointment.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {hasMoreAppointments && (
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button 
              className="react-load-more-btn"
              onClick={() => fetchAppointmentsData(appointmentsOffset, true)}
              disabled={loadingAppointments}
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: '#ee5a24',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loadingAppointments ? 'not-allowed' : 'pointer',
                opacity: loadingAppointments ? 0.6 : 1
              }}
            >
              {loadingAppointments ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    )
  }

  const renderArchitectRoomsSection = () => {
    const getStatusBadgeClass = (status) => {
      return status === 1 ? { bg: '#d4edda', color: '#155724' } : { bg: '#e9ecef', color: '#6c757d' }
    }

    const formatDate = (dateStr) => {
      if (!dateStr) return 'N/A'
      try {
        return new Date(dateStr).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      } catch {
        return dateStr
      }
    }

    if (loadingArchitectRooms && architectRooms.length === 0) {
      return (
        <div className="react-account-section">
          <div className="react-section-header">
            <h2>My Architect Rooms</h2>
            <p>View your architect room designs</p>
          </div>
          <div className="react-no-data" style={{padding: '2rem'}}>Loading rooms...</div>
        </div>
      )
    }

    if (architectRooms.length === 0) {
      return (
        <div className="react-account-section">
          <div className="react-section-header">
            <h2>My Architect Rooms</h2>
            <p>View your architect room designs</p>
          </div>
          <div className="react-no-data">No architect rooms found</div>
        </div>
      )
    }

    return (
      <div className="react-account-section">
        <div className="react-section-header">
          <h2>My Architect Rooms</h2>
          <p>View your architect room designs</p>
        </div>

        <div className="react-table-container">
          <table className="react-data-table">
            <thead>
              <tr>
                <th>S. No.</th>
                <th>Room Name</th>
                <th>Room Type</th>
                <th>Architect</th>
                <th>Dimensions</th>
                <th>Floor</th>
                <th>Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {architectRooms.map((room, idx) => {
                const statusStyle = getStatusBadgeClass(room.status)
                
                return (
                  <tr key={room.id || idx}>
                    <td>{idx + 1}</td>
                    <td>{room.room_name || 'Untitled'}</td>
                    <td>{room.room_type || 'N/A'}</td>
                    <td>{room.architect_name}</td>
                    <td>{room.dimensions || 'N/A'}</td>
                    <td>{room.floor_number !== null ? `Floor ${room.floor_number}` : 'N/A'}</td>
                    <td>₹{parseFloat(room.price).toFixed(2)}</td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        textTransform: 'capitalize',
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.color
                      }}>
                        {room.status_label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {hasMoreArchitectRooms && (
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button 
              className="react-load-more-btn"
              onClick={() => fetchArchitectRoomsData(architectRoomsOffset, true)}
              disabled={loadingArchitectRooms}
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: '#ee5a24',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loadingArchitectRooms ? 'not-allowed' : 'pointer',
                opacity: loadingArchitectRooms ? 0.6 : 1
              }}
            >
              {loadingArchitectRooms ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    )
  }

  const renderArchitectServiceOrdersSection = () => {
    const getStatusBadgeStyle = (status) => {
      switch (status?.toLowerCase()) {
        case 'completed':
          return { bg: '#d4edda', color: '#155724' }
        case 'in-progress':
          return { bg: '#cfe2ff', color: '#084298' }
        case 'pending':
          return { bg: '#fff3cd', color: '#856404' }
        case 'cancelled':
          return { bg: '#f8d7da', color: '#721c24' }
        default:
          return { bg: '#e9ecef', color: '#6c757d' }
      }
    }

    const getPaymentBadgeStyle = (paymentStatus) => {
      return paymentStatus?.toLowerCase() === 'paid'
        ? { bg: '#d4edda', color: '#155724' }
        : { bg: '#f8d7da', color: '#721c24' }
    }

    const formatDate = (dateStr) => {
      if (!dateStr) return 'N/A'
      try {
        return new Date(dateStr).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      } catch {
        return dateStr
      }
    }

    if (loadingArchitectServiceOrders && architectServiceOrders.length === 0) {
      return (
        <div className="react-account-section">
          <div className="react-section-header">
            <h2>My Architect Service Orders</h2>
            <p>View your architect service bookings</p>
          </div>
          <div className="react-no-data" style={{padding: '2rem'}}>Loading orders...</div>
        </div>
      )
    }

    if (architectServiceOrders.length === 0) {
      return (
        <div className="react-account-section">
          <div className="react-section-header">
            <h2>My Architect Service Orders</h2>
            <p>View your architect service bookings</p>
          </div>
          <div className="react-no-data">No architect service orders found</div>
        </div>
      )
    }

    return (
      <div className="react-account-section">
        <div className="react-section-header">
          <h2>My Architect Service Orders</h2>
          <p>View your architect service bookings</p>
        </div>

        <div className="react-table-container">
          <table className="react-data-table">
            <thead>
              <tr>
                <th>S. No.</th>
                <th>Order ID</th>
                <th>Architect</th>
                <th>Order Type</th>
                <th>Order Date</th>
                <th>Duration</th>
                <th>Charge</th>
                <th>Status</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              {architectServiceOrders.map((order, idx) => {
                const statusStyle = getStatusBadgeStyle(order.status)
                const paymentStyle = getPaymentBadgeStyle(order.payment_status)
                
                return (
                  <tr key={order.id || idx}>
                    <td>{idx + 1}</td>
                    <td>#{order.id}</td>
                    <td>{order.architect_name}</td>
                    <td>{order.order_type || 'N/A'}</td>
                    <td>{formatDate(order.order_date)}</td>
                    <td>{order.duration || 'N/A'}</td>
                    <td>₹{parseFloat(order.charge).toFixed(2)}</td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        textTransform: 'capitalize',
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.color
                      }}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        textTransform: 'capitalize',
                        backgroundColor: paymentStyle.bg,
                        color: paymentStyle.color
                      }}>
                        {order.payment_status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {hasMoreArchitectServiceOrders && (
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button 
              className="react-load-more-btn"
              onClick={() => fetchArchitectServiceOrdersData(architectServiceOrdersOffset, true)}
              disabled={loadingArchitectServiceOrders}
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: '#ee5a24',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loadingArchitectServiceOrders ? 'not-allowed' : 'pointer',
                opacity: loadingArchitectServiceOrders ? 0.6 : 1
              }}
            >
              {loadingArchitectServiceOrders ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    )
  }

  // Render Puja Bookings Section
  const renderPujaBookingsSection = () => {
    const getStatusBadgeStyle = (status) => {
      const statusLower = String(status || '').toLowerCase()
      switch (statusLower) {
        case 'completed':
        case '1':
          return { bg: '#d4edda', color: '#155724', text: 'Completed' }
        case 'confirmed':
        case 'booked':
          return { bg: '#cfe2ff', color: '#084298', text: 'Confirmed' }
        case 'pending':
        case '0':
          return { bg: '#fff3cd', color: '#856404', text: 'Pending' }
        case 'cancelled':
        case '2':
          return { bg: '#f8d7da', color: '#721c24', text: 'Cancelled' }
        case 'upcoming':
          return { bg: '#e0cffc', color: '#59359a', text: 'Upcoming' }
        default:
          return { bg: '#e9ecef', color: '#6c757d', text: status || 'Unknown' }
      }
    }

    const getPaymentBadgeStyle = (paymentStatus) => {
      const statusLower = String(paymentStatus || '').toLowerCase()
      if (statusLower === 'paid' || statusLower === '1' || paymentStatus === 1) {
        return { bg: '#d4edda', color: '#155724', text: 'Paid' }
      } else if (statusLower === 'pending' || statusLower === '0' || paymentStatus === 0) {
        return { bg: '#fff3cd', color: '#856404', text: 'Pending' }
      } else if (statusLower === 'failed' || statusLower === '2' || paymentStatus === 2) {
        return { bg: '#f8d7da', color: '#721c24', text: 'Failed' }
      }
      return { bg: '#f8d7da', color: '#721c24', text: 'Unpaid' }
    }

    const formatDate = (dateStr) => {
      if (!dateStr) return 'N/A'
      try {
        return new Date(dateStr).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      } catch {
        return dateStr
      }
    }

    const formatDateTime = (dateStr) => {
      if (!dateStr) return 'N/A'
      try {
        return new Date(dateStr).toLocaleString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      } catch {
        return dateStr
      }
    }

    const isPujaUpcoming = (pujaDate) => {
      if (!pujaDate) return false
      try {
        return new Date(pujaDate) > new Date()
      } catch {
        return false
      }
    }

    // Split into upcoming and past bookings
    const upcomingBookings = pujaBookings.filter(b => isPujaUpcoming(b.puja_date || b.group_puja?.puja_date))
    const pastBookings = pujaBookings.filter(b => !isPujaUpcoming(b.puja_date || b.group_puja?.puja_date))

    if (loadingPujaBookings && pujaBookings.length === 0) {
      return (
        <div className="react-account-section">
          <div className="react-section-header">
            <h2>My Puja Bookings</h2>
            <p>View your past & upcoming puja bookings</p>
          </div>
          <div className="react-no-data" style={{padding: '2rem'}}>Loading puja bookings...</div>
        </div>
      )
    }

    if (pujaBookings.length === 0) {
      return (
        <div className="react-account-section">
          <div className="react-section-header">
            <h2>My Puja Bookings</h2>
            <p>View your past & upcoming puja bookings</p>
          </div>
          <div className="react-no-data" style={{
            padding: '3rem',
            textAlign: 'center',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <i className="fas fa-om" style={{ fontSize: '3rem', color: '#ccc', marginBottom: '1rem', display: 'block' }}></i>
            <p style={{ color: '#666', marginBottom: '1rem' }}>No puja bookings found</p>
            <p style={{ color: '#999', fontSize: '0.9rem' }}>Book a puja to see your bookings here</p>
          </div>
        </div>
      )
    }

    const renderBookingRow = (booking, idx, isUpcoming = false) => {
      const statusStyle = getStatusBadgeStyle(isUpcoming ? 'upcoming' : booking.status)
      const paymentStyle = getPaymentBadgeStyle(booking.payment_status)
      const puja = booking.group_puja || {}
      
      return (
        <tr key={booking.id || idx}>
          <td>{idx + 1}</td>
          <td>
            <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
              #{booking.id || booking.order_id || 'N/A'}
            </span>
          </td>
          <td>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {puja.puja_image && (
                <img 
                  src={puja.puja_image} 
                  alt={puja.puja_name || 'Puja'}
                  style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              )}
              <div>
                <div style={{ fontWeight: '500' }}>{puja.puja_name || booking.puja_name || 'N/A'}</div>
                {puja.puja_type && <div style={{ fontSize: '0.8rem', color: '#666' }}>{puja.puja_type}</div>}
              </div>
            </div>
          </td>
          <td>{formatDate(booking.puja_date || puja.puja_date)}</td>
          <td style={{ fontWeight: '500', color: '#ee5a24' }}>
            ₹{parseFloat(booking.amount || booking.total_amount || puja.price || 0).toFixed(2)}
          </td>
          <td>
            <span style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '4px',
              fontSize: '0.85rem',
              backgroundColor: statusStyle.bg,
              color: statusStyle.color
            }}>
              {statusStyle.text}
            </span>
          </td>
          <td>
            <span style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '4px',
              fontSize: '0.85rem',
              backgroundColor: paymentStyle.bg,
              color: paymentStyle.color
            }}>
              {paymentStyle.text}
            </span>
          </td>
          <td>
            <button
              onClick={() => {
                setSelectedPujaBooking(booking)
                setShowPujaBookingDetails(true)
              }}
              style={{
                padding: '0.4rem 0.75rem',
                backgroundColor: '#ee5a24',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              <i className="fas fa-eye" style={{ marginRight: '0.25rem' }}></i>
              View
            </button>
          </td>
        </tr>
      )
    }

    return (
      <div className="react-account-section">
        <div className="react-section-header">
          <h2>My Puja Bookings</h2>
          <p>View your past & upcoming puja bookings</p>
        </div>

        {/* Upcoming Bookings Section */}
        {upcomingBookings.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ 
              fontSize: '1.1rem', 
              color: '#59359a', 
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <i className="fas fa-calendar-alt"></i>
              Upcoming Pujas ({upcomingBookings.length})
            </h3>
            <div className="react-table-container">
              <table className="react-data-table">
                <thead>
                  <tr>
                    <th>S. No.</th>
                    <th>Order ID</th>
                    <th>Puja Name</th>
                    <th>Puja Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingBookings.map((booking, idx) => renderBookingRow(booking, idx, true))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Past Bookings Section */}
        <div>
          <h3 style={{ 
            fontSize: '1.1rem', 
            color: '#666', 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <i className="fas fa-history"></i>
            {upcomingBookings.length > 0 ? 'Past Pujas' : 'All Puja Bookings'} ({pastBookings.length > 0 ? pastBookings.length : pujaBookings.length})
          </h3>
          <div className="react-table-container">
            <table className="react-data-table">
              <thead>
                <tr>
                  <th>S. No.</th>
                  <th>Order ID</th>
                  <th>Puja Name</th>
                  <th>Puja Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(pastBookings.length > 0 ? pastBookings : pujaBookings).map((booking, idx) => renderBookingRow(booking, idx, false))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Pagination */}
        {pujaBookingsTotal > pujaBookingsPageSize && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem', gap: '0.5rem' }}>
            <button
              onClick={() => fetchPujaBookingsData(pujaBookingsPage - 1)}
              disabled={pujaBookingsPage <= 1 || loadingPujaBookings}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: pujaBookingsPage <= 1 ? '#ccc' : '#ee5a24',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: pujaBookingsPage <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <i className="fas fa-chevron-left"></i> Previous
            </button>
            <span style={{ padding: '0.5rem 1rem', color: '#666' }}>
              Page {pujaBookingsPage} of {Math.ceil(pujaBookingsTotal / pujaBookingsPageSize)}
            </span>
            <button
              onClick={() => fetchPujaBookingsData(pujaBookingsPage + 1)}
              disabled={pujaBookingsPage >= Math.ceil(pujaBookingsTotal / pujaBookingsPageSize) || loadingPujaBookings}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: pujaBookingsPage >= Math.ceil(pujaBookingsTotal / pujaBookingsPageSize) ? '#ccc' : '#ee5a24',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: pujaBookingsPage >= Math.ceil(pujaBookingsTotal / pujaBookingsPageSize) ? 'not-allowed' : 'pointer'
              }}
            >
              Next <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        )}

        {/* Booking Details Modal */}
        {showPujaBookingDetails && selectedPujaBooking && (
          <Modal 
            isOpen={showPujaBookingDetails} 
            onClose={() => {
              setShowPujaBookingDetails(false)
              setSelectedPujaBooking(null)
            }}
            title="Puja Booking Details"
          >
            <div style={{ padding: '1rem' }}>
              {/* Puja Info */}
              <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '1rem', 
                borderRadius: '8px', 
                marginBottom: '1rem' 
              }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  {(selectedPujaBooking.group_puja?.puja_image || selectedPujaBooking.puja_image) && (
                    <img 
                      src={selectedPujaBooking.group_puja?.puja_image || selectedPujaBooking.puja_image} 
                      alt="Puja"
                      style={{ 
                        width: '100px', 
                        height: '100px', 
                        objectFit: 'cover', 
                        borderRadius: '8px' 
                      }}
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>
                      {selectedPujaBooking.group_puja?.puja_name || selectedPujaBooking.puja_name || 'Puja'}
                    </h3>
                    {selectedPujaBooking.group_puja?.puja_type && (
                      <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>
                        <i className="fas fa-tag" style={{ marginRight: '0.5rem' }}></i>
                        {selectedPujaBooking.group_puja.puja_type}
                      </p>
                    )}
                    {selectedPujaBooking.group_puja?.temple_name && (
                      <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>
                        <i className="fas fa-gopuram" style={{ marginRight: '0.5rem' }}></i>
                        {selectedPujaBooking.group_puja.temple_name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Details Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '1rem',
                marginBottom: '1rem' 
              }}>
                <div style={{ backgroundColor: '#fff', padding: '0.75rem', borderRadius: '4px', border: '1px solid #eee' }}>
                  <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '0.25rem' }}>Order ID</div>
                  <div style={{ fontWeight: '500', fontFamily: 'monospace' }}>#{selectedPujaBooking.id || selectedPujaBooking.order_id}</div>
                </div>
                <div style={{ backgroundColor: '#fff', padding: '0.75rem', borderRadius: '4px', border: '1px solid #eee' }}>
                  <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '0.25rem' }}>Booking Date</div>
                  <div style={{ fontWeight: '500' }}>{formatDateTime(selectedPujaBooking.created_at)}</div>
                </div>
                <div style={{ backgroundColor: '#fff', padding: '0.75rem', borderRadius: '4px', border: '1px solid #eee' }}>
                  <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '0.25rem' }}>Puja Date</div>
                  <div style={{ fontWeight: '500' }}>{formatDate(selectedPujaBooking.puja_date || selectedPujaBooking.group_puja?.puja_date)}</div>
                </div>
                <div style={{ backgroundColor: '#fff', padding: '0.75rem', borderRadius: '4px', border: '1px solid #eee' }}>
                  <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '0.25rem' }}>Puja Time</div>
                  <div style={{ fontWeight: '500' }}>{selectedPujaBooking.puja_time || selectedPujaBooking.group_puja?.puja_time || 'N/A'}</div>
                </div>
                <div style={{ backgroundColor: '#fff', padding: '0.75rem', borderRadius: '4px', border: '1px solid #eee' }}>
                  <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '0.25rem' }}>Status</div>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    backgroundColor: getStatusBadgeStyle(selectedPujaBooking.status).bg,
                    color: getStatusBadgeStyle(selectedPujaBooking.status).color
                  }}>
                    {getStatusBadgeStyle(selectedPujaBooking.status).text}
                  </span>
                </div>
                <div style={{ backgroundColor: '#fff', padding: '0.75rem', borderRadius: '4px', border: '1px solid #eee' }}>
                  <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '0.25rem' }}>Payment Status</div>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    backgroundColor: getPaymentBadgeStyle(selectedPujaBooking.payment_status).bg,
                    color: getPaymentBadgeStyle(selectedPujaBooking.payment_status).color
                  }}>
                    {getPaymentBadgeStyle(selectedPujaBooking.payment_status).text}
                  </span>
                </div>
              </div>

              {/* Devotee Details */}
              {(selectedPujaBooking.devotee_name || selectedPujaBooking.gotra || selectedPujaBooking.nakshatra) && (
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '1rem', color: '#333', marginBottom: '0.75rem' }}>
                    <i className="fas fa-user" style={{ marginRight: '0.5rem', color: '#ee5a24' }}></i>
                    Devotee Details
                  </h4>
                  <div style={{ 
                    backgroundColor: '#fff', 
                    padding: '1rem', 
                    borderRadius: '4px', 
                    border: '1px solid #eee' 
                  }}>
                    {selectedPujaBooking.devotee_name && (
                      <p style={{ margin: '0 0 0.5rem 0' }}><strong>Name:</strong> {selectedPujaBooking.devotee_name}</p>
                    )}
                    {selectedPujaBooking.gotra && (
                      <p style={{ margin: '0 0 0.5rem 0' }}><strong>Gotra:</strong> {selectedPujaBooking.gotra}</p>
                    )}
                    {selectedPujaBooking.nakshatra && (
                      <p style={{ margin: '0 0 0.5rem 0' }}><strong>Nakshatra:</strong> {selectedPujaBooking.nakshatra}</p>
                    )}
                    {selectedPujaBooking.rashi && (
                      <p style={{ margin: '0' }}><strong>Rashi:</strong> {selectedPujaBooking.rashi}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Price Breakdown */}
              <div style={{ 
                backgroundColor: '#fff4e6', 
                padding: '1rem', 
                borderRadius: '8px',
                border: '1px solid #ee5a24' 
              }}>
                <h4 style={{ fontSize: '1rem', color: '#333', marginBottom: '0.75rem' }}>
                  <i className="fas fa-receipt" style={{ marginRight: '0.5rem', color: '#ee5a24' }}></i>
                  Price Details
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Puja Amount:</span>
                  <span>₹{parseFloat(selectedPujaBooking.puja_amount || selectedPujaBooking.group_puja?.price || 0).toFixed(2)}</span>
                </div>
                {selectedPujaBooking.prasad_amount && parseFloat(selectedPujaBooking.prasad_amount) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Prasad Amount:</span>
                    <span>₹{parseFloat(selectedPujaBooking.prasad_amount).toFixed(2)}</span>
                  </div>
                )}
                {selectedPujaBooking.dakshina_amount && parseFloat(selectedPujaBooking.dakshina_amount) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Dakshina:</span>
                    <span>₹{parseFloat(selectedPujaBooking.dakshina_amount).toFixed(2)}</span>
                  </div>
                )}
                {selectedPujaBooking.discount_amount && parseFloat(selectedPujaBooking.discount_amount) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#28a745' }}>
                    <span>Discount:</span>
                    <span>-₹{parseFloat(selectedPujaBooking.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                <hr style={{ margin: '0.5rem 0', borderColor: '#ee5a24' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem', color: '#ee5a24' }}>
                  <span>Total Amount:</span>
                  <span>₹{parseFloat(selectedPujaBooking.amount || selectedPujaBooking.total_amount || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Special Requests */}
              {selectedPujaBooking.special_request && (
                <div style={{ marginTop: '1rem' }}>
                  <h4 style={{ fontSize: '1rem', color: '#333', marginBottom: '0.5rem' }}>
                    <i className="fas fa-comment-alt" style={{ marginRight: '0.5rem', color: '#ee5a24' }}></i>
                    Special Request
                  </h4>
                  <p style={{ 
                    backgroundColor: '#f8f9fa', 
                    padding: '0.75rem', 
                    borderRadius: '4px',
                    margin: 0,
                    fontStyle: 'italic',
                    color: '#666'
                  }}>
                    "{selectedPujaBooking.special_request}"
                  </p>
                </div>
              )}
            </div>
          </Modal>
        )}
      </div>
    )
  }

  // Render Intakes Section
  const renderIntakesSection = () => {
    const formatDate = (dateStr) => {
      if (!dateStr) return 'N/A'
      try {
        return new Date(dateStr).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      } catch {
        return dateStr
      }
    }

    const formatDateTime = (dateStr) => {
      if (!dateStr) return 'N/A'
      try {
        return new Date(dateStr).toLocaleString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      } catch {
        return dateStr
      }
    }

    const getIntakeTypeLabel = (type) => {
      switch(type?.toLowerCase()) {
        case 'chat': return { text: 'Chat', bg: '#cfe2ff', color: '#084298' }
        case 'call': return { text: 'Call', bg: '#d4edda', color: '#155724' }
        case 'video': return { text: 'Video Call', bg: '#e0cffc', color: '#59359a' }
        default: return { text: type || 'N/A', bg: '#e9ecef', color: '#6c757d' }
      }
    }

    if (loadingIntakes && intakes.length === 0) {
      return (
        <div className="react-account-section">
          <div className="react-section-header">
            <h2>My Intakes</h2>
            <p>View your consultation intake forms</p>
          </div>
          <div className="react-no-data" style={{padding: '2rem'}}>Loading intakes...</div>
        </div>
      )
    }

    if (intakes.length === 0) {
      return (
        <div className="react-account-section">
          <div className="react-section-header">
            <h2>My Intakes</h2>
            <p>View your consultation intake forms</p>
          </div>
          <div className="react-no-data" style={{
            padding: '3rem',
            textAlign: 'center',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <i className="fas fa-file-alt" style={{ fontSize: '3rem', color: '#ccc', marginBottom: '1rem', display: 'block' }}></i>
            <p style={{ color: '#666', marginBottom: '1rem' }}>No intake forms found</p>
            <p style={{ color: '#999', fontSize: '0.9rem' }}>Your intake form data will appear here after consultations</p>
          </div>
        </div>
      )
    }

    return (
      <div className="react-account-section">
        <div className="react-section-header">
          <h2>My Intakes</h2>
          <p>View your consultation intake forms</p>
        </div>

        <div className="react-table-container">
          <table className="react-data-table">
            <thead>
              <tr>
                <th>S. No.</th>
                <th>Name</th>
                <th>Date of Birth</th>
                <th>Birth Place</th>
                <th>Topic</th>
                <th>Type</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {intakes.map((intake, idx) => {
                const typeStyle = getIntakeTypeLabel(intake.intake_type)
                return (
                  <tr key={intake.id || idx}>
                    <td>{idx + 1}</td>
                    <td style={{ fontWeight: '500' }}>{intake.name || 'N/A'}</td>
                    <td>{formatDate(intake.dob)}</td>
                    <td>{intake.birth_place || 'N/A'}</td>
                    <td>{intake.topic || 'N/A'}</td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        backgroundColor: typeStyle.bg,
                        color: typeStyle.color
                      }}>
                        {typeStyle.text}
                      </span>
                    </td>
                    <td>{formatDateTime(intake.created_at)}</td>
                    <td>
                      <button
                        onClick={() => {
                          setSelectedIntake(intake)
                          setShowIntakeDetails(true)
                        }}
                        style={{
                          padding: '0.4rem 0.75rem',
                          backgroundColor: '#ee5a24',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        <i className="fas fa-eye" style={{ marginRight: '0.25rem' }}></i>
                        View
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        {/* Load More Button */}
        {hasMoreIntakes && (
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button 
              className="react-load-more-btn"
              onClick={() => fetchIntakesData(intakesOffset, true)}
              disabled={loadingIntakes}
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: '#ee5a24',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loadingIntakes ? 'not-allowed' : 'pointer',
                opacity: loadingIntakes ? 0.6 : 1
              }}
            >
              {loadingIntakes ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}

        {/* Intake Details Modal */}
        {showIntakeDetails && selectedIntake && (
          <Modal 
            isOpen={showIntakeDetails} 
            onClose={() => {
              setShowIntakeDetails(false)
              setSelectedIntake(null)
            }}
            title="Intake Details"
          >
            <div style={{ padding: '1rem' }}>
              {/* Primary Details */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', color: '#333', marginBottom: '0.75rem', borderBottom: '2px solid #ee5a24', paddingBottom: '0.5rem' }}>
                  <i className="fas fa-user" style={{ marginRight: '0.5rem', color: '#ee5a24' }}></i>
                  Personal Details
                </h4>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '1rem'
                }}>
                  <div style={{ backgroundColor: '#f8f9fa', padding: '0.75rem', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '0.25rem' }}>Name</div>
                    <div style={{ fontWeight: '500' }}>{selectedIntake.name || 'N/A'}</div>
                  </div>
                  <div style={{ backgroundColor: '#f8f9fa', padding: '0.75rem', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '0.25rem' }}>Gender</div>
                    <div style={{ fontWeight: '500', textTransform: 'capitalize' }}>{selectedIntake.gender || 'N/A'}</div>
                  </div>
                  <div style={{ backgroundColor: '#f8f9fa', padding: '0.75rem', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '0.25rem' }}>Date of Birth</div>
                    <div style={{ fontWeight: '500' }}>{formatDate(selectedIntake.dob)}</div>
                  </div>
                  <div style={{ backgroundColor: '#f8f9fa', padding: '0.75rem', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '0.25rem' }}>Time of Birth</div>
                    <div style={{ fontWeight: '500' }}>{selectedIntake.tob || 'N/A'}</div>
                  </div>
                  <div style={{ backgroundColor: '#f8f9fa', padding: '0.75rem', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '0.25rem' }}>Birth Place</div>
                    <div style={{ fontWeight: '500' }}>{selectedIntake.birth_place || 'N/A'}</div>
                  </div>
                  <div style={{ backgroundColor: '#f8f9fa', padding: '0.75rem', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '0.25rem' }}>Marital Status</div>
                    <div style={{ fontWeight: '500', textTransform: 'capitalize' }}>{selectedIntake.marital_status || 'N/A'}</div>
                  </div>
                  <div style={{ backgroundColor: '#f8f9fa', padding: '0.75rem', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '0.25rem' }}>Occupation</div>
                    <div style={{ fontWeight: '500' }}>{selectedIntake.occupation || 'N/A'}</div>
                  </div>
                  <div style={{ backgroundColor: '#f8f9fa', padding: '0.75rem', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '0.25rem' }}>Intake Type</div>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      backgroundColor: getIntakeTypeLabel(selectedIntake.intake_type).bg,
                      color: getIntakeTypeLabel(selectedIntake.intake_type).color
                    }}>
                      {getIntakeTypeLabel(selectedIntake.intake_type).text}
                    </span>
                  </div>
                </div>
              </div>

              {/* Topic & Other Info */}
              {(selectedIntake.topic || selectedIntake.other) && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '1rem', color: '#333', marginBottom: '0.75rem', borderBottom: '2px solid #ee5a24', paddingBottom: '0.5rem' }}>
                    <i className="fas fa-comment-alt" style={{ marginRight: '0.5rem', color: '#ee5a24' }}></i>
                    Consultation Topic
                  </h4>
                  {selectedIntake.topic && (
                    <div style={{ backgroundColor: '#fff4e6', padding: '1rem', borderRadius: '4px', marginBottom: '0.5rem', border: '1px solid #ee5a24' }}>
                      <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '0.25rem' }}>Topic</div>
                      <div style={{ fontWeight: '500' }}>{selectedIntake.topic}</div>
                    </div>
                  )}
                  {selectedIntake.other && (
                    <div style={{ backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '4px' }}>
                      <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '0.25rem' }}>Additional Info</div>
                      <div>{selectedIntake.other}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Partner Details (if available) */}
              {(selectedIntake.partner_name || selectedIntake.partner_dob || selectedIntake.partner_birth_place) && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '1rem', color: '#333', marginBottom: '0.75rem', borderBottom: '2px solid #e0cffc', paddingBottom: '0.5rem' }}>
                    <i className="fas fa-heart" style={{ marginRight: '0.5rem', color: '#59359a' }}></i>
                    Partner Details
                  </h4>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)', 
                    gap: '1rem'
                  }}>
                    <div style={{ backgroundColor: '#f8f9fa', padding: '0.75rem', borderRadius: '4px' }}>
                      <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '0.25rem' }}>Partner Name</div>
                      <div style={{ fontWeight: '500' }}>{selectedIntake.partner_name || 'N/A'}</div>
                    </div>
                    <div style={{ backgroundColor: '#f8f9fa', padding: '0.75rem', borderRadius: '4px' }}>
                      <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '0.25rem' }}>Partner Gender</div>
                      <div style={{ fontWeight: '500', textTransform: 'capitalize' }}>{selectedIntake.partner_gender || 'N/A'}</div>
                    </div>
                    <div style={{ backgroundColor: '#f8f9fa', padding: '0.75rem', borderRadius: '4px' }}>
                      <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '0.25rem' }}>Partner DOB</div>
                      <div style={{ fontWeight: '500' }}>{formatDate(selectedIntake.partner_dob)}</div>
                    </div>
                    <div style={{ backgroundColor: '#f8f9fa', padding: '0.75rem', borderRadius: '4px' }}>
                      <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '0.25rem' }}>Partner Time of Birth</div>
                      <div style={{ fontWeight: '500' }}>{selectedIntake.partner_tob || 'N/A'}</div>
                    </div>
                    <div style={{ backgroundColor: '#f8f9fa', padding: '0.75rem', borderRadius: '4px', gridColumn: 'span 2' }}>
                      <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '0.25rem' }}>Partner Birth Place</div>
                      <div style={{ fontWeight: '500' }}>{selectedIntake.partner_birth_place || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Location Details */}
              {(selectedIntake.lat || selectedIntake.long) && (
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '1rem', color: '#333', marginBottom: '0.75rem', borderBottom: '2px solid #cfe2ff', paddingBottom: '0.5rem' }}>
                    <i className="fas fa-map-marker-alt" style={{ marginRight: '0.5rem', color: '#084298' }}></i>
                    Location Coordinates
                  </h4>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(2, 1fr)', 
                    gap: '1rem'
                  }}>
                    <div style={{ backgroundColor: '#f8f9fa', padding: '0.75rem', borderRadius: '4px' }}>
                      <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '0.25rem' }}>Latitude</div>
                      <div style={{ fontWeight: '500', fontFamily: 'monospace' }}>{selectedIntake.lat || 'N/A'}</div>
                    </div>
                    <div style={{ backgroundColor: '#f8f9fa', padding: '0.75rem', borderRadius: '4px' }}>
                      <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '0.25rem' }}>Longitude</div>
                      <div style={{ fontWeight: '500', fontFamily: 'monospace' }}>{selectedIntake.long || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Meta Info */}
              <div style={{ 
                backgroundColor: '#e9ecef', 
                padding: '0.75rem', 
                borderRadius: '4px',
                fontSize: '0.85rem',
                color: '#666',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span><strong>ID:</strong> #{selectedIntake.id}</span>
                <span><strong>Created:</strong> {formatDateTime(selectedIntake.created_at)}</span>
              </div>
            </div>
          </Modal>
        )}
      </div>
    )
  }

  const renderAdminChatChannelsSection = () => {
    console.log('[Customer Dashboard] renderAdminChatChannelsSection - channels:', adminChatChannels.length, 'loading:', loadingAdminChats)
    
    if (loadingAdminChats && adminChatChannels.length === 0) {
      return (
        <div className="react-account-section">
          <div className="react-section-header">
            <h2>Admin Chat Channels</h2>
            <p>View your communication channels with support team</p>
          </div>
          <div className="react-no-data" style={{padding: '2rem'}}>Loading channels...</div>
        </div>
      )
    }

    return (
      <div className="react-account-section">
        <div className="react-section-header">
          <h2>Admin Chat Channels</h2>
          <p>View your communication channels with support team</p>
        </div>

        <div className="react-table-container">
          <table className="react-data-table">
            <thead>
              <tr>
                <th>S. No.</th>
                <th>Channel Name</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {adminChatChannels.map((channel, idx) => (
                <tr key={channel.id || idx}>
                  <td>{idx + 1}</td>
                  <td>{channel.channelName}</td>
                  <td>
                    <span 
                      className={channel.status === 1 ? 'react-badge react-success' : 'react-badge react-danger'}
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        backgroundColor: channel.status === 1 ? '#d4edda' : '#f8d7da',
                        color: channel.status === 1 ? '#155724' : '#721c24'
                      }}
                    >
                      {channel.status === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{channel.createdAt}</td>
                  <td>{channel.updatedAt}</td>
                </tr>
              ))}
              {adminChatChannels.length === 0 && !loadingAdminChats && (
                <tr>
                  <td colSpan="5" className="react-no-data">
                    No admin chat channels found
                  </td>
                </tr>
              )}
              {loadingAdminChats && adminChatChannels.length === 0 && (
                <tr>
                  <td colSpan="5" className="react-no-data" style={{padding: '1rem'}}>Loading channels...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {hasMoreAdminChats && adminChatChannels.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button 
              className="react-load-more-btn"
              onClick={() => fetchAdminChatChannels(adminChatOffset, true)}
              disabled={loadingAdminChats}
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: '#ee5a24',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loadingAdminChats ? 'not-allowed' : 'pointer',
                opacity: loadingAdminChats ? 0.6 : 1
              }}
            >
              {loadingAdminChats ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    )
  }

  const renderAdminChatHistorySection = () => {
    console.log('[Customer Dashboard] renderAdminChatHistorySection - messages:', adminChatHistory.length, 'loading:', loadingAdminChatHistory)
    
    if (loadingAdminChatHistory && adminChatHistory.length === 0) {
      return (
        <div className="react-account-section">
          <div className="react-section-header">
            <h2>Admin Chat History</h2>
            <p>View your message history with support team</p>
          </div>
          <div className="react-no-data" style={{padding: '2rem'}}>Loading chat history...</div>
        </div>
      )
    }

    return (
      <div className="react-account-section">
        <div className="react-section-header">
          <h2>Admin Chat History</h2>
          <p>View your message history with support team</p>
        </div>

        {/* Channel filter */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ marginRight: '0.5rem', fontWeight: '500' }}>Filter by Channel:</label>
          <select 
            value={selectedChannel}
            onChange={(e) => {
              setSelectedChannel(e.target.value)
              fetchAdminChatHistory(e.target.value, 0, false)
            }}
            style={{
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          >
            <option value="">All Channels</option>
            {adminChatChannels.map(channel => (
              <option key={channel.id} value={channel.channelName}>
                {channel.channelName}
              </option>
            ))}
          </select>
        </div>

        <div className="react-table-container">
          <table className="react-data-table">
            <thead>
              <tr>
                <th>S. No.</th>
                <th>Channel</th>
                <th>Unique ID</th>
                <th>Message</th>
                <th>Type</th>
                <th>File</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {adminChatHistory.map((message, idx) => (
                <tr key={message.id || idx}>
                  <td>{idx + 1}</td>
                  <td>{message.channelName}</td>
                  <td>{message.uniqeid}</td>
                  <td style={{ maxWidth: '300px', whiteSpace: 'normal', wordWrap: 'break-word' }}>
                    {message.message?.substring(0, 100)}
                    {message.message?.length > 100 ? '...' : ''}
                  </td>
                  <td>
                    <span 
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        backgroundColor: '#e7f3ff',
                        color: '#004085'
                      }}
                    >
                      {message.messageType}
                    </span>
                  </td>
                  <td>
                    {message.fileUrl ? (
                      <a 
                        href={message.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: '#ee5a24' }}
                      >
                        <i className="fas fa-file"></i> View
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>{message.createdAt}</td>
                </tr>
              ))}
              {adminChatHistory.length === 0 && !loadingAdminChatHistory && (
                <tr>
                  <td colSpan="7" className="react-no-data">
                    No chat history found
                  </td>
                </tr>
              )}
              {loadingAdminChatHistory && adminChatHistory.length === 0 && (
                <tr>
                  <td colSpan="7" className="react-no-data" style={{padding: '1rem'}}>Loading chat history...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {hasMoreAdminChatHistory && adminChatHistory.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button 
              className="react-load-more-btn"
              onClick={() => fetchAdminChatHistory(selectedChannel, adminChatHistoryOffset, true)}
              disabled={loadingAdminChatHistory}
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: '#ee5a24',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loadingAdminChatHistory ? 'not-allowed' : 'pointer',
                opacity: loadingAdminChatHistory ? 0.6 : 1
              }}
            >
              {loadingAdminChatHistory ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    )
  }

  const renderAppointmentDurationsSection = () => {
    console.log('[Customer Dashboard] renderAppointmentDurationsSection - durations:', appointmentDurations.length, 'loading:', loadingAppointmentDurations)
    
    if (loadingAppointmentDurations && appointmentDurations.length === 0) {
      return (
        <div className="react-account-section">
          <div className="react-section-header">
            <h2>Appointment Durations</h2>
            <p>Manage appointment duration settings and pricing</p>
          </div>
          <div className="react-no-data" style={{padding: '2rem'}}>Loading durations...</div>
        </div>
      )
    }

    return (
      <div className="react-account-section">
        <div className="react-section-header">
          <h2>Appointment Durations</h2>
          <p>Manage appointment duration settings and pricing</p>
        </div>

        <div className="react-table-container">
          <table className="react-data-table">
            <thead>
              <tr>
                <th>S. No.</th>
                <th>User ID</th>
                <th>Duration</th>
                <th>Duration Type</th>
                <th>Price</th>
                <th>Status</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {appointmentDurations.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td>{idx + 1}</td>
                  <td>{item.userUniId}</td>
                  <td>{item.duration}</td>
                  <td style={{ textTransform: 'capitalize' }}>{item.durationType}</td>
                  <td>₹{item.price.toFixed(2)}</td>
                  <td>
                    <span 
                      className={item.status === 1 ? 'react-badge react-success' : 'react-badge react-danger'}
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        backgroundColor: item.status === 1 ? '#d4edda' : '#f8d7da',
                        color: item.status === 1 ? '#155724' : '#721c24'
                      }}
                    >
                      {item.status === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{item.createdAt}</td>
                </tr>
              ))}
              {appointmentDurations.length === 0 && !loadingAppointmentDurations && (
                <tr>
                  <td colSpan="7" className="react-no-data">
                    No appointment durations found
                  </td>
                </tr>
              )}
              {loadingAppointmentDurations && appointmentDurations.length === 0 && (
                <tr>
                  <td colSpan="7" className="react-no-data" style={{padding: '1rem'}}>Loading durations...</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {hasMoreAppointmentDurations && appointmentDurations.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <button 
              className="react-load-more-btn"
              onClick={() => fetchAppointmentDurations(appointmentDurationsOffset, true)}
              disabled={loadingAppointmentDurations}
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: '#ee5a24',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loadingAppointmentDurations ? 'not-allowed' : 'pointer',
                opacity: loadingAppointmentDurations ? 0.6 : 1
              }}
            >
              {loadingAppointmentDurations ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    )
  }

  const renderKundlisSection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>My Kundlis</h2>
        <p>Manage your Kundli records</p>
      </div>

      {loadingKundlis ? (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p>Loading kundalis...</p>
        </div>
      ) : (
      <div className="react-table-container">
        <table className="react-data-table">
          <thead>
            <tr>
              <th>S. No.</th>
              <th>Kundali ID</th>
              <th>Name</th>
                <th>Birth Date</th>
                <th>Birth Time</th>
                <th>Place</th>
                <th>Method</th>
                <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loadingKundlis ? (
              <tr>
                <td colSpan="9" className="react-no-data">Loading kundalis...</td>
              </tr>
            ) : kundlis.length > 0 ? (
              kundlis.map((row, idx) => (
                <tr key={row.id || idx}>
                  <td>{(kundlisPage - 1) * kundlisPageSize + idx + 1}</td>
                  <td>{row.kundaliId}</td>
                  <td>{row.name}</td>
                  <td>{row.dob || 'N/A'}</td>
                  <td>{row.tob || 'N/A'}</td>
                  <td>{row.place || 'N/A'}</td>
                  <td>{row.method || 'd1'}</td>
                  <td>{row.created_at || 'N/A'}</td>
                  <td>
                    <button 
                      className="react-btn react-btn-sm react-btn-outline"
                      onClick={async () => {
                        setSelectedKundali(row)
                        setViewKundaliModal(true)
                        setKundaliChart(null)
                        setLoadingChart(true)
                        
                        // Fetch chart
                        const currentUser = getCurrentUser()
                        if (currentUser && currentUser.api_key && row.id) {
                          const chartResult = await getKundaliChart(row.id)
                          if (chartResult.status === 1 && chartResult.data) {
                            setKundaliChart(chartResult.data.chart_image || chartResult.data)
                          }
                        }
                        setLoadingChart(false)
                      }}
                    >
                      <i className="fas fa-eye"></i> View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="react-no-data">No Records Found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}
        <Pagination
        currentPage={kundlisPage}
        totalItems={kundlis.length}
        pageSize={kundlisPageSize}
        onPageChange={(page) => { setKundlisPage(page); fetchKundalis() }}
        onPageSizeChange={(s) => { setKundlisPageSize(s); setKundlisPage(1); fetchKundalis() }}
      />
      
      {/* View Kundali Modal */}
      {viewKundaliModal && selectedKundali && (
        <Modal
          isOpen={viewKundaliModal}
          onClose={() => {
            setViewKundaliModal(false)
            setSelectedKundali(null)
            setKundaliChart(null)
            setLoadingChart(false)
          }}
          title="Kundali Details"
        >
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ marginBottom: '15px', color: '#333', borderBottom: '2px solid #ee5a24', paddingBottom: '10px' }}>
                <i className="fas fa-star" style={{ marginRight: '10px', color: '#ee5a24' }}></i>
                Kundali Information
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                <div style={{ padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                  <strong style={{ color: '#666', fontSize: '13px' }}>Kundali ID:</strong>
                  <p style={{ margin: '5px 0 0 0', fontSize: '16px', fontWeight: '500' }}>{selectedKundali.kundaliId}</p>
                </div>
                
                <div style={{ padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                  <strong style={{ color: '#666', fontSize: '13px' }}>Name:</strong>
                  <p style={{ margin: '5px 0 0 0', fontSize: '16px', fontWeight: '500' }}>{selectedKundali.name}</p>
                </div>
                
                <div style={{ padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                  <strong style={{ color: '#666', fontSize: '13px' }}>Birth Date:</strong>
                  <p style={{ margin: '5px 0 0 0', fontSize: '16px', fontWeight: '500' }}>{selectedKundali.dob || 'N/A'}</p>
                </div>
                
                <div style={{ padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                  <strong style={{ color: '#666', fontSize: '13px' }}>Birth Time:</strong>
                  <p style={{ margin: '5px 0 0 0', fontSize: '16px', fontWeight: '500' }}>{selectedKundali.tob || 'N/A'}</p>
                </div>
                
                <div style={{ padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '8px', gridColumn: '1 / -1' }}>
                  <strong style={{ color: '#666', fontSize: '13px' }}>Place of Birth:</strong>
                  <p style={{ margin: '5px 0 0 0', fontSize: '16px', fontWeight: '500' }}>{selectedKundali.place || 'N/A'}</p>
                </div>
                
                <div style={{ padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                  <strong style={{ color: '#666', fontSize: '13px' }}>Chart Method:</strong>
                  <p style={{ margin: '5px 0 0 0', fontSize: '16px', fontWeight: '500' }}>{selectedKundali.method || 'd1'}</p>
                </div>
                
                <div style={{ padding: '12px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                  <strong style={{ color: '#666', fontSize: '13px' }}>Created On:</strong>
                  <p style={{ margin: '5px 0 0 0', fontSize: '16px', fontWeight: '500' }}>
                    {selectedKundali.created_at ? new Date(selectedKundali.created_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Kundali Chart Display */}
            <div style={{ marginTop: '30px' }}>
              <h3 style={{ marginBottom: '15px', color: '#333', borderBottom: '2px solid #ee5a24', paddingBottom: '10px' }}>
                <i className="fas fa-chart-pie" style={{ marginRight: '10px', color: '#ee5a24' }}></i>
                Kundali Chart
              </h3>
              
              {loadingChart ? (
                <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                  <p style={{ color: '#666', fontSize: '16px' }}>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
                    Generating chart...
                  </p>
                </div>
              ) : kundaliChart ? (
                <div style={{ 
                  padding: '20px', 
                  backgroundColor: '#fff', 
                  borderRadius: '8px', 
                  border: '1px solid #e0e0e0',
                  textAlign: 'center',
                  overflow: 'auto'
                }}>
                  {kundaliChart.startsWith('data:image') ? (
                    <img 
                      src={kundaliChart} 
                      alt="Kundali Chart" 
                      style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }}
                    />
                  ) : kundaliChart.startsWith('<svg') ? (
                    <div 
                      dangerouslySetInnerHTML={{ __html: kundaliChart }}
                      style={{ maxWidth: '100%', overflow: 'auto' }}
                    />
                  ) : (
                    <img 
                      src={`data:image/svg+xml;base64,${kundaliChart}`} 
                      alt="Kundali Chart" 
                      style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }}
                    />
                  )}
                </div>
              ) : (
                <div style={{ padding: '20px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
                  <p style={{ margin: 0, color: '#856404', fontSize: '14px', textAlign: 'center' }}>
                    <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
                    Chart could not be generated. Please try again later.
                  </p>
                </div>
              )}
            </div>
            
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button
                className="react-btn react-btn-primary"
                onClick={() => {
                  setViewKundaliModal(false)
                  setSelectedKundali(null)
                  setKundaliChart(null)
                  setLoadingChart(false)
                }}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )

  const renderChatHistorySection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>My Chat History</h2>
        <p>View your chat sessions with astrologers</p>
      </div>

      <div className="react-filter-section">
        <div className="react-filter-options">
          <select className="react-filter-select">
            <option>All Chats</option>
            <option>Completed</option>
            <option>Declined</option>
            <option>Pending</option>
          </select>
        </div>
      </div>

      <div className="react-table-container">
        <table className="react-data-table">
          <thead>
            <tr>
              <th>S.No.</th>
              <th>Astrologer</th>
              <th>Unique ID</th>
              <th>Order Date</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Call Type</th>
            </tr>
          </thead>
          <tbody>
            {loadingChats ? (
              <tr>
                <td colSpan="9" className="react-no-data" style={{ textAlign: 'center', padding: '20px' }}>
                  Loading chat history...
                </td>
              </tr>
            ) : getPaginatedItems(chats, chatPage, chatPageSize).length > 0 ? (
              getPaginatedItems(chats, chatPage, chatPageSize).map((row, idx) => (
                <tr key={idx}>
                  <td>{(chatPage - 1) * chatPageSize + idx + 1}</td>
                  <td>{row.astrologer}</td>
                  <td>{row.uniqueId}</td>
                  <td>{row.orderDate}</td>
                  <td>{row.start}</td>
                  <td>{row.end}</td>
                  <td>{row.duration}</td>
                  <td><span className={`react-badge ${row.status === 'Active' ? 'react-success' : row.status.includes('Declined') ? 'react-declined' : ''}`}>{row.status}</span></td>
                  <td>{row.type}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="react-no-data">No Records Found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={chatPage}
        totalItems={chats.length}
        pageSize={chatPageSize}
        onPageChange={setChatPage}
        onPageSizeChange={(s) => { setChatPageSize(s); setChatPage(1) }}
      />
    </div>
  )

  const renderWaitingListSection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>My Waiting Time History</h2>
        <p>Track your waiting list history</p>
      </div>

      <div className="react-table-container">
        <table className="react-data-table">
          <thead>
            <tr>
              <th>Astrologer Name</th>
              <th>Unique ID</th>
              <th>Date</th>
              <th>Type</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {getPaginatedItems(waitingList, waitingPage, waitingPageSize).map((row, idx) => (
              <tr key={idx}>
                <td>{row.name}</td>
                <td>{row.uniqueId}</td>
                <td>{row.date}</td>
                <td>{row.type}</td>
                <td>{row.status}</td>
                <td>-</td>
              </tr>
            ))}
            {waitingList.length === 0 && (
              <tr>
                <td colSpan="6" className="react-no-data">No Records Found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={waitingPage}
        totalItems={waitingList.length}
        pageSize={waitingPageSize}
        onPageChange={setWaitingPage}
        onPageSizeChange={(s) => { setWaitingPageSize(s); setWaitingPage(1) }}
      />
    </div>
  )

  const renderCallHistorySection = () => {
    const query = callSearch.trim().toLowerCase()
    const filtered = query
      ? calls.filter((c) =>
          String(c.astrologer || '').toLowerCase().includes(query) ||
          String(c.uniqueId || '').toLowerCase().includes(query)
        )
      : calls
    const data = getPaginatedItems(filtered, callPage, callPageSize)
    return (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>My Call History</h2>
        <p>View your call sessions with astrologers</p>
      </div>

      <div className="react-filter-section">
        <div className="react-filter-options" style={{width:'100%', gap:'0.75rem', justifyContent:'space-between', flexWrap:'wrap'}}>
          <input
            type="text"
            value={callSearch}
            onChange={(e)=>{ setCallSearch(e.target.value); setCallPage(1) }}
            className="react-form-input"
            placeholder="Search by Astrologer Id or Unique Id"
            style={{maxWidth:'360px'}}
            aria-label="Search calls"
          />
          <select className="react-filter-select">
            <option>All Calls</option>
            <option>Completed</option>
            <option>Missed</option>
            <option>Declined</option>
          </select>
        </div>
      </div>

      {loadingCalls ? (
        <div style={{padding: '40px', textAlign: 'center'}}>
          <p>Loading call history...</p>
        </div>
      ) : (
        <>
        <div className="react-table-container">
        <table className="react-data-table">
          <thead>
            <tr>
              <th>S.No.</th>
              <th>Astrologer</th>
              <th>Unique ID</th>
              <th>Date</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Charge</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr key={idx}>
                <td>{row.sn || (callPage - 1) * callPageSize + idx + 1}</td>
                <td>{row.astrologer}</td>
                <td>{row.uniqueId}</td>
                <td>{row.orderDate || row.date}</td>
                <td>{row.start}</td>
                <td>{row.end}</td>
                <td>{row.duration}</td>
                <td>
                  {(() => {
                    const status = (row.status || '').toString().toLowerCase().trim()
                    let badgeClass = ''
                    let displayStatus = row.status || 'N/A'
                    
                    if (status === 'completed' || status === 'complete' || status === 'success') {
                      badgeClass = 'react-success'
                      displayStatus = 'Completed'
                    } else if (status === 'pending' || status === 'processing' || status === 'in-progress' || status === 'queue' || status === 'request') {
                      badgeClass = 'react-warning'
                      displayStatus = 'Pending'
                    } else if (status === 'declined' || status === 'declined(customer)' || status === 'declined(astrologer)' || status === 'failed' || status === 'cancelled' || status === 'canceled') {
                      badgeClass = 'react-danger'
                      displayStatus = status.includes('declined') ? 'Declined' : status === 'cancelled' || status === 'canceled' ? 'Cancelled' : 'Failed'
                    } else if (status === 'missed') {
                      badgeClass = 'react-info'
                      displayStatus = 'Missed'
                    } else {
                      badgeClass = ''
                    }
                    
                    return (
                      <span className={`react-badge ${badgeClass}`}>
                        {displayStatus}
                      </span>
                    )
                  })()}
                </td>
                <td>₹{row.charge || 0}</td>
                <td>
                  <button 
                    className="react-btn-small react-btn-primary"
                    onClick={() => handleViewCallDetails(row)}
                    title="View call details and shared files"
                  >
                    <i className="fas fa-eye"></i> View
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !loadingCalls && (
              <tr>
                <td colSpan="10" className="react-no-data">No Records Found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={callPage}
        totalItems={filtered.length}
        pageSize={callPageSize}
        onPageChange={setCallPage}
        onPageSizeChange={(s) => { setCallPageSize(s); setCallPage(1) }}
      />
        </>
      )}
    </div>
    )
  }

  const renderCoursesSection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>My Courses</h2>
        <p>View your purchased courses and browse available courses</p>
      </div>

      {/* Toggle Buttons */}
      <div className="react-courses-toggle">
        <button 
          className={`react-toggle-btn ${coursesViewMode === 'purchased' ? 'active' : ''}`}
          onClick={() => setCoursesViewMode('purchased')}
        >
          <i className="fas fa-shopping-bag"></i> My Purchased Courses
        </button>
        <button 
          className={`react-toggle-btn ${coursesViewMode === 'all' ? 'active' : ''}`}
          onClick={() => setCoursesViewMode('all')}
        >
          <i className="fas fa-book-open"></i> All Courses
        </button>
      </div>

      {/* Purchased Courses View */}
      {coursesViewMode === 'purchased' && (
        <>
          {loadingPurchasedCourses ? (
            <div className="react-loading">Loading your purchased courses...</div>
          ) : purchasedCourses.length === 0 ? (
            <div className="react-no-data">
              <i className="fas fa-shopping-cart"></i>
              <p>You haven't purchased any courses yet</p>
              <button className="react-btn-primary" onClick={() => setCoursesViewMode('all')}>
                Browse Courses
              </button>
            </div>
          ) : (
            <div className="react-table-container">
              <table className="react-data-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Order ID</th>
                    <th>Course</th>
                    <th>Subtotal</th>
                    <th>Discount</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {purchasedCourses.map((order, idx) => (
                    <tr key={order.id}>
                      <td>{(purchasedCoursesPage - 1) * purchasedCoursesPageSize + idx + 1}</td>
                      <td><span className="react-order-id">{order.order_id}</span></td>
                      <td>{order.course_title || order.course?.title || `Course #${order.course_id}`}</td>
                      <td>₹{parseFloat(order.subtotal || 0).toFixed(2)}</td>
                      <td className="react-discount">
                        {order.offer_percent > 0 ? (
                          <span>-{order.offer_percent}% (₹{parseFloat(order.offer_amount || 0).toFixed(2)})</span>
                        ) : '-'}
                      </td>
                      <td className="react-total-amount">₹{parseFloat(order.total_amount || 0).toFixed(2)}</td>
                      <td>
                        <span className={`react-status-badge ${order.status === 1 ? 'success' : order.status === 0 ? 'pending' : 'failed'}`}>
                          {order.status === 1 ? 'Completed' : order.status === 0 ? 'Pending' : 'Failed'}
                        </span>
                      </td>
                      <td>{order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {purchasedCourses.length > 0 && (
            <Pagination
              currentPage={purchasedCoursesPage}
              totalItems={purchasedCourses.length}
              pageSize={purchasedCoursesPageSize}
              onPageChange={setPurchasedCoursesPage}
            />
          )}
        </>
      )}

      {/* All Courses View */}
      {coursesViewMode === 'all' && (
        <>
          {loadingCourses ? (
            <div className="react-loading">Loading courses...</div>
          ) : courses.length === 0 ? (
            <div className="react-no-data">
              <i className="fas fa-graduation-cap"></i>
              <p>No courses available</p>
            </div>
          ) : (
            <div className="react-courses-grid">
              {courses.map((course) => (
                <div key={course.id} className="react-course-card">
                  <div className="react-course-image">
                    {course.course_image ? (
                      <img 
                        src={course.course_image.startsWith('http') ? course.course_image : `${import.meta.env.VITE_WELCOME_API?.replace('/api', '') || 'http://localhost:8005'}/${course.course_image}`}
                        alt={course.title}
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect fill="%23ddd" width="300" height="200"/><text fill="%23999" font-size="20" x="50%" y="50%" text-anchor="middle" dy=".3em">No Image</text></svg>'
                        }}
                      />
                    ) : (
                      <div className="react-course-placeholder">
                        <i className="fas fa-book"></i>
                      </div>
                    )}
                  </div>
                  <div className="react-course-content">
                    <h3>{course.title}</h3>
                    <p className="react-course-description">{course.description?.substring(0, 100)}{course.description?.length > 100 ? '...' : ''}</p>
                    <div className="react-course-footer">
                      <span className="react-course-price">₹{parseFloat(course.price || 0).toFixed(2)}</span>
                      {course.video_url && (
                        <a href={course.video_url} target="_blank" rel="noopener noreferrer" className="react-course-video-btn">
                          <i className="fas fa-play-circle"></i> Watch
                        </a>
                      )}
                      {course.whatsapp_group_link && (
                        <a href={course.whatsapp_group_link} target="_blank" rel="noopener noreferrer" className="react-course-whatsapp-btn">
                          <i className="fab fa-whatsapp"></i> Join
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {courses.length > 0 && (
            <Pagination
              currentPage={coursesPage}
              totalItems={courses.length}
              pageSize={coursesPageSize}
              onPageChange={setCoursesPage}
            />
          )}
        </>
      )}
    </div>
  )

  const renderRefundsSection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>My Refunds</h2>
        <p>View your refund requests and their status</p>
      </div>

      {loadingRefunds ? (
        <div className="react-loading">Loading refunds...</div>
      ) : refunds.length === 0 ? (
        <div className="react-no-data">
          <i className="fas fa-undo-alt"></i>
          <p>No refund requests found</p>
        </div>
      ) : (
        <div className="react-table-container">
          <table className="react-data-table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Refund ID</th>
                <th>Type</th>
                <th>Title</th>
                <th>Message</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {refunds.map((refund, idx) => (
                <tr key={refund.id}>
                  <td>{(refundsPage - 1) * refundsPageSize + idx + 1}</td>
                  <td><span className="react-order-id">{refund.unique_id}</span></td>
                  <td><span className="react-type-badge">{refund.type}</span></td>
                  <td>{refund.title}</td>
                  <td className="react-message-cell">{refund.message}</td>
                  <td>
                    <span className={`react-status-badge ${refund.status === '1' || refund.status === 1 ? 'success' : refund.status === '0' || refund.status === 0 ? 'pending' : 'failed'}`}>
                      {refund.status === '1' || refund.status === 1 ? 'Approved' : refund.status === '0' || refund.status === 0 ? 'Pending' : 'Rejected'}
                    </span>
                  </td>
                  <td>{refund.created_at ? new Date(refund.created_at).toLocaleDateString('en-IN') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {refundsTotal > refundsPageSize && (
        <Pagination
          currentPage={refundsPage}
          totalItems={refundsTotal}
          pageSize={refundsPageSize}
          onPageChange={setRefundsPage}
        />
      )}
    </div>
  )

  const renderOffersSection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>Offers & Coupons</h2>
        <p>View all available offers and discount coupons</p>
      </div>

      {loadingOffers ? (
        <div className="react-loading">Loading offers...</div>
      ) : offers.length === 0 ? (
        <div className="react-no-data">
          <i className="fas fa-tags"></i>
          <p>No offers available at the moment</p>
        </div>
      ) : (
        <div className="react-offers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {offers.map((offer) => (
            <div key={offer.id} style={{ 
              backgroundColor: '#fff', 
              borderRadius: '12px', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
              overflow: 'hidden',
              border: '1px solid #eee',
              position: 'relative'
            }}>
              {/* Offer Badge */}
              <div style={{ 
                position: 'absolute', 
                top: '10px', 
                right: '10px',
                backgroundColor: offer.status === 1 ? '#4caf50' : '#9e9e9e',
                color: '#fff',
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: '600'
              }}>
                {offer.status === 1 ? 'Active' : 'Inactive'}
              </div>
              
              {/* Offer Header */}
              <div style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '20px',
                color: '#fff'
              }}>
                <div style={{ fontSize: '12px', opacity: 0.9, marginBottom: '5px' }}>
                  {offer.offer_category || 'General'}
                </div>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '600' }}>
                  {offer.offer_name || 'Special Offer'}
                </h3>
                <div style={{ 
                  display: 'inline-block',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  padding: '8px 15px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '700',
                  letterSpacing: '1px'
                }}>
                  {offer.offer_code || 'N/A'}
                </div>
              </div>
              
              {/* Offer Details */}
              <div style={{ padding: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#999' }}>Discount</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#4caf50' }}>
                      {offer.discount || '0'}%
                    </div>
                  </div>
                  {offer.discount_amount && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', color: '#999' }}>Max Discount</div>
                      <div style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>
                        ₹{parseFloat(offer.discount_amount).toFixed(0)}
                      </div>
                    </div>
                  )}
                </div>
                
                <div style={{ borderTop: '1px dashed #eee', paddingTop: '12px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                    <span style={{ color: '#666' }}>Min Order:</span>
                    <span style={{ fontWeight: '500' }}>₹{offer.minimum_order_amount || '0'}</span>
                  </div>
                  {offer.max_order_amount && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                      <span style={{ color: '#666' }}>Max Order:</span>
                      <span style={{ fontWeight: '500' }}>₹{offer.max_order_amount}</span>
                    </div>
                  )}
                  {offer.user_restriction && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: '#666' }}>Usage Limit:</span>
                      <span style={{ fontWeight: '500' }}>{offer.user_restriction}x per user</span>
                    </div>
                  )}
                </div>
                
                {/* Validity */}
                <div style={{ 
                  backgroundColor: '#f5f5f5', 
                  padding: '10px', 
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#666'
                }}>
                  <i className="fas fa-calendar-alt" style={{ marginRight: '5px' }}></i>
                  Valid: {offer.offer_validity_from || 'N/A'} to {offer.offer_validity_to || 'N/A'}
                </div>
                
                {offer.coupon_description && (
                  <p style={{ 
                    margin: '10px 0 0 0', 
                    fontSize: '13px', 
                    color: '#666',
                    lineHeight: '1.4'
                  }}>
                    {offer.coupon_description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {offers.length > offersPageSize && (
        <Pagination
          currentPage={offersPage}
          totalItems={offers.length}
          pageSize={offersPageSize}
          onPageChange={setOffersPage}
        />
      )}
    </div>
  )

  const renderOfflineServicesSection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>Offline Services</h2>
        <p>Browse available offline service categories</p>
      </div>

      {loadingOfflineServices ? (
        <div className="react-loading">Loading offline services...</div>
      ) : offlineServices.length === 0 ? (
        <div className="react-no-data">
          <i className="fas fa-concierge-bell"></i>
          <p>No offline services available</p>
        </div>
      ) : (
        <div className="react-services-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {offlineServices.map((service) => (
            <div key={service.id} style={{ 
              backgroundColor: '#fff', 
              borderRadius: '12px', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
              overflow: 'hidden',
              border: '1px solid #eee',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)'
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
            }}
            >
              {/* Service Image */}
              <div style={{ 
                height: '160px', 
                backgroundColor: '#f5f5f5',
                overflow: 'hidden',
                position: 'relative'
              }}>
                {service.image ? (
                  <img 
                    src={service.image} 
                    alt={service.title} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.parentElement.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);"><i class="fas fa-concierge-bell" style="font-size:50px;color:#fff;"></i></div>'
                    }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <i className="fas fa-concierge-bell" style={{ fontSize: '50px', color: '#fff' }}></i>
                  </div>
                )}
                
                {/* Status Badge */}
                <div style={{ 
                  position: 'absolute', 
                  top: '10px', 
                  right: '10px',
                  backgroundColor: service.status === 1 ? '#4caf50' : '#9e9e9e',
                  color: '#fff',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  {service.status === 1 ? 'Available' : 'Unavailable'}
                </div>
              </div>
              
              {/* Service Details */}
              <div style={{ padding: '15px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: '600', color: '#333' }}>
                  {service.title}
                </h3>
                
                {service.description && (
                  <p style={{ 
                    margin: '0 0 12px 0', 
                    fontSize: '13px', 
                    color: '#666',
                    lineHeight: '1.5',
                    maxHeight: '40px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {service.description}
                  </p>
                )}
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  paddingTop: '10px',
                  borderTop: '1px solid #eee'
                }}>
                  <span style={{ fontSize: '12px', color: '#999' }}>
                    <i className="fas fa-hashtag" style={{ marginRight: '4px' }}></i>
                    ID: {service.id}
                  </span>
                  <button style={{
                    backgroundColor: '#667eea',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}>
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {offlineServices.length > offlineServicesPageSize && (
        <Pagination
          currentPage={offlineServicesPage}
          totalItems={offlineServices.length}
          pageSize={offlineServicesPageSize}
          onPageChange={setOfflineServicesPage}
        />
      )}
    </div>
  )

  const renderServiceAssignsSection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>Service Assignments</h2>
        <p>View services offered by astrologers with pricing</p>
      </div>

      {loadingOfflineServiceAssigns ? (
        <div className="react-loading">Loading service assignments...</div>
      ) : offlineServiceAssigns.length === 0 ? (
        <div className="react-no-data">
          <i className="fas fa-user-cog"></i>
          <p>No service assignments available</p>
        </div>
      ) : (
        <div className="react-table-container" style={{ overflowX: 'auto' }}>
          <table className="react-data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Image</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Title</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Description</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Price</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Duration</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {offlineServiceAssigns.map((assign) => (
                <tr key={assign.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>
                    {assign.image ? (
                      <img 
                        src={assign.image} 
                        alt={assign.title} 
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div style={{ width: '60px', height: '60px', backgroundColor: '#f0f0f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fas fa-user-cog" style={{ color: '#999', fontSize: '20px' }}></i>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px', fontWeight: '500' }}>{assign.title || '-'}</td>
                  <td style={{ padding: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#666' }}>
                    {assign.description || '-'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div>
                      <span style={{ fontSize: '16px', fontWeight: '600', color: '#4caf50' }}>₹{assign.price || 0}</span>
                      {assign.actual_price && assign.actual_price > assign.price && (
                        <span style={{ fontSize: '12px', color: '#999', textDecoration: 'line-through', marginLeft: '8px' }}>
                          ₹{assign.actual_price}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {assign.duration ? (
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '12px',
                        backgroundColor: '#e3f2fd',
                        color: '#1565c0'
                      }}>
                        {assign.duration} mins
                      </span>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '20px', 
                      fontSize: '11px',
                      fontWeight: '600',
                      backgroundColor: assign.status === 1 ? '#e8f5e9' : '#ffebee',
                      color: assign.status === 1 ? '#2e7d32' : '#c62828'
                    }}>
                      {assign.status === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {offlineServiceAssigns.length > offlineServiceAssignsPageSize && (
        <Pagination
          currentPage={offlineServiceAssignsPage}
          totalItems={offlineServiceAssigns.length}
          pageSize={offlineServiceAssignsPageSize}
          onPageChange={setOfflineServiceAssignsPage}
        />
      )}
    </div>
  )

  const renderServiceGallerySection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>Service Gallery</h2>
        <p>Browse service images</p>
      </div>

      {loadingServiceGalleries ? (
        <div className="react-loading">Loading gallery...</div>
      ) : serviceGalleries.length === 0 ? (
        <div className="react-no-data">
          <i className="fas fa-images"></i>
          <p>No gallery items available</p>
        </div>
      ) : (
        <div className="react-gallery-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
          gap: '16px' 
        }}>
          {serviceGalleries.map((item) => (
            <div key={item.id} style={{ 
              backgroundColor: '#fff', 
              borderRadius: '12px', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
              overflow: 'hidden',
              border: '1px solid #eee',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)'
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
            }}
            >
              {/* Image Container */}
              <div style={{ 
                height: '180px', 
                backgroundColor: '#f5f5f5',
                overflow: 'hidden',
                position: 'relative'
              }}>
                {item.image ? (
                  <img 
                    src={item.image} 
                    alt={`Gallery ${item.id}`} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.parentElement.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#f0f0f0;"><i class="fas fa-image" style="font-size:40px;color:#ccc;"></i></div>'
                    }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0' }}>
                    <i className="fas fa-image" style={{ fontSize: '40px', color: '#ccc' }}></i>
                  </div>
                )}
                
                {/* ID Badge */}
                <div style={{ 
                  position: 'absolute', 
                  top: '10px', 
                  right: '10px',
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '10px',
                  fontWeight: '600'
                }}>
                  #{item.id}
                </div>
              </div>
              
              {/* Details */}
              <div style={{ padding: '10px', fontSize: '11px', color: '#888', textAlign: 'center' }}>
                {item.created_at || '-'}
              </div>
            </div>
          ))}
        </div>
      )}

      {serviceGalleries.length > serviceGalleriesPageSize && (
        <Pagination
          currentPage={serviceGalleriesPage}
          totalItems={serviceGalleries.length}
          pageSize={serviceGalleriesPageSize}
          onPageChange={setServiceGalleriesPage}
        />
      )}
    </div>
  )

  const renderOfflineOrdersSection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>Offline Service Orders</h2>
        <p>View your offline service bookings and orders</p>
      </div>

      {loadingOfflineOrders ? (
        <div className="react-loading">Loading orders...</div>
      ) : offlineOrders.length === 0 ? (
        <div className="react-no-data">
          <i className="fas fa-file-invoice"></i>
          <p>No offline service orders found</p>
        </div>
      ) : (
        <div className="react-table-container" style={{ overflowX: 'auto' }}>
          <table className="react-data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Order ID</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Price</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Total</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Payment</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Date/Time</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Remark</th>
              </tr>
            </thead>
            <tbody>
              {offlineOrders.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      fontFamily: 'monospace', 
                      backgroundColor: '#f0f0f0', 
                      padding: '4px 8px', 
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}>
                      {order.order_id || `#${order.id}`}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ fontSize: '14px', color: '#666' }}>₹{order.price || 0}</span>
                    {parseFloat(order.offer_amount) > 0 && (
                      <div style={{ fontSize: '10px', color: '#4caf50' }}>
                        Offer: -₹{order.offer_amount}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ fontSize: '15px', fontWeight: '600', color: '#333' }}>₹{order.total_amount || 0}</span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '20px', 
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      backgroundColor: order.payment_status === 'paid' ? '#e8f5e9' : order.payment_status === 'failed' ? '#ffebee' : order.payment_status === 'refunded' ? '#e3f2fd' : '#fff3e0',
                      color: order.payment_status === 'paid' ? '#2e7d32' : order.payment_status === 'failed' ? '#c62828' : order.payment_status === 'refunded' ? '#1565c0' : '#ef6c00'
                    }}>
                      {order.payment_status || 'unpaid'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '20px', 
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      backgroundColor: order.status === 'completed' ? '#e8f5e9' : order.status === 'cancelled' ? '#ffebee' : order.status === 'processing' ? '#e3f2fd' : order.status === 'confirmed' ? '#f3e5f5' : '#fff3e0',
                      color: order.status === 'completed' ? '#2e7d32' : order.status === 'cancelled' ? '#c62828' : order.status === 'processing' ? '#1565c0' : order.status === 'confirmed' ? '#7b1fa2' : '#ef6c00'
                    }}>
                      {order.status || 'pending'}
                    </span>
                    {order.samagri_status && (
                      <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>
                        Samagri: {order.samagri_status}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#666' }}>
                    {order.date ? (
                      <div>
                        <div>{order.date}</div>
                        {order.time && <div style={{ fontSize: '11px', color: '#999' }}>{order.time}</div>}
                      </div>
                    ) : '-'}
                  </td>
                  <td style={{ padding: '12px', fontSize: '12px', color: '#666', maxWidth: '150px' }}>
                    <div style={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap',
                      maxWidth: '150px'
                    }} title={order.remark || ''}>
                      {order.remark || '-'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {offlineOrders.length > offlineOrdersPageSize && (
        <Pagination
          currentPage={offlineOrdersPage}
          totalItems={offlineOrders.length}
          pageSize={offlineOrdersPageSize}
          onPageChange={setOfflineOrdersPage}
        />
      )}
    </div>
  )

  const renderAiPredictionsSection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>AI Predictions</h2>
        <p>View your AI-powered astrology predictions</p>
      </div>

      {loadingAiPredictions ? (
        <div className="react-loading">Loading predictions...</div>
      ) : aiPredictions.length === 0 ? (
        <div className="react-no-data">
          <i className="fas fa-robot"></i>
          <p>No AI predictions found</p>
        </div>
      ) : (
        <>
          <div className="react-predictions-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {aiPredictions.map((prediction) => (
              <div key={prediction.id} style={{ 
                backgroundColor: '#fff', 
                borderRadius: '12px', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
                border: '1px solid #eee',
                overflow: 'hidden'
              }}>
                {/* Header */}
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: '#f8f9fa', 
                  borderBottom: '1px solid #eee',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%', 
                      backgroundColor: '#6366f1', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                      <i className="fas fa-robot" style={{ color: '#fff', fontSize: '18px' }}></i>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#333', fontSize: '14px' }}>
                        Order: {prediction.order_id}
                      </div>
                      <div style={{ fontSize: '12px', color: '#888' }}>
                        {prediction.created_at}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '20px', 
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'capitalize',
                      backgroundColor: prediction.message_type === 'text' ? '#e3f2fd' : '#f3e5f5',
                      color: prediction.message_type === 'text' ? '#1565c0' : '#7b1fa2'
                    }}>
                      {prediction.message_type}
                    </span>
                    {prediction.total_amount > 0 && (
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '20px', 
                        fontSize: '11px',
                        fontWeight: '600',
                        backgroundColor: '#e8f5e9',
                        color: '#2e7d32'
                      }}>
                        ₹{prediction.total_amount}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Question */}
                {prediction.question && (
                  <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px', textTransform: 'uppercase', fontWeight: '600' }}>
                      <i className="fas fa-question-circle" style={{ marginRight: '6px' }}></i>Your Question
                    </div>
                    <p style={{ margin: 0, fontSize: '14px', color: '#333', lineHeight: '1.5' }}>
                      {prediction.question.length > 200 ? `${prediction.question.substring(0, 200)}...` : prediction.question}
                    </p>
                  </div>
                )}
                
                {/* AI Response Preview */}
                <div style={{ padding: '16px' }}>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px', textTransform: 'uppercase', fontWeight: '600' }}>
                    <i className="fas fa-magic" style={{ marginRight: '6px', color: '#6366f1' }}></i>AI Response
                  </div>
                  {prediction.open_ai_response ? (
                    <p style={{ 
                      margin: 0, 
                      fontSize: '14px', 
                      color: '#555', 
                      lineHeight: '1.6',
                      backgroundColor: '#f8f9fa',
                      padding: '12px',
                      borderRadius: '8px',
                      maxHeight: selectedPrediction === prediction.id ? 'none' : '100px',
                      overflow: 'hidden'
                    }}>
                      {selectedPrediction === prediction.id ? prediction.open_ai_response : 
                        (prediction.open_ai_response.length > 300 ? `${prediction.open_ai_response.substring(0, 300)}...` : prediction.open_ai_response)
                      }
                    </p>
                  ) : (
                    <p style={{ margin: 0, fontSize: '13px', color: '#999', fontStyle: 'italic' }}>No response available</p>
                  )}
                  
                  {prediction.open_ai_response && prediction.open_ai_response.length > 300 && (
                    <button
                      onClick={() => setSelectedPrediction(selectedPrediction === prediction.id ? null : prediction.id)}
                      style={{
                        marginTop: '10px',
                        padding: '6px 14px',
                        backgroundColor: 'transparent',
                        border: '1px solid #6366f1',
                        color: '#6366f1',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                    >
                      {selectedPrediction === prediction.id ? 'Show Less' : 'Read More'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {aiPredictions.length > aiPredictionsPageSize && (
        <Pagination
          currentPage={aiPredictionsPage}
          totalItems={aiPredictions.length}
          pageSize={aiPredictionsPageSize}
          onPageChange={setAiPredictionsPage}
        />
      )}
    </div>
  )

  const renderAiProfilesSection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>AI Profiles</h2>
        <p>Manage your birth profiles for AI predictions</p>
      </div>

      {loadingAiProfiles ? (
        <div className="react-loading">Loading profiles...</div>
      ) : aiProfiles.length === 0 ? (
        <div className="react-no-data">
          <i className="fas fa-user-astronaut"></i>
          <p>No AI profiles found</p>
        </div>
      ) : (
        <div className="react-profiles-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '16px' 
        }}>
          {aiProfiles.map((profile) => (
            <div key={profile.id} style={{ 
              backgroundColor: '#fff', 
              borderRadius: '12px', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
              border: profile.is_selected ? '2px solid #6366f1' : '1px solid #eee',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {/* Selected Badge */}
              {profile.is_selected === 1 && (
                <div style={{ 
                  position: 'absolute', 
                  top: '10px', 
                  right: '10px',
                  backgroundColor: '#6366f1',
                  color: '#fff',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '10px',
                  fontWeight: '600'
                }}>
                  <i className="fas fa-check" style={{ marginRight: '4px' }}></i>Selected
                </div>
              )}
              
              {/* Header */}
              <div style={{ 
                padding: '16px', 
                backgroundColor: profile.is_self_profile === 1 ? '#f0f4ff' : '#f8f9fa', 
                borderBottom: '1px solid #eee',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ 
                  width: '50px', 
                  height: '50px', 
                  borderRadius: '50%', 
                  backgroundColor: profile.gender === 'male' ? '#e3f2fd' : profile.gender === 'female' ? '#fce4ec' : '#f5f5f5', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <i className={`fas ${profile.gender === 'male' ? 'fa-mars' : profile.gender === 'female' ? 'fa-venus' : 'fa-user'}`} 
                     style={{ color: profile.gender === 'male' ? '#1976d2' : profile.gender === 'female' ? '#c2185b' : '#666', fontSize: '22px' }}></i>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', color: '#333', fontSize: '16px' }}>
                    {profile.name || 'Unnamed Profile'}
                  </div>
                  {profile.is_self_profile === 1 && (
                    <span style={{ 
                      fontSize: '10px', 
                      backgroundColor: '#e8f5e9', 
                      color: '#2e7d32', 
                      padding: '2px 8px', 
                      borderRadius: '10px',
                      fontWeight: '600'
                    }}>Self Profile</span>
                  )}
                </div>
              </div>
              
              {/* Details */}
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* DOB */}
                  <div>
                    <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>
                      <i className="fas fa-birthday-cake" style={{ marginRight: '4px' }}></i>Date of Birth
                    </div>
                    <div style={{ fontSize: '13px', color: '#333' }}>{profile.dob || '-'}</div>
                  </div>
                  
                  {/* TOB */}
                  <div>
                    <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>
                      <i className="fas fa-clock" style={{ marginRight: '4px' }}></i>Time of Birth
                    </div>
                    <div style={{ fontSize: '13px', color: '#333' }}>{profile.tob || '-'}</div>
                  </div>
                  
                  {/* POB */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>
                      <i className="fas fa-map-marker-alt" style={{ marginRight: '4px' }}></i>Place of Birth
                    </div>
                    <div style={{ fontSize: '13px', color: '#333' }}>{profile.pob || '-'}</div>
                  </div>
                  
                  {/* Language */}
                  {profile.lang && (
                    <div>
                      <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>
                        <i className="fas fa-language" style={{ marginRight: '4px' }}></i>Language
                      </div>
                      <div style={{ fontSize: '13px', color: '#333', textTransform: 'capitalize' }}>{profile.lang}</div>
                    </div>
                  )}
                  
                  {/* Coordinates */}
                  {(profile.lat || profile.lon) && (
                    <div>
                      <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', fontWeight: '600', marginBottom: '4px' }}>
                        <i className="fas fa-globe" style={{ marginRight: '4px' }}></i>Coordinates
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', fontFamily: 'monospace' }}>
                        {profile.lat && `${profile.lat}`}{profile.lat && profile.lon && ', '}{profile.lon && `${profile.lon}`}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Created Date */}
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f0f0f0', fontSize: '11px', color: '#999' }}>
                  Created: {profile.created_at || '-'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {aiProfiles.length > aiProfilesPageSize && (
        <Pagination
          currentPage={aiProfilesPage}
          totalItems={aiProfiles.length}
          pageSize={aiProfilesPageSize}
          onPageChange={setAiProfilesPage}
        />
      )}
    </div>
  )

  const renderOurServicesSection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>Our Services</h2>
        <p>Explore our available services</p>
      </div>

      {loadingOurServices ? (
        <div className="react-loading">Loading services...</div>
      ) : ourServices.length === 0 ? (
        <div className="react-no-data">
          <i className="fas fa-th-large"></i>
          <p>No services available</p>
        </div>
      ) : (
        <div className="react-services-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '20px' 
        }}>
          {ourServices.map((service) => (
            <div key={service.id} style={{ 
              backgroundColor: '#fff', 
              borderRadius: '16px', 
              boxShadow: '0 4px 15px rgba(0,0,0,0.08)', 
              overflow: 'hidden',
              border: '1px solid #eee',
              transition: 'transform 0.3s, box-shadow 0.3s',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)'
              e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.15)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.08)'
            }}
            >
              {/* Image */}
              <div style={{ 
                height: '180px', 
                backgroundColor: '#f5f5f5',
                overflow: 'hidden',
                position: 'relative'
              }}>
                {service.image ? (
                  <img 
                    src={service.image} 
                    alt={service.title} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.parentElement.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);"><i class="fas fa-concierge-bell" style="font-size:50px;color:rgba(255,255,255,0.8);"></i></div>'
                    }}
                  />
                ) : (
                  <div style={{ 
                    width: '100%', 
                    height: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                  }}>
                    <i className="fas fa-concierge-bell" style={{ fontSize: '50px', color: 'rgba(255,255,255,0.8)' }}></i>
                  </div>
                )}
              </div>
              
              {/* Content */}
              <div style={{ padding: '20px' }}>
                <h3 style={{ 
                  margin: '0 0 10px 0', 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  color: '#333',
                  lineHeight: '1.3'
                }}>
                  {service.title}
                </h3>
                
                {service.content && (
                  <p style={{ 
                    margin: '0 0 15px 0', 
                    fontSize: '14px', 
                    color: '#666',
                    lineHeight: '1.6',
                    maxHeight: '63px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  dangerouslySetInnerHTML={{ 
                    __html: service.content.length > 150 
                      ? service.content.substring(0, 150).replace(/<[^>]*>/g, '') + '...' 
                      : service.content.replace(/<[^>]*>/g, '')
                  }}
                  />
                )}
                
                {/* Meta Info */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  paddingTop: '15px',
                  borderTop: '1px solid #f0f0f0'
                }}>
                  <span style={{ 
                    fontSize: '12px', 
                    color: '#888',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <i className="fas fa-link"></i>
                    {service.slug}
                  </span>
                  <button style={{
                    padding: '8px 16px',
                    backgroundColor: '#6366f1',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}>
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {ourServices.length > ourServicesPageSize && (
        <Pagination
          currentPage={ourServicesPage}
          totalItems={ourServices.length}
          pageSize={ourServicesPageSize}
          onPageChange={setOurServicesPage}
        />
      )}
    </div>
  )

  const renderPackagesSection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>Packages</h2>
        <p>Browse available packages and plans</p>
      </div>

      {loadingPackages ? (
        <div className="react-loading">Loading packages...</div>
      ) : packages.length === 0 ? (
        <div className="react-no-data">
          <i className="fas fa-box-open"></i>
          <p>No packages available</p>
        </div>
      ) : (
        <div className="react-packages-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '20px' 
        }}>
          {packages.map((pkg) => (
            <div key={pkg.id} style={{ 
              backgroundColor: '#fff', 
              borderRadius: '16px', 
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)', 
              overflow: 'hidden',
              border: '1px solid #eee',
              transition: 'transform 0.3s, box-shadow 0.3s',
              position: 'relative'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)'
              e.currentTarget.style.boxShadow = '0 12px 35px rgba(0,0,0,0.12)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'
            }}
            >
              {/* Header with gradient */}
              <div style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '24px 20px',
                textAlign: 'center',
                position: 'relative'
              }}>
                {/* Package Type Badge */}
                {pkg.package_type && (
                  <span style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '10px',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    {pkg.package_type}
                  </span>
                )}
                
                <h3 style={{ 
                  margin: '0 0 8px 0', 
                  fontSize: '20px', 
                  fontWeight: '700', 
                  color: '#fff'
                }}>
                  {pkg.name}
                </h3>
                
                <div style={{ 
                  fontSize: '36px', 
                  fontWeight: '800', 
                  color: '#fff',
                  lineHeight: '1'
                }}>
                  ₹{pkg.price}
                </div>
                
                <div style={{ 
                  fontSize: '13px', 
                  color: 'rgba(255,255,255,0.8)',
                  marginTop: '8px'
                }}>
                  <i className="fas fa-clock" style={{ marginRight: '6px' }}></i>
                  {pkg.duration}
                </div>
              </div>
              
              {/* Content */}
              <div style={{ padding: '20px' }}>
                {pkg.description && (
                  <p style={{ 
                    margin: '0 0 20px 0', 
                    fontSize: '14px', 
                    color: '#666',
                    lineHeight: '1.6',
                    textAlign: 'center'
                  }}>
                    {pkg.description}
                  </p>
                )}
                
                <button style={{
                  width: '100%',
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <i className="fas fa-shopping-cart" style={{ marginRight: '8px' }}></i>
                  Get Started
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {packages.length > packagesPageSize && (
        <Pagination
          currentPage={packagesPage}
          totalItems={packages.length}
          pageSize={packagesPageSize}
          onPageChange={setPackagesPage}
        />
      )}
    </div>
  )

  const renderSupportSection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>Support Ticket</h2>
        <p>Manage your support tickets</p>
      </div>

      <div className="react-table-container">
        <table className="react-data-table">
          <thead>
            <tr>
              <th>S. No.</th>
              <th>Ticket No</th>
              <th>User ID</th>
              <th>Department</th>
              <th>Subject</th>
              <th>Description</th>
              <th>Status</th>
              <th>View</th>
            </tr>
          </thead>
          <tbody>
            {getPaginatedItems(tickets, supportPage, supportPageSize).map((row, idx) => (
              <tr key={idx}>
                <td>{(supportPage - 1) * supportPageSize + idx + 1}</td>
                <td>{row.ticketNo}</td>
                <td>{row.userId}</td>
                <td>{row.department}</td>
                <td>{row.subject}</td>
                <td>{row.description}</td>
                <td>{row.status}</td>
                <td>-</td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr>
                <td colSpan="8" className="react-no-data">No Records Found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={supportPage}
        totalItems={tickets.length}
        pageSize={supportPageSize}
        onPageChange={setSupportPage}
        onPageSizeChange={(s) => { setSupportPageSize(s); setSupportPage(1) }}
      />
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'profile': return renderProfileSection()
      case 'wallet': return renderWalletSection()
      case 'gifts': return renderGiftHistorySection()
      case 'addresses': return renderAddressSection()
      case 'orders': return renderOrdersSection()
      case 'service-orders': return renderServiceOrdersSection()
      case 'puja-bookings': return renderPujaBookingsSection()
      case 'ask-questions': return renderAskQuestionsSection()
      case 'appointments': return renderAppointmentsSection()
      case 'architect-rooms': return renderArchitectRoomsSection()
      case 'architect-service-orders': return renderArchitectServiceOrdersSection()
      case 'kundlis': return renderKundlisSection()
      case 'intakes': return renderIntakesSection()
      case 'chat-history': return renderChatHistorySection()
      case 'admin-chats': return isAdmin ? renderAdminChatChannelsSection() : renderProfileSection()
      case 'admin-chat-history': return isAdmin ? renderAdminChatHistorySection() : renderProfileSection()
      case 'appointment-durations': return isAdmin ? renderAppointmentDurationsSection() : renderProfileSection()
      case 'waiting-list': return renderWaitingListSection()
      case 'call-history': return renderCallHistorySection()
      case 'support': return renderSupportSection()
      case 'courses': return renderCoursesSection()
      case 'refunds': return renderRefundsSection()
      case 'offers': return renderOffersSection()
      case 'offline-services': return renderOfflineServicesSection()
      case 'service-assigns': return renderServiceAssignsSection()
      case 'service-gallery': return renderServiceGallerySection()
      case 'offline-orders': return renderOfflineOrdersSection()
      case 'ai-predictions': return renderAiPredictionsSection()
      case 'ai-profiles': return renderAiProfilesSection()
      case 'our-services': return renderOurServicesSection()
      case 'packages': return renderPackagesSection()
      default: return renderProfileSection()
    }
  }

  // Don't render anything if not authenticated (show loading while checking)
  if (isAuthenticated === null) {
    return (
      <>
        <Navbar />
        <div className="react-my-account-page">
          <div className="container" style={{ textAlign: 'center', padding: '50px' }}>
            <div className="react-loading">Checking authentication...</div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  // Don't render dashboard if not authenticated
  if (isAuthenticated === false) {
    return null
  }

  return (
    <>
      <Navbar />
      
      <div className="react-my-account-page">
        <div className="container">
          {/* User Profile Header */}
          {loading ? (
            <div className="react-user-profile-header">
              <div className="react-profile-info">
                <p>Loading...</p>
              </div>
            </div>
          ) : userData ? (
          <div className="react-user-profile-header-wrapper">
            {/* Cover Image */}
            <div 
              className="react-profile-cover"
              style={{
                backgroundImage: selectedCoverImage 
                  ? `url(${selectedCoverImage.startsWith('http') ? selectedCoverImage : `${import.meta.env.VITE_WELCOME_API?.replace('/api', '') || 'http://localhost:8005'}/${selectedCoverImage}`})`
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}
            >
              <button 
                className="react-cover-change-btn"
                onClick={() => setShowCoverSelector(!showCoverSelector)}
              >
                <i className="fas fa-camera"></i>
                <span>Change Cover</span>
              </button>
            </div>
            
            {/* Cover Image Selector Modal */}
            {showCoverSelector && (
              <div className="react-cover-selector">
                <div className="react-cover-selector-header">
                  <h3>Select Cover Image</h3>
                  <button onClick={() => setShowCoverSelector(false)} className="react-close-btn">
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                {loadingCoverImages ? (
                  <div className="react-loading">Loading cover images...</div>
                ) : coverImages.length === 0 ? (
                  <p className="react-no-covers">No cover images available</p>
                ) : (
                  <div className="react-cover-grid">
                    {coverImages.map((cover) => (
                      <div 
                        key={cover.id}
                        className={`react-cover-option ${selectedCoverImage === cover.cover_img ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedCoverImage(cover.cover_img)
                          setShowCoverSelector(false)
                        }}
                      >
                        <img 
                          src={cover.cover_img.startsWith('http') ? cover.cover_img : `${import.meta.env.VITE_WELCOME_API?.replace('/api', '') || 'http://localhost:8005'}/${cover.cover_img}`}
                          alt="Cover option"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100"><rect fill="%23ddd" width="200" height="100"/></svg>'
                          }}
                        />
                        {selectedCoverImage === cover.cover_img && (
                          <div className="react-cover-selected-badge">
                            <i className="fas fa-check"></i>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Profile Info */}
            <div className="react-user-profile-header">
              <div className="react-profile-avatar">
                  <img 
                    key={`header-avatar-${imageRefreshKey}-${userData?.customer_img || 'default'}`}
                    src={(() => {
                      const imgUrl = userData?.customer_img
                      if (imgUrl) {
                        const finalUrl = getCustomerImageUrl(imgUrl, userData?.name, imageRefreshKey > 0)
                        console.log('[Customer Dashboard] Header avatar using:', {
                          original: imgUrl,
                          final: finalUrl.substring(0, 100) + (finalUrl.length > 100 ? '...' : ''),
                          isSvg: finalUrl.startsWith('data:image/svg')
                        })
                        return finalUrl
                      }
                      console.log('[Customer Dashboard] Header avatar: No image, using SVG')
                      return getCustomerImageUrl(null, userData?.name)
                    })()}
                    alt="User"
                    onError={(e) => {
                      console.error('[Customer Dashboard] Header avatar load error:', e.target.src)
                      handleImageError(e, userData?.name)
                    }}
                  />
              </div>
              <div className="react-profile-info">
                  <h2>{userData.name || 'User'}</h2>
                  <p>{userData.email || ''}</p>
                  <p>{userData.phone || userData.mobile || ''}</p>
                  <p className="react-customer-id">{userData.user_uni_id || userData.customer_uni_id || ''}</p>
              </div>
            </div>
          </div>
          ) : null}

          {/* Tab Navigation */}
          <div className="react-tab-navigation">
            <div className="react-tab-container">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  className={`react-tab-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <i className={`fas ${item.icon}`}></i>
                  <span className="react-tab-label">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="react-account-content fadeInUp" key={activeTab}>
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Call Detail Modal */}
      {showCallDetailModal && selectedCall && (
        <Modal onClose={closeCallDetailModal} title="Call Details">
          <div className="react-call-detail-modal">
            <div className="react-call-info-section">
              <h3>Call Information</h3>
              <div className="react-call-info-grid">
                <div className="react-call-info-item">
                  <span className="react-label">Astrologer:</span>
                  <span className="react-value">{selectedCall.astrologer}</span>
                </div>
                <div className="react-call-info-item">
                  <span className="react-label">Call ID:</span>
                  <span className="react-value">{selectedCall.uniqueId}</span>
                </div>
                <div className="react-call-info-item">
                  <span className="react-label">Date:</span>
                  <span className="react-value">{selectedCall.orderDate}</span>
                </div>
                <div className="react-call-info-item">
                  <span className="react-label">Duration:</span>
                  <span className="react-value">{selectedCall.duration}</span>
                </div>
                <div className="react-call-info-item">
                  <span className="react-label">Type:</span>
                  <span className="react-value">{selectedCall.type || 'Voice Call'}</span>
                </div>
                <div className="react-call-info-item">
                  <span className="react-label">Charge:</span>
                  <span className="react-value">₹{selectedCall.charge || 0}</span>
                </div>
                <div className="react-call-info-item">
                  <span className="react-label">Status:</span>
                  <span className="react-value">{selectedCall.status}</span>
                </div>
              </div>
            </div>

            <div className="react-call-images-section">
              <h3>Shared Files/Images</h3>
              {loadingCallImages ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <p>Loading files...</p>
                </div>
              ) : callImages.length > 0 ? (
                <div className="react-call-images-grid">
                  {callImages.map((img, index) => (
                    <div key={img.id || index} className="react-call-image-item">
                      <a href={img.file_url} target="_blank" rel="noopener noreferrer">
                        {img.file_type === 'Image' || img.file_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img 
                            src={img.file_url} 
                            alt={`Shared file ${index + 1}`}
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.nextSibling.style.display = 'flex'
                            }}
                          />
                        ) : (
                          <div className="react-file-icon">
                            <i className="fas fa-file"></i>
                            <span>{img.file_type || 'File'}</span>
                          </div>
                        )}
                        <div className="react-file-placeholder" style={{ display: 'none' }}>
                          <i className="fas fa-image"></i>
                          <span>View File</span>
                        </div>
                      </a>
                      <div className="react-image-info">
                        <small>From: {img.user_uni_id?.startsWith('ASTRO') ? 'Astrologer' : 'You'}</small>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                  <i className="fas fa-image" style={{ fontSize: '40px', marginBottom: '10px', opacity: 0.5 }}></i>
                  <p>No files shared during this call</p>
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button 
                className="react-btn react-btn-secondary"
                onClick={closeCallDetailModal}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      <Footer />
    </>
  )
}

export default My_Account