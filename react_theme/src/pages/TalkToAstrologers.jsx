import React, { useState } from 'react'
import useBreadStars from '../hooks/useBreadStars'
import usePageTitle from '../hooks/usePageTitle'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Link } from 'react-router-dom'

const TalkToAstrologers = () => {
  useBreadStars()
  usePageTitle('Talk to Astrologers - Astrology Theme')
  
  // Filter states
  const [showFilterSidebar, setShowFilterSidebar] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    availability: 'all',
    languages: 'all',
    categories: 'all',
    skills: 'all',
    labels: 'all'
  })

  // Booking modal states
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [selectedService, setSelectedService] = useState(null) // 'chat' | 'voice' | 'video'
  const [activeStep, setActiveStep] = useState(1) // 1..4
  const [isJoining, setIsJoining] = useState(false)

  // Intake form state
  const [intake, setIntake] = useState({
    name: '',
    birthDate: '',
    time: '',
    birthPlace: '',
    maritalStatus: '',
    occupation: '',
    topic: ''
  })

  const astrologer = {
    name: 'Rahul Pandit',
    ratePerMin: {
      chat: 12,
      voice: 14,
      video: 19
    },
    maxDuration: '2 hours',
    balance: 0
  }
  
  // Sample data for filters
  const languageOptions = ['English', 'Hindi', 'Punjabi', 'Bengali', 'Tamil', 'Telugu', 'Gujarati', 'Marathi']
  const categoryOptions = ['Vedic Astrology', 'Numerology', 'Tarot Reading', 'Palmistry', 'Vastu', 'Gemstone Consultation']
  const skillOptions = ['Love & Relationship', 'Career Guidance', 'Health & Wellness', 'Financial Planning', 'Marriage Compatibility', 'Child Future']
  const labelOptions = ['New', 'VIP', 'Most Choice', 'Top Rated']
  
  // Filter functions
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }
  
  const clearAllFilters = () => {
    setFilters({
      search: '',
      availability: 'all',
      languages: 'all',
      categories: 'all',
      skills: 'all',
      labels: 'all'
    })
  }
  
  const toggleFilterSidebar = () => {
    setShowFilterSidebar(!showFilterSidebar)
  }
  
  // Booking modal helpers
  const openBooking = (service) => {
    setSelectedService(service)
    setActiveStep(1)
    setIsBookingOpen(true)
  }

  const closeBooking = () => {
    setIsBookingOpen(false)
    setIsJoining(false)
    setActiveStep(1)
  }

  const handleStart = () => {
    setActiveStep(2)
  }

  const handleIntakeChange = (field, value) => {
    setIntake(prev => ({ ...prev, [field]: value }))
  }

  const handleIntakeBack = () => setActiveStep(1)

  const handleIntakeContinue = () => {
    setActiveStep(3)
    setIsJoining(true)
    setTimeout(() => {
      setIsJoining(false)
    }, 800)
  }

  const handleAcknowledgeWaitlist = () => {
    setActiveStep(4)
  }
  return (
    <div>
      <Navbar />

      <section className="react-new-bread-hero-container">
        <div className="react-new-bread-hero-bg-pattern"></div>
        <div className="react-new-bread-hero-stars" id="react-new-bread-stars-container"></div>
        <div className="react-new-bread-hero-content">
          <div className="react-new-bread-astrology-icon">
            <i className="fas fa-star-and-crescent"></i>
          </div>
          <h1 className="react-new-bread-hero-title">Our Astrologers</h1>
          <div className="react-new-bread-breadcrumbs">
            <a href="#">Home</a>
            <span className="react-new-bread-breadcrumb-separator">/</span>
            <span>Our Astrologers</span>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="react-filter-section">
        <div className="container">
          <div className="react-filter-header">
            <h2>Find Your Perfect Astrologer</h2>
            <button 
              className="react-filter-toggle-btn"
              onClick={toggleFilterSidebar}
            >
              <i className="fas fa-filter"></i>
              Filter Astrologers
            </button>
          </div>
        </div>
      </section>

      {/* Filter Sidebar */}
      <div className={`react-filter-sidebar ${showFilterSidebar ? 'show' : ''}`}>
        <div className="react-filter-sidebar-header">
          <h3>Filter Astrologers</h3>
          <button 
            className="react-filter-close-btn"
            onClick={toggleFilterSidebar}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="react-filter-content">
          {/* Search Filter */}
          <div className="react-filter-group">
            <label className="react-filter-label">Search By</label>
            <input
              type="text"
              className="react-filter-input"
              placeholder="ID, Name, Email, Mobile"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          {/* Availability Filter */}
          <div className="react-filter-group">
            <label className="react-filter-label">Availability</label>
            <select
              className="react-filter-select"
              value={filters.availability}
              onChange={(e) => handleFilterChange('availability', e.target.value)}
            >
              <option value="all">All</option>
              <option value="online">Online</option>
              <option value="busy">Busy</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          {/* Languages Filter */}
          <div className="react-filter-group">
            <label className="react-filter-label">Languages</label>
            <select
              className="react-filter-select"
              value={filters.languages}
              onChange={(e) => handleFilterChange('languages', e.target.value)}
            >
              <option value="all">All Languages</option>
              {languageOptions.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          {/* Categories Filter */}
          <div className="react-filter-group">
            <label className="react-filter-label">Categories</label>
            <select
              className="react-filter-select"
              value={filters.categories}
              onChange={(e) => handleFilterChange('categories', e.target.value)}
            >
              <option value="all">All Categories</option>
              {categoryOptions.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Skills Filter */}
          <div className="react-filter-group">
            <label className="react-filter-label">Skills</label>
            <select
              className="react-filter-select"
              value={filters.skills}
              onChange={(e) => handleFilterChange('skills', e.target.value)}
            >
              <option value="all">All Skills</option>
              {skillOptions.map(skill => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>
          </div>

          {/* Labels Filter */}
          <div className="react-filter-group">
            <label className="react-filter-label">Labels</label>
            <select
              className="react-filter-select"
              value={filters.labels}
              onChange={(e) => handleFilterChange('labels', e.target.value)}
            >
              <option value="all">All Labels</option>
              {labelOptions.map(label => (
                <option key={label} value={label}>{label}</option>
              ))}
            </select>
          </div>

          {/* Filter Actions */}
          <div className="react-filter-actions">
            <button className="react-clear-filters-btn" onClick={clearAllFilters}>
              Clear All
            </button>
            <button className="react-apply-filters-btn" onClick={toggleFilterSidebar}>
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for sidebar */}
      {showFilterSidebar && (
        <div 
          className="react-filter-overlay"
          onClick={toggleFilterSidebar}
        ></div>
      )}

      <section>
        <div className="container">
          <div className="react-talkTo-main">
            {/* Card 1 */}
            <div className="react-own-container">
              <div className="react-own-profile-card">
                <div className="react-own-rated-badge react-new-rated">
                  <span>New</span>
                </div>
                <div className="react-own-card-header">
                  <div className="react-own-profile-info">
                    <div className="react-own-avatar-container">
                      <img src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400" alt="Rahul Pandit" className="react-own-avatar" />
                      <div className="react-own-online-badge react-own-online">
                        <span className="react-own-status-dot"></span>
                        Online
                      </div>
                    </div>
                    <div className="react-own-profile-details">
                      <Link to="/astrologer" className="react-own-name">Rahul Pandit</Link>
                      <p className="react-own-title">Vedic Astrologer</p>
                      <div className="react-own-rating">
                        <div className="react-own-stars">
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star-half-alt"></i>
                        </div>
                        <span className="react-own-rating-count">4.8</span>
                      </div>
                    </div>
                  </div>
                  <div className="react-own-quick-info">
                    <div className="react-own-info-item">
                      <span className="react-own-info-label"><i className="fa-solid fa-clock react-own-icOn"></i>Exp</span>
                      <span className="react-own-info-value">5 yr</span>
                    </div>
                    <div className="react-own-info-item">
                      <span className="react-own-info-label"><i className="fa fa-language react-own-icOn"></i>Languages</span>
                      <span className="react-own-info-value">English, Hindi, Punjabi</span>
                    </div>
                  </div>
                </div>
                <div className="react-own-services">
                  <div className="react-own-service-item" onClick={() => openBooking('chat')}>
                    <div className="react-own-service-icon react-chat">
                      <i className="fas fa-comments"></i>
                    </div>
                    <div className="react-own-service-details">
                      <span className="react-own-service-name">Chat</span>
                      <span className="react-own-service-price">₹12/min</span>
                    </div>
                  </div>
                  <div className="react-own-service-item" onClick={() => openBooking('video')}>
                    <div className="react-own-service-icon react-video">
                      <i className="fas fa-video"></i>
                    </div>
                    <div className="react-own-service-details">
                      <span className="react-own-service-name">Video Call</span>
                      <span className="react-own-service-price">₹19/min</span>
                    </div>
                  </div>
                  <div className="react-own-service-item" onClick={() => openBooking('voice')}>
                    <div className="react-own-service-icon react-voice">
                      <i className="fas fa-phone"></i>
                    </div>
                    <div className="react-own-service-details">
                      <span className="react-own-service-name">Voice Call</span>
                      <span className="react-own-service-price">₹14/min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="react-own-container">
              <div className="react-own-profile-card">
                <div className="react-own-rated-badge react-new-rated">
                  <span>New</span>
                </div>
                <div className="react-own-card-header">
                  <div className="react-own-profile-info">
                    <div className="react-own-avatar-container">
                      <img src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400" alt="Rahul Pandit" className="react-own-avatar" />
                      <div className="react-own-online-badge react-own-busy">
                        <span className="react-own-status-dot"></span>
                        Busy
                      </div>
                    </div>
                    <div className="react-own-profile-details">
                      <a className="react-own-name">Rahul Pandit</a>
                      <p className="react-own-title">Vedic Astrologer</p>
                      <div className="react-own-rating">
                        <div className="react-own-stars">
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star-half-alt"></i>
                        </div>
                        <span className="react-own-rating-count">4.8</span>
                      </div>
                    </div>
                  </div>
                  <div className="react-own-quick-info">
                    <div className="react-own-info-item">
                      <span className="react-own-info-label">Exp</span>
                      <span className="react-own-info-value">5 yr</span>
                    </div>
                    <div className="react-own-info-item">
                      <span className="react-own-info-label">Languages</span>
                      <span className="react-own-info-value">English, Hindi, Punjabi</span>
                    </div>
                  </div>
                </div>
                <div className="react-own-services">
                  <div className="react-own-service-item" onClick={() => openBooking('chat')}>
                    <div className="react-own-service-icon react-chat">
                      <i className="fas fa-comments"></i>
                    </div>
                    <div className="react-own-service-details">
                      <span className="react-own-service-name">Chat</span>
                      <span className="react-own-service-price">₹12/min</span>
                    </div>
                  </div>
                  <div className="react-own-service-item" onClick={() => openBooking('video')}>
                    <div className="react-own-service-icon react-video">
                      <i className="fas fa-video"></i>
                    </div>
                    <div className="react-own-service-details">
                      <span className="react-own-service-name">Video Call</span>
                      <span className="react-own-service-price">₹19/min</span>
                    </div>
                  </div>
                  <div className="react-own-service-item" onClick={() => openBooking('voice')}>
                    <div className="react-own-service-icon react-voice">
                      <i className="fas fa-phone"></i>
                    </div>
                    <div className="react-own-service-details">
                      <span className="react-own-service-name">Voice Call</span>
                      <span className="react-own-service-price">₹14/min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="react-own-container">
              <div className="react-own-profile-card">
                <div className="react-own-rated-badge react-vip-rated">
                  <span>VIP</span>
                </div>
                <div className="react-own-card-header">
                  <div className="react-own-profile-info">
                    <div className="react-own-avatar-container">
                      <img src="https://www.karmleela.com/uploads/astrologer/1749981882-astro_img.png" alt="Rahul Pandit" className="react-own-avatar" />
                      <div className="react-own-online-badge react-own-offline">
                        <span className="react-own-status-dot"></span>
                        Offline
                      </div>
                    </div>
                    <div className="react-own-profile-details">
                      <a className="react-own-name">Rahul Pandit</a>
                      <p className="react-own-title">Vedic Astrologer</p>
                      <div className="react-own-rating">
                        <div className="react-own-stars">
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star-half-alt"></i>
                        </div>
                        <span className="react-own-rating-count">4.8</span>
                      </div>
                    </div>
                  </div>
                  <div className="react-own-quick-info">
                    <div className="react-own-info-item">
                      <span className="react-own-info-label">Exp</span>
                      <span className="react-own-info-value">5 yr</span>
                    </div>
                    <div className="react-own-info-item">
                      <span className="react-own-info-label">Languages</span>
                      <span className="react-own-info-value">English, Hindi, Punjabi</span>
                    </div>
                  </div>
                </div>
                <div className="react-own-services">
                  <div className="react-own-service-item" onClick={() => openBooking('chat')}>
                    <div className="react-own-service-icon react-chat">
                      <i className="fas fa-comments"></i>
                    </div>
                    <div className="react-own-service-details">
                      <span className="react-own-service-name">Chat</span>
                      <span className="react-own-service-price">₹12/min</span>
                    </div>
                  </div>
                  <div className="react-own-service-item" onClick={() => openBooking('video')}>
                    <div className="react-own-service-icon react-video">
                      <i className="fas fa-video"></i>
                    </div>
                    <div className="react-own-service-details">
                      <span className="react-own-service-name">Video Call</span>
                      <span className="react-own-service-price">₹19/min</span>
                    </div>
                  </div>
                  <div className="react-own-service-item" onClick={() => openBooking('voice')}>
                    <div className="react-own-service-icon react-voice">
                      <i className="fas fa-phone"></i>
                    </div>
                    <div className="react-own-service-details">
                      <span className="react-own-service-name">Voice Call</span>
                      <span className="react-own-service-price">₹14/min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4 */}
            <div className="react-own-container">
              <div className="react-own-profile-card">
                <div className="react-own-rated-badge react-top-rated">
                  <span>Most Choice</span>
                </div>
                <div className="react-own-card-header">
                  <div className="react-own-profile-info">
                    <div className="react-own-avatar-container">
                      <img src="https://www.karmleela.com/uploads/astrologer/1749981882-astro_img.png" alt="Rahul Pandit" className="react-own-avatar" />
                      <div className="react-own-online-badge react-own-offline">
                        <span className="react-own-status-dot"></span>
                        Offline
                      </div>
                    </div>
                    <div className="react-own-profile-details">
                      <h2 className="react-own-name">Rahul Pandit</h2>
                      <p className="react-own-title">Vedic Astrologer</p>
                      <div className="react-own-rating">
                        <div className="react-own-stars">
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star-half-alt"></i>
                        </div>
                        <span className="react-own-rating-count">4.8</span>
                      </div>
                    </div>
                  </div>
                  <div className="react-own-quick-info">
                    <div className="react-own-info-item">
                      <span className="react-own-info-label">Exp</span>
                      <span className="react-own-info-value">5 yr</span>
                    </div>
                    <div className="react-own-info-item">
                      <span className="react-own-info-label">Languages</span>
                      <span className="react-own-info-value">English, Hindi, Punjabi</span>
                    </div>
                  </div>
                </div>
                <div className="react-own-services">
                  <div className="react-own-service-item" onClick={() => openBooking('chat')}>
                    <div className="react-own-service-icon react-chat">
                      <i className="fas fa-comments"></i>
                    </div>
                    <div className="react-own-service-details">
                      <span className="react-own-service-name">Chat</span>
                      <span className="react-own-service-price">₹12/min</span>
                    </div>
                  </div>
                  <div className="react-own-service-item" onClick={() => openBooking('video')}>
                    <div className="react-own-service-icon react-video">
                      <i className="fas fa-video"></i>
                    </div>
                    <div className="react-own-service-details">
                      <span className="react-own-service-name">Video Call</span>
                      <span className="react-own-service-price">₹19/min</span>
                    </div>
                  </div>
                  <div className="react-own-service-item" onClick={() => openBooking('voice')}>
                    <div className="react-own-service-icon react-voice">
                      <i className="fas fa-phone"></i>
                    </div>
                    <div className="react-own-service-details">
                      <span className="react-own-service-name">Voice Call</span>
                      <span className="react-own-service-price">₹14/min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 5 */}
            <div className="react-own-container">
              <div className="react-own-profile-card">
                <div className="react-own-card-header">
                  <div className="react-own-profile-info">
                    <div className="react-own-avatar-container">
                      <img src="https://www.karmleela.com/uploads/astrologer/1749981882-astro_img.png" alt="Rahul Pandit" className="react-own-avatar" />
                      <div className="react-own-online-badge react-own-online">
                        <span className="react-own-status-dot"></span>
                        Online
                      </div>
                    </div>
                    <div className="react-own-profile-details">
                      <h2 className="react-own-name">Rahul Pandit</h2>
                      <p className="react-own-title">Vedic Astrologer</p>
                      <div className="react-own-rating">
                        <div className="react-own-stars">
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star"></i>
                          <i className="fas fa-star-half-alt"></i>
                        </div>
                        <span className="react-own-rating-count">4.8</span>
                      </div>
                    </div>
                  </div>
                  <div className="react-own-quick-info">
                    <div className="react-own-info-item">
                      <span className="react-own-info-label">Exp</span>
                      <span className="react-own-info-value">5 yr</span>
                    </div>
                    <div className="react-own-info-item">
                      <span className="react-own-info-label">Languages</span>
                      <span className="react-own-info-value">English, Hindi, Punjabi</span>
                    </div>
                  </div>
                </div>
                <div className="react-own-services">
                  <div className="react-own-service-item" onClick={() => openBooking('chat')}>
                    <div className="react-own-service-icon react-chat">
                      <i className="fas fa-comments"></i>
                    </div>
                    <div className="react-own-service-details">
                      <span className="react-own-service-name">Chat</span>
                      <span className="react-own-service-price">₹12/min</span>
                    </div>
                  </div>
                  <div className="react-own-service-item" onClick={() => openBooking('video')}>
                    <div className="react-own-service-icon react-video">
                      <i className="fas fa-video"></i>
                    </div>
                    <div className="react-own-service-details">
                      <span className="react-own-service-name">Video Call</span>
                      <span className="react-own-service-price">₹19/min</span>
                    </div>
                  </div>
                  <div className="react-own-service-item" onClick={() => openBooking('voice')}>
                    <div className="react-own-service-icon react-voice">
                      <i className="fas fa-phone"></i>
                    </div>
                    <div className="react-own-service-details">
                      <span className="react-own-service-name">Voice Call</span>
                      <span className="react-own-service-price">₹14/min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      {isBookingOpen && (
        <div className="react-booking-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeBooking() }}>
          <div className="react-booking-modal fade-up">
            <button className="react-booking-close" aria-label="Close" onClick={closeBooking}>
              <i className="fa-solid fa-xmark"></i>
            </button>

            {/* Step header */}
            <div className="react-booking-header">
              <div className="react-booking-title">
                <span className={`react-service-pill ${selectedService}`}>
                  {selectedService === 'chat' && <i className="fas fa-comments"></i>}
                  {selectedService === 'voice' && <i className="fas fa-phone"></i>}
                  {selectedService === 'video' && <i className="fas fa-video"></i>}
                  <span className="react-pill-text">{selectedService === 'chat' ? 'Chat' : selectedService === 'voice' ? 'Voice' : 'Video'} Service</span>
                </span>
                <h3>{activeStep === 1 ? 'Astrologer Detail' : activeStep === 2 ? 'Chat Intake Form' : activeStep === 3 ? 'Waitlist Joined!' : 'Connecting...'}</h3>
                <p className="react-muted">with <strong>{astrologer.name}</strong></p>
              </div>
              <div className="react-booking-steps">
                <div className={`react-step ${activeStep >= 1 ? 'done' : ''}`}>1</div>
                <div className={`react-line ${activeStep > 1 ? 'active' : ''}`}></div>
                <div className={`react-step ${activeStep >= 2 ? 'done' : ''}`}>2</div>
                <div className={`react-line ${activeStep > 2 ? 'active' : ''}`}></div>
                <div className={`react-step ${activeStep >= 3 ? 'done' : ''}`}>3</div>
                <div className={`react-line ${activeStep > 3 ? 'active' : ''}`}></div>
                <div className={`react-step ${activeStep >= 4 ? 'done' : ''}`}>4</div>
              </div>
            </div>

            {/* Step 1: Service detail */}
            {activeStep === 1 && (
              <div className="react-booking-body">
                <div className="react-service-stats">
                  <div className="react-stat">
                    <span className="react-label">Service:</span>
                    <span className="react-value">{selectedService === 'chat' ? 'Chat' : selectedService === 'voice' ? 'Voice Call' : 'Video Call'}</span>
                  </div>
                  <div className="react-stat">
                    <span className="react-label">Rate:</span>
                    <span className="react-value">₹{astrologer.ratePerMin[selectedService]}/min</span>
                  </div>
                  <div className="react-stat">
                    <span className="react-label">Your Balance:</span>
                    <span className="react-value">₹{astrologer.balance}</span>
                  </div>
                  <div className="react-stat">
                    <span className="react-label">Max Duration:</span>
                    <span className="react-value">{astrologer.maxDuration}</span>
                  </div>
                </div>
                <div className="react-how-it-works">
                  <h4>How it works?</h4>
                  <p>Simply click Start button to initiate session.</p>
                </div>
                <div className="react-booking-actions">
                  <button className="react-btn react-btn-outline" onClick={closeBooking}>Cancel</button>
                  <button className="react-btn react-btn-primary" onClick={handleStart}>Start</button>
                </div>
              </div>
            )}

            {/* Step 2: Intake form */}
            {activeStep === 2 && (
              <div className="react-booking-body">
                <div className="react-form-grid">
                  <div className="react-form-group">
                    <label>Enter Name</label>
                    <input type="text" placeholder="Name" value={intake.name} onChange={(e) => handleIntakeChange('name', e.target.value)} />
                  </div>
                  <div className="react-form-group">
                    <label>Birth Date</label>
                    <input type="text" placeholder="dd-mm-yyyy" value={intake.birthDate} onChange={(e) => handleIntakeChange('birthDate', e.target.value)} />
                  </div>
                  <div className="react-form-group">
                    <label>Time</label>
                    <input type="text" placeholder="--:-- --" value={intake.time} onChange={(e) => handleIntakeChange('time', e.target.value)} />
                  </div>
                  <div className="react-form-group">
                    <label>Birth Place</label>
                    <input type="text" placeholder="Birth Place" value={intake.birthPlace} onChange={(e) => handleIntakeChange('birthPlace', e.target.value)} />
                  </div>
                  <div className="react-form-group">
                    <label>Marital Status</label>
                    <select value={intake.maritalStatus} onChange={(e) => handleIntakeChange('maritalStatus', e.target.value)}>
                      <option value="">Please Select Marital Status</option>
                      <option>Single</option>
                      <option>Married</option>
                      <option>Divorced</option>
                      <option>Widowed</option>
                    </select>
                  </div>
                  <div className="react-form-group">
                    <label>Occupation</label>
                    <input type="text" placeholder="Occupation" value={intake.occupation} onChange={(e) => handleIntakeChange('occupation', e.target.value)} />
                  </div>
                  <div className="react-form-group react-full">
                    <label>Topic of Concern</label>
                    <textarea placeholder="Topic of Concern" rows={3} value={intake.topic} onChange={(e) => handleIntakeChange('topic', e.target.value)} />
                  </div>
                </div>
                <div className="react-booking-actions">
                  <button className="react-btn react-btn-outline" onClick={handleIntakeBack}>Back</button>
                  <button className="react-btn react-btn-primary" onClick={handleIntakeContinue}>Continue</button>
                </div>
              </div>
            )}

            {/* Step 3: Waitlist */}
            {activeStep === 3 && (
              <div className="react-booking-body react-waitlist">
                <div className="react-wait-illustration">
                  <div className="react-spinner"></div>
                </div>
                <p>Your {selectedService} request has been successfully booked. <strong>{astrologer.name}</strong> will answer you within 10min</p>
                <div className="react-booking-actions react-center">
                  <button className="react-btn react-btn-primary" onClick={handleAcknowledgeWaitlist} disabled={isJoining}>{isJoining ? 'Preparing...' : 'Ok'}</button>
                </div>
              </div>
            )}

            {/* Step 4: Connection UI */}
            {activeStep === 4 && (
              <div className="react-booking-body react-connection">
                {selectedService === 'chat' && (
                  <div className="react-chat-ui">
                    <div className="react-chat-header">
                      <div className="react-avatar"></div>
                      <div>
                        <h4>{astrologer.name}</h4>
                        <span className="react-status">Connected • ₹{astrologer.ratePerMin.chat}/min</span>
                      </div>
                    </div>
                    <div className="react-chat-messages">
                      <div className="react-msg react-incoming">Hello! Please share your concern.</div>
                      <div className="react-msg react-outgoing">I want to know about my career.</div>
                    </div>
                    <div className="react-chat-input">
                      <input placeholder="Type your message..." />
                      <button className="react-btn react-btn-primary"><i className="fas fa-paper-plane"></i></button>
                    </div>
                  </div>
                )}

                {selectedService === 'voice' && (
                  <div className="react-call-ui">
                    <div className="react-call-visual react-voice">
                      <div className="react-avatar react-large"></div>
                      <h4>{astrologer.name}</h4>
                      <span className="react-status">Voice call • ₹{astrologer.ratePerMin.voice}/min</span>
                    </div>
                    <div className="react-call-controls">
                      <button className="react-control"><i className="fas fa-microphone"></i></button>
                      <button className="react-control react-danger" onClick={closeBooking}><i className="fas fa-phone-slash"></i></button>
                      <button className="react-control"><i className="fas fa-volume-up"></i></button>
                    </div>
                  </div>
                )}

                {selectedService === 'video' && (
                  <div className="react-video-ui">
                    <div className="react-video-stage">
                      <div className="react-remote-video">Remote Video</div>
                      <div className="react-local-video">You</div>
                    </div>
                    <div className="react-call-controls">
                      <button className="react-control"><i className="fas fa-microphone"></i></button>
                      <button className="react-control"><i className="fas fa-video"></i></button>
                      <button className="react-control react-danger" onClick={closeBooking}><i className="fas fa-phone-slash"></i></button>
                      <button className="react-control"><i className="fas fa-expand"></i></button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default TalkToAstrologers


