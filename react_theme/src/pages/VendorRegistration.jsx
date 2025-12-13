import React, { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import useBreadStars from '../hooks/useBreadStars'
import usePageTitle from '../hooks/usePageTitle'
import { vendorRegistration, fetchPublicCountryList, fetchPublicStateList, fetchPublicCityList } from '../utils/api'
import { useNavigate } from 'react-router-dom'

const VendorRegistration = () => {
  useBreadStars()
  usePageTitle('Vendor Registration - Astrology Theme')
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    firm_name: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    pin_code: '',
    gst_no: '',
    term: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [countries, setCountries] = useState([])
  const [loadingCountries, setLoadingCountries] = useState(false)
  const [states, setStates] = useState([])
  const [loadingStates, setLoadingStates] = useState(false)
  const [cities, setCities] = useState([])
  const [loadingCities, setLoadingCities] = useState(false)
  const [selectedCountryId, setSelectedCountryId] = useState(null)
  const [selectedStateId, setSelectedStateId] = useState(null)

  // Fetch countries on component mount
  useEffect(() => {
    const loadCountries = async () => {
      setLoadingCountries(true)
      try {
        const result = await fetchPublicCountryList()
        if (result.status === 1 && Array.isArray(result.data)) {
          const countryList = result.data.map(country => ({
            id: country.id,
            name: country.nicename || country.name,
            code: `+${country.phonecode}`
          }))
          setCountries(countryList)
          console.log('[VendorRegistration] Countries loaded:', countryList.length)
          
          // Auto-select India if available
          const india = countryList.find(c => c.name === 'India')
          if (india) {
            setSelectedCountryId(india.id)
            setFormData(prev => ({ ...prev, country: india.name }))
          }
        } else {
          console.warn('[VendorRegistration] Failed to load countries:', result.msg)
        }
      } catch (err) {
        console.error('[VendorRegistration] Error loading countries:', err)
      } finally {
        setLoadingCountries(false)
      }
    }
    loadCountries()
  }, [])

  // Fetch states when country is selected
  useEffect(() => {
    if (selectedCountryId) {
      const loadStates = async () => {
        setLoadingStates(true)
        setStates([])
        setCities([])
        setSelectedStateId(null)
        try {
          const result = await fetchPublicStateList(selectedCountryId)
          if (result.status === 1 && Array.isArray(result.data)) {
            const stateList = result.data.map(state => ({
              id: state.id,
              name: state.state_name,
              country_id: state.country_id
            }))
            setStates(stateList)
            console.log('[VendorRegistration] States loaded:', stateList.length)
          } else {
            console.warn('[VendorRegistration] Failed to load states:', result.msg)
          }
        } catch (err) {
          console.error('[VendorRegistration] Error loading states:', err)
        } finally {
          setLoadingStates(false)
        }
      }
      loadStates()
    }
  }, [selectedCountryId])

  // Fetch cities when state is selected
  useEffect(() => {
    if (selectedStateId) {
      const loadCities = async () => {
        setLoadingCities(true)
        setCities([])
        try {
          const result = await fetchPublicCityList(selectedStateId)
          if (result.status === 1 && Array.isArray(result.data)) {
            const cityList = result.data.map(city => ({
              id: city.id,
              name: city.city_name,
              state_id: city.state_id
            }))
            setCities(cityList)
            console.log('[VendorRegistration] Cities loaded:', cityList.length)
          } else {
            console.warn('[VendorRegistration] Failed to load cities:', result.msg)
          }
        } catch (err) {
          console.error('[VendorRegistration] Error loading cities:', err)
        } finally {
          setLoadingCities(false)
        }
      }
      loadCities()
    }
  }, [selectedStateId])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (error) setError(null)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('[VendorRegistration] ===== Form Submit Started =====')
    console.log('[VendorRegistration] Form data:', formData)
    
    // Validate required fields
    if (!formData.name || !formData.email || !formData.phone || !formData.firm_name || !formData.pin_code || !formData.address || !formData.gst_no) {
      setError('Please fill in all required fields (including GST Number).')
      console.error('[VendorRegistration] Validation failed - missing required fields')
      return
    }

    // Validate phone number
    const cleanPhone = formData.phone.replace(/\D/g, '')
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.')
      console.error('[VendorRegistration] Validation failed - invalid phone:', cleanPhone)
      return
    }

    // Validate pin code (must be exactly 6 digits)
    const cleanPinCode = formData.pin_code.trim()
    if (cleanPinCode.length !== 6 || !/^\d{6}$/.test(cleanPinCode)) {
      setError('Pin code must be exactly 6 digits.')
      console.error('[VendorRegistration] Validation failed - invalid pin code:', cleanPinCode)
      return
    }

    // Validate GST number (must be exactly 15 characters if provided)
    const cleanGstNo = formData.gst_no.trim()
    if (cleanGstNo && cleanGstNo.length !== 15) {
      setError('GST number must be exactly 15 characters.')
      console.error('[VendorRegistration] Validation failed - invalid GST number length:', cleanGstNo.length)
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Prepare registration data
      const registrationData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: cleanPhone, // Already cleaned above
        firm_name: formData.firm_name.trim(),
        pin_code: cleanPinCode, // Already validated above
        gst_no: cleanGstNo || '',
        term: formData.term.trim() || '',
        address: formData.address.trim(),
        city: formData.city.trim() || '',
        state: formData.state.trim() || '',
        country: formData.country.trim() || 'India',
        latitude: '',
        longitude: ''
      }

      console.log('[VendorRegistration] Submitting registration data:', {
        ...registrationData,
        phone: registrationData.phone,
        phoneLength: registrationData.phone.length
      })
      
      const response = await vendorRegistration(registrationData)
      console.log('[VendorRegistration] Backend response:', response)
      console.log('[VendorRegistration] Response keys:', Object.keys(response))
      console.log('[VendorRegistration] Response.success:', response.success)
      console.log('[VendorRegistration] Response.message:', response.message)
      console.log('[VendorRegistration] Response.error:', response.error)

      if (response.success === true || response.success === 'true') {
        setSuccess(true)
        console.log('[VendorRegistration] ✅ Registration successful!')
        // Show success message and redirect to vendor login
        setTimeout(() => {
          navigate('/vendor-login')
        }, 2000)
      } else {
        // Parse error message from backend
        let errorMsg = 'Registration failed. Please try again.'
        
        if (response.message) {
          errorMsg = response.message
        } else if (response.error) {
          // If error is a string, use it directly
          if (typeof response.error === 'string') {
            errorMsg = response.error
          } else if (typeof response.error === 'object') {
            // If error is an object, try to extract message
            errorMsg = response.error.message || response.error.msg || JSON.stringify(response.error)
          }
        } else if (response.msg) {
          errorMsg = response.msg
        } else if (response.errors) {
          // Handle Joi validation errors
          if (Array.isArray(response.errors)) {
            errorMsg = response.errors.map(e => e.message || e).join(', ')
          } else if (typeof response.errors === 'object') {
            errorMsg = Object.values(response.errors).flat().join(', ')
          }
        }
        
        console.error('[VendorRegistration] ❌ Registration failed:', {
          errorMsg,
          fullResponse: response
        })
        setError(errorMsg)
      }
    } catch (err) {
      console.error('[VendorRegistration] ❌ Exception during registration:', err)
      console.error('[VendorRegistration] Error stack:', err.stack)
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
      console.log('[VendorRegistration] ===== Form Submit Completed =====')
    }
  }

  return (
    <div>
      <Navbar />

      {/* Themed Bread Hero */}
      <section className="react-new-bread-hero-container">
        <div className="react-new-bread-hero-bg-pattern"></div>
        <div className="react-new-bread-hero-stars" id="react-new-bread-stars-container"></div>
        <div className="react-new-bread-hero-content">
          <div className="react-new-bread-astrology-icon">
          <i className="fas fa-star-and-crescent"></i>
          </div>
          <h1 className="react-new-bread-hero-title">Vendor Registration</h1>
          <div className="react-new-bread-breadcrumbs">
            <a href="#">Home</a>
            <span className="react-new-bread-breadcrumb-separator">/</span>
            <span>Vendor Registration</span>
          </div>
        </div>
      </section>

      {/* Page Content */}
      <div className="container">
        <div className="react-vendor-card">
          <div className="react-vendor-card-header">
            <div className="react-vendor-header-left">
              <div className="react-vendor-icon-circle">
                <i className="fas fa-id-card"></i>
              </div>
              <div>
                <h2 className="react-vendor-title">Register as a Vendor</h2>
                <p className="react-vendor-subtitle">Join our marketplace and grow your spiritual business</p>
              </div>
            </div>
            <div className="vendor-header-right">
              <div className="react-vendor-badge">New</div>
            </div>
          </div>

          {error && (
            <div style={{ padding: '15px', marginBottom: '20px', backgroundColor: '#fee', color: '#c33', borderRadius: '5px' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ padding: '15px', marginBottom: '20px', backgroundColor: '#efe', color: '#3c3', borderRadius: '5px' }}>
              Registration successful! Redirecting to login...
            </div>
          )}

          <form className="react-vendor-form" onSubmit={onSubmit}>
            <div className="react-vendor-grid">
              <div className="react-vendor-field">
                <label className="react-vendor-label">Name <span className="react-required">*</span></label>
                <input 
                  type="text" 
                  name="name"
                  className="react-vendor-input" 
                  placeholder="Name" 
                  value={formData.name}
                  onChange={handleChange}
                  required 
                />
              </div>
              <div className="react-vendor-field">
                <label className="react-vendor-label">Email <span className="react-required">*</span></label>
                <input 
                  type="email" 
                  name="email"
                  className="react-vendor-input" 
                  placeholder="Email" 
                  value={formData.email}
                  onChange={handleChange}
                  required 
                />
              </div>
              <div className="react-vendor-field">
                <label className="react-vendor-label">Mobile No. <span className="react-required">*</span></label>
                <div className="react-vendor-input-group">
                  <span className="react-vendor-prefix">+91</span>
                  <input 
                    type="tel" 
                    name="phone"
                    className="react-vendor-input react-no-left-radius" 
                    placeholder="Mobile No." 
                    pattern="[0-9]{10}" 
                    value={formData.phone}
                    onChange={handleChange}
                    required 
                  />
                </div>
              </div>
              <div className="react-vendor-field">
                <label className="react-vendor-label">GST Number <span className="react-required">*</span></label>
                <input 
                  type="text" 
                  name="gst_no"
                  className="react-vendor-input" 
                  placeholder="GST Number (15 characters)" 
                  value={formData.gst_no}
                  onChange={handleChange}
                  maxLength={15}
                  required
                />
                {formData.gst_no && formData.gst_no.length !== 15 && (
                  <small style={{ color: '#f00', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    GST number must be exactly 15 characters (current: {formData.gst_no.length})
                  </small>
                )}
              </div>
              <div className="react-vendor-field">
                <label className="react-vendor-label">Firm Name <span className="react-required">*</span></label>
                <input 
                  type="text" 
                  name="firm_name"
                  className="react-vendor-input" 
                  placeholder="Firm Name" 
                  value={formData.firm_name}
                  onChange={handleChange}
                  required 
                />
              </div>
              <div className="react-vendor-field">
                <label className="react-vendor-label">Country <span className="react-required">*</span></label>
                <select 
                  name="country"
                  className="react-vendor-input" 
                  value={formData.country}
                  onChange={(e) => {
                    const countryName = e.target.value
                    const country = countries.find(c => c.name === countryName)
                    if (country) {
                      setSelectedCountryId(country.id)
                      setFormData(prev => ({ ...prev, country: countryName, state: '', city: '' }))
                    } else {
                      setSelectedCountryId(null)
                      setFormData(prev => ({ ...prev, country: countryName, state: '', city: '' }))
                    }
                  }}
                  required
                  disabled={loadingCountries}
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
                    </>
                  )}
                </select>
              </div>
              <div className="react-vendor-field">
                <label className="react-vendor-label">State <span className="react-required">*</span></label>
                <select 
                  name="state"
                  className="react-vendor-input" 
                  value={formData.state}
                  onChange={(e) => {
                    const stateName = e.target.value
                    const state = states.find(s => s.name === stateName)
                    if (state) {
                      setSelectedStateId(state.id)
                      setFormData(prev => ({ ...prev, state: stateName, city: '' }))
                    } else {
                      setSelectedStateId(null)
                      setFormData(prev => ({ ...prev, state: stateName, city: '' }))
                    }
                  }}
                  required
                  disabled={!selectedCountryId || loadingStates}
                >
                  {loadingStates ? (
                    <option value="">Loading states...</option>
                  ) : states.length > 0 ? (
                    <>
                      <option value="">Select State</option>
                      {states.map((state) => (
                        <option key={state.id} value={state.name}>
                          {state.name}
                        </option>
                      ))}
                    </>
                  ) : selectedCountryId ? (
                    <option value="">No states available</option>
                  ) : (
                    <option value="">Select country first</option>
                  )}
                </select>
              </div>
              <div className="react-vendor-field">
                <label className="react-vendor-label">City <span className="react-required">*</span></label>
                <select 
                  name="city"
                  className="react-vendor-input" 
                  value={formData.city}
                  onChange={handleChange}
                  required
                  disabled={!selectedStateId || loadingCities}
                >
                  {loadingCities ? (
                    <option value="">Loading cities...</option>
                  ) : cities.length > 0 ? (
                    <>
                      <option value="">Select City</option>
                      {cities.map((city) => (
                        <option key={city.id} value={city.name}>
                          {city.name}
                        </option>
                      ))}
                    </>
                  ) : selectedStateId ? (
                    <option value="">No cities available</option>
                  ) : (
                    <option value="">Select state first</option>
                  )}
                </select>
              </div>
              <div className="react-vendor-field">
                <label className="react-vendor-label">Address <span className="react-required">*</span></label>
                <textarea 
                  name="address"
                  className="react-vendor-input react-vendor-textarea" 
                  placeholder="Complete Address" 
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  required
                ></textarea>
              </div>
              <div className="react-vendor-field">
                <label className="react-vendor-label">Pincode <span className="react-required">*</span></label>
                <input 
                  type="text" 
                  name="pin_code"
                  className="react-vendor-input" 
                  placeholder="Pincode (6 digits)" 
                  pattern="[0-9]{6}" 
                  maxLength={6}
                  value={formData.pin_code}
                  onChange={(e) => {
                    // Only allow digits
                    const value = e.target.value.replace(/\D/g, '')
                    handleChange({ ...e, target: { ...e.target, value } })
                  }}
                  required
                />
                {formData.pin_code && formData.pin_code.length !== 6 && (
                  <small style={{ color: '#f00', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    Pin code must be exactly 6 digits (current: {formData.pin_code.length})
                  </small>
                )}
              </div>
              <div className="react-vendor-field">
                <label className="react-vendor-label">Term Condition <span className="react-required">*</span></label>
                <textarea 
                  name="term"
                  className="react-vendor-input react-vendor-textarea" 
                  placeholder="Tell us about your business, products, and experience"
                  value={formData.term}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>
              {/* <div className="react-vendor-field">
                <label className="react-vendor-label">Term Condition <span className="react-required">*</span></label>
                <div className="react-vendor-terms">
                  <input type="checkbox" id="terms" required />
                  <label htmlFor="terms">I agree to the Terms & Conditions</label>
                </div>
              </div> */}
            </div>

            <div className="react-vendor-actions">
              <button 
                type="submit" 
                className="react-vendor-submit-btn"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Registration'}
                <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default VendorRegistration


