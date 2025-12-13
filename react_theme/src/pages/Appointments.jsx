import React, { useEffect, useState } from 'react'
import { fetchAppointmentOrders } from '../utils/api'
import { getCurrentUser } from '../utils/api'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import usePageTitle from '../hooks/usePageTitle'

const Appointments = () => {
  usePageTitle('My Appointments - Astrology Theme')
  
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  const loadAppointments = async (newOffset = 0, append = false) => {
    setLoading(true)
    try {
      const result = await fetchAppointmentOrders(newOffset, statusFilter)
      if (result.status === 1 && result.data) {
        if (append) {
          setAppointments(prev => [...prev, ...result.data])
        } else {
          setAppointments(result.data)
        }
        setOffset(result.offset || newOffset + 10)
        setHasMore(result.data.length >= 10)
      } else {
        if (!append) {
          setAppointments([])
        }
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error loading appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const user = getCurrentUser()
    if (user) {
      loadAppointments(0, false)
    } else {
      setLoading(false)
    }
  }, [statusFilter])

  const handleLoadMore = () => {
    loadAppointments(offset, true)
  }

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value)
    setOffset(0)
  }

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-success'
      case 'in-progress':
        return 'bg-primary'
      case 'pending':
        return 'bg-warning'
      case 'cancel':
        return 'bg-danger'
      default:
        return 'bg-secondary'
    }
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

  const formatTime = (timeStr) => {
    if (!timeStr) return 'N/A'
    return timeStr
  }

  const user = getCurrentUser()

  if (!user) {
    return (
      <div>
        <Navbar />
        <div className="container" style={{ padding: '50px 20px', textAlign: 'center' }}>
          <h2>Please login to view your appointments</h2>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div>
      <Navbar />
      
      <section style={{ padding: '50px 0', minHeight: '60vh' }}>
        <div className="container">
          <div className="row mb-4">
            <div className="col-12">
              <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '10px' }}>
                My Appointments
              </h1>
              <p style={{ color: '#666', fontSize: '1.1rem' }}>
                View and manage all your appointment bookings
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
                value={statusFilter}
                onChange={handleStatusFilterChange}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '1rem'
                }}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancel">Cancelled</option>
              </select>
            </div>
          </div>

          {loading && appointments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p style={{ marginTop: '20px', color: '#666' }}>Loading appointments...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <i className="fas fa-calendar-times" style={{ fontSize: '4rem', color: '#ddd', marginBottom: '20px' }}></i>
              <h3>No appointments found</h3>
              <p style={{ color: '#666' }}>You don't have any appointment bookings yet.</p>
            </div>
          ) : (
            <>
              <div className="row g-4">
                {appointments.map((appointment, index) => (
                  <div key={appointment.id || index} className="col-12">
                    <div
                      style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '25px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        border: '1px solid #e9ecef',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
                      }}
                    >
                      <div className="row align-items-center">
                        <div className="col-md-2 text-center mb-3 mb-md-0">
                          <img
                            src={appointment.astrologer_img || 'https://via.placeholder.com/100'}
                            alt={appointment.astrologer_name}
                            style={{
                              width: '80px',
                              height: '80px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '3px solid #f0f0f0'
                            }}
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/100?text=Astrologer'
                            }}
                          />
                        </div>
                        
                        <div className="col-md-7">
                          <div className="d-flex align-items-center mb-2">
                            <h4 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '600' }}>
                              {appointment.astrologer_name}
                            </h4>
                            <span
                              className={`badge ${getStatusBadgeClass(appointment.status)}`}
                              style={{
                                marginLeft: '12px',
                                padding: '5px 12px',
                                fontSize: '0.85rem',
                                fontWeight: '500',
                                textTransform: 'capitalize'
                              }}
                            >
                              {appointment.status}
                            </span>
                          </div>
                          
                          <div style={{ color: '#666', fontSize: '0.95rem' }}>
                            <div className="row g-2">
                              <div className="col-sm-6">
                                <i className="fas fa-calendar-alt" style={{ marginRight: '8px', color: '#7c3aed' }}></i>
                                <strong>Date:</strong> {formatDate(appointment.slot_date)}
                              </div>
                              <div className="col-sm-6">
                                <i className="fas fa-clock" style={{ marginRight: '8px', color: '#7c3aed' }}></i>
                                <strong>Time:</strong> {formatTime(appointment.slot_start)} - {formatTime(appointment.slot_end)}
                              </div>
                              <div className="col-sm-6">
                                <i className="fas fa-hourglass-half" style={{ marginRight: '8px', color: '#7c3aed' }}></i>
                                <strong>Duration:</strong> {appointment.slot_duration || 'N/A'}
                              </div>
                              {appointment.order_id && (
                                <div className="col-sm-6">
                                  <i className="fas fa-receipt" style={{ marginRight: '8px', color: '#7c3aed' }}></i>
                                  <strong>Order ID:</strong> {appointment.order_id}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="col-md-3 text-md-end">
                          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#7c3aed', marginBottom: '8px' }}>
                            ₹{parseFloat(appointment.charge).toFixed(2)}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#999' }}>
                            Booked on {formatDate(appointment.created_at)}
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

export default Appointments

