import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import { getVendorDashboard, getCurrentUser, updateVendorProfile, fetchPublicCountryList, fetchPublicStateList, fetchPublicCityList, getWalletTransactions, getRechargeVouchers, proceedPaymentRequest, updateOnlinePayment, fetchWelcomeData, getWalletBalance, fetchProducts, fetchProductCategories, getVendorWithdrawalRequests, addVendorProduct, getImageUrl, fetchAstrologerGiftHistory, getBankDetails, saveBankDetails } from '../utils/api'

const Vendor_Dashboard = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(null) // null = checking, true = authenticated, false = not authenticated
  const [vendorData, setVendorData] = useState(null)
  const [vendorProfile, setVendorProfile] = useState(null)
  const [vendorImageUrl, setVendorImageUrl] = useState(null) // Stable image URL with timestamp
  const [profileImage, setProfileImage] = useState(null) // React state for profile image URL with cache-busting
  
  // Profile update form state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    firm_name: '',
    pin_code: '',
    gst_no: '',
    address: '',
    city: '',
    state: '',
    country: '',
    term: ''
  })
  const [selectedProfileImage, setSelectedProfileImage] = useState(null)
  const [profileImagePreview, setProfileImagePreview] = useState(null)
  const [updatingProfile, setUpdatingProfile] = useState(false)
  const [profileUpdateError, setProfileUpdateError] = useState(null)
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState(false)
  
  // Location dropdowns
  const [countries, setCountries] = useState([])
  const [states, setStates] = useState([])
  const [cities, setCities] = useState([])
  const [selectedCountryId, setSelectedCountryId] = useState(null)
  const [selectedStateId, setSelectedStateId] = useState(null)
  const [loadingCountries, setLoadingCountries] = useState(false)
  const [loadingStates, setLoadingStates] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)

  // Dashboard stats
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalBalance, setTotalBalance] = useState(0)
  const [totalProduct, setTotalProduct] = useState(0)
  const [totalOrder, setTotalOrder] = useState(0)
  const [orderCounts, setOrderCounts] = useState({})
  const [orders, setOrders] = useState([])
  const [totalOrdersCount, setTotalOrdersCount] = useState(0)
  const [loadingOrders, setLoadingOrders] = useState(false)

  // Other data
  const [walletBalance, setWalletBalance] = useState(0)
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [walletTxns, setWalletTxns] = useState([])
  const [loadingWalletTxns, setLoadingWalletTxns] = useState(false)
  const [receivedGifts, setReceivedGifts] = useState([])
  const [loadingReceivedGifts, setLoadingReceivedGifts] = useState(false)
  const [giftPage, setGiftPage] = useState(1)
  const giftPageSize = 10
  const [withdrawals, setWithdrawals] = useState([])
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false)
  const [chartData, setChartData] = useState({ months: [], income: [] })
  
  // Bank details state
  const [bankDetails, setBankDetails] = useState({
    bank_name: '',
    account_no: '',
    account_type: 'Savings',
    ifsc_code: '',
    account_name: '',
    pan_no: ''
  })
  const [loadingBankDetails, setLoadingBankDetails] = useState(false)
  const [savingBankDetails, setSavingBankDetails] = useState(false)
  const [bankDetailsError, setBankDetailsError] = useState(null)
  const [bankDetailsSuccess, setBankDetailsSuccess] = useState(false)
  const [productCategories, setProductCategories] = useState([])

  // Add product form state
  const [productFormData, setProductFormData] = useState({
    category_id: '',
    name: '',
    price: '',
    mrp: '',
    hsn: '',
    gst_percentage: '',
    quantity: '',
    unit: '',
    description: '',
    image: null
  })
  const [productImagePreview, setProductImagePreview] = useState(null)
  const [addingProduct, setAddingProduct] = useState(false)
  const [productAddError, setProductAddError] = useState(null)
  const [productAddSuccess, setProductAddSuccess] = useState(false)
  
  // Wallet recharge state
  const [rechargeAmount, setRechargeAmount] = useState('')
  const [rechargeVouchers, setRechargeVouchers] = useState([])
  const [loadingRecharge, setLoadingRecharge] = useState(false)
  const [selectedPaymentGateway, setSelectedPaymentGateway] = useState('razorpay')
  const [availablePaymentGateways, setAvailablePaymentGateways] = useState([])
  const [loadingPaymentGateways, setLoadingPaymentGateways] = useState(false)
  
  // Pagination state (must be declared before functions that use them)
  const [ordersPage, setOrdersPage] = useState(1)
  const [ordersPageSize, setOrdersPageSize] = useState(10)
  const [walletPage, setWalletPage] = useState(1)
  const [walletPageSize, setWalletPageSize] = useState(10)
  const [productPage, setProductPage] = useState(1)
  const [productPageSize, setProductPageSize] = useState(10)
  const [withdrawPage, setWithdrawPage] = useState(1)
  const [withdrawPageSize, setWithdrawPageSize] = useState(10)
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false)
  
  // Fetch wallet transactions
  const fetchWalletTransactions = useCallback(async () => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      console.warn('[Vendor Dashboard] No user found, cannot fetch wallet transactions')
      setWalletTxns([])
      return
    }
    
    const userId = currentUser.user_uni_id
    if (!userId) {
      console.warn('[Vendor Dashboard] No user_uni_id found, cannot fetch wallet transactions')
      setWalletTxns([])
      return
    }
    
    setLoadingWalletTxns(true)
    try {
      console.log('[Vendor Dashboard] Fetching wallet transactions:', {
        userId,
        offset: (walletPage - 1) * walletPageSize,
        limit: walletPageSize
      })
      
      const result = await getWalletTransactions(
        userId,
        (walletPage - 1) * walletPageSize,
        walletPageSize
      )
      
      console.log('[Vendor Dashboard] Wallet transactions result:', {
        status: result.status,
        dataLength: Array.isArray(result.data) ? result.data.length : 0,
        msg: result.msg
      })
      
      if (result.status === 1 && Array.isArray(result.data)) {
        setWalletTxns(result.data)
        console.log('[Vendor Dashboard] ✅ Wallet transactions loaded:', result.data.length)
      } else {
        console.warn('[Vendor Dashboard] ⚠️ No wallet transactions or invalid response:', result)
        setWalletTxns([])
      }
    } catch (err) {
      console.error('[Vendor Dashboard] Error fetching wallet transactions:', err)
      setWalletTxns([])
    } finally {
      setLoadingWalletTxns(false)
    }
  }, [walletPage, walletPageSize])
  
  // Fetch wallet transactions when wallet tab becomes active or page changes
  useEffect(() => {
    if (activeTab === 'wallet') {
      fetchWalletTransactions()
    }
  }, [activeTab, walletPage, walletPageSize, fetchWalletTransactions])

  // Fetch received gifts
  const fetchReceivedGifts = useCallback(async () => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      console.warn('[Vendor Dashboard] No user found, cannot fetch received gifts')
      setReceivedGifts([])
      return
    }
    
    const userId = currentUser.user_uni_id
    if (!userId) {
      console.warn('[Vendor Dashboard] No user_uni_id found, cannot fetch received gifts')
      setReceivedGifts([])
      return
    }
    
    setLoadingReceivedGifts(true)
    try {
      console.log('[Vendor Dashboard] Fetching received gifts:', { userId })
      
      const result = await fetchAstrologerGiftHistory((giftPage - 1) * giftPageSize)
      
      console.log('[Vendor Dashboard] Received gifts result:', {
        status: result.status,
        dataLength: Array.isArray(result.data) ? result.data.length : 0
      })
      
      if (result.status === 1 && Array.isArray(result.data)) {
        setReceivedGifts(result.data)
        console.log('[Vendor Dashboard] ✅ Received gifts loaded:', result.data.length)
      } else {
        console.warn('[Vendor Dashboard] ⚠️ No received gifts or invalid response:', result)
        setReceivedGifts([])
      }
    } catch (err) {
      console.error('[Vendor Dashboard] Error fetching received gifts:', err)
      setReceivedGifts([])
    } finally {
      setLoadingReceivedGifts(false)
    }
  }, [giftPage, giftPageSize])

  // Fetch received gifts when gifts tab becomes active
  useEffect(() => {
    if (activeTab === 'received-gifts') {
      fetchReceivedGifts()
    }
  }, [activeTab, giftPage, fetchReceivedGifts])

  // Format date helper
  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A'
    try {
      const date = new Date(dateStr)
      return date.toLocaleString('en-IN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (e) {
      return dateStr
    }
  }

  // Fetch vendor orders separately with pagination
  const fetchVendorOrders = useCallback(async (page = 1) => {
    setLoadingOrders(true)
    try {
      const result = await getVendorDashboard(page)
      
      if (result.status === 1 && result.data) {
        const data = result.data
        
        // Transform and set orders
        if (data.orders && Array.isArray(data.orders)) {
          const transformedOrders = data.orders.map((order, index) => {
            return {
              id: order.id,
              orderId: order.order_id || order.id || `ORDER-${index}`,
              userId: order.user_uni_id || order.user_id || 'N/A',
              amount: order.total_amount || order.amount || 0,
              date: formatDateTime(order.created_at || order.createdAt || order.date),
              status: order.status || 'pending'
            }
          })
          setOrders(transformedOrders)
          // Use total_order from dashboard stats for total count
          const totalCount = data.total_order || 0
          setTotalOrdersCount(totalCount)
        } else {
          setOrders([])
          setTotalOrdersCount(0)
        }
      } else {
        setOrders([])
        setTotalOrdersCount(0)
      }
    } catch (error) {
      console.error('[Vendor Dashboard] Error fetching orders:', error)
      setOrders([])
      setTotalOrdersCount(0)
    } finally {
      setLoadingOrders(false)
    }
  }, [])

  // Fetch vendor dashboard data
  const fetchVendorDashboard = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const result = await getVendorDashboard(page)
      
      if (result.status === 1 && result.data) {
        const data = result.data
        
        // Set vendor profile from data.data (vendor info)
        // API might return data in different structures, handle both
        if (data.data) {
          const profileData = { ...data.data }
          
          // Handle vendor_image - update React state (profileImage) immediately
          const imageUrl = profileData.vendor_image || profileData.vendor?.vendor_image || null
          // Skip default images - only use uploaded vendor images
          const isDefaultImage = imageUrl && (
            imageUrl.includes('62096.png') || 
            imageUrl.includes('setting/62096') ||
            imageUrl.includes('/uploads/setting/')
          )
          
          if (imageUrl && !isDefaultImage) {
            // Use handleImageUpload to update profileImage state with cache-busting
            // This ensures state is the single source of truth
            handleImageUpload(imageUrl)
          } else {
            // Clear state if no image or if it's default image
            setProfileImage(null)
            setVendorImageUrl(null)
            setProfileImagePreview(null)
          }
          
          // Ensure vendor_image is at top level for easier access
          if (profileData.vendor?.vendor_image && !profileData.vendor_image) {
            profileData.vendor_image = profileData.vendor.vendor_image
          }
          
          setVendorProfile(profileData)
        }
        
        // Set dashboard stats
        setTotalIncome(data.total_income || 0)
        setTotalBalance(data.total_balance || 0)
        setTotalProduct(data.total_product || 0)
        setTotalOrder(data.total_order || 0)
        setWalletBalance(data.total_balance || 0)
        
        // Set order counts
        const orderCountsData = {
          pending: {
            total: data.total_pending_order || 0,
            yesterday: data.total_pending_yesterday_order || 0,
            today: data.total_pending_today_order || 0
          },
          dispatch: {
            total: data.total_dispatch_order || 0,
            yesterday: data.total_dispatch_yesterday_order || 0,
            today: data.total_dispatch_today_order || 0
          },
          confirm: {
            total: data.total_confirm_order || 0,
            yesterday: data.total_confirm_yesterday_order || 0,
            today: data.total_confirm_today_order || 0
          },
          delivered: {
            total: data.total_delivered_order || 0,
            yesterday: data.total_delivered_yesterday_order || 0,
            today: data.total_delivered_today_order || 0
          },
          cancel: {
            total: data.total_cancel_order || 0,
            yesterday: data.total_cancel_yesterday_order || 0,
            today: data.total_cancel_today_order || 0
          }
        }
        setOrderCounts(orderCountsData)
        
        // Transform and set orders (only on initial load)
        if (data.orders && Array.isArray(data.orders)) {
          const transformedOrders = data.orders.map((order, index) => {
            return {
              id: order.id,
              orderId: order.order_id || order.id || `ORDER-${index}`,
              userId: order.user_uni_id || order.user_id || 'N/A',
              amount: order.total_amount || order.amount || 0,
              date: formatDateTime(order.created_at || order.createdAt || order.date),
              status: order.status || 'pending'
            }
          })
          setOrders(transformedOrders)
          // Use total_order from dashboard stats for total count
          const totalCount = data.total_order || 0
          setTotalOrdersCount(totalCount)
        } else {
          setOrders([])
          setTotalOrdersCount(0)
        }
        
        setVendorData(data)
      }
    } catch (error) {
      console.error('[Vendor Dashboard] Error fetching dashboard:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch product categories
  const fetchProductCategoriesList = useCallback(async () => {
    try {
      const result = await fetchProductCategories({ status: 1, limit: 100 })
      if (result.status === 1 && Array.isArray(result.data)) {
        setProductCategories(result.data)
      }
    } catch (error) {
      console.error('[Vendor Dashboard] Error fetching product categories:', error)
    }
  }, [])

  // Fetch vendor products
  const fetchVendorProducts = useCallback(async () => {
    const currentUser = getCurrentUser()
    if (!currentUser || !currentUser.user_uni_id) return

    setLoadingProducts(true)
    try {
      const result = await fetchProducts({
        vendor_uni_id: currentUser.user_uni_id,
        offset: (productPage - 1) * productPageSize,
        limit: productPageSize
      })
      if (result.status === 1 && Array.isArray(result.data)) {
        setProducts(result.data.map(p => ({
          id: p.id,
          name: p.product_name,
          category: p.productcategory?.category_name || 'N/A',
          mrp: p.mrp || p.price,
          price: p.price,
          gst: p.gst_percentage || '0',
          image: p.product_image,
          quantity: p.quantity
        })))
      } else {
        setProducts([])
      }
    } catch (error) {
      console.error('[Vendor Dashboard] Error fetching products:', error)
      setProducts([])
    } finally {
      setLoadingProducts(false)
    }
  }, [productPage, productPageSize])

  // CRITICAL: Check authentication and vendor status on mount and when user changes
  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = getCurrentUser()
      
      // If no user, redirect to home
      if (!currentUser) {
        console.log('[Vendor Dashboard] No user found, redirecting to home')
        setIsAuthenticated(false)
        navigate('/', { replace: true })
        return false
      }
      
      // Check if user is a vendor
      const userRole = currentUser?.role_id || currentUser?.type
      const userId = currentUser?.user_uni_id || currentUser?.customer_uni_id || ''
      const isVendor = userRole === 5 || userRole === 'Vendor' || currentUser?.type === 'Vendor' || (userId && userId.startsWith('VEND'))
      
      // If not a vendor, redirect to home
      if (!isVendor) {
        console.log('[Vendor Dashboard] User is not a vendor, redirecting to home:', {
          user_uni_id: userId,
          role_id: userRole,
          type: currentUser?.type
        })
        setIsAuthenticated(false)
        navigate('/', { replace: true })
        return false
      }
      
      setIsAuthenticated(true)
      
      // Fetch vendor profile from backend immediately after authentication
      console.log('[Vendor Dashboard] Vendor authenticated, fetching profile from backend...')
      await fetchVendorDashboard(ordersPage)
      
      return true
    }
    
    // Check immediately
    checkAuth()
    
    // Listen to auth changes (login/logout events)
    const handleAuthChange = async (e) => {
      const user = e.detail?.user
      if (!user) {
        console.log('[Vendor Dashboard] User logged out, redirecting to home')
        setIsAuthenticated(false)
        navigate('/', { replace: true })
      } else {
        // Re-check if user is still a vendor and refresh profile
        const authResult = await checkAuth()
        if (authResult) {
          // Profile will be fetched in checkAuth function
          console.log('[Vendor Dashboard] User logged in, profile refreshed from backend')
        }
      }
    }
    
    // Listen to storage changes (logout from other tabs or login from other tabs)
    const handleStorageChange = async (e) => {
      if (e.key === 'user') {
        if (!e.newValue) {
          console.log('[Vendor Dashboard] User logged out (storage change), redirecting to home')
          setIsAuthenticated(false)
          navigate('/', { replace: true })
        } else {
          // User logged in from another tab, refresh profile
          const currentUser = getCurrentUser()
          if (currentUser) {
            const userRole = currentUser?.role_id || currentUser?.type
            const userId = currentUser?.user_uni_id || currentUser?.customer_uni_id || ''
            const isVendor = userRole === 5 || userRole === 'Vendor' || currentUser?.type === 'Vendor' || (userId && userId.startsWith('VEND'))
            if (isVendor) {
              console.log('[Vendor Dashboard] User logged in from another tab, refreshing profile from backend...')
              await fetchVendorDashboard(ordersPage)
            }
          }
        }
      }
    }
    
    window.addEventListener('auth:change', handleAuthChange)
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('auth:change', handleAuthChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [navigate, fetchVendorDashboard, ordersPage])
  
  // Fetch dashboard data on mount (only if user is authenticated vendor)
  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) return
    
    const userRole = currentUser?.role_id || currentUser?.type
    const userId = currentUser?.user_uni_id || currentUser?.customer_uni_id || ''
    const isVendor = userRole === 5 || userRole === 'Vendor' || currentUser?.type === 'Vendor' || (userId && userId.startsWith('VEND'))
    
    if (isVendor) {
      fetchVendorDashboard(1) // Always fetch dashboard with page 1 for initial load
    }
  }, [fetchVendorDashboard])

  // Fetch orders separately when orders tab is active or orders page changes
  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) return
    
    const userRole = currentUser?.role_id || currentUser?.type
    const userId = currentUser?.user_uni_id || currentUser?.customer_uni_id || ''
    const isVendor = userRole === 5 || userRole === 'Vendor' || currentUser?.type === 'Vendor' || (userId && userId.startsWith('VEND'))
    
    if (isVendor && activeTab === 'orders') {
      fetchVendorOrders(ordersPage)
    }
  }, [fetchVendorOrders, ordersPage, activeTab])

  // Fetch product categories on mount
  useEffect(() => {
    fetchProductCategoriesList()
  }, [fetchProductCategoriesList])

  // Fetch vendor products when products tab is active or page changes
  useEffect(() => {
    if (activeTab === 'products' || activeTab === 'add-product') {
      fetchVendorProducts()
    }
  }, [activeTab, productPage, productPageSize, fetchVendorProducts])

  // Fetch bank details when bank-details tab is active
  useEffect(() => {
    if (activeTab === 'bank-details') {
      loadBankDetails()
    }
  }, [activeTab])

  // Update profile form data when vendorProfile changes (from dashboard fetch)
  useEffect(() => {
    if (vendorProfile && vendorProfile.vendor) {
      setProfileData(prev => ({
        ...prev,
        name: vendorProfile.name || prev.name,
        email: vendorProfile.email || prev.email,
        phone: (vendorProfile.phone || prev.phone).replace(/^\+91/, '').replace(/\D/g, ''),
        firm_name: vendorProfile.vendor.firm_name || prev.firm_name,
        pin_code: vendorProfile.vendor.pin_code || prev.pin_code,
        gst_no: vendorProfile.vendor.gst_no || prev.gst_no,
        address: vendorProfile.vendor.address || prev.address,
        city: vendorProfile.vendor.city || prev.city,
        state: vendorProfile.vendor.state || prev.state,
        country: vendorProfile.vendor.country || prev.country || 'India',
        term: vendorProfile.vendor.term || prev.term
      }))
      
      if (vendorProfile.vendor_image) {
        // Always update profileImage state when vendorProfile changes
        // This ensures state is in sync with vendorProfile
        const currentImageUrl = vendorProfile.vendor_image
        
        // Skip if it's the default image (we don't want to show default image)
        const isDefaultImage = currentImageUrl && (
          currentImageUrl.includes('62096.png') || 
          currentImageUrl.includes('setting/62096') ||
          currentImageUrl.includes('/uploads/setting/')
        )
        
        if (!isDefaultImage) {
          // Only update if profileImage is null or if the URL has changed
          // Extract base URL without query params for comparison
          const currentUrlBase = currentImageUrl.split('?')[0].split('&')[0]
          const profileImageBase = profileImage ? profileImage.split('?')[0].split('&')[0] : null
          
          // Only update if the base URL is different (don't overwrite if same image)
          if (!profileImage || profileImageBase !== currentUrlBase) {
            console.log('[Vendor Dashboard] Updating profileImage state from vendorProfile:', currentImageUrl)
            // Update profileImage state with cache-busting
            handleImageUpload(currentImageUrl)
          } else {
            console.log('[Vendor Dashboard] Image URL unchanged, keeping existing profileImage state')
          }
        } else {
          console.warn('[Vendor Dashboard] Skipping default image URL:', currentImageUrl)
          // Don't set default image, but don't clear existing profileImage if it's already set
          if (!profileImage) {
            setProfileImage(null)
            setVendorImageUrl(null)
          }
        }
        // Use profileImage state for preview (but skip default images)
        if (!isDefaultImage) {
          setProfileImagePreview(profileImage || vendorImageUrl || vendorProfile.vendor_image)
        } else {
          // Only clear preview if we don't have a valid profileImage
          if (!profileImage) {
            setProfileImagePreview(null)
          }
        }
      } else {
        // Only clear state if no image AND we don't have a valid profileImage already set
        // This prevents clearing the image when vendorProfile temporarily doesn't have vendor_image
        if (profileImage && !profileImage.includes('62096')) {
          console.log('[Vendor Dashboard] vendor_image is null but profileImage is set, keeping it')
          // Keep existing profileImage
        } else {
          console.log('[Vendor Dashboard] Clearing profileImage state - no vendor_image in vendorProfile')
          setProfileImage(null)
          setVendorImageUrl(null)
          setProfileImagePreview(null)
        }
      }
    }
  }, [vendorProfile, profileImage])

  // Set country/state IDs when countries/states are loaded and vendorProfile has values
  useEffect(() => {
    if (vendorProfile && vendorProfile.vendor && countries.length > 0) {
      // Set country ID if country name matches
      if (vendorProfile.vendor.country) {
        const country = countries.find(c => 
          c.name === vendorProfile.vendor.country || 
          c.name.toLowerCase() === vendorProfile.vendor.country.toLowerCase() ||
          (c.code && vendorProfile.vendor.country.includes(c.code))
        )
        if (country) {
          // Ensure country ID is a number
          const countryId = typeof country.id === 'string' ? parseInt(country.id, 10) : country.id
          if (!isNaN(countryId) && countryId > 0 && selectedCountryId !== countryId) {
            console.log('[Vendor Dashboard] Setting country ID:', countryId, 'for country:', country.name, 'from vendorProfile:', vendorProfile.vendor.country, '(original ID:', country.id, ')')
            setSelectedCountryId(countryId)
          }
        } else if (!country) {
          console.warn('[Vendor Dashboard] Country not found in list:', vendorProfile.vendor.country)
          console.warn('[Vendor Dashboard] Available countries (first 10):', countries.slice(0, 10).map(c => ({ id: c.id, name: c.name, code: c.code })))
        }
      }
    }
  }, [vendorProfile, countries, selectedCountryId])

  // Also set country ID when profileData.country changes (for manual selection)
  useEffect(() => {
    if (profileData.country && countries.length > 0 && !selectedCountryId) {
      const country = countries.find(c => 
        c.name === profileData.country || 
        c.name.toLowerCase() === profileData.country.toLowerCase()
      )
      if (country) {
        // Ensure country ID is a number
        const countryId = typeof country.id === 'string' ? parseInt(country.id, 10) : country.id
        if (!isNaN(countryId) && countryId > 0) {
          console.log('[Vendor Dashboard] Setting country ID from profileData:', countryId, 'for country:', country.name, '(original:', country.id, ')')
          setSelectedCountryId(countryId)
        }
      }
    }
  }, [profileData.country, countries, selectedCountryId])

  // Set state ID when states are loaded and vendorProfile has state (fallback if not set during loadStates)
  useEffect(() => {
    if (vendorProfile && vendorProfile.vendor && states.length > 0 && selectedCountryId && !selectedStateId) {
      // Set state ID if state name matches and state ID is not already set
      if (vendorProfile.vendor.state) {
        const state = states.find(s => 
          s.name === vendorProfile.vendor.state || 
          s.name.toLowerCase() === vendorProfile.vendor.state.toLowerCase()
        )
        if (state) {
          console.log('[Vendor Dashboard] Setting state ID (fallback):', state.id, 'for state:', state.name)
          setSelectedStateId(state.id)
        }
      }
    }
  }, [vendorProfile, states, selectedCountryId, selectedStateId])

  // Get vendor profile from localStorage as fallback (only if backend profile not available)
  useEffect(() => {
    // Only set from localStorage if vendorProfile is not set from backend yet
    if (!vendorProfile) {
      const currentUser = getCurrentUser()
      if (currentUser) {
        const profile = {
          name: currentUser.name || 'Vendor',
          email: currentUser.email || 'vendor@example.com',
          phone: currentUser.phone || currentUser.mobile || '+91 0000000000',
          user_uni_id: currentUser.user_uni_id || 'VND0001',
          vendor_image: currentUser.vendor_image || null,
          firm_name: currentUser.vendor?.firm_name || '',
          pin_code: currentUser.vendor?.pin_code || '',
          gst_no: currentUser.vendor?.gst_no || '',
          address: currentUser.vendor?.address || '',
          city: currentUser.vendor?.city || '',
          state: currentUser.vendor?.state || '',
          country: currentUser.vendor?.country || 'India',
          term: currentUser.vendor?.term || ''
        }
        setVendorProfile(profile)
        
        // Initialize profile form data
        setProfileData({
          name: profile.name,
          email: profile.email,
          phone: profile.phone.replace(/^\+91/, '').replace(/\D/g, ''),
          firm_name: profile.firm_name,
          pin_code: profile.pin_code,
          gst_no: profile.gst_no,
          address: profile.address,
          city: profile.city,
          state: profile.state,
          country: profile.country,
          term: profile.term
        })
        setProfileImagePreview(profile.vendor_image || null)
      }
    }
  }, [vendorProfile])

  // Load countries on mount
  useEffect(() => {
    const loadCountries = async () => {
      console.log('[Vendor Dashboard] ===== Loading Countries =====')
      setLoadingCountries(true)
      try {
        const result = await fetchPublicCountryList()
        console.log('[Vendor Dashboard] Countries API result (full):', JSON.stringify(result, null, 2))
        console.log('[Vendor Dashboard] Countries API status:', result.status)
        console.log('[Vendor Dashboard] Countries API data type:', typeof result.data, Array.isArray(result.data))
        console.log('[Vendor Dashboard] Countries API data length:', result.data?.length)
        console.log('[Vendor Dashboard] Countries API data sample (first 3 items):', result.data?.slice(0, 3))
        console.log('[Vendor Dashboard] Countries API message:', result.msg)
        
        if (result.status === 1 && Array.isArray(result.data) && result.data.length > 0) {
          // Backend might return 'nicename' instead of 'name', handle both
          const countryList = result.data.map((country, index) => {
            // Try multiple field names for country name
            const countryName = country.nicename || country.name || country.country_name || country.country || ''
            const countryId = country.id || country.country_id || index
            const countryCode = country.iso || country.code || country.iso3 || ''
            
            return {
              id: countryId,
              name: countryName,
              code: countryCode,
              phonecode: country.phonecode || ''
            }
          }).filter(country => country.name && country.name.trim() !== '') // Filter out empty names
          
          console.log('[Vendor Dashboard] Countries mapped successfully:', countryList.length, 'countries')
          console.log('[Vendor Dashboard] Countries list (first 10):', countryList.slice(0, 10))
          console.log('[Vendor Dashboard] All countries (first 20):', countryList.slice(0, 20).map(c => ({ id: c.id, name: c.name, code: c.code })))
          
          if (countryList.length === 0) {
            console.error('[Vendor Dashboard] ❌ No valid countries after mapping!')
            console.error('[Vendor Dashboard] Raw data (first 5):', result.data.slice(0, 5))
            console.error('[Vendor Dashboard] Raw data sample fields:', result.data[0] ? Object.keys(result.data[0]) : 'No data')
            setCountries([])
            return
          }
          
          console.log('[Vendor Dashboard] ✅ Setting countries state with', countryList.length, 'countries')
          setCountries(countryList)
          console.log('[Vendor Dashboard] Countries state set. Current countries.length:', countryList.length)
          
          // Set default country to India if available and no country is already selected
          if (!profileData.country) {
            const india = countryList.find(c => 
              c.name === 'India' || 
              c.name.toLowerCase() === 'india' || 
              c.id === 99 ||
              c.code === 'IN'
            )
            if (india) {
              // Ensure country ID is a number
              const indiaId = typeof india.id === 'string' ? parseInt(india.id, 10) : india.id
              console.log('[Vendor Dashboard] Setting default country to India:', india, '(ID:', indiaId, ')')
              if (!isNaN(indiaId) && indiaId > 0) {
                setSelectedCountryId(indiaId)
                setProfileData(prev => ({ ...prev, country: india.name }))
              }
            }
          }
        } else {
          console.error('[Vendor Dashboard] ❌ Countries API failed or no data!')
          console.error('[Vendor Dashboard] Result status:', result.status)
          console.error('[Vendor Dashboard] Result data:', result.data)
          console.error('[Vendor Dashboard] Result message:', result.msg)
          console.error('[Vendor Dashboard] Result error:', result.error)
          
          // Show user-friendly error message
          if (result.msg && result.msg.includes('Connection refused')) {
            console.error('[Vendor Dashboard] ⚠️ Backend server is not running!')
            console.error('[Vendor Dashboard] Please start the Welcome API server:')
            console.error('[Vendor Dashboard] 1. Open terminal in: astronode (1)/html')
            console.error('[Vendor Dashboard] 2. Run: npm run welcome')
          }
          
          setCountries([])
        }
      } catch (error) {
        console.error('[Vendor Dashboard] ❌ Error loading countries:', error)
        console.error('[Vendor Dashboard] Error name:', error.name)
        console.error('[Vendor Dashboard] Error message:', error.message)
        console.error('[Vendor Dashboard] Error stack:', error.stack)
        setCountries([])
      } finally {
        setLoadingCountries(false)
        console.log('[Vendor Dashboard] Countries loading completed. Final countries.length:', countries.length)
      }
    }
    loadCountries()
  }, [])

  // Load states when country changes
  useEffect(() => {
    const loadStates = async () => {
      if (!selectedCountryId) {
        console.log('[Vendor Dashboard] No country selected, clearing states')
        setStates([])
        setSelectedStateId(null)
        return
      }
      
      // Ensure country_id is a number (backend expects number)
      const countryId = typeof selectedCountryId === 'string' ? parseInt(selectedCountryId, 10) : selectedCountryId
      
      if (isNaN(countryId) || countryId <= 0) {
        console.error('[Vendor Dashboard] Invalid country ID:', selectedCountryId, 'converted to:', countryId)
        setStates([])
        setSelectedStateId(null)
        setLoadingStates(false)
        return
      }
      
      console.log('[Vendor Dashboard] Loading states for country ID:', countryId, '(original:', selectedCountryId, ', type:', typeof selectedCountryId, ')')
      setLoadingStates(true)
      try {
        const result = await fetchPublicStateList(countryId)
        console.log('[Vendor Dashboard] States API result (full):', JSON.stringify(result, null, 2))
        console.log('[Vendor Dashboard] States API status:', result.status)
        console.log('[Vendor Dashboard] States API data type:', typeof result.data, Array.isArray(result.data))
        console.log('[Vendor Dashboard] States API data length:', result.data?.length)
        console.log('[Vendor Dashboard] States API data sample (first item):', result.data?.[0])
        
        // Check if API call was successful
        if (result.status !== 1) {
          console.error('[Vendor Dashboard] States API failed with status:', result.status, 'Message:', result.msg)
          setStates([])
          setLoadingStates(false)
          return
        }
        
        // Check if data exists and is an array
        if (!result.data) {
          console.error('[Vendor Dashboard] States API returned no data field')
          setStates([])
          setLoadingStates(false)
          return
        }
        
        if (!Array.isArray(result.data)) {
          console.error('[Vendor Dashboard] States API data is not an array:', typeof result.data, result.data)
          setStates([])
          setLoadingStates(false)
          return
        }
        
        if (result.data.length === 0) {
          console.warn('[Vendor Dashboard] States API returned empty array')
          setStates([])
          setLoadingStates(false)
          return
        }
        
        // Backend might return 'state_name' instead of 'name', handle both
        const stateList = result.data.map((state, index) => {
          // Backend uses 'state_name' field or 'name' field
          const stateName = state.state_name || state.name || state.stateName || ''
          const stateId = state.id || state.state_id || state.stateId || index
          
          return {
            id: stateId,
            name: stateName
          }
        }).filter(state => state.name && state.name.trim() !== '') // Filter out empty names
        
        console.log('[Vendor Dashboard] States mapped successfully:', stateList.length, 'states')
        console.log('[Vendor Dashboard] States list:', stateList)
        
        if (stateList.length === 0) {
          console.warn('[Vendor Dashboard] No valid states after mapping')
          setStates([])
          setLoadingStates(false)
          return
        }
        
        // Store states in the correct variable
        setStates(stateList)
        console.log('[Vendor Dashboard] States stored in state variable, current states.length:', stateList.length)
        
        // After states load, try to select the state from vendorProfile if available
        if (vendorProfile && vendorProfile.vendor && vendorProfile.vendor.state) {
          const state = stateList.find(s => 
            s.name === vendorProfile.vendor.state || 
            s.name.toLowerCase() === vendorProfile.vendor.state.toLowerCase()
          )
          if (state) {
            // Ensure state ID is a number
            const stateId = typeof state.id === 'string' ? parseInt(state.id, 10) : state.id
            console.log('[Vendor Dashboard] Auto-selecting state:', state.name, 'ID:', stateId, '(original:', state.id, ')')
            if (!isNaN(stateId) && stateId > 0) {
              setSelectedStateId(stateId)
            } else {
              console.error('[Vendor Dashboard] Invalid state ID for auto-selection:', state.id)
            }
            // Update profileData.state to match exact state name from dropdown
            setProfileData(prev => {
              if (prev.state !== state.name) {
                return { ...prev, state: state.name }
              }
              return prev
            })
          } else {
            console.warn('[Vendor Dashboard] State not found in list:', vendorProfile.vendor.state, 'Available states:', stateList.map(s => s.name))
          }
        }
      } catch (error) {
        console.error('[Vendor Dashboard] Error loading states:', error)
        console.error('[Vendor Dashboard] Error stack:', error.stack)
        setStates([])
      } finally {
        setLoadingStates(false)
      }
    }
    loadStates()
  }, [selectedCountryId, vendorProfile])

  // Load cities when state changes
  useEffect(() => {
      if (!selectedStateId) {
        setCities([])
        setLoadingCities(false)
        return
      }

    const fetchCities = async () => {
      setLoadingCities(true)
      try {
        // Use the existing API function
        const stateId = typeof selectedStateId === 'string' ? parseInt(selectedStateId, 10) : selectedStateId
        
        if (isNaN(stateId) || stateId <= 0) {
          console.error('[Vendor Dashboard] Invalid state ID:', selectedStateId)
          setCities([])
          setLoadingCities(false)
          return
        }

        const result = await fetchPublicCityList(stateId)
        
        // Check if API call was successful
        if (result.status === 1 && Array.isArray(result.data) && result.data.length > 0) {
          // Map cities to consistent format
          const cityList = result.data.map((city, index) => {
            const cityName = city.city_name || city.name || city.cityName || ''
            const cityId = city.id || city.city_id || city.cityId || index
            
            return {
              id: cityId,
              name: cityName
            }
          }).filter(city => city.name && city.name.trim() !== '')
          
          setCities(cityList || [])
          
          // Auto-select city from vendorProfile if available
          if (vendorProfile && vendorProfile.vendor && vendorProfile.vendor.city && cityList.length > 0) {
            const city = cityList.find(c => 
              c.name === vendorProfile.vendor.city || 
              c.name.toLowerCase() === vendorProfile.vendor.city.toLowerCase()
            )
            if (city) {
              setProfileData(prev => ({ ...prev, city: city.name }))
            }
          }
        } else {
          setCities([])
        }
      } catch (err) {
        console.error('[Vendor Dashboard] Error fetching cities:', err)
        setCities([])
      } finally {
        setLoadingCities(false)
      }
    }

    fetchCities()
  }, [selectedStateId, vendorProfile])

  // Debug: Log when selectedStateId changes
  useEffect(() => {
    console.log('[Vendor Dashboard] 🔍 selectedStateId changed:', {
      selectedStateId: selectedStateId,
      type: typeof selectedStateId,
      profileDataState: profileData.state,
      citiesLength: cities.length
    })
  }, [selectedStateId])

  // Debug: Log when cities state changes
  useEffect(() => {
    console.log('[Vendor Dashboard] 🔍 Cities state changed:', {
      citiesLength: cities.length,
      cities: cities.slice(0, 5).map(c => ({ id: c.id, name: c.name })),
      selectedStateId: selectedStateId,
      loadingCities: loadingCities
    })
  }, [cities, selectedStateId, loadingCities])

  // Handle image selection - immediately show preview
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    console.log('[Vendor Dashboard] handleImageSelect called:', {
      file: file,
      file_name: file?.name,
      file_type: file?.type,
      file_size: file?.size
    })
    
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.error('[Vendor Dashboard] Invalid file type:', file.type)
        setProfileUpdateError('Please select a valid image file')
        return
      }
      
      setSelectedProfileImage(file)
      
      // Revoke previous blob URL to prevent memory leaks
      if (profileImagePreview && profileImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(profileImagePreview)
        console.log('[Vendor Dashboard] Revoked previous blob URL')
      }
      
      // Create blob URL for immediate preview
      const previewUrl = URL.createObjectURL(file)
      setProfileImagePreview(previewUrl)
      setProfileUpdateError(null)
      console.log('[Vendor Dashboard] ✅ Image selected, preview URL created:', previewUrl)
      console.log('[Vendor Dashboard] profileImagePreview state will be:', previewUrl)
    } else {
      console.log('[Vendor Dashboard] No file selected, clearing preview')
      setSelectedProfileImage(null)
      
      // Revoke blob URL if it exists
      if (profileImagePreview && profileImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(profileImagePreview)
      }
      
      // Reset to React state (profileImage) when file selection is cleared
      setProfileImagePreview(profileImage || vendorProfile?.vendor_image || vendorImageUrl || null)
    }
  }

  // Handle image upload - immediately update React state with cache-busting
  // This function is called immediately after successful upload
  // Cache-busting with ?_t=${new Date().getTime()} forces browser to fetch new image
  const handleImageUpload = (newFileName) => {
    if (!newFileName) {
      console.warn('[Vendor Dashboard] No image URL provided to handleImageUpload')
      setProfileImage(null)
      setVendorImageUrl(null)
      setProfileImagePreview(null)
      return
    }

    // Add cache-busting timestamp with ?_t= format using new Date().getTime()
    // This forces browser to fetch new image instead of using cached version
    const timestamp = new Date().getTime()
    const cacheBustedUrl = newFileName.includes('?_t=') || newFileName.includes('&_t=')
      ? newFileName.replace(/([?&])_t=\d+/g, `$1_t=${timestamp}`)
      : newFileName.includes('?')
      ? `${newFileName}&_t=${timestamp}`
      : `${newFileName}?_t=${timestamp}`

    console.log('[Vendor Dashboard] handleImageUpload called with:', {
      newFileName: newFileName,
      cacheBustedUrl: cacheBustedUrl,
      timestamp: timestamp,
      newFileName_type: typeof newFileName,
      newFileName_length: newFileName?.length
    })

    // Immediately update React state - setProfileImage() triggers component re-render
    // This ensures new image shows immediately after upload
    setProfileImage(cacheBustedUrl)
    setVendorImageUrl(cacheBustedUrl)
    setProfileImagePreview(cacheBustedUrl)
    
    console.log('[Vendor Dashboard] State updated - profileImage:', cacheBustedUrl)
    
    // Update vendorProfile state to keep it in sync
    if (vendorProfile) {
      setVendorProfile({
        ...vendorProfile,
        vendor_image: cacheBustedUrl,
        vendor: {
          ...vendorProfile.vendor,
          vendor_image: cacheBustedUrl
        }
      })
      console.log('[Vendor Dashboard] vendorProfile state also updated with image URL')
    }

    console.log('[Vendor Dashboard] ✅ React state updated - setProfileImage() called with:', cacheBustedUrl)

    console.log('[Vendor Dashboard] ✅ React state updated - setProfileImage() called with:', cacheBustedUrl)
    console.log('[Vendor Dashboard] profileImage state will be:', cacheBustedUrl)
  }

  // Debug: Log when profileImage state changes
  useEffect(() => {
    console.log('[Vendor Dashboard] 🔍 profileImage state changed:', {
      profileImage: profileImage,
      vendorImageUrl: vendorImageUrl,
      profileImagePreview: profileImagePreview,
      vendorProfile_vendor_image: vendorProfile?.vendor_image
    })
  }, [profileImage, vendorImageUrl, profileImagePreview, vendorProfile?.vendor_image])

  // Handle product image selection
  const handleProductImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setProductFormData(prev => ({ ...prev, image: file }))
      setProductImagePreview(URL.createObjectURL(file))
      setProductAddError(null)
    }
  }

  // Handle add product
  const handleAddProduct = async (e) => {
    e.preventDefault()
    setProductAddError(null)
    setProductAddSuccess(false)

    // Validate required fields
    if (!productFormData.category_id || !productFormData.name || !productFormData.price) {
      setProductAddError('Please fill in all required fields (Category, Name, Price)')
      return
    }

    setAddingProduct(true)

    try {
      const result = await addVendorProduct({
        category_id: parseInt(productFormData.category_id),
        name: productFormData.name.trim(),
        price: parseFloat(productFormData.price),
        mrp: productFormData.mrp ? parseFloat(productFormData.mrp) : parseFloat(productFormData.price),
        hsn: productFormData.hsn.trim() || '',
        gst_percentage: productFormData.gst_percentage.trim() || '0',
        quantity: productFormData.quantity ? parseInt(productFormData.quantity) : 0,
        description: productFormData.description.trim() || '',
        image: productFormData.image ? productFormData.image.name : ''
      })

      if (result.status === 1) {
        setProductAddSuccess(true)
        setProductAddError(null)
        
        // Reset form
        setProductFormData({
          category_id: '',
          name: '',
          price: '',
          mrp: '',
          hsn: '',
          gst_percentage: '',
          quantity: '',
          unit: '',
          description: '',
          image: null
        })
        setProductImagePreview(null)
        
        // Reset to page 1 to see the newly added product
        setProductPage(1)
        
        // Refresh products list immediately from backend
        // This will also be triggered by useEffect when productPage changes
        await fetchVendorProducts()
        
        // Refresh dashboard to update total product count
        fetchVendorDashboard(ordersPage)
        
        // Switch to products tab to see the newly added product
        // This will also trigger useEffect to fetch products again
        setActiveTab('products')
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setProductAddSuccess(false)
        }, 3000)
      } else {
        setProductAddError(result.msg || 'Failed to add product. Please try again.')
      }
    } catch (error) {
      console.error('[Vendor Dashboard] Error adding product:', error)
      setProductAddError('An error occurred while adding product. Please try again.')
    } finally {
      setAddingProduct(false)
    }
  }

  // Handle recharge amount selection
  const handleRecharge = (amount) => {
    setRechargeAmount(amount)
  }

  // Handle recharge submit
  const handleRechargeSubmit = async (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()

    const currentUser = getCurrentUser()
    if (!currentUser || !currentUser.api_key || !currentUser.user_uni_id) {
      alert('Please login to recharge wallet')
      return
    }

    const amount = parseFloat(rechargeAmount)
    if (!amount || amount <= 0 || isNaN(amount)) {
      alert('Please enter a valid recharge amount')
      return
    }

    let selectedVoucher = rechargeVouchers.find(v => parseFloat(v.wallet_amount) === amount)
    if (!selectedVoucher && rechargeVouchers.length > 0) {
      selectedVoucher = rechargeVouchers[0]
    }
    if (!selectedVoucher && rechargeVouchers.length === 0) {
      alert('No recharge options available. Please try again later.')
      return
    }

    setLoadingRecharge(true)

    try {
      const gatewayBackendMap = {
        'razorpay': 'razorpay',
        'payu': 'Payu',
        'phonepe': 'PhonePe',
        'cashfree': 'Cashfree',
        'ccavenue': 'CCAvenue'
      }
      const backendPaymentMethod = gatewayBackendMap[selectedPaymentGateway] || selectedPaymentGateway

      const paymentResult = await proceedPaymentRequest({
        payment_method: backendPaymentMethod,
        wallet_id: selectedVoucher.id,
        amount: amount,
        is_updated: false
      })

      if (paymentResult.status === 1) {
        if (selectedPaymentGateway === 'razorpay') {
          const responseData = paymentResult.data || paymentResult
          const orderId = responseData?.order_id
          const razorpayId = responseData?.razorpay_id

          if (orderId && razorpayId) {
            if (!window.Razorpay) {
              const script = document.createElement('script')
              script.src = 'https://checkout.razorpay.com/v1/checkout.js'
              script.onload = () => {
                initializeRazorpay(orderId, razorpayId, amount, currentUser)
              }
              script.onerror = () => {
                alert('Failed to load Razorpay payment gateway. Please try again.')
                setLoadingRecharge(false)
              }
              document.body.appendChild(script)
            } else {
              initializeRazorpay(orderId, razorpayId, amount, currentUser)
            }

            function initializeRazorpay(orderId, razorpayId, amount, currentUser) {
              const options = {
                key: razorpayId,
                amount: amount * 100,
                currency: 'INR',
                name: 'Vendor Wallet Recharge',
                description: `Recharge wallet with ₹${amount}`,
                order_id: orderId,
                handler: async function (response) {
                  try {
                    const updateResult = await updateOnlinePayment({
                      payment_method: 'razorpay',
                      order_id: response.razorpay_order_id || orderId,
                      payment_id: response.razorpay_payment_id,
                      signature: response.razorpay_signature,
                      order_status: 'success',
                      is_razorpay_webhook: false
                    })

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
                    setLoadingRecharge(false)
                  }
                }
              }
              try {
                const razorpay = new window.Razorpay(options)
                razorpay.open()
              } catch (error) {
                alert('Error opening payment gateway: ' + error.message)
                setLoadingRecharge(false)
              }
            }
            return
          } else {
            alert('Razorpay payment data is incomplete. Please try again or contact support.')
            setLoadingRecharge(false)
            return
          }
        } else if (selectedPaymentGateway === 'payu') {
          if (paymentResult.payu_data?.paymentLink) {
            window.location.href = paymentResult.payu_data.paymentLink
            return
          } else {
            alert('PayU payment link not found. Please try again or contact support.')
            setLoadingRecharge(false)
            return
          }
        } else if (selectedPaymentGateway === 'phonepe') {
          if (paymentResult.phonepe_data?.payment_url) {
            window.location.href = paymentResult.phonepe_data.payment_url
            return
          } else {
            alert('PhonePe payment URL not found. Please try again or contact support.')
            setLoadingRecharge(false)
            return
          }
        } else if (selectedPaymentGateway === 'cashfree') {
          if (paymentResult.cashfree_data?.payment_url) {
            window.location.href = paymentResult.cashfree_data.payment_url
            return
          } else {
            alert('Cashfree payment URL not found. Please try again or contact support.')
            setLoadingRecharge(false)
            return
          }
        } else if (selectedPaymentGateway === 'ccavenue') {
          if (paymentResult.ccavenue_data?.payment_url) {
            window.location.href = paymentResult.ccavenue_data.payment_url
            return
          } else {
            alert('CCAvenue payment URL not found. Please try again or contact support.')
            setLoadingRecharge(false)
            return
          }
        }
      } else {
        alert(paymentResult.msg || 'Failed to initiate payment. Please try again.')
      }
    } catch (error) {
      alert('Error processing recharge: ' + (error.message || 'Please try again'))
    } finally {
      setLoadingRecharge(false)
    }
  }

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    setUpdatingProfile(true)
    setProfileUpdateError(null)
    setProfileUpdateSuccess(false)

    try {
      // Validate required fields
      if (!profileData.name || !profileData.email || !profileData.phone ||
          !profileData.firm_name || !profileData.pin_code || !profileData.address ||
          !profileData.gst_no) {
        setProfileUpdateError('Please fill in all required fields.')
        setUpdatingProfile(false)
        return
      }

      // Validate phone (10 digits)
      const cleanPhone = profileData.phone.replace(/\D/g, '')
      if (cleanPhone.length !== 10) {
        setProfileUpdateError('Please enter a valid 10-digit mobile number.')
        setUpdatingProfile(false)
        return
      }

      // Validate pin code (6 digits) - remove non-digits only, no trim
      const cleanPinCode = String(profileData.pin_code || '').replace(/\D/g, '')
      if (cleanPinCode.length !== 6) {
        setProfileUpdateError('Pin code must be exactly 6 digits.')
        setUpdatingProfile(false)
        return
      }

      // Validate GST number (15 characters) - remove spaces only, keep alphanumeric
      const cleanGstNo = String(profileData.gst_no || '').replace(/\s/g, '').toUpperCase()
      if (cleanGstNo.length !== 15) {
        setProfileUpdateError('GST number must be exactly 15 characters long.')
        setUpdatingProfile(false)
        return
      }

      // Prepare update data
      const updateData = {
        name: profileData.name.trim(),
        email: profileData.email.trim(),
        phone: cleanPhone, // Already cleaned, no trim needed for numbers
        firm_name: profileData.firm_name.trim(),
        pin_code: cleanPinCode, // Already cleaned, no trim needed for numbers
        gst_no: cleanGstNo, // Already cleaned, no trim needed
        address: profileData.address.trim(),
        city: (profileData.city || '').trim(),
        state: (profileData.state || '').trim(),
        country: (profileData.country || 'India').trim(),
        term: (profileData.term || '').trim(),
        vendor_image: selectedProfileImage // File object or null
      }
      
      // Validate that required fields are not empty after trim
      if (!updateData.name || !updateData.email || !updateData.phone ||
          !updateData.firm_name || !updateData.pin_code || !updateData.address ||
          !updateData.gst_no) {
        setProfileUpdateError('Please fill in all required fields. Some fields may be empty after trimming.')
        setUpdatingProfile(false)
        return
      }

      console.log('[Vendor Dashboard] Submitting profile update:', updateData)
      console.log('[Vendor Dashboard] Selected profile image:', selectedProfileImage)
      
      const result = await updateVendorProfile(updateData)
      console.log('[Vendor Dashboard] Update profile result:', result)
      console.log('[Vendor Dashboard] Update profile result status:', result?.status)
      console.log('[Vendor Dashboard] Update profile result data:', result?.data)
      console.log('[Vendor Dashboard] Update profile result msg:', result?.msg)

      if (result && result.status === 1 && result.data) {
        setProfileUpdateSuccess(true)
        setProfileUpdateError(null)
        
        // Get updated image URL from upload response
        // Backend returns: result.data.vendor.vendor_image (full URL)
        // Check multiple possible locations in response
        const uploadedImageUrl = result.data?.vendor?.vendor_image || 
                                 result.data?.vendor_image || 
                                 result.data?.data?.vendor?.vendor_image ||
                                 result.data?.data?.vendor_image ||
                                 null
        
        console.log('[Vendor Dashboard] Upload response - image URL:', {
          vendor_image: result.data?.vendor?.vendor_image,
          uploadedImageUrl: uploadedImageUrl,
          full_result_data: result.data
        })
        
        // Call handleImageUpload IMMEDIATELY after successful upload
        // This updates React state (setProfileImage) with cache-busting and triggers re-render
        if (uploadedImageUrl) {
          console.log('[Vendor Dashboard] ✅ Upload successful, setting image URL:', uploadedImageUrl)
          console.log('[Vendor Dashboard] Before handleImageUpload - profileImage state:', profileImage)
          handleImageUpload(uploadedImageUrl) // Updates profileImage state with ?_t=${new Date().getTime()}
          // Force state update by checking after a brief delay
          setTimeout(() => {
            console.log('[Vendor Dashboard] After handleImageUpload - profileImage should be updated')
          }, 100)
        } else {
          console.warn('[Vendor Dashboard] ⚠️ No image URL in upload response')
          console.warn('[Vendor Dashboard] Full result object:', JSON.stringify(result, null, 2))
          console.warn('[Vendor Dashboard] Checking alternative paths:')
          console.warn('  - result.data.vendor:', result.data?.vendor)
          console.warn('  - result.data.vendor_image:', result.data?.vendor_image)
          console.warn('  - result.data.data:', result.data?.data)
          console.warn('  - result.data.data?.vendor:', result.data?.data?.vendor)
        }
        
        // Update local storage
        const currentUser = getCurrentUser()
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            name: result.data.name,
            email: result.data.email,
            phone: result.data.phone,
            vendor_image: uploadedImageUrl || null,
            vendor: {
              ...currentUser.vendor,
              ...result.data.vendor
            }
          }
          localStorage.setItem('user', JSON.stringify(updatedUser))
          
          // Update vendor profile state - preserve uploaded image URL
          setVendorProfile(prev => ({
            ...prev,
            ...updatedUser,
            ...result.data,
            vendor_image: uploadedImageUrl || result.data?.vendor?.vendor_image || prev?.vendor_image,
            vendor: {
              ...prev?.vendor,
              ...result.data.vendor,
              vendor_image: uploadedImageUrl || result.data?.vendor?.vendor_image || prev?.vendor?.vendor_image
            }
          }))
          
          // Update profile form data
          setProfileData({
            name: result.data.name,
            email: result.data.email,
            phone: result.data.phone.replace(/^\+91/, '').replace(/\D/g, ''),
            firm_name: result.data.vendor?.firm_name || '',
            pin_code: result.data.vendor?.pin_code || '',
            gst_no: result.data.vendor?.gst_no || '',
            address: result.data.vendor?.address || '',
            city: result.data.vendor?.city || '',
            state: result.data.vendor?.state || '',
            country: result.data.vendor?.country || 'India',
            term: result.data.vendor?.term || ''
          })
          setSelectedProfileImage(null)
          
          // Don't refresh dashboard immediately - it will reset the image
          // Instead, refresh after a delay to ensure image state is stable
          setTimeout(async () => {
            await fetchVendorDashboard(ordersPage)
          }, 1000)
          
          // Notify other components
          window.dispatchEvent(new Event('userProfileUpdated'))
        }
        
        // Show success message
        setTimeout(() => {
          setProfileUpdateSuccess(false)
        }, 3000)
      } else {
        const errorMsg = result?.msg || result?.message || result?.error || 'Failed to update profile. Please try again.'
        console.error('[Vendor Dashboard] Profile update failed:', errorMsg, result)
        setProfileUpdateError(errorMsg)
      }
    } catch (error) {
      console.error('[Vendor Dashboard] Error updating profile:', error)
      console.error('[Vendor Dashboard] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      const errorMessage = error.message || error.msg || 'An error occurred while updating profile. Please try again.'
      setProfileUpdateError(errorMessage)
    } finally {
      setUpdatingProfile(false)
    }
  }

  const getPaginatedItems = (items, page, size) => {
    const start = (page - 1) * size
    return items.slice(start, start + size)
  }

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: 'fa-chart-line' },
    { id: 'profile', label: 'My Profile', icon: 'fa-user' },
    { id: 'orders', label: 'My Orders', icon: 'fa-shopping-bag' },
    { id: 'wallet', label: 'My Wallet', icon: 'fa-wallet' },
    { id: 'received-gifts', label: 'Received Gifts', icon: 'fa-gift' },
    { id: 'products', label: 'My Product', icon: 'fa-box' },
    { id: 'add-product', label: 'Add Product', icon: 'fa-plus' },
    { id: 'bank-details', label: 'Bank Details', icon: 'fa-university' },
    { id: 'withdrawals', label: 'Withdrawal Request', icon: 'fa-money-check-alt' },
  ]

  const OverviewCards = () => (
    <div className="react-grid-cards">
      <div className="react-stat-card">
        <div className="react-stat-info">
          <h4>Total Income</h4>
          <div className="react-stat-value">₹{totalIncome.toFixed(2)}</div>
        </div>
        <i className="fas fa-rupee-sign react-stat-icon"></i>
      </div>
      <div className="react-stat-card">
        <div className="react-stat-info">
          <h4>Total Balance</h4>
          <div className="react-stat-value">₹{totalBalance.toFixed(2)}</div>
        </div>
        <i className="fas fa-wallet react-stat-icon"></i>
      </div>
      <div className="react-stat-card">
        <div className="react-stat-info">
          <h4>Total Product</h4>
          <div className="react-stat-value">{totalProduct}</div>
        </div>
        <i className="fas fa-boxes react-stat-icon"></i>
      </div>
      <div className="react-stat-card">
        <div className="react-stat-info">
          <h4>Total Order</h4>
          <div className="react-stat-value">{totalOrder}</div>
        </div>
        <i className="fas fa-shopping-cart react-stat-icon"></i>
      </div>
    </div>
  )

  const TripleLine = ({ title, statusKey }) => {
    const counts = orderCounts[statusKey] || { total: 0, yesterday: 0, today: 0 }
    return (
      <div className="react-triple-line">
        <div className="react-triple-line-header">{title}</div>
        <div className="react-triple-line-body">
          <div className="react-triple-item">
            <div className="react-triple-label">Total</div>
            <div className="react-triple-value">{counts.total}</div>
          </div>
          <div className="react-triple-item">
            <div className="react-triple-label">Yesterday</div>
            <div className="react-triple-value">{counts.yesterday}</div>
          </div>
          <div className="react-triple-item">
            <div className="react-triple-label">Today</div>
            <div className="react-triple-value">{counts.today}</div>
          </div>
        </div>
      </div>
    )
  }

  const OverviewSection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>Vendor Dashboard</h2>
        <p>Overview of your store performance</p>
      </div>

      <OverviewCards />

      <div className="react-grid-rows-3">
        <TripleLine title="Pending Order" statusKey="pending" />
        <TripleLine title="Dispatch Order" statusKey="dispatch" />
        <TripleLine title="Confirm Order" statusKey="confirm" />
        <TripleLine title="Delivered Order" statusKey="delivered" />
        <TripleLine title="Cancel Order" statusKey="cancel" />
      </div>

      <div className="react-two-col">
        <div className="react-card">
          <div className="react-section-subheader">
            <h3>Income Overview</h3>
            <span className="react-muted">Last 12 Month Data</span>
          </div>
          <div className="react-no-data" style={{height:'220px'}}>Chart Coming Soon</div>
        </div>
        <div className="react-card">
          <div className="react-section-subheader">
            <h3>New Orders</h3>
          </div>
          <div className="react-table-container">
            <table className="react-data-table">
              <thead>
                <tr>
                  <th>S. No</th>
                  <th>Order Id</th>
                  <th>User Id</th>
                  <th>Total Amount</th>
                  <th>Created Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="react-no-data">Loading...</td>
                  </tr>
                ) : orders.length > 0 ? (
                  orders.slice(0, 5).map((order, idx) => (
                    <tr key={order.id || idx}>
                      <td>{idx + 1}</td>
                      <td>{order.orderId}</td>
                      <td>{order.userId}</td>
                      <td>₹{order.amount}</td>
                      <td>{order.date}</td>
                      <td>
                        <span className={`react-badge ${
                          order.status === 'delivered' ? 'react-success' :
                          order.status === 'confirm' ? 'react-info' :
                          order.status === 'dispatch' ? 'react-warning' :
                          order.status === 'cancel' ? 'react-danger' :
                          'react-warning'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="react-no-data">No Records Found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )

  const WalletSection = () => {
    const rechargeOptions = [50, 100, 200, 500, 1000, 2000, 5000]
    
    return (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>My Wallet</h2>
        <p>Available Balance</p>
      </div>
      <div className="react-wallet-balance-card">
        <div className="react-balance-info">
          <h3>Available Balance</h3>
          <div className="react-balance-amount">₹{walletBalance}</div>
        </div>
        <div className="react-balance-icon"><i className="fas fa-wallet"></i></div>
      </div>

      {/* Recharge Section */}
      <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8f9fa', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Recharge Wallet</h3>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Select Amount</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
            {rechargeOptions.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => handleRecharge(amount.toString())}
                className={`react-btn ${rechargeAmount === amount.toString() ? 'react-btn-primary' : 'react-btn-outline'}`}
                style={{ minWidth: '80px' }}
              >
                ₹{amount}
              </button>
            ))}
          </div>
          <input
            type="number"
            placeholder="Or enter custom amount"
            value={rechargeAmount}
            onChange={(e) => setRechargeAmount(e.target.value)}
            className="react-form-input"
            style={{ width: '100%', marginTop: '0.5rem' }}
            min="1"
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Payment Gateway</label>
          {loadingPaymentGateways ? (
            <p style={{ color: '#999', fontSize: '0.875rem' }}>Loading payment gateways...</p>
          ) : availablePaymentGateways.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {availablePaymentGateways.map((gateway) => (
                <label
                  key={gateway.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: 'pointer',
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
              console.log('[Vendor Dashboard] ===== RECHARGE BUTTON CLICKED =====')
              console.log('[Vendor Dashboard] rechargeAmount:', rechargeAmount)
              console.log('[Vendor Dashboard] loadingRecharge:', loadingRecharge)
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

      <div className="react-table-container" style={{ marginTop: '2rem' }}>
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
            {loadingWalletTxns ? (
              <tr>
                <td colSpan="7" className="react-no-data">Loading transactions...</td>
              </tr>
            ) : walletTxns.length > 0 ? (
              walletTxns.map((row, idx) => (
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
                      } else if (status === 'declined' || status === '3') {
                        badgeClass = 'react-danger'
                        displayStatus = 'Declined'
                      } else {
                        badgeClass = status.includes('pending') ? 'react-warning' : ''
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
        totalItems={walletTxns.length}
        pageSize={walletPageSize}
        onPageChange={(page) => { setWalletPage(page); fetchWalletTransactions() }}
        onPageSizeChange={(s) => { setWalletPageSize(s); setWalletPage(1); fetchWalletTransactions() }}
      />
    </div>
  )
  }

  const ReceivedGiftsSection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>🎁 Received Gifts</h2>
        <p>Gifts received from users</p>
      </div>
      <div className="react-table-container">
        <table className="react-data-table">
          <thead>
            <tr>
              <th>S. No.</th>
              <th>From User</th>
              <th>Gift</th>
              <th>Amount Earned</th>
              <th>Type</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loadingReceivedGifts ? (
              <tr>
                <td colSpan="6" className="react-no-data">Loading gifts...</td>
              </tr>
            ) : receivedGifts.length > 0 ? (
              receivedGifts.map((gift, idx) => (
                <tr key={gift.id || idx}>
                  <td>{(giftPage - 1) * giftPageSize + idx + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {gift.customer?.customer_img && (
                        <img 
                          src={gift.customer.customer_img} 
                          alt={gift.user_customer?.name || 'User'}
                          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                        />
                      )}
                      <div>
                        <div style={{ fontWeight: '600' }}>
                          {gift.user_customer?.name || 'Anonymous User'}
                        </div>
                        {gift.user_customer?.user_uni_id && (
                          <div style={{ fontSize: '0.8rem', color: '#999' }}>
                            {gift.user_customer.user_uni_id}
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
                  <td>
                    <div style={{ fontWeight: '600', color: '#10b981' }}>
                      ₹{parseFloat(gift.amount || 0).toFixed(2)}
                    </div>
                    {parseFloat(gift.gift?.gift_price || 0) > parseFloat(gift.amount || 0) && (
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>
                        Original: ₹{parseFloat(gift.gift?.gift_price || 0).toFixed(2)}
                        <br />
                        <span style={{ fontSize: '0.7rem', color: '#999' }}>
                          (After commission & TDS)
                        </span>
                      </div>
                    )}
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
                    <h4 style={{ color: '#666', marginBottom: '10px' }}>No Gifts Received Yet</h4>
                    <p style={{ color: '#999', fontSize: '0.9rem' }}>
                      You haven't received any gifts from users yet.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {receivedGifts.length > 0 && (
        <Pagination
          currentPage={giftPage}
          totalItems={receivedGifts.length}
          pageSize={giftPageSize}
          onPageChange={(page) => { setGiftPage(page); fetchReceivedGifts() }}
          onPageSizeChange={(s) => { setGiftPageSize(s); setGiftPage(1); fetchReceivedGifts() }}
        />
      )}
    </div>
  )

  const ProductsSection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>My Product</h2>
        <p>Available Product</p>
      </div>
      <div className="react-table-container">
        <table className="react-data-table">
          <thead>
            <tr>
              <th>S. No.</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>MRP</th>
              <th>Price / Unit</th>
              <th>GST%</th>
              <th>Images</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loadingProducts ? (
              <tr><td colSpan="8" className="react-no-data">Loading products...</td></tr>
            ) : getPaginatedItems(products, productPage, productPageSize).map((row, idx) => (
              <tr key={row.id || idx}>
                <td>{(productPage - 1) * productPageSize + idx + 1}</td>
                <td>{row.name}</td>
                <td>{row.category}</td>
                <td>₹{row.mrp || row.price}</td>
                <td>₹{row.price}</td>
                <td>{row.gst}%</td>
                <td>
                  {row.image ? (
                    <img 
                      src={getImageUrl(row.image) || ''} 
                      alt={row.name} 
                      style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} 
                      crossOrigin={import.meta.env.DEV ? undefined : "anonymous"}
                      onError={(e) => {
                        // Fallback to placeholder if image fails
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltZzwvdGV4dD48L3N2Zz4='
                        console.warn('[Vendor Dashboard] Product image load failed:', row.image)
                      }}
                    />
                  ) : (
                    '-'
                  )}
                </td>
                <td>-</td>
              </tr>
            ))}
            {!loadingProducts && products.length === 0 && (
              <tr><td colSpan="8" className="react-no-data">No Records Found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={productPage}
        totalItems={products.length}
        pageSize={productPageSize}
        onPageChange={setProductPage}
        onPageSizeChange={(s)=>{ setProductPageSize(s); setProductPage(1) }}
      />
    </div>
  )

  const AddProductSection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>Add Product</h2>
        <p>Add a new product to your inventory</p>
      </div>
      
      {productAddError && (
        <div style={{ padding: '15px', marginBottom: '20px', backgroundColor: '#fee', color: '#c33', borderRadius: '5px' }}>
          {productAddError}
        </div>
      )}
      {productAddSuccess && (
        <div style={{ padding: '15px', marginBottom: '20px', backgroundColor: '#efe', color: '#3c3', borderRadius: '5px' }}>
          Product added successfully!
        </div>
      )}
      
      <form className="react-profile-form" onSubmit={handleAddProduct}>
        <div className="react-form-group">
          <label>Product Category <span style={{ color: 'red' }}>*</span></label>
          <select 
            className="react-form-input"
            value={productFormData.category_id}
            onChange={(e) => setProductFormData(prev => ({ ...prev, category_id: e.target.value }))}
            required
          >
            <option value="">Please Select Product Category</option>
            {productCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.category_name}</option>
            ))}
          </select>
        </div>
        <div className="react-form-row">
          <div className="react-form-group">
            <label>Product Name <span style={{ color: 'red' }}>*</span></label>
            <input 
              className="react-form-input" 
              placeholder="Product name"
              value={productFormData.name}
              onChange={(e) => setProductFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div className="react-form-group">
            <label>Price (INR) <span style={{ color: 'red' }}>*</span></label>
            <input 
              type="number" 
              step="0.01"
              className="react-form-input" 
              placeholder="Price Inr"
              value={productFormData.price}
              onChange={(e) => setProductFormData(prev => ({ ...prev, price: e.target.value }))}
              required
              min="0"
            />
          </div>
        </div>
        <div className="react-form-row">
          <div className="react-form-group">
            <label>MRP</label>
            <input 
              type="number" 
              step="0.01"
              className="react-form-input" 
              placeholder="MRP (optional)"
              value={productFormData.mrp}
              onChange={(e) => setProductFormData(prev => ({ ...prev, mrp: e.target.value }))}
              min="0"
            />
          </div>
          <div className="react-form-group">
            <label>HSN</label>
            <input 
              className="react-form-input" 
              placeholder="HSN Code (optional)"
              value={productFormData.hsn}
              onChange={(e) => setProductFormData(prev => ({ ...prev, hsn: e.target.value }))}
            />
          </div>
        </div>
        <div className="react-form-row">
          <div className="react-form-group">
            <label>GST %</label>
            <input 
              type="number" 
              step="0.01"
              className="react-form-input" 
              placeholder="GST Percentage (optional)"
              value={productFormData.gst_percentage}
              onChange={(e) => setProductFormData(prev => ({ ...prev, gst_percentage: e.target.value }))}
              min="0"
              max="100"
            />
          </div>
          <div className="react-form-group">
            <label>Stock Quantity</label>
            <input 
              type="number" 
              className="react-form-input" 
              placeholder="Stock quantity (optional)"
              value={productFormData.quantity}
              onChange={(e) => setProductFormData(prev => ({ ...prev, quantity: e.target.value }))}
              min="0"
            />
          </div>
        </div>
          <div className="react-form-group">
          <label>Product Image</label>
          {productImagePreview && (
            <div style={{ marginBottom: '10px' }}>
              <img 
                src={productImagePreview} 
                alt="Product preview" 
                style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }}
                crossOrigin={import.meta.env.DEV ? undefined : "anonymous"}
                onError={(e) => {
                  console.error('[Vendor Dashboard] Product preview image load failed')
                  e.target.style.display = 'none'
                }}
                onLoad={() => {
                  console.log('[Vendor Dashboard] Product preview image loaded successfully')
                }}
              />
          </div>
          )}
          <input 
            type="file" 
            className="react-form-input"
            accept="image/*"
            onChange={handleProductImageSelect}
          />
        </div>
        <div className="react-form-group">
          <label>Description</label>
          <textarea 
            className="react-form-textarea" 
            rows="4" 
            placeholder="Product description (optional)"
            value={productFormData.description}
            onChange={(e) => setProductFormData(prev => ({ ...prev, description: e.target.value }))}
          ></textarea>
        </div>
        <div style={{display:'flex', gap:'0.75rem'}}>
          <button 
            className="react-btn react-btn-primary" 
            type="submit"
            disabled={addingProduct}
          >
            {addingProduct ? 'Adding Product...' : 'Save Product'}
          </button>
          <button 
            className="react-btn react-btn-outline" 
            type="button"
            onClick={() => {
              setProductFormData({
                category_id: '',
                name: '',
                price: '',
                mrp: '',
                hsn: '',
                gst_percentage: '',
                quantity: '',
                unit: '',
                description: '',
                image: null
              })
              setProductImagePreview(null)
              setProductAddError(null)
              setProductAddSuccess(false)
            }}
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  )

  const OrdersSection = () => {
    return (
      <div className="react-account-section">
        <div className="react-section-header">
          <h2>My Orders</h2>
          <p>Total Orders: {totalOrdersCount}</p>
        </div>
        <div className="react-table-container">
          <table className="react-data-table">
            <thead>
              <tr>
                <th>S. No</th>
                <th>Order Id</th>
                <th>User Id</th>
                <th>Total Amount</th>
                <th>Created Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loadingOrders ? (
                <tr><td colSpan="7" className="react-no-data">Loading...</td></tr>
              ) : orders.length > 0 ? (
                orders.map((row, idx) => (
                  <tr key={row.id || idx}>
                    <td>{(ordersPage - 1) * ordersPageSize + idx + 1}</td>
                    <td>{row.orderId}</td>
                    <td>{row.userId}</td>
                    <td>₹{row.amount}</td>
                    <td>{row.date}</td>
                    <td>
                      <span className={`react-badge ${
                        row.status === 'delivered' ? 'react-success' :
                        row.status === 'confirm' ? 'react-info' :
                        row.status === 'dispatch' ? 'react-warning' :
                        row.status === 'cancel' ? 'react-danger' :
                        'react-warning'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td>-</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="7" className="react-no-data">No Records Found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={ordersPage}
          totalItems={totalOrdersCount}
          pageSize={ordersPageSize}
          onPageChange={setOrdersPage}
          onPageSizeChange={(s)=>{ setOrdersPageSize(s); setOrdersPage(1) }}
        />
      </div>
    )
  }

  // Load bank details
  const loadBankDetails = async () => {
    setLoadingBankDetails(true)
    setBankDetailsError(null)
    try {
      const response = await getBankDetails()
      if (response.status === 1 && response.bankDetail) {
        setBankDetails({
          bank_name: response.bankDetail.bank_name || '',
          account_no: response.bankDetail.account_no || '',
          account_type: response.bankDetail.account_type || 'Savings',
          ifsc_code: response.bankDetail.ifsc_code || '',
          account_name: response.bankDetail.account_name || '',
          pan_no: response.bankDetail.pan_card || ''
        })
      }
    } catch (error) {
      console.error('[Vendor Dashboard] Error loading bank details:', error)
      setBankDetailsError('Failed to load bank details')
    } finally {
      setLoadingBankDetails(false)
    }
  }

  // Save bank details
  const handleSaveBankDetails = async (e) => {
    e.preventDefault()
    setSavingBankDetails(true)
    setBankDetailsError(null)
    setBankDetailsSuccess(false)
    
    try {
      const response = await saveBankDetails(bankDetails)
      if (response.status === 1) {
        setBankDetailsSuccess(true)
        setTimeout(() => setBankDetailsSuccess(false), 3000)
      } else {
        setBankDetailsError(response.msg || 'Failed to save bank details')
      }
    } catch (error) {
      console.error('[Vendor Dashboard] Error saving bank details:', error)
      setBankDetailsError('Failed to save bank details')
    } finally {
      setSavingBankDetails(false)
    }
  }

  const BankDetailsSection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>Bank Details</h2>
        <p>Add your bank account details for receiving payouts</p>
      </div>
      
      {bankDetailsError && (
        <div style={{ padding: '15px', marginBottom: '20px', backgroundColor: '#fee', color: '#c33', borderRadius: '5px' }}>
          {bankDetailsError}
        </div>
      )}
      {bankDetailsSuccess && (
        <div style={{ padding: '15px', marginBottom: '20px', backgroundColor: '#efe', color: '#3c3', borderRadius: '5px' }}>
          Bank details saved successfully!
        </div>
      )}
      
      {loadingBankDetails ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px' }}></i>
          <p>Loading bank details...</p>
        </div>
      ) : (
        <form className="react-profile-form" onSubmit={handleSaveBankDetails}>
          <div className="react-form-row">
            <div className="react-form-group">
              <label>Account Holder Name <span style={{color:'red'}}>*</span></label>
              <input 
                className="react-form-input" 
                placeholder="Enter account holder name" 
                value={bankDetails.account_name}
                onChange={(e) => setBankDetails({...bankDetails, account_name: e.target.value})}
                required 
              />
            </div>
            <div className="react-form-group">
              <label>Bank Name <span style={{color:'red'}}>*</span></label>
              <input 
                className="react-form-input" 
                placeholder="Enter bank name" 
                value={bankDetails.bank_name}
                onChange={(e) => setBankDetails({...bankDetails, bank_name: e.target.value})}
                required 
              />
            </div>
          </div>
          
          <div className="react-form-row">
            <div className="react-form-group">
              <label>Account Number <span style={{color:'red'}}>*</span></label>
              <input 
                className="react-form-input" 
                placeholder="Enter account number" 
                value={bankDetails.account_no}
                onChange={(e) => setBankDetails({...bankDetails, account_no: e.target.value})}
                required 
              />
            </div>
            <div className="react-form-group">
              <label>IFSC Code <span style={{color:'red'}}>*</span></label>
              <input 
                className="react-form-input" 
                placeholder="Enter IFSC code" 
                value={bankDetails.ifsc_code}
                onChange={(e) => setBankDetails({...bankDetails, ifsc_code: e.target.value.toUpperCase()})}
                required 
              />
            </div>
          </div>
          
          <div className="react-form-row">
            <div className="react-form-group">
              <label>Account Type <span style={{color:'red'}}>*</span></label>
              <select 
                className="react-form-input"
                value={bankDetails.account_type}
                onChange={(e) => setBankDetails({...bankDetails, account_type: e.target.value})}
                required
              >
                <option value="Savings">Savings</option>
                <option value="Current">Current</option>
              </select>
            </div>
            <div className="react-form-group">
              <label>PAN Number</label>
              <input 
                className="react-form-input" 
                placeholder="Enter PAN number" 
                value={bankDetails.pan_no}
                onChange={(e) => setBankDetails({...bankDetails, pan_no: e.target.value.toUpperCase()})}
                maxLength={10}
              />
            </div>
          </div>
          
          <div style={{display:'flex', gap:'0.75rem', justifyContent:'flex-end', marginTop: '20px'}}>
            <button 
              type="button" 
              className="react-btn react-btn-outline" 
              onClick={loadBankDetails}
              disabled={loadingBankDetails}
            >
              <i className="fas fa-sync-alt" style={{marginRight:'6px'}}></i>
              Refresh
            </button>
            <button 
              type="submit" 
              className="react-btn react-btn-primary"
              disabled={savingBankDetails}
            >
              {savingBankDetails ? (
                <>
                  <i className="fas fa-spinner fa-spin" style={{marginRight:'6px'}}></i>
                  Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save" style={{marginRight:'6px'}}></i>
                  Save Bank Details
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  )

  const WithdrawalSection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:'1rem', flexWrap:'wrap'}}>
          <div>
            <h2>Withdrawal Request</h2>
            {/* <p>No Records Found</p> */}
          </div>
          <button className="react-btn react-btn-primary" onClick={() => setWithdrawalModalOpen(true)}>
            <i className="fas fa-plus" style={{marginRight:'6px'}}></i>
            Add Withdrawal Request
          </button>
        </div>
      </div>
      <div className="react-table-container">
        <table className="react-data-table">
          <thead>
            <tr>
              <th>S. No.</th>
              <th>REQUEST AMOUNT</th>
              <th>REQUEST MESSAGE</th>
              <th>Image</th>
              <th>Remark</th>
              <th>status</th>
              <th>created at</th>
              <th>action</th>
            </tr>
          </thead>
          <tbody>
            {getPaginatedItems(withdrawals, withdrawPage, withdrawPageSize).map((row, idx) => (
              <tr key={idx}>
                <td>{(withdrawPage - 1) * withdrawPageSize + idx + 1}</td>
                <td>{row.amount}</td>
                <td>{row.message}</td>
                <td>-</td>
                <td>{row.remark}</td>
                <td>{row.status}</td>
                <td>{row.createdAt}</td>
                <td>-</td>
              </tr>
            ))}
            {withdrawals.length === 0 && (
              <tr><td colSpan="8" className="react-no-data">No Records Found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        currentPage={withdrawPage}
        totalItems={withdrawals.length}
        pageSize={withdrawPageSize}
        onPageChange={setWithdrawPage}
        onPageSizeChange={(s)=>{ setWithdrawPageSize(s); setWithdrawPage(1) }}
      />

      <Modal
        isOpen={withdrawalModalOpen}
        onClose={() => setWithdrawalModalOpen(false)}
        title="Add Withdrawal Request"
      >
        <form className="react-profile-form" onSubmit={(e)=> { e.preventDefault(); setWithdrawalModalOpen(false) }}>
          <div className="react-form-row">
            <div className="react-form-group">
              <label>Amount</label>
              <input className="react-form-input" placeholder="Request Amount" required />
            </div>
            <div className="react-form-group">
              <label>Message</label>
              <input className="react-form-input" placeholder="Request Message" />
            </div>
          </div>
          <div style={{display:'flex', gap:'0.75rem', justifyContent:'flex-end'}}>
            <button className="react-btn react-btn-outline" type="button" onClick={() => setWithdrawalModalOpen(false)}>Cancel</button>
            <button className="react-btn react-btn-primary" type="submit">Submit</button>
          </div>
        </form>
      </Modal>
    </div>
  )

  const ProfileSection = () => (
    <div className="react-account-section">
      <div className="react-section-header">
        <h2>My Profile</h2>
        <p>Update your vendor profile information</p>
      </div>
      
      {profileUpdateError && (
        <div style={{ padding: '15px', marginBottom: '20px', backgroundColor: '#fee', color: '#c33', borderRadius: '5px' }}>
          {profileUpdateError}
        </div>
      )}
      {profileUpdateSuccess && (
        <div style={{ padding: '15px', marginBottom: '20px', backgroundColor: '#efe', color: '#3c3', borderRadius: '5px' }}>
          Profile updated successfully!
        </div>
      )}
      
      <form className="react-profile-form" onSubmit={handleProfileUpdate}>
        <div className="react-form-group">
          <label>Profile Image</label>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
            <img 
              src={(() => {
                // Priority: profileImagePreview (blob preview for selected file) > profileImage (uploaded image) > vendorProfile
                // profileImagePreview is a blob URL created from selected file - use it directly without processing
                const imgUrl = profileImagePreview || profileImage || vendorImageUrl || vendorProfile?.vendor_image || vendorProfile?.vendor?.vendor_image
                
                console.log('[Vendor Dashboard] Profile Section - Image URL check:', {
                  profileImagePreview: profileImagePreview,
                  profileImagePreview_type: profileImagePreview ? (profileImagePreview.startsWith('blob:') ? 'blob' : 'url') : 'null',
                  profileImage: profileImage,
                  vendorImageUrl: vendorImageUrl,
                  vendorProfile_vendor_image: vendorProfile?.vendor_image,
                  finalImgUrl: imgUrl
                })
                
                if (!imgUrl) {
                  // No image - return placeholder
                  console.warn('[Vendor Dashboard] No image URL found, using placeholder')
                  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4='
                }
                
                // If it's a blob URL (file preview), return it directly without processing
                if (imgUrl.startsWith('blob:') || imgUrl.startsWith('data:')) {
                  console.log('[Vendor Dashboard] Using blob/data URL directly:', imgUrl)
                  return imgUrl
                }
                
                // For regular URLs, use getImageUrl which handles proxy in dev and full URLs in production
                // profileImage already has cache-busting (?_t=timestamp) from handleImageUpload
                const processedUrl = getImageUrl(imgUrl, false) // Don't add cache-bust if already has it
                console.log('[Vendor Dashboard] Profile Section - Processed image URL:', {
                  original: imgUrl,
                  processed: processedUrl,
                  processedUrl_type: typeof processedUrl,
                  processedUrl_null: processedUrl === null,
                  processedUrl_empty: processedUrl === ''
                })
                
                // If getImageUrl returns null, return placeholder
                if (!processedUrl) {
                  console.warn('[Vendor Dashboard] getImageUrl returned null/empty, using placeholder')
                  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4='
                }
                
                return processedUrl
              })()}
              alt="Vendor" 
              style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }}
              crossOrigin={import.meta.env.DEV ? undefined : "anonymous"}
              onError={(e) => {
                // If image fails to load, show placeholder
                console.warn('[Vendor Dashboard] Profile image load failed:', e.target.src)
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4='
              }}
              onLoad={() => {
                console.log('[Vendor Dashboard] Profile image loaded successfully')
              }}
              key={`profile-img-${profileImage || profileImagePreview || 'default'}`} // Re-render when profileImage state changes
            />
            <input 
              type="file" 
              id="vendor_image"
              name="vendor_image"
              accept="image/*" 
              onChange={handleImageSelect}
              className="react-form-input"
              style={{ flex: 1 }}
            />
          </div>
        </div>
        
        <div className="react-form-row">
          <div className="react-form-group">
            <label>Name <span style={{ color: 'red' }}>*</span></label>
            <input 
              type="text" 
              id="name"
              name="name"
              className="react-form-input" 
              value={profileData.name}
              onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div className="react-form-group">
            <label>Email <span style={{ color: 'red' }}>*</span></label>
            <input 
              type="email" 
              id="email"
              name="email"
              className="react-form-input" 
              value={profileData.email}
              onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
        </div>
        
        <div className="react-form-row">
          <div className="react-form-group">
            <label>Mobile No. <span style={{ color: 'red' }}>*</span></label>
            <div style={{ display: 'flex' }}>
              <span style={{ padding: '10px', background: '#f5f5f5', border: '1px solid #ddd', borderRight: 'none', borderRadius: '4px 0 0 4px' }}>+91</span>
              <input 
                type="tel" 
                id="phone"
                name="phone"
                className="react-form-input" 
                style={{ borderRadius: '0 4px 4px 0', flex: 1 }}
                placeholder="10-digit mobile number"
                pattern="[0-9]{10}"
                maxLength={10}
                value={profileData.phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                  setProfileData(prev => ({ ...prev, phone: value }))
                }}
                required
              />
            </div>
          </div>
          <div className="react-form-group">
            <label>Firm Name <span style={{ color: 'red' }}>*</span></label>
            <input 
              type="text" 
              id="firm_name"
              name="firm_name"
              className="react-form-input" 
              value={profileData.firm_name}
              onChange={(e) => setProfileData(prev => ({ ...prev, firm_name: e.target.value }))}
              required
            />
          </div>
        </div>
        
        <div className="react-form-row">
          <div className="react-form-group">
            <label>GST Number <span style={{ color: 'red' }}>*</span></label>
            <input 
              type="text" 
              id="gst_no"
              name="gst_no"
              className="react-form-input" 
              placeholder="15 characters"
              maxLength={15}
              value={profileData.gst_no}
              onChange={(e) => setProfileData(prev => ({ ...prev, gst_no: e.target.value }))}
              required
            />
            {profileData.gst_no && profileData.gst_no.length !== 15 && (
              <small style={{ color: '#f00', fontSize: '12px' }}>
                GST number must be exactly 15 characters (current: {profileData.gst_no.length})
              </small>
            )}
          </div>
          <div className="react-form-group">
            <label>Pin Code <span style={{ color: 'red' }}>*</span></label>
            <input 
              type="text" 
              id="pin_code"
              name="pin_code"
              className="react-form-input" 
              placeholder="6 digits"
              pattern="[0-9]{6}"
              maxLength={6}
              value={profileData.pin_code}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                setProfileData(prev => ({ ...prev, pin_code: value }))
              }}
              required
            />
            {profileData.pin_code && profileData.pin_code.length !== 6 && (
              <small style={{ color: '#f00', fontSize: '12px' }}>
                Pin code must be exactly 6 digits (current: {profileData.pin_code.length})
              </small>
            )}
          </div>
        </div>
        
        <div className="react-form-row">
          <div className="react-form-group">
            <label>
              Country <span style={{ color: 'red' }}>*</span>
              <button 
                type="button"
                onClick={async () => {
                  console.log('[Vendor Dashboard] Manual refresh triggered')
                  setLoadingCountries(true)
                  try {
                    const result = await fetchPublicCountryList()
                    console.log('[Vendor Dashboard] Manual refresh result:', result)
                    if (result.status === 1 && Array.isArray(result.data) && result.data.length > 0) {
                      const countryList = result.data.map((country, index) => {
                        const countryName = country.nicename || country.name || country.country_name || country.country || ''
                        const countryId = country.id || country.country_id || index
                        const countryCode = country.iso || country.code || country.iso3 || ''
                        return {
                          id: countryId,
                          name: countryName,
                          code: countryCode,
                          phonecode: country.phonecode || ''
                        }
                      }).filter(country => country.name && country.name.trim() !== '')
                      setCountries(countryList)
                      alert(`✅ Loaded ${countryList.length} countries!`)
                    } else {
                      alert(`❌ Failed to load countries. Status: ${result.status}, Message: ${result.msg || 'Unknown error'}`)
                    }
                  } catch (error) {
                    console.error('[Vendor Dashboard] Manual refresh error:', error)
                    alert(`❌ Error: ${error.message}`)
                  } finally {
                    setLoadingCountries(false)
                  }
                }}
                style={{
                  marginLeft: '10px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px'
                }}
                disabled={loadingCountries}
              >
                {loadingCountries ? '⏳ Loading...' : '🔄 Refresh'}
              </button>
            </label>
            <select 
              id="country"
              name="country"
              className="react-form-input"
              value={profileData.country || ''}
              style={{ 
                minHeight: '40px',
                padding: '8px',
                fontSize: '14px'
              }}
              onChange={(e) => {
                const countryName = e.target.value
                console.log('[Vendor Dashboard] Country selected:', countryName, 'Total countries:', countries.length)
                
                if (!countryName) {
                  // If empty value selected, clear country selection
                  setSelectedCountryId(null)
                  setStates([])
                  setCities([])
                  setProfileData(prev => ({ ...prev, country: '', state: '', city: '' }))
                  return
                }
                
                const country = countries.find(c => c.name === countryName)
                if (country) {
                  // Ensure country ID is a number
                  const countryId = typeof country.id === 'string' ? parseInt(country.id, 10) : country.id
                  console.log('[Vendor Dashboard] Found country:', countryId, country.name, '(original ID:', country.id, ', type:', typeof country.id, ')')
                  
                  if (isNaN(countryId) || countryId <= 0) {
                    console.error('[Vendor Dashboard] Invalid country ID:', country.id)
                    return
                  }
                  
                  setSelectedCountryId(countryId)
                  setProfileData(prev => ({ ...prev, country: countryName, state: '', city: '' }))
                  // States will load automatically via useEffect when selectedCountryId changes
                } else {
                  console.warn('[Vendor Dashboard] Country not found:', countryName)
                  console.warn('[Vendor Dashboard] Available countries:', countries.map(c => ({ id: c.id, name: c.name })))
                }
              }}
              required
              disabled={loadingCountries}
            >
              {loadingCountries ? (
                <option value="">Loading countries...</option>
              ) : countries.length > 0 ? (
                <>
                  <option value="">Select Country ({countries.length} available)</option>
                  {countries.map((country, index) => {
                    // Ensure we have a valid key and value
                    const countryId = country.id || index
                    const countryName = country.name || `Country ${index + 1}`
                    return (
                      <option key={countryId} value={countryName}>
                        {countryName}
                      </option>
                    )
                  })}
                </>
              ) : (
                <>
                  <option value="">No countries available (Check console for errors)</option>
                  <option value="India">India (Fallback)</option>
                </>
              )}
            </select>
            {countries.length === 0 && !loadingCountries && (
              <small style={{ color: 'red', display: 'block', marginTop: '5px' }}>
                ❌ Failed to load countries. Check console for errors. 
                {process.env.NODE_ENV === 'development' && ' Make sure Welcome API server is running on port 8005.'}
              </small>
            )}
            {countries.length > 0 && (
              <small style={{ color: 'green', display: 'block', marginTop: '5px' }}>
                ✅ {countries.length} countries loaded successfully
              </small>
            )}
            {loadingCountries && (
              <small style={{ color: 'blue', display: 'block', marginTop: '5px' }}>
                ⏳ Loading countries...
              </small>
            )}
            {/* Debug info in development */}
            {process.env.NODE_ENV === 'development' && (
              <small style={{ color: 'gray', display: 'block', marginTop: '5px', fontSize: '11px' }}>
                Debug: countries.length = {countries.length}, loading = {loadingCountries ? 'true' : 'false'}
              </small>
            )}
          </div>
          <div className="react-form-group">
            <label>
              State 
              {selectedCountryId ? (
                <span style={{ color: 'green' }}> (Country ID: {selectedCountryId}, States: {states.length})</span>
              ) : (
                <span style={{ color: 'red' }}> (Select country first)</span>
              )}
              {process.env.NODE_ENV === 'development' && (
                <span style={{ color: 'gray', fontSize: '11px', marginLeft: '10px' }}>
                  [Debug: selectedStateId = {selectedStateId || 'null'}]
                </span>
              )}
            </label>
            <select 
              id="state"
              name="state"
              className="react-form-input"
              value={selectedStateId !== null && selectedStateId !== undefined ? String(selectedStateId) : ''}
              onChange={(e) => {
                const stateIdValue = e.target.value
                console.log('[Vendor Dashboard] ===== State Selection Event =====')
                console.log('[Vendor Dashboard] Selected state ID from dropdown:', stateIdValue)
                console.log('[Vendor Dashboard] Available states count:', states.length)
                console.log('[Vendor Dashboard] Current selectedStateId:', selectedStateId)
                
                if (!stateIdValue || stateIdValue === '') {
                  console.log('[Vendor Dashboard] Empty state selected, clearing state and cities')
                  setSelectedStateId(null)
                  setCities([])
                  setProfileData(prev => ({ ...prev, state: '', city: '' }))
                  return
                }
                
                // Convert to number
                const stateId = typeof stateIdValue === 'string' ? parseInt(stateIdValue, 10) : stateIdValue
                
                if (isNaN(stateId) || stateId <= 0) {
                  console.error('[Vendor Dashboard] ❌ Invalid state ID:', stateIdValue)
                  return
                }
                
                // Find state by ID to get the name
                const state = states.find(s => {
                  const sId = typeof s.id === 'string' ? parseInt(s.id, 10) : s.id
                  return sId === stateId
                })
                
                if (state) {
                  const stateName = state.name || state.state_name || ''
                  console.log('[Vendor Dashboard] ✅ State found:', { id: stateId, name: stateName })
                  
                  // Set selectedStateId - this will trigger cities loading via useEffect
                  setSelectedStateId(stateId)
                  
                  // Update profileData with state name
                  setProfileData(prev => ({
                    ...prev,
                    state: stateName,
                    city: '' // Clear city when state changes
                  }))
                  
                  console.log('[Vendor Dashboard] ✅ State selection complete. selectedStateId:', stateId)
                  console.log('[Vendor Dashboard] useEffect should trigger cities loading now')
                } else {
                  console.error('[Vendor Dashboard] ❌ State not found for ID:', stateId)
                  console.error('[Vendor Dashboard] Available state IDs:', states.map(s => s.id))
                }
              }}
              disabled={!selectedCountryId || loadingStates}
              style={{ 
                minHeight: '40px',
                padding: '8px',
                fontSize: '14px'
              }}
            >
              {loadingStates ? (
                <option value="">⏳ Loading states...</option>
              ) : states.length > 0 ? (
                <>
                  <option value="">Select State ({states.length} available)</option>
                  {states.map((state, index) => {
                    // Ensure consistent type (string) for option value
                    const stateId = state.id || state.state_id || index
                    const stateName = state.name || state.state_name || `State ${index + 1}`
                    return (
                      <option 
                        key={`state-${stateId}-${index}`} 
                        value={String(stateId)}
                      >
                        {stateName}
                      </option>
                    )
                  })}
                </>
              ) : selectedCountryId ? (
                <option value="">❌ No states available (Country ID: {selectedCountryId})</option>
              ) : (
                <option value="">⚠️ Select country first</option>
              )}
            </select>
            {!selectedCountryId && (
              <small style={{ color: 'orange', display: 'block', marginTop: '5px' }}>
                Please select a country first to load states
              </small>
            )}
            {selectedCountryId && !loadingStates && states.length === 0 && (
              <small style={{ color: 'red', display: 'block', marginTop: '5px' }}>
                No states found for selected country. Please check console for details.
              </small>
            )}
            {selectedCountryId && states.length > 0 && (
              <small style={{ color: 'green', display: 'block', marginTop: '5px' }}>
                {states.length} states loaded
              </small>
            )}
            {/* Debug: Show selectedStateId status */}
            {process.env.NODE_ENV === 'development' && (
              <small style={{ color: selectedStateId ? 'green' : 'red', display: 'block', marginTop: '5px', fontSize: '11px' }}>
                Debug: selectedStateId = {selectedStateId !== null ? selectedStateId : 'null'}, profileData.state = "{profileData.state || 'empty'}"
              </small>
            )}
          </div>
        </div>
        
        <div className="react-form-row">
          <div className="react-form-group">
            <label>
              City 
              {selectedStateId ? (
                loadingCities ? (
                  <span style={{ color: 'orange' }}> ⏳ Loading cities for State ID: {selectedStateId}...</span>
                ) : cities.length > 0 ? (
                  <span style={{ color: 'green' }}> ✅ {cities.length} cities loaded (State ID: {selectedStateId})</span>
                ) : (
                  <span style={{ color: 'red' }}> ❌ No cities found (State ID: {selectedStateId})</span>
                )
              ) : (
                <span style={{ color: 'red' }}> ⚠️ Select state first</span>
              )}
            </label>
            <select 
              id="city"
              name="city"
              className="react-form-input"
              value={(() => {
                // Find city ID from profileData.city name
                if (!profileData.city) return ''
                const city = cities.find(c => c.name === profileData.city)
                return city ? city.id : ''
              })()}
              onChange={(e) => {
                const cityIdValue = e.target.value
                
                if (!cityIdValue || cityIdValue === '') {
                  setProfileData(prev => ({ ...prev, city: '' }))
                  return
                }
                
                // Find city by ID to get the name
                const city = cities.find(c => {
                  const cId = typeof c.id === 'string' ? parseInt(c.id, 10) : c.id
                  const selectedId = typeof cityIdValue === 'string' ? parseInt(cityIdValue, 10) : cityIdValue
                  return cId === selectedId
                })
                
                if (city) {
                  setProfileData(prev => ({ ...prev, city: city.name }))
                }
              }}
              disabled={!selectedStateId || loadingCities || cities.length === 0}
              style={{
                minHeight: "40px",
                padding: "8px",
                fontSize: "14px",
                opacity: !selectedStateId ? 0.6 : 1,
                cursor: !selectedStateId ? "not-allowed" : "pointer",
              }}
            >
              <option value="">
                {loadingCities
                  ? "Loading..."
                  : !selectedStateId
                  ? "⚠️ Select state first"
                  : "Select City"}
              </option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="react-form-group">
          <label>Address <span style={{ color: 'red' }}>*</span></label>
          <textarea 
            id="address"
            name="address"
            className="react-form-textarea" 
            rows="3"
            value={profileData.address}
            onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
            required
          />
        </div>
        
        <div className="react-form-group">
          <label>Terms & Conditions</label>
          <textarea 
            id="term"
            name="term"
            className="react-form-textarea" 
            rows="4"
            value={profileData.term}
            onChange={(e) => setProfileData(prev => ({ ...prev, term: e.target.value }))}
            placeholder="Enter terms and conditions (optional)"
          />
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button 
            type="button" 
            className="react-btn react-btn-outline" 
            onClick={() => {
              // Reset form to original profile data
              const currentUser = getCurrentUser()
              if (currentUser && vendorProfile) {
                setProfileData({
                  name: vendorProfile.name,
                  email: vendorProfile.email,
                  phone: vendorProfile.phone.replace(/^\+91/, '').replace(/\D/g, ''),
                  firm_name: vendorProfile.firm_name || '',
                  pin_code: vendorProfile.pin_code || '',
                  gst_no: vendorProfile.gst_no || '',
                  address: vendorProfile.address || '',
                  city: vendorProfile.city || '',
                  state: vendorProfile.state || '',
                  country: vendorProfile.country || 'India',
                  term: vendorProfile.term || ''
                })
                setSelectedProfileImage(null)
                setProfileImagePreview(profileImage || vendorProfile.vendor_image || null)
                setProfileUpdateError(null)
                setProfileUpdateSuccess(false)
              }
            }}
          >
            Reset
          </button>
          <button 
            type="submit" 
            className="react-btn react-btn-primary"
            disabled={updatingProfile}
          >
            {updatingProfile ? 'Updating...' : 'Update Profile'}
          </button>
        </div>
      </form>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewSection />
      case 'profile': return <ProfileSection />
      case 'orders': return <OrdersSection />
      case 'wallet': return <WalletSection />
      case 'received-gifts': return <ReceivedGiftsSection />
      case 'products': return <ProductsSection />
      case 'add-product': return <AddProductSection />
      case 'bank-details': return <BankDetailsSection />
      case 'withdrawals': return <WithdrawalSection />
      default: return <OverviewSection />
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
          <div className="react-user-profile-header">
            <div className="react-profile-avatar">
              <img 
                src={(() => {
                  // Use React state (profileImage) as primary source
                  // profileImage is updated immediately after upload via setProfileImage() in handleImageUpload
                  const imgUrl = profileImage || vendorImageUrl || vendorProfile?.vendor_image || vendorProfile?.vendor?.vendor_image
                  
                  console.log('[Vendor Dashboard] Header - Image URL check:', {
                    profileImage: profileImage,
                    vendorImageUrl: vendorImageUrl,
                    vendorProfile_vendor_image: vendorProfile?.vendor_image,
                    vendorProfile_vendor_vendor_image: vendorProfile?.vendor?.vendor_image,
                    finalImgUrl: imgUrl
                  })
                  
                  if (!imgUrl) {
                    // No image - return placeholder
                    console.warn('[Vendor Dashboard] Header - No image URL found, using placeholder')
                    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4='
                  }
                  
                  // Use getImageUrl which handles proxy in dev and full URLs in production
                  // profileImage already has cache-busting (?_t=timestamp) from handleImageUpload
                  const processedUrl = getImageUrl(imgUrl, false) // Don't add cache-bust if already has it
                  console.log('[Vendor Dashboard] Header - Processed image URL:', {
                    original: imgUrl,
                    processed: processedUrl,
                    processedUrl_type: typeof processedUrl,
                    processedUrl_null: processedUrl === null,
                    processedUrl_empty: processedUrl === ''
                  })
                  
                  // If getImageUrl returns null, return placeholder
                  if (!processedUrl) {
                    console.warn('[Vendor Dashboard] Header - getImageUrl returned null/empty, using placeholder')
                    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4='
                  }
                  
                  return processedUrl
                })()}
                alt="Vendor" 
                crossOrigin={import.meta.env.DEV ? undefined : "anonymous"}
                onError={(e) => {
                  // If image fails to load, show placeholder
                  console.warn('[Vendor Dashboard] Header image load failed:', e.target.src)
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4='
                }}
                onLoad={() => {
                  console.log('[Vendor Dashboard] Header image loaded successfully')
                }}
                key={`header-img-${profileImage || vendorImageUrl || 'default'}`} // Re-render when profileImage state changes
              />
            </div>
            <div className="react-profile-info">
              <h2>{(() => {
                const name = vendorProfile?.name || vendorProfile?.vendor?.name || getCurrentUser()?.name || 'Vendor'
                console.log('[Vendor Dashboard] Vendor name:', { vendorProfile_name: vendorProfile?.name, vendorProfile_vendor_name: vendorProfile?.vendor?.name, currentUser_name: getCurrentUser()?.name, final: name })
                return name
              })()}</h2>
              <p>{(() => {
                const email = vendorProfile?.email || vendorProfile?.vendor?.email || getCurrentUser()?.email || 'vendor@example.com'
                console.log('[Vendor Dashboard] Vendor email:', { vendorProfile_email: vendorProfile?.email, vendorProfile_vendor_email: vendorProfile?.vendor?.email, currentUser_email: getCurrentUser()?.email, final: email })
                return email
              })()}</p>
              <p>{(() => {
                const phone = vendorProfile?.phone || vendorProfile?.vendor?.phone || getCurrentUser()?.phone || '+91 0000000000'
                console.log('[Vendor Dashboard] Vendor phone:', { vendorProfile_phone: vendorProfile?.phone, vendorProfile_vendor_phone: vendorProfile?.vendor?.phone, currentUser_phone: getCurrentUser()?.phone, final: phone })
                return phone
              })()}</p>
              <p className="react-customer-id">{(() => {
                const userId = vendorProfile?.user_uni_id || vendorProfile?.vendor?.user_uni_id || getCurrentUser()?.user_uni_id || 'VND0001'
                console.log('[Vendor Dashboard] Vendor ID:', { vendorProfile_user_uni_id: vendorProfile?.user_uni_id, vendorProfile_vendor_user_uni_id: vendorProfile?.vendor?.user_uni_id, currentUser_user_uni_id: getCurrentUser()?.user_uni_id, final: userId })
                return userId
              })()}</p>
            </div>
          </div>

          <div className="react-tab-navigation">
            <div className="react-tab-container">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  className={`tab-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <i className={`fas ${item.icon}`}></i>
                  <span className="react-tab-label">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="react-account-content fadeInUp" key={activeTab}>
            {renderContent()}
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}

export default Vendor_Dashboard