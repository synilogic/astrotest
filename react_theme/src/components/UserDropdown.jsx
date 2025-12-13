import React, { useState, useEffect, useRef } from 'react'
import useLocalAuth from '../hooks/useLocalAuth'
import { Link } from 'react-router-dom'
import { getCustomerDashboard, getCurrentUser } from '../utils/api'

// Helper to check if image URL is the static default
const isStaticDefaultImage = (url) => {
  if (!url || typeof url !== 'string') return true // Treat null/undefined as static
  const lowerUrl = url.toLowerCase().trim()
  // Check for various static image patterns from backend
  // Only reject if it's clearly a static default, not if it contains "customer" in a valid path
  return lowerUrl === '' ||
         lowerUrl === 'null' ||
         lowerUrl === 'undefined' ||
         lowerUrl.startsWith('data:image/svg') || // SVG fallback images
         (lowerUrl.includes('62096.png') && !lowerUrl.includes('uploads/customers')) || // Only reject if not in customers folder
         (lowerUrl.includes('karmleela.com/uploads/setting') && !lowerUrl.includes('uploads/customers')) ||
         (lowerUrl.includes('karmleela.com/assets/img/customer.png')) ||
         (lowerUrl.includes('customer.png') && !lowerUrl.includes('uploads/customers')) || // Allow if in customers folder
         (lowerUrl.includes('astro.synilogictech.com/uploads/offlne_service_category/1724738665-image.jpeg'))
}

// Helper function to normalize image URL path (fix singular/plural mismatch)
const normalizeImagePath = (url) => {
  if (!url) return url
  
  // Fix path mismatch: /uploads/customer/ -> /uploads/customers/
  // Backend sometimes returns singular but files are stored in plural directory
  if (url.includes('/uploads/customer/') && !url.includes('/uploads/customers/')) {
    const normalized = url.replace('/uploads/customer/', '/uploads/customers/')
    console.log('[UserDropdown] 🔧 Normalized image path:', { original: url, normalized })
    return normalized
  }
  
  return url
}

const UserDropdown = () => {
  const { user, logout } = useLocalAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [customerProfile, setCustomerProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
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

  // Fetch customer profile from backend
  useEffect(() => {
    const loadCustomerProfile = async () => {
      const currentUser = getCurrentUser()
      if (!currentUser) return

      // Handle multiple field name variations (user_uni_id vs customer_uni_id)
      const userId = currentUser?.user_uni_id || currentUser?.customer_uni_id || ''
      
      if (!userId) {
        console.warn('[UserDropdown] User ID not found, cannot fetch profile')
        return
      }

      setLoadingProfile(true)
      try {
        const result = await getCustomerDashboard(userId)
        console.log('[UserDropdown] getCustomerDashboard full response:', result)
        if (result.status === 1) {
          // Check if customer_profile exists
          if (result.data?.customer_profile) {
            const profile = result.data.customer_profile
            console.log('[UserDropdown] Customer profile loaded:', {
              hasCustomerImg: !!profile.customer_img,
              customerImg: profile.customer_img,
              isStatic: isStaticDefaultImage(profile.customer_img),
              name: profile.name,
              email: profile.email,
              allKeys: Object.keys(profile)
            })
            setCustomerProfile(profile)
          } else if (result.data?.customer_img) {
            // If customer_profile doesn't exist but customer_img is at root level
            console.log('[UserDropdown] Customer img at root level:', {
              customerImg: result.data.customer_img,
              isStatic: isStaticDefaultImage(result.data.customer_img)
            })
            setCustomerProfile({
              customer_img: result.data.customer_img,
              name: result.data.name,
              email: result.data.email
            })
          } else {
            console.warn('[UserDropdown] No customer_profile or customer_img in response. Full data:', result.data)
          }
        } else {
          console.warn('[UserDropdown] Failed to fetch customer profile:', result.msg)
        }
      } catch (error) {
        console.error('[UserDropdown] Error fetching customer profile:', error)
      } finally {
        setLoadingProfile(false)
      }
    }

    if (user) {
      loadCustomerProfile()
    } else {
      // If no user, try to get from localStorage
      const storedUser = getCurrentUser()
      if (storedUser) {
        loadCustomerProfile()
      }
    }
  }, [user])
  
  // Also refresh when localStorage changes
  useEffect(() => {
    const checkLocalStorage = () => {
      const storedUser = getCurrentUser()
      if (storedUser && (storedUser.user_uni_id || storedUser.customer_uni_id)) {
        const userId = storedUser.user_uni_id || storedUser.customer_uni_id
        // Only refresh if we don't have customerProfile or if image changed
        if (!customerProfile || (storedUser.customer_img && storedUser.customer_img !== customerProfile.customer_img)) {
          getCustomerDashboard(userId).then(result => {
            if (result.status === 1 && result.data?.customer_profile) {
              setCustomerProfile(result.data.customer_profile)
              console.log('[UserDropdown] Profile refreshed from localStorage check')
            }
          }).catch(error => {
            console.error('[UserDropdown] Error refreshing from localStorage:', error)
          })
        }
      }
    }
    
    // Check immediately
    checkLocalStorage()
    
    // Check periodically (every 5 seconds)
    const interval = setInterval(checkLocalStorage, 5000)
    
    return () => clearInterval(interval)
  }, [customerProfile])

  // Listen to localStorage changes to refresh profile when updated
  useEffect(() => {
    const handleStorageChange = (e) => {
      // Check if 'user' key was updated
      if (e.key === 'user' && e.newValue) {
        try {
          const updatedUser = JSON.parse(e.newValue)
          // Refresh profile data if user data changed
          if (updatedUser && (updatedUser.user_uni_id || updatedUser.customer_uni_id)) {
            const userId = updatedUser.user_uni_id || updatedUser.customer_uni_id
            // Refresh profile from backend
            getCustomerDashboard(userId).then(result => {
              if (result.status === 1 && result.data?.customer_profile) {
                setCustomerProfile(result.data.customer_profile)
                console.log('[UserDropdown] Profile refreshed after localStorage update')
              }
            }).catch(error => {
              console.error('[UserDropdown] Error refreshing profile:', error)
            })
          }
        } catch (error) {
          console.error('[UserDropdown] Error parsing updated user data:', error)
        }
      }
    }

    // Listen to storage events (for cross-tab updates)
    window.addEventListener('storage', handleStorageChange)
    
    // Also listen to custom event for same-tab updates
    const handleCustomStorageChange = () => {
      const currentUser = getCurrentUser()
      if (currentUser && (currentUser.user_uni_id || currentUser.customer_uni_id)) {
        const userId = currentUser.user_uni_id || currentUser.customer_uni_id
        getCustomerDashboard(userId).then(result => {
          if (result.status === 1 && result.data?.customer_profile) {
            setCustomerProfile(result.data.customer_profile)
            console.log('[UserDropdown] Profile refreshed after custom event')
          }
        }).catch(error => {
          console.error('[UserDropdown] Error refreshing profile:', error)
        })
      }
    }
    
    window.addEventListener('userProfileUpdated', handleCustomStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('userProfileUpdated', handleCustomStorageChange)
    }
  }, [])

  // Periodic refresh of profile data (every 30 seconds) to catch updates
  useEffect(() => {
    if (!user) return

    const refreshInterval = setInterval(() => {
      const currentUser = getCurrentUser()
      if (currentUser && (currentUser.user_uni_id || currentUser.customer_uni_id)) {
        const userId = currentUser.user_uni_id || currentUser.customer_uni_id
        getCustomerDashboard(userId).then(result => {
          if (result.status === 1 && result.data?.customer_profile) {
            setCustomerProfile(prev => {
              // Only update if image changed to avoid unnecessary re-renders
              const newImg = result.data.customer_profile.customer_img
              if (prev?.customer_img !== newImg) {
                console.log('[UserDropdown] Profile image updated via periodic refresh')
                return result.data.customer_profile
              }
              return prev
            })
          }
        }).catch(error => {
          console.error('[UserDropdown] Error in periodic profile refresh:', error)
        })
      }
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(refreshInterval)
  }, [user])

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

  // Helper function to construct full URL from relative path
  const constructImageUrl = (img) => {
    if (!img) return null
    
    // If it's already a full URL, return as-is
    if (img.startsWith('http://') || img.startsWith('https://')) {
      return img
    }
    
    // If it's a relative path, construct full URL
    if (img.startsWith('/') || img.startsWith('uploads/')) {
      const baseUrl = import.meta.env.VITE_USERS_API?.replace('/api', '') || 'http://localhost:8000'
      const fullUrl = img.startsWith('/') ? `${baseUrl}${img}` : `${baseUrl}/${img}`
      console.log('[UserDropdown] 🔧 Constructed full URL from relative path:', { original: img, fullUrl })
      return fullUrl
    }
    
    return img
  }

  // Use backend data with fallback to localStorage
  // Check for customer_img, vendor_image, and profile_image in multiple possible locations, excluding static default
  const displayImage = (() => {
    // Get fresh user data from localStorage
    const currentUser = getCurrentUser() || user
    
    // Helper function to process image
    const processImage = (img, source) => {
      if (!img) return null
      let processedImg = String(img).trim()
      // Normalize path (fix singular/plural mismatch)
      processedImg = normalizeImagePath(processedImg)
      // Skip if it's a static default
      if (!isStaticDefaultImage(processedImg)) {
        // Construct full URL if needed
        const finalUrl = constructImageUrl(processedImg)
        if (finalUrl) {
          console.log(`[UserDropdown] ✅ Using ${source}:`, finalUrl)
          return finalUrl
        }
      } else {
        console.log(`[UserDropdown] ⚠️ ${source} is static/default:`, processedImg)
      }
      return null
    }
    
    // Priority 1: Vendor image (for vendors) - check vendor_image in multiple locations
    // Check customerProfile.vendor?.vendor_image
    if (customerProfile?.vendor?.vendor_image) {
      const result = processImage(customerProfile.vendor.vendor_image, 'customerProfile.vendor.vendor_image')
      if (result) return result
    }
    
    // Check currentUser.vendor?.vendor_image
    if (currentUser?.vendor?.vendor_image) {
      const result = processImage(currentUser.vendor.vendor_image, 'currentUser.vendor.vendor_image')
      if (result) return result
    }
    
    // Check currentUser.vendor_image (direct field)
    if (currentUser?.vendor_image) {
      const result = processImage(currentUser.vendor_image, 'currentUser.vendor_image')
      if (result) return result
    }
    
    // Check user.vendor?.vendor_image
    if (user?.vendor?.vendor_image) {
      const result = processImage(user.vendor.vendor_image, 'user.vendor.vendor_image')
      if (result) return result
    }
    
    // Check user.vendor_image (direct field)
    if (user?.vendor_image) {
      const result = processImage(user.vendor_image, 'user.vendor_image')
      if (result) return result
    }
    
    // Priority 2: Backend customer profile (customer_img) - exclude static default
    if (customerProfile?.customer_img) {
      const result = processImage(customerProfile.customer_img, 'customerProfile.customer_img')
      if (result) return result
    }
    
    // Priority 3: Current user from localStorage (customer_img) - exclude static default
    if (currentUser?.customer_img) {
      const result = processImage(currentUser.customer_img, 'currentUser.customer_img')
      if (result) return result
    }
    
    // Priority 4: User from hook (customer_img) - exclude static default
    if (user?.customer_img) {
      const result = processImage(user.customer_img, 'user.customer_img')
      if (result) return result
    }
    
    // Priority 5: User from localStorage (profile_image) - exclude static default
    if (currentUser?.profile_image) {
      const result = processImage(currentUser.profile_image, 'currentUser.profile_image')
      if (result) return result
    }
    
    // Priority 6: User from hook (profile_image) - exclude static default
    if (user?.profile_image) {
      const result = processImage(user.profile_image, 'user.profile_image')
      if (result) return result
    }
    
    // Fallback: Static default image (only if no other image found)
    console.warn('[UserDropdown] ❌ Using fallback static image - no dynamic image found', {
      hasCustomerProfile: !!customerProfile,
      customerProfileImg: customerProfile?.customer_img,
      customerProfileVendorImage: customerProfile?.vendor?.vendor_image,
      currentUserCustomerImg: currentUser?.customer_img,
      currentUserVendorImage: currentUser?.vendor_image || currentUser?.vendor?.vendor_image,
      userCustomerImg: user?.customer_img,
      userVendorImage: user?.vendor_image || user?.vendor?.vendor_image,
      currentUserProfileImage: currentUser?.profile_image,
      userProfileImage: user?.profile_image,
      roleId: currentUser?.role_id || user?.role_id,
      userUniId: currentUser?.user_uni_id || user?.user_uni_id
    })
    return 'https://www.karmleela.com/uploads/setting/62096.png'
  })()
  
  // Debug log (only log if using static image to reduce console noise)
  if (isStaticDefaultImage(displayImage)) {
    const currentUser = getCurrentUser() || user
    console.warn('[UserDropdown] Using static image - debug info:', {
      displayImage,
      hasCustomerProfile: !!customerProfile,
      customerProfileImg: customerProfile?.customer_img,
      customerProfileVendorImage: customerProfile?.vendor?.vendor_image,
      isCustomerProfileStatic: customerProfile?.customer_img ? isStaticDefaultImage(customerProfile.customer_img) : 'N/A',
      currentUserCustomerImg: currentUser?.customer_img,
      currentUserVendorImage: currentUser?.vendor_image || currentUser?.vendor?.vendor_image,
      isCurrentUserVendorImageStatic: (currentUser?.vendor_image || currentUser?.vendor?.vendor_image) ? isStaticDefaultImage(currentUser?.vendor_image || currentUser?.vendor?.vendor_image) : 'N/A',
      userCustomerImg: user?.customer_img,
      userVendorImage: user?.vendor_image || user?.vendor?.vendor_image,
      isUserCustomerImgStatic: user?.customer_img ? isStaticDefaultImage(user.customer_img) : 'N/A',
      isUserVendorImageStatic: (user?.vendor_image || user?.vendor?.vendor_image) ? isStaticDefaultImage(user?.vendor_image || user?.vendor?.vendor_image) : 'N/A',
      userProfileImage: user?.profile_image,
      isUserProfileImageStatic: user?.profile_image ? isStaticDefaultImage(user.profile_image) : 'N/A',
      roleId: currentUser?.role_id || user?.role_id,
      userUniId: currentUser?.user_uni_id || user?.user_uni_id
    })
  }

  const displayName = customerProfile?.name || user?.name || 'User'
  const displayEmail = customerProfile?.email || user?.email || user?.mobile || 'Email'

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
          {loadingProfile ? (
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '20px', color: '#666' }}></i>
          ) : (
            <img 
              key={`user-avatar-${customerProfile?.customer_img || customerProfile?.vendor?.vendor_image || user?.customer_img || user?.vendor_image || user?.vendor?.vendor_image || 'default'}-${Date.now()}`}
              src={displayImage} 
              alt="User" 
              onError={(e) => {
                const failedSrc = e.target.src
                console.error('[UserDropdown] Image load error:', failedSrc)
                
                // If it's already the fallback, don't do anything
                if (failedSrc.includes('62096.png') || failedSrc.startsWith('data:image/svg')) {
                  return
                }
                
                // If it's an uploaded image (contains uploads/customers or uploads/vendor), try with cache-busting
                if (failedSrc.includes('uploads/customers') || failedSrc.includes('uploads/vendor') || failedSrc.includes('uploads/customer')) {
                  const separator = failedSrc.includes('?') ? '&' : '?'
                  const retryUrl = `${failedSrc}${separator}_t=${Date.now()}`
                  console.log('[UserDropdown] 🔄 Retrying uploaded image with cache-busting:', retryUrl)
                  e.target.src = retryUrl
                  return
                }
                
                // Only use static fallback if it's not an uploaded image
                if (!failedSrc.includes('uploads/customers') && !failedSrc.includes('uploads/customer') && !failedSrc.includes('uploads/vendor')) {
                  console.log('[UserDropdown] ⚠️ Using static fallback for non-uploaded image')
                  e.target.src = 'https://www.karmleela.com/uploads/setting/62096.png'
                }
              }}
              onLoad={() => {
                console.log('[UserDropdown] ✅ Image loaded successfully:', displayImage)
              }}
            />
          )}
        </div>
        <span className="react-user-name">{displayName}</span>
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
                {loadingProfile ? (
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: '32px', color: '#666' }}></i>
                ) : (
                  <img 
                    key={`user-avatar-large-${customerProfile?.customer_img || user?.customer_img || 'default'}-${Date.now()}`}
                    src={displayImage} 
                    alt="User" 
                    onError={(e) => {
                      const failedSrc = e.target.src
                      console.error('[UserDropdown] Large image load error:', failedSrc)
                      
                      // If it's already the fallback, don't do anything
                      if (failedSrc.includes('62096.png') || failedSrc.startsWith('data:image/svg')) {
                        return
                      }
                      
                      // If it's an uploaded image (contains uploads/customers), try with cache-busting
                      if (failedSrc.includes('uploads/customers')) {
                        const separator = failedSrc.includes('?') ? '&' : '?'
                        const retryUrl = `${failedSrc}${separator}_t=${Date.now()}`
                        console.log('[UserDropdown] 🔄 Retrying large uploaded image with cache-busting:', retryUrl)
                        e.target.src = retryUrl
                        return
                      }
                      
                      // Only use static fallback if it's not an uploaded image
                      if (!failedSrc.includes('uploads/customers') && !failedSrc.includes('uploads/customer')) {
                        console.log('[UserDropdown] ⚠️ Using static fallback for non-uploaded large image')
                        e.target.src = 'https://www.karmleela.com/uploads/setting/62096.png'
                      }
                    }}
                    onLoad={() => {
                      console.log('[UserDropdown] ✅ Large image loaded successfully:', displayImage)
                    }}
                  />
                )}
              </div>
              <div className="react-user-details">
                <div className="react-user-name-large">{displayName}</div>
                <div className="react-user-email">{displayEmail}</div>
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
