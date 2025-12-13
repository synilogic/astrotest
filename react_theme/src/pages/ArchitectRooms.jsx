import React, { useEffect, useState } from 'react'
import { fetchArchitectRooms } from '../utils/api'
import { getCurrentUser } from '../utils/api'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import usePageTitle from '../hooks/usePageTitle'

const ArchitectRooms = () => {
  usePageTitle('My Architect Rooms - Astrology Theme')
  
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [statusFilter, setStatusFilter] = useState(null)

  const loadRooms = async (newOffset = 0, append = false) => {
    setLoading(true)
    try {
      const result = await fetchArchitectRooms(newOffset, '', statusFilter)
      if (result.status === 1 && result.data) {
        if (append) {
          setRooms(prev => [...prev, ...result.data])
        } else {
          setRooms(result.data)
        }
        setOffset(result.offset || newOffset + 10)
        setHasMore(result.data.length >= 10)
      } else {
        if (!append) {
          setRooms([])
        }
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error loading architect rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const user = getCurrentUser()
    if (user) {
      loadRooms(0, false)
    } else {
      setLoading(false)
    }
  }, [statusFilter])

  const handleLoadMore = () => {
    loadRooms(offset, true)
  }

  const handleStatusFilterChange = (e) => {
    const value = e.target.value
    setStatusFilter(value === '' ? null : parseInt(value))
    setOffset(0)
  }

  const getStatusBadgeClass = (status) => {
    return status === 1 ? 'bg-success' : 'bg-secondary'
  }

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
          <h2>Please login to view your architect rooms</h2>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div>
      <Navbar />
      
      <section style={{ padding: '50px 0', minHeight: '60vh', background: '#f8f9fa' }}>
        <div className="container">
          <div className="row mb-4">
            <div className="col-12">
              <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '10px' }}>
                My Architect Rooms
              </h1>
              <p style={{ color: '#666', fontSize: '1.1rem' }}>
                View and manage all your architect room designs
              </p>
            </div>
          </div>

          <div className="row mb-4">
            <div className="col-md-4">
              <label htmlFor="statusFilter" style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                Filter by Status:
              </label>
              <select
                id="statusFilter"
                className="form-select"
                value={statusFilter === null ? '' : statusFilter}
                onChange={handleStatusFilterChange}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '1rem'
                }}
              >
                <option value="">All Status</option>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
          </div>

          {loading && rooms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p style={{ marginTop: '20px', color: '#666' }}>Loading rooms...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 0', background: 'white', borderRadius: '12px' }}>
              <i className="fas fa-home" style={{ fontSize: '4rem', color: '#ddd', marginBottom: '20px' }}></i>
              <h3>No architect rooms found</h3>
              <p style={{ color: '#666' }}>You don't have any architect room designs yet.</p>
            </div>
          ) : (
            <>
              <div className="row g-4">
                {rooms.map((room, index) => (
                  <div key={room.id || index} className="col-md-6 col-lg-4">
                    <div
                      style={{
                        background: 'white',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        border: '1px solid #e9ecef',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        cursor: 'pointer',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
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
                      {/* Room Image */}
                      <div style={{ position: 'relative', paddingTop: '60%', background: '#f0f0f0' }}>
                        <img
                          src={room.room_image || 'https://via.placeholder.com/400x300?text=Room+Design'}
                          alt={room.room_name}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/400x300?text=Room+Design'
                          }}
                        />
                        <span
                          className={`badge ${getStatusBadgeClass(room.status)}`}
                          style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            padding: '6px 12px',
                            fontSize: '0.85rem',
                            fontWeight: '500'
                          }}
                        >
                          {room.status_label}
                        </span>
                      </div>

                      {/* Room Details */}
                      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <h4 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '8px', color: '#2c3e50' }}>
                          {room.room_name || 'Untitled Room'}
                        </h4>
                        
                        <div style={{ fontSize: '0.9rem', color: '#7f8c8d', marginBottom: '12px' }}>
                          <i className="fas fa-tag" style={{ marginRight: '6px' }}></i>
                          {room.room_type || 'N/A'}
                        </div>

                        {room.room_description && (
                          <p style={{ 
                            fontSize: '0.9rem', 
                            color: '#666', 
                            marginBottom: '15px',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {room.room_description}
                          </p>
                        )}

                        <div style={{ marginTop: 'auto' }}>
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '1fr 1fr', 
                            gap: '10px', 
                            marginBottom: '15px',
                            fontSize: '0.85rem',
                            color: '#555'
                          }}>
                            {room.dimensions && (
                              <div>
                                <i className="fas fa-ruler-combined" style={{ marginRight: '6px', color: '#7c3aed' }}></i>
                                {room.dimensions}
                              </div>
                            )}
                            {room.floor_number !== null && (
                              <div>
                                <i className="fas fa-layer-group" style={{ marginRight: '6px', color: '#7c3aed' }}></i>
                                Floor {room.floor_number}
                              </div>
                            )}
                          </div>

                          <div style={{ 
                            borderTop: '1px solid #e9ecef', 
                            paddingTop: '15px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div>
                              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#7c3aed' }}>
                                ₹{parseFloat(room.price).toFixed(2)}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#999' }}>
                                {formatDate(room.created_at)}
                              </div>
                            </div>
                            {room.architect_name && room.architect_name !== 'N/A' && (
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '4px' }}>
                                  Architect
                                </div>
                                <div style={{ fontSize: '0.85rem', fontWeight: '500', color: '#555' }}>
                                  {room.architect_name}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {hasMore && (
                <div style={{ textAlign: 'center', marginTop: '40px' }}>
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    style={{
                      padding: '12px 40px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      backgroundColor: '#7c3aed',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.6 : 1,
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) e.target.style.backgroundColor = '#6d28d9'
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) e.target.style.backgroundColor = '#7c3aed'
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Loading...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-plus-circle me-2"></i>
                        Load More
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default ArchitectRooms

