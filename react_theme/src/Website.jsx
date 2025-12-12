import React, { useEffect } from 'react'
import Swiper from 'swiper'
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/effect-fade'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import usePageTitle from './hooks/usePageTitle'

const Landing = () => {
  usePageTitle('Home - Astrology Theme')
  useEffect(() => {
    const instances = []

    // Hero slider with custom buttons
    const heroEl = document.querySelector('.hero-swiper')
    if (heroEl) {
      instances.push(new Swiper(heroEl, {
        modules: [Navigation, Pagination, Autoplay],
        loop: true,
        autoplay: { delay: 3500, disableOnInteraction: false },
        navigation: {
          prevEl: '#react-custom-prev',
          nextEl: '#react-custom-next'
        }
      }))
    }

    // Services carousel
    const servicesEl = document.querySelector('.react-services-section .mySwiper-service')
    if (servicesEl) {
      instances.push(new Swiper(servicesEl, {
        modules: [Navigation, Pagination, Autoplay],
        slidesPerView: 1,
        spaceBetween: 16,
        loop: true,
        autoplay: { delay: 3000, disableOnInteraction: false },
        breakpoints: {
          576: { slidesPerView: 2 },
          992: { slidesPerView: 3 }
        },
        navigation: {
          prevEl: servicesEl.querySelector('.swiper-button-prev'),
          nextEl: servicesEl.querySelector('.swiper-button-next')
        }
      }))
    }

    // Astrologers carousel
    const astroEl = document.querySelector('.react-astrologers-section .mySwiper-astro')
    if (astroEl) {
      instances.push(new Swiper(astroEl, {
        modules: [Navigation, Pagination, Autoplay],
        slidesPerView: 1,
        spaceBetween: 16,
        loop: true,
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
        loop: true,
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
      instances.push(new Swiper(productEl, {
        modules: [Navigation, Pagination, Autoplay],
        slidesPerView: 1,
        spaceBetween: 16,
        loop: true,
        autoplay: { delay: 3600, disableOnInteraction: false },
        breakpoints: {
          576: { slidesPerView: 2 },
          992: { slidesPerView: 4 }
        },
        navigation: {
          prevEl: productEl.querySelector('.swiper-button-prev'),
          nextEl: productEl.querySelector('.swiper-button-next')
        }
      }))
    }

    // Testimonials with custom controls and pagination element
       // Testimonials with custom controls and pagination element
    const testSection = document.querySelector('.react-testimonials-section')
    const testimonialsEl = testSection?.querySelector('.testimonials-swiper')
    if (testimonialsEl && testSection) {
      instances.push(new Swiper(testimonialsEl, {
        modules: [Navigation, Pagination, Autoplay, EffectFade],
        effect: 'fade',
        fadeEffect: { crossFade: true },
        loop: true,
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

    return () => {
      instances.forEach(instance => {
        try { instance.destroy(true, true) } catch (e) {}
      })
    }
  }, [])
  return (
    <div>
    
  <Navbar />
      <section className="react-hero-slider">
        <div className="swiper hero-swiper">
          <div className="swiper-wrapper">
            <div className="swiper-slide">
              <img src="https://www.karmleela.com/uploads/banner/1749907120-banner_image.jpg" alt="Slide 1" />
            </div>
            <div className="swiper-slide">
              <img src="https://www.karmleela.com/uploads/banner/1733747065-banner_image.jpg" alt="Slide 2" />
            </div>
            <div className="swiper-slide">
              <img src="https://jyotishiwala.com/uploads/banner/1743585494-banner_image.jpg" alt="Slide 3" />
            </div>
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
              <div className="react-why-us-item">
                <div className="react-why-us-icon">
                  <i className="fas fa-user-tie"></i>
                </div>
                <div className="react-why-us-text">
                  <h3>50+ Years of Experience</h3>
                  <p>Our astrologers and Vastu consultants bring over 50 years of expertise to provide accurate and insightful guidance.</p>
                </div>
              </div>
              <div className="react-why-us-item">
                <div className="react-why-us-icon">
                  <i className="fas fa-users"></i>
                </div>
                <div className="react-why-us-text">
                  <h3>1500+ Satisfied Customers</h3>
                  <p>More than 1500 customers have received our services, and many more are joining every day.</p>
                </div>
              </div>
              <div className="react-why-us-item">
                <div className="react-why-us-icon">
                  <i className="fas fa-star"></i>
                </div>
                <div className="react-why-us-text">
                  <h3>1100+ Best Astrologers</h3>
                  <p>We have hand-picked over 1100 expert astrologers from India, ready to offer online consultations.</p>
                </div>
              </div>
              <div className="react-why-us-item">
                <div className="react-why-us-icon">
                  <i className="fas fa-globe-americas"></i>
                </div>
                <div className="react-why-us-text">
                  <h3>140+ Nationalities</h3>
                  <p>Our services are trusted by clients from over 140 nationalities across the globe.</p>
                </div>
              </div>
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
              <div className="swiper-slide">
                <a href="">
                  <div className="react-card-service">
                    <div className="react-icon-wrapper">
                      <img src="https://www.karmleela.com/uploads/our_service/1734072422-image.png" alt="Service" />
                    </div>
                    <h3>Love Marriage</h3>
                    <p>
                      Many times it is seen that some parents have a lot more say in who their child should marry. 
                    </p>
                  </div>
                </a>
              </div>
              <div className="swiper-slide">
                <a href="">
                  <div className="react-card-service">
                    <div className="react-icon-wrapper">
                      <img src="https://www.karmleela.com/uploads/our_service/1734072468-image.png" alt="Service" />
                    </div>
                    <h3>Career</h3>
                    <p>
                      Education systems worldwide are evolving to provide more personalized learning experiences. 
                    </p>
                  </div>
                </a>
              </div>
              <div className="swiper-slide">
                <a href="">
                  <div className="react-card-service">
                    <div className="react-icon-wrapper">
                      <img src="https://www.karmleela.com/uploads/our_service/1734072409-image.png" alt="Service" />
                    </div>
                    <h3>Children Problem</h3>
                    <p>
                      Child problem solving is very popular. Children are God's gift to as they are the source of happiness 
                    </p>
                  </div>
                </a>
              </div>
              <div className="swiper-slide">
                <a href="">
                  <div className="react-card-service">
                    <div className="react-icon-wrapper">
                      <img src="https://astroone.org/uploads/our_service/1714480858-image.jpg" alt="Service" />
                    </div>
                    <h3>Divorce</h3>
                    <p>
                      Lorem ipsum dolor, sit amet consectetur adipisicing elit. Quisquam
                      consequatur necessitatibus eaque.
                    </p>
                  </div>
                </a>
              </div>
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
              <div className="swiper-slide">
                <a href="">
                  <div className="react-astrologer-card">
                    <div className="react-astrologer-image-container">
                      <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80" alt="Aisha Sharma" className="react-astrologer-image" />
                      <div className="react-astrologer-rating">
                        <i className="fa-solid fa-star react-rating-star"></i>
                        4.9
                      </div>
                    </div>
                    <div className="react-astrologer-content">
                      <h3 className="react-astrologer-name">Aisha Sharma</h3>
                      <p className="react-astrologer-specialty">Vedic Astrology</p>
                      <div className="react-astrologer-details">
                        <div className="react-astrologer-detail">
                          <span className="react-detail-label">Experience:</span>
                          <span className="react-detail-value">15+ years</span>
                        </div>
                        <div className="react-astrologer-detail">
                          <span className="react-detail-label">Reviews:</span>
                          <span className="react-detail-value">342</span>
                        </div>
                        <div className="react-astrologer-detail">
                          <span className="react-detail-label">Languages:</span>
                          <span className="react-detail-value">English, Hindi</span>
                        </div>
                        <div className="react-astrologer-detail">
                          <span className="react-detail-label">Price:</span>
                          <span className="react-detail-value react-price">$2.5/min</span>
                        </div>
                      </div>
                      <div className="react-astrologer-actions">
                        <a className="react-btn react-btn-primary" style={{width: '100%'}} href="#">Call Now</a>
                      </div>
                    </div>
                  </div>
                </a>
              </div>
              <div className="swiper-slide">
                <a href="">
                  <div className="react-astrologer-card">
                    <div className="react-astrologer-image-container">
                      <img src="https://images.unsplash.com/photo-1566492031773-4f4e44671857?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80" alt="Michael Chen" className="react-astrologer-image" />
                      <div className="react-astrologer-rating">
                        <i className="lucide-star react-rating-star"></i>
                        4.8
                      </div>
                    </div>
                    <div className="react-astrologer-content">
                      <h3 className="react-astrologer-name">Michael Chen</h3>
                      <p className="react-astrologer-specialty">Western Astrology</p>
                      <div className="react-astrologer-details">
                        <div className="react-astrologer-detail">
                          <span className="react-detail-label">Experience:</span>
                          <span className="react-detail-value">12+ years</span>
                        </div>
                        <div className="react-astrologer-detail">
                          <span className="react-detail-label">Reviews:</span>
                          <span className="react-detail-value">289</span>
                        </div>
                        <div className="react-astrologer-detail">
                          <span className="react-detail-label">Languages:</span>
                          <span className="react-detail-value">English, Mandarin</span>
                        </div>
                        <div className="react-astrologer-detail">
                          <span className="react-detail-label">Price:</span>
                          <span className="react-detail-value react-price">$2.2/min</span>
                        </div>
                      </div>
                      <div className="react-astrologer-actions">
                        <button className="react-btn react-btn-primary">Call Now</button>
                        <button className="react-btn react-btn-outline">
                          <i className="lucide-calendar"></i> Book
                        </button>
                      </div>
                    </div>
                  </div>
                </a>
              </div>
              <div className="swiper-slide">
                <a href="">
                  <div className="react-astrologer-card">
                    <div className="react-astrologer-image-container">
                      <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80" alt="Elena Rodriguez" className="react-astrologer-image" />
                      <div className="react-astrologer-rating">
                        <i className="lucide-star react-rating-star"></i>
                        4.7
                      </div>
                    </div>
                    <div className="react-astrologer-content">
                      <h3 className="react-astrologer-name">Elena Rodriguez</h3>
                      <p className="react-astrologer-specialty">Tarot & Astrology</p>
                      <div className="react-astrologer-details">
                        <div className="react-astrologer-detail">
                          <span className="react-detail-label">Experience:</span>
                          <span className="react-detail-value">10+ years</span>
                        </div>
                        <div className="react-astrologer-detail">
                          <span className="react-detail-label">Reviews:</span>
                          <span className="react-detail-value">217</span>
                        </div>
                        <div className="react-astrologer-detail">
                          <span className="react-detail-label">Languages:</span>
                          <span className="react-detail-value">English, Spanish</span>
                        </div>
                        <div className="react-astrologer-detail">
                          <span className="react-detail-label">Price:</span>
                          <span className="react-detail-value react-price">$2.0/min</span>
                        </div>
                      </div>
                      <div className="react-astrologer-actions">
                        <button className="react-btn react-btn-primary">Call Now</button>
                        <button className="react-btn react-btn-outline">
                          <i className="lucide-calendar"></i> Book
                        </button>
                      </div>
                    </div>
                  </div>
                </a>
              </div>
              <div className="swiper-slide">
                <a href="">
                  <div className="react-astrologer-card">
                    <div className="react-astrologer-image-container">
                      <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80" alt="Raj Patel" className="react-astrologer-image" />
                      <div className="react-astrologer-rating">
                        <i className="lucide-star react-rating-star"></i>
                        4.9
                      </div>
                    </div>
                    <div className="react-astrologer-content">
                      <h3 className="react-astrologer-name">Raj Patel</h3>
                      <p className="react-astrologer-specialty">Numerology & Astrology</p>
                      <div className="react-astrologer-details">
                        <div className="react-astrologer-detail">
                          <span className="react-detail-label">Experience:</span>
                          <span className="react-detail-value">18+ years</span>
                        </div>
                        <div className="react-astrologer-detail">
                          <span className="react-detail-label">Reviews:</span>
                          <span className="react-detail-value">412</span>
                        </div>
                        <div className="react-astrologer-detail">
                          <span className="react-detail-label">Languages:</span>
                          <span className="react-detail-value">English, Gujarati, Hindi</span>
                        </div>
                        <div className="react-astrologer-detail">
                          <span className="react-detail-label">Price:</span>
                          <span className="react-detail-value react-price">$2.7/min</span>
                        </div>
                      </div>
                      <div className="react-astrologer-actions">
                        <button className="react-btn react-btn-primary">Call Now</button>
                        <button className="react-btn react-btn-outline">
                          <i className="lucide-calendar"></i> Book
                        </button>
                      </div>
                    </div>
                  </div>
                </a>
              </div>
              <div className="swiper-slide">
                <a href="">
                  <div className="react-astrologer-card">
                    <div className="react-astrologer-image-container">
                      <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80" alt="Raj Patel" className="react-astrologer-image" />
                      <div className="react-astrologer-rating">
                        <i className="lucide-star react-rating-star"></i>
                        4.9
                      </div>
                    </div>
                    <div className="react-astrologer-content">
                      <h3 className="react-astrologer-name">Raj Patel</h3>
                      <p className="react-astrologer-specialty">Numerology & Astrology</p>
                      <div className="react-astrologer-details">
                        <div className="react-astrologer-detail">
                          <span className="react-detail-label">Experience:</span>
                          <span className="react-detail-value">18+ years</span>
                        </div>
                        <div className="react-astrologer-detail">
                          <span className="react-detail-label">Reviews:</span>
                          <span className="react-detail-value">412</span>
                        </div>
                        <div className="react-astrologer-detail">
                          <span className="react-detail-label">Languages:</span>
                          <span className="react-detail-value">English, Gujarati, Hindi</span>
                        </div>
                        <div className="react-astrologer-detail">
                          <span className="react-detail-label">Price:</span>
                          <span className="react-detail-value react-price">$2.7/min</span>
                        </div>
                      </div>
                      <div className="react-astrologer-actions">
                        <button className="react-btn react-btn-primary">Call Now</button>
                        <button className="react-btn react-btn-outline">
                          <i className="lucide-calendar"></i> Book
                        </button>
                      </div>
                    </div>
                  </div>
                </a>
              </div>
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
              <div className="swiper-slide">
                <a href="">
                  <div className="react-blog-card">
                    <div className="react-blog-image-container">
                      <img src="https://images.unsplash.com/photo-1543722530-d2c3201371e7?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Jupiter Transit" className="react-blog-image" />
                      <div className="react-blog-category">Career</div>
                    </div>
                    <div className="react-blog-content">
                      <h3 className="react-blog-title">How Jupiter's Transit Affects Your Career in 2023</h3>
                      <p className="react-blog-excerpt">Discover how Jupiter's movement through different zodiac signs can influence your professional life this year.</p>
                      <div className="react-blog-meta">
                        <div className="react-meta-item">
                          <i className="fa-solid fa-calendar"></i>
                          June 12, 2023
                        </div>
                        <div className="react-meta-item">
                          <i className="fa-solid fa-user"></i>
                          Aisha Sharma
                        </div>
                      </div>
                      <a href="#" className="react-blog-link">Read More  <i className="fa-solid fa-arrow-right"></i></a>
                    </div>
                  </div>
                </a>
              </div>
              <div className="swiper-slide">
                <a href="">
                  <div className="react-blog-card">
                    <div className="react-blog-image-container">
                      <img src="https://images.unsplash.com/photo-1504333638930-c8787321eee0?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Mercury Retrograde" className="react-blog-image" />
                      <div className="react-blog-category">Planets</div>
                    </div>
                    <div className="react-blog-content">
                      <h3 className="react-blog-title">The Power of Mercury Retrograde: Myths vs. Reality</h3>
                      <p className="react-blog-excerpt">Understanding what Mercury retrograde truly means for your communication and planning beyond the common misconceptions.</p>
                      <div className="react-blog-meta">
                        <div className="react-meta-item">
                          <i className="lucide-calendar"></i>
                          May 28, 2023
                        </div>
                        <div className="react-meta-item">
                          <i className="lucide-user"></i>
                          Michael Chen
                        </div>
                      </div>
                      <a href="#" className="react-blog-link">Read More <i className="lucide-arrow-right"></i></a>
                    </div>
                  </div>
                </a>
              </div>
              <div className="swiper-slide">
                <a href="">
                  <div className="react-blog-card">
                    <div className="react-blog-image-container">
                      <img src="https://images.unsplash.com/photo-1532978379173-523e16f371f9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Moon Sign" className="react-blog-image" />
                      <div className="react-blog-category">Zodiac</div>
                    </div>
                    <div className="react-blog-content">
                      <h3 className="react-blog-title">Understanding Your Moon Sign: Emotional Intelligence</h3>
                      <p className="react-blog-excerpt">Learn how your moon sign shapes your emotional responses and inner needs in ways your sun sign doesn't reveal.</p>
                      <div className="react-blog-meta">
                        <div className="react-meta-item">
                          <i className="lucide-calendar"></i>
                          April 15, 2023
                        </div>
                        <div className="react-meta-item">
                          <i className="lucide-user"></i>
                          Elena Rodriguez
                        </div>
                      </div>
                      <a href="#" className="react-blog-link">Read More <i className="lucide-arrow-right"></i></a>
                    </div>
                  </div>
                </a>
              </div>
              <div className="swiper-slide">
                <a href="">
                  <div className="react-blog-card">
                    <div className="react-blog-image-container">
                      <img src="https://images.unsplash.com/photo-1532978379173-523e16f371f9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Moon Sign" className="react-blog-image" />
                      <div className="react-blog-category">Zodiac</div>
                    </div>
                    <div className="react-blog-content">
                      <h3 className="react-blog-title">Understanding Your Moon Sign: Emotional Intelligence</h3>
                      <p className="react-blog-excerpt">Learn how your moon sign shapes your emotional responses and inner needs in ways your sun sign doesn't reveal.</p>
                      <div className="react-blog-meta">
                        <div className="react-meta-item">
                          <i className="lucide-calendar"></i>
                          April 15, 2023
                        </div>
                        <div className="react-meta-item">
                          <i className="lucide-user"></i>
                          Elena Rodriguez
                        </div>
                      </div>
                      <a href="#" className="react-blog-link">Read More <i className="lucide-arrow-right"></i></a>
                    </div>
                  </div>
                </a>
              </div>
              <div className="swiper-slide">
                <a href="">
                  <div className="react-blog-card">
                    <div className="react-blog-image-container">
                      <img src="https://images.unsplash.com/photo-1532978379173-523e16f371f9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Moon Sign" className="react-blog-image" />
                      <div className="react-blog-category">Zodiac</div>
                    </div>
                    <div className="react-blog-content">
                      <h3 className="react-blog-title">Understanding Your Moon Sign: Emotional Intelligence</h3>
                      <p className="react-blog-excerpt">Learn how your moon sign shapes your emotional responses and inner needs in ways your sun sign doesn't reveal.</p>
                      <div className="react-blog-meta">
                        <div className="react-meta-item">
                          <i className="lucide-calendar"></i>
                          April 15, 2023
                        </div>
                        <div className="react-meta-item">
                          <i className="lucide-user"></i>
                          Elena Rodriguez
                        </div>
                      </div>
                      <a href="#" className="react-blog-link">Read More <i className="lucide-arrow-right"></i></a>
                    </div>
                  </div>
                </a>
              </div>
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
              <div className="swiper-slide">
                <a href="#" className="react-product-category-card">
                  <img src="https://images.unsplash.com/photo-1598751337726-3c8577d00bd3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Crystal Gemstones" className="react-product-category-image" />
                  <div className="react-product-category-overlay"></div>
                  <div className="react-product-category-content">
                    <h3 className="react-product-category-title">Crystal Gemstones</h3>
                    <p className="react-product-category-count">42 Products</p>
                  </div>
                </a>
              </div>
              <div className="swiper-slide">
                <a href="#" className="react-product-category-card">
                  <img src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Zodiac Jewelry" className="react-product-category-image" />
                  <div className="react-product-category-overlay"></div>
                  <div className="react-product-category-content">
                    <h3 className="react-product-category-title">Zodiac Jewelry</h3>
                    <p className="react-product-category-count">36 Products</p>
                  </div>
                </a>
              </div>
              <div className="swiper-slide">
                <a href="#" className="react-product-category-card">
                  <img src="https://images.unsplash.com/photo-1612875895771-db03db82371a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Ritual Items" className="react-product-category-image" />
                  <div className="react-product-category-overlay"></div>
                  <div className="react-product-category-content">
                    <h3 className="react-product-category-title">Ritual Items</h3>
                    <p className="react-product-category-count">28 Products</p>
                  </div>
                </a>
              </div>
              <div className="swiper-slide">
                <a href="#" className="react-product-category-card">
                  <img src="https://images.unsplash.com/photo-1612875895771-db03db82371a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Ritual Items" className="react-product-category-image" />
                  <div className="react-product-category-overlay"></div>
                  <div className="react-product-category-content">
                    <h3 className="react-product-category-title">Ritual Items</h3>
                    <p className="react-product-category-count">28 Products</p>
                  </div>
                </a>
              </div>
              <div className="swiper-slide">
                <a href="#" className="react-product-category-card">
                  <img src="https://images.unsplash.com/photo-1600690556482-57edeeeebbfd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Feng Shui Products" className="react-product-category-image" />
                  <div className="react-product-category-overlay"></div>
                  <div className="react-product-category-content">
                    <h3 className="react-product-category-title">Feng Shui Products</h3>
                    <p className="react-product-category-count">31 Products</p>
                  </div>
                </a>
              </div>
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
              <div className="swiper-slide">
                <div className="react-testimonial-card">
                  <div className="react-testimonial-content">
                    <div className="react-testimonial-profile">
                      <div className="react-testimonial-image-container">
                        <img
                          src="https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80"
                          alt="Jessica Thompson"
                          className="react-testimonial-image"
                        />
                      </div>
                      <h3 className="react-testimonial-name">Jessica Thompson</h3>
                      <p className="react-testimonial-location">New York, USA</p>
                      <div className="react-testimonial-rating">
                        <i className="lucide-star react-filled"></i>
                        <i className="lucide-star react-filled"></i>
                        <i className="lucide-star react-filled"></i>
                        <i className="lucide-star react-filled"></i>
                        <i className="lucide-star react-filled"></i>
                      </div>
                      <p className="react-testimonial-date">March 15, 2023</p>
                    </div>
                    <div className="react-testimonial-text">
                      <i className="lucide-quote react-testimonial-quote-icon"></i>
                      <p className="react-testimonial-message">
                        The birth chart reading I received was incredibly accurate. It helped me understand patterns in my life and make better decisions. I'm grateful for the insight and guidance!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="swiper-slide">
                <div className="react-testimonial-card">
                  <div className="react-testimonial-content">
                    <div className="react-testimonial-profile">
                      <div className="react-testimonial-image-container">
                        <img
                          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80"
                          alt="Jessica Thompson"
                          className="react-testimonial-image"
                        />
                      </div>
                      <h3 className="react-testimonial-name">David Chen</h3>
                      <p className="react-testimonial-location">Toronto, Canada</p>
                      <div className="react-testimonial-rating">
                        <i className="lucide-star react-filled"></i>
                        <i className="lucide-star react-filled"></i>
                        <i className="lucide-star react-filled"></i>
                        <i className="lucide-star react-filled"></i>
                        <i className="lucide-star react-filled"></i>
                      </div>
                      <p className="react-testimonial-date">JAn 15, 2023</p>
                    </div>
                    <div className="react-testimonial-text">
                      <i className="lucide-quote react-testimonial-quote-icon"></i>
                      <p className="react-testimonial-message">
                        I was skeptical at first, but my career reading was spot on. The astrologer predicted a career change that happened exactly as described. I now consult before any major decision.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
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


