import React from 'react'
import useBreadStars from '../hooks/useBreadStars'
import usePageTitle from '../hooks/usePageTitle'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const FreeKundali = () => {
  useBreadStars()
  usePageTitle('Free Kundali - Astrology Theme')
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
              <form id="divineForm">
                <div className="react-free-Kundli-form-grid">
                  <div className="react-free-Kundli-form-column">
                    <div className="react-free-Kundli-form-group">
                      <label htmlFor="dateOfBirth" className="react-free-Kundli-form-label">
                        <span><i className="fas fa-calendar react-free-Kundli-label-icon"></i></span>
                        Date of Birth
                      </label>
                      <input type="date" id="dateOfBirth" name="dateOfBirth" className="react-free-Kundli-form-input" required />
                    </div>
                    <div className="react-free-Kundli-form-group">
                      <label htmlFor="timeOfBirth" className="react-free-Kundli-form-label">
                        <span><i className="fas fa-clock react-free-Kundli-label-icon"></i></span>
                        Time of Birth
                      </label>
                      <input type="time" id="timeOfBirth" name="timeOfBirth" className="react-free-Kundli-form-input" required />
                    </div>
                    <div className="react-free-Kundli-form-group">
                      <label htmlFor="placeOfBirth" className="react-free-Kundli-form-label">
                        <span><i className="fas fa-location-dot react-free-Kundli-label-icon"></i></span>
                        Place of Birth
                      </label>
                      <input type="text" id="placeOfBirth" name="placeOfBirth" className="react-free-Kundli-form-input" placeholder="Enter your birth city, state, country" required />
                    </div>
                  </div>
                  <div className="react-free-Kundli-form-column">
                    <div className="react-free-Kundli-form-group">
                      <label htmlFor="division" className="react-free-Kundli-form-label"><span><i className="fas fa-compass react-free-Kundli-label-icon"></i> </span>Chart Division</label>
                      <select id="division" name="division" className="react-free-Kundli-form-select" required>
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
                      <select id="style" name="style" className="react-free-Kundli-form-select" required>
                        <option value="">Choose your preferred style</option>
                        <option value="north">North Indian Style</option>
                        <option value="south">South Indian Style</option>
                        <option value="east">East Indian Style</option>
                        <option value="western">Western Astrology Style</option>
                      </select>
                    </div>
                    <div className="react-free-Kundli-form-group">
                      <label htmlFor="language" className="react-free-Kundli-form-label"><span><i className="fas fa-language react-free-Kundli-label-icon"></i></span>Preferred Language</label>
                      <select id="language" name="language" className="react-free-Kundli-form-select" required>
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
                <button type="button" className="react-free-Kundli-generate-btn">
                  Generate My Divine Kundali
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
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default FreeKundali


