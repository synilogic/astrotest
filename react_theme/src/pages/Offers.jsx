import React, { useEffect, useState } from 'react'
import { fetchOffers } from '../utils/api'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const Offers = () => {
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadOffers()
  }, [])

  const loadOffers = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchOffers({ status: 1, offset: 0 })
      if (result.status === 1 && Array.isArray(result.data)) {
        setOffers(result.data)
      } else {
        setError(result.msg || 'Failed to load offers')
      }
    } catch (error) {
      console.error('Error loading offers:', error)
      setError('An error occurred while loading offers')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8" style={{ minHeight: '60vh' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">🎁 Special Offers</h1>
            <p className="text-gray-600">Grab amazing deals and discounts on our services</p>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="mt-4 text-gray-600">Loading offers...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600">{error}</p>
              <button 
                onClick={loadOffers}
                className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Try Again
              </button>
            </div>
          ) : offers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offers.map((offer, index) => (
                <div 
                  key={offer.id || index} 
                  className="relative bg-gradient-to-br from-purple-500 via-purple-600 to-pink-500 text-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden"
                >
                  {/* Decorative circles */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
                  
                  <div className="relative p-6 z-10">
                    {/* Offer Badge */}
                    {offer.discount && (
                      <div className="absolute top-4 right-4 bg-yellow-400 text-purple-900 font-bold px-3 py-1 rounded-full text-sm shadow-md">
                        {offer.discount}% OFF
                      </div>
                    )}
                    
                    <div className="mb-4">
                      <i className="fas fa-gift text-4xl mb-3 opacity-90"></i>
                      <h3 className="text-2xl font-bold mb-2">
                        {offer.title || offer.offer_title || 'Special Offer'}
                      </h3>
                    </div>
                    
                    <p className="text-white text-opacity-90 mb-6 leading-relaxed">
                      {offer.description || offer.offer_description || 'Limited time offer - Don\'t miss out!'}
                    </p>
                    
                    {offer.discount && (
                      <div className="text-center mb-6">
                        <div className="text-5xl font-bold mb-1">{offer.discount}%</div>
                        <div className="text-sm uppercase tracking-wider opacity-90">Discount</div>
                      </div>
                    )}
                    
                    {offer.code && (
                      <div className="bg-white bg-opacity-20 rounded-lg p-3 mb-4 text-center">
                        <p className="text-xs uppercase tracking-wider mb-1 opacity-80">Coupon Code</p>
                        <p className="text-lg font-bold tracking-widest">{offer.code}</p>
                      </div>
                    )}
                    
                    <button className="w-full bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-300 shadow-md">
                      <i className="fas fa-tag mr-2"></i>
                      Claim Now
                    </button>
                    
                    {offer.valid_till && (
                      <p className="text-center text-xs mt-3 opacity-75">
                        <i className="far fa-clock mr-1"></i>
                        Valid till {new Date(offer.valid_till).toLocaleDateString('en-IN')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-12 text-center">
              <i className="fas fa-tags text-6xl text-gray-300 mb-4"></i>
              <p className="text-xl text-gray-500">No active offers at the moment</p>
              <p className="text-gray-400 mt-2">Check back soon for exciting deals!</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}

export default Offers

