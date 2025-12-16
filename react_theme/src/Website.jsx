import React, { useEffect, useState } from 'react'
import Swiper from 'swiper'
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/effect-fade'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import VideoSections from './components/VideoSections'
import usePageTitle from './hooks/usePageTitle'  
import { fetchBanners, fetchBannerCategories, fetchServices, fetchTopAstrologers, fetchBlogs, fetchProductCategories, fetchReviews, fetchWelcomeData } from './utils/api'
import { Link } from 'react-router-dom'

// Helper function to get safe image URL with fallback
const getSafeImageUrl = (imageUrl, fallbackUrl, failedImagesSet) => {
  if (!imageUrl) return fallbackUrl
  // If this image has already failed, use fallback immediately
  if (failedImagesSet && failedImagesSet.has(imageUrl)) {
    return fallbackUrl
  }
  // For localhost URLs from port 8005/uploads/, they often don't exist
  // We'll still try to load them, but fallback will handle errors
  // Note: 404 errors in console are expected when images don't exist - this is normal browser behavior
  return imageUrl
}

const Landing = () => {
  usePageTitle('Home - Astrology Theme')
  
  // State for data
  const [banners, setBanners] = useState([])
  const [bannerCategories, setBannerCategories] = useState([])
  const [services, setServices] = useState([])
  const [astrologers, setAstrologers] = useState([])
  const [blogs, setBlogs] = useState([])
  const [productCategories, setProductCategories] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [failedImages, setFailedImages] = useState(new Set())
  const [whyChooseUsData, setWhyChooseUsData] = useState(null)

  // Fetch banners and welcome data first (priority - show immediately)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Fetch banners and banner categories in parallel
        const [bannersRes, bannerCategoriesRes] = await Promise.all([
          fetchBanners(),
          fetchBannerCategories()
        ])
        
        console.log('[Website] Banners response:', bannersRes)
        if (bannersRes && bannersRes.status === 1 && bannersRes.data && Array.isArray(bannersRes.data)) {
          console.log('[Website] Banners loaded:', bannersRes.data.length, 'banners')
          setBanners(bannersRes.data)
        } else {
          console.warn('[Website] Banners response invalid:', bannersRes)
          setBanners([])
        }
        
        console.log('[Website] Banner Categories response:', bannerCategoriesRes)
        if (bannerCategoriesRes && bannerCategoriesRes.status === 1 && bannerCategoriesRes.data) {
          console.log('[Website] Banner Categories loaded:', bannerCategoriesRes.data.length, 'categories')
          setBannerCategories(bannerCategoriesRes.data)
        } else {
          console.warn('[Website] Banner Categories response invalid:', bannerCategoriesRes)
          setBannerCategories([])
        }
        
        // Fetch welcome data for "Why Choose Us" section
        const welcomeRes = await fetchWelcomeData()
        if (welcomeRes && welcomeRes.status === 1 && welcomeRes.data) {
          console.log('[Website] Welcome data loaded:', welcomeRes.data)
          // Check if splash_screen_why_choose_us contains structured data
          const whyChooseUsText = welcomeRes.data.splash_screen_why_choose_us
          console.log('[Website] splash_screen_why_choose_us raw value:', whyChooseUsText)
          
          if (whyChooseUsText && whyChooseUsText.trim() !== '') {
            try {
              // Try to parse as JSON if it's structured data
              const parsed = JSON.parse(whyChooseUsText)
              console.log('[Website] Parsed JSON:', parsed)
              
              if (Array.isArray(parsed)) {
                // Remove duplicates based on title/heading
                const uniqueItems = parsed.filter((item, index, self) => 
                  index === self.findIndex(t => 
                    (t.title || t.heading || '') === (item.title || item.heading || '')
                  )
                )
                console.log('[Website] Why Choose Us unique items:', uniqueItems.length, 'out of', parsed.length)
                setWhyChooseUsData(uniqueItems)
              } else if (typeof parsed === 'object' && parsed !== null) {
                // If it's a single object, convert to array
                console.log('[Website] Single object found, converting to array')
                setWhyChooseUsData([parsed])
              } else {
                console.log('[Website] Parsed value is not an array or object')
                setWhyChooseUsData(null)
              }
            } catch (e) {
              // If not JSON, treat as plain text and use default structure
              console.log('[Website] Why Choose Us is plain text, using default structure:', e.message)
              setWhyChooseUsData(null)
            }
          } else {
            console.log('[Website] splash_screen_why_choose_us is empty or null')
            setWhyChooseUsData(null)
          }
        } else {
          console.log('[Website] Welcome data not loaded or invalid')
          setWhyChooseUsData(null)
        }
      } catch (error) {
        console.error('[Website] Error fetching initial data:', error)
      }
    }
    
    loadInitialData()
  }, [])

  // Fetch other data from backend in parallel (instant loading)
  useEffect(() => {
    // Fetch all data in parallel for instant display
    const loadData = async () => {
      // Start all API calls simultaneously
      const promises = [
        fetchServices(0, 0, 20).catch(() => null), // service_category_id: 0 = all services, offset, limit
        fetchTopAstrologers({ limit: 6 }).catch(() => null),
        fetchBlogs(0, 20).catch(() => null), // offset, limit
        fetchProductCategories({ offset: 0, limit: 20, status: 1 }).catch(() => null),
        fetchReviews({ offset: 0, status: 1 }).catch(() => null) // Fetch reviews from backend
      ]

      // Use Promise.allSettled to get results as they complete
      Promise.allSettled(promises).then((results) => {
        // Update state immediately for each completed request
        // Services
        console.log('[Website] Services promise result:', results[0])
        if (results[0].status === 'fulfilled' && results[0].value?.status === 1) {
          const servicesData = Array.isArray(results[0].value.data) ? results[0].value.data : []
          if (servicesData.length > 0) {
            setServices(servicesData)
            console.log('[Website] Services loaded:', servicesData.length, 'services')
            console.log('[Website] Services data:', servicesData)
          } else {
            console.warn('[Website] Services response has status 1 but empty data')
            console.warn('[Website] Services response:', results[0].value)
            setServices([])
          }
        } else {
          console.warn('[Website] Services failed:', results[0].status === 'fulfilled' ? results[0].value : results[0].reason)
          setServices([])
        }
        
        // Astrologers
        console.log('[Website] Astrologers promise result:', results[1])
        console.log('[Website] Astrologers status:', results[1].status)
        if (results[1].status === 'fulfilled') {
          console.log('[Website] Astrologers fulfilled value:', results[1].value)
          console.log('[Website] Astrologers response status:', results[1].value?.status)
          console.log('[Website] Astrologers data array check:', Array.isArray(results[1].value?.data))
          console.log('[Website] Astrologers data:', results[1].value?.data)
        }
        
        if (results[1].status === 'fulfilled' && results[1].value?.status === 1 && Array.isArray(results[1].value?.data)) {
          setAstrologers(results[1].value.data)
          console.log('[Website] ✅ Astrologers loaded successfully:', results[1].value.data.length, 'astrologers')
        } else {
          console.error('[Website] ❌ Astrologers failed to load!')
          console.error('[Website] Failure reason:', results[1].status === 'fulfilled' ? results[1].value : results[1].reason)
          setAstrologers([])
        }
        
        // Reviews from backend
        if (results[4].status === 'fulfilled' && results[4].value?.status === 1) {
          const reviewsData = Array.isArray(results[4].value.reviews) ? results[4].value.reviews : 
                             (Array.isArray(results[4].value.data) ? results[4].value.data : [])
          if (reviewsData.length > 0) {
            // Sort by rating and limit to top 10 for testimonials
            const sortedReviews = reviewsData
              .sort((a, b) => (b.review_rating || 0) - (a.review_rating || 0))
              .slice(0, 10)
            setReviews(sortedReviews)
            console.log('[Website] Reviews loaded:', sortedReviews.length)
          } else {
            console.warn('[Website] Reviews response has status 1 but empty reviews array')
            setReviews([])
          }
        } else {
          console.warn('[Website] Reviews failed:', results[4].status === 'fulfilled' ? results[4].value : results[4].reason)
          setReviews([])
        }
        
        // Blogs
        if (results[2].status === 'fulfilled' && results[2].value?.status === 1) {
          const blogsData = Array.isArray(results[2].value.data) ? results[2].value.data : []
          if (blogsData.length > 0) {
            setBlogs(blogsData)
            console.log('[Website] Blogs loaded:', blogsData.length)
          } else {
            console.warn('[Website] Blogs response has status 1 but empty data')
            setBlogs([])
          }
        } else {
          console.warn('[Website] Blogs failed:', results[2].status === 'fulfilled' ? results[2].value : results[2].reason)
          setBlogs([])
        }
        
        // Handle product categories with better error handling
        if (results[3].status === 'fulfilled') {
          const categoriesResult = results[3].value
          if (categoriesResult?.status === 1 && Array.isArray(categoriesResult?.data)) {
            // Set categories even if array is empty (API returned success but no data)
            setProductCategories(categoriesResult.data)
          } else {
            // Log error for debugging
            if (categoriesResult?.status === 0) {
              console.warn('[Website] Product categories API returned status 0:', categoriesResult.msg || 'Unknown error')
            } else if (!categoriesResult) {
              console.warn('[Website] Product categories API returned null/undefined')
            }
            setProductCategories([])
          }
        } else {
          // Promise was rejected
          console.error('[Website] Product categories fetch failed:', results[3].reason)
          setProductCategories([])
        }
        
        // Reviews endpoint doesn't exist - reviews can be extracted from astrologers if needed
        // For now, keep reviews empty or extract from astrologer data
      })

      // Also update state immediately as each promise resolves (for faster perceived performance)
      promises[0].then(res => {
        console.log('[Website] Services raw response:', res)
        // Check if response has data array directly or nested
        if (res?.status === 1) {
          const servicesData = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : [])
          if (servicesData.length > 0) {
            setServices(servicesData)
            console.log('[Website] Services (immediate):', servicesData.length)
          } else {
            console.warn('[Website] Services response has status 1 but no data array')
            setServices([])
          }
        } else {
          console.warn('[Website] Services response invalid:', res)
          setServices([])
        }
      }).catch(err => {
        console.error('[Website] Services fetch error:', err)
        setServices([])
      })
      
      promises[1].then(res => {
        if (res?.status === 1 && Array.isArray(res?.data)) {
          setAstrologers(res.data)
          console.log('[Website] Astrologers (immediate):', res.data.length)
        } else {
          console.warn('[Website] Astrologers response invalid:', res)
          setAstrologers([])
        }
      }).catch(err => {
        console.error('[Website] Astrologers fetch error:', err)
        setAstrologers([])
      })
      
      promises[4].then(res => {
        console.log('[Website] Reviews raw response:', res)
        if (res?.status === 1) {
          const reviewsData = Array.isArray(res.reviews) ? res.reviews : 
                             (Array.isArray(res.data) ? res.data : [])
          if (reviewsData.length > 0) {
            // Sort by rating and limit to top 10 for testimonials
            const sortedReviews = reviewsData
              .sort((a, b) => (b.review_rating || 0) - (a.review_rating || 0))
              .slice(0, 10)
            setReviews(sortedReviews)
            console.log('[Website] Reviews (immediate):', sortedReviews.length)
          } else {
            console.warn('[Website] Reviews response has status 1 but empty reviews array')
            setReviews([])
          }
        } else {
          console.warn('[Website] Reviews response invalid:', res)
          setReviews([])
        }
      }).catch(err => {
        console.error('[Website] Reviews fetch error:', err)
        setReviews([])
      })
      
      promises[2].then(res => {
        console.log('[Website] Blogs raw response:', res)
        // Check if response has data array directly or nested
        if (res?.status === 1) {
          const blogsData = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : [])
          if (blogsData.length > 0) {
            setBlogs(blogsData)
            console.log('[Website] Blogs (immediate):', blogsData.length)
          } else {
            console.warn('[Website] Blogs response has status 1 but no data array')
            setBlogs([])
          }
        } else {
          console.warn('[Website] Blogs response invalid:', res)
          setBlogs([])
        }
      }).catch(err => {
        console.error('[Website] Blogs fetch error:', err)
        setBlogs([])
      })
      
      promises[3].then(res => {
        if (res?.status === 1 && Array.isArray(res?.data)) {
          // Set categories even if array is empty (API returned success but no data)
          setProductCategories(res.data)
        } else {
          // Explicitly set empty array if categories fetch fails
          if (res?.status === 0) {
            console.warn('[Website] Product categories API returned status 0:', res.msg || 'Unknown error')
          } else if (!res) {
            console.warn('[Website] Product categories API returned null/undefined')
          }
          setProductCategories([])
        }
      }).catch(err => {
        console.error('[Website] Product categories fetch error:', err)
        setProductCategories([])
      })
      
      // Reviews endpoint doesn't exist - extract reviews from astrologers if needed
      // For now, reviews will remain empty array
    }

    loadData()
  }, [])

  // Initialize Swiper when banners are loaded
  useEffect(() => {
    const instances = []
    let retryTimer = null

    // Function to initialize hero Swiper
    const initHeroSwiper = () => {
      const heroEl = document.querySelector('.hero-swiper')
      if (!heroEl) {
        console.warn('[Website] Hero Swiper element not found')
        return null
      }

      // Check if slides exist
      const slides = heroEl.querySelectorAll('.swiper-slide')
      console.log('[Website] Initializing hero Swiper with', banners.length, 'banners, found', slides.length, 'slides in DOM')
      
      if (slides.length === 0) {
        console.warn('[Website] No slides found in hero Swiper')
        return null
      }

      try {
        const heroSwiper = new Swiper(heroEl, {
          modules: [Navigation, Pagination, Autoplay],
          loop: banners.length > 1,
          autoplay: { delay: 3500, disableOnInteraction: false },
          navigation: {
            prevEl: '#react-custom-prev',
            nextEl: '#react-custom-next'
          },
          on: {
            init: function() {
              console.log('[Website] Hero Swiper initialized with', this.slides.length, 'slides')
            }
          }
        })
        return heroSwiper
      } catch (error) {
        console.error('[Website] Error initializing hero Swiper:', error)
        return null
      }
    }

    // Wait longer to ensure DOM is fully updated with banner slides
    const timer = setTimeout(() => {
      // Try to initialize hero Swiper (only if we have banners)
      if (banners.length > 0) {
        const heroSwiper = initHeroSwiper()
        if (heroSwiper) {
          instances.push(heroSwiper)
        } else {
          // Retry after a longer delay if initialization failed
          console.warn('[Website] Hero Swiper initialization failed, retrying in 800ms...')
          retryTimer = setTimeout(() => {
            const retrySwiper = initHeroSwiper()
            if (retrySwiper) {
              instances.push(retrySwiper)
            } else {
              console.error('[Website] Hero Swiper initialization failed after retry')
            }
          }, 800)
        }
      } else {
        console.log('[Website] No banners to initialize hero Swiper')
      }

    // Services carousel
    const servicesEl = document.querySelector('.react-services-section .mySwiper-service')
    if (servicesEl) {
      console.log('[Website] Initializing services Swiper with', services.length, 'services')
      const servicesSwiper = new Swiper(servicesEl, {
        modules: [Navigation, Pagination, Autoplay],
        slidesPerView: 1,
        spaceBetween: 16,
        loop: services.length > 3,
        autoplay: { delay: 3000, disableOnInteraction: false },
        breakpoints: {
          576: { slidesPerView: 2 },
          992: { slidesPerView: 3 }
        },
        navigation: {
          prevEl: servicesEl.querySelector('.swiper-button-prev'),
          nextEl: servicesEl.querySelector('.swiper-button-next')
        },
        on: {
          init: function() {
            console.log('[Website] Services Swiper initialized with', this.slides.length, 'slides')
          }
        }
      })
      instances.push(servicesSwiper)
    } else {
      console.warn('[Website] Services Swiper element not found')
    }

    // Astrologers carousel
    const astroEl = document.querySelector('.react-astrologers-section .mySwiper-astro')
    if (astroEl) {
      instances.push(new Swiper(astroEl, {
        modules: [Navigation, Pagination, Autoplay],
        slidesPerView: 1,
        spaceBetween: 16,
        loop: astrologers.length > 4,
        autoplay: { delay: 3200, disableOnInteraction: false },
        breakpoints: {
          576: { slidesPerView: 2 },
          992: { slidesPerView: 4 }
        },
        navigation: {
          prevEl: astroEl.querySelector('.swiper-button-prev'),
          nextEl: astroEl.querySelector('.swiper-button-next')
        }
      }))
    }

    // Blogs carousel
    const blogEl = document.querySelector('.react-blogs-section .mySwiper-blog')
    if (blogEl) {
      instances.push(new Swiper(blogEl, {
        modules: [Navigation, Pagination, Autoplay],
        slidesPerView: 1,
        spaceBetween: 16,
        loop: blogs.length > 3,
        autoplay: { delay: 3400, disableOnInteraction: false },
        breakpoints: {
          576: { slidesPerView: 2 },
          992: { slidesPerView: 3 }
        },
        navigation: {
          prevEl: blogEl.querySelector('.swiper-button-prev'),
          nextEl: blogEl.querySelector('.swiper-button-next')
        }
      }))
    }

    // Products carousel
    const productEl = document.querySelector('.react-products-section .mySwiper-product')
    if (productEl) {
      console.log('[Website] Initializing products Swiper with', productCategories.length, 'categories')
      const productSwiper = new Swiper(productEl, {
        modules: [Navigation, Pagination, Autoplay],
        slidesPerView: 1,
        spaceBetween: 16,
        loop: productCategories.length > 4, // Only loop if more than 4 slides
        autoplay: { delay: 3600, disableOnInteraction: false },
        breakpoints: {
          576: { slidesPerView: 2 },
          992: { slidesPerView: 4 }
        },
        navigation: {
          prevEl: productEl.querySelector('.swiper-button-prev'),
          nextEl: productEl.querySelector('.swiper-button-next')
        },
        on: {
          init: function() {
            console.log('[Website] Products Swiper initialized with', this.slides.length, 'slides')
          }
        }
      })
      instances.push(productSwiper)
    } else {
      console.warn('[Website] Products Swiper element not found')
    }

    // Testimonials with custom controls and pagination element
    const testSection = document.querySelector('.react-testimonials-section')
    const testimonialsEl = testSection?.querySelector('.testimonials-swiper')
    if (testimonialsEl && testSection) {
      instances.push(new Swiper(testimonialsEl, {
        modules: [Navigation, Pagination, Autoplay, EffectFade],
        effect: 'fade',
        fadeEffect: { crossFade: true },
        loop: reviews.length > 1, // Only loop if more than 1 slide
        autoplay: { delay: 3800, disableOnInteraction: false },
        navigation: {
          prevEl: testSection.querySelector('.react-custom-prev-btn'),
          nextEl: testSection.querySelector('.react-custom-next-btn')
        },
        pagination: {
          el: testSection.querySelector('.react-custom-pagination'),
          clickable: true
        }
      }))
    }

    }, 500) // Increased delay to 500ms

    return () => {
      clearTimeout(timer)
      if (retryTimer) {
        clearTimeout(retryTimer)
      }
      // Destroy all Swiper instances
      instances.forEach(instance => {
        try { 
          if (instance && typeof instance.destroy === 'function') {
            instance.destroy(true, true)
          }
        } catch (e) {
          console.warn('[Website] Error destroying Swiper instance:', e)
        }
      })
    }
  }, [loading, banners.length, services.length, astrologers.length, blogs.length, productCategories.length, reviews.length])

  // Debug: Log reviews state changes
  useEffect(() => {
    if (reviews.length > 0) {
      console.log('[Website] Reviews state updated:', {
        count: reviews.length,
        sampleReview: reviews[0]
      })
    } else {
      console.log('[Website] Reviews state is empty')
    }
  }, [reviews])

  // Debug: Log banners state changes
  useEffect(() => {
    console.log('[Website] Banners state updated:', {
      count: banners.length,
      banners: banners
    })
  }, [banners])

  // Debug: Log services state changes
  useEffect(() => {
    console.log('[Website] Services state updated:', {
      count: services.length,
      services: services
    })
  }, [services])

  // Debug: Log product categories state changes
  useEffect(() => {
    console.log('[Website] Product categories state updated:', {
      count: productCategories.length,
      categories: productCategories
    })
  }, [productCategories])

  return (
    <div>
    
  <Navbar />
      <section className="react-hero-slider">
        <div className="swiper hero-swiper">
          <div className="swiper-wrapper">
            {banners && banners.length > 0 ? (
              banners.map((banner, index) => (
                <div key={banner.id || index} className="swiper-slide">
                  {(() => {
                    const fallback = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80'
                    const originalSrc = banner.banner_image
                    
                    // Check for HTML content in image field
                    const hasHtmlContent = originalSrc && typeof originalSrc === 'string' && /<[^>]+>/.test(originalSrc)
                    
                    // Only use fallback immediately if:
                    // 1. No originalSrc
                    // 2. Contains HTML content
                    // 3. Already failed before
                    // Otherwise, ALWAYS try to load the original image (including localhost:8005/uploads/banner/)
                    const shouldUseFallbackImmediately = !originalSrc || 
                      hasHtmlContent ||
                      failedImages.has(originalSrc)
                    
                    const safeImageUrl = shouldUseFallbackImmediately 
                      ? fallback 
                      : (originalSrc || fallback)
                    
                    const handleImageError = (e) => {
                      if (originalSrc && e.target.src !== fallback) {
                        setFailedImages(prev => new Set(prev).add(originalSrc))
                        e.target.src = fallback
                        e.target.onerror = null
                      }
                    }
                    return banner.url ? (
                      <a href={banner.url} style={{ display: 'block', width: '100%', height: '100%' }}>
                        <img 
                          src={safeImageUrl} 
                          alt={banner.title || `Banner ${index + 1}`}
                          loading="lazy"
                          onError={handleImageError}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                      </a>
                    ) : (
                      <img 
                        src={safeImageUrl} 
                        alt={banner.title || `Banner ${index + 1}`}
                        loading="lazy"
                        onError={handleImageError}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    )
                  })()}
                </div>
              ))
            ) : (
              <div className="swiper-slide">
                <div style={{ padding: '50px', textAlign: 'center', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <p>No banners available</p>
                  <p style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
                    Loading: {loading ? 'Yes' : 'No'}, Banners count: {banners?.length || 0}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        <button className="react-custom-nav-button react-prev" id="react-custom-prev"><i className="fa-solid fa-chevron-left"></i></button>
        <button className="react-custom-nav-button react-next" id="react-custom-next"><i className="fa-solid fa-chevron-right"></i></button>
      </section>

      <section className="react-steps-section react-cosmos-bg">
        <div className="container">
          <div className="react-section-header">
            <h2 className="react-section-title">
              <span className="react-light-text">3 Easy Steps For</span>
              <span className="react-purple-text"> Connecting with an Astrologer</span>
            </h2>
            <p className="react-section-description">
              Our simple process makes it easy to connect with an experienced astrologer 
              and begin your journey to celestial enlightenment.
            </p>
          </div>
          <div className="react-steps-container">
            <div className="react-step-card">
              <div className="react-step-icon-container">
                <i className="fas fa-search react-gold-icon"></i>
                <div className="react-step-number">1</div>
              </div>
              <h3 className="react-step-title">Choose Your Astrologer</h3>
              <p className="react-step-description">Browse through our experienced astrologers and select the one who resonates with your needs and concerns.</p>
            </div>
            <div className="react-step-card">
              <div className="react-step-icon-container">
                <i className="fas fa-phone react-gold-icon"></i>
                <div className="react-step-number">2</div>
              </div>
              <h3 className="react-step-title">Book Your Consultation</h3>
              <p className="react-step-description">Schedule your personalized session at a time that's convenient for you, either through video call or chat.</p>
            </div>
            <div className="react-step-card">
              <div className="react-step-icon-container">
                <i className="fas fa-star react-gold-icon"></i>
                <div className="react-step-number">3</div>
              </div>
              <h3 className="react-step-title">Receive Divine Guidance</h3>
              <p className="react-step-description">Connect with your astrologer and gain valuable insights to navigate life's journey with confidence.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="react-why-choose-us">
        <div className="container">
          <div className="react-section-header">
            <h2 className="react-section-title">
              <span className="react-light-text">Why</span>
              <span className="react-purple-text"> Choose Us</span>
            </h2>
            <p className="react-section-description">
              Discover what sets our astrological services apart and why thousands 
              trust us for celestial guidance.
            </p>
          </div>
          <div className="react-why-us-container">
            <div className="react-why-us-content">
              {whyChooseUsData && Array.isArray(whyChooseUsData) && whyChooseUsData.length > 0 ? (
                // Render data from backend (dynamic)
                whyChooseUsData.map((item, index) => {
                  // Use unique key based on title/heading to prevent duplicate rendering
                  const uniqueKey = item.title || item.heading || `item-${index}`
                  return (
                    <div key={`${uniqueKey}-${index}`} className="react-why-us-item">
                      <div className="react-why-us-icon">
                        <i className={item.icon || `fas fa-star`}></i>
                      </div>
                      <div className="react-why-us-text">
                        <h3>{item.title || item.heading || 'Feature'}</h3>
                        <p>{item.description || item.text || ''}</p>
                      </div>
                    </div>
                  )
                })
              ) : (
                // Show message if no data available
                <div className="react-why-us-item">
                  <div className="react-why-us-text">
                    <p>Why Choose Us content will be displayed here.</p>
                  </div>
                </div>
              )}
            </div>
            <div className="react-why-us-image">
              <img src="https://www.jyotishamastroapi.com/front/img/about/natal1.png" alt="Astrology Consultation" />
            </div>
          </div>
        </div>
      </section>


      <section id="services" className="free-section react-cosmos-bg">
        <div className="container">
          <div className="react-section-header">
            <h2 className="react-section-title">
              <span className="react-light-text">Free</span>
              <span className="react-purple-text"> Services</span>
            </h2>
            <p className="react-section-description">
              Discover a variety of free astrological services crafted to guide you through life's challenges 
              and opportunities—without any cost. Get personalized insights and clarity, all at no charge.
            </p>
          </div>
          <div className="react-free-services-grid">
            <div className="react-free-service-card">
              <div className="react-free-card-header">
                <div className="react-free-icon-wrapper">
                  <i className="fas fa-chart-pie"></i>
                </div>
                <h2>Kundli / Birth Chart</h2>
                <p>Generate your personalized birth chart</p>
              </div>
              <form className="react-free-service-form">
                <div className="react-free-form-group">
                  <label>Enter Birth Details</label>
                  <input type="text" placeholder="Enter your name" className="react-free-form-input" />
                </div>
                <div className="react-free-form-row">
                  <div className="react-free-form-group">
                    <input type="date" className="react-free-form-input" />
                  </div>
                  <div className="react-free-form-group">
                    <input type="time" className="react-free-form-input" />
                  </div>
                </div>
                <div className="react-free-form-group">
                  <input type="text" placeholder="Enter your birth place" className="react-free-form-input" />
                </div>
                <div className="react-free-form-row">
                  <div className="react-free-form-group">
                    <select className="react-free-form-input">
                      <option>D1</option>
                      <option>D2</option>
                      <option>D3</option>
                    </select>
                  </div>
                  <div className="react-free-form-group">
                    <select className="react-free-form-input">
                      <option>North</option>
                      <option>South</option>
                      <option>East</option>
                      <option>West</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="react-free-btn-primary">
                  <i className="fas fa-star"></i>
                  Get Kundli
                </button>
              </form>
            </div>
            <div className="react-free-service-card">
              <div className="react-free-card-header">
                <div className="react-free-icon-wrapper">
                  <i className="fas fa-heart"></i>
                </div>
                <h2>Kundli Matching</h2>
                <p>Find your perfect match compatibility</p>
              </div>
              <form className="react-free-service-form">
                <div className="react-free-form-group">
                  <label>Enter Boy Details</label>
                  <input type="text" placeholder="Enter your name" className="react-free-form-input" />
                </div>
                <div className="react-free-form-row">
                  <div className="react-free-form-group">
                    <input type="date" className="react-free-form-input" />
                  </div>
                  <div className="react-free-form-group">
                    <input type="time" className="react-free-form-input" />
                  </div>
                </div>
                <div className="react-free-form-group">
                  <input type="text" placeholder="Enter your birth place" className="react-free-form-input" />
                </div>
                <div className="react-free-info-note">
                  <i className="fas fa-info-circle"></i>
                  <span>Enter girl's detail on next page</span>
                </div>
                <button type="submit" className="react-free-btn-primary">
                  <i className="fas fa-arrow-right"></i>
                  Continue
                </button>
              </form>
            </div>
            <div className="react-free-service-card react-free-panchang-card">
              <div className="react-free-card-header">
                <div className="react-free-icon-wrapper">
                  <i className="fas fa-calendar-alt"></i>
                </div>
                <h2>Panchang</h2>
                <p className="react-free-current-date">Thu, 17 Jul, 2025</p>
              </div>
              <div className="react-free-panchang-content">
                <div className="react-free-panchang-item">
                  <span className="react-free-label">Tithi:</span>
                  <span className="react-free-value react-free-highlight-red">Saptami</span>
                  <div className="react-free-time-range">Wed, Jul 16, 2025 8:36:58 PM - Thu, Jul 17, 2025 6:44:05 PM</div>
                </div>
                <div className="react-free-panchang-item">
                  <span className="react-free-label">Nakshatra:</span>
                  <span className="react-free-value react-free-highlight-red">Revati</span>
                  <div className="react-free-time-range">Thu, Jul 17, 2025 4:25:10 AM - Fri, Jul 18, 2025 3:13:47 AM aa</div>
                </div>
                <div className="react-free-panchang-item">
                  <span className="react-free-label">Karana:</span>
                  <span className="react-free-value react-free-highlight-red">Vishti</span>
                  <div className="react-free-time-range">Wed, Jul 16, 2025 8:36:58 PM - Thu, Jul 17, 2025 7:42:25 AM</div>
                </div>
                <div className="react-free-panchang-item">
                  <span className="react-free-label">Yoga:</span>
                  <span className="react-free-value react-free-highlight-red">Atiganda</span>
                  <div className="react-free-time-range">Wed, Jul 16, 2025 11:30:53 AM - Thu, Jul 17, 2025 9:02:33 AM</div>
                </div>
                <button type="button" className="react-free-btn-primary react-free-btn-full">
                  <i className="fas fa-sun"></i>
                  Today Panchang
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="services2" className="react-services-section react-cosmos-bg">
        <div className="container">
          <div className="react-section-header">
            <h2 className="react-section-title">
              <span className="react-light-text">Our</span>
              <span className="react-purple-text"> Services</span>
            </h2>
            <p className="react-section-description">
              Explore our comprehensive range of astrological services designed to illuminate 
              your path and provide clarity for every aspect of your life.
            </p>
          </div>
          <div className="swiper mySwiper-service">
            <div className="swiper-wrapper">
              {services.length > 0 ? (
                services.map((service) => (
                  <div key={service.id} className="swiper-slide">
                    <Link to={`/service/${service.slug || service.id}`}>
                      <div className="react-card-service">
                        <div className="react-icon-wrapper">
                          {(() => {
                            const fallback = 'https://images.unsplash.com/photo-1462331940025-496df2c8b5e3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                            const originalSrc = service.service_image || service.service_image_url
                            
                            // Check if originalSrc contains HTML tags (like <p>demo</p>)
                            const containsHTML = originalSrc && typeof originalSrc === 'string' && /<[^>]+>/.test(originalSrc)
                            
                            // Check if it's a valid image URL
                            const isValidImageUrl = originalSrc && typeof originalSrc === 'string' && (
                              originalSrc.startsWith('http://') || 
                              originalSrc.startsWith('https://')
                            )
                            
                            // Use fallback if:
                            // 1. No originalSrc
                            // 2. Contains HTML tags (invalid)
                            // 3. Not a valid HTTP/HTTPS URL
                            // 4. Known problematic paths (banner/blog from wrong service)
                            // 5. Already failed before
                            const shouldUseFallback = !originalSrc || 
                              containsHTML || 
                              !isValidImageUrl || 
                              (originalSrc.includes('localhost:8005/uploads/banner/') ||
                               originalSrc.includes('localhost:8005/uploads/blog/') ||
                               originalSrc.includes('localhost:8002/assets/')) ||
                              failedImages.has(originalSrc)
                            
                            const safeImageUrl = shouldUseFallback ? fallback : originalSrc
                            
                            const handleError = (e) => {
                              if (originalSrc && e.target.src !== fallback) {
                                setFailedImages(prev => new Set(prev).add(originalSrc))
                                e.target.src = fallback
                                e.target.onerror = null
                              }
                            }
                            return (
                              <img 
                                src={safeImageUrl} 
                                alt={service.service_name || service.title || 'Service'}
                                loading="lazy"
                                onError={handleError}
                                style={{ width: '80px', height: '80px', objectFit: 'cover', display: 'block' }}
                              />
                            )
                          })()}
                        </div>
                        <h3>{service.service_name || service.title || 'Service'}</h3>
                        <p>
                          {(() => {
                            let description = service.service_description || 'Explore our comprehensive astrological services.'
                            
                            // Remove HTML tags and decode HTML entities from description
                            if (description && typeof description === 'string') {
                              // First decode HTML entities (like &lt; &gt; &amp; etc.)
                              description = description
                                .replace(/&lt;/g, '<')
                                .replace(/&gt;/g, '>')
                                .replace(/&amp;/g, '&')
                                .replace(/&quot;/g, '"')
                                .replace(/&#39;/g, "'")
                                .replace(/&nbsp;/g, ' ')
                              
                              // Then strip HTML tags
                              description = description.replace(/<[^>]*>/g, '')
                              
                              // Trim whitespace and newlines
                              description = description.trim().replace(/\s+/g, ' ')
                            }
                            
                            // Truncate if too long
                            if (description && description.length > 120) {
                              description = description.substring(0, 120) + '...'
                            }
                            
                            return description || 'Explore our comprehensive astrological services.'
                          })()}
                        </p>
                      </div>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="swiper-slide">
                  <div style={{ padding: '50px', textAlign: 'center' }}>No services available</div>
                </div>
              )}
            </div>
            <div className="swiper-button-prev"><i className="fa-solid fa-chevron-left"></i></div>
            <div className="swiper-button-next"><i className="fa-solid fa-chevron-right"></i></div>
          </div>
        </div>
      </section>

      <section id="astrologers" className="react-astrologers-section">
        <div className="container">
          <div className="react-section-header">
            <h2 className="react-section-title">
              <span className="react-light-text">Our Top</span>
              <span className="react-purple-text"> Astrologers</span>
            </h2>
            <p className="react-section-description">
              Meet our experienced astrologers, each specializing in different celestial practices 
              to provide you with the guidance you seek.
            </p>
          </div>
          <div className="swiper mySwiper-astro">
            <div className="swiper-wrapper">
              {console.log('[Website Render] Astrologers array:', astrologers)}
              {console.log('[Website Render] Astrologers length:', astrologers?.length)}
              {astrologers && astrologers.length > 0 ? (
                astrologers.map((astro, index) => {
                  const chatPrice = astro.prices?.find(p => p.type === 'chat')?.price || 0
                  const videoPrice = astro.prices?.find(p => p.type === 'video')?.price || 0
                  const callPrice = astro.prices?.find(p => p.type === 'call')?.price || 0
                  const minPrice = Math.min(
                    chatPrice || Infinity,
                    videoPrice || Infinity,
                    callPrice || Infinity
                  )
                  
                  return (
                    <div key={astro.astrologer_uni_id || `astro-${index}`} className="swiper-slide">
                      <Link to={`/astrologer?id=${astro.astrologer_uni_id}`}>
                        <div className="react-astrologer-card">
                          <div className="react-astrologer-image-container">
                            {(() => {
                              const fallback = 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400'
                              const originalSrc = astro.astro_img
                              
                              // Check if it's a valid image URL
                              const isValidImageUrl = originalSrc && typeof originalSrc === 'string' && (
                                originalSrc.startsWith('http://') || 
                                originalSrc.startsWith('https://')
                              )
                              
                              // Valid astrologer image paths from port 8002 (allow these)
                              const isValidAstrologerPath = originalSrc && (
                                originalSrc.includes('localhost:8002/uploads/astrologer/') ||
                                originalSrc.includes('localhost:8002/assets/img/astrologer')
                              )
                              
                              // Use fallback if:
                              // 1. No originalSrc
                              // 2. Not a valid HTTP/HTTPS URL
                              // 3. Known problematic paths (but NOT valid astrologer paths from port 8002)
                              // 4. Already failed before
                              const shouldUseFallback = !originalSrc || 
                                !isValidImageUrl ||
                                (originalSrc && !isValidAstrologerPath && (
                                  originalSrc.includes('localhost:8005/uploads/') ||
                                  (originalSrc.includes('localhost:8002/assets/') && !originalSrc.includes('astrologer'))
                                )) ||
                                failedImages.has(originalSrc)
                              
                              const safeImageUrl = shouldUseFallback ? fallback : originalSrc
                              
                              const handleError = (e) => {
                                if (originalSrc && e.target.src !== fallback) {
                                  setFailedImages(prev => new Set(prev).add(originalSrc))
                                  e.target.src = fallback
                                  e.target.onerror = null
                                }
                              }
                              
                              return (
                                <img 
                                  key={`astro-img-${astro.astrologer_uni_id || index}`}
                                  src={safeImageUrl} 
                                  alt={astro.display_name || 'Astrologer'} 
                                  className="react-astrologer-image"
                                  loading="lazy"
                                  onError={handleError}
                                />
                              )
                            })()}
                            <div className="react-astrologer-rating">
                              <i className="fa-solid fa-star react-rating-star"></i>
                              {astro.avg_rating != null ? (typeof astro.avg_rating === 'number' ? astro.avg_rating.toFixed(1) : parseFloat(astro.avg_rating)?.toFixed(1) || '4.5') : '4.5'}
                            </div>
                          </div>
                          <div className="react-astrologer-content">
                            <h3 className="react-astrologer-name">{astro.display_name || astro.user?.name || 'Astrologer'}</h3>
                            <p className="react-astrologer-specialty">{astro.category_names?.split(',')[0] || 'Astrologer'}</p>
                            <div className="react-astrologer-details">
                              <div className="react-astrologer-detail">
                                <span className="react-detail-label">Experience:</span>
                                <span className="react-detail-value">{astro.experience || 0}+ years</span>
                              </div>
                              <div className="react-astrologer-detail">
                                <span className="react-detail-label">Orders:</span>
                                <span className="react-detail-value">{astro.total_orders_count || 0}</span>
                              </div>
                              <div className="react-astrologer-detail">
                                <span className="react-detail-label">Languages:</span>
                                <span className="react-detail-value">{astro.language_name || 'N/A'}</span>
                              </div>
                              <div className="react-astrologer-detail">
                                <span className="react-detail-label">Skills:</span>
                                <span className="react-detail-value" title={astro.skill_names || 'N/A'}>{(astro.skill_names || 'N/A').length > 25 ? (astro.skill_names || 'N/A').substring(0, 25) + '...' : (astro.skill_names || 'N/A')}</span>
                              </div>
                              <div className="react-astrologer-detail">
                                <span className="react-detail-label">Price:</span>
                                <span className="react-detail-value react-price">
                                  {minPrice !== Infinity ? `₹${minPrice}/min` : 'N/A'}
                                </span>
                              </div>
                            </div>
                            <div className="react-astrologer-actions">
                              <span className="react-btn react-btn-primary" style={{width: '100%', display: 'block', textAlign: 'center'}}>Call Now</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  )
                })
              ) : (
                <div className="swiper-slide">
                  <div style={{ padding: '50px', textAlign: 'center', flexDirection: 'column', display: 'flex', gap: '10px' }}>
                    <div>No astrologers available</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      Loading: {loading ? 'Yes' : 'No'}, Count: {astrologers?.length || 0}
                    </div>
                    {astrologers && astrologers.length === 0 && !loading && (
                      <div style={{ fontSize: '11px', color: '#f00', marginTop: '10px' }}>
                        Check console for API response details
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="swiper-button-prev"><i className="fa-solid fa-chevron-left"></i></div>
            <div className="swiper-button-next"><i className="fa-solid fa-chevron-right"></i></div>
          </div>
        </div>
      </section>

      <section id="blogs" className="react-blogs-section react-cosmos-bg">
        <div className="container">
          <div className="react-section-header">
            <h2 className="react-section-title">
              <span className="react-light-text">Our</span>
              <span className="react-purple-text"> Blogs</span>
            </h2>
            <p className="react-section-description">
              Explore our collection of insightful articles about astrology, 
              cosmic events, and spiritual growth to expand your celestial knowledge.
            </p>
          </div>
          <div className="swiper mySwiper-blog">
            <div className="swiper-wrapper">
              {blogs.length > 0 ? (
                blogs.map((blog, index) => (
                  <div key={blog.id || index} className="swiper-slide">
                    <Link to={`/blog/${blog.slug || blog.id}`}>
                      <div className="react-blog-card">
                        <div className="react-blog-image-container">
                          {(() => {
                            const fallback = 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
                            const originalSrc = blog.blog_image
                            const shouldUseFallback = originalSrc && (
                              originalSrc.includes('localhost:8005/uploads/') ||
                              originalSrc.includes('localhost:8002/uploads/') ||
                              failedImages.has(originalSrc)
                            )
                            const safeImageUrl = shouldUseFallback ? fallback : (originalSrc || fallback)
                            const handleError = (e) => {
                              if (originalSrc && e.target.src !== fallback) {
                                setFailedImages(prev => new Set(prev).add(originalSrc))
                                e.target.src = fallback
                                e.target.onerror = null
                              }
                            }
                            return (
                              <img 
                                src={safeImageUrl} 
                                alt={blog.title || 'Blog'} 
                                className="react-blog-image"
                                loading="lazy"
                                onError={handleError}
                              />
                            )
                          })()}
                          {blog.category_title && (
                            <div className="react-blog-category">{blog.category_title}</div>
                          )}
                        </div>
                        <div className="react-blog-content">
                          <h3 className="react-blog-title">{blog.title || 'Blog Title'}</h3>
                          <p className="react-blog-excerpt">
                            {blog.content 
                              ? (blog.content.replace(/<[^>]*>/g, '').length > 120 
                                  ? blog.content.replace(/<[^>]*>/g, '').substring(0, 120) + '...' 
                                  : blog.content.replace(/<[^>]*>/g, ''))
                              : 'Read our latest insights about astrology and cosmic events.'}
                          </p>
                          <div className="react-blog-meta">
                            <div className="react-meta-item">
                              <i className="fa-solid fa-calendar"></i>
                              {blog.created_at 
                                ? new Date(blog.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                : 'Recent'}
                            </div>
                            {blog.astrologer_name && (
                              <div className="react-meta-item">
                                <i className="fa-solid fa-user"></i>
                                {blog.astrologer_name}
                              </div>
                            )}
                          </div>
                          <span className="react-blog-link">
                            Read More <i className="fa-solid fa-arrow-right"></i>
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="swiper-slide">
                  <div style={{ padding: '50px', textAlign: 'center' }}>No blogs available</div>
                </div>
              )}
            </div>
            <div className="swiper-button-prev"><i className="fa-solid fa-chevron-left"></i></div>
            <div className="swiper-button-next"><i className="fa-solid fa-chevron-right"></i></div>
          </div>
        </div>
      </section>

      <section id="products" className="react-products-section">
        <div className="container">
          <div className="react-section-header">
            <h2 className="react-section-title">
              <span className="react-light-text">Product</span>
              <span className="react-purple-text"> Categories</span>
            </h2>
            <p className="react-section-description">
              Explore our curated collection of mystical products designed to enhance 
              your spiritual journey and bring cosmic energy into your life.
            </p>
          </div>
          <div className="swiper mySwiper-product">
            <div className="swiper-wrapper">
              {productCategories.length > 0 ? (
                productCategories.map((category, index) => {
                  const fallback = 'https://images.unsplash.com/photo-1598751337726-3c8577d00bd3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
                  const originalSrc = category.image || category.category_image || category.image_url
                  
                  // Check for HTML content in image field (like we do for services)
                  const hasHtmlContent = originalSrc && typeof originalSrc === 'string' && /<[^>]+>/.test(originalSrc)
                  
                  // Use fallback immediately ONLY if:
                  // 1. No originalSrc
                  // 2. Contains HTML content
                  // 3. Already failed before
                  // Otherwise, ALWAYS try to load the original image
                  const shouldUseFallbackImmediately = !originalSrc || 
                    hasHtmlContent ||
                    failedImages.has(originalSrc)
                  
                  const safeImageUrl = shouldUseFallbackImmediately 
                    ? fallback 
                    : (originalSrc || fallback)
                  
                  const handleError = (e) => {
                    if (originalSrc && e.target.src !== fallback) {
                      setFailedImages(prev => new Set(prev).add(originalSrc))
                      e.target.src = fallback
                      e.target.onerror = null
                    }
                  }
                  return (
                    <div key={category.id || index} className="swiper-slide">
                      <Link to={`/shop?category=${category.id}`} className="react-product-category-card">
                        <img 
                          src={safeImageUrl} 
                          alt={category.title || 'Product Category'} 
                          className="react-product-category-image"
                          loading="lazy"
                          onError={handleError}
                        />
                        <div className="react-product-category-overlay"></div>
                        <div className="react-product-category-content">
                          <h3 className="react-product-category-title">{category.title || 'Product Category'}</h3>
                          <p className="react-product-category-count">{category.product_count || 0} Products</p>
                        </div>
                      </Link>
                    </div>
                  )
                })
              ) : (
                <div className="swiper-slide">
                  <div style={{ padding: '50px', textAlign: 'center' }}>No product categories available</div>
                </div>
              )}
            </div>
            <div className="swiper-button-prev"><i className="fa-solid fa-chevron-left"></i></div>
            <div className="swiper-button-next"><i className="fa-solid fa-chevron-right"></i></div>
          </div>
        </div>
      </section>

      <section className="react-testimonials-section react-cosmos-bg">
        <div className="container">
          <div className="react-section-header">
            <h2 className="react-section-title">
              <span className="react-light-text">Our</span>
              <span className="react-purple-text"> Testimonials</span>
            </h2>
            <p className="react-section-description">
              Hear what our clients have to say about their transformative
              experiences with our astrological services.
            </p>
          </div>
          <div className="swiper testimonials-swiper">
            <div className="swiper-wrapper">
              {reviews && reviews.length > 0 ? (
                reviews.map((review, index) => {
                  const user = review.review_by_user || {}
                  const customer = review.customer || {}
                  const userName = user.name || customer.customer_uni_id || 'Anonymous'
                  const userImage = customer.customer_img || 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80'
                  const rating = parseInt(review.review_rating) || 5
                  const comment = review.review_comment || 'Great service!'
                  const date = review.created_at ? new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recent'
                  
                  // Generate star rating
                  const stars = []
                  for (let i = 1; i <= 5; i++) {
                    stars.push(
                      <i 
                        key={i} 
                        className={`lucide-star ${i <= rating ? 'react-filled' : ''}`}
                      ></i>
                    )
                  }

                  const fallback = 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80'
                  const shouldUseFallback = userImage && (
                    userImage.includes('localhost:8007/uploads/') ||
                    userImage.includes('localhost:8005/uploads/') ||
                    userImage.includes('localhost:8002/uploads/') ||
                    failedImages.has(userImage)
                  )
                  const safeImageUrl = shouldUseFallback ? fallback : (userImage || fallback)
                  const handleError = (e) => {
                    if (userImage && e.target.src !== fallback) {
                      setFailedImages(prev => new Set(prev).add(userImage))
                      e.target.src = fallback
                      e.target.onerror = null
                    }
                  }

                  return (
                    <div key={review.id || `review-${index}`} className="swiper-slide">
                      <div className="react-testimonial-card">
                        <div className="react-testimonial-content">
                          <div className="react-testimonial-profile">
                            <div className="react-testimonial-image-container">
                              <img
                                src={safeImageUrl}
                                alt={userName}
                                className="react-testimonial-image"
                                loading="lazy"
                                onError={handleError}
                              />
                            </div>
                            <h3 className="react-testimonial-name">{userName}</h3>
                            <p className="react-testimonial-location">{user.email || user.user_uni_id || 'Customer'}</p>
                            <div className="react-testimonial-rating">
                              {stars}
                            </div>
                            <p className="react-testimonial-date">{date}</p>
                          </div>
                          <div className="react-testimonial-text">
                            <i className="lucide-quote react-testimonial-quote-icon"></i>
                            <p className="react-testimonial-message">
                              {comment}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="swiper-slide">
                  <div style={{ padding: '50px', textAlign: 'center' }}>
                    <div>No testimonials available</div>
                    {process.env.NODE_ENV === 'development' && (
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
                        Reviews count: {reviews?.length || 0}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="react-slider-controls">
              <button className="react-custom-prev-btn" aria-label="Previous testimonial">
                <i className="fas fa-arrow-left"></i>
              </button>
              <div className="react-custom-pagination"></div>
              <button className="react-custom-next-btn" aria-label="Next testimonial">
                <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Landing


