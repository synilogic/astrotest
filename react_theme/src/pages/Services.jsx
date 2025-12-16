import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import useBreadStars from '../hooks/useBreadStars'
import usePageTitle from '../hooks/usePageTitle'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { fetchServices, fetchServiceCategories, fetchOurServices } from '../utils/api'

const Services = () => {
  useBreadStars()
  usePageTitle('Our Services - Astrology Theme')

  const [searchParams] = useSearchParams()
  // Decode URL parameter (handles %20 for spaces, etc.)
  const categoryParamRaw = searchParams.get('category')
  const categoryParam = categoryParamRaw ? decodeURIComponent(categoryParamRaw) : null // Can be category name or ID

  const [services, setServices] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [failedImages, setFailedImages] = useState(new Set())
  const [ourServices, setOurServices] = useState([])
  const [loadingOurServices, setLoadingOurServices] = useState(false)
  const [showOurServices, setShowOurServices] = useState(false)

  // Helper function to strip HTML tags and decode entities
  const stripHtml = (html) => {
    if (!html) return ''
    const tmp = document.createElement('DIV')
    tmp.innerHTML = html
    const text = tmp.textContent || tmp.innerText || ''
    return text.trim()
  }

  // Fetch service categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        console.log('[Services] Fetching service categories...')
        const categoriesRes = await fetchServiceCategories({ offset: 0, search: '' })
        console.log('[Services] Categories response:', categoriesRes)
        
        if (categoriesRes && categoriesRes.status === 1 && Array.isArray(categoriesRes.data)) {
          console.log('[Services] Categories loaded:', categoriesRes.data.length)
          setCategories(categoriesRes.data)
          
          // Handle category selection from URL parameter
          if (categoryParam) {
            const categoryIdNum = parseInt(categoryParam, 10)
            const searchParam = decodeURIComponent(categoryParam).trim()
            
            // First try exact match by ID
            let foundCategory = !isNaN(categoryIdNum) 
              ? categoriesRes.data.find(cat => cat.id === categoryIdNum)
              : null
            
            // If not found by ID, try exact case-insensitive match by title
            if (!foundCategory) {
              foundCategory = categoriesRes.data.find(cat => {
                const catTitle = (cat.title || cat.category_title || '').trim()
                return catTitle.toLowerCase() === searchParam.toLowerCase()
              })
            }
            
            // If not found, try by slug (exact match)
            if (!foundCategory) {
              const slugSearch = searchParam.toLowerCase().replace(/\s+/g, '-')
              foundCategory = categoriesRes.data.find(cat => {
                const catSlug = (cat.slug || '').toLowerCase().trim()
                return catSlug === slugSearch
              })
            }
            
            // If still not found, try case-insensitive partial match
            if (!foundCategory) {
              foundCategory = categoriesRes.data.find(cat => {
                const catTitle = (cat.title || cat.category_title || '').toLowerCase().trim()
                const searchLower = searchParam.toLowerCase().trim()
                return catTitle.includes(searchLower) || searchLower.includes(catTitle)
              })
            }
            
            if (foundCategory) {
              setSelectedCategory(foundCategory.id)
            } else {
              // Fallback to first category if not found
              if (categoriesRes.data.length > 0) {
                setSelectedCategory(categoriesRes.data[0].id)
              }
            }
          } else {
            // Select first category by default if no URL param
            if (categoriesRes.data.length > 0 && !selectedCategory) {
              setSelectedCategory(categoriesRes.data[0].id)
            }
          }
        }
      } catch (error) {
        console.error('[Services] Error loading categories:', error)
      }
    }

    loadCategories()
  }, [categoryParam])

  // Fetch services when category changes (instant loading)
  useEffect(() => {
    const loadServices = async () => {
      if (selectedCategory === null) return

      // Don't block UI with loading state - update immediately
      // fetchServices(categoryIdOrSlug, offset, limit)
      fetchServices(selectedCategory, 0, 20).then(servicesRes => {
        console.log('[Services] Services response:', servicesRes)
        if (servicesRes && servicesRes.status === 1 && Array.isArray(servicesRes.data)) {
          setServices(servicesRes.data)
          console.log('[Services] Services loaded:', servicesRes.data.length)
        } else {
          console.warn('[Services] Services response invalid:', servicesRes)
          setServices([])
        }
      }).catch((err) => {
        console.error('[Services] Error fetching services:', err)
        setServices([])
      })
    }

    loadServices()
  }, [selectedCategory])

  // Fetch our_services data
  useEffect(() => {
    const loadOurServices = async () => {
      setLoadingOurServices(true)
      try {
        const result = await fetchOurServices(0)
        if (result && result.status === 1 && Array.isArray(result.data)) {
          setOurServices(result.data)
          console.log('[Services] Our Services loaded:', result.data.length)
        } else {
          console.warn('[Services] Our Services response invalid:', result)
          setOurServices([])
        }
      } catch (error) {
        console.error('[Services] Error fetching our services:', error)
        setOurServices([])
      } finally {
        setLoadingOurServices(false)
      }
    }

    loadOurServices()
  }, [])

  // Handle image errors
  const handleImageError = (e, originalSrc) => {
    if (originalSrc && e.target.src !== 'https://images.unsplash.com/photo-1598751337726-3c8577d00bd3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80') {
      setFailedImages(prev => new Set(prev).add(originalSrc))
      e.target.src = 'https://images.unsplash.com/photo-1598751337726-3c8577d00bd3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
      e.target.onerror = null
    }
  }

  // Get safe image URL
  const getSafeImageUrl = (service) => {
    const fallback = 'https://images.unsplash.com/photo-1598751337726-3c8577d00bd3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    const originalSrc = service.service_image || service.service_image_url
    
    // Check for HTML content in image field
    const hasHtmlContent = originalSrc && typeof originalSrc === 'string' && /<[^>]+>/.test(originalSrc)
    
    if (!originalSrc || hasHtmlContent || failedImages.has(originalSrc)) {
      return fallback
    }
    
    return originalSrc
  }

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
          <h1 className="react-new-bread-hero-title">Our Services</h1>
          <div className="react-new-bread-breadcrumbs">
            <Link to="/">Home</Link>
            <span className="react-new-bread-breadcrumb-separator">/</span>
            <span>Our Services</span>
          </div>
        </div>
      </section>

      {/* Main */}
      <div className="container">
        {/* Toggle buttons for Services and Our Services */}
        <div style={{ marginBottom: '30px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={() => setShowOurServices(false)}
            style={{
              padding: '12px 30px',
              fontSize: '16px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: !showOurServices ? '#8B5CF6' : '#f0f0f0',
              color: !showOurServices ? '#fff' : '#333',
              transition: 'all 0.3s ease'
            }}
          >
            Services
          </button>
          <button
            onClick={() => setShowOurServices(true)}
            style={{
              padding: '12px 30px',
              fontSize: '16px',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: showOurServices ? '#8B5CF6' : '#f0f0f0',
              color: showOurServices ? '#fff' : '#333',
              transition: 'all 0.3s ease'
            }}
          >
            Our Services
          </button>
        </div>

        {!showOurServices ? (
          <div className="react-services-container">
            <div className="react-services-sidebar">
              <div className="react-services-sidebar-header">
                <h2>Categories</h2>
                <p className="react-services-sidebar-subtitle">Explore our astrology services</p>
              </div>
            <div className="react-services-sidebar-content">
              {categories.length > 0 ? (
                <ul className="react-services-category-list">
                  {categories.map((category) => (
                    <li 
                      key={category.id} 
                      className={`react-services-category-item ${selectedCategory === category.id ? 'active' : ''}`}
                    >
                      <a 
                        href="#services" 
                        onClick={(e) => {
                          e.preventDefault()
                          setSelectedCategory(category.id)
                        }}
                      >
                        {category.title || category.category_title || 'Category'}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{padding: '20px', color: '#666'}}>Loading categories...</p>
              )}
            </div>
          </div>
          <div className="react-services-main-content">
            {services.length > 0 ? (
              <div className="react-services-services-grid">
                {services.map((service) => {
                  const safeImageUrl = getSafeImageUrl(service)
                  const cleanDescription = stripHtml(service.service_description || '')
                  
                  return (
                    <div key={service.id} className="react-services-service-card">
                      {service.price && parseFloat(service.price) > 0 && (
                        <div className="react-services-card-badge">Popular</div>
                      )}
                      <div className="react-services-card-image">
                        <img 
                          src={safeImageUrl} 
                          alt={service.service_name || 'Service'} 
                          onError={(e) => handleImageError(e, service.service_image || service.service_image_url)}
                          loading="lazy"
                        />
                      </div>
                      <div className="react-services-card-content">
                        <h3 className="react-services-card-title">
                          {service.service_name || 'Service'}
                        </h3>
                        <p className="react-services-card-description">
                          {cleanDescription || 'Explore our professional astrology service for guidance and solutions.'}
                        </p>
                        {service.price && (
                          <div className="react-services-card-price" style={{marginTop: '10px', fontWeight: 'bold', color: '#8B5CF6'}}>
                            ₹{service.price}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{textAlign: 'center', padding: '40px'}}>
                <p style={{fontSize: '18px', color: '#666'}}>
                  {selectedCategory 
                    ? 'No services found in this category. Try selecting a different category from the sidebar.' 
                    : 'Please select a category to view services.'}
                </p>
              </div>
            )}
          </div>
        </div>
        ) : (
          <div className="react-services-container">
            <div style={{ width: '100%' }}>
              <h2 style={{ marginBottom: '30px', textAlign: 'center', color: '#333' }}>Our Services</h2>
              {loadingOurServices ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p style={{ fontSize: '18px', color: '#666' }}>Loading our services...</p>
                </div>
              ) : ourServices.length > 0 ? (
                <div className="react-services-services-grid">
                  {ourServices.map((service) => {
                    const fallback = 'https://images.unsplash.com/photo-1598751337726-3c8577d00bd3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
                    const originalSrc = service.image
                    const hasHtmlContent = originalSrc && typeof originalSrc === 'string' && /<[^>]+>/.test(originalSrc)
                    const safeImageUrl = !originalSrc || hasHtmlContent || failedImages.has(originalSrc) 
                      ? fallback 
                      : originalSrc
                    const cleanContent = stripHtml(service.content || '')
                    
                    return (
                      <div key={service.id} className="react-services-service-card">
                        <div className="react-services-card-image">
                          <img 
                            src={safeImageUrl} 
                            alt={service.title || 'Service'} 
                            onError={(e) => {
                              if (originalSrc && e.target.src !== fallback) {
                                setFailedImages(prev => new Set(prev).add(originalSrc))
                                e.target.src = fallback
                                e.target.onerror = null
                              }
                            }}
                            loading="lazy"
                            style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                          />
                        </div>
                        <div className="react-services-card-content">
                          <h3 className="react-services-card-title">
                            {service.title || 'Service'}
                          </h3>
                          <p className="react-services-card-description">
                            {cleanContent || 'Explore our professional astrology service for guidance and solutions.'}
                          </p>
                          {service.slug && (
                            <Link 
                              to={`/service/${service.slug}`}
                              style={{
                                marginTop: '15px',
                                display: 'inline-block',
                                color: '#8B5CF6',
                                textDecoration: 'none',
                                fontWeight: 'bold'
                              }}
                            >
                              Read More →
                            </Link>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p style={{ fontSize: '18px', color: '#666' }}>No services available.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

export default Services
