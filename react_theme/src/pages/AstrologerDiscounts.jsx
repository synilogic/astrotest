import React, { useEffect, useState } from 'react'
import { fetchAstrologerDiscountList, fetchAssignedAstrologerDiscounts, getCurrentUser } from '../utils/api'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import usePageTitle from '../hooks/usePageTitle'

const AstrologerDiscounts = () => {
  usePageTitle('Astrologer Discounts - Astrology Theme')
  
  const [discounts, setDiscounts] = useState([])
  const [assignedDiscounts, setAssignedDiscounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState('all') // 'all' or 'assigned'

  const loadAllDiscounts = async () => {
    setLoading(true)
    try {
      const user = getCurrentUser()
      const result = await fetchAstrologerDiscountList(user?.user_uni_id || '')
      
      if (result.status === 1 && result.discountList) {
        setDiscounts(result.discountList)
      } else {
        setDiscounts([])
      }
    } catch (error) {
      console.error('Error loading discounts:', error)
      setDiscounts([])
    } finally {
      setLoading(false)
    }
  }

  const loadAssignedDiscounts = async () => {
    setLoading(true)
    try {
      const user = getCurrentUser()
      const result = await fetchAssignedAstrologerDiscounts(user?.user_uni_id || '', 0)
      
      if (result.status === 1 && result.data) {
        setAssignedDiscounts(result.data)
      } else {
        setAssignedDiscounts([])
      }
    } catch (error) {
      console.error('Error loading assigned discounts:', error)
      setAssignedDiscounts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const user = getCurrentUser()
    if (user) {
      if (activeView === 'all') {
        loadAllDiscounts()
      } else {
        loadAssignedDiscounts()
      }
    } else {
      setLoading(false)
    }
  }, [activeView])

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  const user = getCurrentUser()

  if (!user) {
    return (
      <div>
        <Navbar />
        <div className="container" style={{ padding: '50px 20px', textAlign: 'center' }}>
          <h2>Please login to view discounts</h2>
        </div>
        <Footer />
      </div>
    )
  }

  const displayData = activeView === 'all' ? discounts : assignedDiscounts

  return (
    <div>
      <Navbar />
      
      <section style={{ padding: '50px 0', minHeight: '60vh', background: '#f8f9fa' }}>
        <div className="container">
          <div className="row mb-4">
            <div className="col-12">
              <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '10px' }}>
                Astrologer Discounts
              </h1>
              <p style={{ color: '#666', fontSize: '1.1rem' }}>
                View available discounts and special offers
              </p>
            </div>
          </div>

          {/* View Toggle */}
          <div className="row mb-4">
            <div className="col-12">
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setActiveView('all')}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    border: activeView === 'all' ? '2px solid #7c3aed' : '1px solid #ddd',
                    background: activeView === 'all' ? '#7c3aed' : 'white',
                    color: activeView === 'all' ? 'white' : '#666',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                >
                  <i className="fas fa-list"></i> All Discounts
                </button>
                <button
                  onClick={() => setActiveView('assigned')}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    border: activeView === 'assigned' ? '2px solid #7c3aed' : '1px solid #ddd',
                    background: activeView === 'assigned' ? '#7c3aed' : 'white',
                    color: activeView === 'assigned' ? 'white' : '#666',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                >
                  <i className="fas fa-check-circle"></i> My Active Discounts
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p style={{ marginTop: '20px', color: '#666' }}>Loading discounts...</p>
            </div>
          ) : displayData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 0', background: 'white', borderRadius: '12px' }}>
              <i className="fas fa-percent" style={{ fontSize: '4rem', color: '#ddd', marginBottom: '20px' }}></i>
              <h3>No discounts found</h3>
              <p style={{ color: '#666' }}>
                {activeView === 'all' 
                  ? 'No discounts are currently available.'
                  : 'You have no active discounts assigned.'}
              </p>
            </div>
          ) : (
            <div className="row g-4">
              {displayData.map((discount, index) => {
                const isEnabled = discount.is_enabled === 1
                const isActive = discount.status === 1
                
                return (
                  <div key={discount.id || index} className="col-md-6 col-lg-4">
                    <div
                      style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '25px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        border: isEnabled ? '2px solid #7c3aed' : '1px solid #e9ecef',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        height: '100%',
                        position: 'relative',
                        opacity: isActive ? 1 : 0.6
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)'
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.12)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
                      }}
                    >
                      {/* Discount Badge */}
                      <div style={{
                        position: 'absolute',
                        top: '-15px',
                        right: '20px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                      }}>
                        {discount.discount_percent}% OFF
                      </div>

                      {isEnabled && (
                        <div style={{
                          position: 'absolute',
                          top: '15px',
                          left: '15px',
                          background: '#10b981',
                          color: 'white',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          <i className="fas fa-check"></i> Enabled
                        </div>
                      )}

                      {/* Discount Info */}
                      <div style={{ marginTop: '20px' }}>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: '600', marginBottom: '10px', color: '#2c3e50' }}>
                          {discount.title || 'Discount Offer'}
                        </h3>

                        <div style={{ marginTop: '20px', fontSize: '0.95rem', color: '#666' }}>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                            <i className="fas fa-clock" style={{ marginRight: '10px', color: '#7c3aed', width: '20px' }}></i>
                            <div>
                              <strong>Duration:</strong> {discount.duration} minutes
                            </div>
                          </div>

                          {activeView === 'assigned' && (
                            <>
                              {discount.start_from && (
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                                  <i className="fas fa-play-circle" style={{ marginRight: '10px', color: '#7c3aed', width: '20px' }}></i>
                                  <div>
                                    <strong>Start:</strong> {formatDate(discount.start_from)}
                                  </div>
                                </div>
                              )}

                              {discount.end_at && (
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                                  <i className="fas fa-stop-circle" style={{ marginRight: '10px', color: '#7c3aed', width: '20px' }}></i>
                                  <div>
                                    <strong>End:</strong> {formatDate(discount.end_at)}
                                  </div>
                                </div>
                              )}

                              <div style={{ 
                                marginTop: '15px', 
                                paddingTop: '15px', 
                                borderTop: '1px solid #e9ecef',
                                display: 'flex',
                                gap: '15px',
                                flexWrap: 'wrap'
                              }}>
                                {discount.call_status === 1 && (
                                  <span style={{
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontSize: '0.85rem',
                                    background: '#dbeafe',
                                    color: '#1e40af'
                                  }}>
                                    <i className="fas fa-phone"></i> Call
                                  </span>
                                )}
                                {discount.chat_status === 1 && (
                                  <span style={{
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontSize: '0.85rem',
                                    background: '#dcfce7',
                                    color: '#166534'
                                  }}>
                                    <i className="fas fa-comment"></i> Chat
                                  </span>
                                )}
                                {discount.video_status === 1 && (
                                  <span style={{
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontSize: '0.85rem',
                                    background: '#fef3c7',
                                    color: '#92400e'
                                  }}>
                                    <i className="fas fa-video"></i> Video
                                  </span>
                                )}
                              </div>
                            </>
                          )}

                          <div style={{ 
                            marginTop: '15px',
                            paddingTop: '15px',
                            borderTop: '1px solid #e9ecef'
                          }}>
                            <span style={{
                              padding: '6px 14px',
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              fontWeight: '500',
                              background: isActive ? '#d4edda' : '#f8d7da',
                              color: isActive ? '#155724' : '#721c24'
                            }}>
                              {isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default AstrologerDiscounts

