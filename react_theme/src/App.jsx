import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Website from './Website'
import TalkToAstrologers from './pages/TalkToAstrologers'
import Services from './pages/Services'
import FreeKundali from './pages/FreeKundali'
import Matching from './pages/Matching'
import Shop from './pages/Shop'
import Blogs from './pages/Blogs'
import Contact from './pages/Contact'
import InnerAstrologer from './pages/InnerAstrologer'
import VendorRegistration from './pages/VendorRegistration'
import ScrollToTop from './components/ScrollToTop'
import My_Account from './pages/Customer_Dashboard'
import InnerBlog from './pages/InnerBlog'
import Vendor_Dashboard from './pages/Vendor_Dashboard'

const App = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Website />} />
        <Route path="/talk-to-astrologers" element={<TalkToAstrologers />} />
        <Route path="/services" element={<Services />} />
        <Route path="/free-kundali" element={<FreeKundali />} />
        <Route path="/matching" element={<Matching />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/astrologer" element={<InnerAstrologer />} />
        <Route path="/vendor-registration" element={<VendorRegistration />} />
        <Route path="/customer-dashboard" element={<My_Account />} />
        <Route path="/`blogInner`" element={<InnerBlog />} />
        <Route path="/vendor-dashboard" element={<Vendor_Dashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App