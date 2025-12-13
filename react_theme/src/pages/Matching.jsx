import React, { useState, useEffect } from 'react'
import useBreadStars from '../hooks/useBreadStars'
import usePageTitle from '../hooks/usePageTitle'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import LoginPopup from '../components/LoginPopup'
import { saveKundaliData, geocodePlace, getCurrentUser } from '../utils/api'

const Matching = () => {
  useBreadStars()
  usePageTitle('Matching - Astrology Theme')

  const [formData, setFormData] = useState({
    language: '',
    boy_dob: '',
    boy_time: '',
    boy_place: '',
    girl_dob: '',
    girl_time: '',
    girl_place: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [matchingResult, setMatchingResult] = useState(null)
  const [user, setUser] = useState(getCurrentUser())
  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false)

  // Check if user is logged in on mount
  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      setIsLoginPopupOpen(true)
    } else {
      setUser(currentUser)
    }
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear errors when user starts typing
    if (error) setError('')
    if (success) setSuccess('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setMatchingResult(null)

    // Validation
    if (!formData.language || !formData.boy_dob || !formData.boy_time || !formData.boy_place ||
        !formData.girl_dob || !formData.girl_time || !formData.girl_place) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)

    try {
      // Check if user is logged in
      if (!user || !user.api_key || !user.user_uni_id) {
        setIsLoginPopupOpen(true)
        setError('Please login to generate kundali matching')
        setLoading(false)
        return
      }

      // Geocode boy's place to get coordinates
      const boyGeocodeResult = await geocodePlace(formData.boy_place)
      if (!boyGeocodeResult || !boyGeocodeResult.lat || !boyGeocodeResult.lon) {
        setError('Could not find coordinates for boy\'s birth place. Please enter a more specific location.')
        setLoading(false)
        return
      }

      // Geocode girl's place to get coordinates
      const girlGeocodeResult = await geocodePlace(formData.girl_place)
      if (!girlGeocodeResult || !girlGeocodeResult.lat || !girlGeocodeResult.lon) {
        setError('Could not find coordinates for girl\'s birth place. Please enter a more specific location.')
        setLoading(false)
        return
      }

      // Prepare kundali matching data
      const kundaliData = {
        api_key: user.api_key,
        user_uni_id: user.user_uni_id,
        kundali_type: 'kundli_matching',
        kundali_method: 'd1', // Default method for matching
        language: formData.language,
        boy_name: user.name || 'Boy',
        boy_dob: formData.boy_dob,
        boy_tob: formData.boy_time,
        boy_tz: 'Asia/Kolkata', // Default to IST, can be enhanced
        boy_lat: boyGeocodeResult.lat.toString(),
        boy_lon: boyGeocodeResult.lon.toString(),
        boy_place: formData.boy_place,
        girl_name: 'Girl', // Can be enhanced to get from form
        girl_dob: formData.girl_dob,
        girl_tob: formData.girl_time,
        girl_tz: 'Asia/Kolkata', // Default to IST, can be enhanced
        girl_lat: girlGeocodeResult.lat.toString(),
        girl_lon: girlGeocodeResult.lon.toString(),
        girl_place: formData.girl_place
      }

      // Call backend API
      const result = await saveKundaliData(kundaliData)

      if (result.status === 1) {
        setSuccess('Kundali matching generated successfully!')
        setMatchingResult(result)
        // Reset form
        setFormData({
          language: '',
          boy_dob: '',
          boy_time: '',
          boy_place: '',
          girl_dob: '',
          girl_time: '',
          girl_place: ''
        })
      } else {
        setError(result.msg || 'Failed to generate kundali matching. Please try again.')
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.')
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
          <h1 className="react-new-bread-hero-title">Kundli Matching</h1>
          <div className="react-new-bread-breadcrumbs">
            <a href="#">Home</a>
            <span className="react-new-bread-breadcrumb-separator">/</span>
            <span>Kundli Matching</span>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="react-maTching-container">
          <div className="react-maTching-header">
            <h1><i className="fas fa-heart"></i> Kundali Matching</h1>
            <p>Enter the birth details of both individuals to generate a comprehensive compatibility analysis</p>
          </div>
          <form className="react-maTching-form-container" id="maTching-kundaliForm" onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
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

            <div className="react-maTching-language-section">
              <h3>Select Language / भाषा चुनें</h3>
              <div className="react-maTching-language-select">
                <select 
                  className="react-maTching-form-select" 
                  name="language" 
                  value={formData.language}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Choose Language</option>
                  <option value="english">English</option>
                  <option value="hindi">हिंदी (Hindi)</option>
                  <option value="gujarati">ગુજરાતી (Gujarati)</option>
                  <option value="marathi">मराठी (Marathi)</option>
                  <option value="bengali">বাংলা (Bengali)</option>
                  <option value="tamil">தமிழ் (Tamil)</option>
                  <option value="telugu">తెలుగు (Telugu)</option>
                  <option value="kannada">ಕನ್ನಡ (Kannada)</option>
                  <option value="malayalam">മലയാളം (Malayalam)</option>
                  <option value="punjabi">ਪੰਜਾਬੀ (Punjabi)</option>
                </select>
              </div>
            </div>

            <div className="react-maTching-details-grid">
              <div className="react-maTching-details-section react-maTching-boy-section">
                <h2 className="react-maTching-section-title">
                  <span className="react-maTching-icon">👨</span>
                  Enter Boy's Birth Details
                </h2>
                <div className="react-maTching-form-group">
                  <label className="react-maTching-form-label" htmlFor="boy-dob"><span><i className="fas fa-calendar react-free-Kundli-label-icon"></i></span> Date of Birth</label>
                  <input 
                    type="date" 
                    id="boy-dob" 
                    name="boy_dob" 
                    className="react-maTching-form-input" 
                    value={formData.boy_dob}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
                <div className="react-maTching-form-group">
                  <label className="react-maTching-form-label" htmlFor="boy-time"><span><i className="fas fa-clock react-free-Kundli-label-icon"></i></span> Time of Birth</label>
                  <input 
                    type="time" 
                    id="boy-time" 
                    name="boy_time" 
                    className="react-maTching-form-input" 
                    value={formData.boy_time}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
                <div className="react-maTching-form-group">
                  <label className="react-maTching-form-label" htmlFor="boy-place"><span><i className="fas fa-location-dot react-free-Kundli-label-icon"></i></span> Place of Birth</label>
                  <input 
                    type="text" 
                    id="boy-place" 
                    name="boy_place" 
                    className="react-maTching-form-input" 
                    placeholder="Enter city, state, country" 
                    value={formData.boy_place}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
              </div>

              <div className="react-maTching-details-section react-maTching-girl-section">
                <h2 className="react-maTching-section-title">
                  <span className="react-maTching-icon">👩</span>
                  Enter Girl's Birth Details
                </h2>
                <div className="react-maTching-form-group">
                  <label className="react-maTching-form-label" htmlFor="girl-dob"><span><i className="fas fa-calendar react-free-Kundli-label-icon"></i></span> Date of Birth</label>
                  <input 
                    type="date" 
                    id="girl-dob" 
                    name="girl_dob" 
                    className="react-maTching-form-input" 
                    value={formData.girl_dob}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
                <div className="react-maTching-form-group">
                  <label className="react-maTching-form-label" htmlFor="girl-time"><span><i className="fas fa-clock react-free-Kundli-label-icon"></i></span> Time of Birth</label>
                  <input 
                    type="time" 
                    id="girl-time" 
                    name="girl_time" 
                    className="react-maTching-form-input" 
                    value={formData.girl_time}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
                <div className="react-maTching-form-group">
                  <label className="react-maTching-form-label" htmlFor="girl-place"><span><i className="fas fa-location-dot react-free-Kundli-label-icon"></i></span> Place of Birth</label>
                  <input 
                    type="text" 
                    id="girl-place" 
                    name="girl_place" 
                    className="react-maTching-form-input" 
                    placeholder="Enter city, state, country" 
                    value={formData.girl_place}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
              </div>
            </div>

            <div className="react-maTching-submit-section">
              <button 
                type="submit" 
                className="react-maTching-submit-btn"
                disabled={loading}
                style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Generating Match...' : 'Generate Kundali Match'}
                <span className="react-maTching-icon"><i className="fas fa-heart"></i></span>
              </button>
            </div>
          </form>

          {/* Matching Result Display */}
          {matchingResult && matchingResult.user_data && (
            <div style={{
              marginTop: '30px',
              padding: '20px',
              backgroundColor: '#f9f9f9',
              borderRadius: '12px',
              border: '1px solid #e0e0e0'
            }}>
              <h3 style={{ marginBottom: '15px', color: '#333' }}>Kundali Matching Generated Successfully</h3>
              <div style={{ fontSize: '14px', color: '#666' }}>
                <p style={{ marginTop: '10px', color: '#28a745' }}>
                  Your kundali matching has been saved. You can view it in your dashboard.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <LoginPopup 
        isOpen={isLoginPopupOpen} 
        onClose={() => setIsLoginPopupOpen(false)} 
        onLoginSuccess={(userData) => {
          setUser(userData)
          setIsLoginPopupOpen(false)
        }} 
      />
      <Footer />
    </div>
  )
}

export default Matching


