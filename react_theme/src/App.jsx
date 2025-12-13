import React from 'react'
import { BrowserRouter, Routes, Route,} from 'react-router-dom'
import Website from './Website'
import TalkToAstrologers from './pages/TalkToAstrologers'
import Services from './pages/Services'
import FreeKundali from './pages/FreeKundali'
import Matching from './pages/Matching'
import Shop from './pages/Shop'
import Blogs from './pages/Blogs'
import Contact from './pages/Contact'
import InnerAstrologer from './pages/InnerAstrologer'
import InnerService from './pages/InnerService'
import VendorRegistration from './pages/VendorRegistration'
import ScrollToTop from './components/ScrollToTop'
import My_Account from './pages/Customer_Dashboard'
import InnerBlog from './pages/InnerBlog'
import Vendor_Dashboard from './pages/Vendor_Dashboard'
import Notices from './pages/Notices'
import Offers from './pages/Offers'
import PdfBooks from './pages/PdfBooks'
import AskQuestions from './pages/AskQuestions'
import Appointments from './pages/Appointments'
import ArchitectRooms from './pages/ArchitectRooms'
import ArchitectServiceOrders from './pages/ArchitectServiceOrders'
import AstrologerCategories from './pages/AstrologerCategories'
import AstrologerDiscounts from './pages/AstrologerDiscounts'

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
        <Route path="/service/:id" element={<InnerService />} />
        <Route path="/vendor-registration" element={<VendorRegistration />} />
        <Route path="/customer-dashboard" element={<My_Account />} />
        <Route path="/blog/:id" element={<InnerBlog />} />
        <Route path="/vendor-dashboard" element={<Vendor_Dashboard />} />
        <Route path="/notices" element={<Notices />} />
        <Route path="/offers" element={<Offers />} />
        <Route path="/pdf-books" element={<PdfBooks />} />
        <Route path="/ask-questions" element={<AskQuestions />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/architect-rooms" element={<ArchitectRooms />} />
        <Route path="/architect-service-orders" element={<ArchitectServiceOrders />} />
        <Route path="/astrologer-categories" element={<AstrologerCategories />} />
        <Route path="/astrologer-discounts" element={<AstrologerDiscounts />} />
        
      </Routes>
    </BrowserRouter>
  )
}

export default App