import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { fetchAskQuestionsList, getCurrentUser } from '../utils/api'
import usePageTitle from '../hooks/usePageTitle'

const AskQuestions = () => {
  usePageTitle('My Questions - Ask Astrologers')
  
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const user = getCurrentUser()
    if (!user || !user.api_key) {
      alert('Please login to view your questions')
      navigate('/customer-dashboard')
      return
    }

    loadQuestions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadQuestions = async (append = false) => {
    setLoading(true)
    try {
      const result = await fetchAskQuestionsList(append ? offset : 0)
      
      if (result.status === 1 && Array.isArray(result.data)) {
        const formattedQuestions = result.data.map((item) => ({
          id: item.id,
          orderId: item.order_id || `ASK-${item.id}`,
          question: item.question || 'N/A',
          answer: item.answer || 'Pending',
          answerStatus: item.answer_status || 0,
          status: item.status || 1,
          paymentStatus: item.payment_status || 0,
          amount: parseFloat(item.total_amount || 0),
          date: item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }) : 'N/A',
          astrologerName: item.astro_name || 'N/A',
          astrologerImg: item.astro_img || null
        }))

        if (append) {
          setQuestions(prev => [...prev, ...formattedQuestions])
        } else {
          setQuestions(formattedQuestions)
        }

        setOffset(result.offset || (offset + formattedQuestions.length))
        setHasMore(formattedQuestions.length >= 10)
      } else {
        if (!append) {
          setQuestions([])
        }
        setHasMore(false)
      }
    } catch (err) {
      console.error('Error loading questions:', err)
      if (!append) {
        setQuestions([])
      }
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMore = () => {
    loadQuestions(true)
  }

  return (
    <>
      <Navbar />
      
      <div className="react-page-section" style={{ padding: '80px 0' }}>
        <div className="container">
          <div className="react-section-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: '#2d3748', marginBottom: '1rem' }}>
              My Questions
            </h1>
            <p style={{ fontSize: '1.1rem', color: '#718096', maxWidth: '600px', margin: '0 auto' }}>
              View all your questions and answers from expert astrologers
            </p>
          </div>

          {loading && questions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#718096' }}>
              <div className="react-loading">Loading your questions...</div>
            </div>
          ) : questions.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem', 
              backgroundColor: '#f7fafc', 
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <i className="fas fa-question-circle" style={{ fontSize: '4rem', color: '#cbd5e0', marginBottom: '1rem' }}></i>
              <h3 style={{ color: '#4a5568', marginBottom: '0.5rem' }}>No Questions Yet</h3>
              <p style={{ color: '#718096' }}>You haven't asked any questions to astrologers yet.</p>
            </div>
          ) : (
            <>
              <div className="react-questions-grid" style={{ 
                display: 'grid', 
                gap: '2rem',
                gridTemplateColumns: '1fr'
              }}>
                {questions.map((question, index) => (
                  <div 
                    key={question.id || index} 
                    className="react-question-card"
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      padding: '2rem',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e2e8f0',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
                      <div>
                        <h3 style={{ color: '#ee5a24', fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                          Order ID: {question.orderId}
                        </h3>
                        <p style={{ color: '#718096', fontSize: '0.9rem' }}>
                          <i className="far fa-calendar-alt"></i> {question.date}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          backgroundColor: question.answerStatus === 1 ? '#d4edda' : '#fff3cd',
                          color: question.answerStatus === 1 ? '#155724' : '#856404'
                        }}>
                          {question.answerStatus === 1 ? 'Answered' : 'Pending'}
                        </span>
                        <p style={{ color: '#718096', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                          Amount: <strong style={{ color: '#2d3748' }}>₹{question.amount.toFixed(2)}</strong>
                        </p>
                      </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ color: '#4a5568', fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', display: 'flex', alignItems: 'center' }}>
                        <i className="fas fa-question-circle" style={{ marginRight: '0.5rem', color: '#ee5a24' }}></i>
                        Your Question
                      </h4>
                      <p style={{ 
                        color: '#2d3748', 
                        fontSize: '1rem', 
                        lineHeight: '1.6',
                        padding: '1rem',
                        backgroundColor: '#f7fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                      }}>
                        {question.question}
                      </p>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <h4 style={{ color: '#4a5568', fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', display: 'flex', alignItems: 'center' }}>
                        <i className="fas fa-lightbulb" style={{ marginRight: '0.5rem', color: '#ee5a24' }}></i>
                        Astrologer's Answer
                      </h4>
                      {question.answerStatus === 1 ? (
                        <p style={{ 
                          color: '#2d3748', 
                          fontSize: '1rem', 
                          lineHeight: '1.6',
                          padding: '1rem',
                          backgroundColor: '#edf7ed',
                          borderRadius: '8px',
                          border: '1px solid #c3e6cb'
                        }}>
                          {question.answer}
                        </p>
                      ) : (
                        <p style={{ 
                          color: '#856404', 
                          fontSize: '1rem', 
                          fontStyle: 'italic',
                          padding: '1rem',
                          backgroundColor: '#fff3cd',
                          borderRadius: '8px',
                          border: '1px solid #ffeaa7'
                        }}>
                          <i className="fas fa-clock"></i> Answer pending from astrologer...
                        </p>
                      )}
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      padding: '1rem',
                      backgroundColor: '#f7fafc',
                      borderRadius: '8px',
                      marginTop: '1rem'
                    }}>
                      <i className="fas fa-user-tie" style={{ fontSize: '1.5rem', color: '#ee5a24', marginRight: '1rem' }}></i>
                      <div>
                        <p style={{ color: '#718096', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Astrologer</p>
                        <p style={{ color: '#2d3748', fontSize: '1rem', fontWeight: '600' }}>{question.astrologerName}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {hasMore && (
                <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                  <button 
                    onClick={handleLoadMore}
                    disabled={loading}
                    style={{
                      padding: '1rem 3rem',
                      backgroundColor: '#ee5a24',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.6 : 1,
                      transition: 'all 0.3s'
                    }}
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
                        Loading...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-chevron-down" style={{ marginRight: '0.5rem' }}></i>
                        Load More Questions
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Footer />
    </>
  )
}

export default AskQuestions

