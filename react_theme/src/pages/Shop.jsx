import React, { useEffect } from 'react'
import usePageTitle from '../hooks/usePageTitle'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const Shop = () => {
  usePageTitle('Shop - Astrology Theme')
  
  useEffect(() => {
    const overlay = document.getElementById('cusTom-popupOverlay')
    const closeBtn = document.getElementById('cusTom-closeModal')
    const openBtns = Array.from(document.querySelectorAll('#cusTom-openModal'))

    if (!overlay || !closeBtn) return

    const openPopup = () => {
      overlay.style.display = 'flex'
      requestAnimationFrame(() => {
        overlay.classList.add('react-cusTom-show')
      })
    }

    const closePopup = () => {
      overlay.classList.remove('react-cusTom-show')
      setTimeout(() => {
        overlay.style.display = 'none'
      }, 200)
    }

    openBtns.forEach((btn) => btn.addEventListener('click', openPopup))
    closeBtn.addEventListener('click', closePopup)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closePopup()
    })
    const onKey = (e) => {
      if (e.key === 'Escape') closePopup()
    }
    document.addEventListener('keydown', onKey)

    return () => {
      openBtns.forEach((btn) => btn.removeEventListener('click', openPopup))
      closeBtn.removeEventListener('click', closePopup)
      overlay.removeEventListener('click', closePopup)
      document.removeEventListener('keydown', onKey)
    }
  }, [])
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
          <h1 className="react-new-bread-hero-title">Our Products</h1>
          <div className="react-new-bread-breadcrumbs">
            <a href="#">Home</a>
            <span className="react-new-bread-breadcrumb-separator">/</span>
            <span>Our Products</span>
          </div>
        </div>
      </section>

      <section>
        <div className="container">
          <div className="react-shop-container">
            <aside className="react-shop-sidebar">
              <div className="react-shop-search-section">
                <div className="react-shop-search-container">
                  <input type="text" placeholder="Search products..." className="react-shop-search-input" />
                  <button className="react-shop-search-btn">
                    <i className="fas fa-search"></i>
                  </button>
                </div>
              </div>
              <div className="react-shop-filter-section" style={{borderBottom: '1px solid #ddd', paddingBottom: '10px'}}>
                <h3 className="react-shop-filter-title"><i className="fa-solid fa-wallet react-shop-Icon"></i> Price</h3>
                <div className="react-shop-filter-options">
                  <label className="react-shop-filter-option">
                    <input type="radio" name="price" value="under-50" />
                    <span className="react-shop-checkmark"></span>
                    Under ₹50
                  </label>
                  <label className="react-shop-filter-option">
                    <input type="radio" name="price" value="50-100" />
                    <span className="react-shop-checkmark"></span>
                    ₹50 to ₹100
                  </label>
                  <label className="react-shop-filter-option">
                    <input type="radio" name="price" value="150-250" />
                    <span className="react-shop-checkmark"></span>
                    ₹150 to ₹250
                  </label>
                  <label className="react-shop-filter-option">
                    <input type="radio" name="price" value="all" defaultChecked />
                    <span className="react-shop-checkmark"></span>
                    All
                  </label>
                </div>
              </div>
              <div className="react-shop-filter-section">
                <h3 className="react-shop-filter-title"><i className="fas fa-newspaper react-shop-Icon"></i> Top Categories</h3>
                <div className="react-shop-filter-options">
                  <label className="react-shop-filter-option">
                    <input type="checkbox" name="category" value="worship-material" />
                    <span className="react-shop-checkbox"></span>
                    Worship Material
                  </label>
                  <label className="react-shop-filter-option">
                    <input type="checkbox" name="category" value="rudraksh" />
                    <span className="react-shop-checkbox"></span>
                    Rudraksh
                  </label>
                  <label className="react-shop-filter-option">
                    <input type="checkbox" name="category" value="gems" />
                    <span className="react-shop-checkbox"></span>
                    Gems
                  </label>
                  <label className="react-shop-filter-option">
                    <input type="checkbox" name="category" value="books" />
                    <span className="react-shop-checkbox"></span>
                    Books
                  </label>
                </div>
              </div>
              <button className="react-shop-reset-btn">
                <i className="fas fa-undo"></i>
                RESET
              </button>
            </aside>

            <main className="react-shop-products-section">
              <h3 className="react-shop-filter-title" style={{fontSize: '26px'}}> <i className="fas fa-store react-shop-Icon" style={{marginRight: '10px'}}></i>Products</h3>
              <div className="react-shop-products-grid">
                <div className="react-shop-product-card">
                  <div className="react-shop-product-image">
                    <img src="https://astrogyanvi.com/uploads/product/1738044494-product_image.png" alt="Sri Panchmukhi Hanuman Raksha Kavach" />
                  </div>
                  <div className="react-shop-product-info">
                    <h4 className="react-shop-product-title">Sri Panchmukhi Hanuman</h4>
                    <div className="react-shop-product-price">₹2520</div>
                    <button className="react-shop-buy-now-btn" id="cusTom-openModal">Buy Now</button>
                  </div>
                </div>
                <div className="react-shop-product-card">
                  <div className="react-shop-product-image">
                    <img src="https://astrogyanvi.com/uploads/product/1738044792-product_image.png" alt="Shree Raksha Kavach" />
                  </div>
                  <div className="react-shop-product-info">
                    <h4 className="react-shop-product-title">Shree Raksha Kavach</h4>
                    <div className="react-shop-product-price">₹999</div>
                    <button className="react-shop-buy-now-btn">Buy Now</button>
                  </div>
                </div>
                <div className="react-shop-product-card">
                  <div className="react-shop-product-image">
                    <img src="https://astrogyanvi.com/uploads/product/1738128642-product_image.jpg" alt="Red Coral Gemstone" />
                  </div>
                  <div className="react-shop-product-info">
                    <h4 className="react-shop-product-title">Premium Red Coral</h4>
                    <div className="react-shop-product-price">₹1700</div>
                    <button className="react-shop-buy-now-btn">Buy Now</button>
                  </div>
                </div>
                <div className="react-shop-product-card">
                  <div className="react-shop-product-image">
                    <img src="https://astrogyanvi.com/uploads/product/1738340826-product_image.jpg" alt="Business Growth Yantra" />
                  </div>
                  <div className="react-shop-product-info">
                    <h4 className="react-shop-product-title">Business Growth</h4>
                    <div className="react-shop-product-price">₹1100</div>
                    <button className="react-shop-buy-now-btn">Buy Now</button>
                  </div>
                </div>
                <div className="react-shop-product-card">
                  <div className="react-shop-product-image">
                    <img src="https://astrogyanvi.com/uploads/product/1738343728-product_image.jpg" alt="Vastu Dosh Nashak Yantra" />
                  </div>
                  <div className="react-shop-product-info">
                    <h4 className="react-shop-product-title">Vastu Dosh Nashak Yantra</h4>
                    <div className="react-shop-product-price">₹2100</div>
                    <button className="react-shop-buy-now-btn">Buy Now</button>
                  </div>
                </div>
                <div className="react-shop-product-card">
                  <div className="react-shop-product-image">
                    <img src="https://astrogyanvi.com/uploads/product/1740760662-product_image.jpg" alt="1 Mukhi Rudraksh" />
                  </div>
                  <div className="react-shop-product-info">
                    <h4 className="react-shop-product-title">1 Mukhi Rudraksh</h4>
                    <div className="react-shop-product-price">₹11000</div>
                    <button className="react-shop-buy-now-btn">Buy Now</button>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </section>

      <div className="react-cusTom-overlay" id="cusTom-popupOverlay" style={{display: 'none'}}>
        <div className="react-cusTom-popup">
          <button className="react-cusTom-closeBtn" id="cusTom-closeModal"><i className="fa-solid fa-xmark"></i></button>
          <div className="react-astro-popup-content">
            <div className="react-astro-app-icon"><img src="https://www.karmleela.com/uploads/setting/62096.png" alt="" /></div>
            <p>Please download the Karmleela (Under Charveesh Enterprises) app to connect with an astrologer.</p>
            <a href="#" className="react-astro-playstore-btn" id="astro-playstoreBtn">
              <img src="https://jyotishaguru.com/front_theme/syniastropro/images/store2.png" alt="" />
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default Shop


