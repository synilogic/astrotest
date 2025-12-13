import React, { useEffect, useState } from 'react'
import { fetchPdfBooks, fetchPdfBookCategories, calculatePdfBookPrice, purchasePdfBook, fetchMyPdfBooks } from '../utils/api'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const PdfBooks = () => {
  const [books, setBooks] = useState([])
  const [categories, setCategories] = useState([])
  const [myBooks, setMyBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all') // 'all' or 'my-books'
  const [selectedCategory, setSelectedCategory] = useState('')
  const [purchasing, setPurchasing] = useState(null)

  useEffect(() => {
    loadCategories()
    loadBooks()
  }, [])

  useEffect(() => {
    if (activeTab === 'my-books') {
      loadMyBooks()
    }
  }, [activeTab])

  const loadCategories = async () => {
    try {
      const result = await fetchPdfBookCategories({ status: 1 })
      if (result.status === 1 && Array.isArray(result.data)) {
        setCategories(result.data)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadBooks = async (categoryId = '') => {
    setLoading(true)
    try {
      const result = await fetchPdfBooks({ 
        status: 1, 
        category_id: categoryId,
        offset: 0 
      })
      if (result.status === 1 && Array.isArray(result.data)) {
        setBooks(result.data)
      } else {
        setBooks([])
      }
    } catch (error) {
      console.error('Error loading books:', error)
      setBooks([])
    } finally {
      setLoading(false)
    }
  }

  const loadMyBooks = async () => {
    setLoading(true)
    try {
      const result = await fetchMyPdfBooks(0)
      if (result.status === 1 && Array.isArray(result.data)) {
        setMyBooks(result.data)
      } else {
        setMyBooks([])
      }
    } catch (error) {
      console.error('Error loading my books:', error)
      setMyBooks([])
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId)
    loadBooks(categoryId)
  }

  const handlePurchase = async (bookId) => {
    setPurchasing(bookId)
    try {
      // First calculate price
      const calcResult = await calculatePdfBookPrice(bookId)
      if (calcResult.status !== 1) {
        alert(calcResult.msg || 'Failed to calculate price')
        setPurchasing(null)
        return
      }

      // Confirm purchase
      const confirmed = window.confirm(`Purchase this book for ₹${calcResult.data?.total_amount || 0}?`)
      if (!confirmed) {
        setPurchasing(null)
        return
      }

      // Purchase
      const purchaseResult = await purchasePdfBook({
        pdf_book_id: bookId,
        payment_method: 'wallet'
      })

      if (purchaseResult.status === 1) {
        alert('Book purchased successfully!')
        loadMyBooks()
        setActiveTab('my-books')
      } else {
        alert(purchaseResult.msg || 'Purchase failed')
      }
    } catch (error) {
      console.error('Error purchasing book:', error)
      alert('An error occurred during purchase')
    } finally {
      setPurchasing(null)
    }
  }

  const displayBooks = activeTab === 'all' ? books : myBooks

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8" style={{ minHeight: '60vh' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">📚 PDF Books Library</h1>
            <p className="text-gray-600">Explore our collection of spiritual and astrological books</p>
          </div>

          {/* Tabs */}
          <div className="flex justify-center mb-6 space-x-4">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                activeTab === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Books
            </button>
            <button
              onClick={() => setActiveTab('my-books')}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                activeTab === 'my-books'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              My Books
            </button>
          </div>

          {/* Category Filter (only for All Books) */}
          {activeTab === 'all' && categories.length > 0 && (
            <div className="mb-6 flex justify-center">
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.category_name || cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Books Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="mt-4 text-gray-600">Loading books...</p>
            </div>
          ) : displayBooks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayBooks.map((book) => (
                <div
                  key={book.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden"
                >
                  <div className="h-48 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                    {book.book_image ? (
                      <img
                        src={book.book_image}
                        alt={book.book_name || book.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <i className="fas fa-book text-white text-6xl"></i>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                      {book.book_name || book.title || 'Untitled Book'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {book.description || 'No description available'}
                    </p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-purple-600">
                        ₹{book.price || book.amount || 0}
                      </span>
                      {book.pages && (
                        <span className="text-sm text-gray-500">
                          {book.pages} pages
                        </span>
                      )}
                    </div>
                    {activeTab === 'all' ? (
                      <button
                        onClick={() => handlePurchase(book.id)}
                        disabled={purchasing === book.id}
                        className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {purchasing === book.id ? (
                          <>
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            Purchasing...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-shopping-cart mr-2"></i>
                            Purchase
                          </>
                        )}
                      </button>
                    ) : (
                      <button className="w-full bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition">
                        <i className="fas fa-download mr-2"></i>
                        Download
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-12 text-center">
              <i className="fas fa-book-open text-6xl text-gray-300 mb-4"></i>
              <p className="text-xl text-gray-500">
                {activeTab === 'all' ? 'No books available' : 'You haven\'t purchased any books yet'}
              </p>
              {activeTab === 'my-books' && (
                <button
                  onClick={() => setActiveTab('all')}
                  className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  Browse Books
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}

export default PdfBooks

