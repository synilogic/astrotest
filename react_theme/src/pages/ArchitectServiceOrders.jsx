import React, { useEffect, useState } from 'react'
import { fetchArchitectServiceOrders } from '../utils/api'
import { getCurrentUser } from '../utils/api'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import usePageTitle from '../hooks/usePageTitle'

const ArchitectServiceOrders = () => {
  usePageTitle('My Architect Service Orders - Astrology Theme')
  
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')

  const loadOrders = async (newOffset = 0, append = false) => {
    setLoading(true)
    try {
      const result = await fetchArchitectServiceOrders(newOffset, '', statusFilter, paymentFilter)
      if (result.status === 1 && result.data) {
        if (append) {
          setOrders(prev => [...prev, ...result.data])
        } else {
          setOrders(result.data)
        }
        setOffset(result.offset || newOffset + 10)
        setHasMore(result.data.length >= 10)
      } else {
        if (!append) {
          setOrders([])
        }
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error loading architect service orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const user = getCurrentUser()
    if (user) {
      loadOrders(0, false)
    } else {
      setLoading(false)
    }
  }, [statusFilter, paymentFilter])

  const handleLoadMore = () => {
    loadOrders(offset, true)
  }

  const getStatusBadgeStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return { bg: '#d4edda', color: '#155724' }
      case 'in-progress':
        return { bg: '#cfe2ff', color: '#084298' }
      case 'pending':
        return { bg: '#fff3cd', color: '#856404' }
      case 'cancelled':
        return { bg: '#f8d7da', color: '#721c24' }
      default:
        return { bg: '#e9ecef', color: '#6c757d' }
    }
  }

  const getPaymentBadgeStyle = (paymentStatus) => {
    return paymentStatus?.toLowerCase() === 'paid'
      ? { bg: '#d4edda', color: '#155724' }
      : { bg: '#f8d7da', color: '#721c24' }
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

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A'
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
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
          <h2>Please login to view your architect service orders</h2>
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
                My Architect Service Orders
              </h1>
              <p style={{ color: '#666', fontSize: '1.1rem' }}>
                View and manage all your architect service bookings
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
                onChange={(e) => { setStatusFilter(e.target.value); setOffset(0) }}
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
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="col-md-4">
              <label htmlFor="paymentFilter" style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                Filter by Payment:
              </label>
              <select
                id="paymentFilter"
                className="form-select"
                value={paymentFilter}
                onChange={(e) => { setPaymentFilter(e.target.value); setOffset(0) }}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '1rem'
                }}
              >
                <option value="">All Payments</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
          </div>

          {loading && orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p style={{ marginTop: '20px', color: '#666' }}>Loading orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 0', background: 'white', borderRadius: '12px' }}>
              <i className="fas fa-clipboard-list" style={{ fontSize: '4rem', color: '#ddd', marginBottom: '20px' }}></i>
              <h3>No service orders found</h3>
              <p style={{ color: '#666' }}>You don't have any architect service orders yet.</p>
            </div>
          ) : (
            <>
              <div className="row g-4">
                {orders.map((order, index) => {
                  const statusStyle = getStatusBadgeStyle(order.status)
                  const paymentStyle = getPaymentBadgeStyle(order.payment_status)
                  
                  return (
                    <div key={order.id || index} className="col-12">
                      <div
                        style={{
                          background: 'white',
                          borderRadius: '12px',
                          padding: '25px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                          border: '1px solid #e9ecef',
                          transition: 'transform 0.2s, box-shadow 0.2s'
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
                        <div className="row">
                          <div className="col-md-8">
                            <div className="d-flex align-items-center mb-3">
                              <h4 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '600', color: '#2c3e50' }}>
                                Order #{order.id}
                              </h4>
                              <span
                                style={{
                                  marginLeft: '15px',
                                  padding: '5px 12px',
                                  borderRadius: '6px',
                                  fontSize: '0.85rem',
                                  fontWeight: '500',
                                  backgroundColor: statusStyle.bg,
                                  color: statusStyle.color,
                                  textTransform: 'capitalize'
                                }}
                              >
                                {order.status}
                              </span>
                              <span
                                style={{
                                  marginLeft: '10px',
                                  padding: '5px 12px',
                                  borderRadius: '6px',
                                  fontSize: '0.85rem',
                                  fontWeight: '500',
                                  backgroundColor: paymentStyle.bg,
                                  color: paymentStyle.color,
                                  textTransform: 'capitalize'
                                }}
                              >
                                {order.payment_status}
                              </span>
                            </div>

                            <div style={{ color: '#666', fontSize: '0.95rem' }}>
                              <div className="row g-3">
                                {order.architect_name && order.architect_name !== 'N/A' && (
                                  <div className="col-sm-6">
                                    <i className="fas fa-user-tie" style={{ marginRight: '8px', color: '#7c3aed' }}></i>
                                    <strong>Architect:</strong> {order.architect_name}
                                  </div>
                                )}
                                {order.order_type && (
                                  <div className="col-sm-6">
                                    <i className="fas fa-tag" style={{ marginRight: '8px', color: '#7c3aed' }}></i>
                                    <strong>Type:</strong> {order.order_type}
                                  </div>
                                )}
                                {order.order_date && (
                                  <div className="col-sm-6">
                                    <i className="fas fa-calendar" style={{ marginRight: '8px', color: '#7c3aed' }}></i>
                                    <strong>Order Date:</strong> {formatDate(order.order_date)}
                                  </div>
                                )}
                                {order.duration && (
                                  <div className="col-sm-6">
                                    <i className="fas fa-clock" style={{ marginRight: '8px', color: '#7c3aed' }}></i>
                                    <strong>Duration:</strong> {order.duration}
                                  </div>
                                )}
                                {order.order_start && (
                                  <div className="col-sm-6">
                                    <i className="fas fa-play-circle" style={{ marginRight: '8px', color: '#7c3aed' }}></i>
                                    <strong>Start:</strong> {formatDateTime(order.order_start)}
                                  </div>
                                )}
                                {order.order_end && (
                                  <div className="col-sm-6">
                                    <i className="fas fa-stop-circle" style={{ marginRight: '8px', color: '#7c3aed' }}></i>
                                    <strong>End:</strong> {formatDateTime(order.order_end)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="col-md-4">
                            <div style={{ 
                              height: '100%', 
                              display: 'flex', 
                              flexDirection: 'column', 
                              justifyContent: 'space-between',
                              alignItems: 'flex-end'
                            }}>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#7c3aed', marginBottom: '8px' }}>
                                  ₹{parseFloat(order.charge).toFixed(2)}
                                </div>
                                {order.where_from && (
                                  <div style={{ fontSize: '0.85rem', color: '#999', marginBottom: '5px' }}>
                                    From: {order.where_from}
                                  </div>
                                )}
                                <div style={{ fontSize: '0.85rem', color: '#999' }}>
                                  Booked: {formatDate(order.created_at)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
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

export default ArchitectServiceOrders

