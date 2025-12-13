import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchWelcomeData } from '../utils/api'

// Get base URL for pages (remove /api from WELCOME_API)
const getPagesBaseUrl = () => {
  const welcomeApi = import.meta.env.VITE_WELCOME_API || 'http://localhost:8005/api'
  return welcomeApi.replace('/api', '')
}

const Footer = () => {
  const [footerData, setFooterData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadFooterData = async () => {
      try {
        const welcomeRes = await fetchWelcomeData()
        if (welcomeRes && welcomeRes.status === 1 && welcomeRes.data) {
          setFooterData(welcomeRes.data)
        }
      } catch (error) {
        console.error('[Footer] Error fetching footer data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFooterData()
  }, [])

  // Use backend data if available, otherwise use fallback values
  const companyName = footerData?.company_name || 'Karmleela'
  const logo = footerData?.logo || 'https://www.karmleela.com/uploads/setting/62096.png'
  const description = footerData?.splash_screen_about_us || 'Karmleela: Bhagya Samjho, Jeevan Badlo At Karmleela, we believe your destiny isn\'t fixed — it\'s a map. And the right guidance can help you decode it. We are India\'s most trusted upcoming astrology platform, built to help you align'
  const address = footerData?.address || 'C-7, Santosh Nagar -I, Borkhera, Kota'
  const email = footerData?.email || 'KarmLeela99@gmail.com'
  const phone = footerData?.mobile_no || footerData?.telephone || '+91 98758 66679'
  
  // Social media links
  const facebookLink = footerData?.facebook_link || '#'
  const instagramLink = footerData?.instagram_link || '#'
  const twitterLink = footerData?.twitter_link || '#'
  const youtubeLink = footerData?.youtube_link || '#'
  const linkedinLink = footerData?.linkedin_link || '#'

  // Format phone number for tel: link
  const formatPhoneForTel = (phoneNumber) => {
    if (!phoneNumber) return ''
    // Remove spaces and ensure it starts with +
    const cleaned = phoneNumber.replace(/\s+/g, '')
    return cleaned.startsWith('+') ? cleaned : `+91${cleaned.replace(/^\+?91/, '')}`
  }

  const telLink = formatPhoneForTel(phone)

  return (
   <>
   <footer className="react-new-footer">
        <div className="container">
          <div className="react-new-footer-container">
            <div className="react-new-footer-brand">
              <img src={logo} alt={companyName} />
              <p className="react-new-brand-description">
                {description}
              </p>
              <div className="react-new-social-links">
                {facebookLink && facebookLink !== '#' && (
                  <a href={facebookLink} target="_blank" rel="noopener noreferrer" className="react-new-social-link" aria-label="Facebook">
                    <i className="fab fa-facebook-f"></i>
                  </a>
                )}
                {instagramLink && instagramLink !== '#' && (
                  <a href={instagramLink} target="_blank" rel="noopener noreferrer" className="react-new-social-link" aria-label="Instagram">
                    <i className="fab fa-instagram"></i>
                  </a>
                )}
                {twitterLink && twitterLink !== '#' && (
                  <a href={twitterLink} target="_blank" rel="noopener noreferrer" className="react-new-social-link" aria-label="Twitter">
                    <i className="fab fa-twitter"></i>
                  </a>
                )}
                {youtubeLink && youtubeLink !== '#' && (
                  <a href={youtubeLink} target="_blank" rel="noopener noreferrer" className="react-new-social-link" aria-label="YouTube">
                    <i className="fab fa-youtube"></i>
                  </a>
                )}
                {linkedinLink && linkedinLink !== '#' && (
                  <a href={linkedinLink} target="_blank" rel="noopener noreferrer" className="react-new-social-link" aria-label="LinkedIn">
                    <i className="fab fa-linkedin-in"></i>
                  </a>
                )}
              </div>
            </div>
            <div className="react-new-footer-section">
              <h4 className="react-new-section-title">About</h4>
              <ul className="react-new-footer-links">
                <li><a href={`${getPagesBaseUrl()}/page_app/about-us`} target="_blank" rel="noopener noreferrer">About</a></li>
                <li><Link to="/contact">Contact Us</Link></li>
                <li><a href={`${getPagesBaseUrl()}/page_app/faq`} target="_blank" rel="noopener noreferrer">FAQ</a></li>
                <li><Link to="/vendor-registration">Vendor Registration</Link></li>
                <li><a href="#vendor-login" className="react-vendor-BTn"><span style={{marginRight: '5px'}}><i className="fa-solid fa-right-to-bracket"></i></span> Vendor Login</a></li>
              </ul>
            </div>
            <div className="react-new-footer-section">
              <h4 className="react-new-section-title">Legal</h4>
              <ul className="react-new-footer-links">
                <li><a href={`${getPagesBaseUrl()}/page_app/terms-condition`} target="_blank" rel="noopener noreferrer">Terms & Conditions</a></li>
                <li><a href={`${getPagesBaseUrl()}/page_app/privacy-policy`} target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
                <li><a href={`${getPagesBaseUrl()}/page_app/refund-and-cancellation-policy`} target="_blank" rel="noopener noreferrer">Refund & Cancellation Policy</a></li>
                <li><a href={`${getPagesBaseUrl()}/page_app/deletion-instruction`} target="_blank" rel="noopener noreferrer">Deletion Instructions</a></li>
              </ul>
            </div>
            <div className="react-new-footer-section">
              <h4 className="react-new-section-title">Contact</h4>
              <div className="react-new-contact-info">
                {address && (
                  <div className="react-new-contact-item">
                    <i className="fa-solid fa-house"></i>
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`} target="_blank" rel="noopener noreferrer">
                      {address}
                    </a>
                  </div>
                )}
                {email && (
                  <div className="react-new-contact-item">
                    <i className="fas fa-envelope"></i>
                    <a href={`mailto:${email}`}>{email}</a>
                  </div>
                )}
                {phone && (
                  <div className="react-new-contact-item">
                    <i className="fas fa-phone"></i>
                    <a href={telLink ? `tel:${telLink}` : '#'}>{phone}</a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="react-new-footer-bottom">
          <div className="react-new-footer-bottom-content">
            <p className="react-new-copyright">
              ©2022-2025 {companyName} (Under Charveesh Enterprises). All rights reserved.  Powered by <a href="#" className="react-new-tech-partner">Synilogic Tech Pvt Ltd</a>
            </p>
          </div>
        </div>
      </footer>
   </>
  )
}

export default Footer