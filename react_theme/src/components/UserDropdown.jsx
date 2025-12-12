import React, { useState, useEffect, useRef } from 'react'
import useLocalAuth from '../hooks/useLocalAuth'
import { Link } from 'react-router-dom'

const UserDropdown = () => {
  const { user, logout } = useLocalAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const dropdownRef = useRef(null)
  const timeoutRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Check if device is mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  // Update mobile state on window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Handle hover for desktop only
  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsHovered(true)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsHovered(false)
      timeoutRef.current = setTimeout(() => {
        if (!isHovered) {
          setIsOpen(false)
        }
      }, 500) // Increased delay before closing
    }
  }

  // Handle click for mobile and desktop
  const handleClick = () => {
    setIsOpen(!isOpen)
  }

  const handleLogout = () => {
    logout()
    setIsOpen(false)
  }

  const handleMyAccount = () => {
    setIsOpen(false)
  }

  // Determine if dropdown should be visible
  const shouldShowDropdown = isMobile ? isOpen : (isOpen || isHovered)

  return (
    <div 
      className="react-user-dropdown" 
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button 
        className="react-user-dropdown-trigger"
        onClick={handleClick}
      >
        <div className="react-user-avatar">
        <img src={user?.profile_image || 'https://www.karmleela.com/uploads/setting/62096.png'} alt="User" />
        </div>
        <span className="react-user-name">{user?.name || 'User'}</span>
        <i className={`fas fa-chevron-down react-dropdown-arrow ${shouldShowDropdown ? 'open' : ''}`}></i>
      </button>

      {shouldShowDropdown && (
        <div 
          className={`react-user-dropdown-menu ${shouldShowDropdown ? 'show' : ''}`}
          onMouseEnter={() => {
            if (!isMobile) {
              setIsHovered(true)
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
              }
            }
          }}
          onMouseLeave={() => {
            if (!isMobile) {
              setIsHovered(false)
              timeoutRef.current = setTimeout(() => {
                setIsOpen(false)
              }, 300)
            }
          }}
        >
          <div className="react-user-dropdown-header">
            <div className="react-user-info">
              <div className="react-user-avatar-large">
                {/* <i className="fas fa-user"></i> */}
                <img src={user?.profile_image || 'https://www.karmleela.com/uploads/setting/62096.png'} alt="User" />
              </div>
              <div className="react-user-details">
                <div className="react-user-name-large">{user?.name || 'User'}</div>
                <div className="react-user-email">{user?.mobile || 'Mobile'}</div>
              </div>
            </div>
          </div>
          
     
          
          <div className="react-user-dropdown-items">
            <Link to="/customer-dashboard" className='react-hoveR-none'>
            <button className="react-user-dropdown-item" onClick={handleMyAccount}>
              <i className="fas fa-user-circle"></i>
              <span>My Account</span>   

              
            </button>
            </Link>
            
        
            
            {/* <div className="react-user-dropdown-divider"></div> */}
            
            <button className="react-user-dropdown-item react-logout" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i>
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserDropdown
