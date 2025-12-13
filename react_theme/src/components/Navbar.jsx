import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import LoginPopup from './LoginPopup'
import UserDropdown from './UserDropdown'
import NotificationBell from './NotificationBell'
import useLocalAuth from '../hooks/useLocalAuth'
import { fetchServiceCategories } from '../utils/api'

const Navbar = () => {
  const [isLoginPopupOpen, setIsLoginPopupOpen] = useState(false)
  const { user } = useLocalAuth()
  const [serviceCategories, setServiceCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  const handleLoginClick = (e) => {
    e.preventDefault()
    setIsLoginPopupOpen(true)
  }

  const handleCloseLoginPopup = () => {
    setIsLoginPopupOpen(false)
  }

  // Fetch service categories from backend
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesRes = await fetchServiceCategories({
          offset: 0,
          search: ''
        })
        
        if (categoriesRes && categoriesRes.status === 1 && Array.isArray(categoriesRes.data)) {
          // Show all categories in navbar (or limit to 10 for better UX)
          setServiceCategories(categoriesRes.data.slice(0, 10))
          console.log('[Navbar] Service categories loaded:', categoriesRes.data.length)
        } else {
          console.warn('[Navbar] Service categories failed:', categoriesRes)
          setServiceCategories([])
        }
      } catch (error) {
        setServiceCategories([])
      } finally {
        setCategoriesLoading(false)
      }
    }

    loadCategories()
  }, [])

  useEffect(() => {
    const hamburger = document.querySelector('.react-hamburger')
    const navLinks = document.querySelector('.react-nav-links')
    const navbar = document.querySelector('.react-navbar-own')

    if (!hamburger || !navLinks || !navbar) return

    const onHamburgerClick = (e) => {
      e.stopPropagation()
      navLinks.classList.toggle('active')
      document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : ''
    }

    const onDocClick = (e) => {
      if (
        navLinks.classList.contains('active') &&
        !navLinks.contains(e.target) &&
        !hamburger.contains(e.target)
      ) {
        navLinks.classList.remove('active')
        document.body.style.overflow = ''
      }
      document.querySelectorAll('.react-custom-dropdown.active').forEach((dropdown) => {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove('active')
        }
      })
    }

    const onDropdownTrigger = (e) => {
      e.preventDefault()
      const parent = e.currentTarget.closest('.react-custom-dropdown')
      if (parent) parent.classList.toggle('active')
    }

    const onScroll = () => {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled')
      } else {
        navbar.classList.remove('scrolled')
      }
    }

    hamburger.addEventListener('click', onHamburgerClick)
    document.addEventListener('click', onDocClick)
    window.addEventListener('scroll', onScroll)
    const dropdownTriggers = Array.from(document.querySelectorAll('.react-custom-dropdown > a'))
    dropdownTriggers.forEach((el) => el.addEventListener('click', onDropdownTrigger))

    return () => {
      hamburger.removeEventListener('click', onHamburgerClick)
      document.removeEventListener('click', onDocClick)
      window.removeEventListener('scroll', onScroll)
      dropdownTriggers.forEach((el) => el.removeEventListener('click', onDropdownTrigger))
    }
  }, [])
  return (
    <>
      <div className="react-custom-announcement-bar">
        <div className="react-custom-left-contact">
          <div className="react-custom-contact-item">
            <i className="fas fa-envelope"></i>
            <a href="#" target="_blank" rel="noreferrer">contact@example.com</a>
          </div>
          <div className="react-custom-contact-item">
            <i className="fas fa-phone"></i>
            <a href="#" target="_blank" rel="noreferrer">+917864598545</a>
          </div>
        </div>
        <div className="react-custom-right-info">
          <div className="react-custom-contact-item">
            <i className="fas fa-map-marker-alt"></i>
            <a href="#" target="_blank" rel="noreferrer">C-7, Santosh Nagar -I, Borkhera, Kota</a>
          </div>
          <div className="react-custom-social-icons">
            <a href="#" target="_blank" title="Facebook" rel="noreferrer"><i className="fab fa-facebook"></i></a>
            <a href="#" target="_blank" title="Twitter" rel="noreferrer"><i className="fa-brands fa-x-twitter"></i></a>
            <a href="#" target="_blank" title="Instagram" rel="noreferrer"><i className="fab fa-instagram"></i></a>
            <a href="#" target="_blank" title="LinkedIn" rel="noreferrer"><i className="fab fa-linkedin-in"></i></a>
          </div>
        </div>
      </div>

      <nav className="react-navbar-own">
        <div className="react-container-navbar">
          <Link to="/" className="react-logo">
            <img src="https://www.karmleela.com/uploads/setting/62096.png" alt="Logo" />
          </Link>
          <div className="react-hamburger">☰</div>
          <ul className="react-nav-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/talk-to-astrologers">Talk To Astrologer</Link></li>
            <li className="react-custom-dropdown">
              <a>Services <span> <i className="fa-solid fa-chevron-down react-dropdown-Icon"></i></span></a>
              <ul className="react-custom-dropdown-menu">
                {categoriesLoading ? (
                  <li><span style={{padding: '10px', display: 'block'}}>Loading...</span></li>
                ) : serviceCategories.length > 0 ? (
                  <>
                    {serviceCategories.map((category) => (
                      <li key={category.id}>
                        <Link to={`/services?category=${encodeURIComponent(category.id || category.title || category.category_title || '')}`}>
                          {category.title || category.category_title || 'Category'}
                        </Link>
                      </li>
                    ))}
                    <li style={{borderTop: '1px solid #eee', marginTop: '5px', paddingTop: '5px'}}>
                      <Link to="/services" style={{fontWeight: 'bold'}}>View All Services</Link>
                    </li>
                  </>
                ) : (
                  <li><Link to="/services">View All Services</Link></li>
                )}
              </ul>
            </li>
            <li className="react-custom-dropdown">
              <a>Kundli <span> <i className="fa-solid fa-chevron-down react-dropdown-Icon"></i></span></a>
              <ul className="react-custom-dropdown-menu">
                <li><Link to="/free-kundali">Free Kundli</Link></li>
                <li><Link to="/matching">Kundli Matching</Link></li>
              </ul>
            </li>
            <li><Link to="/shop">Shop</Link></li>
            <li><Link to="/blogs">Blogs</Link></li>
            <li className="react-custom-dropdown">
              <a>More <span> <i className="fa-solid fa-chevron-down react-dropdown-Icon"></i></span></a>
              <ul className="react-custom-dropdown-menu">
                <li><Link to="/notices">📢 Notices</Link></li>
                <li><Link to="/offers">🎁 Offers</Link></li>
                <li><Link to="/pdf-books">📚 PDF Books</Link></li>
              </ul>
            </li>
            {user && (
              <li style={{ display: 'flex', alignItems: 'center' }}>
                <NotificationBell />
              </li>
            )}
            <li>
              {user ? (
                <UserDropdown />
              ) : (
                <a href="#contact" className="react-nav-btn" onClick={handleLoginClick}>Login</a>
              )}
            </li>
          </ul>
        </div>
      </nav>
      
      <LoginPopup 
        isOpen={isLoginPopupOpen} 
        onClose={handleCloseLoginPopup} 
      />
    </>
  )
}

export default Navbar