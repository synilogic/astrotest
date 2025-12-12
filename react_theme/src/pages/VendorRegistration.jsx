import React from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import useBreadStars from '../hooks/useBreadStars'
import usePageTitle from '../hooks/usePageTitle'

const VendorRegistration = () => {
  useBreadStars()
  usePageTitle('Vendor Registration - Astrology Theme')

  const onSubmit = (e) => {
    e.preventDefault()
    // You can replace this with actual submission logic / API call
    alert('Thank you! Your vendor registration has been submitted.')
  }

  return (
    <div>
      <Navbar />

      {/* Themed Bread Hero */}
      <section className="react-new-bread-hero-container">
        <div className="react-new-bread-hero-bg-pattern"></div>
        <div className="react-new-bread-hero-stars" id="react-new-bread-stars-container"></div>
        <div className="react-new-bread-hero-content">
          <div className="react-new-bread-astrology-icon">
          <i className="fas fa-star-and-crescent"></i>
          </div>
          <h1 className="react-new-bread-hero-title">Vendor Registration</h1>
          <div className="react-new-bread-breadcrumbs">
            <a href="#">Home</a>
            <span className="react-new-bread-breadcrumb-separator">/</span>
            <span>Vendor Registration</span>
          </div>
        </div>
      </section>

      {/* Page Content */}
      <div className="container">
        <div className="react-vendor-card">
          <div className="react-vendor-card-header">
            <div className="react-vendor-header-left">
              <div className="react-vendor-icon-circle">
                <i className="fas fa-id-card"></i>
              </div>
              <div>
                <h2 className="react-vendor-title">Register as a Vendor</h2>
                <p className="react-vendor-subtitle">Join our marketplace and grow your spiritual business</p>
              </div>
            </div>
            <div className="vendor-header-right">
              <div className="react-vendor-badge">New</div>
            </div>
          </div>

          <form className="react-vendor-form" onSubmit={onSubmit}>
            <div className="react-vendor-grid">
              <div className="react-vendor-field">
                <label className="react-vendor-label">Name <span className="react-required">*</span></label>
                <input type="text" className="react-vendor-input" placeholder="Name" required />
              </div>
              <div className="react-vendor-field">
                <label className="react-vendor-label">Email <span className="react-required">*</span></label>
                <input type="email" className="react-vendor-input" placeholder="Email" required />
              </div>
              <div className="react-vendor-field">
                <label className="react-vendor-label">Mobile No. <span className="react-required">*</span></label>
                <div className="react-vendor-input-group">
                  <span className="react-vendor-prefix">+91</span>
                  <input type="tel" className="react-vendor-input react-no-left-radius" placeholder="Mobile No." pattern="[0-9]{10}" required />
                </div>
              </div>
              <div className="react-vendor-field">
                <label className="react-vendor-label">GST Number</label>
                <input type="text" className="react-vendor-input" placeholder="GST Number" />
              </div>
              <div className="react-vendor-field">
                <label className="react-vendor-label">Firm Name <span className="react-required">*</span></label>
                <input type="text" className="react-vendor-input" placeholder="Firm Name" required />
              </div>
              <div className="react-vendor-field">
                <label className="react-vendor-label">Select your Location</label>
                <input type="text" className="react-vendor-input" placeholder="Select your Location" />
              </div>
              <div className="react-vendor-field">
                <label className="react-vendor-label">Pincode</label>
                <input type="text" className="react-vendor-input" placeholder="Pincode" pattern="[0-9]{6}" />
              </div>
              <div className="react-vendor-field">
              <label className="react-vendor-label">Term Condition <span className="react-required">*</span></label>
                <textarea className="react-vendor-input react-vendor-textarea" placeholder="Tell us about your business, products, and experience"></textarea>
              </div>
              {/* <div className="react-vendor-field">
                <label className="react-vendor-label">Term Condition <span className="react-required">*</span></label>
                <div className="react-vendor-terms">
                  <input type="checkbox" id="terms" required />
                  <label htmlFor="terms">I agree to the Terms & Conditions</label>
                </div>
              </div> */}
            </div>

            <div className="react-vendor-actions">
              <button type="submit" className="react-vendor-submit-btn">
                Submit Registration
                <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default VendorRegistration


