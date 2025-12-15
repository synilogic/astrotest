import React, { useState, useEffect } from 'react'
import useBreadStars from '../hooks/useBreadStars'
import usePageTitle from '../hooks/usePageTitle'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { submitContactForm, getContactDepartments } from '../utils/api'

const Contact = () => {
  useBreadStars()
  usePageTitle('Contact Us - Astrology Theme')

  // Departments state
  const [departments, setDepartments] = useState([])
  const [loadingDepartments, setLoadingDepartments] = useState(true)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    number: '',
    department: '',
    subject: '',
    message: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' })

  // Load departments on mount
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const result = await getContactDepartments()
        if (result.status === 1 && Array.isArray(result.data)) {
          setDepartments(result.data)
        }
      } catch (error) {
        console.error('Error loading departments:', error)
      } finally {
        setLoadingDepartments(false)
      }
    }
    loadDepartments()
  }, [])

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitStatus({ type: '', message: '' })

    try {
      const result = await submitContactForm(formData)
      
      if (result.status === 1) {
        setSubmitStatus({ type: 'success', message: result.msg || 'Thank you! We will get back to you soon.' })
        // Reset form
        setFormData({ name: '', email: '', number: '', department: '', subject: '', message: '' })
      } else {
        setSubmitStatus({ type: 'error', message: result.msg || 'Something went wrong. Please try again.' })
      }
    } catch (error) {
      setSubmitStatus({ type: 'error', message: 'Network error. Please try again.' })
    } finally {
      setSubmitting(false)
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
              <form className="react-contact-form" id="contactForm" onSubmit={handleSubmit}>
                {/* Success/Error Message */}
                {submitStatus.message && (
                  <div className={`react-contact-alert ${submitStatus.type === 'success' ? 'react-contact-alert-success' : 'react-contact-alert-error'}`}>
                    <i className={`fas ${submitStatus.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                    <span>{submitStatus.message}</span>
                  </div>
                )}
                
                <div className="react-contact-form-row">
                  <div className="react-contact-form-group">
                    <input 
                      type="text" 
                      name="name" 
                      id="name" 
                      placeholder=" " 
                      required 
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={submitting}
                    />
                    <label htmlFor="name">Full Name</label>
                  </div>
                  <div className="react-contact-form-group">
                    <input 
                      type="email" 
                      name="email" 
                      id="email" 
                      placeholder=" " 
                      required 
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={submitting}
                    />
                    <label htmlFor="email">Email Address</label>
                  </div>
                </div>
                <div className="react-contact-form-row">
                  <div className="react-contact-form-group">
                    <input 
                      type="tel" 
                      name="number" 
                      id="number" 
                      placeholder=" " 
                      value={formData.number}
                      onChange={handleInputChange}
                      disabled={submitting}
                    />
                    <label htmlFor="number">Phone Number (+91)</label>
                  </div>
                  <div className="react-contact-form-group">
                    <select
                      name="department"
                      id="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      disabled={submitting || loadingDepartments}
                      className="react-contact-select"
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.title}
                        </option>
                      ))}
                    </select>
                    <label htmlFor="department" className="react-contact-select-label">Department</label>
                  </div>
                </div>
                <div className="react-contact-form-group">
                  <input 
                    type="text" 
                    name="subject" 
                    id="subject" 
                    placeholder=" " 
                    required 
                    value={formData.subject}
                    onChange={handleInputChange}
                    disabled={submitting}
                  />
                  <label htmlFor="subject">Subject</label>
                </div>
                <div className="react-contact-form-group">
                  <textarea 
                    name="message" 
                    id="message" 
                    rows={5} 
                    placeholder=" " 
                    required
                    value={formData.message}
                    onChange={handleInputChange}
                    disabled={submitting}
                  ></textarea>
                  <label htmlFor="message">Your Message</label>
                </div>
                <button type="submit" className="react-contact-submit-btn" disabled={submitting}>
                  {submitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Send Message</span>
                  )}
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


