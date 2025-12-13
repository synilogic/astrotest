import React, { useState, useEffect, useRef } from 'react'
import useLocalAuth from '../hooks/useLocalAuth'
import { sendOTP, customerLogin, vendorLogin, fetchWelcomeData, fetchPublicCountryList } from '../utils/api'

// Get base URL for pages (remove /api from WELCOME_API)
const getPagesBaseUrl = () => {
  const welcomeApi = import.meta.env.VITE_WELCOME_API || 'http://localhost:8005/api'
  return welcomeApi.replace('/api', '')
}

const LoginPopup = ({ isOpen, onClose }) => {
  const { login } = useLocalAuth()
  const [userType, setUserType] = useState('Customer')
  const [mobileNumber, setMobileNumber] = useState('')
  const [isAgreed, setIsAgreed] = useState(false)
  const [otp, setOtp] = useState('')
  const [showOtp, setShowOtp] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [error, setError] = useState('')
  const [otplessOrderId, setOtplessOrderId] = useState('')
  const [receivedOtp, setReceivedOtp] = useState('') // Store OTP received from backend
  const [countryCode, setCountryCode] = useState('+91')
  const [countryName, setCountryName] = useState('India')
  const [countries, setCountries] = useState([])
  const [filteredCountries, setFilteredCountries] = useState([])
  const [countrySearch, setCountrySearch] = useState('')
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState(null)
  const countryDropdownRef = useRef(null)
  const overlayRef = useRef(null)

  // Get flag emoji from country code
  const getFlagEmoji = (code) => {
    const flagMap = {
      '+91': '🇮🇳', '+1': '🇺🇸', '+44': '🇬🇧', '+61': '🇦🇺', '+86': '🇨🇳',
      '+81': '🇯🇵', '+82': '🇰🇷', '+33': '🇫🇷', '+49': '🇩🇪', '+39': '🇮🇹',
      '+34': '🇪🇸', '+7': '🇷🇺', '+971': '🇦🇪', '+966': '🇸🇦', '+65': '🇸🇬',
      '+60': '🇲🇾', '+62': '🇮🇩', '+66': '🇹🇭', '+84': '🇻🇳', '+63': '🇵🇭',
      '+92': '🇵🇰', '+880': '🇧🇩', '+94': '🇱🇰', '+977': '🇳🇵'
    }
    return flagMap[code] || '🌍'
  }

  // Fetch country code, country name, and country list from backend
  useEffect(() => {
    const loadCountryData = async () => {
      try {
        // Fetch default country and country list in parallel
        const [welcomeRes, countryListRes] = await Promise.all([
          fetchWelcomeData(),
          fetchPublicCountryList()
        ])

        // Set default country
        if (welcomeRes && welcomeRes.status === 1 && welcomeRes.data) {
          const defaultCode = welcomeRes.data.default_country_code || '+91'
          const defaultName = welcomeRes.data.default_country_name || 'India'
          setCountryCode(defaultCode)
          setCountryName(defaultName)
        }

        // Set country list
        console.log('[LoginPopup] Country list response:', {
          status: countryListRes?.status,
          dataLength: countryListRes?.data?.length,
          msg: countryListRes?.msg,
          fullResponse: countryListRes
        })
        
        if (countryListRes && countryListRes.status === 1 && Array.isArray(countryListRes.data) && countryListRes.data.length > 0) {
          const countryList = countryListRes.data.map(country => ({
            id: country.id,
            name: country.nicename || country.name,
            code: `+${country.phonecode}`,
            iso: country.iso,
            iso3: country.iso3
          }))
          console.log('[LoginPopup] Processed country list:', countryList.length, 'countries')
          console.log('[LoginPopup] First 3 countries:', countryList.slice(0, 3))
          setCountries(countryList)
          setFilteredCountries(countryList)

          // Set selected country based on default
          const defaultCode = welcomeRes?.data?.default_country_code || '+91'
          const found = countryList.find(c => c.code === defaultCode)
          if (found) {
            setSelectedCountry(found)
            console.log('[LoginPopup] Selected default country:', found)
          } else {
            console.warn('[LoginPopup] Default country not found in list:', defaultCode)
          }
        } else {
          console.warn('[LoginPopup] Country list not loaded properly:', {
            hasResponse: !!countryListRes,
            status: countryListRes?.status,
            hasData: !!countryListRes?.data,
            dataIsArray: Array.isArray(countryListRes?.data),
            dataLength: countryListRes?.data?.length,
            msg: countryListRes?.msg
          })
        }
      } catch (error) {
        console.error('[LoginPopup] Error fetching country data:', error)
        // Use defaults if fetch fails
      }
    }

    if (isOpen) {
      loadCountryData()
    }
  }, [isOpen])

  // Close country dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        // Check if click is on the country code selector itself
        const countryCodeElement = event.target.closest('.react-login-country-code')
        if (!countryCodeElement) {
          setShowCountryDropdown(false)
        }
      }
    }

    if (showCountryDropdown) {
      // Use setTimeout to avoid immediate closure
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 100)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCountryDropdown])

  // Handle popup open/close with smooth transitions
  useEffect(() => {
    if (overlayRef.current) {
      if (isOpen) {
        overlayRef.current.style.display = 'flex'
        requestAnimationFrame(() => {
          overlayRef.current.classList.add('react-login-show')
        })
      } else {
        overlayRef.current.classList.remove('react-login-show')
        setTimeout(() => {
          overlayRef.current.style.display = 'none'
        }, 400) // Match CSS transition duration
      }
    }
  }, [isOpen])

  // Handle escape key to close popup
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // Handle overlay click to close popup
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!mobileNumber || !isAgreed) {
      setError('Please fill in all required fields and agree to terms.')
      return
    }

    // Validate mobile number (should be 10 digits)
    const cleanMobile = mobileNumber.replace(/\D/g, '')
    if (cleanMobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.')
      return
    }

    setIsSendingOtp(true)

    try {
      // Format phone number with country code
      const fullPhone = `${countryCode}${cleanMobile}`
      
      // Call backend API to send OTP
      const result = await sendOTP(fullPhone, countryCode)

      if (result.status === 1) {
        // OTP sent successfully
        setOtplessOrderId(result.otpless_orderId || '')
        // Store OTP from backend response (for testing/display purposes)
        if (result.data && result.data.otp) {
          setReceivedOtp(result.data.otp)
          console.log('[LoginPopup] OTP received from backend:', result.data.otp)
        }
        setShowOtp(true)
        setError('')
      } else {
        setError(result.msg || 'Failed to send OTP. Please try again.')
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setIsSendingOtp(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!otp) {
      setError('Please enter the OTP.')
      return
    }

    // Validate OTP length
    if (otp.length < 4 || otp.length > 6) {
      setError('Please enter a valid OTP.')
      return
    }
    
    setIsVerifying(true)

    try {
      const cleanMobile = mobileNumber.replace(/\D/g, '')
      const fullPhone = `${countryCode}${cleanMobile}`

      console.log('[LoginPopup] ===== OTP Verification Request =====')
      console.log('[LoginPopup] User Type:', userType)
      console.log('[LoginPopup] Mobile Number (raw):', mobileNumber)
      console.log('[LoginPopup] Clean Mobile:', cleanMobile)
      console.log('[LoginPopup] Country Code:', countryCode)
      console.log('[LoginPopup] Full Phone:', fullPhone)
      console.log('[LoginPopup] OTP entered:', otp)
      console.log('[LoginPopup] OTP type:', typeof otp)
      console.log('[LoginPopup] OTP length:', otp ? String(otp).length : 0)
      console.log('[LoginPopup] OTP trimmed:', String(otp || '').trim())

      let result

      if (userType === 'Customer') {
        // Customer login
        console.log('[LoginPopup] Calling customerLogin API...')
        result = await customerLogin({
          phone: fullPhone,
          otp: String(otp || '').trim(), // Ensure OTP is string and trimmed
          country_code: countryCode,
          country_name: countryName,
          otpless_orderId: otplessOrderId,
          referral_code: ''
        })
      } else {
        // Vendor login
        console.log('[LoginPopup] Calling vendorLogin API...')
        result = await vendorLogin({
          phone: fullPhone,
          otp: String(otp || '').trim(), // Ensure OTP is string and trimmed
          country_code: countryCode,
          country_name: countryName,
          otpless_orderId: otplessOrderId,
          referral_code: ''
        })
      }
      
      console.log('[LoginPopup] API Response received:', {
        status: result.status,
        msg: result.msg,
        hasData: !!result.data
      })

      // Debug: Log full response
      console.log('[LoginPopup] ===== Login Response =====')
      console.log('[LoginPopup] Full result:', result)
      console.log('[LoginPopup] Status:', result.status)
      console.log('[LoginPopup] Has data:', !!result.data)
      console.log('[LoginPopup] Data type:', typeof result.data)
      console.log('[LoginPopup] Message:', result.msg)
      
      if (result.status === 1 && result.data) {
        // Login successful - prepare user data
        const userData = result.data
        
        // Debug: Log backend response to see what we're getting
        console.log('[LoginPopup] Backend response data keys:', Object.keys(userData))
        console.log('[LoginPopup] Backend response - user_api_key present:', !!userData.user_api_key)
        console.log('[LoginPopup] Backend response - api_key present:', !!userData.api_key)
        console.log('[LoginPopup] Full userData:', userData)
        
        // Format user data for local storage
        // Backend returns user_api_key, so we need to map it to api_key for consistency
        // Check for non-empty values (not just truthy, but actual non-empty strings)
        // CRITICAL: Extract API key EXACTLY as received from backend
        // Backend sends it as a STRING - we must preserve it exactly
        let apiKey = null;
        
        // CRITICAL: Use EXACT API key from backend response (NO trimming, NO conversion, use as-is)
        // Backend returns it as a string - we must preserve it exactly
        
        // Check user_api_key first (primary field from backend)
        if (userData.user_api_key) {
          if (typeof userData.user_api_key === 'string') {
            // Use EXACT value - don't trim (backend already sends it correctly)
            apiKey = userData.user_api_key;
          } else if (typeof userData.user_api_key === 'object' && userData.user_api_key !== null) {
            // If it's an object, try to extract the api_key property
            if (userData.user_api_key.api_key && typeof userData.user_api_key.api_key === 'string') {
              apiKey = userData.user_api_key.api_key; // Use exact value, no trim
            } else {
              console.error('[LoginPopup] ❌ user_api_key is object but no api_key property:', userData.user_api_key);
            }
          }
        }
        
        // Fallback to api_key if user_api_key didn't work
        if (!apiKey && userData.api_key) {
          if (typeof userData.api_key === 'string') {
            // Use EXACT value - don't trim (backend already sends it correctly)
            apiKey = userData.api_key;
          } else if (typeof userData.api_key === 'object' && userData.api_key !== null) {
            if (userData.api_key.api_key && typeof userData.api_key.api_key === 'string') {
              apiKey = userData.api_key.api_key; // Use exact value, no trim
            } else {
              console.error('[LoginPopup] ❌ api_key is object but no api_key property:', userData.api_key);
            }
          }
        }
        
        // Validate API key
        if (!apiKey || apiKey === '') {
          console.error('[LoginPopup] ❌ API key is missing or empty in backend response:', {
            user_api_key: userData.user_api_key,
            user_api_key_type: typeof userData.user_api_key,
            api_key: userData.api_key,
            api_key_type: typeof userData.api_key,
            allKeys: Object.keys(userData)
          })
          setError('Login failed: API key not received from server. Please try again.')
          setIsVerifying(false)
          return
        }
        
        // Log the EXACT API key we're storing (for debugging)
        console.log('[LoginPopup] ✅ Extracted API key from backend:', {
          api_key: apiKey,
          length: apiKey.length,
          preview: `${apiKey.substring(0, 15)}...${apiKey.substring(apiKey.length - 15)}`,
          full_key: apiKey // Log full key to verify it matches database
        })
        
        // Handle vendor image vs customer image
        const profileImage = userType === 'Vendor' 
          ? (userData.vendor?.vendor_image || '')
          : (userData.customer_img || '')
        
        // CRITICAL: Store API key EXACTLY as received from backend (NO conversion, NO String(), use as-is)
        // Backend returns it as a string - we must use it exactly as returned
        const formattedUserData = {
          // CRITICAL: For customers, user_uni_id and customer_uni_id are the same
          // Backend now returns user_uni_id in response, but we handle both for compatibility
          user_uni_id: userData.user_uni_id || userData.customer_uni_id || '',
          customer_uni_id: userData.customer_uni_id || userData.user_uni_id || '', // Also store for compatibility
          name: userData.name || userData.customer_name || '',
          email: userData.email || userData.customer_email || '',
          phone: userData.phone || mobileNumber,
          mobile: mobileNumber,
          type: userType,
          api_key: apiKey, // Use EXACT value from backend (already trimmed string)
          user_api_key: apiKey, // Use EXACT value from backend (already trimmed string)
          customer_img: profileImage, // For vendors, this will be vendor_image
          vendor_image: userType === 'Vendor' ? profileImage : '', // Also store vendor_image separately
          role_id: userData.role_id || (userType === 'Customer' ? 2 : 3),
          // Store vendor-specific data if it's a vendor
          ...(userType === 'Vendor' && userData.vendor ? {
            vendor: {
              firm_name: userData.vendor.firm_name || '',
              gst_no: userData.vendor.gst_no || '',
              city: userData.vendor.city || '',
              state: userData.vendor.state || '',
              country: userData.vendor.country || '',
              address: userData.vendor.address || '',
              pin_code: userData.vendor.pin_code || ''
            },
            currency_code: userData.currency_code || 'INR',
            currency_symbol: userData.currency_symbol || '₹'
          } : {})
        }
        
        // CRITICAL: Verify API key is a string before storing
        if (typeof formattedUserData.api_key !== 'string' || typeof formattedUserData.user_api_key !== 'string') {
          console.error('[LoginPopup] ❌ CRITICAL: API key is not a string before storing!', {
            api_key_type: typeof formattedUserData.api_key,
            api_key_value: formattedUserData.api_key,
            user_api_key_type: typeof formattedUserData.user_api_key,
            user_api_key_value: formattedUserData.user_api_key
          });
          setError('Login failed: API key format error. Please try again.')
          setIsVerifying(false)
          return
        }
        
        console.log('[LoginPopup] ✅ Storing user data with API key:', {
          user_uni_id: formattedUserData.user_uni_id,
          api_key: formattedUserData.api_key,
          api_key_type: typeof formattedUserData.api_key,
          api_key_length: formattedUserData.api_key.length,
          api_key_preview: `${formattedUserData.api_key.substring(0, 15)}...${formattedUserData.api_key.substring(formattedUserData.api_key.length - 15)}`,
          full_api_key: formattedUserData.api_key, // Log full key to verify
          allKeys: Object.keys(formattedUserData)
        })

        // Save to localStorage via login hook
        login(formattedUserData)
        
        // Close popup and reset form
        onClose()
        setMobileNumber('')
        setOtp('')
        setShowOtp(false)
        setIsAgreed(false)
        setOtplessOrderId('')
        setError('')
      } else {
        console.error('[LoginPopup] ❌ Login failed:', {
          status: result.status,
          hasData: !!result.data,
          msg: result.msg,
          fullResult: result
        })
        setError(result.msg || 'Invalid OTP. Please try again.')
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleCountrySelect = (country) => {
    setSelectedCountry(country)
    setCountryCode(country.code)
    setCountryName(country.name)
    setShowCountryDropdown(false)
    setCountrySearch('')
    setFilteredCountries(countries)
  }

  const handleCountrySearch = (searchTerm) => {
    setCountrySearch(searchTerm)
    if (!searchTerm.trim()) {
      setFilteredCountries(countries)
    } else {
      const filtered = countries.filter(country => 
        country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.code.includes(searchTerm) ||
        country.iso?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredCountries(filtered)
    }
  }

  const handleClose = () => {
    // Reset form when closing
    setMobileNumber('')
    setOtp('')
    setShowOtp(false)
    setIsAgreed(false)
    setIsVerifying(false)
    setIsSendingOtp(false)
    setError('')
    setOtplessOrderId('')
    setShowCountryDropdown(false)
    setCountrySearch('')
    setFilteredCountries(countries)
    onClose()
  }

  return (
    <div 
      ref={overlayRef}
      className="react-login-overlay"
      onClick={handleOverlayClick}
      style={{display: 'none'}}
    >
      <div className="react-login-popup">
        <button className="react-login-close-btn" onClick={handleClose}>
          <i className="fas fa-times"></i>
        </button>
        
        <div className="react-login-header">
          <h2>Login To User</h2>
        </div>

        <form className="react-login-form" onSubmit={showOtp ? handleVerifyOtp : handleSendOtp}>
          {/* Error Message */}
          {error && (
            <div style={{
              padding: '12px 16px',
              marginBottom: '15px',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '8px',
              color: '#c33',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* User Type Selection */}
          <div className="react-login-user-type">
            <button
              type="button"
              className={`react-login-type-btn ${userType === 'Customer' ? 'active' : ''}`}
              onClick={() => {
                setUserType('Customer')
                setError('')
                setShowOtp(false)
                setReceivedOtp('')
              }}
            >
              Customer
            </button>
            <button
              type="button"
              className={`react-login-type-btn ${userType === 'Vendor' ? 'active' : ''}`}
              onClick={() => {
                setUserType('Vendor')
                setError('')
                setShowOtp(false)
                setReceivedOtp('')
              }}
            >
              Vendor
            </button>
          </div>

          {!showOtp ? (
            <>
              {/* Mobile Number Input */}
              <div className="react-login-form-group">
                <label htmlFor="mobile">Mobile No.</label>
                <div className="react-login-mobile-input" style={{ position: 'relative', zIndex: showCountryDropdown ? 10001 : 'auto' }}>
                  <div 
                    className="react-login-country-code" 
                    onClick={(e) => {
                      e.stopPropagation()
                      console.log('[LoginPopup] Country dropdown clicked, countries:', countries.length)
                      setShowCountryDropdown(!showCountryDropdown)
                    }}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    <span className="react-login-flag">{getFlagEmoji(countryCode)}</span>
                    <span>{countryCode}</span>
                    <i className="fas fa-chevron-down" style={{ 
                      transform: showCountryDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }}></i>
                  </div>
                  
                  {/* Country Dropdown */}
                  {showCountryDropdown && (
                    <div 
                      ref={countryDropdownRef}
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        width: '100%',
                        backgroundColor: '#fff',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        maxHeight: '300px',
                        overflowY: 'auto',
                        zIndex: 10000,
                        marginTop: '4px'
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <div style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>
                        <input
                          type="text"
                          placeholder="Search country..."
                          value={countrySearch}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '14px'
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleCountrySearch(e.target.value)}
                        />
                      </div>
                      <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                        {filteredCountries.length > 0 ? (
                          filteredCountries.map((country) => (
                          <div
                            key={country.id}
                            onClick={() => handleCountrySelect(country)}
                            style={{
                              padding: '10px 12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              borderBottom: '1px solid #f0f0f0',
                              backgroundColor: selectedCountry?.id === country.id ? '#f5f5f5' : '#fff',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedCountry?.id === country.id ? '#f5f5f5' : '#fff'}
                          >
                            <span style={{ fontSize: '20px' }}>{getFlagEmoji(country.code)}</span>
                            <span style={{ flex: 1, fontSize: '14px' }}>{country.name}</span>
                            <span style={{ fontSize: '14px', color: '#666' }}>{country.code}</span>
                          </div>
                          ))
                        ) : countries.length === 0 ? (
                          <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                            Loading countries...
                          </div>
                        ) : (
                          <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                            No countries found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <input
                    type="tel"
                    id="mobile"
                    placeholder="Enter Your Mobile No."
                    value={mobileNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                      setMobileNumber(value)
                      if (error) setError('')
                    }}
                    maxLength="10"
                    required
                  />
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="react-login-terms">
                <label className="react-login-checkbox-label">
                  <input
                    type="checkbox"
                    checked={isAgreed}
                    onChange={(e) => setIsAgreed(e.target.checked)}
                    required
                  />
                  <span className="react-login-checkmark"></span>
                  <span className="react-login-terms-text">
                    I Agree to <a href={`${getPagesBaseUrl()}/page_app/terms-condition`} target="_blank" rel="noopener noreferrer" className="react-login-link">Terms & Conditions</a> And <a href={`${getPagesBaseUrl()}/page_app/privacy-policy`} target="_blank" rel="noopener noreferrer" className="react-login-link">Privacy Policy</a>.
                  </span>
                </label>
              </div>

              {/* Send OTP Button */}
              <button 
                type="submit" 
                className="react-login-submit-btn"
                disabled={isSendingOtp}
                style={{ opacity: isSendingOtp ? 0.6 : 1, cursor: isSendingOtp ? 'not-allowed' : 'pointer' }}
              >
                {isSendingOtp ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Sending OTP...
                  </>
                ) : (
                  'Send OTP'
                )}
              </button>
            </>
          ) : (
            <>
              {/* OTP Input */}
              <div className="react-login-form-group">
                <label htmlFor="otp">Enter OTP</label>
                <div className="react-login-otp-info">
                  <p>We've sent an OTP to {countryCode} {mobileNumber}</p>
                  {receivedOtp && (
                    <div style={{ 
                      marginTop: '10px', 
                      padding: '12px', 
                      backgroundColor: '#e3f2fd', 
                      border: '1px solid #2196f3', 
                      borderRadius: '6px',
                      textAlign: 'center'
                    }}>
                      <p style={{ margin: 0, fontWeight: 'bold', color: '#1976d2', fontSize: '14px' }}>
                        Your OTP: <span style={{ fontSize: '18px', letterSpacing: '2px', fontFamily: 'monospace' }}>{receivedOtp}</span>
                      </p>
                      <p style={{ margin: '5px 0 0 0', fontSize: '11px', color: '#666' }}>
                        (For testing purposes - OTP displayed for {userType.toLowerCase()} login)
                      </p>
                    </div>
                  )}
                  {!receivedOtp && (
                    <p className="react-login-otp-hint">
                      Please check your SMS for the OTP code
                      <br />
                      <span style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                        (For testing: Check database or backend logs for the generated OTP if SMS gateway is inactive)
                      </span>
                    </p>
                  )}
                </div>
                <input
                  type="text"
                  id="otp"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ''))
                    if (error) setError('')
                  }}
                  maxLength="6"
                  className="react-login-otp-input"
                  required
                />
              </div>

              {/* Back Button */}
              <button 
                type="button" 
                className="react-login-back-btn"
                onClick={() => {
                  setShowOtp(false)
                  setReceivedOtp('')
                }}
              >
                <i className="fas fa-arrow-left"></i>
                Back to Mobile
              </button>

              {/* Verify OTP Button */}
              <button 
                type="submit" 
                className="react-login-submit-btn"
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Verifying...
                  </>
                ) : (
                  'Verify OTP'
                )}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  )
}

export default LoginPopup
