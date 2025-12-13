import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import useBreadStars from '../hooks/useBreadStars'
import usePageTitle from '../hooks/usePageTitle'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { fetchServiceDetail } from '../utils/api'

const InnerService = () => {
  useBreadStars()
  
  const { id } = useParams() // Get service ID or slug from URL
  const [service, setService] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [failedImages, setFailedImages] = useState(new Set())

  // Dynamic page title
  useEffect(() => {
    if (service && service.service_name) {
      document.title = `${service.service_name} - Service Details - Astrology Theme`
    } else {
      document.title = 'Service Details - Astrology Theme'
    }
  }, [service])

  useEffect(() => {
    const loadServiceData = async () => {
      if (!id) {
        setError('Service ID is required')
        setLoading(false)
        return
      }
      
      // Fetch immediately without blocking UI
      fetchServiceDetail(id).then(serviceRes => {
        if (serviceRes && serviceRes.status === 1 && serviceRes.data) {
          setService(serviceRes.data)
          setLoading(false)
        } else {
          setError(serviceRes?.msg || 'Service not found')
          setService(null)
          setLoading(false)
        }
      }).catch(err => {
        setError(err.message || 'An unexpected error occurred')
        setLoading(false)
      })
    }

    loadServiceData()
  }, [id])

  // Helper function to strip HTML tags and decode entities
  const stripHtml = (html) => {
    if (!html) return ''
    const tmp = document.createElement('DIV')
    tmp.innerHTML = html
    const text = tmp.textContent || tmp.innerText || ''
    return text.trim()
  }

  // Handle image errors
  const handleImageError = (e, originalSrc) => {
    const fallback = 'https://images.unsplash.com/photo-1598751337726-3c8577d00bd3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    if (originalSrc && e.target.src !== fallback) {
      setFailedImages(prev => new Set(prev).add(originalSrc))
      e.target.src = fallback
      e.target.onerror = null
    }
  }

  // Get safe image URL
  const getSafeImageUrl = (service) => {
    const fallback = 'https://images.unsplash.com/photo-1598751337726-3c8577d00bd3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    const originalSrc = service?.service_image || service?.service_image_url
    
    // Check for HTML content in image field
    const hasHtmlContent = originalSrc && typeof originalSrc === 'string' && /<[^>]+>/.test(originalSrc)
    
    if (!originalSrc || hasHtmlContent || failedImages.has(originalSrc)) {
      return fallback
    }
    
    return originalSrc
  }

  if (loading) {
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
            <h1 className="react-new-bread-hero-title">Loading Service...</h1>
          </div>
        </section>
        <div className="container" style={{padding: '40px', textAlign: 'center'}}>
          <p>Loading service details...</p>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !service) {
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
            <h1 className="react-new-bread-hero-title">Service Not Found</h1>
            <div className="react-new-bread-breadcrumbs">
              <Link to="/">Home</Link>
              <span className="react-new-bread-breadcrumb-separator">/</span>
              <Link to="/services">Services</Link>
              <span className="react-new-bread-breadcrumb-separator">/</span>
              <span>Not Found</span>
            </div>
          </div>
        </section>
        <div className="container" style={{padding: '40px', textAlign: 'center'}}>
          <p style={{fontSize: '18px', color: '#666', marginBottom: '20px'}}>
            {error || 'Service not found'}
          </p>
          <Link to="/services" style={{
            padding: '12px 24px',
            background: '#8B5CF6',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '5px',
            display: 'inline-block'
          }}>
            Back to Services
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  const cleanDescription = stripHtml(service.service_description || '')
  const safeImageUrl = getSafeImageUrl(service)

  return (
    <div>
      <Navbar />

      {/* Breadcrumb */}
      <section className="react-new-bread-hero-container">
        <div className="react-new-bread-hero-bg-pattern"></div>
        <div className="react-new-bread-hero-stars" id="react-new-bread-stars-container"></div>
        <div className="react-new-bread-hero-content">
          <div className="react-new-bread-astrology-icon">
            <i className="fas fa-star-and-crescent"></i>
          </div>
          <h1 className="react-new-bread-hero-title">{service.service_name || 'Service Details'}</h1>
          <div className="react-new-bread-breadcrumbs">
            <Link to="/">Home</Link>
            <span className="react-new-bread-breadcrumb-separator">/</span>
            <Link to="/services">Services</Link>
            <span className="react-new-bread-breadcrumb-separator">/</span>
            <span>{service.service_name || 'Service'}</span>
          </div>
        </div>
      </section>

      {/* Service Details */}
      <section className="container" style={{padding: '60px 20px'}}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          background: '#fff',
          borderRadius: '10px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          {/* Service Image */}
          <div style={{
            width: '100%',
            height: '400px',
            overflow: 'hidden',
            background: '#f5f5f5'
          }}>
            <img 
              src={safeImageUrl} 
              alt={service.service_name || 'Service'} 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              onError={(e) => handleImageError(e, service.service_image || service.service_image_url)}
              loading="lazy"
            />
          </div>

          {/* Service Content */}
          <div style={{padding: '40px'}}>
            <h2 style={{
              fontSize: '32px',
              color: '#333',
              marginBottom: '20px',
              fontWeight: 'bold'
            }}>
              {service.service_name || 'Service'}
            </h2>

            {service.price && (
              <div style={{
                fontSize: '24px',
                color: '#8B5CF6',
                fontWeight: 'bold',
                marginBottom: '20px'
              }}>
                ₹{service.price}
              </div>
            )}

            {service.title && (
              <div style={{
                fontSize: '18px',
                color: '#666',
                marginBottom: '20px',
                fontStyle: 'italic'
              }}>
                Category: {service.title}
              </div>
            )}

            {cleanDescription && (
              <div style={{
                fontSize: '16px',
                color: '#555',
                lineHeight: '1.8',
                marginTop: '30px'
              }}>
                <h3 style={{fontSize: '20px', marginBottom: '15px', color: '#333'}}>Description</h3>
                <div dangerouslySetInnerHTML={{ __html: cleanDescription.replace(/\n/g, '<br>') }} />
              </div>
            )}

            {!cleanDescription && (
              <div style={{
                fontSize: '16px',
                color: '#999',
                fontStyle: 'italic',
                marginTop: '30px'
              }}>
                No description available for this service.
              </div>
            )}

            <div style={{marginTop: '40px', paddingTop: '30px', borderTop: '1px solid #eee'}}>
              <Link 
                to="/services" 
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  background: '#8B5CF6',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '5px',
                  marginRight: '10px'
                }}
              >
                <i className="fas fa-arrow-left" style={{marginRight: '8px'}}></i>
                Back to Services
              </Link>
              <button 
                style={{
                  padding: '12px 24px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
                onClick={() => {
                  // Add booking functionality here
                  alert('Booking functionality will be implemented here')
                }}
              >
                <i className="fas fa-calendar-check" style={{marginRight: '8px'}}></i>
                Book This Service
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default InnerService

