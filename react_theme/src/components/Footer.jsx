import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
   <>
   <footer className="react-new-footer">
        <div className="container">
          <div className="react-new-footer-container">
            <div className="react-new-footer-brand">
              <img src="https://www.karmleela.com/uploads/setting/62096.png" alt="" />
              {/* <h3 className="react-new-brand-name">Karmleela</h3>
              <p className="react-new-brand-tagline">Bhagya Samjho, Jeevan Badlo</p> */}
              <p className="react-new-brand-description">
                Karmleela: Bhagya Samjho, Jeevan Badlo At Karmleela, we believe your destiny isn’t fixed — it’s a map. And the right guidance can help you decode it. We are India’s most trusted upcoming astrology platform, built to help you align 
              </p>
              <div className="react-new-social-links">
                <a href="#" className="react-new-social-link" aria-label="Facebook">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="#" className="react-new-social-link" aria-label="Instagram">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="#" className="react-new-social-link" aria-label="Twitter">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" className="react-new-social-link" aria-label="YouTube">
                  <i className="fab fa-youtube"></i>
                </a>
                <a href="#" className="react-new-social-link" aria-label="LinkedIn">
                  <i className="fab fa-linkedin-in"></i>
                </a>
              </div>
            </div>
            <div className="react-new-footer-section">
              <h4 className="react-new-section-title">About</h4>
              <ul className="react-new-footer-links">
                <li><a href="#about">About</a></li>
                <li><Link to="/contact">Contact Us</Link></li>
                <li><a href="#faq">FAQ</a></li>
                <li><Link to="/vendor-registration">Vendor Registration</Link></li>
                <li><a href="#vendor-login" className="react-vendor-BTn"><span style={{marginRight: '5px'}}><i className="fa-solid fa-right-to-bracket"></i></span> Vendor Login</a></li>
              </ul>
            </div>
            <div className="react-new-footer-section">
              <h4 className="react-new-section-title">Legal</h4>
              <ul className="react-new-footer-links">
                <li><a href="#terms">Terms & Conditions</a></li>
                <li><a href="#privacy">Privacy Policy</a></li>
                <li><a href="#refund">Refund & Cancellation Policy</a></li>
                <li><a href="#deletion">Deletion Instructions</a></li>
              </ul>
            </div>
            <div className="react-new-footer-section">
              <h4 className="react-new-section-title">Contact</h4>
              <div className="react-new-contact-info">
                <div className="react-new-contact-item">
                  <i className="fa-solid fa-house"></i>
                  <a href="#">
                    C-7, Santosh Nagar -I, Borkhera, Kota
                  </a>
                </div>
                <div className="react-new-contact-item">
                  <i className="fas fa-envelope"></i>
                  <a href="mailto:KarmLeela99@gmail.com">KarmLeela99@gmail.com</a>
                </div>
                <div className="react-new-contact-item">
                  <i className="fas fa-phone"></i>
                  <a href="tel:+919875866679">+91 98758 66679</a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="react-new-footer-bottom">
          <div className="react-new-footer-bottom-content">
            <p className="react-new-copyright">
              ©2022-2025 Karmleela (Under Charveesh Enterprises). All rights reserved.  Powered by <a href="#" className="react-new-tech-partner">Synilogic Tech Pvt Ltd</a>
            </p>
          </div>
        </div>
      </footer>
   </>
  )
}

export default Footer