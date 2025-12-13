import React, { useEffect, useState } from 'react'
import useBreadStars from '../hooks/useBreadStars'
import usePageTitle from '../hooks/usePageTitle'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Link } from 'react-router-dom'
import { fetchBlogs } from '../utils/api'

const Blogs = () => {
  useBreadStars()
  usePageTitle('Blogs - Astrology Theme')

  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [failedImages, setFailedImages] = useState(new Set())

  useEffect(() => {
    const loadBlogs = async () => {
      setLoading(true)
      setError(null)

      // Fetch first batch immediately, then fetch more in background
      // fetchBlogs(offset, limit) - positional parameters
      fetchBlogs(0, 20).then(firstBatch => {
        console.log('[Blogs] First batch response:', firstBatch)
        if (firstBatch && firstBatch.status === 1 && Array.isArray(firstBatch.data) && firstBatch.data.length > 0) {
          setBlogs(firstBatch.data) // Show first batch immediately
          setLoading(false)
          
          // Fetch additional batches in background
          let allBlogs = [...firstBatch.data]
          let currentOffset = firstBatch.offset || firstBatch.data.length
          const maxBatches = 2 // Fetch 2 more batches
          
          const fetchMore = async () => {
            for (let batch = 0; batch < maxBatches; batch++) {
              try {
                const blogsRes = await fetchBlogs(currentOffset, 20)
                if (blogsRes && blogsRes.status === 1 && Array.isArray(blogsRes.data) && blogsRes.data.length > 0) {
                  allBlogs = [...allBlogs, ...blogsRes.data]
                  setBlogs([...allBlogs]) // Update with more blogs
                  currentOffset = blogsRes.offset || (currentOffset + blogsRes.data.length)
                } else {
                  break
                }
              } catch (err) {
                console.error('[Blogs] Error fetching more blogs:', err)
                break
              }
            }
          }
          
          fetchMore()
        } else {
          console.warn('[Blogs] No blogs found or invalid response:', firstBatch)
          setBlogs([])
          setLoading(false)
        }
      }).catch((err) => {
        console.error('[Blogs] Error fetching blogs:', err)
        setError('Failed to load blogs. Please try again later.')
        setLoading(false)
      })
    }

    loadBlogs()
  }, [])

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch (e) {
      return dateString
    }
  }

  // Helper to strip HTML tags from content
  const stripHtml = (htmlString) => {
    if (!htmlString) return ''
    const doc = new DOMParser().parseFromString(htmlString, 'text/html')
    return doc.body.textContent || ''
  }

  // Get excerpt (first 120 characters)
  const getExcerpt = (content) => {
    const text = stripHtml(content || '')
    return text.length > 120 ? text.substring(0, 120) + '...' : text
  }

  const handleImageError = (e, originalSrc) => {
    if (originalSrc && !failedImages.has(originalSrc)) {
      setFailedImages(prev => new Set(prev).add(originalSrc))
      e.target.src = 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    }
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
          <h1 className="react-new-bread-hero-title">Our Blogs</h1>
          <div className="react-new-bread-breadcrumbs">
            <Link to="/">Home</Link>
            <span className="react-new-bread-breadcrumb-separator">/</span>
            <span>Our Blogs</span>
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <p>Loading blogs...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
              <p>{error}</p>
            </div>
          ) : blogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <p>No blogs found.</p>
            </div>
          ) : (
            <div className="react-blog-Page">
              {blogs.map((blog, index) => {
                const fallback = 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
                const originalSrc = blog.blog_image
                const shouldUseFallback = !originalSrc || failedImages.has(originalSrc)
                const safeImageUrl = shouldUseFallback ? fallback : originalSrc

                const authorName = blog.astrologer?.display_name || blog.user?.name || 'Astrologer'
                const categoryTitle = blog.blogcategory_short?.title || blog.category_title || 'Astrology'

                return (
                  <div key={blog.id || index} className="react-blog-card react-blog-card-shadow">
                    <div className="react-blog-image-container">
                      <img 
                        src={safeImageUrl} 
                        alt={blog.title || 'Blog'} 
                        className="react-blog-image"
                        loading="lazy"
                        onError={(e) => handleImageError(e, originalSrc)}
                      />
                      {categoryTitle && (
                        <div className="react-blog-category">{categoryTitle}</div>
                      )}
                    </div>
                    <div className="react-blog-content">
                      <h3 className="react-blog-title">{blog.title || 'Blog Title'}</h3>
                      <p className="react-blog-excerpt">
                        {getExcerpt(blog.content) || 'Read our latest insights about astrology and cosmic events.'}
                      </p>
                      <div className="react-blog-meta">
                        <div className="react-meta-item">
                          <i className="fa-solid fa-calendar"></i>
                          {formatDate(blog.created_at)}
                        </div>
                        <div className="react-meta-item">
                          <i className="fa-solid fa-user"></i>
                          {authorName}
                        </div>
                      </div>
                      <Link 
                        to={`/blog/${blog.slug || blog.id}`} 
                        className="react-blog-link"
                      >
                        Read More <i className="fa-solid fa-arrow-right"></i>
                      </Link>
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

export default Blogs
