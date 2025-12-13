import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { fetchBlogDetail, fetchBlogs } from '../utils/api'
import { decode } from 'html-entities'

const InnerBlog = () => {
  const { id } = useParams() // Can be slug or ID
  const [blog, setBlog] = useState(null)
  const [relatedBlogs, setRelatedBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [failedImage, setFailedImage] = useState(false)

  useEffect(() => {
    // Update page title when blog loads
    if (blog && blog.title) {
      document.title = `${blog.title} - Blog Details`
    } else {
      document.title = 'Blog Details'
    }
  }, [blog])

  useEffect(() => {
    const loadBlogData = async () => {
      if (!id) {
        setError('Blog ID or slug is missing.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      setBlog(null)
      setFailedImage(false)

      // Fetch blog detail immediately
      fetchBlogDetail(id).then(blogRes => {
        console.log('[InnerBlog] Blog detail response:', blogRes)
        if (blogRes.status === 1 && blogRes.data) {
          setBlog(blogRes.data)
          setLoading(false) // Show blog immediately
          
          // Fetch related blogs in background (non-blocking)
          // fetchBlogs(offset, limit) - positional parameters
          fetchBlogs(0, 20).then(relatedRes => {
            console.log('[InnerBlog] Related blogs response:', relatedRes)
            if (relatedRes && relatedRes.status === 1 && Array.isArray(relatedRes.data)) {
              const filtered = relatedRes.data
                .filter(b => b.id !== blogRes.data.id)
                .slice(0, 3)
              setRelatedBlogs(filtered)
              console.log('[InnerBlog] Related blogs filtered:', filtered.length)
            }
          }).catch((err) => {
            console.error('[InnerBlog] Error fetching related blogs:', err)
            // Silently ignore related blogs error
          })
        } else {
          console.warn('[InnerBlog] Blog not found or invalid response:', blogRes)
          setError(blogRes.msg || 'Blog not found.')
          setLoading(false)
        }
      }).catch(err => {
        console.error('[InnerBlog] Error fetching blog detail:', err)
        setError('Failed to load blog details.')
        setLoading(false)
      })
    }

    loadBlogData()
  }, [id])

  // Helper to decode HTML entities
  const cleanContent = (htmlString) => {
    if (!htmlString) return ''
    return decode(htmlString)
  }

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

  const handleImageError = () => {
    setFailedImage(true)
  }

  const imageUrl = blog?.blog_image && !failedImage
    ? blog.blog_image
    : 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'

  const authorName = blog?.astrologer?.display_name || blog?.user?.name || 'Astrologer'
  const authorAvatar = blog?.astrologer?.astro_img || blog?.user?.avatar || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400'
  const authorBio = blog?.astrologer?.bio || 'Experienced astrologer providing insights and guidance.'

  if (loading) {
    return (
      <>
        <Navbar />
        <section className="react-new-bread-hero-container">
          <div className="react-new-bread-hero-content">
            <h1 className="react-new-bread-hero-title">Blog Details</h1>
          </div>
        </section>
        <div className="container" style={{ textAlign: 'center', padding: '50px' }}>
          <p>Loading blog details...</p>
        </div>
        <Footer />
      </>
    )
  }

  if (error || !blog) {
    return (
      <>
        <Navbar />
        <section className="react-new-bread-hero-container">
          <div className="react-new-bread-hero-content">
            <h1 className="react-new-bread-hero-title">Blog Details</h1>
          </div>
        </section>
        <div className="container" style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
          <p>{error || 'Blog not found.'}</p>
          <Link to="/blogs" style={{ marginTop: '20px', display: 'inline-block' }}>
            Back to Blogs
          </Link>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      
      {/* Breadcrumb Hero Section */}
      <section className="react-new-bread-hero-container">
        <div className="react-new-bread-hero-bg-pattern"></div>
        <div className="react-new-bread-hero-stars" id="new-bread-stars-container"></div>
        <div className="react-new-bread-hero-content">
          <div className="react-new-bread-astrology-icon">
            <i className="fas fa-star-and-crescent"></i>
          </div>
          <h1 className="react-new-bread-hero-title">{blog.title || 'Blog Details'}</h1>
          <div className="react-new-bread-breadcrumbs">
            <Link to="/">Home</Link>
            <span className="react-new-bread-breadcrumb-separator">/</span>
            <Link to="/blogs">Blog</Link>
            <span className="react-new-bread-breadcrumb-separator">/</span>
            <span>{blog.title || 'Blog Details'}</span>
          </div>
        </div>
      </section>

      {/* Blog Page Content */}
      <div className="react-blog-page-container">
        <div className="react-blog-page-main-content">
          {/* Blog Post */}
          <article className="react-blog-page-post">
            <div className="react-blog-page-featured-image">
              <img 
                src={imageUrl} 
                alt={blog.title || 'Blog Image'} 
                onError={handleImageError}
              />
            </div>
            
            <div className="react-blog-page-post-header">
              <h1 className="react-blog-page-post-title">{blog.title || 'Blog Title'}</h1>
              
              <div className="react-blog-page-post-meta">
                {blog.astrologer?.astrologer_uni_id ? (
                  <Link to={`/astrologer?id=${blog.astrologer.astrologer_uni_id}`}>
                    <div className="react-blog-page-author-avatar">
                      <img src={authorAvatar} alt={authorName} />
                    </div>
                  </Link>
                ) : (
                  <div className="react-blog-page-author-avatar">
                    <img src={authorAvatar} alt={authorName} />
                  </div>
                )}
                <div className="react-blog-page-author-info">
                  {blog.astrologer?.astrologer_uni_id ? (
                    <Link to={`/astrologer?id=${blog.astrologer.astrologer_uni_id}`}>
                      {authorName}
                    </Link>
                  ) : (
                    <span>{authorName}</span>
                  )}
                  <span>{formatDate(blog.created_at)}</span>
                </div>
              </div>
            </div>
            
            <div 
              className="react-blog-page-post-content"
              dangerouslySetInnerHTML={{ __html: cleanContent(blog.content) }}
            />
          </article>

          {/* Sidebar */}
          <aside className="react-blog-page-sidebar">
            {/* Author Card */}
            <div className="react-blog-page-sidebar-card react-blog-page-author-card">
              <h2 className="react-blog-page-sidebar-title">Author</h2>
              {blog.astrologer?.astrologer_uni_id ? (
                <Link to={`/astrologer?id=${blog.astrologer.astrologer_uni_id}`}>
                  <div className="react-blog-page-author-avatar2">
                    <img src={authorAvatar} alt={authorName} />
                  </div>
                </Link>
              ) : (
                <div className="react-blog-page-author-avatar2">
                  <img src={authorAvatar} alt={authorName} />
                </div>
              )}
              {blog.astrologer?.astrologer_uni_id ? (
                <Link to={`/astrologer?id=${blog.astrologer.astrologer_uni_id}`}>
                  {authorName}
                </Link>
              ) : (
                <span>{authorName}</span>
              )}
              <p>{authorBio}</p>
            </div>

            {/* Latest Posts */}
            {relatedBlogs.length > 0 && (
              <div className="react-blog-page-sidebar-card">
                <h2 className="react-blog-page-sidebar-title">Related Posts</h2>
                <div className="react-blog-page-latest-posts">
                  {relatedBlogs.map((post) => (
                    <Link key={post.id} to={`/blog/${post.slug || post.id}`}>
                      <div className="react-blog-page-post-item">
                        <div className="react-blog-page-post-thumbnail">
                          <img 
                            src={post.blog_image || 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80'} 
                            alt={post.title || 'Blog'} 
                          />
                        </div>
                        <div className="react-blog-page-post-info">
                          <h4>{post.title || 'Blog Title'}</h4>
                          <span>{formatDate(post.created_at)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      <Footer />
    </>
  )
}

export default InnerBlog
