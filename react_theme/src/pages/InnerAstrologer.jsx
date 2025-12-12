import React, { useEffect } from 'react'
import useBreadStars from '../hooks/useBreadStars'
import usePageTitle from '../hooks/usePageTitle'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const InnerAstrologer = () => {
  useBreadStars()
  usePageTitle('Astrologer Profile - Astrology Theme')

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
          <h1 className="react-new-bread-hero-title">Astrologer Profile</h1>
          <div className="react-new-bread-breadcrumbs">
            <a href="#">Home</a>
            <span className="react-new-bread-breadcrumb-separator">/</span>
            <span>Astrologer</span>
          </div>
        </div>
      </section>

      <div style={{padding: '1.5rem 0'}}>
        <div className="container">
          <div className="react-astrologers-profile-card">
            <div className="react-astrologers-profile-header">
              <div className="react-astrologers-profile-image-container">
                <img src="https://www.karmleela.com/uploads/astrologer/1749981882-astro_img.png" alt="Expert" className="react-astrologers-profile-image" />
                <div className="react-astrologers-status react-astrologer-online"></div>
              </div>
              <div className="react-astrologers-profile-info">
                <div className="react-astrologers-name-section">
                  <h1 className="react-astrologers-astrologer-name">Rahul Pandit</h1>
                  <div className="react-astrologers-verified-badge">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>

                <div className="react-astrologers-specializations">
                  <span className="react-astrologers-spec-tag">Child Birth</span>
                  <span className="react-astrologers-spec-tag">Family Life</span>
                  <span className="react-astrologers-spec-tag">Foreign Travel</span>
                  <span className="react-astrologers-spec-tag">Love & Relationship</span>
                  <span className="react-astrologers-spec-tag">Marriage</span>
                  <span className="react-astrologers-spec-tag">Remedies</span>
                  <span className="react-astrologers-spec-tag">VideshYatra</span>
                  <span className="react-astrologers-spec-tag">Vedic astrologer</span>
                  <span className="react-astrologers-spec-tag">Tarot card reading</span>
                  <span className="react-astrologers-spec-tag">Meditation</span>
                  <span className="react-astrologers-spec-tag">Marriage matching</span>
                  <span className="react-astrologers-spec-tag">Vastu shastra</span>
                  <span className="react-astrologers-spec-tag">Career And Business</span>
                </div>

                <div className="react-astrologers-basic-info">
                  <div className="react-astrologers-info-item">
                    <span className="react-astrologers-info-label"><i className="fa fa-language react-inner-Icon"></i> Languages:</span>
                    <span className="react-astrologers-info-value">English, Hindi</span>
                  </div>
                  <div className="react-astrologers-info-item">
                    <span className="react-astrologers-info-label"><i className="fa-solid fa-clock react-inner-Icon"></i> Exp:</span>
                    <span className="react-astrologers-info-value">2 Years</span>
                  </div>
                </div>

                <div className="react-astrologers-consultation-buttons">
                  <button className="react-astrologers-consult-btn react-astrologers-call-btn">
                    <i className="fas fa-phone"></i>
                    ₹ 3/min
                  </button>
                  <button className="react-astrologers-consult-btn react-astrologers-chat-btn">
                    <i className="fas fa-comments"></i>
                    ₹ 5/min
                  </button>
                  <button className="react-astrologers-consult-btn react-astrologers-video-btn">
                    <i className="fas fa-video"></i>
                    ₹ 1/min
                  </button>
                </div>
              </div>
            </div>

            <div className="react-astrologers-about-section">
              <h2 className="react-astrologers-section-title">About me</h2>
              <p className="react-astrologers-about-text">
                Tarot Hiya is a gifted Tarot Card Reader and Vedic Astrologer, offering insightful guidance in Marriage Consultation, Relationship Advice, Career Counseling, and Kundali Milan. With one year of experience in the field, she has quickly gained a reputation for her intuitive approach and deep understanding of astrology's impact on life's various facets.
              </p>
              <p className="react-astrologers-about-text">
                Tarot Hiya believes in maintaining a positive, ethical approach to astrology, where every reading and consultation is tailored to uplift and empower clients. She fosters a supportive environment, encouraging clients to embrace their strengths, address their challenges, and make informed decisions for their future.
              </p>
              <p className="react-astrologers-about-text">
                Her remedies, crafted with both tarot and Vedic astrology principles, are designed to bring balance, healing, and resolution to the areas of life that need focus. These personalized solutions have proven effective, guiding individuals and couples toward greater peace, prosperity, and personal growth. Additionally, Tarot Hiya offers expert Kundali Milan services, helping couples understand their compatibility, strengthen their relationships, and ensure a harmonious partnership based on astrological alignment. With Tarot Hiya's guidance, clients experience a holistic and transformative journey towards a brighter, more balanced future.
              </p>
            </div>
          </div>

          <div className="react-astrologers-bottom-section">
            <div className="react-astrologers-reviews-card">
              <h2 className="react-astrologers-section-title react-astrologers-blogs-title">Rating & Reviews</h2>
              <div className="react-astrologers-rating-summary">
                <div className="react-astrologers-rating-score">
                  <div className="react-astrologers-score-number">4.5</div>
                  <div className="react-astrologers-rating-stars">
                    <span className="react-astrologers-star react-astrologers-filled">★</span>
                    <span className="react-astrologers-star react-astrologers-filled">★</span>
                    <span className="react-astrologers-star react-astrologers-filled">★</span>
                    <span className="react-astrologers-star react-astrologers-filled">★</span>
                    <span className="react-astrologers-star react-astrologers-half">★</span>
                  </div>
                  <div className="react-astrologers-total-reviews">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    79 total
                  </div>
                </div>
                <div className="react-astrologers-rating-bars">
                  <div className="react-astrologers-rating-bar">
                    <span className="react-astrologers-bar-label">5</span>
                    <div className="react-astrologers-bar-container">
                      <div className="react-astrologers-bar-fill" style={{width: '65%'}}></div>
                    </div>
                  </div>
                  <div className="react-astrologers-rating-bar">
                    <span className="react-astrologers-bar-label">4</span>
                    <div className="react-astrologers-bar-container">
                      <div className="react-astrologers-bar-fill" style={{width: '20%'}}></div>
                    </div>
                  </div>
                  <div className="react-astrologers-rating-bar">
                    <span className="react-astrologers-bar-label">3</span>
                    <div className="react-astrologers-bar-container">
                      <div className="react-astrologers-bar-fill" style={{width: '8%'}}></div>
                    </div>
                  </div>
                  <div className="react-astrologers-rating-bar">
                    <span className="react-astrologers-bar-label">2</span>
                    <div className="react-astrologers-bar-container">
                      <div className="react-astrologers-bar-fill" style={{width: '4%'}}></div>
                    </div>
                  </div>
                  <div className="react-astrologers-rating-bar">
                    <span className="react-astrologers-bar-label">1</span>
                    <div className="react-astrologers-bar-container">
                      <div className="react-astrologers-bar-fill" style={{width: '3%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="react-astrologers-reviews-list">
                <div className="react-astrologers-review-item">
                  <div className="react-astrologers-reviewer-avatar">
                    <span className="react-astrologers-avatar-initial">V</span>
                  </div>
                  <div className="react-astrologers-review-content">
                    <div className="react-astrologers-review-header">
                      <span className="react-astrologers-reviewer-name">Van***</span>
                      <div className="react-astrologers-review-stars">
                        <span className="react-astrologers-star react-astrologers-filled">★</span>
                        <span className="react-astrologers-star">★</span>
                        <span className="react-astrologers-star">★</span>
                        <span className="react-astrologers-star">★</span>
                        <span className="react-astrologers-star">★</span>
                      </div>
                    </div>
                    <div className="react-astrologers-review-date">Mon, 14 Jul, 2025</div>
                    <div className="react-astrologers-review-text">worst</div>
                  </div>
                </div>
                <div className="react-astrologers-review-item">
                  <div className="react-astrologers-reviewer-avatar">
                    <span className="react-astrologers-avatar-initial">T</span>
                  </div>
                  <div className="react-astrologers-review-content">
                    <div className="react-astrologers-review-header">
                      <span className="react-astrologers-reviewer-name">tin***</span>
                      <div className="react-astrologers-review-stars">
                        <span className="react-astrologers-star react-astrologers-filled">★</span>
                        <span className="react-astrologers-star react-astrologers-filled">★</span>
                        <span className="react-astrologers-star react-astrologers-filled">★</span>
                        <span className="react-astrologers-star react-astrologers-filled">★</span>
                        <span className="react-astrologers-star react-astrologers-filled">★</span>
                      </div>
                    </div>
                    <div className="react-astrologers-review-date">Mon, 07 Jul, 2025</div>
                    <div className="react-astrologers-review-text">gud</div>
                  </div>
                </div>
                <div className="react-astrologers-review-item">
                  <div className="react-astrologers-reviewer-avatar">
                    <span className="react-astrologers-avatar-initial">H</span>
                  </div>
                  <div className="react-astrologers-review-content">
                    <div className="react-astrologers-review-header">
                      <span className="react-astrologers-reviewer-name">Har***</span>
                      <div className="react-astrologers-review-stars">
                        <span className="react-astrologers-star react-astrologers-filled">★</span>
                        <span className="react-astrologers-star">★</span>
                        <span className="react-astrologers-star">★</span>
                        <span className="react-astrologers-star">★</span>
                        <span className="react-astrologers-star">★</span>
                      </div>
                    </div>
                    <div className="react-astrologers-review-date">Fri, 04 Jul, 2025</div>
                    <div className="react-astrologers-review-text">connection issue</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="react-astrologers-blogs-card">
              <div className="react-astrologers-blogs-header">
                <h2 className="react-astrologers-section-title react-astrologers-blogs-title">Recent Blogs</h2>
              </div>
              <div className="react-astrologers-blog-item">
                <img src="https://images.pexels.com/photos/8980838/pexels-photo-8980838.jpeg?auto=compress&cs=tinysrgb&w=100" alt="Affirmation of the Day" className="react-astrologers-blog-image" />
                <div className="react-astrologers-blog-content">
                  <h3 className="react-astrologers-blog-title">Affirmation of the Day?</h3>
                  <div className="react-astrologers-blog-date">2 months ago</div>
                </div>
              </div>
              <div className="react-astrologers-blog-item">
                <img src="https://images.pexels.com/photos/1125744/pexels-photo-1125744.jpeg?auto=compress&cs=tinysrgb&w=100" alt="Love Tarot Reading" className="react-astrologers-blog-image" />
                <div className="react-astrologers-blog-content">
                  <h3 className="react-astrologers-blog-title">Understanding Love Through Tarot</h3>
                  <div className="react-astrologers-blog-date">3 months ago</div>
                </div>
              </div>
              <div className="react-astrologers-blog-item">
                <img src="https://images.pexels.com/photos/6823574/pexels-photo-6823574.jpeg?auto=compress&cs=tinysrgb&w=100" alt="Career Guidance" className="react-astrologers-blog-image" />
                <div className="react-astrologers-blog-content">
                  <h3 className="react-astrologers-blog-title">Career Guidance Through Vedic Astrology</h3>
                  <div className="react-astrologers-blog-date">4 months ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default InnerAstrologer


