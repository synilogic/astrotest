import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { fetchAstrologerDetail, fetchBlogs } from '../utils/api'

const InnerAstrologer = () => {
  const [searchParams] = useSearchParams()
  const astrologerId = searchParams.get('id')
  
  const [astrologer, setAstrologer] = useState(null)
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Memoize image URL calculation
  const imageUrl = useMemo(() => {
    if (!astrologer) return null
    const fallback = 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400'
    const originalSrc = astrologer.astro_img || astrologer.astro_img_secondary
    const isValidAstrologerPath = originalSrc && (
      originalSrc.includes('localhost:8002/uploads/astrologer/') ||
      originalSrc.includes('localhost:8002/assets/img/astrologer')
    )
    const shouldUseFallback = !originalSrc || 
      (originalSrc && !isValidAstrologerPath && originalSrc.includes('localhost:8002/assets/') && !originalSrc.includes('astrologer'))
    return shouldUseFallback ? fallback : (originalSrc || fallback)
  }, [astrologer?.astro_img, astrologer?.astro_img_secondary])
  
  // Memoize prices
  const prices = useMemo(() => {
    if (!astrologer?.prices) return { callPrice: 0, chatPrice: 0, videoPrice: 0 }
    return {
      callPrice: astrologer.prices.find(p => p.type === 'call' || p.type === 'voice')?.price || 0,
      chatPrice: astrologer.prices.find(p => p.type === 'chat')?.price || 0,
      videoPrice: astrologer.prices.find(p => p.type === 'video')?.price || 0
    }
  }, [astrologer?.prices])
  
  // Memoize categories
  const categories = useMemo(() => {
    if (!astrologer?.category_names) return []
    return astrologer.category_names.split(',').map(cat => cat.trim()).filter(Boolean)
  }, [astrologer?.category_names])
  
  // Memoize biography paragraphs
  const biographyParagraphs = useMemo(() => {
    if (!astrologer?.long_biography) return []
    return astrologer.long_biography.split('\n').map(para => para.trim()).filter(Boolean)
  }, [astrologer?.long_biography])
  
  // Memoize expensive calculations
  const ratingData = useMemo(() => {
    if (!astrologer) return { avgRating: 0, reviewCount: 0, ratingCounts: {}, ratingPercentages: {} }
    
    const reviews = astrologer.reviews || []
    const avgRating = typeof astrologer.avg_rating === 'number' 
      ? astrologer.avg_rating 
      : parseFloat(astrologer.avg_rating) || 0
    const reviewCount = astrologer.review_count || reviews.length || 0
    
    // Calculate rating distribution (optimized loop)
    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    for (let i = 0; i < reviews.length; i++) {
      const rating = parseInt(reviews[i].review_rating) || 0
      if (rating >= 1 && rating <= 5) {
        ratingCounts[rating]++
      }
    }
    
    // Pre-calculate percentages
    const ratingPercentages = {}
    for (let rating = 1; rating <= 5; rating++) {
      ratingPercentages[rating] = reviewCount === 0 ? 0 : (ratingCounts[rating] / reviewCount) * 100
    }
    
    return { avgRating, reviewCount, ratingCounts, ratingPercentages }
  }, [astrologer])
  
  // Memoize star rendering function
  const renderStars = useCallback((rating) => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    const stars = []
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span 
          key={i} 
          className={`react-astrologers-star ${
            i < fullStars ? 'react-astrologers-filled' : 
            i === fullStars && hasHalfStar ? 'react-astrologers-half' : ''
          }`}
        >
          ★
        </span>
      )
    }
    return <>{stars}</>
  }, [])
  
  // Memoize processed reviews
  const processedReviews = useMemo(() => {
    if (!astrologer?.reviews) return []
    return astrologer.reviews.map(review => {
      const reviewerName = review.review_by_user?.name || 'Anonymous'
      const displayName = review.customer?.is_anonymous_review ? 
        `${reviewerName.substring(0, 3)}***` : 
        reviewerName
      const initial = reviewerName.charAt(0).toUpperCase()
      const reviewDate = review.created_at ? new Date(review.created_at).toLocaleDateString('en-US', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      }) : 'N/A'
      const rating = parseInt(review.review_rating) || 0
      return { ...review, displayName, initial, reviewDate, rating }
    })
  }, [astrologer?.reviews])
  
  // Dynamic page title (defer until data loads)
  useEffect(() => {
    if (astrologer && astrologer.display_name) {
      document.title = `${astrologer.display_name} - Astrologer Profile - Astrology Theme`
    }
  }, [astrologer])
  
  
  useEffect(() => {
    if (!astrologerId) {
      setError('Astrologer ID is required')
      setLoading(false)
      return
    }
    
    setError(null)
    setAstrologer(null) // Clear previous data
    setLoading(true)
    
    // Fetch astrologer details immediately (non-blocking)
    fetchAstrologerDetail(astrologerId).then(astrologerResponse => {
      console.log('[InnerAstrologer] Astrologer detail response:', astrologerResponse)
      if (astrologerResponse && astrologerResponse.status === 1 && astrologerResponse.data) {
        const astroData = astrologerResponse.data
        console.log('[InnerAstrologer] Astrologer prices:', astroData.prices)
        console.log('[InnerAstrologer] Call prices extracted:', {
          callPrice: astroData.prices?.find(p => p.type === 'call' || p.type === 'voice')?.price || 0,
          chatPrice: astroData.prices?.find(p => p.type === 'chat')?.price || 0,
          videoPrice: astroData.prices?.find(p => p.type === 'video')?.price || 0
        })
        console.log('[InnerAstrologer] Document images:', astroData.document_image_list)
        console.log('[InnerAstrologer] Gallery images:', astroData.gallery_image_list)
        setAstrologer(astroData)
        setLoading(false) // Data loaded, stop loading
      } else {
        console.warn('[InnerAstrologer] Invalid astrologer response:', astrologerResponse)
        const errorMsg = astrologerResponse?.msg || 'Failed to load astrologer details'
        setError(errorMsg)
        setLoading(false)
      }
    }).catch(err => {
      console.error('[InnerAstrologer] Error fetching astrologer detail:', err)
      setError(err.message || 'Failed to load astrologer details')
      setLoading(false)
    })
    
    // Fetch blogs in background (non-blocking, non-critical)
    // Note: fetchBlogs doesn't support astrologer_uni_id filter in the current API
    // We'll fetch all blogs and filter on frontend if needed
    fetchBlogs(0, 20).then(blogsResponse => {
      console.log('[InnerAstrologer] Blogs response:', blogsResponse)
      if (blogsResponse && blogsResponse.status === 1 && Array.isArray(blogsResponse.data)) {
        // Filter blogs by astrologer if needed (if backend doesn't support filter)
        const filteredBlogs = blogsResponse.data
          .filter(blog => !astrologerId || blog.astrologer?.astrologer_uni_id === astrologerId)
          .slice(0, 3)
        setBlogs(filteredBlogs)
        console.log('[InnerAstrologer] Filtered blogs:', filteredBlogs.length)
      }
    }).catch((err) => {
      console.error('[InnerAstrologer] Error fetching blogs:', err)
      // Silently ignore blog errors - they're not critical
    })
  }, [astrologerId])

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
          <h1 className="react-new-bread-hero-title">
            {astrologer ? `${astrologer.display_name || 'Astrologer'} Profile` : 'Astrologer Profile'}
          </h1>
          <div className="react-new-bread-breadcrumbs">
            <a href="/">Home</a>
            <span className="react-new-bread-breadcrumb-separator">/</span>
            <span>{astrologer ? astrologer.display_name || 'Astrologer' : 'Astrologer'}</span>
          </div>
        </div>
      </section>

      <div style={{padding: '1.5rem 0'}}>
        <div className="container">
          {error ? (
            <div style={{ padding: '50px', textAlign: 'center', color: 'red' }}>
              <p>Error: {error}</p>
              {!astrologerId && <p>Please provide an astrologer ID in the URL: /astrologer?id=ASTRO0003</p>}
            </div>
          ) : astrologer ? (
            <div className="react-astrologers-profile-card">
              <div className="react-astrologers-profile-header">
                <div className="react-astrologers-profile-image-container">
                  <img 
                    src={imageUrl || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400'} 
                    alt={astrologer.display_name || 'Astrologer'} 
                    className="react-astrologers-profile-image"
                    onError={(e) => {
                      const fallback = 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400'
                      if (e.target.src !== fallback) {
                        e.target.src = fallback
                        e.target.onerror = null
                      }
                    }}
                  />
                  <div className={`react-astrologers-status ${astrologer.online_status === 1 ? 'react-astrologer-online' : ''}`}></div>
                </div>
                <div className="react-astrologers-profile-info">
                  <div className="react-astrologers-name-section">
                    <h1 className="react-astrologers-astrologer-name">{astrologer.display_name || 'Astrologer'}</h1>
                    {astrologer.is_verified === 1 && (
                      <div className="react-astrologers-verified-badge">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="react-astrologers-specializations">
                    {categories.length > 0 ? categories.map((cat, idx) => (
                      <span key={idx} className="react-astrologers-spec-tag">{cat}</span>
                    )) : (
                      <span className="react-astrologers-spec-tag">Astrologer</span>
                    )}
                  </div>

                  <div className="react-astrologers-basic-info">
                    <div className="react-astrologers-info-item">
                      <span className="react-astrologers-info-label"><i className="fa fa-language react-inner-Icon"></i> Languages:</span>
                      <span className="react-astrologers-info-value">{astrologer.language_name || 'N/A'}</span>
                    </div>
                    <div className="react-astrologers-info-item">
                      <span className="react-astrologers-info-label"><i className="fa-solid fa-clock react-inner-Icon"></i> Exp:</span>
                      <span className="react-astrologers-info-value">{astrologer.experience || 0} Years</span>
                    </div>
                    <div className="react-astrologers-info-item">
                      <span className="react-astrologers-info-label"><i className="fa fa-star react-inner-Icon"></i> Skills:</span>
                      <span className="react-astrologers-info-value">{astrologer.skill_names || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="react-astrologers-consultation-buttons">
                    {prices.callPrice > 0 && (
                      <button className="react-astrologers-consult-btn react-astrologers-call-btn">
                        <i className="fas fa-phone"></i>
                        ₹ {prices.callPrice}/min
                      </button>
                    )}
                    {prices.chatPrice > 0 && (
                      <button className="react-astrologers-consult-btn react-astrologers-chat-btn">
                        <i className="fas fa-comments"></i>
                        ₹ {prices.chatPrice}/min
                      </button>
                    )}
                    {prices.videoPrice > 0 && (
                      <button className="react-astrologers-consult-btn react-astrologers-video-btn">
                        <i className="fas fa-video"></i>
                        ₹ {prices.videoPrice}/min
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="react-astrologers-about-section">
                <h2 className="react-astrologers-section-title">About me</h2>
                {biographyParagraphs.length > 0 ? (
                  <div className="react-astrologers-about-text">
                    {biographyParagraphs.map((para, idx) => (
                      <p key={idx} className="react-astrologers-about-text">{para}</p>
                    ))}
                  </div>
                ) : (
                  <p className="react-astrologers-about-text">No biography available.</p>
                )}
              </div>
            </div>
          ) : !loading ? (
            <div style={{ padding: '50px', textAlign: 'center' }}>Astrologer not found</div>
          ) : null}

          {astrologer && (
            <div className="react-astrologers-bottom-section">
              <div className="react-astrologers-reviews-card">
                <h2 className="react-astrologers-section-title react-astrologers-blogs-title">Rating & Reviews</h2>
                {(() => {
                  const { avgRating, reviewCount, ratingPercentages } = ratingData
                  
                  return (
                    <>
                      <div className="react-astrologers-rating-summary">
                        <div className="react-astrologers-rating-score">
                          <div className="react-astrologers-score-number">{avgRating.toFixed(1)}</div>
                          <div className="react-astrologers-rating-stars">
                            {renderStars(avgRating)}
                          </div>
                          <div className="react-astrologers-total-reviews">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                            {reviewCount} total
                          </div>
                        </div>
                        <div className="react-astrologers-rating-bars">
                          {[5, 4, 3, 2, 1].map(rating => (
                            <div key={rating} className="react-astrologers-rating-bar">
                              <span className="react-astrologers-bar-label">{rating}</span>
                              <div className="react-astrologers-bar-container">
                                <div className="react-astrologers-bar-fill" style={{width: `${ratingPercentages[rating]}%`}}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="react-astrologers-reviews-list">
                        {processedReviews.length > 0 ? processedReviews.map((review) => (
                          <div key={review.id} className="react-astrologers-review-item">
                            <div className="react-astrologers-reviewer-avatar">
                              <span className="react-astrologers-avatar-initial">{review.initial}</span>
                            </div>
                            <div className="react-astrologers-review-content">
                              <div className="react-astrologers-review-header">
                                <span className="react-astrologers-reviewer-name">{review.displayName}</span>
                                <div className="react-astrologers-review-stars">
                                  {[...Array(5)].map((_, i) => (
                                    <span 
                                      key={i} 
                                      className={`react-astrologers-star ${i < review.rating ? 'react-astrologers-filled' : ''}`}
                                    >
                                      ★
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="react-astrologers-review-date">{review.reviewDate}</div>
                              <div className="react-astrologers-review-text">{review.review_comment || 'No comment'}</div>
                            </div>
                          </div>
                        )) : (
                          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                            No reviews yet
                          </div>
                        )}
                      </div>
                    </>
                  )
                })()}
              </div>

              {/* Verified Documents Section */}
              {astrologer.document_image_list && Object.keys(astrologer.document_image_list).length > 0 && (
                <div className="react-astrologers-blogs-card" style={{ marginBottom: '2rem' }}>
                  <div className="react-astrologers-blogs-header">
                    <h2 className="react-astrologers-section-title react-astrologers-blogs-title">
                      <i className="fas fa-file-alt" style={{ marginRight: '10px', color: '#7c3aed' }}></i>
                      Verified Documents
                    </h2>
                  </div>
                  <div style={{ padding: '20px' }}>
                    <div className="row g-4">
                      {/* Aadhaar Card */}
                      {(astrologer.document_image_list.aadhaar_card_front || astrologer.document_image_list.aadhaar_card_back) && (
                        <div className="col-md-6">
                          <div style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '12px',
                            padding: '20px',
                            color: 'white',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                          }}>
                            <h5 style={{ 
                              marginBottom: '15px', 
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <i className="fas fa-id-card"></i>
                              Aadhaar Card
                              <span style={{
                                marginLeft: 'auto',
                                background: 'rgba(255,255,255,0.2)',
                                padding: '2px 10px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '500'
                              }}>
                                <i className="fas fa-check-circle"></i> Verified
                              </span>
                            </h5>
                            {astrologer.document_image_list.aadhaar_card_front && (
                              <div style={{ marginBottom: '10px' }}>
                                <p style={{ fontSize: '0.85rem', marginBottom: '8px', opacity: 0.9 }}>Front Side</p>
                                <img 
                                  src={astrologer.document_image_list.aadhaar_card_front} 
                                  alt="Aadhaar Card Front"
                                  style={{ 
                                    width: '100%', 
                                    borderRadius: '8px',
                                    border: '2px solid rgba(255,255,255,0.3)',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                  onClick={() => window.open(astrologer.document_image_list.aadhaar_card_front, '_blank')}
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                    e.target.nextSibling.style.display = 'block'
                                  }}
                                />
                                <div style={{ 
                                  display: 'none', 
                                  padding: '20px', 
                                  textAlign: 'center',
                                  background: 'rgba(255,255,255,0.1)',
                                  borderRadius: '8px'
                                }}>
                                  <i className="fas fa-image" style={{ fontSize: '2rem', opacity: 0.5 }}></i>
                                  <p style={{ fontSize: '0.85rem', marginTop: '10px', opacity: 0.7 }}>Image not available</p>
                                </div>
                              </div>
                            )}
                            {astrologer.document_image_list.aadhaar_card_back && (
                              <div>
                                <p style={{ fontSize: '0.85rem', marginBottom: '8px', opacity: 0.9 }}>Back Side</p>
                                <img 
                                  src={astrologer.document_image_list.aadhaar_card_back} 
                                  alt="Aadhaar Card Back"
                                  style={{ 
                                    width: '100%', 
                                    borderRadius: '8px',
                                    border: '2px solid rgba(255,255,255,0.3)',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                  onClick={() => window.open(astrologer.document_image_list.aadhaar_card_back, '_blank')}
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                    e.target.nextSibling.style.display = 'block'
                                  }}
                                />
                                <div style={{ 
                                  display: 'none', 
                                  padding: '20px', 
                                  textAlign: 'center',
                                  background: 'rgba(255,255,255,0.1)',
                                  borderRadius: '8px'
                                }}>
                                  <i className="fas fa-image" style={{ fontSize: '2rem', opacity: 0.5 }}></i>
                                  <p style={{ fontSize: '0.85rem', marginTop: '10px', opacity: 0.7 }}>Image not available</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* PAN Card */}
                      {(astrologer.document_image_list.pan_card_front || astrologer.document_image_list.pan_card_back) && (
                        <div className="col-md-6">
                          <div style={{
                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                            borderRadius: '12px',
                            padding: '20px',
                            color: 'white',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                          }}>
                            <h5 style={{ 
                              marginBottom: '15px', 
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <i className="fas fa-credit-card"></i>
                              PAN Card
                              <span style={{
                                marginLeft: 'auto',
                                background: 'rgba(255,255,255,0.2)',
                                padding: '2px 10px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '500'
                              }}>
                                <i className="fas fa-check-circle"></i> Verified
                              </span>
                            </h5>
                            {astrologer.document_image_list.pan_card_front && (
                              <div style={{ marginBottom: '10px' }}>
                                <p style={{ fontSize: '0.85rem', marginBottom: '8px', opacity: 0.9 }}>Front Side</p>
                                <img 
                                  src={astrologer.document_image_list.pan_card_front} 
                                  alt="PAN Card Front"
                                  style={{ 
                                    width: '100%', 
                                    borderRadius: '8px',
                                    border: '2px solid rgba(255,255,255,0.3)',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                  onClick={() => window.open(astrologer.document_image_list.pan_card_front, '_blank')}
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                    e.target.nextSibling.style.display = 'block'
                                  }}
                                />
                                <div style={{ 
                                  display: 'none', 
                                  padding: '20px', 
                                  textAlign: 'center',
                                  background: 'rgba(255,255,255,0.1)',
                                  borderRadius: '8px'
                                }}>
                                  <i className="fas fa-image" style={{ fontSize: '2rem', opacity: 0.5 }}></i>
                                  <p style={{ fontSize: '0.85rem', marginTop: '10px', opacity: 0.7 }}>Image not available</p>
                                </div>
                              </div>
                            )}
                            {astrologer.document_image_list.pan_card_back && (
                              <div>
                                <p style={{ fontSize: '0.85rem', marginBottom: '8px', opacity: 0.9 }}>Back Side</p>
                                <img 
                                  src={astrologer.document_image_list.pan_card_back} 
                                  alt="PAN Card Back"
                                  style={{ 
                                    width: '100%', 
                                    borderRadius: '8px',
                                    border: '2px solid rgba(255,255,255,0.3)',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
                                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                  onClick={() => window.open(astrologer.document_image_list.pan_card_back, '_blank')}
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                    e.target.nextSibling.style.display = 'block'
                                  }}
                                />
                                <div style={{ 
                                  display: 'none', 
                                  padding: '20px', 
                                  textAlign: 'center',
                                  background: 'rgba(255,255,255,0.1)',
                                  borderRadius: '8px'
                                }}>
                                  <i className="fas fa-image" style={{ fontSize: '2rem', opacity: 0.5 }}></i>
                                  <p style={{ fontSize: '0.85rem', marginTop: '10px', opacity: 0.7 }}>Image not available</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ 
                      marginTop: '15px', 
                      padding: '12px',
                      background: '#f0fdf4',
                      border: '1px solid #86efac',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: '#166534'
                    }}>
                      <i className="fas fa-shield-alt" style={{ fontSize: '1.2rem' }}></i>
                      <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                        All documents have been verified by our team for authenticity
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Gallery Images Section */}
              {console.log('[DEBUG] Gallery check:', {
                hasGalleryList: !!astrologer.gallery_image_list,
                galleryListLength: astrologer.gallery_image_list?.length,
                galleryListData: astrologer.gallery_image_list,
                hasGalleryImages: !!astrologer.gallery_images,
                galleryImagesLength: astrologer.gallery_images?.length
              })}
              {/* Show gallery if either gallery_image_list or gallery_images exists */}
              {((astrologer.gallery_image_list && astrologer.gallery_image_list.length > 0) || 
                (astrologer.gallery_images && astrologer.gallery_images.length > 0)) && (
                <div className="react-astrologers-blogs-card" style={{ marginBottom: '2rem' }}>
                  <div className="react-astrologers-blogs-header">
                    <h2 className="react-astrologers-section-title react-astrologers-blogs-title">
                      <i className="fas fa-images" style={{ marginRight: '10px', color: '#7c3aed' }}></i>
                      Gallery
                    </h2>
                  </div>
                  <div style={{ padding: '20px' }}>
                    <div className="row g-3">
                      {/* Handle both gallery_image_list (array of URLs) and gallery_images (array of objects) */}
                      {(astrologer.gallery_image_list || 
                        astrologer.gallery_images?.map(img => typeof img === 'string' ? img : img.image) || []
                      ).map((imageUrl, index) => (
                        <div key={index} className="col-6 col-md-4 col-lg-3">
                          <div style={{
                            position: 'relative',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            cursor: 'pointer',
                            transition: 'transform 0.2s, box-shadow 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)'
                            e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)'
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
                          }}
                          onClick={() => window.open(imageUrl, '_blank')}
                          >
                            <img 
                              src={imageUrl} 
                              alt={`Gallery ${index + 1}`}
                              style={{ 
                                width: '100%', 
                                height: '200px',
                                objectFit: 'cover',
                                display: 'block'
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.parentElement.innerHTML = `
                                  <div style="
                                    width: 100%;
                                    height: 200px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                    color: white;
                                    flex-direction: column;
                                    gap: 10px;
                                  ">
                                    <i class="fas fa-image" style="font-size: 2rem; opacity: 0.7;"></i>
                                    <span style="font-size: 0.85rem; opacity: 0.8;">Image not available</span>
                                  </div>
                                `
                              }}
                            />
                            <div style={{
                              position: 'absolute',
                              bottom: '0',
                              left: '0',
                              right: '0',
                              background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
                              padding: '20px 10px 10px',
                              color: 'white',
                              fontSize: '0.85rem',
                              fontWeight: '500',
                              textAlign: 'center'
                            }}>
                              <i className="fas fa-expand-alt"></i> Click to expand
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Debug: Show if no gallery found */}
              {astrologer && !astrologer.gallery_image_list?.length && !astrologer.gallery_images?.length && (
                <div style={{ 
                  padding: '20px', 
                  background: '#fff3cd', 
                  border: '1px solid #ffc107',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  color: '#856404'
                }}>
                  <p style={{ margin: 0 }}>
                    <i className="fas fa-info-circle" style={{ marginRight: '8px' }}></i>
                    <strong>Debug Info:</strong> No gallery images found for this astrologer.
                    <br />
                    <small>Check console for astrologer data: gallery_image_list and gallery_images</small>
                  </p>
                </div>
              )}

              <div className="react-astrologers-blogs-card">
                <div className="react-astrologers-blogs-header">
                  <h2 className="react-astrologers-section-title react-astrologers-blogs-title">Recent Blogs</h2>
                </div>
                {blogs && blogs.length > 0 ? (
                  blogs.map((blog) => (
                    <div key={blog.id} className="react-astrologers-blog-item">
                      <img 
                        src={blog.blog_image || blog.image || 'https://images.pexels.com/photos/8980838/pexels-photo-8980838.jpeg?auto=compress&cs=tinysrgb&w=100'} 
                        alt={blog.title || 'Blog'} 
                        className="react-astrologers-blog-image"
                        loading="lazy"
                        onError={(e) => {
                          e.target.src = 'https://images.pexels.com/photos/8980838/pexels-photo-8980838.jpeg?auto=compress&cs=tinysrgb&w=100'
                        }}
                      />
                      <div className="react-astrologers-blog-content">
                        <h3 className="react-astrologers-blog-title">{blog.title || 'Untitled Blog'}</h3>
                        <div className="react-astrologers-blog-date">
                          {blog.created_at ? new Date(blog.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          }) : 'N/A'}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    No blogs available
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default InnerAstrologer


