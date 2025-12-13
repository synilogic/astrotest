import React, { useEffect, useState } from 'react'
import { fetchNotices } from '../utils/api'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const Notices = () => {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadNotices()
  }, [])

  const loadNotices = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchNotices({ status: 1, offset: 0 })
      if (result.status === 1 && Array.isArray(result.data)) {
        setNotices(result.data)
      } else {
        setError(result.msg || 'Failed to load notices')
      }
    } catch (error) {
      console.error('Error loading notices:', error)
      setError('An error occurred while loading notices')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8" style={{ minHeight: '60vh' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">📢 Notices & Announcements</h1>
            <p className="text-gray-600">Stay updated with our latest news and announcements</p>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="mt-4 text-gray-600">Loading notices...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600">{error}</p>
              <button 
                onClick={loadNotices}
                className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Try Again
              </button>
            </div>
          ) : notices.length > 0 ? (
            <div className="space-y-4">
              {notices.map((notice, index) => (
                <div 
                  key={notice.id || index} 
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-200"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                          {notice.title || notice.notice_title || 'Untitled Notice'}
                        </h3>
                        <p className="text-gray-600 mb-4 leading-relaxed">
                          {notice.description || notice.notice_description || 'No description available'}
                        </p>
                      </div>
                      <span className="ml-4 px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full whitespace-nowrap">
                        New
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-500">
                        <i className="far fa-calendar-alt mr-2"></i>
                        {notice.created_at ? new Date(notice.created_at).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'Date not available'}
                      </p>
                      {notice.priority && (
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          notice.priority === 'high' ? 'bg-red-100 text-red-700' :
                          notice.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {notice.priority.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-12 text-center">
              <i className="fas fa-bell-slash text-6xl text-gray-300 mb-4"></i>
              <p className="text-xl text-gray-500">No notices available at the moment</p>
              <p className="text-gray-400 mt-2">Check back later for updates</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}

export default Notices

