import React, { useState, useEffect, useRef } from 'react'
import useLocalAuth from '../hooks/useLocalAuth'

const LoginPopup = ({ isOpen, onClose }) => {
  const { login } = useLocalAuth()
  const [userType, setUserType] = useState('Customer')
  const [mobileNumber, setMobileNumber] = useState('')
  const [isAgreed, setIsAgreed] = useState(false)
  const [otp, setOtp] = useState('')
  const [showOtp, setShowOtp] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const overlayRef = useRef(null)

  // Handle popup open/close with smooth transitions
  useEffect(() => {
    if (overlayRef.current) {
      if (isOpen) {
        overlayRef.current.style.display = 'flex'
        requestAnimationFrame(() => {
          overlayRef.current.classList.add('react-login-show')
        })
      } else {
        overlayRef.current.classList.remove('react-login-show')
        setTimeout(() => {
          overlayRef.current.style.display = 'none'
        }, 400) // Match CSS transition duration
      }
    }
  }, [isOpen])

  // Handle escape key to close popup
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    // if (isOpen) {
    //   document.addEventListener('keydown', handleEscape)
    //   document.body.style.overflow = 'hidden'
    // }

    // return () => {
    //   document.removeEventListener('keydown', handleEscape)
    //   document.body.style.overflow = 'unset'
    // }
  }, [isOpen, onClose])

  // Handle overlay click to close popup
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleSendOtp = (e) => {
    e.preventDefault()
    if (!mobileNumber || !isAgreed) {
      alert('Please fill in all required fields and agree to terms.')
      return
    }
    
    // Show OTP input
    setShowOtp(true)
  }

  const handleVerifyOtp = (e) => {
    e.preventDefault()
    if (!otp) {
      alert('Please enter the OTP.')
      return
    }
    
    setIsVerifying(true)
    
    // Simulate OTP verification (static OTP: 1234)
    setTimeout(() => {
      if (otp === '1234') {
        // Login successful
        const userData = {
          name: userType === 'Customer' ? 'Customer User' : 'Vendor User',
          mobile: mobileNumber,
          type: userType,
          email: `${mobileNumber}@example.com`
        }
        login(userData)
        onClose()
        // Reset form
        setMobileNumber('')
        setOtp('')
        setShowOtp(false)
        setIsAgreed(false)
      } else {
        alert('Invalid OTP. Please try again.')
      }
      setIsVerifying(false)
    }, 1500)
  }

  const handleClose = () => {
    // Reset form when closing
    setMobileNumber('')
    setOtp('')
    setShowOtp(false)
    setIsAgreed(false)
    setIsVerifying(false)
    onClose()
  }

  return (
    <div 
      ref={overlayRef}
      className="react-login-overlay"
      onClick={handleOverlayClick}
      style={{display: 'none'}}
    >
      <div className="react-login-popup">
        <button className="react-login-close-btn" onClick={handleClose}>
          <i className="fas fa-times"></i>
        </button>
        
        <div className="react-login-header">
          <h2>Login To User</h2>
        </div>

        <form className="react-login-form" onSubmit={showOtp ? handleVerifyOtp : handleSendOtp}>
          {/* User Type Selection */}
          <div className="react-login-user-type">
            <button
              type="button"
              className={`react-login-type-btn ${userType === 'Customer' ? 'active' : ''}`}
              onClick={() => setUserType('Customer')}
            >
              Customer
            </button>
            <button
              type="button"
              className={`react-login-type-btn ${userType === 'Vendor' ? 'active' : ''}`}
              onClick={() => setUserType('Vendor')}
            >
              Vendor
            </button>
          </div>

          {!showOtp ? (
            <>
              {/* Mobile Number Input */}
              <div className="react-login-form-group">
                <label htmlFor="mobile">Mobile No.</label>
                <div className="react-login-mobile-input">
                  <div className="react-login-country-code">
                    <span className="react-login-flag">🇮🇳</span>
                    <span>+91</span>
                    <i className="fas fa-chevron-down"></i>
                  </div>
                  <input
                    type="tel"
                    id="mobile"
                    placeholder="Enter Your Mobile No."
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="react-login-terms">
                <label className="react-login-checkbox-label">
                  <input
                    type="checkbox"
                    checked={isAgreed}
                    onChange={(e) => setIsAgreed(e.target.checked)}
                    required
                  />
                  <span className="react-login-checkmark"></span>
                  <span className="react-login-terms-text">
                    I Agree to <a href="#" className="react-login-link">Terms & Conditions</a> And <a href="#" className="react-login-link">Privacy Policy</a>.
                  </span>
                </label>
              </div>

              {/* Send OTP Button */}
              <button type="submit" className="react-login-submit-btn">
                Send OTP
              </button>
            </>
          ) : (
            <>
              {/* OTP Input */}
              <div className="react-login-form-group">
                <label htmlFor="otp">Enter OTP</label>
                <div className="react-login-otp-info">
                  <p>We've sent a 4-digit OTP to +91 {mobileNumber}</p>
                  <p className="react-login-otp-hint">Use OTP: <strong>1234</strong> for testing</p>
                </div>
                <input
                  type="text"
                  id="otp"
                  placeholder="Enter 4-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength="4"
                  className="react-login-otp-input"
                  required
                />
              </div>

              {/* Back Button */}
              <button 
                type="button" 
                className="react-login-back-btn"
                onClick={() => setShowOtp(false)}
              >
                <i className="fas fa-arrow-left"></i>
                Back to Mobile
              </button>

              {/* Verify OTP Button */}
              <button 
                type="submit" 
                className="react-login-submit-btn"
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Verifying...
                  </>
                ) : (
                  'Verify OTP'
                )}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  )
}

export default LoginPopup
