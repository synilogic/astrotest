import React from 'react'
import useBreadStars from '../hooks/useBreadStars'
import usePageTitle from '../hooks/usePageTitle'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const Services = () => {
  useBreadStars()
  usePageTitle('Our Services - Astrology Theme')
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
            <a href="#">Home</a>
            <span className="react-new-bread-breadcrumb-separator">/</span>
            <span>Our Services</span>
          </div>
        </div>
      </section>

      {/* Main */}
      <div className="container">
        <div className="react-services-container">
          <div className="react-services-sidebar">
            <div className="react-services-sidebar-header">
              <h2>Categories</h2>
              <p className="react-services-sidebar-subtitle">Explore our astrology services</p>
            </div>
            <div className="react-services-sidebar-content">
              <ul className="react-services-category-list">
                <li className="react-services-category-item active"><a href="#kundli">Kundli & Dosh</a></li>
                <li className="react-services-category-item"><a href="#reki">Reki & Healing</a></li>
                <li className="react-services-category-item"><a href="#business">Business & Growth</a></li>
                <li className="react-services-category-item"><a href="#love">Love & Marriage</a></li>
                <li className="react-services-category-item"><a href="#negativity">Negativity & Evil Eye</a></li>
              </ul>
            </div>
          </div>
          <div className="react-services-main-content">
            <div className="react-services-services-grid">
              <div className="react-services-service-card">
                <div className="react-services-card-badge">Popular</div>
                <div className="react-services-card-image services-angarak">
                  <img src="https://astrogyanvi.com/uploads/service/1729098809-service_image.jpg" alt="Angarak Dosh" />
                </div>
                <div className="react-services-card-content">
                  <h3 className="react-services-card-title">Angarak Dosh</h3>
                  <p className="react-services-card-description">Remedies for Mars-Rahu conjunction effects and their negative impacts on life journey</p>
                </div>
              </div>
              <div className="react-services-service-card">
                <div className="react-services-card-image services-grahan">
                  <img src="https://astrogyanvi.com/uploads/service/1723048374-service_image.jpg" alt="Grahan Dosh Shanti" />
                </div>
                <div className="react-services-card-content">
                  <h3 className="react-services-card-title">Grahan Dosh Shanti</h3>
                  <p className="react-services-card-description">Eclipse-related doshas and their spiritual remedies for peace and prosperity</p>
                </div>
              </div>
              <div className="react-services-service-card">
                <div className="react-services-card-badge">Trending</div>
                <div className="react-services-card-image services-grih">
                  <img src="https://astrogyanvi.com/uploads/service/1729100134-service_image.jpg" alt="Grih Shanti Anusthan" />
                </div>
                <div className="react-services-card-content">
                  <h3 className="react-services-card-title">Grih Shanti Anusthan</h3>
                  <p className="react-services-card-description">Home purification rituals for positive energy and family harmony</p>
                </div>
              </div>
              <div className="react-services-service-card">
                <div className="react-services-card-image services-guru">
                  <div className="services-card-icon">🙏</div>
                </div>
                <div className="react-services-card-content">
                  <h3 className="react-services-card-title">Guru Chandal Dosh</h3>
                  <p className="react-services-card-description">Jupiter-Rahu conjunction remedies for wisdom and spiritual growth</p>
                </div>
              </div>
              <div className="react-services-service-card">
                <div className="react-services-card-badge">Most Effective</div>
                <div className="react-services-card-image services-kal">
                  <div className="services-card-icon">🐍</div>
                </div>
                <div className="react-services-card-content">
                  <h3 className="react-services-card-title">Kal Sarp Dosh</h3>
                  <p className="react-services-card-description">Serpent yoga remedies for overcoming obstacles and achieving success</p>
                </div>
              </div>
              <div className="react-services-service-card">
                <div className="react-services-card-image services-mangal">
                  <div className="services-card-icon">♂️</div>
                </div>
                <div className="react-services-card-content">
                  <h3 className="react-services-card-title">Mangal Dosh</h3>
                  <p className="react-services-card-description">Mars-related doshas affecting marriage and relationships</p>
                </div>
              </div>
              <div className="react-services-service-card">
                <div className="react-services-card-image services-nav">
                  <div className="services-card-icon">🌟</div>
                </div>
                <div className="react-services-card-content">
                  <h3 className="react-services-card-title">Nav Graha Shanti</h3>
                  <p className="react-services-card-description">Nine planetary peace rituals for overall life balance and harmony</p>
                </div>
              </div>
              <div className="react-services-service-card">
                <div className="react-services-card-image services-pitra">
                  <div className="services-card-icon">👴</div>
                </div>
                <div className="react-services-card-content">
                  <h3 className="react-services-card-title">Pitra Dosh</h3>
                  <p className="react-services-card-description">Ancestral karma remedies for family lineage healing and blessings</p>
                </div>
              </div>
              <div className="react-services-service-card">
                <div className="react-services-card-image services-vish">
                  <div className="services-card-icon">☠️</div>
                </div>
                <div className="react-services-card-content">
                  <h3 className="react-services-card-title">Vish Yog</h3>
                  <p className="react-services-card-description">Poison yoga remedies for removing toxic influences from life</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Services


