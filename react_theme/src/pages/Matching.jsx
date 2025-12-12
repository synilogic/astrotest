import React from 'react'
import useBreadStars from '../hooks/useBreadStars'
import usePageTitle from '../hooks/usePageTitle'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const Matching = () => {
  useBreadStars()
  usePageTitle('Matching - Astrology Theme')
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
          <form className="react-maTching-form-container" id="maTching-kundaliForm">
            <div className="react-maTching-language-section">
              <h3>Select Language / भाषा चुनें</h3>
              <div className="react-maTching-language-select">
                <select className="react-maTching-form-select" name="language" required>
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
                  <input type="date" id="boy-dob" name="boy_dob" className="react-maTching-form-input" required />
                </div>
                <div className="react-maTching-form-group">
                  <label className="react-maTching-form-label" htmlFor="boy-time"><span><i className="fas fa-clock react-free-Kundli-label-icon"></i></span> Time of Birth</label>
                  <input type="time" id="boy-time" name="boy_time" className="react-maTching-form-input" required />
                </div>
                <div className="react-maTching-form-group">
                  <label className="react-maTching-form-label" htmlFor="boy-place"><span><i className="fas fa-location-dot react-free-Kundli-label-icon"></i></span> Place of Birth</label>
                  <input type="text" id="boy-place" name="boy_place" className="react-maTching-form-input" placeholder="Enter city, state, country" required />
                </div>
              </div>

              <div className="react-maTching-details-section react-maTching-girl-section">
                <h2 className="react-maTching-section-title">
                  <span className="react-maTching-icon">👩</span>
                  Enter Girl's Birth Details
                </h2>
                <div className="react-maTching-form-group">
                  <label className="react-maTching-form-label" htmlFor="girl-dob"><span><i className="fas fa-calendar react-free-Kundli-label-icon"></i></span> Date of Birth</label>
                  <input type="date" id="girl-dob" name="girl_dob" className="react-maTching-form-input" required />
                </div>
                <div className="react-maTching-form-group">
                  <label className="react-maTching-form-label" htmlFor="girl-time"><span><i className="fas fa-clock react-free-Kundli-label-icon"></i></span> Time of Birth</label>
                  <input type="time" id="girl-time" name="girl_time" className="react-maTching-form-input" required />
                </div>
                <div className="react-maTching-form-group">
                  <label className="react-maTching-form-label" htmlFor="girl-place"><span><i className="fas fa-location-dot react-free-Kundli-label-icon"></i></span> Place of Birth</label>
                  <input type="text" id="girl-place" name="girl_place" className="react-maTching-form-input" placeholder="Enter city, state, country" required />
                </div>
              </div>
            </div>

            <div className="react-maTching-submit-section">
              <button type="submit" className="react-maTching-submit-btn">
                Generate Kundali Match
                <span className="react-maTching-icon"><i className="fas fa-heart"></i></span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Matching


