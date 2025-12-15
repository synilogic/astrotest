// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8002/api'
const WELCOME_API = import.meta.env.VITE_WELCOME_API || 'http://localhost:8005/api'
const PRODUCT_API = import.meta.env.VITE_PRODUCT_API || 'http://localhost:8007/api'
const USERS_API = import.meta.env.VITE_USERS_API || 'http://localhost:8000/api'
const VENDOR_API = import.meta.env.VITE_VENDOR_API || 'http://localhost:8003/api'
const WALLETS_API = import.meta.env.VITE_WALLETS_API || 'http://localhost:8004/api'
const COMMUNICATION_API = import.meta.env.VITE_COMMUNICATION_API || 'http://localhost:8006/api'

/**
 * Get image URL with proxy support for development and cache-busting
 * In development, images are proxied through Vite dev server to avoid CORS issues
 * Images are stored on backend server (localhost:8003), not in React public folder
 * @param {string} imageUrl - Original image URL
 * @param {boolean} addCacheBust - Whether to add cache-busting query parameter (default: true)
 * @returns {string} - Processed image URL with cache-busting
 */
export const getImageUrl = (imageUrl, addCacheBust = true) => {
  if (!imageUrl) {
    console.warn('[getImageUrl] Empty imageUrl provided:', imageUrl)
    return null
  }
  
  // If it's a data URL or blob URL, return as is
  if (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
    return imageUrl
  }
  
  // Helper function to add cache-busting parameter
  // Use ?_t= format to force browser to fetch new image on every render
  const addCacheBusting = (url) => {
    if (!addCacheBust) return url
    // If URL already has query parameters, append cache-bust param
    if (url.includes('?')) {
      // Check if it already has a cache-bust param (_t=, t=, or v=)
      if (url.includes('?_t=') || url.includes('&_t=') || url.includes('?t=') || url.includes('&t=') || url.includes('?v=') || url.includes('&v=')) {
        // Replace existing cache-bust param with new timestamp
        return url.replace(/([?&])(_t|t|v)=\d+/g, `$1_t=${Date.now()}`)
      }
      return `${url}&_t=${Date.now()}`
    }
    // Add cache-bust param with ?_t= format
    return `${url}?_t=${Date.now()}`
  }
  
  // Handle relative paths (starting with /)
  // These are NOT in React public folder - they're on backend server
  if (imageUrl.startsWith('/')) {
    let processedUrl = imageUrl
    if (import.meta.env.DEV) {
      // In development, use Vite proxy for /uploads and /assets
      // Vite proxy will forward to http://localhost:8003
      if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('/assets/')) {
        processedUrl = imageUrl // Proxy will handle it
      }
      // For other relative paths, assume they're from backend
    } else {
      // In production, construct full URL to backend or use relative path
      const backendUrl = import.meta.env.VITE_VENDOR_API?.replace('/api', '') || 'https://www.karmleela.com'
      processedUrl = `${backendUrl}${imageUrl}`
    }
    return addCacheBusting(processedUrl)
  }
  
  // Handle full URLs
  if (imageUrl.includes('http://') || imageUrl.includes('https://')) {
    if (import.meta.env.DEV) {
      try {
        const url = new URL(imageUrl)
        let processedUrl
        // If it's from vendor API server (localhost:8003), use relative path for proxy
        if (url.hostname === 'localhost' && url.port === '8003') {
          processedUrl = url.pathname + (url.search || '')
        } else if (url.hostname.includes('karmleela.com')) {
          // If it's from karmleela.com, use karmleela-proxy
          processedUrl = `/karmleela-proxy${url.pathname}${url.search || ''}`
        } else {
          // For other URLs, return as is
          return addCacheBusting(imageUrl)
        }
        return addCacheBusting(processedUrl)
      } catch (e) {
        // If URL parsing fails, return as is with cache-busting
        return addCacheBusting(imageUrl)
      }
    }
    // In production, return full URL with cache-busting
    return addCacheBusting(imageUrl)
  }
  
  // Return as is for any other format (with cache-busting if needed)
  return addCacheBusting(imageUrl)
}

/**
 * Shared fetch configuration with keep-alive enabled
 * This improves performance by reusing TCP connections
 */
const getFetchConfig = (method = 'POST', body = null) => ({
  method,
  headers: {
    'Content-Type': 'application/json',
    'Connection': 'keep-alive',
    'Keep-Alive': 'timeout=5, max=1000'
  },
  body: body ? JSON.stringify(body) : undefined,
  keepalive: true, // Keep connection alive for background requests
  cache: 'no-cache', // Always fetch fresh data
  credentials: 'same-origin' // Include cookies for same-origin requests
})

/**
 * Fetch astrologers list from backend
 * @param {Object} filters - Filter parameters
 * @returns {Promise} API response
 */
export const fetchAstrologers = async (filters = {}) => {
  try {
    const url = `${API_BASE_URL}/getAllAstrologer`
    const requestBody = {
      offset: filters.offset || 0,
      limit: filters.limit || 10,
      search: filters.search || '',
      category: filters.category || '',
      language: filters.language || '',
      skill: filters.skill || '',
      status: filters.status !== undefined ? filters.status : 1
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error fetching astrologers:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch single astrologer details from backend
 * Endpoint: POST /api/getAstrologerDetail (Astrologers service - port 8002)
 */
export const fetchAstrologerDetail = async (astrologerIdOrSlug, userUniId = null) => {
  try {
    const url = `${API_BASE_URL}/getAstrologerDetail`
    
    // Determine if it's a slug or ID
    const isSlug = !astrologerIdOrSlug.includes('ASTRO') && !astrologerIdOrSlug.match(/^[A-Z0-9]+$/)
    
    const requestBody = {
      ...(isSlug ? { slug: astrologerIdOrSlug } : { astrologer_uni_id: astrologerIdOrSlug }),
      ...(userUniId && { user_uni_id: userUniId })
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, data: null, msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error fetching astrologer detail:', error)
    return { status: 0, data: null, msg: error.message }
  }
}

/**
 * Fetch welcome/settings data from backend
 * Endpoint: POST /api/welcome (Welcome service - port 8005)
 */
export const fetchWelcomeData = async () => {
  try {
    const url = `${WELCOME_API}/welcome`
    
    const response = await fetch(url, getFetchConfig('POST', {}))

    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, data: null, msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error fetching welcome data:', error)
    return { status: 0, data: null, msg: error.message }
  }
}

/**
 * Fetch public country list (no auth required)
 * Endpoint: POST /api/publicCountryList (Welcome service - port 8005)
 */
export const fetchPublicCountryList = async () => {
  try {
    const url = `${WELCOME_API}/publicCountryList`
    console.log('[API] Fetching countries from:', url)
    
    const response = await fetch(url, getFetchConfig('POST', {}))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] Countries API HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error fetching country list:', error)
    console.error('[API] Error type:', error.name)
    console.error('[API] Error message:', error.message)
    console.error('[API] WELCOME_API URL:', WELCOME_API)
    
    // Check if it's a connection error
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED') || error.name === 'TypeError') {
      console.error('[API] ⚠️ Backend server is not running!')
      console.error('[API] Please start the Welcome API server on port 8005')
      console.error('[API] Run: npm run welcome (from astronode/html directory)')
      return { 
        status: 0, 
        data: [], 
        msg: `Connection refused: Backend server (${WELCOME_API}) is not running. Please start the Welcome API server on port 8005.` 
      }
    }
    
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch public state list by country_id (no auth required)
 * Endpoint: POST /api/publicStateList (Welcome service - port 8005)
 */
export const fetchPublicStateList = async (countryId) => {
  try {
    const url = `${WELCOME_API}/publicStateList`
    const requestBody = {
      country_id: countryId
    }
    console.log('[API] Fetching states from:', url, 'for country_id:', countryId)
    console.log('[API] Request body:', JSON.stringify(requestBody))

    // Add timeout to prevent hanging
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      const response = await fetch(url, {
        ...getFetchConfig('POST', requestBody),
        signal: controller.signal
      })
      clearTimeout(timeoutId)

      console.log('[API] States response status:', response.status, response.statusText)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('[API] States API HTTP error:', response.status, errorText)
        return { status: 0, data: [], msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
      }

      const data = await response.json()
      console.log('[API] States response data:', data)
      return data
    } catch (fetchError) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        console.error('[API] States API request timed out after 10 seconds')
        return { status: 0, data: [], msg: 'Request timed out' }
      }
      throw fetchError
    }
  } catch (error) {
    console.error('[API] Error fetching public state list:', error)
    console.error('[API] Error type:', error.name)
    console.error('[API] Error message:', error.message)
    
    // Check if it's a connection error
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED') || error.name === 'TypeError') {
      console.error('[API] ⚠️ Backend server is not running!')
      console.error('[API] Please start the Welcome API server on port 8005')
      return { 
        status: 0, 
        data: [], 
        msg: `Connection refused: Backend server (${WELCOME_API}) is not running. Please start the Welcome API server on port 8005.` 
      }
    }
    
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch state list by country_id
 * Endpoint: POST /api/stateList (Welcome service - port 8005)
 */
export const fetchStateList = async (countryId) => {
  try {
    const user = getCurrentUser()
    if (!user || !user.user_uni_id) {
      return { status: 0, data: [], msg: 'User not logged in' }
    }

    const apiKey = user.user_api_key || user.api_key
    const userId = user.user_uni_id || user.customer_uni_id

    const url = `${WELCOME_API}/stateList`
    const requestBody = {
      api_key: apiKey,
      user_uni_id: userId,
      country_id: countryId
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    if (!response.ok) {
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error fetching state list:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch public city list by state_id (no auth required)
 * Endpoint: POST /api/publicCityList (Welcome service - port 8005)
 */
export const fetchPublicCityList = async (stateId) => {
  try {
    const url = `${WELCOME_API}/publicCityList`
    const requestBody = {
      state_id: stateId
    }
    console.log('[API] Fetching cities from:', url, 'for state_id:', stateId)
    console.log('[API] Request body:', requestBody)

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] Cities API HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error fetching public city list:', error)
    console.error('[API] Error type:', error.name)
    console.error('[API] Error message:', error.message)
    
    // Check if it's a connection error
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED') || error.name === 'TypeError') {
      console.error('[API] ⚠️ Backend server is not running!')
      console.error('[API] Please start the Welcome API server on port 8005')
      return { 
        status: 0, 
        data: [], 
        msg: `Connection refused: Backend server (${WELCOME_API}) is not running. Please start the Welcome API server on port 8005.` 
      }
    }
    
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch video sections
 * Endpoint: POST /api/videoSections (Welcome service - port 8005)
 */
export const fetchVideoSections = async (offset = 0) => {
  try {
    const url = `${WELCOME_API}/videoSections`
    const requestBody = {
      offset: offset
    }
    console.log('[API] Fetching video sections from:', url)

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] Video Sections API HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    console.log('[API] Video Sections response:', { count: data.data?.length || 0 })
    return data
  } catch (error) {
    console.error('[API] Error fetching video sections:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch languages list
 * Endpoint: POST /api/languageList (Welcome service - port 8005)
 */
export const fetchLanguages = async () => {
  try {
    const url = `${WELCOME_API}/languageList`
    console.log('[API] Fetching languages from:', url)

    const response = await fetch(url, getFetchConfig('POST', {}))
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] Languages API HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    console.log('[API] Languages response:', { count: data.data?.length || 0 })
    return data
  } catch (error) {
    console.error('[API] Error fetching languages:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch live schedules (upcoming live astrologers)
 * Endpoint: POST /api/upcomingLiveAstrologer (Communication service - port 8006)
 */
export const fetchLiveSchedules = async (offset = 0) => {
  try {
    const user = getCurrentUser()
    const url = `${COMMUNICATION_API}/upcomingLiveAstrologer`
    const requestBody = {
      offset: offset,
      user_uni_id: user?.user_uni_id || ''
    }
    console.log('[API] Fetching live schedules from:', url)

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] Live Schedules API HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    console.log('[API] Live Schedules response:', { count: data.data?.length || 0 })
    return data
  } catch (error) {
    console.error('[API] Error fetching live schedules:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch live temple darshans
 * Endpoint: POST /api/liveTempleDarshanList (Welcome service - port 8005)
 */
export const fetchLiveTempleDarshans = async (offset = 0, isLive = null, city = '') => {
  try {
    const url = `${WELCOME_API}/liveTempleDarshanList`
    const requestBody = {
      offset: offset
    }
    
    if (isLive !== null) {
      requestBody.is_live = isLive
    }
    if (city) {
      requestBody.city = city
    }
    
    console.log('[API] Fetching live temple darshans from:', url)

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] Live Temple Darshans API HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    console.log('[API] Live Temple Darshans response:', { count: data.data?.length || 0 })
    return data
  } catch (error) {
    console.error('[API] Error fetching live temple darshans:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch menus list
 * Endpoint: POST /api/menuList (Welcome service - port 8005)
 */
export const fetchMenus = async (offset = 0, menuType = '', parentId = null) => {
  try {
    const url = `${WELCOME_API}/menuList`
    const requestBody = {
      offset: offset
    }
    
    if (menuType) {
      requestBody.menu_type = menuType
    }
    if (parentId !== null) {
      requestBody.parent_id = parentId
    }
    
    console.log('[API] Fetching menus from:', url)

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] Menus API HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    console.log('[API] Menus response:', { count: data.data?.length || 0 })
    return data
  } catch (error) {
    console.error('[API] Error fetching menus:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch migrations list
 * Endpoint: POST /api/migrationList (Welcome service - port 8005)
 */
export const fetchMigrations = async (offset = 0, status = '', batch = null) => {
  try {
    const url = `${WELCOME_API}/migrationList`
    const requestBody = {
      offset: offset
    }
    
    if (status) {
      requestBody.status = status
    }
    if (batch !== null) {
      requestBody.batch = batch
    }
    
    console.log('[API] Fetching migrations from:', url)

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] Migrations API HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    console.log('[API] Migrations response:', { count: data.data?.length || 0 })
    return data
  } catch (error) {
    console.error('[API] Error fetching migrations:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch modules list
 * Endpoint: POST /api/moduleList (Welcome service - port 8005)
 */
export const fetchModules = async (offset = 0, moduleType = '', isActive = null, parentId = null) => {
  try {
    const url = `${WELCOME_API}/moduleList`
    const requestBody = {
      offset: offset
    }
    
    if (moduleType) {
      requestBody.module_type = moduleType
    }
    if (isActive !== null) {
      requestBody.is_active = isActive
    }
    if (parentId !== null) {
      requestBody.parent_id = parentId
    }
    
    console.log('[API] Fetching modules from:', url)

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] Modules API HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    console.log('[API] Modules response:', { count: data.data?.length || 0 })
    return data
  } catch (error) {
    console.error('[API] Error fetching modules:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch module accesses list
 * Endpoint: POST /api/moduleAccessList (Welcome service - port 8005)
 */
export const fetchModuleAccesses = async (offset = 0, userId = null, userType = '', accessType = '') => {
  try {
    const url = `${WELCOME_API}/moduleAccessList`
    const requestBody = {
      offset: offset
    }
    
    if (userId !== null) {
      requestBody.user_id = userId
    }
    if (userType) {
      requestBody.user_type = userType
    }
    if (accessType) {
      requestBody.access_type = accessType
    }
    
    console.log('[API] Fetching module accesses from:', url)

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] Module Accesses API HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    console.log('[API] Module Accesses response:', { count: data.data?.length || 0 })
    return data
  } catch (error) {
    console.error('[API] Error fetching module accesses:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch city list by state_id
 * Endpoint: POST /api/cityList (Welcome service - port 8005)
 */
export const fetchCityList = async (stateId) => {
  try {
    const user = getCurrentUser()
    if (!user || !user.user_uni_id) {
      return { status: 0, data: [], msg: 'User not logged in' }
    }

    const apiKey = user.user_api_key || user.api_key
    const userId = user.user_uni_id || user.customer_uni_id

    const url = `${WELCOME_API}/cityList`
    const requestBody = {
      api_key: apiKey,
      user_uni_id: userId,
      state_id: stateId
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    if (!response.ok) {
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error fetching city list:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch product orders list
 * Endpoint: POST /api/productOrderList (Welcome service - port 8005)
 */
export const fetchProductOrders = async (offset = 0) => {
  try {
    console.log('[API] ===== fetchProductOrders called =====')
    console.log('[API] Offset:', offset)
    
    const user = getCurrentUser()
    if (!user) {
      console.error('[API] ❌ User not found in getCurrentUser()')
      return { status: 0, data: [], msg: 'User not logged in' }
    }
    
    if (!user.user_uni_id && !user.customer_uni_id) {
      console.error('[API] ❌ User missing user_uni_id or customer_uni_id')
      console.error('[API] User object keys:', Object.keys(user))
      return { status: 0, data: [], msg: 'User missing required credentials' }
    }

    const apiKey = user.user_api_key || user.api_key
    const userId = user.user_uni_id || user.customer_uni_id

    if (!apiKey) {
      console.error('[API] ❌ User missing API key')
      return { status: 0, data: [], msg: 'User missing API key' }
    }

    const url = `${WELCOME_API}/productOrderList`
    const requestBody = {
      api_key: apiKey,
      user_uni_id: userId,
      offset: offset
    }

    console.log('[API] Request URL:', url)
    console.log('[API] Request body:', { ...requestBody, api_key: '***' }) // Hide API key in logs

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    console.log('[API] Response status:', response.status, response.statusText)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] ❌ HTTP error response:', errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    console.log('[API] ✅ Response received:', {
      status: data.status,
      dataLength: data.data?.length || 0,
      msg: data.msg,
      offset: data.offset
    })
    return data
  } catch (error) {
    console.error('[API] ❌ Exception in fetchProductOrders:', error)
    console.error('[API] Error stack:', error.stack)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch banners from backend
 * Endpoint: POST /api/bannerList (Welcome service - port 8005)
 */
export const fetchBanners = async () => {
  try {
    const url = `${WELCOME_API}/bannerList`
    
    const response = await fetch(url, getFetchConfig('POST', {}))

    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error fetching banners:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch banner categories from backend
 * Endpoint: POST /api/getBannerCategories (Welcome service - port 8005)
 */
export const fetchBannerCategories = async () => {
  try {
    const url = `${WELCOME_API}/getBannerCategories`
    
    const response = await fetch(url, getFetchConfig('POST', {}))

    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error fetching banner categories:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch filter options (languages, skills, categories) from backend
 * Endpoint: POST /api/getFilters (Welcome service - port 8005)
 */
export const fetchFilters = async () => {
  try {
    const url = `${WELCOME_API}/getFilters`
    
    const response = await fetch(url, getFetchConfig('POST', {}))

    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, languageList: [], skillList: [], categoryList: [], msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    console.log('[API] Filters fetched:', { 
      languages: data.languageList?.length || 0, 
      skills: data.skillList?.length || 0, 
      categories: data.categoryList?.length || 0 
    })
    return data
  } catch (error) {
    console.error('[API] Error fetching filters:', error)
    return { status: 0, languageList: [], skillList: [], categoryList: [], msg: error.message }
  }
}

/**
 * Fetch service categories from backend
 * Endpoint: POST /api/serviceCategory (Welcome service - port 8005)
 */
export const fetchServiceCategories = async (filters = {}) => {
  try {
    const url = `${WELCOME_API}/serviceCategory`
    const requestBody = {
      offset: filters.offset || 0,
      // Backend doesn't accept 'status' - it's hardcoded to 1 in the backend
      ...(filters.search ? { search: filters.search } : {})
    }

    console.log('[API] Fetching service categories with:', requestBody)
    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] Service categories HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    console.log('[API] Service categories response:', data)
    if (data.status !== 1) {
      console.warn('[API] Service categories response status 0:', data.msg || data.message)
    }
    return data
  } catch (error) {
    console.error('[API] Error fetching service categories:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch services from backend
 * Endpoint: POST /api/services (Welcome service - port 8005)
 */
export const fetchServices = async (categoryIdOrSlug = '', offset = 0, limit = 10) => {
  try {
    const url = `${WELCOME_API}/services`
    // Try to parse as number, if it fails, treat as slug
    const isNumeric = !isNaN(Number(categoryIdOrSlug)) && categoryIdOrSlug !== ''
    const requestBody = {
      offset,
      // Backend doesn't accept 'limit' - it uses API_PAGE_LIMIT_SECONDARY from env
      // Backend requires service_category_id - use 0 to get all services or pass a valid category ID
      service_category_id: isNumeric ? Number(categoryIdOrSlug) : 0,
      ...(categoryIdOrSlug && !isNumeric ? { slug: categoryIdOrSlug } : {})
      // status: 1 is not in the schema, so don't send it
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] Services HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    // Log response for debugging
    if (data.status !== 1) {
      console.warn('[API] Services response status 0:', data.msg || data.message, data.errors)
    }
    return data
  } catch (error) {
    console.error('[API] Error fetching services:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch single service details from backend
 * Endpoint: POST /api/services (Welcome service - port 8005)
 */
export const fetchServiceDetails = async (serviceIdOrSlug) => {
  try {
    const url = `${WELCOME_API}/services`
    const isNumeric = !isNaN(Number(serviceIdOrSlug)) && serviceIdOrSlug !== ''
    const requestBody = {
      offset: 0,
      limit: 1,
      ...(isNumeric ? { service_id: Number(serviceIdOrSlug) } : { slug: serviceIdOrSlug }),
      status: 1
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, data: null, msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    // Return first service if found
    if (data.status === 1 && Array.isArray(data.data) && data.data.length > 0) {
      return { status: 1, data: data.data[0], msg: data.msg }
    }
    return { status: 0, data: null, msg: 'Service not found' }
  } catch (error) {
    console.error('[API] Error fetching service details:', error)
    return { status: 0, data: null, msg: error.message }
  }
}

// Alias for backward compatibility
export const fetchServiceDetail = fetchServiceDetails

/**
 * Fetch blog categories from backend
 * Endpoint: POST /api/getBlogCategories (Welcome service - port 8005)
 */
export const fetchBlogCategories = async () => {
  try {
    const url = `${WELCOME_API}/getBlogCategories`
    
    const response = await fetch(url, getFetchConfig('POST', {}))

    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error fetching blog categories:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Like/Unlike a blog
 * Endpoint: POST /api/blogLike (Product service - port 8007)
 */
export const likeBlog = async (blogId, status) => {
  try {
    const currentUser = getCurrentUser()
    if (!currentUser || !currentUser.user_uni_id) {
      return { status: 0, msg: 'Please login to like blogs' }
    }

    const url = `${PRODUCT_API}/blogLike`
    const requestBody = {
      api_key: currentUser.api_key,
      user_uni_id: currentUser.user_uni_id,
      blog_id: String(blogId),
      status: status  // 1 = like, 0 = unlike
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error liking blog:', error)
    return { status: 0, msg: error.message }
  }
}

/**
 * Fetch blogs from backend
 * Endpoint: POST /api/getBlog (Welcome service - port 8005)
 */
export const fetchBlogs = async (offset = 0, limit = 10) => {
  try {
    const url = `${WELCOME_API}/getBlog`
    const requestBody = {
      offset: offset || 0
      // Backend doesn't accept 'limit' - it uses constants.api_page_limit from DB
      // Backend doesn't accept 'status' - it's hardcoded to 1 in the backend
      // api_key and user_uni_id are optional, so we don't need to send them
    }

    console.log('[API] Fetching blogs:', { url, requestBody })

    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] Blogs HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    // Log response for debugging
    if (data.status !== 1) {
      console.warn('[API] Blogs response status 0:', data.msg || data.message, data.errors)
    }
    return data
  } catch (error) {
    console.error('[API] Error fetching blogs:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch single blog details from backend
 * Endpoint: POST /api/getBlogDetail (Welcome service - port 8005)
 */
export const fetchBlogDetails = async (blogIdOrSlug) => {
  try {
    const url = `${WELCOME_API}/getBlogDetail`
    const isNumeric = !isNaN(Number(blogIdOrSlug)) && blogIdOrSlug !== ''
    
    // Backend expects 'id' or 'slug', not 'blog_id'
    // Backend already filters by status: 1, so we don't need to send it
    const requestBody = isNumeric 
      ? { id: Number(blogIdOrSlug) }
      : { slug: blogIdOrSlug }

    console.log('[API] Fetching blog detail:', { url, requestBody })

    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, data: null, msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error fetching blog details:', error)
    return { status: 0, data: null, msg: error.message }
  }
}

// Alias for backward compatibility
export const fetchBlogDetail = fetchBlogDetails

/**
 * Extract API key from value (handles string, object, nested object, etc.)
 * Returns null if no valid key found (not empty string)
 */
const extractApiKey = (value) => {
  if (!value) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed !== '' ? trimmed : null;
  }
  if (typeof value === 'object' && value !== null) {
    // Try to extract api_key property from object
    if (value.api_key && typeof value.api_key === 'string') {
      const trimmed = value.api_key.trim();
      return trimmed !== '' ? trimmed : null;
    }
    // If no api_key property, try JSON.stringify and parse
    try {
      const str = JSON.stringify(value);
      // If it's a JSON object like {"api_key":"..."}, parse it
      const parsed = JSON.parse(str);
      if (parsed.api_key && typeof parsed.api_key === 'string') {
        const trimmed = parsed.api_key.trim();
        return trimmed !== '' ? trimmed : null;
      }
    } catch (e) {
      // If JSON parsing fails, convert to string
      const trimmed = String(value).trim();
      return trimmed !== '' ? trimmed : null;
    }
    const trimmed = String(value).trim();
    return trimmed !== '' ? trimmed : null;
  }
  const trimmed = String(value).trim();
  return trimmed !== '' ? trimmed : null;
};

/**
 * Get API key from user object
 * CRITICAL: Must return the EXACT string stored in database
 * Backend stores JWT signature (3rd part) as api_key in database
 * Backend returns BOTH user_api_key and api_key (both same value - the signature string)
 * We check which one actually exists and has a value
 * Returns null if neither exists (not empty string)
 */
export const getUserApiKey = (user) => {
  if (!user) {
    console.error('[getUserApiKey] User object is null/undefined');
    return null;
  }
  
  // CRITICAL: Use EXACT API key from login response (NO trimming, NO conversion, use as-is)
  // Backend returns it as a string - we must use it exactly as stored in localStorage
  
  // Priority 1: Check user_api_key (primary field from backend)
  if (user.user_api_key) {
    if (typeof user.user_api_key === 'string') {
      // Use EXACT value - don't trim (backend already sends it correctly)
      const exactKey = user.user_api_key;
      if (exactKey !== '' && exactKey !== '[object Object]') {
        console.log('[getUserApiKey] ✅ Using user_api_key (exact from login response)');
        console.log('[getUserApiKey] API key details:', {
          length: exactKey.length,
          preview: `${exactKey.substring(0, 15)}...${exactKey.substring(exactKey.length - 15)}`,
          full_key: exactKey // Log full key to verify it matches database
        });
        return exactKey; // Return EXACT value, no trimming
      }
    } else if (typeof user.user_api_key === 'object' && user.user_api_key !== null) {
      // If it's an object, try to extract
      const extracted = extractApiKey(user.user_api_key);
      if (extracted) {
        console.log('[getUserApiKey] ✅ Using user_api_key (extracted from object)');
        console.log('[getUserApiKey] API key details:', {
          length: extracted.length,
          preview: `${extracted.substring(0, 15)}...${extracted.substring(extracted.length - 15)}`,
          full_key: extracted
        });
        return extracted;
      }
    }
  }
  
  // Priority 2: Check api_key (fallback)
  if (user.api_key) {
    if (typeof user.api_key === 'string') {
      // Use EXACT value - don't trim (backend already sends it correctly)
      const exactKey = user.api_key;
      if (exactKey !== '' && exactKey !== '[object Object]') {
        console.log('[getUserApiKey] ✅ Using api_key (exact from login response)');
        console.log('[getUserApiKey] API key details:', {
          length: exactKey.length,
          preview: `${exactKey.substring(0, 15)}...${exactKey.substring(exactKey.length - 15)}`,
          full_key: exactKey // Log full key to verify it matches database
        });
        return exactKey; // Return EXACT value, no trimming
      }
    } else if (typeof user.api_key === 'object' && user.api_key !== null) {
      // If it's an object, try to extract
      const extracted = extractApiKey(user.api_key);
      if (extracted) {
        console.log('[getUserApiKey] ✅ Using api_key (extracted from object)');
        console.log('[getUserApiKey] API key details:', {
          length: extracted.length,
          preview: `${extracted.substring(0, 15)}...${extracted.substring(extracted.length - 15)}`,
          full_key: extracted
        });
        return extracted;
      }
    }
  }
  
  // Neither exists or both are corrupted
  console.error('[getUserApiKey] ❌ No valid API key found in user object:', {
    userKeys: Object.keys(user),
    user_api_key: user.user_api_key,
    user_api_key_type: typeof user.user_api_key,
    api_key: user.api_key,
    api_key_type: typeof user.api_key
  });
  return null;
};

/**
 * Get current user from localStorage
 */
export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem('user')
    if (!user) {
      console.log('[getCurrentUser] No user found in localStorage')
      return null
    }
    const parsedUser = JSON.parse(user)
    
    // Fix corrupted API keys (if stored as "[object Object]" string or object)
    // Use extractApiKey directly to avoid circular dependency
    let needsUpdate = false;
    
    // Fix api_key if corrupted
    if (parsedUser.api_key && (
      (typeof parsedUser.api_key === 'string' && parsedUser.api_key === '[object Object]') ||
      (typeof parsedUser.api_key === 'object' && parsedUser.api_key !== null)
    )) {
      console.warn('[getCurrentUser] ⚠️ api_key is corrupted, attempting to fix...');
      const extracted = extractApiKey(parsedUser.api_key);
      if (extracted) {
        parsedUser.api_key = extracted;
        needsUpdate = true;
        console.log('[getCurrentUser] ✅ Fixed api_key');
      } else {
        console.error('[getCurrentUser] ❌ Could not fix api_key');
      }
    }
    
    // Fix user_api_key if corrupted
    if (parsedUser.user_api_key && (
      (typeof parsedUser.user_api_key === 'string' && parsedUser.user_api_key === '[object Object]') ||
      (typeof parsedUser.user_api_key === 'object' && parsedUser.user_api_key !== null)
    )) {
      console.warn('[getCurrentUser] ⚠️ user_api_key is corrupted, attempting to fix...');
      const extracted = extractApiKey(parsedUser.user_api_key);
      if (extracted) {
        parsedUser.user_api_key = extracted;
        needsUpdate = true;
        console.log('[getCurrentUser] ✅ Fixed user_api_key');
      } else {
        console.error('[getCurrentUser] ❌ Could not fix user_api_key');
      }
    }
    
    // Update localStorage if we fixed anything
    if (needsUpdate) {
      try {
        localStorage.setItem('user', JSON.stringify(parsedUser));
        console.log('[getCurrentUser] ✅ Updated localStorage with fixed API keys');
      } catch (e) {
        console.error('[getCurrentUser] ❌ Failed to update localStorage:', e);
      }
    }
    
    // Debug: Log what we're getting from localStorage
    console.log('[getCurrentUser] ===== Reading from localStorage =====')
    console.log('[getCurrentUser] User keys:', Object.keys(parsedUser))
    console.log('[getCurrentUser] api_key:', {
      exists: !!parsedUser.api_key,
      type: typeof parsedUser.api_key,
      isObject: typeof parsedUser.api_key === 'object',
      value: parsedUser.api_key,
      length: parsedUser.api_key ? String(parsedUser.api_key).length : 0
    })
    console.log('[getCurrentUser] user_api_key:', {
      exists: !!parsedUser.user_api_key,
      type: typeof parsedUser.user_api_key,
      isObject: typeof parsedUser.user_api_key === 'object',
      value: parsedUser.user_api_key,
      length: parsedUser.user_api_key ? String(parsedUser.user_api_key).length : 0
    })
    console.log('[getCurrentUser] user_uni_id:', parsedUser.user_uni_id)
    
    // Fix API key if it's stored as an object
    if (parsedUser.api_key && typeof parsedUser.api_key === 'object') {
      console.warn('[getCurrentUser] ⚠️ api_key is an object in localStorage, fixing:', parsedUser.api_key)
      parsedUser.api_key = parsedUser.api_key.api_key || String(parsedUser.api_key)
    }
    
    if (parsedUser.user_api_key && typeof parsedUser.user_api_key === 'object') {
      console.warn('[getCurrentUser] ⚠️ user_api_key is an object in localStorage, fixing:', parsedUser.user_api_key)
      parsedUser.user_api_key = parsedUser.user_api_key.api_key || String(parsedUser.user_api_key)
    }
    
    return parsedUser
  } catch (error) {
    console.error('[API] Error parsing user from localStorage:', error)
    return null
  }
}

/**
 * Save kundali data to backend
 * Endpoint: POST /api/saveKundliData (Welcome service - port 8005)
 */
export const saveKundaliData = async (kundaliData) => {
  try {
    const url = `${WELCOME_API}/saveKundliData`
    
    const requestBody = {
      api_key: kundaliData.api_key || '',
      user_uni_id: kundaliData.user_uni_id || '',
      kundali_type: kundaliData.kundali_type || 'kundli',
      language: kundaliData.language || 'en',
      name: kundaliData.name || kundaliData.boy_name || kundaliData.girl_name || '',
      dob: kundaliData.dob || kundaliData.boy_dob || kundaliData.girl_dob || '',
      tob: kundaliData.tob || kundaliData.boy_tob || kundaliData.girl_tob || '',
      lat: kundaliData.lat || kundaliData.boy_lat || kundaliData.girl_lat || '',
      lon: kundaliData.lon || kundaliData.boy_lon || kundaliData.girl_lon || '',
      tz: kundaliData.tz || kundaliData.boy_tz || kundaliData.girl_tz || 'Asia/Kolkata',
      place: kundaliData.place || kundaliData.boy_place || kundaliData.girl_place || '',
      kundali_method: kundaliData.kundali_method || 'd1',
      // For matching
      ...(kundaliData.kundali_type === 'kundli_matching' && {
        boy_name: kundaliData.boy_name || '',
        boy_dob: kundaliData.boy_dob || '',
        boy_tob: kundaliData.boy_tob || '',
        boy_lat: kundaliData.boy_lat || '',
        boy_lon: kundaliData.boy_lon || '',
        boy_tz: kundaliData.boy_tz || 'Asia/Kolkata',
        boy_place: kundaliData.boy_place || '',
        girl_name: kundaliData.girl_name || '',
        girl_dob: kundaliData.girl_dob || '',
        girl_tob: kundaliData.girl_tob || '',
        girl_lat: kundaliData.girl_lat || '',
        girl_lon: kundaliData.girl_lon || '',
        girl_tz: kundaliData.girl_tz || 'Asia/Kolkata',
        girl_place: kundaliData.girl_place || ''
      })
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, data: null, msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error saving kundali data:', error)
    return { status: 0, data: null, msg: error.message }
  }
}

/**
 * Fetch user kundali requests from backend
 * Endpoint: POST /api/userKundaliRequest (Welcome service - port 8005)
 */
export const fetchUserKundaliRequests = async (filters = {}) => {
  try {
    const user = getCurrentUser()
    
    // Debug: Log full user object (masked)
    console.log('[API] fetchUserKundaliRequests - User check:', {
      hasUser: !!user,
      userKeys: user ? Object.keys(user) : [],
      hasApiKey: !!(user?.api_key),
      hasUserApiKey: !!(user?.user_api_key),
      hasUserUniId: !!(user?.user_uni_id),
      hasCustomerUniId: !!(user?.customer_uni_id),
      apiKeyLength: user?.api_key?.length || 0,
      userApiKeyLength: user?.user_api_key?.length || 0,
      userIdValue: user?.user_uni_id || user?.customer_uni_id || 'MISSING'
    })
    
    // Handle multiple field name variations (api_key vs user_api_key, user_uni_id vs customer_uni_id)
    // Convert to string first before calling trim() to handle null/undefined/number
    const userApiKeyStr = user?.user_api_key ? String(user.user_api_key).trim() : '';
    const apiKeyStr = user?.api_key ? String(user.api_key).trim() : '';
    const apiKey = userApiKeyStr !== '' ? userApiKeyStr : (apiKeyStr !== '' ? apiKeyStr : '')
    const userId = user?.user_uni_id || user?.customer_uni_id || ''
    
    if (!user || !apiKey || !userId) {
      console.error('[API] fetchUserKundaliRequests: User not logged in or missing credentials', {
        hasUser: !!user,
        hasApiKey: !!apiKey,
        hasUserId: !!userId,
        userKeys: user ? Object.keys(user) : [],
        apiKeyValue: apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 'MISSING',
        userIdValue: userId || 'MISSING'
      })
      return { status: 0, data: [], msg: 'User not logged in' }
    }

    const url = `${WELCOME_API}/userKundaliRequest`
    
    const requestBody = {
      api_key: apiKey,
      user_uni_id: userId,
      for_id: filters.for_id || userId,
      kundali_method: filters.kundali_method !== undefined ? filters.kundali_method : '', // Empty string to fetch all methods
      kundali_type: filters.kundali_type || 'kundli',
      offset: filters.offset || 0
    }

    console.log('[API] Fetching user kundali requests:', { 
      url, 
      requestBody: { 
        api_key: `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`,
        user_uni_id: requestBody.user_uni_id,
        for_id: requestBody.for_id,
        apiKeyLength: apiKey.length,
        userIdLength: requestBody.user_uni_id.length,
        fullApiKey: apiKey, // Show full key for debugging (remove in production)
        fullUserId: requestBody.user_uni_id
      } 
    })
    
    // Log the actual request being sent
    console.log('[API] Actual request body being sent:', JSON.stringify(requestBody))
    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error fetching user kundali requests:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Get kundali chart image
 * Endpoint: POST /api/getKundaliChart (Welcome service - port 8005)
 */
export const getKundaliChart = async (kundaliId) => {
  try {
    const user = getCurrentUser()
    // Check for api_key in multiple possible field names
    // Convert to string first before calling trim() to handle null/undefined/number
    const userApiKeyStr = user?.user_api_key ? String(user.user_api_key).trim() : '';
    const apiKeyStr = user?.api_key ? String(user.api_key).trim() : '';
    const apiKey = userApiKeyStr !== '' ? userApiKeyStr : (apiKeyStr !== '' ? apiKeyStr : '')
    const userId = user?.user_uni_id || user?.customer_uni_id || ''
    
    if (!user || !apiKey || !userId) {
      return { status: 0, data: null, msg: 'User not logged in' }
    }

    const url = `${WELCOME_API}/getKundaliChart`
    const requestBody = {
      api_key: apiKey,
      user_uni_id: userId,
      id: parseInt(kundaliId) // Backend expects 'id' (not 'kundali_id') and it must be a number
    }

    console.log('[API] Fetching kundali chart:', { url, kundaliId, requestBody: { ...requestBody, api_key: '***' } })
    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] getKundaliChart HTTP error:', response.status, errorText)
      return { status: 0, data: null, msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    console.log('[API] getKundaliChart response:', { status: data.status, hasData: !!data.data })
    return data
  } catch (error) {
    console.error('[API] Error fetching kundali chart:', error)
    return { status: 0, data: null, msg: error.message }
  }
}

/**
 * Geocode place name to get coordinates
 * Uses OpenStreetMap Nominatim API
 */
export const geocodePlace = async (placeName) => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(placeName)}&limit=1`
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'AstrologyApp/1.0'
      }
    })

    if (!response.ok) {
      throw new Error('Geocoding failed')
    }

    const data = await response.json()
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        display_name: data[0].display_name
      }
    }
    return null
  } catch (error) {
    console.error('[API] Error geocoding place:', error)
    return null
  }
}

/**
 * Get timezone from coordinates
 * Uses TimeZoneDB API (free tier) or fallback
 */
export const getTimezoneFromCoordinates = async (lat, lon) => {
  try {
    // Using a free timezone API
    const url = `https://api.timezonedb.com/v2.1/get-time-zone?key=YOUR_API_KEY&format=json&by=position&lat=${lat}&lng=${lon}`
    // For now, return default timezone
    // In production, you should use a proper timezone API or calculate from coordinates
    return { timezone: 'Asia/Kolkata' }
  } catch (error) {
    console.error('[API] Error getting timezone:', error)
    return { timezone: 'Asia/Kolkata' }
  }
}

/**
 * Send OTP
 * Endpoint: POST /api/otpSend (Users service - port 8000)
 */
export const sendOTP = async (phone, countryCode = '+91') => {
  try {
    const url = `${USERS_API}/otpSend`
    const requestBody = {
      phone: phone,
      country_code: countryCode
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, data: null, msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error sending OTP:', error)
    return { status: 0, data: null, msg: error.message }
  }
}

/**
 * Customer login with OTP
 * Endpoint: POST /api/customerLogin (Users service - port 8000)
 */
export const customerLogin = async (loginData) => {
  try {
    const url = `${USERS_API}/customerLogin`
    
    const requestBody = {
      phone: loginData.phone || '',
      otp: loginData.otp || '',
      country_code: loginData.country_code || '+91',
      country_name: loginData.country_name || 'India',
      otpless_orderId: loginData.otpless_orderId || '',
      referral_code: loginData.referral_code || ''
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, data: null, msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error in customer login:', error)
    return { status: 0, data: null, msg: error.message }
  }
}

/**
 * Vendor registration
 * Endpoint: POST /api/vendor_registration (Vendor service - port 8003)
 */
export const vendorRegistration = async (registrationData) => {
  try {
    console.log('[API] ===== vendorRegistration called =====')
    console.log('[API] Registration data:', {
      ...registrationData,
      phone: registrationData.phone,
      phoneLength: registrationData.phone?.length
    })
    
    // Vendor service uses /vendor prefix, not /api
    const url = `${VENDOR_API.replace('/api', '')}/vendor/vendor_registration`
    const requestBody = {
      name: registrationData.name,
      email: registrationData.email,
      phone: registrationData.phone,
      firm_name: registrationData.firm_name,
      pin_code: registrationData.pin_code,
      gst_no: registrationData.gst_no || '',
      term: registrationData.term || '',
      address: registrationData.address,
      city: registrationData.city || '',
      state: registrationData.state || '',
      country: registrationData.country || '',
      latitude: registrationData.latitude || '',
      longitude: registrationData.longitude || ''
    }

    console.log('[API] Request URL:', url)
    console.log('[API] Request body:', requestBody)

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    
    console.log('[API] Response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] ❌ HTTP error response:', errorText)
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }
      return { 
        success: false, 
        message: errorData.message || errorData.error || errorData.msg || `HTTP error! status: ${response.status}`,
        error: errorData
      }
    }

    const data = await response.json()
    console.log('[API] ✅ Registration response:', {
      success: data.success,
      message: data.message,
      error: data.error,
      allKeys: Object.keys(data)
    })
    
    return data
  } catch (error) {
    console.error('[API] ❌ Exception in vendor registration:', error)
    console.error('[API] Error stack:', error.stack)
    return { success: false, message: error.message }
  }
}

/**
 * Vendor login with OTP
 * Endpoint: POST /api/vendor-login (Vendor service - port 8003)
 */
export const vendorLogin = async (loginData) => {
  try {
    console.log('[API] ===== vendorLogin called =====')
    console.log('[API] Login data:', { 
      phone: loginData.phone, 
      otp: loginData.otp || 'MISSING',
      otpLength: loginData.otp ? loginData.otp.length : 0,
      otpType: typeof loginData.otp,
      country_code: loginData.country_code 
    })
    
    // Vendor service uses /vendor prefix, not /api
    // So the endpoint is /vendor/vendor-login, not /api/vendor-login
    const url = `${VENDOR_API.replace('/api', '')}/vendor/vendor-login`
    
    const requestBody = {
      phone: loginData.phone || '',
      otp: String(loginData.otp || '').trim(), // Ensure OTP is string and trimmed
      country_code: loginData.country_code || '+91',
      country_name: loginData.country_name || 'India',
      // Only include otpless_orderId if it has a value, otherwise omit it
      ...(loginData.otpless_orderId ? { otpless_orderId: loginData.otpless_orderId } : {}),
      // Only include referral_code if it has a value, otherwise omit it
      ...(loginData.referral_code ? { referral_code: loginData.referral_code } : {})
    }

    console.log('[API] Request URL:', url)
    console.log('[API] Request body (OTP visible for debugging):', { 
      ...requestBody, 
      otp: requestBody.otp, // Show actual OTP for debugging
      otpLength: requestBody.otp.length,
      phone: requestBody.phone
    })

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    
    console.log('[API] Response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] ❌ HTTP error response:', errorText)
      console.error('[API] ❌ Error details - Phone sent:', requestBody.phone, 'OTP sent:', requestBody.otp)
      
      // Try to parse error message for better user experience
      let errorMsg = `HTTP error! status: ${response.status}`
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.msg) {
          errorMsg = errorData.msg
        } else if (errorData.message) {
          errorMsg = errorData.message
        }
      } catch {
        // If parsing fails, use the raw error text
        errorMsg = errorText || errorMsg
      }
      
      return { status: 0, data: null, msg: errorMsg }
    }

    const data = await response.json()
    console.log('[API] ✅ Response received:', {
      status: data.status,
      hasData: !!data.data,
      msg: data.msg,
      dataKeys: data.data ? Object.keys(data.data) : []
    })
    
    if (data.status === 0) {
      console.error('[API] ❌ Login failed - Phone:', requestBody.phone, 'OTP:', requestBody.otp)
    }
    
    return data
  } catch (error) {
    console.error('[API] ❌ Exception in vendor login:', error)
    console.error('[API] Error stack:', error.stack)
    return { status: 0, data: null, msg: error.message }
  }
}

/**
 * Update vendor profile
 * Endpoint: POST /vendor/vendor-update (Vendor service - port 8003)
 */
export const updateVendorProfile = async (profileData) => {
  try {
    console.log('[API] ===== updateVendorProfile called =====')
    const user = getCurrentUser()
    
    // Extract API key using helper function (returns null if not found, not empty string)
    const apiKey = getUserApiKey(user)
    
    console.log('[API] updateVendorProfile - API Key Extraction:', {
      userApiKeyRaw: user?.user_api_key,
      userApiKeyType: typeof user?.user_api_key,
      apiKeyRaw: user?.api_key,
      apiKeyType: typeof user?.api_key,
      finalApiKey: apiKey,
      finalApiKeyLength: apiKey ? apiKey.length : 0,
      finalApiKeyPreview: apiKey ? `${apiKey.substring(0, 15)}...${apiKey.substring(apiKey.length - 15)}` : 'MISSING',
      fullApiKey: apiKey // Log full key for debugging
    })
    
    // CRITICAL: Don't send request if API key is null/empty
    if (!user || !apiKey || !user.user_uni_id) {
      console.error('[API] updateVendorProfile: Missing credentials - NOT sending request', {
        hasUser: !!user,
        hasApiKey: !!apiKey,
        apiKeyValue: apiKey || 'NULL/EMPTY',
        hasUserUniId: !!user?.user_uni_id,
        userKeys: user ? Object.keys(user) : []
      })
      return { status: 0, data: null, msg: 'User not logged in or API key missing. Please login again.' }
    }

    // Validate required fields
    const requiredFields = ['name', 'email', 'phone', 'firm_name', 'pin_code', 'gst_no', 'address']
    const missingFields = requiredFields.filter(field => !profileData[field] || String(profileData[field]).trim() === '')
    
    if (missingFields.length > 0) {
      return { 
        status: 0, 
        data: null, 
        msg: `Missing required fields: ${missingFields.join(', ')}` 
      }
    }

    const url = `${VENDOR_API.replace('/api', '')}/vendor/vendor-update`
    
    // Use FormData if vendor_image is provided, otherwise use JSON
    const hasFile = profileData.vendor_image && profileData.vendor_image instanceof File
    
    let requestBody
    let fetchConfig
    
    if (hasFile) {
      // Use FormData for file upload
      const formData = new FormData()
      console.log('[API] updateVendorProfile - Appending to FormData:', {
        api_key: apiKey,
        api_key_length: apiKey.length,
        api_key_full: apiKey, // Log full key
        user_uni_id: user.user_uni_id
      })
      formData.append('api_key', apiKey)
      formData.append('user_uni_id', user.user_uni_id)
      formData.append('name', (profileData.name || '').trim())
      formData.append('email', (profileData.email || '').trim())
      formData.append('phone', (profileData.phone || '').trim())
      formData.append('firm_name', (profileData.firm_name || '').trim())
      formData.append('pin_code', (profileData.pin_code || '').trim())
      formData.append('gst_no', (profileData.gst_no || '').trim())
      formData.append('address', (profileData.address || '').trim())
      if (profileData.city) formData.append('city', profileData.city)
      if (profileData.state) formData.append('state', profileData.state)
      if (profileData.country) formData.append('country', profileData.country)
      if (profileData.latitude) formData.append('latitude', profileData.latitude)
      if (profileData.longitude) formData.append('longitude', profileData.longitude)
      if (profileData.term) formData.append('term', profileData.term)
      if (profileData.birth_date) formData.append('birth_date', profileData.birth_date)
      
      // Append the image file with fieldname "vendor_image" (backend expects this)
      formData.append('vendor_image', profileData.vendor_image)
      
      requestBody = formData
      fetchConfig = {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
        // Don't set Content-Type header - browser will set it automatically with boundary
      }
      
      console.log('[API] Updating vendor profile with file:', { 
        url, 
        hasFile: true,
        fileName: profileData.vendor_image.name,
        fileSize: profileData.vendor_image.size
      })
    } else {
      // Use JSON for regular update
      console.log('[API] updateVendorProfile - Creating JSON request body:', {
        api_key: apiKey,
        api_key_length: apiKey.length,
        api_key_full: apiKey, // Log full key
        user_uni_id: user.user_uni_id
      })
      requestBody = {
        api_key: apiKey,
        user_uni_id: user.user_uni_id,
        name: (profileData.name || '').trim(),
        email: (profileData.email || '').trim(),
        phone: (profileData.phone || '').trim(),
        firm_name: (profileData.firm_name || '').trim(),
        pin_code: (profileData.pin_code || '').trim(),
        gst_no: (profileData.gst_no || '').trim(),
        address: (profileData.address || '').trim(),
        city: profileData.city || '',
        state: profileData.state || '',
        country: profileData.country || '',
        latitude: profileData.latitude || '',
        longitude: profileData.longitude || '',
        term: profileData.term || '',
        birth_date: profileData.birth_date || '',
        vendor_image: profileData.vendor_image || '' // Can be URL or empty
      }
      
      fetchConfig = getFetchConfig('POST', requestBody)
      
      console.log('[API] Updating vendor profile without file:', { url, requestBody })
    }

    const response = await fetch(url, fetchConfig)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] ❌ HTTP error response:', errorText)
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }
      return { 
        status: 0, 
        data: null, 
        msg: errorData.msg || errorData.message || errorData.error || `HTTP error! status: ${response.status}` 
      }
    }

    const data = await response.json()
    console.log('[API] ✅ Vendor profile update response:', data)
    
    return data
  } catch (error) {
    console.error('[API] ❌ Error updating vendor profile:', error)
    return { status: 0, data: null, msg: error.message }
  }
}

/**
 * Get vendor dashboard data
 * Endpoint: GET /vendor/vendor-dashboard (Vendor service - port 8003)
 * Note: Backend route is GET but uses req.body, so we use POST method
 */
export const getVendorDashboard = async (page = 1) => {
  try {
    console.log('[API] ===== getVendorDashboard called =====')
    const user = getCurrentUser()
    
    // Debug: Log full user object (masked)
    console.log('[API] getVendorDashboard - User check:', {
      hasUser: !!user,
      userKeys: user ? Object.keys(user) : [],
      hasApiKey: !!(user?.api_key),
      hasUserApiKey: !!(user?.user_api_key),
      hasUserUniId: !!(user?.user_uni_id),
      apiKeyLength: user?.api_key?.length || 0,
      userApiKeyLength: user?.user_api_key?.length || 0,
      userIdValue: user?.user_uni_id || 'MISSING'
    })
    
    // Extract API key using helper function
    const apiKey = getUserApiKey(user)
    const userId = user?.user_uni_id || ''
    
    console.log('[API] getVendorDashboard - API Key Extraction:', {
      userApiKeyRaw: user?.user_api_key,
      userApiKeyType: typeof user?.user_api_key,
      apiKeyRaw: user?.api_key,
      apiKeyType: typeof user?.api_key,
      finalApiKey: apiKey,
      finalApiKeyLength: apiKey ? apiKey.length : 0,
      finalApiKeyPreview: apiKey ? `${apiKey.substring(0, 15)}...${apiKey.substring(apiKey.length - 15)}` : 'MISSING',
      fullApiKey: apiKey, // Log full key for debugging
      userId: userId
    })
    
    // CRITICAL: Don't send request if API key is null/empty
    if (!user || !apiKey || !userId) {
      console.error('[API] getVendorDashboard: Missing credentials - NOT sending request', {
        hasUser: !!user,
        hasApiKey: !!apiKey,
        apiKeyValue: apiKey || 'NULL/EMPTY',
        hasUserId: !!userId,
        userKeys: user ? Object.keys(user) : [],
        userIdValue: userId || 'MISSING'
      })
      return { status: 0, data: null, msg: 'User not logged in or API key missing. Please login again.' }
    }

    // Backend route is POST and uses req.body for api_key and user_uni_id, req.query for page
    // Vendor service uses /vendor prefix, not /api
    const url = `${VENDOR_API.replace('/api', '')}/vendor/vendor-dashboard?page=${page}`
    const requestBody = {
      user_uni_id: userId,
      api_key: apiKey
    }
    
    console.log('[API] Fetching vendor dashboard:', {
      url,
      requestBody: { 
        api_key: `${apiKey.substring(0, 15)}...${apiKey.substring(apiKey.length - 15)}`,
        api_key_full: apiKey, // Log full key for debugging
        user_uni_id: requestBody.user_uni_id,
        apiKeyLength: apiKey.length,
        userIdLength: requestBody.user_uni_id.length
      } 
    })
    
    // Log the actual request being sent
    console.log('[API] Actual request body being sent:', JSON.stringify(requestBody))

    // Use POST method - backend expects POST with api_key and user_uni_id in body, page in query
    const response = await fetch(url, getFetchConfig('POST', requestBody))
    
    // Log response details
    console.log('[API] vendorDashboard response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] vendorDashboard error response:', errorText)
      try {
        const errorJson = JSON.parse(errorText)
        console.error('[API] vendorDashboard error details:', {
          status: errorJson.status,
          error_code: errorJson.error_code,
          msg: errorJson.msg,
          message: errorJson.message
        })
      } catch (e) {
        console.error('[API] vendorDashboard error (not JSON):', errorText)
      }
      return { status: 0, data: null, msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    console.log('[API] ✅ vendorDashboard response:', { status: data.status, hasData: !!data.data })
    return { status: 1, data, msg: 'Vendor dashboard data fetched successfully' }
  } catch (error) {
    console.error('[API] Error fetching vendor dashboard:', error)
    return { status: 0, data: null, msg: error.message }
  }
}

/**
 * Get customer dashboard data
 * Endpoint: POST /api/customerDashboard (Users service - port 8000)
 */
export const getCustomerDashboard = async (user_uni_id) => {
  try {
    const user = getCurrentUser()
    
    // Debug: Log full user object (masked)
    console.log('[API] getCustomerDashboard - User check:', {
      hasUser: !!user,
      userKeys: user ? Object.keys(user) : [],
      hasApiKey: !!(user?.api_key),
      hasUserApiKey: !!(user?.user_api_key),
      hasUserUniId: !!(user?.user_uni_id),
      hasCustomerUniId: !!(user?.customer_uni_id),
      apiKeyLength: user?.api_key?.length || 0,
      userApiKeyLength: user?.user_api_key?.length || 0,
      userIdValue: user?.user_uni_id || user?.customer_uni_id || 'MISSING'
    })
    
    // Extract API key using helper function (returns null if not found, not empty string)
    const apiKey = getUserApiKey(user)
    const userId = user?.user_uni_id || user?.customer_uni_id || ''
    
    // CRITICAL: Don't send request if API key is null/empty
    if (!user || !apiKey || !userId) {
      console.error('[API] getCustomerDashboard: Missing credentials - NOT sending request', {
        hasUser: !!user,
        hasApiKey: !!apiKey,
        apiKeyValue: apiKey || 'NULL/EMPTY',
        hasUserId: !!userId,
        userKeys: user ? Object.keys(user) : [],
        userIdValue: userId || 'MISSING'
      })
      return { status: 0, data: null, msg: 'User not logged in or API key missing. Please login again.' }
    }

    const url = `${USERS_API}/customerDashboard`
    const requestBody = {
      api_key: apiKey,
      user_uni_id: user_uni_id || userId
    }
    
    console.log('[API] Fetching customer dashboard:', { 
      url, 
      requestBody: { 
        api_key: `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`,
        user_uni_id: requestBody.user_uni_id,
        apiKeyLength: apiKey.length,
        userIdLength: requestBody.user_uni_id.length,
        fullApiKey: apiKey, // Show full key for debugging (remove in production)
        fullUserId: requestBody.user_uni_id
      } 
    })
    
    // Log the actual request being sent
    console.log('[API] Actual request body being sent:', JSON.stringify(requestBody))

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    
    // Log response details
    console.log('[API] customerDashboard response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] customerDashboard error response:', errorText)
      try {
        const errorJson = JSON.parse(errorText)
        console.error('[API] customerDashboard error details:', {
          status: errorJson.status,
          error_code: errorJson.error_code,
          msg: errorJson.msg,
          message: errorJson.message
        })
      } catch (e) {
        console.error('[API] customerDashboard error (not JSON):', errorText)
      }
      return { status: 0, data: null, msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error fetching customer dashboard:', error)
    return { status: 0, data: null, msg: error.message }
  }
}

/**
 * Get recharge vouchers/plans
 * Endpoint: POST /api/rechargeVoucher (Wallets service - port 8004)
 * Returns: { status: 1, wallet: amount_balance, data: vouchers, msg: 'Result Found' }
 * Each voucher includes: id, wallet_cms_id, wallet_amount, gift_amount, tag, currency_code, status, 
 * gstprecent, gstamount, totalamount, currency, main_amount, created_at, updated_at
 */
export const getRechargeVouchers = async () => {
  try {
    const user = getCurrentUser()
    if (!user) {
      return { status: 0, data: [], wallet: 0, msg: 'User not logged in' }
    }

    const apiKey = getUserApiKey(user)
    const userId = user.user_uni_id || user.customer_uni_id

    if (!apiKey || !userId) {
      return { status: 0, data: [], wallet: 0, msg: 'User missing required credentials. Please login again.' }
    }

    const url = `${WALLETS_API}/rechargeVoucher`
    const requestBody = {
      api_key: apiKey,
      user_uni_id: userId
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    try {
      const response = await fetch(url, {
        ...getFetchConfig('POST', requestBody),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
        return { status: 0, data: [], wallet: 0, msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
      
      // Ensure all backend fields are properly returned
      // Backend returns: { status: 1, wallet: amount_balance, data: vouchers, msg: 'Result Found' }
      if (data.status === 1 && Array.isArray(data.data)) {
        return {
          status: 1,
          wallet: data.wallet || 0, // Current wallet balance
          data: data.data.map(voucher => ({
            id: voucher.id || voucher.wallet_cms_id || 0,
            wallet_cms_id: voucher.wallet_cms_id || voucher.id || 0,
            wallet_amount: parseFloat(voucher.wallet_amount) || 0,
            gift_amount: parseFloat(voucher.gift_amount) || 0,
            tag: voucher.tag || 'none', // 'none', 'new', 'most popular'
            currency_code: voucher.currency_code || 'INR',
            status: voucher.status || 1,
            gstprecent: parseFloat(voucher.gstprecent) || 0,
            gstamount: parseFloat(voucher.gstamount) || 0,
            totalamount: parseFloat(voucher.totalamount) || 0,
            currency: voucher.currency || '₹',
            main_amount: parseFloat(voucher.main_amount) || 0,
            created_at: voucher.created_at || '',
            updated_at: voucher.updated_at || ''
          })),
          msg: data.msg || 'Result Found'
        }
      }

      // If no vouchers found, backend returns status: 0
      if (data.status === 0) {
        return {
          status: 0,
          wallet: data.wallet || 0,
          data: [],
          msg: data.msg || 'Data Not Found !!'
        }
      }

    return data
    } catch (fetchError) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        return { status: 0, data: [], wallet: 0, msg: 'Request timeout. Please try again.' }
      }
      throw fetchError
    }
  } catch (error) {
    return { status: 0, data: [], wallet: 0, msg: error.message || 'An error occurred while fetching recharge vouchers' }
  }
}

/**
 * Proceed payment request for wallet recharge
 * Endpoint: POST /api/proceedPaymentRequest (Wallets service - port 8004)
 * Fetches payment gateway data from backend (Razorpay, PhonePe, PayU, Cashfree, CCAvenue)
 * 
 * Response formats:
 * - Razorpay: { status: 1, msg, data: { order_id, amount, razorpay_id, logo, phone, user_uni_id, email, name, customerData, ...rechargeData } }
 * - CCAvenue: { status: 1, msg, ccavenue_data: {...}, data: {...} }
 * - PhonePe: { status: 1, msg, phonepe_data: {...}, data: {...} }
 * - Cashfree: { status: 1, msg, cashfree_data: {...}, data: {...} }
 * - PayU: { status: 1, msg, payu_data: {...}, data: {...} }
 */
export const proceedPaymentRequest = async (paymentData) => {
  try {
    const user = getCurrentUser()
    if (!user) {
      return { status: 0, data: null, msg: 'User not logged in' }
    }

    const apiKey = getUserApiKey(user)
    const userId = user.user_uni_id || user.customer_uni_id

    if (!apiKey || !userId) {
      return { status: 0, data: null, msg: 'User missing required credentials. Please login again.' }
    }

    if (!paymentData.payment_method) {
      return { status: 0, data: null, msg: 'Payment method is required' }
    }

    if (!paymentData.wallet_id) {
      return { status: 0, data: null, msg: 'Wallet ID (recharge voucher ID) is required' }
    }

    const url = `${WALLETS_API}/proceedPaymentRequest`
    const requestBody = {
      api_key: apiKey,
      user_uni_id: userId,
      payment_method: paymentData.payment_method, // 'razorpay', 'Payu', 'PhonePe', 'Cashfree', 'CCAvenue'
      wallet_id: Number(paymentData.wallet_id), // Recharge voucher ID (must be number)
      amount: paymentData.amount ? Number(paymentData.amount) : null, // Optional custom amount
      is_updated: paymentData.is_updated || false
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      const response = await fetch(url, {
        ...getFetchConfig('POST', requestBody),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      
      // Try to parse error JSON to extract detailed error message
      let errorData = null
      try {
        errorData = JSON.parse(errorText)
      } catch (e) {
        // If not JSON, use text as is
      }
      
      // Return structured error with parsed data if available
      return { 
        status: 0, 
        data: null, 
        msg: errorData?.msg || `HTTP error! status: ${response.status}, message: ${errorText}`,
          error: errorData?.error || null,
          error_code: errorData?.error_code || null
        }
      }

      const responseText = await response.text()
      if (!responseText || responseText.trim() === '') {
        return { status: 0, data: null, msg: 'Empty response from server. Please try again.' }
      }

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        return { status: 0, data: null, msg: `Invalid response format: ${responseText.substring(0, 200)}` }
      }

      if (!data || typeof data !== 'object') {
        return { status: 0, data: null, msg: 'Invalid response format from server' }
      }

      // Ensure all backend fields are properly returned
      // Backend returns different structures based on payment gateway
      const responseData = {
        status: data.status || 0,
        msg: data.msg || 'Payment request processed',
        // Razorpay response structure
        data: data.data || null,
        // Gateway-specific data
        razorpay_data: data.data || null, // Razorpay data is in 'data' field
        ccavenue_data: data.ccavenue_data || null,
        phonepe_data: data.phonepe_data || null,
        cashfree_data: data.cashfree_data || null,
        payu_data: data.payu_data || null,
        // Additional fields that might be present
        order_id: data.data?.order_id || data.order_id || null,
        amount: data.data?.amount || data.amount || null,
        customerData: data.data?.customerData || data.customerData || null,
        error: data.error || null,
        error_code: data.error_code || null
      }

      return responseData
    } catch (fetchError) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        return { status: 0, data: null, msg: 'Request timeout. Please try again.' }
      }
      throw fetchError
    }
  } catch (error) {
    return { status: 0, data: null, msg: error.message || 'An error occurred while processing payment request' }
  }
}

/**
 * Update online payment status (for payment gateway callbacks)
 * Endpoint: POST /api/updateOnlinePayment (Wallets service - port 8004)
 * 
 * Required fields: payment_method, payment_id, order_id
 * Optional fields: order_status, success, is_razorpay_webhook, signature, etc.
 * 
 * Payment method specific fields:
 * - Razorpay: order_status, is_razorpay_webhook, signature
 * - CCAvenue: order_status
 * - PhonePe: success (1 or 'PAYMENT_SUCCESS' for success, 'PAYMENT_ERROR' for failed)
 * - Cashfree: order_status, success (1 or true for success)
 * - PayU: order_status ('success' for success)
 * - PayPal: order_status ('COMPLETED' for success, 'DECLINED' for declined)
 * - PayTM: order_status (always 'Success')
 * 
 * Returns: { status: 1, message: 'Successfully' } on success
 */
export const updateOnlinePayment = async (paymentResponse) => {
  try {
    const user = getCurrentUser()
    if (!user) {
      return { status: 0, msg: 'User not logged in', message: 'User not logged in' }
    }

    const apiKey = getUserApiKey(user)
    const userId = user.user_uni_id || user.customer_uni_id

    if (!apiKey || !userId) {
      return { status: 0, msg: 'User missing required credentials. Please login again.', message: 'User missing required credentials' }
    }

    // Validate required fields
    if (!paymentResponse.payment_method) {
      return { status: 0, msg: 'Payment method is required', message: 'Missing required field: payment_method' }
    }

    if (!paymentResponse.payment_id) {
      return { status: 0, msg: 'Payment ID is required', message: 'Missing required field: payment_id' }
    }

    if (!paymentResponse.order_id) {
      return { status: 0, msg: 'Order ID is required', message: 'Missing required field: order_id' }
    }

    const url = `${WALLETS_API}/updateOnlinePayment`
    
    // Build request body with all required and optional fields
    const requestBody = {
      api_key: apiKey,
      user_uni_id: userId,
      payment_method: paymentResponse.payment_method, // 'razorpay', 'ccavenue', 'phonepe', 'cashfree', 'payu', 'paypal', 'paytm'
      payment_id: paymentResponse.payment_id, // Gateway payment ID
      order_id: paymentResponse.order_id, // Gateway order ID
      // Optional fields based on payment gateway
      order_status: paymentResponse.order_status || '', // Order status from gateway
      success: paymentResponse.success || null, // Success flag (for PhonePe, Cashfree)
      is_razorpay_webhook: paymentResponse.is_razorpay_webhook || false, // Razorpay webhook flag
      signature: paymentResponse.signature || '', // Payment signature (for Razorpay)
      // Any other gateway-specific fields
      ...paymentResponse
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      const response = await fetch(url, {
        ...getFetchConfig('POST', requestBody),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
        
        // Try to parse error JSON
        let errorData = null
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          // If not JSON, use text as is
        }

        return {
          status: 0,
          msg: errorData?.msg || errorData?.message || `HTTP error! status: ${response.status}, message: ${errorText}`,
          message: errorData?.message || errorText,
          error_code: errorData?.error_code || null
        }
      }

      const responseText = await response.text()
      if (!responseText || responseText.trim() === '') {
        return { status: 0, msg: 'Empty response from server. Please try again.', message: 'Empty response' }
      }

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        return { status: 0, msg: `Invalid response format: ${responseText.substring(0, 200)}`, message: 'Invalid response format' }
      }

      // Backend returns: { status: 1, message: 'Successfully' } on success
      // or { status: 0, message: 'Internal Server Error' } on error
      return {
        status: data.status || 0,
        msg: data.message || data.msg || (data.status === 1 ? 'Payment updated successfully' : 'Payment update failed'),
        message: data.message || data.msg || '',
        error_code: data.error_code || null
      }
    } catch (fetchError) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        return { status: 0, msg: 'Request timeout. Please try again.', message: 'Request timeout' }
      }
      throw fetchError
    }
  } catch (error) {
    return { status: 0, msg: error.message || 'An error occurred while updating payment status', message: error.message || 'An error occurred' }
  }
}

/**
 * Get payment status by order_id from wallet transactions
 * This fetches wallet transactions and filters by order_id
 * Endpoint: POST /api/getWalletTransactions (Wallets service - port 8004)
 */
export const getPaymentStatusByOrderId = async (order_id) => {
  try {
    const user = getCurrentUser()
    if (!user || !user.api_key || !user.user_uni_id) {
      return { status: 0, data: null, msg: 'User not logged in' }
    }

    // Fetch wallet transactions
    const transactionsResult = await getWalletTransactions({
      offset: 0,
      limit: 100 // Get recent transactions
    })

    if (transactionsResult.status === 1 && Array.isArray(transactionsResult.data)) {
      // Find transaction with matching order_id
      const transaction = transactionsResult.data.find(tx => 
        tx.gateway_order_id === order_id || 
        tx.order_id === order_id ||
        tx.reference_id === order_id
      )

      if (transaction) {
        return {
          status: 1,
          data: {
            order_id: order_id,
            payment_status: transaction.status, // 0 = pending, 1 = success, 2 = failed, 3 = declined
            payment_method: transaction.payment_method || '',
            amount: transaction.amount || 0,
            gateway_payment_id: transaction.gateway_payment_id || '',
            created_at: transaction.created_at || '',
            updated_at: transaction.updated_at || ''
          },
          msg: 'Payment status found'
        }
      } else {
        return {
          status: 0,
          data: null,
          msg: 'Payment transaction not found for this order ID'
        }
      }
    } else {
      return {
        status: 0,
        data: null,
        msg: transactionsResult.msg || 'Failed to fetch payment status'
      }
    }
  } catch (error) {
    console.error('[API] Error getting payment status:', error)
    return { status: 0, data: null, msg: error.message }
  }
}

/**
 * Get wallet balance
 * Endpoint: POST /api/getWalletBalance (Wallets service - port 8004)
 * Returns: { status: 1, msg: 'Wallet Balance', data: amount_balance, is_anonymous_review: 0/1 }
 */
export const getWalletBalance = async (user_uni_id) => {
  try {
    const user = getCurrentUser()
    if (!user) {
      return { status: 0, data: 0, msg: 'User not logged in', is_anonymous_review: 0 }
    }

    // Use getUserApiKey helper to properly extract API key (handles corrupted keys)
    const apiKey = getUserApiKey(user)
    const userId = user_uni_id || user.user_uni_id || user.customer_uni_id || ''

    if (!apiKey || !userId) {
      return { status: 0, data: 0, msg: 'User missing required credentials. Please login again.', is_anonymous_review: 0 }
    }

    const url = `${WALLETS_API}/getWalletBalance`
    const requestBody = {
      api_key: apiKey,
      user_uni_id: userId
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    try {
      const response = await fetch(url, {
        ...getFetchConfig('POST', requestBody),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
        return { status: 0, data: 0, msg: `HTTP error! status: ${response.status}, message: ${errorText}`, is_anonymous_review: 0 }
    }

    const data = await response.json()
      
      // Ensure all backend fields are included in response
      return {
        status: data.status || 0,
        msg: data.msg || 'Wallet Balance',
        data: data.data || 0, // Balance amount
        is_anonymous_review: data.is_anonymous_review || 0 // Customer anonymous review setting
      }
    } catch (fetchError) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        return { status: 0, data: 0, msg: 'Request timeout. Please try again.', is_anonymous_review: 0 }
      }
      throw fetchError
    }
  } catch (error) {
    return { status: 0, data: 0, msg: error.message || 'An error occurred while fetching wallet balance', is_anonymous_review: 0 }
  }
}

/**
 * Update customer profile
 * Endpoint: POST /api/customerEdit (Users service - port 8000)
 */
export const updateCustomerProfile = async (profileData) => {
  try {
    const user = getCurrentUser()
    
    // CRITICAL: This endpoint is ONLY for customers, not vendors
    // Check user role before proceeding
    const userRole = user?.role_id || user?.type
    const isVendor = userRole === 5 || userRole === 'Vendor' || user?.type === 'Vendor'
    
    if (isVendor) {
      console.error('[API] updateCustomerProfile: Vendor trying to use customer endpoint', {
        user_uni_id: user?.user_uni_id,
        role_id: userRole,
        type: user?.type
      })
      return { 
        status: 0, 
        data: null, 
        msg: 'This endpoint is only for customers. Vendors should use updateVendorProfile instead.' 
      }
    }
    
    // Extract API key using helper function (returns null if not found, not empty string)
    const apiKey = getUserApiKey(user)
    
    // CRITICAL: For customers, user_uni_id and customer_uni_id are the same
    // But we must use the EXACT ID from login response (not from old localStorage)
    // Priority: user_uni_id (from login) > customer_uni_id (from login) > fallback
    const userId = user?.user_uni_id || user?.customer_uni_id || ''
    
    // CRITICAL: Validate ID format - customer IDs should start with CUS, not VEND
    if (userId && userId.startsWith('VEND')) {
      console.error('[API] updateCustomerProfile: ❌ CRITICAL - Vendor ID detected!', {
        userId: userId,
        user_uni_id: user?.user_uni_id,
        customer_uni_id: user?.customer_uni_id,
        role_id: userRole,
        type: user?.type,
        allUserKeys: user ? Object.keys(user) : []
      })
      return { 
        status: 0, 
        data: null, 
        msg: 'Invalid user ID. Vendor IDs cannot use customer endpoints. Please login as a customer.' 
      }
    }
    
    // CRITICAL: Don't send request if API key is null/empty
    if (!user || !apiKey || !userId) {
      console.error('[API] updateCustomerProfile: Missing credentials - NOT sending request', {
        hasUser: !!user,
        hasApiKey: !!apiKey,
        apiKeyValue: apiKey || 'NULL/EMPTY',
        hasUserId: !!userId,
        user_uni_id: user?.user_uni_id,
        customer_uni_id: user?.customer_uni_id,
        userKeys: user ? Object.keys(user) : []
      })
      return { status: 0, data: null, msg: 'User not logged in or API key missing. Please login again.' }
    }
    
    // Log the EXACT ID being sent for debugging
    console.log('[API] updateCustomerProfile - Sending request with:', {
      user_uni_id: userId,
      userId_type: typeof userId,
      userId_length: userId.length,
      userId_prefix: userId.substring(0, 3),
      is_customer_id: userId.startsWith('CUS'),
      is_vendor_id: userId.startsWith('VEND'),
      api_key_length: apiKey ? apiKey.length : 0
    })

    // Helper function to safely convert to string and trim (define early for use throughout)
    const safeString = (value) => {
      if (value === null || value === undefined) return ''
      return String(value).trim()
    }

    // Validate required fields
    const requiredFields = ['name', 'email', 'phone', 'birth_date', 'birth_time', 'birth_place', 'gender']
    const missingFields = requiredFields.filter(field => {
      const value = profileData[field]
      return !value || safeString(value) === ''
    })
    
    if (missingFields.length > 0) {
      return { 
        status: 0, 
        data: null, 
        msg: `Missing required fields: ${missingFields.join(', ')}` 
      }
    }

    // Ensure birth_time is in HH:mm:ss format (backend requires this exact format)
    let birthTime = profileData.birth_time
    if (birthTime) {
      // Remove any whitespace - safely convert to string first
      birthTime = safeString(birthTime)
      
      // Handle different time formats
      if (birthTime.split(':').length === 2) {
        // Convert HH:mm to HH:mm:ss
        birthTime = `${birthTime}:00`
      } else if (birthTime.split(':').length === 1) {
        // If only hour, add minutes and seconds
        birthTime = `${birthTime}:00:00`
      } else if (birthTime.split(':').length > 3) {
        // If has milliseconds or more, take only first 3 parts
        const parts = birthTime.split(':')
        birthTime = `${parts[0]}:${parts[1]}:${parts[2]}`
      }
      
      // Validate format: HH:mm:ss (24-hour format)
      const timeRegex = /^([01]?\d|2[0-3]):[0-5]?\d:[0-5]?\d$/
      if (!timeRegex.test(birthTime)) {
        console.warn('[API] Invalid birth_time format, using default:', birthTime)
        birthTime = '00:00:00'
      }
    } else {
      birthTime = '00:00:00'
    }

    const url = `${USERS_API}/customerEdit`
    
    console.log('[API] updateCustomerProfile - Request details:', {
      url: url,
      hasFile: profileData.profileImage && profileData.profileImage instanceof File,
      apiKey: apiKey ? `${apiKey.substring(0, 15)}...${apiKey.substring(apiKey.length - 15)}` : 'MISSING',
      userId: userId
    })
    
    // Use FormData if profileImage is provided, otherwise use JSON
    const hasFile = profileData.profileImage && profileData.profileImage instanceof File
    
    let requestBody
    let fetchConfig
    
    if (hasFile) {
      // Use FormData for file upload
      const formData = new FormData()
      formData.append('api_key', apiKey)
      formData.append('user_uni_id', userId)
      formData.append('name', safeString(profileData.name))
      formData.append('email', safeString(profileData.email))
      formData.append('phone', safeString(profileData.phone))
      formData.append('birth_date', profileData.birth_date || '')
      formData.append('birth_time', birthTime)
      formData.append('birth_place', safeString(profileData.birth_place))
      formData.append('gender', profileData.gender || '')
      if (profileData.latitude) formData.append('latitude', profileData.latitude)
      if (profileData.longitude) formData.append('longitude', profileData.longitude)
      if (profileData.city) formData.append('city', profileData.city)
      if (profileData.state) formData.append('state', profileData.state)
      if (profileData.country) formData.append('country', profileData.country)
      if (profileData.time_zone) formData.append('time_zone', profileData.time_zone)
      
      // Append the image file with fieldname "customer_img" (backend expects this)
      formData.append('customer_img', profileData.profileImage)
      
      requestBody = formData
      fetchConfig = {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
        // Don't set Content-Type header - browser will set it automatically with boundary
      }
      
      console.log('[API] Updating customer profile with file:', { 
        url, 
        hasFile: true,
        fileName: profileData.profileImage.name,
        fileSize: profileData.profileImage.size,
        birth_time: birthTime
      })
    } else {
      // Use JSON for regular update
      requestBody = {
        api_key: apiKey,
        user_uni_id: userId,
        name: safeString(profileData.name),
        email: safeString(profileData.email),
        phone: safeString(profileData.phone),
        birth_date: profileData.birth_date || '',
        birth_time: birthTime, // Must be in HH:mm:ss format (e.g., "14:30:00")
        birth_place: safeString(profileData.birth_place),
        gender: profileData.gender || '',
        latitude: profileData.latitude || '',
        longitude: profileData.longitude || '',
        city: profileData.city || '',
        state: profileData.state || '',
        country: profileData.country || '',
        time_zone: profileData.time_zone || '',
        customer_img: profileData.customer_img || ''
      }
      
      fetchConfig = getFetchConfig('POST', requestBody)
      
      console.log('[API] Updating customer profile:', { 
        url, 
        requestBody: { 
          ...requestBody, 
          api_key: '***',
          birth_time: birthTime // Log the formatted time
        } 
      })
    }
    
    const response = await fetch(url, fetchConfig)

    // Get response text first to handle both JSON and text errors
    const responseText = await response.text()
    
    if (!response.ok) {
      console.error('[API] customerEdit HTTP error:', {
        status: response.status,
        statusText: response.statusText,
        url: url,
        errorText: responseText,
        message: response.status === 404 
          ? `Route not found. Make sure users service is running on port 8000 and route /api/customerEdit exists.`
          : `HTTP error! status: ${response.status}`
      })
      try {
        const errorData = JSON.parse(responseText)
        console.error('[API] customerEdit error details:', errorData)
        
        // Extract error messages from validation errors
        let errorMessages = []
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessages = errorData.errors.map(err => {
            if (typeof err === 'string') return err
            if (err.message) return err.message
            if (err.msg) return err.msg
            return JSON.stringify(err)
          })
        }
        
        const finalMessage = errorMessages.length > 0 
          ? errorMessages.join('\n')
          : (errorData.msg || errorData.message || `HTTP error! status: ${response.status}`)
        
        return { 
          status: 0, 
          data: null, 
          msg: finalMessage,
          errors: errorData.errors || []
        }
      } catch (e) {
        console.error('[API] Failed to parse error response:', e, responseText)
        return { 
          status: 0, 
          data: null, 
          msg: `HTTP error! status: ${response.status}, message: ${responseText}` 
        }
      }
    }

    // Parse successful response
    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      console.error('[API] Failed to parse customerEdit response:', e, responseText)
      return { status: 0, data: null, msg: 'Invalid response from server' }
    }
    
    console.log('[API] customerEdit response (FULL):', JSON.stringify(data, null, 2))
    console.log('[API] customerEdit response - customer_img location:', {
      'result.data.customer_img': data?.data?.customer_img,
      'result.data': data?.data,
      'result': data
    })
    return data
  } catch (error) {
    console.error('[API] Error updating customer profile:', error)
    return { status: 0, data: null, msg: error.message }
  }
}

/**
 * Get wallet transactions list
 * Endpoint: POST /api/getWalletTransactions (Wallets service - port 8004)
 * Returns: { status: 1, data: formattedTransactions, msg: 'Wallet transactions list' }
 * Each transaction includes: id, sn, referenceId, paymentId, date, amount, type, narration, status, created_at, transaction_code
 */
export const getWalletTransactions = async (user_uni_id, offset = 0, limit = 50) => {
  try {
    const user = getCurrentUser()
    if (!user) {
      return { status: 0, data: [], msg: 'User not logged in' }
    }

    // Extract API key using helper function
    const apiKey = getUserApiKey(user)
    const userId = user_uni_id || user.user_uni_id || user.customer_uni_id || ''
    
    if (!apiKey || !userId) {
      return { status: 0, data: [], msg: 'Missing authentication credentials. Please login again.' }
    }

    // Validate limit (backend max is 100)
    const validLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100)
    const validOffset = Math.max(parseInt(offset) || 0, 0)

    const url = `${WALLETS_API}/getWalletTransactions`
    const requestBody = {
      api_key: apiKey,
      user_uni_id: userId,
      offset: validOffset,
      limit: validLimit
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    try {
      const response = await fetch(url, {
        ...getFetchConfig('POST', requestBody),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
      
      // Ensure all backend fields are properly returned
      // Backend returns formatted transactions with: id, sn, referenceId, paymentId, date, amount, type, narration, status, created_at, transaction_code
      if (data.status === 1 && Array.isArray(data.data)) {
        return {
          status: 1,
          data: data.data.map(transaction => ({
            id: transaction.id || 0,
            sn: transaction.sn || 0,
            referenceId: transaction.referenceId || transaction.reference_id || '-',
            paymentId: transaction.paymentId || transaction.payment_id || '-',
            date: transaction.date || transaction.created_at || '-',
            amount: transaction.amount || '₹0.00',
            type: transaction.type || transaction.main_type || 'cr', // 'cr' for credit, 'dr' for debit
            narration: transaction.narration || transaction.wallet_history_description || '-',
            status: transaction.status || 'Pending', // 'Complete' or 'Pending'
            created_at: transaction.created_at || transaction.date || '',
            transaction_code: transaction.transaction_code || '',
            // Additional fields that might be in raw data
            gateway_order_id: transaction.gateway_order_id || '',
            gateway_payment_id: transaction.gateway_payment_id || '',
            exchange_rate: transaction.exchange_rate || 1,
            main_type: transaction.main_type || transaction.type || 'cr',
            wallet_history_description: transaction.wallet_history_description || transaction.narration || ''
          })),
          msg: data.msg || 'Wallet transactions list'
        }
      }

      // If no transactions found, backend returns status: 1 with empty array
      if (data.status === 1 && (!data.data || data.data.length === 0)) {
        return {
          status: 1,
          data: [],
          msg: data.msg || 'No transactions found'
        }
      }

    return data
    } catch (fetchError) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        return { status: 0, data: [], msg: 'Request timeout. Please try again.' }
      }
      throw fetchError
    }
  } catch (error) {
    return { status: 0, data: [], msg: error.message || 'An error occurred while fetching wallet transactions' }
  }
}

/**
 * Get product orders list
 * Endpoint: POST /api/productOrderList (Welcome service - port 8005)
 */
export const getProductOrders = async (user_uni_id, offset = 0) => {
  try {
    const user = getCurrentUser()
    if (!user || !user.api_key) {
      return { status: 0, data: [], msg: 'User not logged in' }
    }

    const url = `${WELCOME_API}/productOrderList`
    const requestBody = {
      api_key: user.api_key,
      user_uni_id: user_uni_id || user.user_uni_id || '',
      offset
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error fetching product orders:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Get customer service orders list
 * Endpoint: POST /api/customerServiceOrder (Welcome service - port 8005)
 */
export const getCustomerServiceOrders = async (user_uni_id, offset = 0, limit = 15) => {
  try {
    console.log('[API] ===== getCustomerServiceOrders called =====')
    console.log('[API] user_uni_id:', user_uni_id, 'offset:', offset, 'limit:', limit)
    
    const user = getCurrentUser()
    if (!user) {
      console.error('[API] ❌ User not found in getCurrentUser()')
      return { status: 0, data: [], msg: 'User not logged in' }
    }
    
    // Handle multiple field name variations (api_key vs user_api_key, user_uni_id vs customer_uni_id)
    const apiKey = user.user_api_key || user.api_key
    const userId = user_uni_id || user.user_uni_id || user.customer_uni_id
    
    if (!apiKey) {
      console.error('[API] ❌ User missing API key')
      console.error('[API] User object keys:', Object.keys(user))
      return { status: 0, data: [], msg: 'User missing API key' }
    }
    
    if (!userId) {
      console.error('[API] ❌ User missing user_uni_id')
      return { status: 0, data: [], msg: 'User missing user_uni_id' }
    }

    const url = `${WELCOME_API}/customerServiceOrder`
    const requestBody = {
      api_key: apiKey,
      user_uni_id: userId,
      offset,
      limit
    }

    console.log('[API] Request URL:', url)
    console.log('[API] Request body:', { ...requestBody, api_key: '***' }) // Hide API key in logs

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    console.log('[API] Response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] ❌ HTTP error response:', errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    console.log('[API] ✅ Response received:', {
      status: data.status,
      dataLength: data.data?.length || 0,
      msg: data.msg,
      offset: data.offset
    })
    return data
  } catch (error) {
    console.error('[API] ❌ Exception in getCustomerServiceOrders:', error)
    console.error('[API] Error stack:', error.stack)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch user call history from backend
 * Endpoint: POST /api/userCallHistory (Welcome service - port 8005)
 */
export const fetchUserCallHistory = async (filters = {}) => {
  try {
    const user = getCurrentUser()
    
    // Handle multiple field name variations (api_key vs user_api_key, user_uni_id vs customer_uni_id)
    // Convert to string first before calling trim() to handle null/undefined/number
    const userApiKeyStr = user?.user_api_key ? String(user.user_api_key).trim() : '';
    const apiKeyStr = user?.api_key ? String(user.api_key).trim() : '';
    const apiKey = userApiKeyStr !== '' ? userApiKeyStr : (apiKeyStr !== '' ? apiKeyStr : '')
    const userId = user?.user_uni_id || user?.customer_uni_id || ''
    
    if (!user || !apiKey || !userId) {
      console.error('[API] fetchUserCallHistory: User not logged in or missing credentials', {
        hasUser: !!user,
        hasApiKey: !!apiKey,
        hasUserId: !!userId
      })
      return { status: 0, data: [], msg: 'User not logged in' }
    }

    const url = `${WELCOME_API}/userCallHistory`
    
    // Backend expects application/x-www-form-urlencoded format
    const formData = new URLSearchParams()
    formData.append('api_key', apiKey)
    formData.append('user_uni_id', filters.user_uni_id || userId)
    formData.append('call_type', filters.call_type || '')
    formData.append('status', filters.status || '')
    formData.append('offset', filters.offset || 0)

    console.log('[API] Fetching user call history:', { 
      url, 
      user_uni_id: filters.user_uni_id || userId,
      call_type: filters.call_type || '',
      status: filters.status || '',
      offset: filters.offset || 0
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Connection': 'keep-alive',
        'Keep-Alive': 'timeout=5, max=1000'
      },
      body: formData.toString(),
      keepalive: true,
      cache: 'no-cache',
      credentials: 'same-origin'
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] userCallHistory HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    console.log('[API] userCallHistory response:', { status: data.status, count: data.data?.length || 0 })
    return data
  } catch (error) {
    console.error('[API] Error fetching user call history:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch ask questions list for customer from backend
 * Endpoint: POST /api/askQuestionCustomerList (Welcome service - port 8005)
 */
export const fetchAskQuestionsList = async (offset = 0) => {
  try {
    const user = getCurrentUser()
    
    // Handle multiple field name variations (api_key vs user_api_key, user_uni_id vs customer_uni_id)
    // Convert to string first before calling trim() to handle null/undefined/number
    const userApiKeyStr = user?.user_api_key ? String(user.user_api_key).trim() : '';
    const apiKeyStr = user?.api_key ? String(user.api_key).trim() : '';
    const apiKey = userApiKeyStr !== '' ? userApiKeyStr : (apiKeyStr !== '' ? apiKeyStr : '')
    const userId = user?.user_uni_id || user?.customer_uni_id || ''
    
    if (!user || !apiKey || !userId) {
      console.error('[API] fetchAskQuestionsList: User not logged in or missing credentials', {
        hasUser: !!user,
        hasApiKey: !!apiKey,
        hasUserId: !!userId
      })
      return { status: 0, data: [], msg: 'User not logged in' }
    }

    const url = `${WELCOME_API}/askQuestionCustomerList`
    
    // Backend expects application/x-www-form-urlencoded format
    const formData = new URLSearchParams()
    formData.append('api_key', apiKey)
    formData.append('customer_uni_id', userId)
    formData.append('offset', offset || 0)

    console.log('[API] Fetching ask questions list:', { 
      url, 
      customer_uni_id: userId,
      offset: offset || 0
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Connection': 'keep-alive',
        'Keep-Alive': 'timeout=5, max=1000'
      },
      body: formData.toString(),
      keepalive: true,
      cache: 'no-cache',
      credentials: 'same-origin'
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] askQuestionsList HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    console.log('[API] Ask questions list response:', data)
    return data
  } catch (error) {
    console.error('[API] Error fetching ask questions list:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch appointment orders (slot bookings) list
 * Endpoint: POST /api/slotBookingList (Product service - port 8007)
 */
export const fetchAppointmentOrders = async (offset = 0, status = '') => {
  try {
    console.log('[API] ===== fetchAppointmentOrders called =====')
    console.log('[API] Offset:', offset, 'Status filter:', status)
    
    const user = getCurrentUser()
    if (!user) {
      console.error('[API] ❌ User not found in getCurrentUser()')
      return { status: 0, data: [], msg: 'User not logged in' }
    }
    
    if (!user.user_uni_id && !user.customer_uni_id) {
      console.error('[API] ❌ User missing user_uni_id or customer_uni_id')
      return { status: 0, data: [], msg: 'User missing required credentials' }
    }

    const apiKey = user.user_api_key || user.api_key
    const userId = user.user_uni_id || user.customer_uni_id

    if (!apiKey) {
      console.error('[API] ❌ User missing API key')
      return { status: 0, data: [], msg: 'User missing API key' }
    }

    const url = `${PRODUCT_API}/slotBookingList`
    const requestBody = {
      api_key: apiKey,
      customer_uni_id: userId,
      offset: offset,
      status: status
    }

    console.log('[API] Request URL:', url)
    console.log('[API] Request body:', { ...requestBody, api_key: '***' })

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    console.log('[API] Response status:', response.status, response.statusText)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] ❌ HTTP error response:', errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    console.log('[API] ✅ Response received:', {
      status: data.status,
      dataLength: data.data?.length || 0,
      msg: data.msg,
      offset: data.offset
    })
    return data
  } catch (error) {
    console.error('[API] ❌ Exception in fetchAppointmentOrders:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch architect rooms list
 * Endpoint: POST /api/architectRoomList (Product service - port 8007)
 */
export const fetchArchitectRooms = async (offset = 0, architectUniId = '', status = null) => {
  try {
    console.log('[API] ===== fetchArchitectRooms called =====')
    console.log('[API] Offset:', offset, 'Architect ID:', architectUniId, 'Status:', status)
    
    const user = getCurrentUser()
    if (!user) {
      console.error('[API] ❌ User not found in getCurrentUser()')
      return { status: 0, data: [], msg: 'User not logged in' }
    }
    
    if (!user.user_uni_id && !user.customer_uni_id) {
      console.error('[API] ❌ User missing user_uni_id or customer_uni_id')
      return { status: 0, data: [], msg: 'User missing required credentials' }
    }

    const apiKey = user.user_api_key || user.api_key
    const userId = user.user_uni_id || user.customer_uni_id

    if (!apiKey) {
      console.error('[API] ❌ User missing API key')
      return { status: 0, data: [], msg: 'User missing API key' }
    }

    const url = `${PRODUCT_API}/architectRoomList`
    const requestBody = {
      api_key: apiKey,
      customer_uni_id: userId,
      offset: offset,
      architect_uni_id: architectUniId
    }

    // Only add status if it's not null
    if (status !== null) {
      requestBody.status = status
    }

    console.log('[API] Request URL:', url)
    console.log('[API] Request body:', { ...requestBody, api_key: '***' })

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    console.log('[API] Response status:', response.status, response.statusText)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] ❌ HTTP error response:', errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    console.log('[API] ✅ Response received:', {
      status: data.status,
      dataLength: data.data?.length || 0,
      msg: data.msg,
      offset: data.offset
    })
    return data
  } catch (error) {
    console.error('[API] ❌ Exception in fetchArchitectRooms:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch architect service orders list
 * Endpoint: POST /api/architectServiceOrderList (Product service - port 8007)
 */
export const fetchArchitectServiceOrders = async (offset = 0, architectUniId = '', status = '', paymentStatus = '') => {
  try {
    console.log('[API] ===== fetchArchitectServiceOrders called =====')
    console.log('[API] Offset:', offset, 'Architect ID:', architectUniId, 'Status:', status, 'Payment Status:', paymentStatus)
    
    const user = getCurrentUser()
    if (!user) {
      console.error('[API] ❌ User not found in getCurrentUser()')
      return { status: 0, data: [], msg: 'User not logged in' }
    }
    
    if (!user.user_uni_id && !user.customer_uni_id) {
      console.error('[API] ❌ User missing user_uni_id or customer_uni_id')
      return { status: 0, data: [], msg: 'User missing required credentials' }
    }

    const apiKey = user.user_api_key || user.api_key
    const userId = user.user_uni_id || user.customer_uni_id

    if (!apiKey) {
      console.error('[API] ❌ User missing API key')
      return { status: 0, data: [], msg: 'User missing API key' }
    }

    const url = `${PRODUCT_API}/architectServiceOrderList`
    const requestBody = {
      api_key: apiKey,
      customer_uni_id: userId,
      offset: offset,
      architect_uni_id: architectUniId,
      status: status,
      payment_status: paymentStatus
    }

    console.log('[API] Request URL:', url)
    console.log('[API] Request body:', { ...requestBody, api_key: '***' })

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    console.log('[API] Response status:', response.status, response.statusText)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] ❌ HTTP error response:', errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    console.log('[API] ✅ Response received:', {
      status: data.status,
      dataLength: data.data?.length || 0,
      msg: data.msg,
      offset: data.offset
    })
    return data
  } catch (error) {
    console.error('[API] ❌ Exception in fetchArchitectServiceOrders:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch astrologer categories list
 * Endpoint: POST /api/categoryList (Welcome service - port 8005)
 */
export const fetchAstrologerCategories = async (search = '', isLive = null) => {
  try {
    console.log('[API] ===== fetchAstrologerCategories called =====')
    console.log('[API] Search:', search, 'IsLive:', isLive)

    const url = `${WELCOME_API}/categoryList`
    const requestBody = {}

    if (search && search.trim() !== '') {
      requestBody.search = search.trim()
    }

    if (isLive !== null) {
      requestBody.is_live = isLive
    }

    console.log('[API] Request URL:', url)
    console.log('[API] Request body:', requestBody)

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    console.log('[API] Response status:', response.status, response.statusText)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] ❌ HTTP error response:', errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    console.log('[API] ✅ Response received:', {
      status: data.status,
      dataLength: data.data?.length || 0,
      msg: data.msg
    })
    return data
  } catch (error) {
    console.error('[API] ❌ Exception in fetchAstrologerCategories:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch featured astrologer categories
 * Endpoint: POST /api/featuredCategoryList (Astrologers service - port 8002)
 */
export const fetchFeaturedCategories = async (search = '') => {
  try {
    console.log('[API] ===== fetchFeaturedCategories called =====')
    console.log('[API] Search:', search)

    const url = `${API_BASE_URL}/featuredCategoryList`
    const requestBody = {}

    if (search && search.trim() !== '') {
      requestBody.search = search.trim()
    }

    console.log('[API] Request URL:', url)
    console.log('[API] Request body:', requestBody)

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    console.log('[API] Response status:', response.status, response.statusText)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] ❌ HTTP error response:', errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    console.log('[API] ✅ Response received:', {
      status: data.status,
      dataLength: data.data?.length || 0,
      msg: data.msg
    })
    return data
  } catch (error) {
    console.error('[API] ❌ Exception in fetchFeaturedCategories:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch astrologer discount list (for astrologers to manage their discounts)
 * Endpoint: POST /api/astrologerDiscountList (Astrologers service - port 8002)
 */
export const fetchAstrologerDiscountList = async (astrologer_uni_id) => {
  try {
    console.log('[API] ===== fetchAstrologerDiscountList called =====')
    
    const user = getCurrentUser()
    if (!user || !user.api_key) {
      return { status: 0, data: [], msg: 'User not logged in' }
    }

    const url = `${API_BASE_URL}/astrologerDiscountList`
    const requestBody = {
      api_key: user.api_key,
      astrologer_uni_id: astrologer_uni_id || user.user_uni_id
    }

    console.log('[API] Request URL:', url)
    console.log('[API] Request body:', { ...requestBody, api_key: '***' })

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] ❌ HTTP error response:', errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    console.log('[API] ✅ Discount list response:', data)
    return data
  } catch (error) {
    console.error('[API] ❌ Exception in fetchAstrologerDiscountList:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch assigned astrologer discounts (active discounts for an astrologer)
 * Endpoint: POST /api/assignAstrologerDiscountList (Astrologers service - port 8002)
 */
export const fetchAssignedAstrologerDiscounts = async (astrologer_uni_id, offset = 0) => {
  try {
    console.log('[API] ===== fetchAssignedAstrologerDiscounts called =====')
    
    const user = getCurrentUser()
    if (!user || !user.api_key) {
      return { status: 0, data: [], msg: 'User not logged in' }
    }

    const url = `${API_BASE_URL}/assignAstrologerDiscountList`
    const requestBody = {
      api_key: user.api_key,
      astrologer_uni_id: astrologer_uni_id || user.user_uni_id,
      offset: offset
    }

    console.log('[API] Request URL:', url)
    console.log('[API] Request body:', { ...requestBody, api_key: '***' })

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] ❌ HTTP error response:', errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    console.log('[API] ✅ Assigned discounts response:', data)
    return data
  } catch (error) {
    console.error('[API] ❌ Exception in fetchAssignedAstrologerDiscounts:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Check call details before initiating a call
 * Endpoint: POST /api/checkCallDetail (Communication service)
 */
export const checkCallDetail = async (astrologer_uni_id, call_type, user_uni_id = null) => {
  try {
    const user = getCurrentUser()
    if (!user || !user.api_key) {
      return { status: 0, data: null, msg: 'User not logged in' }
    }

    const url = `${COMMUNICATION_API}/checkCallDetail`
    const requestBody = {
      api_key: user.api_key,
      user_uni_id: user_uni_id || user.user_uni_id || '',
      astrologer_uni_id: astrologer_uni_id,
      call_type: call_type // 'call', 'chat', 'video'
    }

    console.log('[API] Checking call detail:', { url, astrologer_uni_id, call_type })
    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] checkCallDetail HTTP error:', response.status, errorText)
      return { status: 0, data: null, msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    console.log('[API] checkCallDetail response:', data)
    return data
  } catch (error) {
    console.error('[API] Error checking call detail:', error)
    // Check if it's a connection error (network error, service not running, etc.)
    const errorMessage = error.message || String(error) || ''
    const isConnectionError = errorMessage.includes('Failed to fetch') || 
                             errorMessage.includes('ERR_CONNECTION_REFUSED') ||
                             errorMessage.includes('NetworkError') ||
                             errorMessage.includes('Network request failed') ||
                             error.name === 'TypeError' && errorMessage.includes('fetch')
    
    if (isConnectionError) {
      return { 
        status: 0, 
        data: null, 
        msg: 'Communication service is not available. Please ensure the communication service is running on port 8006.',
        error_code: 'SERVICE_UNAVAILABLE'
      }
    }
    return { status: 0, data: null, msg: error.message || 'An error occurred while checking call details' }
  }
}

/**
 * Save intake form data
 * Endpoint: POST /api/saveIntake (Communication service - port 8006)
 */
export const saveIntake = async (intakeData) => {
  try {
    const user = getCurrentUser()
    if (!user || !user.api_key || !user.user_uni_id) {
      return { status: 0, msg: 'User not logged in' }
    }

    const url = `${COMMUNICATION_API}/saveIntake`
    const requestBody = {
      api_key: user.api_key,
      user_uni_id: user.user_uni_id,
      ...intakeData // Include all intake form data (uniqeid, intake_type, name, dob, tob, etc.)
    }

    console.log('[API] Saving intake data:', { url, intakeData })
    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] Save Intake HTTP error:', response.status, errorText)
      return { status: 0, msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    console.log('[API] Save Intake response:', data)
    return data
  } catch (error) {
    console.error('[API] Error saving intake data:', error)
    const errorMessage = error.message || String(error) || ''
    const isConnectionError = errorMessage.includes('Failed to fetch') || 
                             errorMessage.includes('ERR_CONNECTION_REFUSED') ||
                             errorMessage.includes('NetworkError') ||
                             errorMessage.includes('Network request failed') ||
                             error.name === 'TypeError' && errorMessage.includes('fetch')
    
    if (isConnectionError) {
      return { 
        status: 0, 
        data: null, 
        msg: 'Communication service is not available. Please ensure the communication service is running on port 8006.',
        error_code: 'SERVICE_UNAVAILABLE'
      }
    }
    return { status: 0, msg: error.message || 'An error occurred while saving intake data' }
  }
}

/**
 * Fetch user intakes list
 * Endpoint: POST /api/getIntakes (Communication service - port 8006)
 */
export const fetchIntakes = async (offset = 0, limit = 20) => {
  try {
    const user = getCurrentUser()
    if (!user || !user.api_key || !user.user_uni_id) {
      return { status: 0, data: [], msg: 'User not logged in' }
    }

    const url = `${COMMUNICATION_API}/getIntakes`
    const requestBody = {
      api_key: user.api_key,
      user_uni_id: user.user_uni_id,
      offset,
      limit
    }

    console.log('[API] Fetching intakes:', { url, offset, limit })
    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] Fetch Intakes HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    console.log('[API] Fetch Intakes response:', { count: data.data?.length || 0, total: data.total })
    return data
  } catch (error) {
    console.error('[API] Error fetching intakes:', error)
    const errorMessage = error.message || String(error) || ''
    const isConnectionError = errorMessage.includes('Failed to fetch') || 
                             errorMessage.includes('ERR_CONNECTION_REFUSED') ||
                             errorMessage.includes('NetworkError') ||
                             errorMessage.includes('Network request failed') ||
                             error.name === 'TypeError' && errorMessage.includes('fetch')
    
    if (isConnectionError) {
      return { 
        status: 0, 
        data: [], 
        msg: 'Communication service is not available.',
        error_code: 'SERVICE_UNAVAILABLE'
      }
    }
    return { status: 0, data: [], msg: error.message || 'An error occurred while fetching intakes' }
  }
}

/**
 * Fetch user chat histories (chat_channel_histories table)
 * Endpoint: POST /api/getUserChatHistories (Communication service - port 8006)
 */
export const fetchUserChatHistories = async (offset = 0, limit = 20, channelName = '') => {
  try {
    const user = getCurrentUser()
    if (!user || !user.api_key || !user.user_uni_id) {
      return { status: 0, data: [], msg: 'User not logged in' }
    }

    const url = `${COMMUNICATION_API}/getUserChatHistories`
    const requestBody = {
      api_key: user.api_key,
      user_uni_id: user.user_uni_id,
      offset,
      limit,
      channel_name: channelName
    }

    console.log('[API] Fetching user chat histories:', { url, offset, limit, channelName })
    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] Fetch Chat Histories HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    console.log('[API] Fetch Chat Histories response:', { count: data.data?.length || 0, total: data.total })
    return data
  } catch (error) {
    console.error('[API] Error fetching chat histories:', error)
    const errorMessage = error.message || String(error) || ''
    const isConnectionError = errorMessage.includes('Failed to fetch') || 
                             errorMessage.includes('ERR_CONNECTION_REFUSED') ||
                             errorMessage.includes('NetworkError') ||
                             errorMessage.includes('Network request failed') ||
                             error.name === 'TypeError' && errorMessage.includes('fetch')
    
    if (isConnectionError) {
      return { 
        status: 0, 
        data: [], 
        msg: 'Communication service is not available.',
        error_code: 'SERVICE_UNAVAILABLE'
      }
    }
    return { status: 0, data: [], msg: error.message || 'An error occurred while fetching chat histories' }
  }
}

/**
 * Start a voice call
 * Endpoint: POST /api/startVoiceCall (Communication service)
 */
export const startVoiceCall = async (astrologer_uni_id) => {
  try {
    const user = getCurrentUser()
    if (!user || !user.api_key) {
      return { status: 0, data: null, msg: 'User not logged in' }
    }

    const url = `${COMMUNICATION_API}/startVoiceCall`
    const requestBody = {
      api_key: user.api_key,
      user_uni_id: user.user_uni_id || '',
      astrologer_uni_id: astrologer_uni_id
      // Note: Backend Joi schema only accepts api_key, user_uni_id, and astrologer_uni_id
      // Intake data should be saved separately using saveIntake API
    }

    console.log('[API] Starting voice call:', { url, astrologer_uni_id })
    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] startVoiceCall HTTP error:', response.status, errorText)
      return { status: 0, data: null, msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    console.log('[API] startVoiceCall response:', data)
    return data
  } catch (error) {
    console.error('[API] Error starting voice call:', error)
    // Check if it's a connection error (network error, service not running, etc.)
    const errorMessage = error.message || String(error) || ''
    const isConnectionError = errorMessage.includes('Failed to fetch') || 
                             errorMessage.includes('ERR_CONNECTION_REFUSED') ||
                             errorMessage.includes('NetworkError') ||
                             errorMessage.includes('Network request failed') ||
                             error.name === 'TypeError' && errorMessage.includes('fetch')
    
    if (isConnectionError) {
      return { 
        status: 0, 
        data: null, 
        msg: 'Communication service is not available. Please ensure the communication service is running on port 8006.',
        error_code: 'SERVICE_UNAVAILABLE'
      }
    }
    return { status: 0, data: null, msg: error.message || 'An error occurred while starting the call' }
  }
}

/**
 * Start a video call
 * Endpoint: POST /api/startVideoCall (Communication service - port 8006)
 */
export const startVideoCall = async (astrologer_uni_id) => {
  try {
    const user = getCurrentUser()
    if (!user || !user.api_key) {
      return { status: 0, data: null, msg: 'User not logged in' }
    }

    const url = `${COMMUNICATION_API}/startVideoCall`
    const requestBody = {
      api_key: user.api_key,
      user_uni_id: user.user_uni_id || '',
      astrologer_uni_id: astrologer_uni_id
      // Note: Backend Joi schema only accepts api_key, user_uni_id, and astrologer_uni_id
      // Intake data should be saved separately using saveIntake API
    }

    console.log('[API] Starting video call:', { url, astrologer_uni_id })
    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] Start Video Call HTTP error:', response.status, errorText)
      return { status: 0, data: null, msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    console.log('[API] Start Video Call response:', data)
    return data
  } catch (error) {
    console.error('[API] Error starting video call:', error)
    const errorMessage = error.message || String(error) || ''
    const isConnectionError = errorMessage.includes('Failed to fetch') || 
                             errorMessage.includes('ERR_CONNECTION_REFUSED') ||
                             errorMessage.includes('NetworkError') ||
                             errorMessage.includes('Network request failed') ||
                             error.name === 'TypeError' && errorMessage.includes('fetch')
    
    if (isConnectionError) {
      return { 
        status: 0, 
        data: null, 
        msg: 'Communication service is not available. Please ensure the communication service is running on port 8006.',
        error_code: 'SERVICE_UNAVAILABLE'
      }
    }
    return { status: 0, data: null, msg: error.message || 'An error occurred while starting the video call' }
  }
}

/**
 * Start a chat session
 * Endpoint: POST /api/startChat (Communication service - port 8006)
 */
export const startChat = async (astrologer_uni_id, uniqeid = null) => {
  try {
    const user = getCurrentUser()
    if (!user || !user.api_key || !user.user_uni_id) {
      return { status: 0, msg: 'User not logged in' }
    }

    const url = `${COMMUNICATION_API}/startChat`
    const requestBody = {
      api_key: user.api_key,
      user_uni_id: user.user_uni_id,
      astrologer_uni_id,
      uniqeid: uniqeid || ''
    }

    console.log('[API] Starting chat:', { url, astrologer_uni_id })
    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] Start Chat HTTP error:', response.status, errorText)
      return { status: 0, msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    console.log('[API] Start Chat response:', data)
    return data
  } catch (error) {
    console.error('[API] Error starting chat:', error)
    const errorMessage = error.message || String(error) || ''
    const isConnectionError = errorMessage.includes('Failed to fetch') || 
                             errorMessage.includes('ERR_CONNECTION_REFUSED') ||
                             errorMessage.includes('NetworkError') ||
                             errorMessage.includes('Network request failed') ||
                             error.name === 'TypeError' && errorMessage.includes('fetch')
    
    if (isConnectionError) {
      return { 
        status: 0, 
        msg: 'Communication service is not available. Please ensure the communication service is running on port 8006.',
        error_code: 'SERVICE_UNAVAILABLE'
      }
    }
    return { status: 0, msg: error.message || 'An error occurred while starting chat' }
  }
}

/**
 * Get chat channels (conversations list)
 * Endpoint: POST /api/getChatChannels (Communication service - port 8006)
 */
export const getChatChannels = async (page = 1, is_assistant_chat = 0) => {
  try {
    const user = getCurrentUser()
    if (!user || !user.api_key || !user.user_uni_id) {
      return { status: 0, data: [], msg: 'User not logged in' }
    }

    const url = `${COMMUNICATION_API}/getChatChannels`
    const requestBody = {
      api_key: user.api_key,
      user_uni_id: user.user_uni_id,
      page,
      is_assistant_chat
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] Get Chat Channels HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error fetching chat channels:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Get admin chat channels
 * Endpoint: POST /api/getAdminChatChannels (Communication service - port 8006)
 */
export const getAdminChatChannels = async (offset = 0) => {
  try {
    const user = getCurrentUser()
    
    // Handle multiple field name variations
    const userApiKeyStr = user?.user_api_key ? String(user.user_api_key).trim() : '';
    const apiKeyStr = user?.api_key ? String(user.api_key).trim() : '';
    const apiKey = userApiKeyStr !== '' ? userApiKeyStr : (apiKeyStr !== '' ? apiKeyStr : '')
    const userId = user?.user_uni_id || user?.customer_uni_id || ''
    
    if (!user || !apiKey || !userId) {
      console.error('[API] getAdminChatChannels: User not logged in or missing credentials', {
        hasUser: !!user,
        hasApiKey: !!apiKey,
        hasUserId: !!userId
      })
      return { status: 0, data: [], msg: 'User not logged in' }
    }

    const url = `${COMMUNICATION_API}/getAdminChatChannels`
    
    // Backend expects application/x-www-form-urlencoded format
    const formData = new URLSearchParams()
    formData.append('api_key', apiKey)
    formData.append('user_uni_id', userId)
    formData.append('offset', offset || 0)

    console.log('[API] Fetching admin chat channels:', { 
      url, 
      user_uni_id: userId,
      offset: offset || 0
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Connection': 'keep-alive',
        'Keep-Alive': 'timeout=5, max=1000'
      },
      body: formData.toString(),
      keepalive: true,
      cache: 'no-cache',
      credentials: 'same-origin'
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] getAdminChatChannels HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    console.log('[API] Admin chat channels response:', { status: data.status, count: data.data?.length || 0 })
    return data
  } catch (error) {
    console.error('[API] Error fetching admin chat channels:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Get admin chat channel history (messages)
 * Endpoint: POST /api/getAdminChatChannelHistory (Communication service - port 8006)
 */
export const getAdminChatChannelHistory = async (channelName = '', offset = 0) => {
  try {
    const user = getCurrentUser()
    
    // Handle multiple field name variations
    const userApiKeyStr = user?.user_api_key ? String(user.user_api_key).trim() : '';
    const apiKeyStr = user?.api_key ? String(user.api_key).trim() : '';
    const apiKey = userApiKeyStr !== '' ? userApiKeyStr : (apiKeyStr !== '' ? apiKeyStr : '')
    const userId = user?.user_uni_id || user?.customer_uni_id || ''
    
    if (!user || !apiKey || !userId) {
      console.error('[API] getAdminChatChannelHistory: User not logged in or missing credentials', {
        hasUser: !!user,
        hasApiKey: !!apiKey,
        hasUserId: !!userId
      })
      return { status: 0, data: [], msg: 'User not logged in' }
    }

    const url = `${COMMUNICATION_API}/getAdminChatChannelHistory`
    
    // Backend expects application/x-www-form-urlencoded format
    const formData = new URLSearchParams()
    formData.append('api_key', apiKey)
    formData.append('user_uni_id', userId)
    formData.append('channel_name', channelName || '')
    formData.append('offset', offset || 0)

    console.log('[API] Fetching admin chat channel history:', { 
      url, 
      user_uni_id: userId,
      channel_name: channelName || 'all',
      offset: offset || 0
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Connection': 'keep-alive',
        'Keep-Alive': 'timeout=5, max=1000'
      },
      body: formData.toString(),
      keepalive: true,
      cache: 'no-cache',
      credentials: 'same-origin'
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] getAdminChatChannelHistory HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    console.log('[API] Admin chat channel history response:', { status: data.status, count: data.data?.length || 0 })
    return data
  } catch (error) {
    console.error('[API] Error fetching admin chat channel history:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Get appointment durations list
 * Endpoint: POST /api/appointmentDurationList (Product service - port 8007)
 */
export const getAppointmentDurations = async (offset = 0) => {
  try {
    const user = getCurrentUser()
    
    // Handle multiple field name variations
    const userApiKeyStr = user?.user_api_key ? String(user.user_api_key).trim() : '';
    const apiKeyStr = user?.api_key ? String(user.api_key).trim() : '';
    const apiKey = userApiKeyStr !== '' ? userApiKeyStr : (apiKeyStr !== '' ? apiKeyStr : '')
    const userId = user?.user_uni_id || user?.customer_uni_id || ''
    
    if (!user || !apiKey || !userId) {
      console.error('[API] getAppointmentDurations: User not logged in or missing credentials', {
        hasUser: !!user,
        hasApiKey: !!apiKey,
        hasUserId: !!userId
      })
      return { status: 0, data: [], msg: 'User not logged in' }
    }

    const url = `${PRODUCT_API}/appointmentDurationList`
    
    // Backend expects application/x-www-form-urlencoded format
    const formData = new URLSearchParams()
    formData.append('api_key', apiKey)
    formData.append('user_uni_id', userId)
    formData.append('offset', offset || 0)

    console.log('[API] Fetching appointment durations:', { 
      url, 
      user_uni_id: userId,
      offset: offset || 0
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Connection': 'keep-alive',
        'Keep-Alive': 'timeout=5, max=1000'
      },
      body: formData.toString(),
      keepalive: true,
      cache: 'no-cache',
      credentials: 'same-origin'
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] getAppointmentDurations HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    console.log('[API] Appointment durations response:', { status: data.status, count: data.data?.length || 0 })
    return data
  } catch (error) {
    console.error('[API] Error fetching appointment durations:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Get chat channel history (messages)
 * Endpoint: POST /api/getChatChannelHistory (Communication service - port 8006)
 */
export const getChatChannelHistory = async (channel_name, first_msg_id = 0, page = 1, is_assistant_chat = 0) => {
  try {
    const user = getCurrentUser()
    if (!user || !user.api_key || !user.user_uni_id) {
      return { status: 0, data: [], msg: 'User not logged in' }
    }

    const url = `${COMMUNICATION_API}/getChatChannelHistory`
    const requestBody = {
      api_key: user.api_key,
      user_uni_id: user.user_uni_id,
      channel_name,
      first_msg_id,
      page,
      is_assistant_chat
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] Get Chat Channel History HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error fetching chat channel history:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Save chat message
 * Endpoint: POST /api/saveChat (Communication service - port 8006)
 */
export const saveChatMessage = async (messageData) => {
  try {
    const user = getCurrentUser()
    if (!user || !user.api_key || !user.user_uni_id) {
      return { status: 0, msg: 'User not logged in' }
    }

    const url = `${COMMUNICATION_API}/saveChat`
    
    // Create FormData for file uploads
    const formData = new FormData()
    formData.append('api_key', user.api_key)
    formData.append('user_uni_id', user.user_uni_id)
    formData.append('uniqeid', messageData.uniqeid || '')
    formData.append('channel_name', messageData.channel_name || '')
    formData.append('message', messageData.message || '')
    formData.append('parent_id', messageData.parent_id || '')
    formData.append('selected_text', messageData.selected_text || '')
    formData.append('selected_type', messageData.selected_type || '')
    formData.append('file_url', messageData.file_url || '')
    formData.append('message_type', messageData.message_type || 'Text')
    formData.append('call_type', messageData.call_type || 'chat')
    formData.append('is_assistant_chat', messageData.is_assistant_chat || 0)
    formData.append('is_first_chat', messageData.is_first_chat || 1)
    formData.append('is_customer_birth_chat', messageData.is_customer_birth_chat || 0)
    formData.append('slug', messageData.slug || '')
    formData.append('lat', messageData.lat || '')
    formData.append('lon', messageData.lon || '')
    formData.append('tz', messageData.tz || '')

    // Add file if provided
    if (messageData.file) {
      formData.append('file_url', messageData.file)
    }

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      credentials: 'same-origin'
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] Save Chat Message HTTP error:', response.status, errorText)
      return { status: 0, msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error saving chat message:', error)
    return { status: 0, msg: error.message }
  }
}

/**
 * Get remaining chat time
 * Endpoint: POST /api/remainingChatTime (Communication service - port 8006)
 */
export const getRemainingChatTime = async (uniqeid) => {
  try {
    const user = getCurrentUser()
    if (!user || !user.api_key || !user.user_uni_id) {
      return { status: 0, msg: 'User not logged in' }
    }

    const url = `${COMMUNICATION_API}/remainingChatTime`
    const requestBody = {
      api_key: user.api_key,
      user_uni_id: user.user_uni_id,
      uniqeid
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] Get Remaining Chat Time HTTP error:', response.status, errorText)
      return { status: 0, msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error getting remaining chat time:', error)
    return { status: 0, msg: error.message }
  }
}

/**
 * End chat session
 * Endpoint: POST /api/endChat (Communication service - port 8006)
 */
export const endChat = async (uniqeid, duration = null, status = 'completed') => {
  try {
    const user = getCurrentUser()
    if (!user || !user.api_key || !user.user_uni_id) {
      return { status: 0, msg: 'User not logged in' }
    }

    const url = `${COMMUNICATION_API}/endChat`
    const requestBody = {
      api_key: user.api_key,
      user_uni_id: user.user_uni_id,
      uniqeid,
      duration: duration || undefined,
      status
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] End Chat HTTP error:', response.status, errorText)
      return { status: 0, msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error ending chat:', error)
    return { status: 0, msg: error.message }
  }
}

/**
 * Fetch product categories from backend
 * Endpoint: POST /api/productCategory (Product service - port 8007)
 */
export const fetchProductCategories = async (filters = {}) => {
  try {
    const url = `${PRODUCT_API}/productCategory`
    const requestBody = {
      offset: filters.offset || 0,
      limit: filters.limit || 20,
      status: filters.status !== undefined ? filters.status : 1,
      search: filters.search || ''
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error fetching product categories:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch products from backend
 * Endpoint: POST /api/products (Product service - port 8007)
 */
export const fetchProducts = async (filters = {}) => {
  try {
    const url = `${PRODUCT_API}/products`
    const requestBody = {
      offset: filters.offset || 0,
      limit: filters.limit || 20,
      search: filters.search || '',
      category_id: filters.category_id || filters.category || '',
      vendor_uni_id: filters.vendor_uni_id || ''
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error fetching products:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Add product for vendor
 * Endpoint: POST /api/addProduct (Product service - port 8007)
 */
export const addVendorProduct = async (productData) => {
  try {
    const user = getCurrentUser()
    const apiKey = getUserApiKey(user)
    const userId = user?.user_uni_id || ''

    if (!user || !apiKey || !userId) {
      return { status: 0, data: null, msg: 'User not logged in' }
    }

    const url = `${PRODUCT_API}/addProduct`
    const requestBody = {
      api_key: apiKey,
      user_uni_id: userId,
      product_category_id: productData.category_id,
      product_name: productData.name,
      price: productData.price,
      mrp: productData.mrp || productData.price,
      hsn: productData.hsn || '',
      gst_percentage: productData.gst_percentage || '0',
      quantity: productData.quantity || 0,
      product_description: productData.description || '',
      product_image: productData.image || ''
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, data: null, msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error adding product:', error)
    return { status: 0, data: null, msg: error.message }
  }
}

/**
 * Fetch vendor withdrawal requests from backend
 * Endpoint: POST /api/getWithdrawalRequest (Wallets service - port 8004)
 * Returns: { status: 1, data: formattedRecords, offset, income: {...}, msg: 'Withdrawal Request list' }
 * Each record includes: id, user_uni_id, request_amount, request_message, send_message, transaction_number, 
 * status, proof_img, created_at, updated_at
 * Income includes: today_earning, yesterday_earning, total_earning, total_balance, this_month_earning, last_month_earning
 */
export const getVendorWithdrawalRequests = async (filters = {}) => {
  try {
    const user = getCurrentUser()
    if (!user) {
      return { status: 0, data: [], offset: 0, income: null, msg: 'User not logged in' }
    }

    const apiKey = getUserApiKey(user)
    const userId = user.user_uni_id || user.customer_uni_id

    if (!apiKey || !userId) {
      return { status: 0, data: [], offset: 0, income: null, msg: 'User missing required credentials. Please login again.' }
    }

    const url = `${WALLETS_API}/getWithdrawalRequest`
    const requestBody = {
      api_key: apiKey,
      astrologer_uni_id: userId, // Backend uses astrologer_uni_id for vendors too
      offset: filters.offset || 0,
      search: filters.search || '',
      status: filters.status !== undefined && filters.status !== null ? String(filters.status) : ''
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    try {
      const response = await fetch(url, {
        ...getFetchConfig('POST', requestBody),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
        return { status: 0, data: [], offset: 0, income: null, msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()

      // Ensure all backend fields are properly returned
      // Backend returns: { status: 1, data: formattedRecords, offset, income: {...}, msg }
      if (data.status === 1) {
        return {
          status: 1,
          data: Array.isArray(data.data) ? data.data.map(record => ({
            id: record.id || 0,
            user_uni_id: record.user_uni_id || '',
            request_amount: parseFloat(record.request_amount) || 0,
            request_message: record.request_message || '',
            send_message: record.send_message || '',
            transaction_number: record.transaction_number || '',
            status: record.status || '0', // '0' = pending, '1' = approved, '2' = rejected
            proof_img: record.proof_img || '',
            created_at: record.created_at || '',
            updated_at: record.updated_at || ''
          })) : [],
          offset: data.offset || 0,
          income: data.income ? {
            today_earning: parseFloat(data.income.today_earning) || 0,
            yesterday_earning: parseFloat(data.income.yesterday_earning) || 0,
            total_earning: parseFloat(data.income.total_earning) || 0,
            total_balance: parseFloat(data.income.total_balance) || 0,
            this_month_earning: parseFloat(data.income.this_month_earning) || 0,
            last_month_earning: parseFloat(data.income.last_month_earning) || 0
          } : null,
          msg: data.msg || 'Withdrawal Request list'
        }
      }

    return data
    } catch (fetchError) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        return { status: 0, data: [], offset: 0, income: null, msg: 'Request timeout. Please try again.' }
      }
      throw fetchError
    }
  } catch (error) {
    return { status: 0, data: [], offset: 0, income: null, msg: error.message || 'An error occurred while fetching withdrawal requests' }
  }
}

/**
 * Add withdrawal request
 * Endpoint: POST /api/addWithdrawalRequest (Wallets service - port 8004)
 * Required: request_amount (positive number), request_message (string)
 * Returns: { status: 1, msg: 'Withdrawal request saved successfully' } or { status: 0, msg: 'Already Exists' or 'Low balance' }
 */
export const addWithdrawalRequest = async (withdrawalData) => {
  try {
    const user = getCurrentUser()
    if (!user) {
      return { status: 0, msg: 'User not logged in' }
    }

    const apiKey = getUserApiKey(user)
    const userId = user.user_uni_id || user.customer_uni_id

    if (!apiKey || !userId) {
      return { status: 0, msg: 'User missing required credentials. Please login again.' }
    }

    if (!withdrawalData.request_amount || withdrawalData.request_amount <= 0) {
      return { status: 0, msg: 'Request amount must be a positive number' }
    }

    if (!withdrawalData.request_message || withdrawalData.request_message.trim() === '') {
      return { status: 0, msg: 'Request message is required' }
    }

    const url = `${WALLETS_API}/addWithdrawalRequest`
    const requestBody = {
      api_key: apiKey,
      astrologer_uni_id: userId, // Backend uses astrologer_uni_id for vendors too
      request_amount: Number(withdrawalData.request_amount),
      request_message: String(withdrawalData.request_message).trim()
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    try {
      const response = await fetch(url, {
        ...getFetchConfig('POST', requestBody),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        
        // Try to parse error JSON
        let errorData = null
        try {
          errorData = JSON.parse(errorText)
        } catch (e) {
          // If not JSON, use text as is
        }

        return {
          status: 0,
          msg: errorData?.msg || errorData?.message || `HTTP error! status: ${response.status}, message: ${errorText}`,
          error_code: errorData?.error_code || null
        }
      }

      const responseText = await response.text()
      if (!responseText || responseText.trim() === '') {
        return { status: 0, msg: 'Empty response from server. Please try again.' }
      }

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        return { status: 0, msg: `Invalid response format: ${responseText.substring(0, 200)}` }
      }

      // Backend returns: { status: 1, msg: 'Withdrawal request saved successfully' }
      // or { status: 0, msg: 'Already Exists' or 'Low balance, Please Check balance' }
      return {
        status: data.status || 0,
        msg: data.msg || data.message || (data.status === 1 ? 'Withdrawal request saved successfully' : 'Failed to save withdrawal request'),
        error_code: data.error_code || null
      }
    } catch (fetchError) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        return { status: 0, msg: 'Request timeout. Please try again.' }
      }
      throw fetchError
    }
  } catch (error) {
    return { status: 0, msg: error.message || 'An error occurred while adding withdrawal request' }
  }
}

/**
 * Get bank details for astrologer/vendor
 * Endpoint: POST /api/getBankDetails (Astrologers service - port 8002)
 */
export const getBankDetails = async () => {
  try {
    const user = getCurrentUser()
    if (!user) {
      return { status: 0, bankDetail: null, msg: 'User not logged in' }
    }

    const apiKey = getUserApiKey(user)
    const userId = user.user_uni_id || user.customer_uni_id

    if (!apiKey || !userId) {
      return { status: 0, bankDetail: null, msg: 'User missing required credentials' }
    }

    const url = `${API_BASE_URL}/getAstrologerProfile`
    const requestBody = {
      api_key: apiKey,
      astrologer_uni_id: userId
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    
    if (!response.ok) {
      return { status: 0, bankDetail: null, msg: `HTTP error: ${response.status}` }
    }

    const data = await response.json()
    console.log('[API] getBankDetails response:', { 
      status: data.status, 
      hasBankDetail: !!data.bankDetail 
    })
    
    return {
      status: data.status || 0,
      bankDetail: data.bankDetail || null,
      msg: data.msg || 'Bank details fetched'
    }
  } catch (error) {
    console.error('[API] Error fetching bank details:', error)
    return { status: 0, bankDetail: null, msg: error.message }
  }
}

/**
 * Save/Update bank details
 * Endpoint: POST /api/addBankDetails (Astrologers service - port 8002)
 */
export const saveBankDetails = async (bankData) => {
  try {
    const user = getCurrentUser()
    if (!user) {
      return { status: 0, msg: 'User not logged in' }
    }

    const apiKey = getUserApiKey(user)
    const userId = user.user_uni_id || user.customer_uni_id

    if (!apiKey || !userId) {
      return { status: 0, msg: 'User missing required credentials' }
    }

    const url = `${API_BASE_URL}/addBankDetails`
    const requestBody = {
      api_key: apiKey,
      astrologer_uni_id: userId,
      bank_name: bankData.bank_name || '',
      account_no: bankData.account_no || '',
      account_type: bankData.account_type || 'Savings',
      ifsc_code: bankData.ifsc_code || '',
      account_name: bankData.account_name || '',
      pan_no: bankData.pan_no || ''
    }

    console.log('[API] Saving bank details:', { 
      userId, 
      bank_name: requestBody.bank_name,
      account_no: requestBody.account_no ? '****' + requestBody.account_no.slice(-4) : ''
    })

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    
    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, msg: `HTTP error: ${response.status} - ${errorText}` }
    }

    const data = await response.json()
    console.log('[API] saveBankDetails response:', data)
    
    return {
      status: data.status || 0,
      data: data.data || null,
      msg: data.msg || (data.status === 1 ? 'Bank details saved successfully' : 'Failed to save bank details')
    }
  } catch (error) {
    console.error('[API] Error saving bank details:', error)
    return { status: 0, msg: error.message }
  }
}

/**
 * Fetch reviews from backend
 * Endpoint: POST /api/getReviews (Product service - port 8007)
 */
export const fetchReviews = async (filters = {}) => {
  try {
    const url = `${PRODUCT_API}/getReviews`
    const requestBody = {
      offset: filters.offset || 0,
      // Backend uses fixed limit of 15, doesn't accept limit parameter
      status: filters.status !== undefined ? filters.status : 1
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] Reviews HTTP error:', response.status, errorText)
      return { status: 0, reviews: [], msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    // Backend returns reviews in 'reviews' field, not 'data'
    if (data.status === 1 && Array.isArray(data.reviews)) {
      return {
        status: 1,
        data: data.reviews, // Map to 'data' for consistency
        reviews: data.reviews, // Also keep 'reviews' for direct access
        reviewsCounting: data.reviewsCounting || {},
        msg: data.msg || 'Reviews fetched successfully'
      }
    }
    return { status: 0, reviews: [], data: [], msg: data.msg || 'No reviews found' }
  } catch (error) {
    console.error('[API] Error fetching reviews:', error)
    return { status: 0, reviews: [], data: [], msg: error.message }
  }
}

/**
 * Fetch top astrologers from backend
 * Endpoint: POST /api/getAllAstrologer (Astrologers service - port 8002)
 */
export const fetchTopAstrologers = async (filters = {}) => {
  try {
    const url = `${API_BASE_URL}/getAllAstrologer`
    const requestBody = {
      offset: filters.offset || 0,
      limit: filters.limit || 10,
      search: filters.search || '',
      category: filters.category || '',
      language: filters.language || '',
      skill: filters.skill || '',
      status: filters.status !== undefined ? filters.status : 1
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error fetching top astrologers:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

// ============================================
// Communication Service - Additional Functions
// ============================================

/**
 * Get customer queue list
 * Endpoint: POST /api/getCustomerQueueList (Communication service - port 8006)
 */
export const getCustomerQueueList = async () => {
  try {
    const user = getCurrentUser()
    if (!user || !user.api_key || !user.user_uni_id) {
      return { status: 0, data: [], msg: 'User not logged in' }
    }

    const url = `${COMMUNICATION_API}/getCustomerQueueList`
    const requestBody = {
      api_key: user.api_key,
      user_uni_id: user.user_uni_id
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error fetching customer queue list:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Get astrologer queue list
 * Endpoint: POST /api/getAstrologerQueueList (Communication service - port 8006)
 */
export const getAstrologerQueueList = async () => {
  try {
    const user = getCurrentUser()
    if (!user || !user.api_key || !user.user_uni_id) {
      return { status: 0, data: [], msg: 'User not logged in' }
    }

    const url = `${COMMUNICATION_API}/getAstrologerQueueList`
    const requestBody = {
      api_key: user.api_key,
      user_uni_id: user.user_uni_id
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error fetching astrologer queue list:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Decline call/chat request
 * Endpoint: POST /api/declineRequest (Communication service - port 8006)
 */
export const declineRequest = async (uniqeid, status) => {
  try {
    const user = getCurrentUser()
    if (!user || !user.api_key || !user.user_uni_id) {
      return { status: 0, msg: 'User not logged in' }
    }

    const url = `${COMMUNICATION_API}/declineRequest`
    const requestBody = {
      api_key: user.api_key,
      user_uni_id: user.user_uni_id,
      uniqeid,
      status
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error declining request:', error)
    return { status: 0, msg: error.message }
  }
}

/**
 * Decline chat request
 * Endpoint: POST /api/declineChatRequest (Communication service - port 8006)
 */
export const declineChatRequest = async (uniqeid, status) => {
  try {
    const user = getCurrentUser()
    if (!user || !user.api_key || !user.user_uni_id) {
      return { status: 0, msg: 'User not logged in' }
    }

    const url = `${COMMUNICATION_API}/declineChatRequest`
    const requestBody = {
      api_key: user.api_key,
      user_uni_id: user.user_uni_id,
      uniqeid,
      status
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error declining chat request:', error)
    return { status: 0, msg: error.message }
  }
}

/**
 * Receive/Accept voice call
 * Endpoint: POST /api/receiveVoiceCall (Communication service - port 8006)
 */
export const receiveVoiceCall = async (uniqeid) => {
  try {
    const user = getCurrentUser()
    if (!user || !user.api_key || !user.user_uni_id) {
      return { status: 0, data: null, msg: 'User not logged in' }
    }

    const url = `${COMMUNICATION_API}/receiveVoiceCall`
    const requestBody = {
      api_key: user.api_key,
      user_uni_id: user.user_uni_id,
      uniqeid
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, data: null, msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error receiving voice call:', error)
    return { status: 0, data: null, msg: error.message }
  }
}

/**
 * Get voice call requests
 * Endpoint: POST /api/getVoiceCallRequest (Communication service - port 8006)
 */
export const getVoiceCallRequest = async (filters = {}) => {
  try {
    const user = getCurrentUser()
    if (!user || !user.api_key || !user.user_uni_id) {
      return { status: 0, data: [], msg: 'User not logged in' }
    }

    const url = `${COMMUNICATION_API}/getVoiceCallRequest`
    const requestBody = {
      api_key: user.api_key,
      user_uni_id: user.user_uni_id,
      astrologer_uni_id: filters.astrologer_uni_id || user.user_uni_id,
      from: filters.from || '',
      to: filters.to || ''
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error fetching voice call requests:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Get video call requests
 * Endpoint: POST /api/getVideoCallRequest (Communication service - port 8006)
 */
export const getVideoCallRequest = async (astrologer_uni_id = null) => {
  try {
    const user = getCurrentUser()
    if (!user || !user.api_key || !user.user_uni_id) {
      return { status: 0, data: [], msg: 'User not logged in' }
    }

    const url = `${COMMUNICATION_API}/getVideoCallRequest`
    const requestBody = {
      api_key: user.api_key,
      astrologer_uni_id: astrologer_uni_id || user.user_uni_id
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error fetching video call requests:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Receive/Accept video call
 * Endpoint: POST /api/receiveVideoCall (Communication service - port 8006)
 */
export const receiveVideoCall = async (uniqeid, is_joined = 0) => {
  try {
    const user = getCurrentUser()
    if (!user || !user.api_key || !user.user_uni_id) {
      return { status: 0, data: null, msg: 'User not logged in' }
    }

    const url = `${COMMUNICATION_API}/receiveVideoCall`
    const requestBody = {
      api_key: user.api_key,
      astrologer_uni_id: user.user_uni_id,
      uniqeid,
      is_joined
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, data: null, msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error receiving video call:', error)
    return { status: 0, data: null, msg: error.message }
  }
}

/**
 * End video call
 * Endpoint: POST /api/endVideoCall (Communication service - port 8006)
 */
export const endVideoCall = async (uniqeid, declined_by = '', status = '', duration = 0) => {
  try {
    const user = getCurrentUser()
    if (!user || !user.api_key || !user.user_uni_id) {
      return { status: 0, msg: 'User not logged in' }
    }

    const url = `${COMMUNICATION_API}/endVideoCall`
    const requestBody = {
      api_key: user.api_key,
      user_uni_id: user.user_uni_id,
      uniqeid,
      declined_by,
      status,
      duration
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error ending video call:', error)
    return { status: 0, msg: error.message }
  }
}

/**
 * Get remaining service video call time
 * Endpoint: POST /api/remainingServiceVideoCallTime (Communication service - port 8006)
 */
export const getRemainingServiceVideoCallTime = async (order_id) => {
  try {
    const user = getCurrentUser()
    if (!user || !user.api_key || !user.user_uni_id) {
      return { status: 0, data: null, msg: 'User not logged in' }
    }

    const url = `${COMMUNICATION_API}/remainingServiceVideoCallTime`
    const requestBody = {
      api_key: user.api_key,
      user_uni_id: user.user_uni_id,
      order_id
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, data: null, msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error getting remaining service video call time:', error)
    return { status: 0, data: null, msg: error.message }
  }
}

/**
 * Get upcoming live astrologers
 * Endpoint: POST /api/upcomingLiveAstrologer (Communication service - port 8006)
 */
export const getUpcomingLiveAstrologers = async (offset = 0) => {
  try {
    const url = `${COMMUNICATION_API}/upcomingLiveAstrologer`
    const requestBody = {
      offset,
      user_uni_id: null
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error fetching upcoming live astrologers:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Get astrologer call history
 * Endpoint: POST /api/astroCallHistory (Communication service - port 8006)
 */
export const getAstroCallHistory = async (filters = {}) => {
  try {
    const user = getCurrentUser()
    if (!user || !user.api_key || !user.user_uni_id) {
      return { status: 0, data: [], msg: 'User not logged in' }
    }

    const url = `${COMMUNICATION_API}/astroCallHistory`
    const requestBody = {
      api_key: user.api_key,
      user_uni_id: user.user_uni_id,
      call_type: filters.call_type || '',
      offset: filters.offset || 0
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error fetching astrologer call history:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Get chat requests
 * Endpoint: POST /api/getChatRequest (Communication service - port 8006)
 */
export const getChatRequest = async (astrologer_uni_id) => {
  try {
    const user = getCurrentUser()
    if (!user || !user.api_key) {
      return { status: 0, data: [], msg: 'User not logged in' }
    }

    const url = `${COMMUNICATION_API}/getChatRequest`
    const requestBody = {
      api_key: user.api_key,
      astrologer_uni_id
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error fetching chat requests:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Receive/Accept chat
 * Endpoint: POST /api/reciveChat (Communication service - port 8006)
 */
export const receiveChat = async (uniqeid) => {
  try {
    const user = getCurrentUser()
    if (!user || !user.api_key || !user.user_uni_id) {
      return { status: 0, data: null, msg: 'User not logged in' }
    }

    const url = `${COMMUNICATION_API}/reciveChat`
    const requestBody = {
      api_key: user.api_key,
      user_uni_id: user.user_uni_id,
      uniqeid
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, data: null, msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error receiving chat:', error)
    return { status: 0, data: null, msg: error.message }
  }
}

/**
 * Join live stream
 * Endpoint: POST /api/joinLiveStream (Communication service - port 8006)
 */
export const joinLiveStream = async (uniqeid) => {
  try {
    const user = getCurrentUser()
    if (!user || !user.api_key || !user.user_uni_id) {
      return { status: 0, data: null, msg: 'User not logged in' }
    }

    const url = `${COMMUNICATION_API}/joinLiveStream`
    const requestBody = {
      api_key: user.api_key,
      user_uni_id: user.user_uni_id,
      uniqeid
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, data: null, msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error joining live stream:', error)
    return { status: 0, data: null, msg: error.message }
  }
}

/**
 * Start live stream
 * Endpoint: POST /api/startLiveStream (Communication service - port 8006)
 */
export const startLiveStream = async (uniqeid) => {
  try {
    const user = getCurrentUser()
    if (!user || !user.api_key || !user.user_uni_id) {
      return { status: 0, data: null, msg: 'User not logged in' }
    }

    const url = `${COMMUNICATION_API}/startLiveStream`
    const requestBody = {
      api_key: user.api_key,
      user_uni_id: user.user_uni_id,
      uniqeid
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, data: null, msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error starting live stream:', error)
    return { status: 0, data: null, msg: error.message }
  }
}

/**
 * Join live call
 * Endpoint: POST /api/joinLiveCall (Communication service - port 8006)
 */
export const joinLiveCall = async (uniqeid) => {
  try {
    const user = getCurrentUser()
    if (!user || !user.api_key || !user.user_uni_id) {
      return { status: 0, data: null, msg: 'User not logged in' }
    }

    const url = `${COMMUNICATION_API}/joinLiveCall`
    const requestBody = {
      api_key: user.api_key,
      user_uni_id: user.user_uni_id,
      uniqeid
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, data: null, msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error joining live call:', error)
    return { status: 0, data: null, msg: error.message }
  }
}

/**
 * Accept live call
 * Endpoint: POST /api/acceptLiveCall (Communication service - port 8006)
 */
export const acceptLiveCall = async (uniqeid) => {
  try {
    const user = getCurrentUser()
    if (!user || !user.api_key || !user.user_uni_id) {
      return { status: 0, data: null, msg: 'User not logged in' }
    }

    const url = `${COMMUNICATION_API}/acceptLiveCall`
    const requestBody = {
      api_key: user.api_key,
      user_uni_id: user.user_uni_id,
      uniqeid
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, data: null, msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error accepting live call:', error)
    return { status: 0, data: null, msg: error.message }
  }
}

/**
 * Send file on call
 * Endpoint: POST /api/sendFileOnCall (Communication service - port 8006)
 */
export const sendFileOnCall = async (fileData) => {
  try {
    const user = getCurrentUser()
    if (!user || !user.api_key || !user.user_uni_id) {
      return { status: 0, msg: 'User not logged in' }
    }

    const url = `${COMMUNICATION_API}/sendFileOnCall`
    // Note: This endpoint uses multipart/form-data, so we need FormData
    const formData = new FormData()
    formData.append('api_key', user.api_key)
    formData.append('user_uni_id', user.user_uni_id)
    if (fileData.uniqeid) formData.append('uniqeid', fileData.uniqeid)
    if (fileData.file_url) formData.append('file_url', fileData.file_url)
    if (fileData.message_type) formData.append('message_type', fileData.message_type)

    const response = await fetch(url, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error sending file on call:', error)
    return { status: 0, msg: error.message }
  }
}

/**
 * Get files from call
 * Endpoint: POST /api/getFileOnCall (Communication service - port 8006)
 */
export const getFileOnCall = async (uniqeid) => {
  try {
    const user = getCurrentUser()
    if (!user || !user.api_key || !user.user_uni_id) {
      return { status: 0, data: [], msg: 'User not logged in' }
    }

    const url = `${COMMUNICATION_API}/getFileOnCall`
    const requestBody = {
      api_key: user.api_key,
      user_uni_id: user.user_uni_id,
      uniqeid
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    if (!response.ok) {
      const errorText = await response.text()
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error getting files from call:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Get connected users for a customer
 * Returns list of astrologers the customer has connected with
 * Endpoint: POST /api/getConnectedUsers (Users service - port 8001)
 */
export const getConnectedUsers = async (offset = 0, limit = 20) => {
  try {
    const user = getCurrentUser()
    if (!user || !user.user_uni_id) {
      return { status: 0, data: [], msg: 'User not logged in' }
    }

    const apiKey = getUserApiKey(user)
    if (!apiKey) {
      console.error('[API] getConnectedUsers: Failed to get API key')
      return { status: 0, data: [], msg: 'Authentication error' }
    }

    const url = `${API_BASE_URL}/getConnectedUsers`
    const requestBody = {
      api_key: apiKey,
      user_uni_id: user.user_uni_id,
      offset,
      limit
    }

    console.log('[API] Fetching connected users:', { offset, limit })
    const response = await fetch(url, getFetchConfig('POST', requestBody))
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] getConnectedUsers HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    console.log('[API] Connected users response:', { status: data.status, count: data.data?.length || 0 })
    return data
  } catch (error) {
    console.error('[API] Error fetching connected users:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Submit Contact Form
 * Public API - No authentication required
 * Endpoint: POST /api/submitContact (Welcome service - port 8005)
 */
export const submitContactForm = async (contactData) => {
  try {
    const { name, email, number, subject, message } = contactData

    if (!name || !email || !subject || !message) {
      return { status: 0, msg: 'Please fill all required fields' }
    }

    const url = `${WELCOME_API}/submitContact`
    const requestBody = {
      name,
      email,
      number: number || '',
      subject,
      message
    }

    console.log('[API] Submitting contact form:', { name, email, subject })
    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] submitContactForm HTTP error:', response.status, errorText)
      return { status: 0, msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    console.log('[API] Contact form response:', data)
    return data
  } catch (error) {
    console.error('[API] Error submitting contact form:', error)
    return { status: 0, msg: error.message }
  }
}

/**
 * Get Contact Departments
 * Public API - No authentication required
 * Endpoint: POST /api/getContactDepartments (Welcome service - port 8005)
 */
export const getContactDepartments = async () => {
  try {
    const url = `${WELCOME_API}/getContactDepartments`

    const response = await fetch(url, getFetchConfig('POST', {}))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] getContactDepartments HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    console.log('[API] Contact departments response:', { count: data.data?.length || 0 })
    return data
  } catch (error) {
    console.error('[API] Error fetching contact departments:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Get Cover Images
 * Public API - No authentication required
 * Endpoint: POST /api/getCoverImages (Welcome service - port 8005)
 */
export const getCoverImages = async () => {
  try {
    const url = `${WELCOME_API}/getCoverImages`

    const response = await fetch(url, getFetchConfig('POST', {}))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] getCoverImages HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    console.log('[API] Cover images response:', { count: data.data?.length || 0 })
    return data
  } catch (error) {
    console.error('[API] Error fetching cover images:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Get Currencies List
 * Public API - No authentication required
 * Endpoint: POST /api/getCurrencies (Welcome service - port 8005)
 */
export const getCurrencies = async () => {
  try {
    const url = `${WELCOME_API}/getCurrencies`

    const response = await fetch(url, getFetchConfig('POST', {}))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] getCurrencies HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    console.log('[API] Currencies response:', { count: data.data?.length || 0 })
    return data
  } catch (error) {
    console.error('[API] Error fetching currencies:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Get Customer Refunds
 * Requires authentication
 * Endpoint: POST /api/getCustomerRefunds (Welcome service - port 8005)
 */
export const getCustomerRefunds = async (offset = 0, limit = 20) => {
  try {
    const user = getCurrentUser()
    if (!user || !user.user_uni_id) {
      return { status: 0, data: [], msg: 'User not logged in' }
    }

    const apiKey = getUserApiKey(user)
    if (!apiKey) {
      return { status: 0, data: [], msg: 'API key not found for user' }
    }

    const url = `${WELCOME_API}/getCustomerRefunds`
    const requestBody = {
      api_key: apiKey,
      user_uni_id: user.user_uni_id,
      offset,
      limit
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] getCustomerRefunds HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    console.log('[API] Customer refunds response:', { count: data.data?.length || 0, total: data.total })
    return data
  } catch (error) {
    console.error('[API] Error fetching customer refunds:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Get Departments List
 * Public API - No authentication required
 * Endpoint: POST /api/getDepartments (Welcome service - port 8005)
 */
export const getDepartments = async () => {
  try {
    const url = `${WELCOME_API}/getDepartments`

    const response = await fetch(url, getFetchConfig('POST', {}))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] getDepartments HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    console.log('[API] Departments response:', { count: data.data?.length || 0 })
    return data
  } catch (error) {
    console.error('[API] Error fetching departments:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Get Email Templates List
 * Public API - No authentication required
 * Endpoint: POST /api/getEmailTemplates (Welcome service - port 8005)
 */
export const getEmailTemplates = async () => {
  try {
    const url = `${WELCOME_API}/getEmailTemplates`

    const response = await fetch(url, getFetchConfig('POST', {}))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] getEmailTemplates HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    console.log('[API] Email templates response:', { count: data.data?.length || 0 })
    return data
  } catch (error) {
    console.error('[API] Error fetching email templates:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Get FAQs List
 * Public API - No authentication required
 * Endpoint: POST /api/getFaqs (Welcome service - port 8005)
 */
export const getFaqs = async (faqCategoryId = null) => {
  try {
    const url = `${WELCOME_API}/getFaqs`
    const requestBody = {}
    if (faqCategoryId) {
      requestBody.faq_category_id = faqCategoryId
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] getFaqs HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    console.log('[API] FAQs response:', { count: data.data?.length || 0 })
    return data
  } catch (error) {
    console.error('[API] Error fetching FAQs:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Get FAQ Categories List
 * Public API - No authentication required
 * Endpoint: POST /api/getFaqCategories (Welcome service - port 8005)
 */
export const getFaqCategories = async () => {
  try {
    const url = `${WELCOME_API}/getFaqCategories`

    const response = await fetch(url, getFetchConfig('POST', {}))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] getFaqCategories HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    console.log('[API] FAQ categories response:', { count: data.data?.length || 0 })
    return data
  } catch (error) {
    console.error('[API] Error fetching FAQ categories:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Get Followers List
 * Requires authentication
 * Endpoint: POST /api/getFollowers (Welcome service - port 8005)
 */
export const getFollowers = async (page = 1, limit = 20) => {
  try {
    const user = getCurrentUser()
    if (!user || !user.user_uni_id) {
      return { status: 0, data: [], msg: 'User not logged in' }
    }

    const apiKey = getUserApiKey(user)
    if (!apiKey) {
      return { status: 0, data: [], msg: 'API key not found for user' }
    }

    const url = `${WELCOME_API}/getFollowers`
    const requestBody = {
      api_key: apiKey,
      user_uni_id: user.user_uni_id,
      page,
      page_limit: limit
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] getFollowers HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    console.log('[API] Followers response:', { count: data.data?.length || 0 })
    return data
  } catch (error) {
    console.error('[API] Error fetching followers:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Get Gifts List (Gift Items available for sending)
 * Requires authentication
 * Endpoint: POST /api/giftItem (Astrologer service - port 8002)
 */
export const getGifts = async () => {
  try {
    const user = getCurrentUser()
    if (!user || !user.user_uni_id) {
      return { status: 0, data: [], msg: 'User not logged in' }
    }

    const apiKey = getUserApiKey(user)
    if (!apiKey) {
      return { status: 0, data: [], msg: 'API key not found for user' }
    }

    const url = `${API_BASE_URL}/giftItem`
    const requestBody = {
      api_key: apiKey,
      user_uni_id: user.user_uni_id
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] getGifts HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    console.log('[API] Gifts response:', { count: data.data?.length || 0, wallet_balance: data.wallet_balance })
    return data
  } catch (error) {
    console.error('[API] Error fetching gifts:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Get Group Pujas List
 * Public API - No authentication required
 * Endpoint: POST /api/getGroupPujas (Welcome service - port 8005)
 */
export const getGroupPujas = async (categoryId = null, page = 1, limit = 20) => {
  try {
    const url = `${WELCOME_API}/getGroupPujas`
    const requestBody = { page, limit }
    if (categoryId) {
      requestBody.group_puja_category_id = categoryId
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] getGroupPujas HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    console.log('[API] Group pujas response:', { count: data.data?.length || 0, total: data.total })
    return data
  } catch (error) {
    console.error('[API] Error fetching group pujas:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Get Group Puja Assignments
 * Public API - No authentication required
 * Endpoint: POST /api/getGroupPujaAssigns (Welcome service - port 8005)
 */
export const getGroupPujaAssigns = async (filters = {}) => {
  try {
    const url = `${WELCOME_API}/getGroupPujaAssigns`
    const requestBody = {
      page: filters.page || 1,
      limit: filters.limit || 20
    }
    if (filters.group_puja_id) {
      requestBody.group_puja_id = filters.group_puja_id
    }
    if (filters.astrologer_uni_id) {
      requestBody.astrologer_uni_id = filters.astrologer_uni_id
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] getGroupPujaAssigns HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    console.log('[API] Group puja assigns response:', { count: data.data?.length || 0, total: data.total })
    return data
  } catch (error) {
    console.error('[API] Error fetching group puja assigns:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Get Group Puja Categories
 * Public API - No authentication required
 * Endpoint: POST /api/getGroupPujaCategories (Welcome service - port 8005)
 */
export const getGroupPujaCategories = async (parentId = null) => {
  try {
    const url = `${WELCOME_API}/getGroupPujaCategories`
    const requestBody = {}
    if (parentId !== null) {
      requestBody.parent_id = parentId
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] getGroupPujaCategories HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    console.log('[API] Group puja categories response:', { count: data.data?.length || 0 })
    return data
  } catch (error) {
    console.error('[API] Error fetching group puja categories:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Get Group Puja Orders (Customer's puja bookings)
 * Requires authentication
 * Endpoint: POST /api/getGroupPujaOrders (Welcome service - port 8005)
 */
export const getGroupPujaOrders = async (filters = {}) => {
  try {
    const user = getCurrentUser()
    if (!user || !user.user_uni_id) {
      return { status: 0, data: [], msg: 'User not logged in' }
    }

    const apiKey = getUserApiKey(user)
    if (!apiKey) {
      return { status: 0, data: [], msg: 'API key not found for user' }
    }

    const url = `${WELCOME_API}/getGroupPujaOrders`
    const requestBody = {
      api_key: apiKey,
      user_uni_id: user.user_uni_id,
      page: filters.page || 1,
      limit: filters.limit || 20
    }
    if (filters.status) {
      requestBody.status = filters.status
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] getGroupPujaOrders HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    console.log('[API] Group puja orders response:', { count: data.data?.length || 0, total: data.total })
    return data
  } catch (error) {
    console.error('[API] Error fetching group puja orders:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Get product calculation details (price breakdown, GST, wallet deduction, etc.)
 * Endpoint: POST /api/productCalculation (Product service - port 8007)
 */
export const getProductCalculation = async (calculationData) => {
  try {
    const user = getCurrentUser()
    if (!user) {
      return { status: 0, msg: 'User not logged in' }
    }

    const apiKey = getUserApiKey(user)
    const userId = user.user_uni_id || user.customer_uni_id

    if (!apiKey || !userId) {
      return { status: 0, msg: 'User missing required credentials. Please login again.' }
    }

    // Validate required fields
    if (!calculationData.product_id) {
      return { status: 0, msg: 'Product ID is required' }
    }
    if (!calculationData.vendor_uni_id) {
      return { status: 0, msg: 'Vendor ID is required' }
    }

    const url = `${PRODUCT_API}/productCalculation`
    const requestBody = {
      api_key: apiKey,
      user_uni_id: userId,
      item: String(calculationData.quantity || 1),
      vendor_uni_id: String(calculationData.vendor_uni_id),
      product_id: String(calculationData.product_id),
      reference_id: calculationData.reference_id || '',
      offer_code: calculationData.offer_code || '',
      wallet_check: calculationData.wallet_check || 1,
      payment_method: calculationData.payment_method || ''
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    try {
      const response = await fetch(url, {
        ...getFetchConfig('POST', requestBody),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        return { status: 0, msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
      }

      const data = await response.json()
      return data
    } catch (fetchError) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        return { status: 0, msg: 'Request timeout. Please try again.' }
      }
      throw fetchError
    }
  } catch (error) {
    return { status: 0, msg: error.message || 'An error occurred while calculating product details' }
  }
}

/**
 * Purchase a product
 * Endpoint: POST /api/productPurchase (Product service - port 8007)
 */
export const purchaseProduct = async (purchaseData) => {
  try {
    const user = getCurrentUser()
    if (!user) {
      return { status: 0, msg: 'User not logged in' }
    }

    // Use getUserApiKey helper to properly extract API key (handles corrupted keys)
    const apiKey = getUserApiKey(user)
    const userId = user.user_uni_id || user.customer_uni_id

    if (!apiKey || !userId) {
      return { status: 0, msg: 'User missing required credentials. Please login again.' }
    }

    // Validate required fields
    if (!purchaseData.product_id) {
      return { status: 0, msg: 'Product ID is required' }
    }
    if (!purchaseData.vendor_uni_id) {
      return { status: 0, msg: 'Vendor ID is required' }
    }
    if (!purchaseData.address_id) {
      return { status: 0, msg: 'Address ID is required' }
    }

    // Map frontend payment methods to backend format
    // Backend logic:
    // - If payment_method is provided and is a gateway name (razorpay, CCAvenue, etc.), use that gateway
    // - If payment_method is empty or not provided, use default gateway from config
    // - For wallet/COD/online, send empty string to let backend use default logic
    let backendPaymentMethod = purchaseData.payment_method || ''
    
    // Only set gateway names, leave empty for wallet/COD/online
    if (backendPaymentMethod === 'wallet' || 
        backendPaymentMethod === 'WALLET' ||
        backendPaymentMethod === 'cod' || 
        backendPaymentMethod === 'COD' ||
        backendPaymentMethod === 'online' || 
        backendPaymentMethod === 'ONLINE') {
      backendPaymentMethod = ''
    }
    
    // Keep gateway names as-is (razorpay, CCAvenue, PhonePe, Cashfree, Payu)
    // If empty, backend will use default gateway from config

    const url = `${PRODUCT_API}/productPurchase`
    
    // Backend uses upload.none() which expects form data, not JSON
    // Create URLSearchParams for form data
    // Validate required fields before creating form data
    if (!apiKey || String(apiKey).trim() === '') {
      return { status: 0, msg: 'API key is missing. Please login again.' }
    }
    if (!userId || String(userId).trim() === '') {
      return { status: 0, msg: 'User ID is missing. Please login again.' }
    }
    if (!purchaseData.product_id) {
      return { status: 0, msg: 'Product ID is required' }
    }
    if (!purchaseData.vendor_uni_id) {
      return { status: 0, msg: 'Vendor ID is required' }
    }
    if (!purchaseData.address_id) {
      return { status: 0, msg: 'Address ID is required' }
    }
    
    const formData = new URLSearchParams()
    // Required fields - ensure they are strings and not undefined
    formData.append('api_key', String(apiKey).trim())
    formData.append('user_uni_id', String(userId).trim())
    formData.append('item', String(purchaseData.quantity || 1))
    formData.append('vendor_uni_id', String(purchaseData.vendor_uni_id))
    formData.append('address_id', String(purchaseData.address_id))
    formData.append('product_id', String(purchaseData.product_id))
    // Backend allows empty string or null for optional fields
    // Joi schema: .optional().allow('', null)
    // URLSearchParams will send empty string as "key=" which backend will parse as empty string
    const referenceId = purchaseData.reference_id || ''
    const offerCode = purchaseData.offer_code || ''
    
    // Optional fields - send empty string if not provided (backend allows empty string)
    // Joi schema: .optional().allow('', null)
    formData.append('reference_id', String(purchaseData.reference_id || ''))
    formData.append('offer_code', String(purchaseData.offer_code || ''))
    formData.append('wallet_check', String(purchaseData.wallet_check || 1))
    
    // payment_method: empty string for wallet/COD/online (backend uses default gateway)
    // Or gateway name (razorpay, CCAvenue, PhonePe, Cashfree, Payu) for specific gateway
    formData.append('payment_method', String(backendPaymentMethod || ''))
    formData.append('is_updated', String(purchaseData.is_updated || '0'))
    
    // Verify form data is not empty and contains required fields
    const formDataString = formData.toString()
    if (!formDataString || formDataString.trim() === '') {
      return { status: 0, msg: 'Failed to create request data. Please try again.' }
    }
    
    // Ensure required fields are present in the form data string
    if (!formDataString.includes('api_key=') || !formDataString.includes('user_uni_id=') || 
        !formDataString.includes('product_id=') || !formDataString.includes('address_id=') ||
        !formDataString.includes('vendor_uni_id=')) {
      return { status: 0, msg: 'Missing required fields in request. Please try again.' }
    }

    // Add timeout to prevent hanging - 25 seconds
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, 25000) // 25 second timeout

    try {
      // Make the fetch request with form data (not JSON)
      // multer's upload.none() expects application/x-www-form-urlencoded
      // URLSearchParams.toString() creates the correct format: key=value&key2=value2
      const formDataString = formData.toString()
      
      console.log('[API] purchaseProduct - Form data string:', formDataString)
      console.log('[API] purchaseProduct - Form data string length:', formDataString.length)
      
      // CRITICAL: Ensure form data string is valid and not empty
      if (!formDataString || formDataString.trim() === '') {
        clearTimeout(timeoutId)
        return { status: 0, msg: 'Failed to create request body. Please try again.' }
      }
      
      // Verify the form data string contains all required fields
      const requiredFields = ['api_key', 'user_uni_id', 'product_id', 'address_id', 'vendor_uni_id', 'item']
      const missingFields = requiredFields.filter(field => !formDataString.includes(`${field}=`))
      if (missingFields.length > 0) {
        clearTimeout(timeoutId)
        return { status: 0, msg: `Missing required fields: ${missingFields.join(', ')}` }
      }
      
      console.log('[API] purchaseProduct - Sending request to:', url)
      console.log('[API] purchaseProduct - Content-Type:', 'application/x-www-form-urlencoded')
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'Connection': 'keep-alive',
          'Keep-Alive': 'timeout=5, max=1000'
        },
        body: formDataString,
        signal: controller.signal,
        keepalive: true,
        cache: 'no-cache',
        credentials: 'same-origin'
      })

      clearTimeout(timeoutId)

      // CRITICAL: Handle 400 Bad Request immediately (invalid JSON or validation error)
      if (response.status === 400) {
        let errorText = ''
        try {
          errorText = await response.text()
          // Try to parse as JSON to get detailed error
          try {
            const errorJson = JSON.parse(errorText)
            return { status: 0, msg: errorJson.msg || errorJson.message || `Bad Request: ${errorText.substring(0, 200)}` }
          } catch {
            return { status: 0, msg: `Bad Request (400): ${errorText.substring(0, 200)}` }
          }
        } catch (textError) {
          return { status: 0, msg: 'Bad Request (400): Invalid request data or validation failed' }
        }
      }

      // CRITICAL: Handle 500 Internal Server Error (backend crash or validation issue)
      if (response.status === 500) {
        let errorText = ''
        try {
          errorText = await response.text()
          // Check if it's a Joi validation error (value undefined)
          if (errorText.includes('Cannot destructure property') || errorText.includes('value') && errorText.includes('undefined')) {
            return { status: 0, msg: 'Backend validation error: Request body may be empty or malformed. Please check if all required fields are being sent.' }
          }
          // Try to parse as JSON
          try {
            const errorJson = JSON.parse(errorText)
            return { status: 0, msg: errorJson.msg || errorJson.message || `Server Error (500): ${errorText.substring(0, 200)}` }
          } catch {
            return { status: 0, msg: `Server Error (500): ${errorText.substring(0, 300)}` }
          }
        } catch (textError) {
          return { status: 0, msg: 'Server Error (500): Backend encountered an error processing the request' }
        }
      }

      // Check for 404 (route not found) or other HTTP errors
      if (response.status === 404) {
        return { status: 0, msg: `API endpoint not found (404). Please check if the backend route is correct: ${url}` }
      }

      if (!response.ok) {
        const errorText = await response.text()
        return { status: 0, msg: `HTTP error! status: ${response.status}, message: ${errorText.substring(0, 200)}` }
      }

      // Check Content-Type to determine how to parse response
      const contentType = response.headers.get('content-type') || ''
      let data
      
      if (contentType.includes('application/json')) {
        // Parse as JSON
        try {
          data = await response.json()
        } catch (jsonError) {
          // If JSON parsing fails, try text
      const responseText = await response.text()
          if (!responseText || responseText.trim() === '') {
            return { status: 0, msg: 'Empty response from server. Please try again.' }
          }
          try {
            data = JSON.parse(responseText)
          } catch (parseError) {
            return { status: 0, msg: `Invalid JSON response: ${responseText.substring(0, 200)}` }
          }
        }
      } else {
        // Parse as text first
        const responseText = await response.text()
        
        // Check if response is empty
        if (!responseText || responseText.trim() === '') {
          return { status: 0, msg: 'Empty response from server. Please try again.' }
        }
        
        // Try to parse as JSON
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        // Handle case where backend returns plain text or different format
        if (responseText.includes('Order placed successfully') || responseText.includes('successfully')) {
          data = { status: 1, msg: 'Order placed successfully' }
        } else {
            return { status: 0, msg: `Invalid response format. Content-Type: ${contentType}, Response: ${responseText.substring(0, 200)}` }
          }
        }
      }
      
      // Normalize status field - backend can return status as "Order placed successfully" string or 1
      if (data?.status === 'Order placed successfully' || 
          (typeof data?.status === 'string' && data.status.includes('Order placed'))) {
        // Convert string status to number for consistency
        data.status = 1
        data.msg = data.msg || 'Order placed successfully'
      }

      // Ensure we always return a valid response object
      if (!data || typeof data !== 'object') {
        return { status: 0, msg: 'Invalid response format from server' }
      }

      return data
    } catch (fetchError) {
      clearTimeout(timeoutId)
      
      // Handle AbortError (timeout)
      if (fetchError.name === 'AbortError') {
        return { status: 0, msg: 'Request timeout after 25 seconds. The server may be slow, unresponsive, or stuck in an await. Please check backend logs and try again.' }
      }
      
      // Handle network errors (CORS, connection refused, etc.)
      if (fetchError.message?.includes('Failed to fetch') || 
          fetchError.message?.includes('NetworkError') ||
          fetchError.message?.includes('network') ||
          fetchError.message?.includes('ERR_CONNECTION_REFUSED') ||
          fetchError.message?.includes('ERR_NETWORK')) {
        return { status: 0, msg: `Network error. Cannot connect to server at ${url}. Please check if the backend is running and the URL is correct.` }
      }
      
      // Handle CORS errors
      if (fetchError.message?.includes('CORS') || fetchError.message?.includes('cors')) {
        return { status: 0, msg: 'CORS error. Please check backend CORS configuration.' }
      }
      
      // Handle parsing errors
      if (fetchError.message?.includes('JSON') || fetchError.message?.includes('parse')) {
        return { status: 0, msg: `Response parsing error: ${fetchError.message}. Backend may have sent invalid response format.` }
      }
      
      // Return error instead of throwing to ensure Shop.jsx always gets a response
      return { status: 0, msg: fetchError.message || `Network error connecting to ${url}. Please try again.` }
    }
  } catch (error) {
    // Ensure we always return an error object, never throw
    return { status: 0, msg: error.message || 'An error occurred while placing the order' }
  }
}

/**
 * Get user addresses list
 * Endpoint: POST /api/userAddressList (Welcome service - port 8005)
 */
export const getUserAddresses = async () => {
  try {
    const user = getCurrentUser()
    if (!user || !user.user_uni_id) {
      console.error('[API] getUserAddresses: User not logged in')
      return { status: 0, data: [], msg: 'User not logged in' }
    }

    const apiKey = getUserApiKey(user)
    const userId = user.user_uni_id || user.customer_uni_id

    if (!apiKey || !userId) {
      console.error('[API] getUserAddresses: Missing credentials', {
        hasApiKey: !!apiKey,
        hasUserId: !!userId,
        userIdValue: userId
      })
      return { status: 0, data: [], msg: 'User missing required credentials. Please login again.' }
    }

    const url = `${WELCOME_API}/userAddressList`
    
    // Backend uses upload.none() which expects form data, not JSON
    const formData = new URLSearchParams()
    formData.append('api_key', String(apiKey))
    formData.append('user_uni_id', String(userId))

    console.log('[API] getUserAddresses: Sending request to', url)
    console.log('[API] getUserAddresses: Request data', {
      userId: userId,
      apiKeyLength: apiKey.length,
      apiKeyPreview: `${apiKey.substring(0, 15)}...${apiKey.substring(apiKey.length - 15)}`
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: formData.toString()
    })

    console.log('[API] getUserAddresses: Response status', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] getUserAddresses HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    console.log('[API] getUserAddresses: Response data', {
      status: data.status,
      hasData: !!data.data,
      dataIsArray: Array.isArray(data.data),
      dataLength: data.data ? (Array.isArray(data.data) ? data.data.length : 'not array') : 0,
      msg: data.msg
    })
    
    // Ensure data structure is correct
    if (data.status === 1 && data.data) {
      // Ensure data is always an array
      if (!Array.isArray(data.data)) {
        console.warn('[API] getUserAddresses: data.data is not an array, converting...', typeof data.data)
        data.data = []
      } else {
        console.log('[API] getUserAddresses: Found', data.data.length, 'addresses')
      }
    } else if (data.status === 0) {
      // No addresses found - return empty array
      console.log('[API] getUserAddresses: No addresses found (status 0)')
      data.data = []
    } else {
      // Unknown status
      console.warn('[API] getUserAddresses: Unknown status', data.status)
      data.data = []
    }
    
    return data
  } catch (error) {
    console.error('[API] getUserAddresses: Exception caught', error)
    return { status: 0, data: [], msg: error.message || 'Failed to fetch addresses' }
  }
}

/**
 * Add new user address
 * Endpoint: POST /api/addAddress (Product service - port 8007)
 */
export const addUserAddress = async (addressData) => {
  try {
    const user = getCurrentUser()
    if (!user || !user.user_uni_id) {
      return { status: 0, data: null, msg: 'User not logged in' }
    }

    const apiKey = user.user_api_key || user.api_key
    const userId = user.user_uni_id || user.customer_uni_id

    const url = `${PRODUCT_API}/addAddress`
    const requestBody = {
      api_key: apiKey,
      user_uni_id: userId,
      name: addressData.name,
      email: addressData.email,
      phone: addressData.phone,
      house_no: addressData.houseNo || '',
      street_area: addressData.street || '',
      landmark: addressData.landmark || '',
      address: addressData.address || '',
      city: addressData.city || '',
      state: addressData.state || '',
      country: addressData.country || '',
      latitude: addressData.latitude || '',
      longitude: addressData.longitude || '',
      pincode: addressData.pincode || ''
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    if (!response.ok) {
      return { status: 0, data: null, msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error adding user address:', error)
    return { status: 0, data: null, msg: error.message }
  }
}

/**
 * Update user address
 * Endpoint: POST /api/updateAddress (Product service - port 8007)
 * Note: If update endpoint doesn't exist, we may need to create it in backend
 */
export const updateUserAddress = async (addressId, addressData) => {
  try {
    const user = getCurrentUser()
    if (!user || !user.user_uni_id) {
      return { status: 0, data: null, msg: 'User not logged in' }
    }

    const apiKey = user.user_api_key || user.api_key
    const userId = user.user_uni_id || user.customer_uni_id

    const url = `${PRODUCT_API}/updateAddress`
    const requestBody = {
      api_key: apiKey,
      user_uni_id: userId,
      id: addressId,
      name: addressData.name,
      email: addressData.email,
      phone: addressData.phone,
      house_no: addressData.houseNo || '',
      street_area: addressData.street || '',
      landmark: addressData.landmark || '',
      address: addressData.address || '',
      city: addressData.city || '',
      state: addressData.state || '',
      country: addressData.country || '',
      latitude: addressData.latitude || '',
      longitude: addressData.longitude || '',
      pincode: addressData.pincode || ''
    }

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    if (!response.ok) {
      return { status: 0, data: null, msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] Error updating user address:', error)
    return { status: 0, data: null, msg: error.message }
  }
}

/**
 * Delete user address
 * Endpoint: POST /api/deleteAddress (Product service - port 8007)
 */
export const deleteUserAddress = async (addressId) => {
  try {
    console.log('[API] ===== deleteUserAddress called =====')
    console.log('[API] Address ID:', addressId)
    
    const user = getCurrentUser()
    if (!user || !user.user_uni_id) {
      console.error('[API] ❌ User not logged in')
      return { status: 0, msg: 'User not logged in' }
    }

    const apiKey = user.user_api_key || user.api_key
    const userId = user.user_uni_id || user.customer_uni_id

    if (!apiKey) {
      console.error('[API] ❌ Missing API key')
      return { status: 0, msg: 'Missing API key' }
    }

    const url = `${PRODUCT_API}/deleteAddress`
    const requestBody = {
      api_key: apiKey,
      user_uni_id: userId,
      id: addressId
    }

    console.log('[API] Request URL:', url)
    console.log('[API] Request body:', { ...requestBody, api_key: '***' })

    const response = await fetch(url, getFetchConfig('POST', requestBody))
    
    console.log('[API] Response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] ❌ HTTP error response:', errorText)
      return { status: 0, msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
    }

    const data = await response.json()
    console.log('[API] ✅ Delete address response:', {
      status: data.status,
      msg: data.msg
    })
    
    return data
  } catch (error) {
    console.error('[API] ❌ Exception in delete user address:', error)
    console.error('[API] Error stack:', error.stack)
    return { status: 0, msg: error.message }
  }
}

/**
 * Get payout list
 * Endpoint: POST /api/getpayoutList (Wallets service - port 8004)
 * Returns: { status: 1, data: walletRecords, msg: 'List' }
 */
export const getPayoutList = async (user_uni_id) => {
  try {
    const user = getCurrentUser()
    if (!user) {
      return { status: 0, data: [], msg: 'User not logged in' }
    }

    const apiKey = getUserApiKey(user)
    const userId = user_uni_id || user.user_uni_id || user.customer_uni_id || ''

    if (!apiKey || !userId) {
      return { status: 0, data: [], msg: 'User missing required credentials. Please login again.' }
    }

    const url = `${WALLETS_API}/getpayoutList`
    const requestBody = {
      api_key: apiKey,
      user_uni_id: userId
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    try {
      const response = await fetch(url, {
        ...getFetchConfig('POST', requestBody),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        return { status: 0, data: [], msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
      }

      const data = await response.json()
      return data
    } catch (fetchError) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        return { status: 0, data: [], msg: 'Request timeout. Please try again.' }
      }
      throw fetchError
    }
  } catch (error) {
    return { status: 0, data: [], msg: error.message || 'An error occurred while fetching payout list' }
  }
}

/**
 * Get Sanjeevini list
 * Endpoint: POST /api/sanjeeviniList (Product service - port 8007)
 * Returns: { status: 1, offset, data: enrichedData, msg: 'Get successfully' }
 */
export const getSanjeeviniList = async (filters = {}) => {
  try {
    const user = getCurrentUser()
    const apiKey = user ? getUserApiKey(user) : ''
    const userId = user ? (user.user_uni_id || user.customer_uni_id || '') : ''

    const url = `${PRODUCT_API}/sanjeeviniList`
    const requestBody = {
      api_key: apiKey || '',
      user_uni_id: userId || '',
      search: filters.search || '',
      offset: filters.offset || 0
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    try {
      const response = await fetch(url, {
        ...getFetchConfig('POST', requestBody),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        return { status: 0, data: [], msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
      }

      const data = await response.json()
      return data
    } catch (fetchError) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        return { status: 0, data: [], msg: 'Request timeout. Please try again.' }
      }
      throw fetchError
    }
  } catch (error) {
    return { status: 0, data: [], msg: error.message || 'An error occurred while fetching Sanjeevini list' }
  }
}

/**
 * Get Sanjeevini calculation
 * Endpoint: POST /api/sanjeeviniCalculation (Product service - port 8007)
 * Returns: { status: 1, data: calculationData, msg: 'Success' }
 */
export const getSanjeeviniCalculation = async (calculationData) => {
  try {
    const user = getCurrentUser()
    if (!user) {
      return { status: 0, msg: 'User not logged in' }
    }

    const apiKey = getUserApiKey(user)
    const userId = user.user_uni_id || user.customer_uni_id

    if (!apiKey || !userId) {
      return { status: 0, msg: 'User missing required credentials. Please login again.' }
    }

    if (!calculationData.sanjeevini_id) {
      return { status: 0, msg: 'Sanjeevini ID is required' }
    }

    const url = `${PRODUCT_API}/sanjeeviniCalculation`
    const requestBody = {
      api_key: apiKey,
      user_uni_id: userId,
      sanjeevini_id: String(calculationData.sanjeevini_id),
      offer_code: calculationData.offer_code || '',
      wallet_check: calculationData.wallet_check || 0
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    try {
      const response = await fetch(url, {
        ...getFetchConfig('POST', requestBody),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        return { status: 0, msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
      }

      const data = await response.json()
      return data
    } catch (fetchError) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        return { status: 0, msg: 'Request timeout. Please try again.' }
      }
      throw fetchError
    }
  } catch (error) {
    return { status: 0, msg: error.message || 'An error occurred while calculating Sanjeevini details' }
  }
}

/**
 * Purchase Sanjeevini
 * Endpoint: POST /api/sanjeeviniPurchase (Product service - port 8007)
 * Returns: { status: 1, order_id, payment_gateway_status, payment_gateway, msg, data }
 */
export const purchaseSanjeevini = async (purchaseData) => {
  try {
    const user = getCurrentUser()
    if (!user) {
      return { status: 0, msg: 'User not logged in' }
    }

    const apiKey = getUserApiKey(user)
    const userId = user.user_uni_id || user.customer_uni_id

    if (!apiKey || !userId) {
      return { status: 0, msg: 'User missing required credentials. Please login again.' }
    }

    if (!purchaseData.sanjeevini_id) {
      return { status: 0, msg: 'Sanjeevini ID is required' }
    }

    const url = `${PRODUCT_API}/sanjeeviniPurchase`
    const requestBody = {
      api_key: apiKey,
      user_uni_id: userId,
      sanjeevini_id: String(purchaseData.sanjeevini_id),
      offer_code: purchaseData.offer_code || '',
      reference_id: purchaseData.reference_id || '',
      wallet_check: purchaseData.wallet_check || 1,
      payment_method: purchaseData.payment_method || '',
      is_updated: purchaseData.is_updated ? String(purchaseData.is_updated) : '0'
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      const response = await fetch(url, {
        ...getFetchConfig('POST', requestBody),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        return { status: 0, msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
      }

      const responseText = await response.text()
      if (!responseText || responseText.trim() === '') {
        return { status: 0, msg: 'Empty response from server. Please try again.' }
      }

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        return { status: 0, msg: `Invalid response format: ${responseText.substring(0, 200)}` }
      }

      if (!data || typeof data !== 'object') {
        return { status: 0, msg: 'Invalid response format from server' }
      }

      return data
    } catch (fetchError) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        return { status: 0, msg: 'Request timeout. Please try again.' }
      }
      throw fetchError
    }
  } catch (error) {
    return { status: 0, msg: error.message || 'An error occurred while purchasing Sanjeevini' }
  }
}

/**
 * Get Sanjeevini purchase list
 * Endpoint: POST /api/sanjeeviniPurchaseList (Product service - port 8007)
 * Returns: { status: 1, data: purchaseList, msg: 'List' }
 */
export const getSanjeeviniPurchaseList = async (filters = {}) => {
  try {
    const user = getCurrentUser()
    if (!user) {
      return { status: 0, data: [], msg: 'User not logged in' }
    }

    const apiKey = getUserApiKey(user)
    const userId = user.user_uni_id || user.customer_uni_id

    if (!apiKey || !userId) {
      return { status: 0, data: [], msg: 'User missing required credentials. Please login again.' }
    }

    const url = `${PRODUCT_API}/sanjeeviniPurchaseList`
    const requestBody = {
      api_key: apiKey,
      user_uni_id: userId,
      offset: filters.offset || 0,
      limit: filters.limit || 10,
      search: filters.search || ''
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    try {
      const response = await fetch(url, {
        ...getFetchConfig('POST', requestBody),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        return { status: 0, data: [], msg: `HTTP error! status: ${response.status}, message: ${errorText}` }
      }

      const data = await response.json()
      return data
    } catch (fetchError) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        return { status: 0, data: [], msg: 'Request timeout. Please try again.' }
      }
      throw fetchError
    }
  } catch (error) {
    return { status: 0, data: [], msg: error.message || 'An error occurred while fetching Sanjeevini purchase list' }
  }
}

// ============================================
// PDF BOOKS APIs (Port 8007)
// ============================================

/**
 * Get PDF book categories
 * Endpoint: POST /api/pdfBookCategory (Product service - port 8007)
 */
export const fetchPdfBookCategories = async (filters = {}) => {
  try {
    const user = getCurrentUser()
    const apiKey = getUserApiKey(user)
    const userId = user?.user_uni_id || user?.customer_uni_id || ''

    const requestBody = {
      api_key: apiKey || '',
      user_uni_id: userId || '',
      status: filters.status !== undefined ? filters.status : 1,
      offset: filters.offset || 0
    }

    const response = await fetch(`${PRODUCT_API}/pdfBookCategory`, getFetchConfig('POST', requestBody))
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] fetchPdfBookCategories error:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Get PDF books list
 * Endpoint: POST /api/pdfBookList (Product service - port 8007)
 */
export const fetchPdfBooks = async (filters = {}) => {
  try {
    const user = getCurrentUser()
    const apiKey = getUserApiKey(user)
    const userId = user?.user_uni_id || user?.customer_uni_id || ''

    const requestBody = {
      api_key: apiKey || '',
      user_uni_id: userId || '',
      category_id: filters.category_id || '',
      status: filters.status !== undefined ? filters.status : 1,
      offset: filters.offset || 0
    }

    const response = await fetch(`${PRODUCT_API}/pdfBookList`, getFetchConfig('POST', requestBody))
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] fetchPdfBooks error:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Calculate PDF book price
 * Endpoint: POST /api/pdfBookCalculation (Product service - port 8007)
 */
export const calculatePdfBookPrice = async (bookId) => {
  try {
    const user = getCurrentUser()
    const apiKey = getUserApiKey(user)
    const userId = user?.user_uni_id || user?.customer_uni_id || ''

    if (!apiKey || !userId) {
      return { status: 0, msg: 'Please login to continue' }
    }

    const requestBody = {
      api_key: apiKey,
      user_uni_id: userId,
      pdf_book_id: bookId
    }

    const response = await fetch(`${PRODUCT_API}/pdfBookCalculation`, getFetchConfig('POST', requestBody))
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] calculatePdfBookPrice error:', error)
    return { status: 0, msg: error.message }
  }
}

/**
 * Purchase PDF book
 * Endpoint: POST /api/pdfBookPurchase (Product service - port 8007)
 */
export const purchasePdfBook = async (purchaseData) => {
  try {
    const user = getCurrentUser()
    const apiKey = getUserApiKey(user)
    const userId = user?.user_uni_id || user?.customer_uni_id || ''

    if (!apiKey || !userId) {
      return { status: 0, msg: 'Please login to continue' }
    }

    const requestBody = {
      api_key: apiKey,
      user_uni_id: userId,
      pdf_book_id: purchaseData.pdf_book_id,
      payment_method: purchaseData.payment_method || 'wallet'
    }

    const response = await fetch(`${PRODUCT_API}/pdfBookPurchase`, getFetchConfig('POST', requestBody))
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] purchasePdfBook error:', error)
    return { status: 0, msg: error.message }
  }
}

/**
 * Get purchased PDF books list
 * Endpoint: POST /api/pdfBookPurchaseList (Product service - port 8007)
 */
export const fetchMyPdfBooks = async (offset = 0) => {
  try {
    const user = getCurrentUser()
    const apiKey = getUserApiKey(user)
    const userId = user?.user_uni_id || user?.customer_uni_id || ''

    if (!apiKey || !userId) {
      return { status: 0, data: [], msg: 'Please login to continue' }
    }

    const requestBody = {
      api_key: apiKey,
      user_uni_id: userId,
      offset: offset
    }

    const response = await fetch(`${PRODUCT_API}/pdfBookPurchaseList`, getFetchConfig('POST', requestBody))
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] fetchMyPdfBooks error:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

// ============================================
// SWITCHWORD APIs (Port 8007)
// ============================================

/**
 * Get switchword list
 * Endpoint: POST /api/switchwordList (Product service - port 8007)
 */
export const fetchSwitchwords = async (filters = {}) => {
  try {
    const user = getCurrentUser()
    const apiKey = getUserApiKey(user)
    const userId = user?.user_uni_id || user?.customer_uni_id || ''

    const requestBody = {
      api_key: apiKey || '',
      user_uni_id: userId || '',
      status: filters.status !== undefined ? filters.status : 1,
      offset: filters.offset || 0
    }

    const response = await fetch(`${PRODUCT_API}/switchwordList`, getFetchConfig('POST', requestBody))
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] fetchSwitchwords error:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Calculate switchword price
 * Endpoint: POST /api/switchwordCalculation (Product service - port 8007)
 */
export const calculateSwitchwordPrice = async (switchwordId) => {
  try {
    const user = getCurrentUser()
    const apiKey = getUserApiKey(user)
    const userId = user?.user_uni_id || user?.customer_uni_id || ''

    if (!apiKey || !userId) {
      return { status: 0, msg: 'Please login to continue' }
    }

    const requestBody = {
      api_key: apiKey,
      user_uni_id: userId,
      switchword_id: switchwordId
    }

    const response = await fetch(`${PRODUCT_API}/switchwordCalculation`, getFetchConfig('POST', requestBody))
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] calculateSwitchwordPrice error:', error)
    return { status: 0, msg: error.message }
  }
}

/**
 * Purchase switchword
 * Endpoint: POST /api/switchwordPurchase (Product service - port 8007)
 */
export const purchaseSwitchword = async (purchaseData) => {
  try {
    const user = getCurrentUser()
    const apiKey = getUserApiKey(user)
    const userId = user?.user_uni_id || user?.customer_uni_id || ''

    if (!apiKey || !userId) {
      return { status: 0, msg: 'Please login to continue' }
    }

    const requestBody = {
      api_key: apiKey,
      user_uni_id: userId,
      switchword_id: purchaseData.switchword_id,
      payment_method: purchaseData.payment_method || 'wallet'
    }

    const response = await fetch(`${PRODUCT_API}/switchwordPurchase`, getFetchConfig('POST', requestBody))
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] purchaseSwitchword error:', error)
    return { status: 0, msg: error.message }
  }
}

/**
 * Get purchased switchword list
 * Endpoint: POST /api/switchwordPurchaseList (Product service - port 8007)
 */
export const fetchMySwitchwords = async (offset = 0) => {
  try {
    const user = getCurrentUser()
    const apiKey = getUserApiKey(user)
    const userId = user?.user_uni_id || user?.customer_uni_id || ''

    if (!apiKey || !userId) {
      return { status: 0, data: [], msg: 'Please login to continue' }
    }

    const requestBody = {
      api_key: apiKey,
      user_uni_id: userId,
      offset: offset
    }

    const response = await fetch(`${PRODUCT_API}/switchwordPurchaseList`, getFetchConfig('POST', requestBody))
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] fetchMySwitchwords error:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

// ============================================
// NOTICES APIs (Port 8007)
// ============================================

/**
 * Get notices/announcements
 * Endpoint: POST /api/getNotice (Product service - port 8007)
 */
export const fetchNotices = async (filters = {}) => {
  try {
    const user = getCurrentUser()
    const apiKey = getUserApiKey(user)
    const userId = user?.user_uni_id || user?.customer_uni_id || ''

    const requestBody = {
      api_key: apiKey || '',
      user_uni_id: userId || '',
      status: filters.status !== undefined ? filters.status : 1,
      offset: filters.offset || 0
    }

    const response = await fetch(`${PRODUCT_API}/getNotice`, getFetchConfig('POST', requestBody))
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] fetchNotices error:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

// ============================================
// OFFERS APIs (Port 8007)
// ============================================

/**
 * Get active offers
 * Endpoint: POST /api/offerList (Product service - port 8007)
 */
export const fetchOffers = async (filters = {}) => {
  try {
    const user = getCurrentUser()
    const apiKey = getUserApiKey(user)
    const userId = user?.user_uni_id || user?.customer_uni_id || ''

    const requestBody = {
      api_key: apiKey || '',
      user_uni_id: userId || '',
      status: filters.status !== undefined ? filters.status : 1,
      offset: filters.offset || 0
    }

    const response = await fetch(`${PRODUCT_API}/offerList`, getFetchConfig('POST', requestBody))
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] fetchOffers error:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

// ============================================
// PAID KUNDLI ORDERS APIs (Port 8007)
// ============================================

/**
 * Fetch paid kundli orders list
 * Endpoint: POST /api/paidKundliOrderList (Product service - port 8007)
 */
export const fetchPaidKundliOrders = async (orderFor = '') => {
  try {
    const user = getCurrentUser()
    if (!user || !user.api_key || !user.user_uni_id) {
      return { status: 0, data: [], msg: 'User not logged in' }
    }

    const url = `${PRODUCT_API}/paidKundliOrderList`
    const requestBody = {
      api_key: user.api_key,
      user_uni_id: user.user_uni_id,
      order_for: orderFor
    }

    console.log('[API] Fetching paid kundli orders:', { url, orderFor })
    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] Fetch Paid Kundli Orders HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    console.log('[API] Fetch Paid Kundli Orders response:', { count: data.data?.length || 0 })
    return data
  } catch (error) {
    console.error('[API] Error fetching paid kundli orders:', error)
    return { status: 0, data: [], msg: error.message || 'An error occurred while fetching paid kundli orders' }
  }
}

/**
 * Fetch paid kundli manual orders list
 * Endpoint: POST /api/paidKundliManualOrderList (Product service - port 8007)
 */
export const fetchPaidKundliManualOrders = async (orderFor = '') => {
  try {
    const user = getCurrentUser()
    if (!user || !user.api_key || !user.user_uni_id) {
      return { status: 0, data: [], msg: 'User not logged in' }
    }

    const url = `${PRODUCT_API}/paidKundliManualOrderList`
    const requestBody = {
      api_key: user.api_key,
      user_uni_id: user.user_uni_id,
      order_for: orderFor
    }

    console.log('[API] Fetching paid kundli manual orders:', { url, orderFor })
    const response = await fetch(url, getFetchConfig('POST', requestBody))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] Fetch Paid Kundli Manual Orders HTTP error:', response.status, errorText)
      return { status: 0, data: [], msg: `HTTP error! status: ${response.status}` }
    }

    const data = await response.json()
    console.log('[API] Fetch Paid Kundli Manual Orders response:', { count: data.data?.length || 0 })
    return data
  } catch (error) {
    console.error('[API] Error fetching paid kundli manual orders:', error)
    return { status: 0, data: [], msg: error.message || 'An error occurred while fetching paid kundli manual orders' }
  }
}

// ============================================
// QUOTES APIs (Port 8007)
// ============================================

/**
 * Get daily quote
 * Endpoint: POST /api/getQuote (Product service - port 8007)
 */
export const fetchDailyQuote = async () => {
  try {
    const user = getCurrentUser()
    const apiKey = getUserApiKey(user)
    const userId = user?.user_uni_id || user?.customer_uni_id || ''

    const requestBody = {
      api_key: apiKey || '',
      user_uni_id: userId || ''
    }

    const response = await fetch(`${PRODUCT_API}/getQuote`, getFetchConfig('POST', requestBody))
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] fetchDailyQuote error:', error)
    return { status: 0, data: null, msg: error.message }
  }
}

// ============================================
// NOTIFICATIONS APIs (Port 8005)
// ============================================

/**
 * Get user notifications
 * Endpoint: POST /api/notificationList (Welcome service - port 8005)
 */
export const fetchNotifications = async (offset = 0) => {
  try {
    const user = getCurrentUser()
    const apiKey = getUserApiKey(user)
    const userId = user?.user_uni_id || user?.customer_uni_id || ''

    if (!apiKey || !userId) {
      return { status: 0, data: [], msg: 'Please login to continue' }
    }

    const requestBody = {
      api_key: apiKey,
      user_uni_id: userId,
      offset: offset
    }

    const response = await fetch(`${WELCOME_API}/notificationList`, getFetchConfig('POST', requestBody))
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] fetchNotifications error:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch notify logs from backend
 * Endpoint: POST /api/notifyLogList (Welcome service - port 8005)
 */
export const fetchNotifyLogs = async (offset = 0, type = '', status = '') => {
  try {
    const user = getCurrentUser()
    const apiKey = getUserApiKey(user)
    const userId = user?.user_uni_id || user?.customer_uni_id || ''

    const requestBody = {
      api_key: apiKey || '',
      user_uni_id: userId || '',
      offset: offset
    }

    if (type) {
      requestBody.type = type
    }
    if (status) {
      requestBody.status = status
    }

    console.log('[API] Fetching notify logs from:', `${WELCOME_API}/notifyLogList`)

    const response = await fetch(`${WELCOME_API}/notifyLogList`, getFetchConfig('POST', requestBody))
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('[API] Notify logs response:', { count: data.data?.length || 0 })
    return data
  } catch (error) {
    console.error('[API] fetchNotifyLogs error:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch offline service categories from backend
 * Endpoint: POST /api/offlineServiceCategoryList (Welcome service - port 8005)
 */
export const fetchOfflineServiceCategories = async (offset = 0, parentId = null, search = '') => {
  try {
    const requestBody = {
      offset: offset
    }

    if (parentId !== null) {
      requestBody.parent_id = parentId
    }
    if (search) {
      requestBody.search = search
    }

    console.log('[API] Fetching offline service categories from:', `${WELCOME_API}/offlineServiceCategoryList`)

    const response = await fetch(`${WELCOME_API}/offlineServiceCategoryList`, getFetchConfig('POST', requestBody))
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('[API] Offline service categories response:', { count: data.data?.length || 0 })
    return data
  } catch (error) {
    console.error('[API] fetchOfflineServiceCategories error:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch offline service assigns from backend
 * Endpoint: POST /api/offlineServiceAssignList (Welcome service - port 8005)
 */
export const fetchOfflineServiceAssigns = async (offset = 0, categoryId = null, astrologerUniId = '') => {
  try {
    const requestBody = {
      offset: offset
    }

    if (categoryId !== null) {
      requestBody.offline_service_category_id = categoryId
    }
    if (astrologerUniId) {
      requestBody.astrologer_uni_id = astrologerUniId
    }

    console.log('[API] Fetching offline service assigns from:', `${WELCOME_API}/offlineServiceAssignList`)

    const response = await fetch(`${WELCOME_API}/offlineServiceAssignList`, getFetchConfig('POST', requestBody))
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('[API] Offline service assigns response:', { count: data.data?.length || 0 })
    return data
  } catch (error) {
    console.error('[API] fetchOfflineServiceAssigns error:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch offline service galleries from backend
 * Endpoint: POST /api/offlineServiceGalleryList (Welcome service - port 8005)
 */
export const fetchOfflineServiceGalleries = async (offset = 0, offlineServiceId = null) => {
  try {
    const requestBody = {
      offset: offset
    }

    if (offlineServiceId !== null) {
      requestBody.offline_service_id = offlineServiceId
    }

    console.log('[API] Fetching offline service galleries from:', `${WELCOME_API}/offlineServiceGalleryList`)

    const response = await fetch(`${WELCOME_API}/offlineServiceGalleryList`, getFetchConfig('POST', requestBody))
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('[API] Offline service galleries response:', { count: data.data?.length || 0 })
    return data
  } catch (error) {
    console.error('[API] fetchOfflineServiceGalleries error:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch offline service orders from backend
 * Endpoint: POST /api/offlineServiceOrderList (Welcome service - port 8005)
 */
export const fetchOfflineServiceOrders = async (offset = 0, orderStatus = '', paymentStatus = '') => {
  try {
    const user = getCurrentUser()
    const apiKey = getUserApiKey(user)
    const userId = user?.user_uni_id || user?.customer_uni_id || ''

    const requestBody = {
      api_key: apiKey || '',
      user_uni_id: userId || '',
      offset: offset
    }

    if (orderStatus) {
      requestBody.order_status = orderStatus
    }
    if (paymentStatus) {
      requestBody.payment_status = paymentStatus
    }

    console.log('[API] Fetching offline service orders from:', `${WELCOME_API}/offlineServiceOrderList`)

    const response = await fetch(`${WELCOME_API}/offlineServiceOrderList`, getFetchConfig('POST', requestBody))
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('[API] Offline service orders response:', { count: data.data?.length || 0 })
    return data
  } catch (error) {
    console.error('[API] fetchOfflineServiceOrders error:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch OpenAI predictions from backend
 * Endpoint: POST /api/openAiPredictionList (Welcome service - port 8005)
 */
export const fetchOpenAiPredictions = async (offset = 0, messageType = '') => {
  try {
    const user = getCurrentUser()
    const apiKey = getUserApiKey(user)
    const userId = user?.user_uni_id || user?.customer_uni_id || ''

    const requestBody = {
      api_key: apiKey || '',
      user_uni_id: userId || '',
      offset: offset
    }

    if (messageType) {
      requestBody.message_type = messageType
    }

    console.log('[API] Fetching OpenAI predictions from:', `${WELCOME_API}/openAiPredictionList`)

    const response = await fetch(`${WELCOME_API}/openAiPredictionList`, getFetchConfig('POST', requestBody))
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('[API] OpenAI predictions response:', { count: data.data?.length || 0 })
    return data
  } catch (error) {
    console.error('[API] fetchOpenAiPredictions error:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch OpenAI profiles from backend
 * Endpoint: POST /api/openAiProfileList (Welcome service - port 8005)
 */
export const fetchOpenAiProfiles = async (offset = 0) => {
  try {
    const user = getCurrentUser()
    const apiKey = getUserApiKey(user)
    const userId = user?.user_uni_id || user?.customer_uni_id || ''

    const requestBody = {
      api_key: apiKey || '',
      user_uni_id: userId || '',
      offset: offset
    }

    console.log('[API] Fetching OpenAI profiles from:', `${WELCOME_API}/openAiProfileList`)

    const response = await fetch(`${WELCOME_API}/openAiProfileList`, getFetchConfig('POST', requestBody))
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('[API] OpenAI profiles response:', { count: data.data?.length || 0 })
    return data
  } catch (error) {
    console.error('[API] fetchOpenAiProfiles error:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch orders from backend
 * Endpoint: POST /api/orderList (Welcome service - port 8005)
 */
export const fetchOrders = async (offset = 0, status = '', paymentStatus = '') => {
  try {
    const user = getCurrentUser()
    const apiKey = getUserApiKey(user)
    const userId = user?.user_uni_id || user?.customer_uni_id || ''

    const requestBody = {
      api_key: apiKey || '',
      user_uni_id: userId || '',
      offset: offset
    }

    if (status) {
      requestBody.status = status
    }
    if (paymentStatus) {
      requestBody.payment_status = paymentStatus
    }

    console.log('[API] Fetching orders from:', `${WELCOME_API}/orderList`)

    const response = await fetch(`${WELCOME_API}/orderList`, getFetchConfig('POST', requestBody))
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('[API] Orders response:', { count: data.data?.length || 0 })
    return data
  } catch (error) {
    console.error('[API] fetchOrders error:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch our services from backend
 * Endpoint: POST /api/ourServiceList (Welcome service - port 8005)
 */
export const fetchOurServices = async (offset = 0, slug = '') => {
  try {
    const requestBody = {
      offset: offset
    }

    if (slug) {
      requestBody.slug = slug
    }

    console.log('[API] Fetching our services from:', `${WELCOME_API}/ourServiceList`)

    const response = await fetch(`${WELCOME_API}/ourServiceList`, getFetchConfig('POST', requestBody))
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('[API] Our services response:', { count: data.data?.length || 0 })
    return data
  } catch (error) {
    console.error('[API] fetchOurServices error:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Fetch packages from backend
 * Endpoint: POST /api/packageList (Welcome service - port 8005)
 */
export const fetchPackages = async (offset = 0, packageType = '') => {
  try {
    const requestBody = {
      offset: offset
    }

    if (packageType) {
      requestBody.package_type = packageType
    }

    console.log('[API] Fetching packages from:', `${WELCOME_API}/packageList`)

    const response = await fetch(`${WELCOME_API}/packageList`, getFetchConfig('POST', requestBody))
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('[API] Packages response:', { count: data.data?.length || 0 })
    return data
  } catch (error) {
    console.error('[API] fetchPackages error:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Delete notification
 * Endpoint: POST /api/deleteNotification (Welcome service - port 8005)
 */
export const deleteNotification = async (notificationId) => {
  try {
    const user = getCurrentUser()
    const apiKey = getUserApiKey(user)
    const userId = user?.user_uni_id || user?.customer_uni_id || ''

    if (!apiKey || !userId) {
      return { status: 0, msg: 'Please login to continue' }
    }

    const requestBody = {
      api_key: apiKey,
      user_uni_id: userId,
      id: notificationId
    }

    const response = await fetch(`${WELCOME_API}/deleteNotification`, getFetchConfig('POST', requestBody))
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] deleteNotification error:', error)
    return { status: 0, msg: error.message }
  }
}

// ============================================
// COURSES APIs (Port 8005)
// ============================================

/**
 * Get courses list
 * Endpoint: POST /api/courseList (Welcome service - port 8005)
 */
export const fetchCourses = async (filters = {}) => {
  try {
    const user = getCurrentUser()
    const apiKey = getUserApiKey(user)
    const userId = user?.user_uni_id || user?.customer_uni_id || ''

    const requestBody = {
      api_key: apiKey || '',
      user_uni_id: userId || '',
      status: filters.status !== undefined ? filters.status : 1,
      offset: filters.offset || 0
    }

    const response = await fetch(`${WELCOME_API}/courseList`, getFetchConfig('POST', requestBody))
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] fetchCourses error:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Get purchased courses
 * Endpoint: POST /api/coursePurchaseList (Welcome service - port 8005)
 */
export const fetchMyCourses = async (offset = 0) => {
  try {
    const user = getCurrentUser()
    const apiKey = getUserApiKey(user)
    const userId = user?.user_uni_id || user?.customer_uni_id || ''

    if (!apiKey || !userId) {
      return { status: 0, data: [], msg: 'Please login to continue' }
    }

    const requestBody = {
      api_key: apiKey,
      user_uni_id: userId,
      offset: offset
    }

    const response = await fetch(`${WELCOME_API}/coursePurchaseList`, getFetchConfig('POST', requestBody))
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] fetchMyCourses error:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

// ============================================
// GIFT HISTORY APIs (Port 8005)
// ============================================

/**
 * Get user gift history (sent gifts)
 * Endpoint: POST /api/userGiftHistory (Welcome service - port 8005)
 */
export const fetchUserGiftHistory = async (offset = 0) => {
  try {
    const user = getCurrentUser()
    const apiKey = getUserApiKey(user)
    const userId = user?.user_uni_id || user?.customer_uni_id || ''

    if (!apiKey || !userId) {
      return { status: 0, data: [], msg: 'Please login to continue' }
    }

    const requestBody = {
      api_key: apiKey,
      user_uni_id: userId,
      offset: offset
    }

    const response = await fetch(`${WELCOME_API}/userGiftHistory`, getFetchConfig('POST', requestBody))
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] fetchUserGiftHistory error:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Get astrologer gift history (received gifts)
 * Endpoint: POST /api/astroGiftHistory (Welcome service - port 8005)
 */
export const fetchAstrologerGiftHistory = async (offset = 0) => {
  try {
    const user = getCurrentUser()
    const apiKey = getUserApiKey(user)
    const userId = user?.user_uni_id || ''

    if (!apiKey || !userId) {
      return { status: 0, data: [], msg: 'Please login to continue' }
    }

    const requestBody = {
      api_key: apiKey,
      user_uni_id: userId,
      offset: offset
    }

    const response = await fetch(`${WELCOME_API}/astroGiftHistory`, getFetchConfig('POST', requestBody))
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] fetchAstrologerGiftHistory error:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

// ============================================
// PREDEFINED MESSAGES APIs (Port 8007)
// ============================================

/**
 * Get predefined message categories
 * Endpoint: POST /api/getPredefinedMessageCategory (Product service - port 8007)
 */
export const fetchPredefinedMessageCategories = async () => {
  try {
    const user = getCurrentUser()
    const apiKey = getUserApiKey(user)
    const userId = user?.user_uni_id || ''

    const requestBody = {
      api_key: apiKey || '',
      user_uni_id: userId || ''
    }

    const response = await fetch(`${PRODUCT_API}/getPredefinedMessageCategory`, getFetchConfig('POST', requestBody))
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] fetchPredefinedMessageCategories error:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

/**
 * Get predefined messages
 * Endpoint: POST /api/getPredefinedMessages (Product service - port 8007)
 */
export const fetchPredefinedMessages = async (categoryId = '') => {
  try {
    const user = getCurrentUser()
    const apiKey = getUserApiKey(user)
    const userId = user?.user_uni_id || ''

    const requestBody = {
      api_key: apiKey || '',
      user_uni_id: userId || '',
      category_id: categoryId
    }

    const response = await fetch(`${PRODUCT_API}/getPredefinedMessages`, getFetchConfig('POST', requestBody))
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] fetchPredefinedMessages error:', error)
    return { status: 0, data: [], msg: error.message }
  }
}

// ============================================
// SUGGESTIONS APIs (Port 8005)
// ============================================

/**
 * Submit suggestion
 * Endpoint: POST /api/suggestionsRequest (Welcome service - port 8005)
 */
export const submitSuggestion = async (suggestionData) => {
  try {
    const user = getCurrentUser()
    const apiKey = getUserApiKey(user)
    const userId = user?.user_uni_id || user?.customer_uni_id || ''

    if (!apiKey || !userId) {
      return { status: 0, msg: 'Please login to continue' }
    }

    const requestBody = {
      api_key: apiKey,
      user_uni_id: userId,
      suggestion: suggestionData.suggestion,
      category: suggestionData.category || ''
    }

    const response = await fetch(`${WELCOME_API}/suggestionsRequest`, getFetchConfig('POST', requestBody))
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] submitSuggestion error:', error)
    return { status: 0, msg: error.message }
  }
}

/**
 * Get suggestion history
 * Endpoint: POST /api/getSuggestionHistory (Product service - port 8007)
 */
export const fetchSuggestionHistory = async (offset = 0) => {
  try {
    const user = getCurrentUser()
    const apiKey = getUserApiKey(user)
    const userId = user?.user_uni_id || user?.customer_uni_id || ''

    if (!apiKey || !userId) {
      return { status: 0, data: [], msg: 'Please login to continue' }
    }

    const requestBody = {
      api_key: apiKey,
      user_uni_id: userId,
      offset: offset
    }

    const response = await fetch(`${PRODUCT_API}/getSuggestionHistory`, getFetchConfig('POST', requestBody))
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('[API] fetchSuggestionHistory error:', error)
    return { status: 0, data: [], msg: error.message }
  }
}