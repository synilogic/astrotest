import React from 'react'
import useBreadStars from '../hooks/useBreadStars'
import usePageTitle from '../hooks/usePageTitle'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const Contact = () => {
  useBreadStars()
  usePageTitle('Contact Us - Astrology Theme')
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
          <h1 className="react-new-bread-hero-title">Contact Us</h1>
          <div className="react-new-bread-breadcrumbs">
            <a href="#">Home</a>
            <span className="react-new-bread-breadcrumb-separator">/</span>
            <span>Contact Us</span>
          </div>
        </div>
      </section>

      <section className="react-contact-section-own">
        <div className="container">
          <div className="react-contact-contact-wrapper">
            <div className="react-contact-contact-info">
              <div className="react-contact-info-header">
                <h2>Contact Information</h2>
                <p>Reach out to us through any of the following </p>
              </div>
              <div className="react-contact-info-cards">
                <div className="react-contact-info-card">
                  <div className="react-contact-icon">
                    <i className="fas fa-map-marker-alt"></i>
                  </div>
                  <div className="react-contact-info-content">
                    <h3>Address</h3>
                    <p>16/98, Devashish City<br />Kota, Rajasthan</p>
                  </div>
                </div>
                <div className="react-contact-info-card">
                  <div className="react-contact-icon">
                    <i className="fas fa-phone"></i>
                  </div>
                  <div className="react-contact-info-content">
                    <h3>Phone Numbers</h3>
                    <p>+91 7230018999<br />+91 7690018999</p>
                  </div>
                </div>
                <div className="react-contact-info-card">
                  <div className="react-contact-icon">
                    <i className="fas fa-envelope"></i>
                  </div>
                  <div className="react-contact-info-content">
                    <h3>Email</h3>
                    <p>Synilogictech@gmail.com</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="react-contact-contact-form">
              <div className="react-contact-form-header">
                <h2>Send us a Message</h2>
                <p>Fill out the form below and we'll get back to you within 24 hours</p>
              </div>
              <form className="react-contact-form" id="contactForm">
                <div className="react-contact-form-row">
                  <div className="react-contact-form-group">
                    <input type="text" name="name" id="name" placeholder=" " required />
                    <label htmlFor="name">Full Name</label>
                  </div>
                  <div className="react-contact-form-group">
                    <input type="email" name="email" id="email" placeholder=" " required />
                    <label htmlFor="email">Email Address</label>
                  </div>
                </div>
                <div className="react-contact-form-row">
                  <div className="react-contact-form-group">
                    <input type="tel" name="phone" id="phone" placeholder=" " required />
                    <label htmlFor="phone">Phone Number (+91)</label>
                  </div>
                  <div className="react-contact-form-group">
                    <input type="text" name="subject" id="subject" placeholder=" " required />
                    <label htmlFor="subject">Subject</label>
                  </div>
                </div>
                <div className="react-contact-form-group">
                  <textarea name="message" id="message" rows={5} placeholder=" " required></textarea>
                  <label htmlFor="message">Your Message</label>
                </div>
                <button type="submit" className="react-contact-submit-btn">
                  <span>Send Message</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default Contact


