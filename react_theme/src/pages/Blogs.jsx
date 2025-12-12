import React from 'react'
import useBreadStars from '../hooks/useBreadStars'
import usePageTitle from '../hooks/usePageTitle'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Link } from 'react-router-dom'

const Blogs = () => {
  useBreadStars()
  usePageTitle('Blogs - Astrology Theme')
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
            <a href="#">Home</a>
            <span className="react-new-bread-breadcrumb-separator">/</span>
            <span>Our Blogs</span>
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="react-blog-Page">
            <div className="react-blog-card react-blog-card-shadow">
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
                <Link to="/blogInner" className="react-blog-link">Read More <i className="fa-solid fa-arrow-right"></i></Link>
              </div>
            </div>

            <div className="react-blog-card react-blog-card-shadow">
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

            <div className="react-blog-card react-blog-card-shadow">
              <div className="react-blog-image-container">
                <img src="https://www.karmleela.com/uploads/blog/1737354931-blog_image.png" alt="Moon Sign" className="react-blog-image" />
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

            <div className="react-blog-card react-blog-card-shadow">
              <div className="react-blog-image-container">
                <img src="https://www.karmleela.com/uploads/blog/1737354725-blog_image.png" alt="Moon Sign" className="react-blog-image" />
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

            <div className="react-blog-card react-blog-card-shadow">
              <div className="react-blog-image-container">
                <img src="https://www.karmleela.com/uploads/blog/1737354891-blog_image.png" alt="Moon Sign" className="react-blog-image" />
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
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Blogs


