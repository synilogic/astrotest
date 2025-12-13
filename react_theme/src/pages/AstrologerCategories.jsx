import React, { useEffect, useState } from 'react'
import { fetchAstrologerCategories, fetchFeaturedCategories } from '../utils/api'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import usePageTitle from '../hooks/usePageTitle'

const AstrologerCategories = () => {
  usePageTitle('Astrologer Categories - Astrology Theme')
  
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('all') // 'all' or 'featured'

  const loadCategories = async (search = '') => {
    setLoading(true)
    try {
      let result
      if (viewMode === 'featured') {
        result = await fetchFeaturedCategories(search)
      } else {
        result = await fetchAstrologerCategories(search, null)
      }
      
      if (result.status === 1 && result.data) {
        setCategories(result.data)
      } else {
        setCategories([])
      }
    } catch (error) {
      console.error('Error loading categories:', error)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories(searchQuery)
  }, [viewMode])

  const handleSearch = (e) => {
    e.preventDefault()
    loadCategories(searchQuery)
  }

  const handleViewModeChange = (mode) => {
    setViewMode(mode)
    setSearchQuery('')
  }

  return (
    <div>
      <Navbar />
      
      <section style={{ padding: '50px 0', minHeight: '60vh', background: '#f8f9fa' }}>
        <div className="container">
          <div className="row mb-4">
            <div className="col-12">
              <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '10px' }}>
                Astrologer Categories
              </h1>
              <p style={{ color: '#666', fontSize: '1.1rem' }}>
                Browse astrologers by their specialization categories
              </p>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="row mb-4">
            <div className="col-12">
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button
                  onClick={() => handleViewModeChange('all')}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    border: viewMode === 'all' ? '2px solid #7c3aed' : '1px solid #ddd',
                    background: viewMode === 'all' ? '#7c3aed' : 'white',
                    color: viewMode === 'all' ? 'white' : '#666',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                >
                  All Categories
                </button>
                <button
                  onClick={() => handleViewModeChange('featured')}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '8px',
                    border: viewMode === 'featured' ? '2px solid #7c3aed' : '1px solid #ddd',
                    background: viewMode === 'featured' ? '#7c3aed' : 'white',
                    color: viewMode === 'featured' ? 'white' : '#666',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                >
                  Featured Categories
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="row mb-4">
            <div className="col-md-6">
              <form onSubmit={handleSearch}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                      fontSize: '1rem'
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: '12px 24px',
                      borderRadius: '8px',
                      border: 'none',
                      background: '#7c3aed',
                      color: 'white',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    <i className="fas fa-search"></i> Search
                  </button>
                </div>
              </form>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p style={{ marginTop: '20px', color: '#666' }}>Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 0', background: 'white', borderRadius: '12px' }}>
              <i className="fas fa-tags" style={{ fontSize: '4rem', color: '#ddd', marginBottom: '20px' }}></i>
              <h3>No categories found</h3>
              <p style={{ color: '#666' }}>Try adjusting your search or view mode.</p>
            </div>
          ) : (
            <div className="row g-4">
              {categories.map((category, index) => {
                const astrologerCount = category.astrologer_list?.length || 0
                
                return (
                  <div key={category.id || index} className="col-md-6 col-lg-4">
                    <Link 
                      to={`/talk-to-astrologers?category=${category.id}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <div
                        style={{
                          background: 'white',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                          border: '1px solid #e9ecef',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          cursor: 'pointer',
                          height: '100%'
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
                        {/* Category Image */}
                        <div style={{ position: 'relative', paddingTop: '60%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                          {category.category_images ? (
                            <img
                              src={category.category_images}
                              alt={category.category_title}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <i className="fas fa-star" style={{ fontSize: '3rem', color: 'white', opacity: 0.8 }}></i>
                            </div>
                          )}
                          {category.featured_status === 1 && (
                            <span
                              style={{
                                position: 'absolute',
                                top: '12px',
                                right: '12px',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                background: '#f59e0b',
                                color: 'white',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                              }}
                            >
                              <i className="fas fa-star"></i> Featured
                            </span>
                          )}
                        </div>

                        {/* Category Details */}
                        <div style={{ padding: '20px' }}>
                          <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '10px', color: '#2c3e50' }}>
                            {category.category_title || 'Category'}
                          </h3>
                          
                          {category.category_description && (
                            <p style={{ 
                              fontSize: '0.9rem', 
                              color: '#666', 
                              marginBottom: '15px',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              minHeight: '40px'
                            }}>
                              {category.category_description}
                            </p>
                          )}

                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            paddingTop: '15px',
                            borderTop: '1px solid #e9ecef'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <i className="fas fa-users" style={{ color: '#7c3aed' }}></i>
                              <span style={{ fontSize: '0.9rem', color: '#666', fontWeight: '500' }}>
                                {astrologerCount > 0 
                                  ? `${astrologerCount} Astrologer${astrologerCount > 1 ? 's' : ''}`
                                  : 'No astrologers'
                                }
                              </span>
                            </div>
                            <i className="fas fa-arrow-right" style={{ color: '#7c3aed', fontSize: '1.2rem' }}></i>
                          </div>
                        </div>
                      </div>
                    </Link>
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

export default AstrologerCategories

