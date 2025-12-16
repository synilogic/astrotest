import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useBreadStars from '../hooks/useBreadStars'
import usePageTitle from '../hooks/usePageTitle'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import LoginPopup from '../components/LoginPopup'
import { saveKundaliData, geocodePlace, getCurrentUser, fetchUserKundaliRequests } from '../utils/api'
import UserKundaliList from '../components/UserKundaliList'

const FreeKundali = () => {
  useBreadStars()
  usePageTitle('Free Kundali - Astrology Theme')
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    dateOfBirth: '',
    timeOfBirth: '',
    placeOfBirth: '',
    division: '',
    style: '',
    language: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [kundaliResult, setKundaliResult] = useState(null)
  const [user, setUser] = useState(getCurrentUser())
  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false)
  const [savedKundalis, setSavedKundalis] = useState([])
  const [loadingKundalis, setLoadingKundalis] = useState(false)

  // Check if user is logged in on mount and fetch saved kundalis
  useEffect(() => {
    const currentUser = getCurrentUser()
    
    // Check user authentication
    
    // Check for multiple possible field names (also check for empty strings)
    // Prioritize user_api_key over api_key (backend returns user_api_key)
    // Convert to string first before calling trim() to handle null/undefined/number
    const userApiKeyStr = currentUser?.user_api_key ? String(currentUser.user_api_key).trim() : '';
    const apiKeyStr = currentUser?.api_key ? String(currentUser.api_key).trim() : '';
    const apiKey = userApiKeyStr !== '' ? userApiKeyStr : (apiKeyStr !== '' ? apiKeyStr : '')
    const userId = currentUser?.user_uni_id || currentUser?.customer_uni_id
    const hasApiKey = apiKey && apiKey.trim() !== ''
    const hasUserId = userId && userId.trim() !== ''
    
    if (!currentUser || !hasApiKey || !hasUserId) {
      // Only open login popup if user is not logged in
      setIsLoginPopupOpen(true)
    } else {
      // Normalize user data
      const normalizedUser = {
        ...currentUser,
        api_key: currentUser.api_key || currentUser.user_api_key || '',
        user_uni_id: currentUser.user_uni_id || currentUser.customer_uni_id || ''
      }
      // User is logged in, set user state and fetch saved kundalis
      setUser(normalizedUser)
      fetchSavedKundalis(normalizedUser)
      setIsLoginPopupOpen(false) // Ensure popup is closed
    }
  }, [])

  // Fetch saved kundalis from backend
  const fetchSavedKundalis = async (userData) => {
    if (!userData || !userData.api_key || !userData.user_uni_id) return
    
    setLoadingKundalis(true)
    try {
      // Don't send kundali_method to fetch all kundalis regardless of method
      const result = await fetchUserKundaliRequests({
        api_key: userData.api_key,
        user_uni_id: userData.user_uni_id,
        kundali_type: 'kundli', // Only fetch single kundlis, not matching
        kundali_method: '', // Empty string to fetch all methods
        offset: 0
      })
      
      console.log('[FreeKundali] Fetched saved kundalis:', {
        status: result.status,
        count: Array.isArray(result.data) ? result.data.length : 0,
        msg: result.msg
      })
      
      if (result.status === 1 && Array.isArray(result.data)) {
        setSavedKundalis(result.data)
      } else {
        setSavedKundalis([])
      }
    } catch (err) {
      console.error('[FreeKundali] Error fetching saved kundalis:', err)
      setSavedKundalis([])
    } finally {
      setLoadingKundalis(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear errors when user starts typing (but not login-related errors)
    if (error && !error.includes('login')) setError('')
    if (success) setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setKundaliResult(null)

    // Validation
    if (!formData.dateOfBirth || !formData.timeOfBirth || !formData.placeOfBirth || !formData.division || !formData.style || !formData.language) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)

    try {
      // Always check current user from localStorage (state might be stale)
      const currentUser = getCurrentUser()
      
      // Check if user exists and has required fields (check multiple possible field names)
      // Also check for empty strings
      // Prioritize user_api_key over api_key (backend returns user_api_key)
      const apiKey = (currentUser?.user_api_key && currentUser.user_api_key.trim() !== '') 
        ? currentUser.user_api_key 
        : ((currentUser?.api_key && currentUser.api_key.trim() !== '') ? currentUser.api_key : '')
      const userId = currentUser?.user_uni_id || currentUser?.customer_uni_id
      const hasApiKey = apiKey && apiKey.trim() !== ''
      const hasUserId = userId && userId.trim() !== ''
      
      // Debug: Log full user object (mask sensitive data)
      if (currentUser) {
        const debugInfo = {
          hasUser: true,
          hasApiKey: !!hasApiKey,
          hasUserId: !!hasUserId,
          api_key_present: !!currentUser.api_key,
          user_api_key_present: !!currentUser.user_api_key,
          user_uni_id_present: !!currentUser.user_uni_id,
          customer_uni_id_present: !!currentUser.customer_uni_id,
          allKeys: Object.keys(currentUser),
          // Show actual values (masked) for debugging
          api_key_value: currentUser.api_key ? '***' + currentUser.api_key.slice(-4) : 'MISSING',
          user_api_key_value: currentUser.user_api_key ? '***' + currentUser.user_api_key.slice(-4) : 'MISSING',
          user_uni_id_value: currentUser.user_uni_id || 'MISSING',
          customer_uni_id_value: currentUser.customer_uni_id || 'MISSING',
          name: currentUser.name || 'MISSING',
          phone: currentUser.phone || currentUser.mobile || 'MISSING'
        }
        console.log('[FreeKundali] User check:', JSON.stringify(debugInfo, null, 2))
      } else {
        console.warn('[FreeKundali] No user found in localStorage')
      }
      
      if (!currentUser || !hasApiKey || !hasUserId) {
        const validationError = {
          currentUser: currentUser ? 'EXISTS' : 'NULL',
          hasApiKey,
          hasUserId,
          api_key: currentUser?.api_key ? 'EXISTS' : 'MISSING',
          user_api_key: currentUser?.user_api_key ? 'EXISTS' : 'MISSING',
          user_uni_id: currentUser?.user_uni_id ? 'EXISTS' : 'MISSING',
          customer_uni_id: currentUser?.customer_uni_id ? 'EXISTS' : 'MISSING',
          allUserKeys: currentUser ? Object.keys(currentUser) : []
        }
        console.error('[FreeKundali] User validation failed - showing login popup', JSON.stringify(validationError, null, 2))
        setIsLoginPopupOpen(true)
        // Don't set error message here - let login popup handle it
        setLoading(false)
        return
      }
      
      // Normalize user data to ensure we have the right field names
      const normalizedUser = {
        ...currentUser,
        api_key: currentUser.api_key || currentUser.user_api_key || '',
        user_uni_id: currentUser.user_uni_id || currentUser.customer_uni_id || '',
        name: currentUser.name || '',
        gender: currentUser.gender || ''
      }
      
      // Update user state if it's different
      if (!user || (user.user_uni_id !== normalizedUser.user_uni_id && user.customer_uni_id !== normalizedUser.user_uni_id)) {
        setUser(normalizedUser)
      }
      
      // Debug: Confirm we have valid user data
      console.log('[FreeKundali] Proceeding with kundali generation for user:', normalizedUser.user_uni_id || normalizedUser.customer_uni_id)

      // Geocode place to get coordinates
      const geocodeResult = await geocodePlace(formData.placeOfBirth)
      if (!geocodeResult || !geocodeResult.lat || !geocodeResult.lon) {
        setError('Could not find coordinates for the birth place. Please enter a more specific location.')
        setLoading(false)
        return
      }

      // Format date and time
      // Ensure date is in YYYY-MM-DD format
      const dob = formData.dateOfBirth
      // Ensure time is in HH:mm:ss format (backend expects this format)
      let tob = formData.timeOfBirth
      if (tob) {
        // If time is in HH:mm format, convert to HH:mm:ss
        if (tob.split(':').length === 2) {
          tob = `${tob}:00` // Add seconds
        }
        // If already in HH:mm:ss format, use as is
        // If no colon, it's invalid, but let backend handle validation
      }

      // Map division to kundali_method
      const divisionMap = {
        'd1': 'd1',
        'd9': 'd9',
        'd10': 'd10',
        'd12': 'd12',
        'd16': 'd16',
        'd20': 'd20'
      }

      const kundaliMethod = divisionMap[formData.division] || 'd1'

      // Prepare kundali data (use normalizedUser to ensure correct field names)
      const kundaliData = {
        api_key: normalizedUser.api_key,
        user_uni_id: normalizedUser.user_uni_id,
        name: normalizedUser.name || 'User',
        dob: dob,
        tob: tob,
        lat: geocodeResult.lat.toString(),
        lon: geocodeResult.lon.toString(),
        timezone: 'Asia/Kolkata', // Default to IST, can be enhanced
        place: formData.placeOfBirth,
        gender: normalizedUser.gender || '',
        kundali_method: kundaliMethod,
        kundali_type: 'kundli',
        language: formData.language
      }

      // Debug: Log the data being sent
      console.log('[FreeKundali] Sending kundali data:', {
        ...kundaliData,
        api_key: kundaliData.api_key ? '***' : 'MISSING',
        user_uni_id: kundaliData.user_uni_id || 'MISSING'
      })

      // Call backend API
      const result = await saveKundaliData(kundaliData)
      
      // Debug: Log the response
      console.log('[FreeKundali] API Response:', result)

      if (result.status === 1) {
        setSuccess('Kundali generated successfully!')
        setKundaliResult(result)
        // Refresh saved kundalis list (use normalizedUser)
        await fetchSavedKundalis(normalizedUser)
        // Don't reset form - let user see the result
        // Form will be reset only if user wants to generate another kundali
        
        // Scroll to result after a short delay to ensure DOM is updated
        setTimeout(() => {
          // Find the result div by looking for the success message
          const headings = Array.from(document.querySelectorAll('h3'))
          const successHeading = headings.find(h => h.textContent && h.textContent.includes('Kundali Generated Successfully'))
          if (successHeading) {
            successHeading.closest('div')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 300)
      } else {
        // Show detailed error message
        const errorMsg = result.msg || result.message || 'Failed to generate kundali. Please try again.'
        const errorDetails = result.errors ? `\nDetails: ${JSON.stringify(result.errors)}` : ''
        setError(`${errorMsg}${errorDetails}`)
        console.error('[FreeKundali] Error response:', result)
      }
    } catch (err) {
      const errorMessage = err.message || 'An error occurred. Please try again.'
      setError(errorMessage)
      console.error('[FreeKundali] Exception:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="react-body-kundliPage">
      <Navbar />

      <section className="react-new-bread-hero-container">
        <div className="react-new-bread-hero-bg-pattern"></div>
        <div className="react-new-bread-hero-stars" id="react-new-bread-stars-container"></div>
        <div className="react-new-bread-hero-content">
          <div className="react-new-bread-astrology-icon">
            <i className="fas fa-star-and-crescent"></i>
          </div>
          <h1 className="react-new-bread-hero-title">Free Kundli</h1>
          <div className="react-new-bread-breadcrumbs">
            <a href="#">Home</a>
            <span className="react-new-bread-breadcrumb-separator">/</span>
            <span>Free Kundli</span>
          </div>
        </div>
      </section>

      <div className="react-free-Kundli-floating-element react-free-Kundli-float-1"></div>
      <div className="react-free-Kundli-floating-element react-free-Kundli-float-2"></div>
      <div className="react-free-Kundli-floating-element react-free-Kundli-float-3"></div>
      <div className="react-free-Kundli-floating-element react-free-Kundli-float-4"></div>

      <div className="container">
        <div className="react-free-Kundli-container">
          <div className="react-free-Kundli-header">
            <div className="react-free-Kundli-icon-wrapper">
              <div className="react-free-Kundli-icon-blur"></div>
              <div className="react-free-Kundli-icon-container">
                <svg className="react-free-Kundli-main-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
              </div>
            </div>
            <h1 className="react-free-Kundli-main-title">Free Kundali</h1>
            <div className="react-free-Kundli-title-divider"></div>
          </div>

          <div className="react-free-Kundli-main-card">
            <div className="react-free-Kundli-card-header">
              <div className="react-free-Kundli-header-icons">
                <div className="react-free-Kundli-header-icon-wrapper">
                  <svg className="react-free-Kundli-header-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <div className="react-free-Kundli-header-icon-wrapper">
                  <svg className="react-free-Kundli-header-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div className="react-free-Kundli-header-icon-wrapper">
                  <svg className="react-free-Kundli-header-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 111.314 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                </div>
              </div>
              <h2 className="react-free-Kundli-card-title">Your Birth Information</h2>
              <p className="react-free-Kundli-card-description">Please provide accurate details for precise astrological calculations</p>
            </div>

            <div className="react-free-Kundli-card-content">
              <form id="divineForm" onSubmit={handleSubmit}>
                {/* Error Message - Only show if login popup is not open */}
                {error && !isLoginPopupOpen && (
                  <div style={{
                    padding: '12px 16px',
                    marginBottom: '20px',
                    backgroundColor: '#fee',
                    border: '1px solid #fcc',
                    borderRadius: '8px',
                    color: '#c33',
                    fontSize: '14px'
                  }}>
                    {error}
                  </div>
                )}

                {/* Success Message */}
                {success && (
                  <div style={{
                    padding: '12px 16px',
                    marginBottom: '20px',
                    backgroundColor: '#efe',
                    border: '1px solid #cfc',
                    borderRadius: '8px',
                    color: '#3c3',
                    fontSize: '14px'
                  }}>
                    {success}
                  </div>
                )}

                <div className="react-free-Kundli-form-grid">
                  <div className="react-free-Kundli-form-column">
                    <div className="react-free-Kundli-form-group">
                      <label htmlFor="dateOfBirth" className="react-free-Kundli-form-label">
                        <span><i className="fas fa-calendar react-free-Kundli-label-icon"></i></span>
                        Date of Birth
                      </label>
                      <input 
                        type="date" 
                        id="dateOfBirth" 
                        name="dateOfBirth" 
                        className="react-free-Kundli-form-input" 
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        required 
                      />
                    </div>
                    <div className="react-free-Kundli-form-group">
                      <label htmlFor="timeOfBirth" className="react-free-Kundli-form-label">
                        <span><i className="fas fa-clock react-free-Kundli-label-icon"></i></span>
                        Time of Birth
                      </label>
                      <input 
                        type="time" 
                        id="timeOfBirth" 
                        name="timeOfBirth" 
                        className="react-free-Kundli-form-input" 
                        value={formData.timeOfBirth}
                        onChange={handleInputChange}
                        required 
                      />
                    </div>
                    <div className="react-free-Kundli-form-group">
                      <label htmlFor="placeOfBirth" className="react-free-Kundli-form-label">
                        <span><i className="fas fa-location-dot react-free-Kundli-label-icon"></i></span>
                        Place of Birth
                      </label>
                      <input 
                        type="text" 
                        id="placeOfBirth" 
                        name="placeOfBirth" 
                        className="react-free-Kundli-form-input" 
                        placeholder="Enter your birth city, state, country" 
                        value={formData.placeOfBirth}
                        onChange={handleInputChange}
                        required 
                      />
                    </div>
                  </div>
                  <div className="react-free-Kundli-form-column">
                    <div className="react-free-Kundli-form-group">
                      <label htmlFor="division" className="react-free-Kundli-form-label"><span><i className="fas fa-compass react-free-Kundli-label-icon"></i> </span>Chart Division</label>
                      <select 
                        id="division" 
                        name="division" 
                        className="react-free-Kundli-form-select" 
                        value={formData.division}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select chart division</option>
                        <option value="d1">D1 - Rashi Chart (Main Chart)</option>
                        <option value="d9">D9 - Navamsa (Marriage & Spirituality)</option>
                        <option value="d10">D10 - Dasamsa (Career & Profession)</option>
                        <option value="d12">D12 - Dwadasamsa (Parents)</option>
                        <option value="d16">D16 - Shodasamsa (Vehicles)</option>
                        <option value="d20">D20 - Vimsamsa (Spiritual Practices)</option>
                      </select>
                    </div>
                    <div className="react-free-Kundli-form-group">
                      <label htmlFor="style" className="react-free-Kundli-form-label"><span><i className="fas fa-th-large react-free-Kundli-label-icon"></i></span>Chart Style</label>
                      <select 
                        id="style" 
                        name="style" 
                        className="react-free-Kundli-form-select" 
                        value={formData.style}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Choose your preferred style</option>
                        <option value="north">North Indian Style</option>
                        <option value="south">South Indian Style</option>
                        <option value="east">East Indian Style</option>
                        <option value="western">Western Astrology Style</option>
                      </select>
                    </div>
                    <div className="react-free-Kundli-form-group">
                      <label htmlFor="language" className="react-free-Kundli-form-label"><span><i className="fas fa-language react-free-Kundli-label-icon"></i></span>Preferred Language</label>
                      <select 
                        id="language" 
                        name="language" 
                        className="react-free-Kundli-form-select" 
                        value={formData.language}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select your language</option>
                        <option value="english">English</option>
                        <option value="hindi">हिंदी (Hindi)</option>
                        <option value="sanskrit">संस्कृत (Sanskrit)</option>
                        <option value="tamil">தமிழ் (Tamil)</option>
                        <option value="telugu">తెలుగు (Telugu)</option>
                        <option value="kannada">ಕನ್ನಡ (Kannada)</option>
                        <option value="malayalam">മലയാളം (Malayalam)</option>
                        <option value="gujarati">ગુજરાતી (Gujarati)</option>
                        <option value="marathi">मराठी (Marathi)</option>
                      </select>
                    </div>
                  </div>
                </div>
                <button 
                  type="submit" 
                  className="react-free-Kundli-generate-btn"
                  disabled={loading}
                  style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                >
                  {loading ? 'Generating...' : 'Generate My Divine Kundali'}
                  <svg className="react-free-Kundli-btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                  </svg>
                </button>
                <div className="react-free-Kundli-info-cards">
                  <div className="react-free-Kundli-info-card">
                    <div className="react-free-Kundli-info-icon">✓</div>
                    <p className="react-free-Kundli-info-text">100% Accurate</p>
                  </div>
                  <div className="react-free-Kundli-info-card">
                    <div className="react-free-Kundli-info-icon"><i className="fas fa-lock"></i></div>
                    <p className="react-free-Kundli-info-text">Privacy Protected</p>
                  </div>
                  <div className="react-free-Kundli-info-card">
                    <div className="react-free-Kundli-info-icon"><i className="fas fa-bolt"></i></div>
                    <p className="react-free-Kundli-info-text">Instant Results</p>
                  </div>
                </div>
              </form>

              {/* Kundali Result Display */}
              {kundaliResult && (
                <div style={{
                  marginTop: '30px',
                  padding: '20px',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '12px',
                  border: '2px solid #28a745',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}>
                  <h3 style={{ marginBottom: '15px', color: '#28a745', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="fas fa-check-circle" style={{ fontSize: '24px' }}></i>
                    Kundali Generated Successfully!
                  </h3>
                  {kundaliResult.user_data && (
                    <div style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                      <p><strong>Name:</strong> {kundaliResult.user_data.name || 'N/A'}</p>
                      <p><strong>Email:</strong> {kundaliResult.user_data.email || 'N/A'}</p>
                    </div>
                  )}
                  <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#d4edda', borderRadius: '8px' }}>
                    <p style={{ color: '#155724', margin: 0, fontWeight: '500', marginBottom: '12px' }}>
                      <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
                      Your kundali has been saved successfully!
                    </p>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                      <button
                        onClick={() => navigate('/customer-dashboard', { state: { activeTab: 'kundlis' } })}
                        style={{
                          padding: '10px 20px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <i className="fas fa-tachometer-alt"></i>
                        View in Dashboard
                      </button>
                      <button
                        onClick={() => {
                          // Scroll to saved kundalis list with delay to ensure DOM is updated
                          setTimeout(() => {
                            // First try to find by ID (most reliable)
                            const savedListContainer = document.getElementById('saved-kundalis-list')
                            if (savedListContainer) {
                              savedListContainer.scrollIntoView({ behavior: 'smooth', block: 'start' })
                              return
                            }
                            
                            // Fallback: Try to find by class or heading
                            const savedList = document.querySelector('.react-table-responsive')
                            if (savedList) {
                              savedList.scrollIntoView({ behavior: 'smooth', block: 'start' })
                              return
                            }
                            
                            // Last resort: Find by heading text
                            const headings = Array.from(document.querySelectorAll('h3'))
                            const savedKundalisHeading = headings.find(h => h.textContent && h.textContent.includes('My Saved Kundalis'))
                            if (savedKundalisHeading) {
                              savedKundalisHeading.scrollIntoView({ behavior: 'smooth', block: 'start' })
                            }
                          }, 150) // Small delay to ensure DOM is updated
                        }}
                        style={{
                          padding: '10px 20px',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <i className="fas fa-list"></i>
                        View Saved List Below
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Saved Kundalis List */}
              {user && (
                <div id="saved-kundalis-list" style={{ marginTop: '30px' }}>
                  <UserKundaliList forId={user.user_uni_id || user.customer_uni_id} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <LoginPopup 
        isOpen={isLoginPopupOpen} 
        onClose={() => {
          setIsLoginPopupOpen(false)
          // Clear error when closing popup
          setError('')
        }} 
        onLoginSuccess={(userData) => {
          // Normalize user data
          const normalizedUser = {
            ...userData,
            api_key: userData.api_key || userData.user_api_key || '',
            user_uni_id: userData.user_uni_id || userData.customer_uni_id || ''
          }
          setUser(normalizedUser)
          setIsLoginPopupOpen(false)
          fetchSavedKundalis(normalizedUser)
          // Clear any errors after successful login
          setError('')
          setSuccess('Login successful! You can now generate kundali.')
        }} 
      />
      <Footer />
    </div>
  )
}

export default FreeKundali


