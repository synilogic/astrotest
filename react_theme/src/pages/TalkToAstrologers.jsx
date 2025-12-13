import React, { useState, useEffect } from 'react'
import useBreadStars from '../hooks/useBreadStars'
import usePageTitle from '../hooks/usePageTitle'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Link } from 'react-router-dom'
import { fetchAstrologers, fetchFilters, getCurrentUser, getWalletBalance, checkCallDetail, startVoiceCall, startVideoCall, startChat, saveIntake, getChatChannels, getChatChannelHistory, saveChatMessage, getRemainingChatTime, endChat } from '../utils/api'

const TalkToAstrologers = () => {
  useBreadStars()
  usePageTitle('Talk to Astrologers - Astrology Theme')
  
  // Astrologers data state
  const [astrologers, setAstrologers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedAstrologer, setSelectedAstrologer] = useState(null)
  
  // Filter states
  const [showFilterSidebar, setShowFilterSidebar] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    availability: 'all',
    languages: 'all',
    categories: 'all',
    skills: 'all',
    labels: 'all'
  })

  // Booking modal states
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [selectedService, setSelectedService] = useState(null) // 'chat' | 'voice' | 'video'
  const [activeStep, setActiveStep] = useState(1) // 1..4
  const [isJoining, setIsJoining] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)
  const [walletLoading, setWalletLoading] = useState(false)

  // Intake form state
  const [intake, setIntake] = useState({
    name: '',
    birthDate: '',
    time: '',
    birthPlace: '',
    maritalStatus: '',
    occupation: '',
    topic: ''
  })

  // Chat state
  const [chatChannels, setChatChannels] = useState([]) // All chat conversations
  const [loadingChatChannels, setLoadingChatChannels] = useState(false)
  const [selectedChatChannel, setSelectedChatChannel] = useState(null) // Currently selected chat
  const [chatMessages, setChatMessages] = useState([])
  const [chatChannelName, setChatChannelName] = useState(null)
  const [chatUniqeid, setChatUniqeid] = useState(null)
  const [chatMessage, setChatMessage] = useState('')
  const [loadingChat, setLoadingChat] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [showChatList, setShowChatList] = useState(false) // Toggle between astrologer list and chat list
  
  // Filter options from backend
  const [filterOptions, setFilterOptions] = useState({
    languages: [],
    categories: [],
    skills: []
  })
  const labelOptions = ['New', 'VIP', 'Most Choice', 'Top Rated']
  
  // Fetch filter options from backend
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const response = await fetchFilters()
        if (response && response.status === 1) {
          setFilterOptions({
            languages: response.languageList || [],
            categories: response.categoryList || [],
            skills: response.skillList || []
          })
          console.log('[TalkToAstrologers] Filters loaded:', {
            languages: response.languageList?.length || 0,
            skills: response.skillList?.length || 0,
            categories: response.categoryList?.length || 0
          })
        }
      } catch (error) {
        console.error('[TalkToAstrologers] Error loading filters:', error)
      }
    }
    loadFilters()
  }, [])

  // Helper function to get availability status
  const getAvailabilityStatus = (astro) => {
    if (astro.busy_status === 1) return 'busy'
    if (astro.online_status === 1) return 'online'
    return 'offline'
  }

  // Helper function to get price by service type
  const getPriceByService = (prices, serviceType) => {
    if (!prices || !Array.isArray(prices)) return 0
    const priceObj = prices.find(p => {
      if (serviceType === 'chat') return p.type === 'chat'
      if (serviceType === 'voice') return p.type === 'call' || p.type === 'internal_call'
      if (serviceType === 'video') return p.type === 'video' || p.type === 'videocall'
      return false
    })
    return priceObj ? parseFloat(priceObj.price) || 0 : 0
  }

  // Helper function to get badge label
  const getBadgeLabel = (astro, index) => {
    // You can implement logic based on astrologer data
    // For now, using simple logic
    if (index === 0) return 'New'
    if (index === 2) return 'VIP'
    if (index === 3) return 'Most Choice'
    return null
  }

  // Helper function to get image URL
  const getImageUrl = (imageUrl, astrologerId = '') => {
    if (!imageUrl || imageUrl.trim() === '') {
      return 'https://images.unsplash.com/photo-1598751337726-3c8577d00bd3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    }
    
    // If URL is already complete (starts with http:// or https://)
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      // Fix common URL issues
      let fixedUrl = imageUrl
      
      // Replace localhost with actual backend URL if needed
      const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8002/api'
      const backendBase = API_BASE.replace('/api', '')
      
      // If URL contains localhost but we have a different backend URL, replace it
      if (imageUrl.includes('localhost') && !backendBase.includes('localhost')) {
        fixedUrl = imageUrl.replace(/http:\/\/[^/]+/, backendBase)
      }
      
      return fixedUrl
    }
    
    // If URL is relative, prepend backend base URL
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8002/api'
    const baseUrl = API_BASE.replace('/api', '')
    
    // Remove leading slash if present
    const cleanPath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl
    const finalUrl = `${baseUrl}/${cleanPath}`
    
    return finalUrl
  }

  // Fetch chat channels on component mount
  useEffect(() => {
    const user = getCurrentUser()
    if (user && user.user_uni_id) {
      // Load chat channels when user is logged in
      fetchChatChannels()
    }
  }, []) // Run once on mount

  // Fetch astrologers from backend
  useEffect(() => {
    const loadAstrologers = async () => {
      setLoading(true)
      setError(null)
      try {
        const user = getCurrentUser()
        
        // Don't send availability filter to API, filter client-side instead
        const { availability, ...apiFilters } = filters
        const response = await fetchAstrologers({
          ...apiFilters,
          limit: 20,
          offset: 0,
          user_uni_id: user?.user_uni_id || null
        })
        
        if (response && response.status === 1 && response.data) {
          // Apply client-side availability filter
          let filteredData = response.data
          if (availability !== 'all') {
            filteredData = response.data.filter(astro => {
              const status = getAvailabilityStatus(astro)
              return status === availability
            })
          }
          
          setAstrologers(filteredData)
        } else {
          setAstrologers([])
          if (response && response.msg) {
            setError(response.msg)
          }
        }
      } catch (err) {
        console.error('Error loading astrologers:', err)
        setError(`Failed to load astrologers: ${err.message || 'Please check if backend server is running'}`)
        setAstrologers([])
      } finally {
        setLoading(false)
      }
    }

    loadAstrologers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])
  
  // Filter functions
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }
  
  const clearAllFilters = () => {
    setFilters({
      search: '',
      availability: 'all',
      languages: 'all',
      categories: 'all',
      skills: 'all',
      labels: 'all'
    })
  }
  
  const toggleFilterSidebar = () => {
    setShowFilterSidebar(!showFilterSidebar)
  }

  // Fetch wallet balance when user opens booking modal
  useEffect(() => {
    const fetchBalance = async () => {
      if (isBookingOpen) {
        const user = getCurrentUser()
        if (user && user.user_uni_id) {
          setWalletLoading(true)
          try {
            const balanceRes = await getWalletBalance(user.user_uni_id)
            if (balanceRes && balanceRes.status === 1) {
              const balance = parseFloat(balanceRes.data) || 0
              setWalletBalance(balance)
              console.log('[TalkToAstrologers] Wallet balance loaded:', balance)
            } else {
              console.warn('[TalkToAstrologers] Failed to fetch wallet balance:', balanceRes)
              setWalletBalance(0)
            }
          } catch (error) {
            console.error('[TalkToAstrologers] Error fetching wallet balance:', error)
            setWalletBalance(0)
          } finally {
            setWalletLoading(false)
          }
        }
      }
    }
    
    fetchBalance()
  }, [isBookingOpen])

  // Booking modal helpers
  const openBooking = (service, astrologer) => {
    setSelectedService(service)
    setSelectedAstrologer(astrologer)
    setActiveStep(1)
    setIsBookingOpen(true)
  }

  const closeBooking = () => {
    setIsBookingOpen(false)
    setIsJoining(false)
    setActiveStep(1)
  }

  const handleStart = async () => {
    if (!selectedAstrologer || !selectedService) {
      console.error('[TalkToAstrologers] Missing astrologer or service')
      return
    }

    try {
      const user = getCurrentUser()
      if (!user || !user.user_uni_id) {
        alert('Please login to start a session')
        return
      }

      // For chat service, use startChat API
      if (selectedService === 'chat') {
        console.log('[TalkToAstrologers] Starting chat...', {
          astrologer_uni_id: selectedAstrologer.astrologer_uni_id
        })

        const chatRes = await startChat(selectedAstrologer.astrologer_uni_id)
        console.log('[TalkToAstrologers] Start chat result:', chatRes)

        if (chatRes && chatRes.status === 1) {
          // Chat started successfully
          setChatUniqeid(chatRes.data?.uniqeid || null)
          setChatChannelName(chatRes.data?.channel_name || null)
          setChatMessages([]) // Initialize empty messages
          setActiveStep(4) // Go directly to chat UI
          
          // Fetch chat history if channel_name is available
          if (chatRes.data?.channel_name) {
            fetchChatHistory(chatRes.data.channel_name)
          }
        } else {
          const errorMsg = chatRes?.error_code === 'SERVICE_UNAVAILABLE' 
            ? 'Communication service is not available. Please contact support or try again later.'
            : (chatRes?.msg || 'Unable to start chat. Please try again.')
          alert(errorMsg)
        }
        return
      }

      // For voice/video, check call details first
      const callTypeMap = {
        'chat': 'chat',
        'voice': 'call',
        'video': 'video'
      }
      const call_type = callTypeMap[selectedService] || 'call'

      console.log('[TalkToAstrologers] Checking call details...', {
        astrologer_uni_id: selectedAstrologer.astrologer_uni_id,
        call_type,
        user_uni_id: user.user_uni_id
      })

      const checkRes = await checkCallDetail(
        selectedAstrologer.astrologer_uni_id,
        call_type,
        user.user_uni_id
      )

      console.log('[TalkToAstrologers] Call detail check result:', checkRes)

      if (checkRes && checkRes.status === 1) {
        // Call can be initiated, proceed to intake form
        setActiveStep(2)
      } else {
        // Show error message
        const errorMsg = checkRes?.error_code === 'SERVICE_UNAVAILABLE' 
          ? 'Communication service is not available. Please contact support or try again later.'
          : (checkRes?.msg || 'Unable to initiate call. Please try again.')
        alert(errorMsg)
      }
    } catch (error) {
      console.error('[TalkToAstrologers] Error starting session:', error)
      alert('Error starting session. Please try again.')
    }
  }

  // Fetch all chat channels (conversations list)
  const fetchChatChannels = async () => {
    setLoadingChatChannels(true)
    try {
      const channelsRes = await getChatChannels(1, 0) // page=1, is_assistant_chat=0
      console.log('[TalkToAstrologers] Chat channels:', channelsRes)

      if (channelsRes && channelsRes.status === 1 && Array.isArray(channelsRes.data)) {
        setChatChannels(channelsRes.data)
        
        // If no chat is selected and there are channels, auto-select first one
        if (!selectedChatChannel && channelsRes.data.length > 0) {
          const firstChannel = channelsRes.data[0]
          setSelectedChatChannel(firstChannel)
          if (firstChannel.channel_name) {
            fetchChatHistory(firstChannel.channel_name)
          }
        }
      } else {
        setChatChannels([])
      }
    } catch (error) {
      console.error('[TalkToAstrologers] Error fetching chat channels:', error)
      setChatChannels([])
    } finally {
      setLoadingChatChannels(false)
    }
  }

  // Fetch chat history
  const fetchChatHistory = async (channel_name) => {
    if (!channel_name) return

    setLoadingChat(true)
    try {
      const historyRes = await getChatChannelHistory(channel_name, 0, 1, 0)
      console.log('[TalkToAstrologers] Chat history:', historyRes)

      if (historyRes && historyRes.status === 1 && Array.isArray(historyRes.data)) {
        // Transform messages to display format
        const transformedMessages = historyRes.data.map(msg => ({
          id: msg.id,
          message: msg.message || '',
          message_type: msg.message_type || 'Text',
          file_url: msg.file_url || '',
          is_customer: msg.is_customer === 1 || msg.is_customer === true,
          created_at: msg.created_at || new Date().toISOString()
        }))
        setChatMessages(transformedMessages)
      }
    } catch (error) {
      console.error('[TalkToAstrologers] Error fetching chat history:', error)
    } finally {
      setLoadingChat(false)
    }
  }

  // Handle chat channel selection
  const handleSelectChatChannel = (channel) => {
    setSelectedChatChannel(channel)
    setChatChannelName(channel.channel_name)
    setChatUniqeid(channel.uniqeid || null)
    setChatMessages([]) // Clear previous messages
    
    if (channel.channel_name) {
      fetchChatHistory(channel.channel_name)
    }
  }

  // Send chat message
  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !chatChannelName || !chatUniqeid || sendingMessage) {
      return
    }

    setSendingMessage(true)
    try {
      const messageData = {
        uniqeid: chatUniqeid,
        channel_name: chatChannelName,
        message: chatMessage.trim(),
        message_type: 'Text',
        call_type: 'chat',
        is_first_chat: chatMessages.length === 0 ? 1 : 0
      }

      const saveRes = await saveChatMessage(messageData)
      console.log('[TalkToAstrologers] Save message result:', saveRes)

      if (saveRes && saveRes.status === 1) {
        // Add message to local state
        const newMessage = {
          id: saveRes.data?.id || Date.now(),
          message: chatMessage.trim(),
          message_type: 'Text',
          is_customer: true,
          created_at: new Date().toISOString()
        }
        setChatMessages(prev => [...prev, newMessage])
        setChatMessage('') // Clear input

        // Refresh chat history to get latest messages
        if (chatChannelName) {
          setTimeout(() => fetchChatHistory(chatChannelName), 500)
        }
      } else {
        alert(saveRes?.msg || 'Failed to send message. Please try again.')
      }
    } catch (error) {
      console.error('[TalkToAstrologers] Error sending message:', error)
      alert('Error sending message. Please try again.')
    } finally {
      setSendingMessage(false)
    }
  }

  // Handle Enter key in chat input
  const handleChatKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleIntakeChange = (field, value) => {
    setIntake(prev => ({ ...prev, [field]: value }))
  }

  const handleIntakeBack = () => setActiveStep(1)

  const handleIntakeContinue = async () => {
    if (!selectedAstrologer || !selectedService) {
      console.error('[TalkToAstrologers] Missing astrologer or service')
      return
    }

    try {
      const user = getCurrentUser()
      if (!user || !user.user_uni_id) {
        alert('Please login to start a call')
        return
      }

      // Map service type to call_type
      const callTypeMap = {
        'chat': 'chat',
        'voice': 'call',
        'video': 'video'
      }
      const call_type = callTypeMap[selectedService] || 'call'

      console.log('[TalkToAstrologers] Starting call...', {
        astrologer_uni_id: selectedAstrologer.astrologer_uni_id,
        call_type,
        intake: intake
      })

      // Start the call based on service type (without intake data - backend only accepts api_key, user_uni_id, astrologer_uni_id)
      let startRes
      if (selectedService === 'chat') {
        startRes = await startChat(selectedAstrologer.astrologer_uni_id)
      } else if (selectedService === 'video') {
        startRes = await startVideoCall(selectedAstrologer.astrologer_uni_id)
      } else {
        // Voice call
        startRes = await startVoiceCall(selectedAstrologer.astrologer_uni_id)
      }

      console.log('[TalkToAstrologers] Start call result:', startRes)

      if (startRes && startRes.status === 1) {
        // Call initiated successfully, now save intake data if provided
        if (startRes.data && startRes.data.uniqeid && Object.keys(intake).length > 0) {
          try {
            // Map frontend intake fields to backend fields
            const intakePayload = {
              uniqeid: startRes.data.uniqeid,
              name: intake.name || '',
              dob: intake.birthDate || '',
              tob: intake.time || '',
              birth_place: intake.birthPlace || '',
              marital_status: intake.maritalStatus || '',
              occupation: intake.occupation || '',
              topic: intake.topic || '',
              intake_type: call_type // 'call', 'chat', or 'video'
            }
            
            const saveIntakeRes = await saveIntake(intakePayload)
            console.log('[TalkToAstrologers] Intake data saved:', saveIntakeRes)
          } catch (intakeError) {
            console.error('[TalkToAstrologers] Error saving intake data:', intakeError)
            // Don't block the call if intake save fails
          }
        }

        // Call initiated successfully
        setActiveStep(3)
        setIsJoining(true)
        
        // If it's a chat, move to chat UI
        if (selectedService === 'chat') {
          setTimeout(() => {
            setIsJoining(false)
            setActiveStep(4) // Move to chat UI
            setCurrentChatChannel({
              uniqeid: startRes.data?.uniqeid || '',
              astrologer_uni_id: selectedAstrologer.astrologer_uni_id,
              customer_uni_id: user.user_uni_id,
              channel_name: `CHAT/${user.user_uni_id}-${selectedAstrologer.astrologer_uni_id}`
            })
            if (startRes.data?.uniqeid) {
              fetchChatHistory(startRes.data.uniqeid)
            }
          }, 800)
        } else {
          setTimeout(() => {
            setIsJoining(false)
          }, 800)
        }
      } else {
        // Show error message
        const errorMsg = startRes?.error_code === 'SERVICE_UNAVAILABLE'
          ? 'Communication service is not available. Please contact support or try again later.'
          : (startRes?.msg || 'Unable to start call. Please try again.')
        alert(errorMsg)
      }
    } catch (error) {
      console.error('[TalkToAstrologers] Error starting call:', error)
      alert('Error starting call. Please try again.')
    }
  }

  const handleAcknowledgeWaitlist = () => {
    setActiveStep(4)
  }

  // Helper function to format max duration
  const getMaxDuration = (astrologer) => {
    // Check if max_duration is available in astrologer data
    if (astrologer?.max_duration) {
      const minutes = parseInt(astrologer.max_duration)
      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return mins > 0 ? `${hours} hour${hours > 1 ? 's' : ''} ${mins} min${mins > 1 ? 's' : ''}` : `${hours} hour${hours > 1 ? 's' : ''}`
      }
      return `${minutes} min${minutes > 1 ? 's' : ''}`
    }
    // Check if available_duration is available
    if (astrologer?.available_duration) {
      const minutes = parseInt(astrologer.available_duration)
      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return mins > 0 ? `${hours} hour${hours > 1 ? 's' : ''} ${mins} min${mins > 1 ? 's' : ''}` : `${hours} hour${hours > 1 ? 's' : ''}`
      }
      return `${minutes} min${minutes > 1 ? 's' : ''}`
    }
    // Default fallback
    return '2 hours'
  }

  // Get current astrologer for booking modal
  const astrologer = selectedAstrologer ? {
    name: selectedAstrologer.display_name || selectedAstrologer.user?.name || 'Astrologer',
    ratePerMin: {
      chat: getPriceByService(selectedAstrologer.prices, 'chat'),
      voice: getPriceByService(selectedAstrologer.prices, 'voice'),
      video: getPriceByService(selectedAstrologer.prices, 'video')
    },
    maxDuration: getMaxDuration(selectedAstrologer),
    balance: walletLoading ? 'Loading...' : walletBalance
  } : {
    name: 'Astrologer',
    ratePerMin: { chat: 0, voice: 0, video: 0 },
    maxDuration: '2 hours',
    balance: walletLoading ? 'Loading...' : walletBalance
  }

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
          <h1 className="react-new-bread-hero-title">Our Astrologers</h1>
          <div className="react-new-bread-breadcrumbs">
            <a href="#">Home</a>
            <span className="react-new-bread-breadcrumb-separator">/</span>
            <span>Our Astrologers</span>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="react-filter-section">
        <div className="container">
          <div className="react-filter-header">
            <h2>Find Your Perfect Astrologer</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="react-filter-toggle-btn"
                onClick={() => setShowChatList(!showChatList)}
                style={{ 
                  backgroundColor: showChatList ? '#4caf50' : '#7c3aed',
                  position: 'relative'
                }}
              >
                <i className="fas fa-comments"></i>
                My Chats
                {chatChannels.length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    backgroundColor: '#ff5252',
                    color: 'white',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {chatChannels.length}
                  </span>
                )}
              </button>
              <button 
                className="react-filter-toggle-btn"
                onClick={toggleFilterSidebar}
              >
                <i className="fas fa-filter"></i>
                Filter Astrologers
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Sidebar */}
      <div className={`react-filter-sidebar ${showFilterSidebar ? 'show' : ''}`}>
        <div className="react-filter-sidebar-header">
          <h3>Filter Astrologers</h3>
          <button 
            className="react-filter-close-btn"
            onClick={toggleFilterSidebar}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="react-filter-content">
          {/* Search Filter */}
          <div className="react-filter-group">
            <label className="react-filter-label">Search By</label>
            <input
              type="text"
              className="react-filter-input"
              placeholder="ID, Name, Email, Mobile"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          {/* Availability Filter */}
          <div className="react-filter-group">
            <label className="react-filter-label">Availability</label>
            <select
              className="react-filter-select"
              value={filters.availability}
              onChange={(e) => handleFilterChange('availability', e.target.value)}
            >
              <option value="all">All</option>
              <option value="online">Online</option>
              <option value="busy">Busy</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          {/* Languages Filter */}
          <div className="react-filter-group">
            <label className="react-filter-label">Languages</label>
            <select
              className="react-filter-select"
              value={filters.languages}
              onChange={(e) => handleFilterChange('languages', e.target.value)}
            >
              <option value="all">All Languages</option>
              {filterOptions.languages.map(lang => (
                <option key={lang.id} value={lang.language_name}>{lang.language_name}</option>
              ))}
            </select>
          </div>

          {/* Categories Filter */}
          <div className="react-filter-group">
            <label className="react-filter-label">Categories</label>
            <select
              className="react-filter-select"
              value={filters.categories}
              onChange={(e) => handleFilterChange('categories', e.target.value)}
            >
              <option value="all">All Categories</option>
              {filterOptions.categories.map(category => (
                <option key={category.id} value={category.category_title}>{category.category_title}</option>
              ))}
            </select>
          </div>

          {/* Skills Filter */}
          <div className="react-filter-group">
            <label className="react-filter-label">Skills</label>
            <select
              className="react-filter-select"
              value={filters.skills}
              onChange={(e) => handleFilterChange('skills', e.target.value)}
            >
              <option value="all">All Skills</option>
              {filterOptions.skills.map(skill => (
                <option key={skill.id} value={skill.skill_name}>{skill.skill_name}</option>
              ))}
            </select>
          </div>

          {/* Labels Filter */}
          <div className="react-filter-group">
            <label className="react-filter-label">Labels</label>
            <select
              className="react-filter-select"
              value={filters.labels}
              onChange={(e) => handleFilterChange('labels', e.target.value)}
            >
              <option value="all">All Labels</option>
              {labelOptions.map(label => (
                <option key={label} value={label}>{label}</option>
              ))}
            </select>
          </div>

          {/* Filter Actions */}
          <div className="react-filter-actions">
            <button className="react-clear-filters-btn" onClick={clearAllFilters}>
              Clear All
            </button>
            <button className="react-apply-filters-btn" onClick={toggleFilterSidebar}>
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Chat Channels Sidebar */}
      <div className={`react-filter-sidebar ${showChatList ? 'show' : ''}`}>
        <div className="react-filter-sidebar-header">
          <h3>My Chats</h3>
          <button 
            className="react-filter-close-btn"
            onClick={() => setShowChatList(false)}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="react-filter-content" style={{ padding: '0' }}>
          {loadingChatChannels ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: '#7c3aed' }}></i>
              <p style={{ marginTop: '10px' }}>Loading chats...</p>
            </div>
          ) : chatChannels.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
              <i className="fas fa-comments" style={{ fontSize: '48px', marginBottom: '10px', opacity: 0.3 }}></i>
              <p>No chat conversations yet</p>
              <p style={{ fontSize: '12px', marginTop: '5px' }}>
                Start chatting with an astrologer to see your conversations here
              </p>
            </div>
          ) : (
            <div style={{ maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
              {chatChannels.map((channel) => (
                <div
                  key={channel.channel_name}
                  onClick={() => {
                    handleSelectChatChannel(channel)
                    setShowChatList(false) // Close sidebar after selection
                  }}
                  style={{
                    padding: '15px',
                    borderBottom: '1px solid #eee',
                    cursor: 'pointer',
                    backgroundColor: selectedChatChannel?.channel_name === channel.channel_name 
                      ? '#f0e7ff' 
                      : '#fff',
                    transition: 'background-color 0.2s',
                    ':hover': {
                      backgroundColor: '#f5f5f5'
                    }
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = selectedChatChannel?.channel_name === channel.channel_name ? '#f0e7ff' : '#f5f5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedChatChannel?.channel_name === channel.channel_name ? '#f0e7ff' : '#fff'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* User Avatar */}
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      backgroundColor: '#7c3aed',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      flexShrink: 0
                    }}>
                      {channel.user_image_url ? (
                        <img 
                          src={channel.user_image_url} 
                          alt={channel.user_name}
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <i className="fas fa-user"></i>
                      )}
                    </div>

                    {/* Chat Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontWeight: 'bold', 
                        marginBottom: '5px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {channel.user_name || 'Unknown User'}
                      </div>
                      <div style={{ 
                        fontSize: '0.85em', 
                        color: '#666',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {channel.last_message || 'No messages yet'}
                      </div>
                      {channel.created_at && (
                        <div style={{ fontSize: '0.75em', color: '#999', marginTop: '3px' }}>
                          {new Date(channel.created_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    {/* Unread Badge */}
                    {channel.unread_count > 0 && (
                      <div style={{
                        backgroundColor: '#4caf50',
                        color: 'white',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75em',
                        fontWeight: 'bold',
                        flexShrink: 0
                      }}>
                        {channel.unread_count}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Refresh Button */}
          <div style={{ padding: '15px', borderTop: '1px solid #eee' }}>
            <button
              onClick={() => fetchChatChannels()}
              disabled={loadingChatChannels}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#7c3aed',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: loadingChatChannels ? 'not-allowed' : 'pointer',
                opacity: loadingChatChannels ? 0.6 : 1,
                fontWeight: 'bold'
              }}
            >
              <i className={`fas ${loadingChatChannels ? 'fa-spinner fa-spin' : 'fa-sync-alt'}`}></i>
              {' '}Refresh Chats
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for sidebar */}
      {showFilterSidebar && (
        <div 
          className="react-filter-overlay"
          onClick={toggleFilterSidebar}
        ></div>
      )}
      
      {/* Overlay for chat sidebar */}
      {showChatList && (
        <div 
          className="react-filter-overlay"
          onClick={() => setShowChatList(false)}
        ></div>
      )}

      <section>
        <div className="container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>Loading astrologers...</p>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                Please check browser console for details
              </p>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
              <p><strong>Error:</strong> {error}</p>
              <p style={{ fontSize: '12px', marginTop: '10px' }}>
                Make sure backend server is running on port 8002
              </p>
              <p style={{ fontSize: '12px' }}>
                Check browser console (F12) for more details
              </p>
            </div>
          ) : astrologers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>No astrologers found.</p>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                Try adjusting your filters or check if backend has data
              </p>
            </div>
          ) : (
            <div className="react-talkTo-main">
              {astrologers.map((astro, index) => {
                const availabilityStatus = getAvailabilityStatus(astro)
                const badgeLabel = getBadgeLabel(astro, index)
                const rating = parseFloat(astro.avg_rating) || 0
                const fullStars = Math.floor(rating)
                const hasHalfStar = rating % 1 >= 0.5
                const chatPrice = getPriceByService(astro.prices, 'chat')
                const voicePrice = getPriceByService(astro.prices, 'voice')
                const videoPrice = getPriceByService(astro.prices, 'video')
                const categoryName = astro.category_names ? astro.category_names.split(',')[0] : 'Astrologer'
                const languages = astro.language_name || 'N/A'
                const skills = astro.skill_names || 'N/A'
                const experience = astro.experience || 'N/A'

                return (
                  <div key={astro.astrologer_uni_id || index} className="react-own-container">
                    <div className="react-own-profile-card">
                      {badgeLabel && (
                        <div className={`react-own-rated-badge ${
                          badgeLabel === 'New' ? 'react-new-rated' :
                          badgeLabel === 'VIP' ? 'react-vip-rated' :
                          badgeLabel === 'Most Choice' ? 'react-top-rated' : ''
                        }`}>
                          <span>{badgeLabel}</span>
                        </div>
                      )}
                      <div className="react-own-card-header">
                        <div className="react-own-profile-info">
                          <div className="react-own-avatar-container">
                            <img 
                              key={`img-${astro.astrologer_uni_id}-${index}-${astro.astro_img || 'no-img'}`}
                              src={`${getImageUrl(astro.astro_img, astro.astrologer_uni_id)}?t=${Date.now()}&id=${astro.astrologer_uni_id}`}
                              alt={astro.display_name || 'Astrologer'} 
                              className="react-own-avatar"
                              loading="lazy"
                              crossOrigin="anonymous"
                              onError={(e) => {
                                console.error(`[Image Error] Astrologer ${astro.astrologer_uni_id}:`, {
                                  originalUrl: astro.astro_img,
                                  attemptedUrl: e.target.src,
                                  name: astro.display_name,
                                  error: 'Image failed to load'
                                })
                                // Prevent infinite loop - only set fallback once
                                if (!e.target.dataset.fallbackSet) {
                                  e.target.dataset.fallbackSet = 'true'
                                  e.target.src = 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400'
                                }
                              }}
                            />
                            <div className={`react-own-online-badge react-own-${availabilityStatus}`}>
                              <span className="react-own-status-dot"></span>
                              {availabilityStatus === 'online' ? 'Online' : availabilityStatus === 'busy' ? 'Busy' : 'Offline'}
                            </div>
                          </div>
                          <div className="react-own-profile-details">
                            <Link to={`/astrologer?id=${astro.astrologer_uni_id}`} className="react-own-name">
                              {astro.display_name || astro.user?.name || 'Astrologer'}
                            </Link>
                            <p className="react-own-title">{categoryName}</p>
                            <div className="react-own-rating">
                              <div className="react-own-stars">
                                {[...Array(5)].map((_, i) => {
                                  if (i < fullStars) {
                                    return <i key={i} className="fas fa-star"></i>
                                  } else if (i === fullStars && hasHalfStar) {
                                    return <i key={i} className="fas fa-star-half-alt"></i>
                                  } else {
                                    return <i key={i} className="far fa-star"></i>
                                  }
                                })}
                              </div>
                              <span className="react-own-rating-count">{rating.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="react-own-quick-info">
                          <div className="react-own-info-item">
                            <span className="react-own-info-label">
                              <i className="fa-solid fa-clock react-own-icOn"></i>Exp
                            </span>
                            <span className="react-own-info-value">{experience}</span>
                          </div>
                          <div className="react-own-info-item">
                            <span className="react-own-info-label">
                              <i className="fa fa-language react-own-icOn"></i>Languages
                            </span>
                            <span className="react-own-info-value">{languages}</span>
                          </div>
                          <div className="react-own-info-item">
                            <span className="react-own-info-label">
                              <i className="fa fa-star react-own-icOn"></i>Skills
                            </span>
                            <span className="react-own-info-value" title={skills}>{skills.length > 30 ? skills.substring(0, 30) + '...' : skills}</span>
                          </div>
                        </div>
                      </div>
                      <div className="react-own-services">
                        {chatPrice > 0 && (
                          <div className="react-own-service-item" onClick={() => openBooking('chat', astro)}>
                            <div className="react-own-service-icon react-chat">
                              <i className="fas fa-comments"></i>
                            </div>
                            <div className="react-own-service-details">
                              <span className="react-own-service-name">Chat</span>
                              <span className="react-own-service-price">₹{chatPrice}/min</span>
                            </div>
                          </div>
                        )}
                        {videoPrice > 0 && (
                          <div className="react-own-service-item" onClick={() => openBooking('video', astro)}>
                            <div className="react-own-service-icon react-video">
                              <i className="fas fa-video"></i>
                            </div>
                            <div className="react-own-service-details">
                              <span className="react-own-service-name">Video Call</span>
                              <span className="react-own-service-price">₹{videoPrice}/min</span>
                            </div>
                          </div>
                        )}
                        {voicePrice > 0 && (
                          <div className="react-own-service-item" onClick={() => openBooking('voice', astro)}>
                            <div className="react-own-service-icon react-voice">
                              <i className="fas fa-phone"></i>
                            </div>
                            <div className="react-own-service-details">
                              <span className="react-own-service-name">Voice Call</span>
                              <span className="react-own-service-price">₹{voicePrice}/min</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Booking Modal */}
      {isBookingOpen && (
        <div className="react-booking-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeBooking() }}>
          <div className="react-booking-modal fade-up">
            <button className="react-booking-close" aria-label="Close" onClick={closeBooking}>
              <i className="fa-solid fa-xmark"></i>
            </button>

            {/* Step header */}
            <div className="react-booking-header">
              <div className="react-booking-title">
                <span className={`react-service-pill ${selectedService}`}>
                  {selectedService === 'chat' && <i className="fas fa-comments"></i>}
                  {selectedService === 'voice' && <i className="fas fa-phone"></i>}
                  {selectedService === 'video' && <i className="fas fa-video"></i>}
                  <span className="react-pill-text">{selectedService === 'chat' ? 'Chat' : selectedService === 'voice' ? 'Voice' : 'Video'} Service</span>
                </span>
                <h3>{activeStep === 1 ? 'Astrologer Detail' : activeStep === 2 ? 'Chat Intake Form' : activeStep === 3 ? 'Waitlist Joined!' : 'Connecting...'}</h3>
                <p className="react-muted">with <strong>{astrologer.name}</strong></p>
              </div>
              <div className="react-booking-steps">
                <div className={`react-step ${activeStep >= 1 ? 'done' : ''}`}>1</div>
                <div className={`react-line ${activeStep > 1 ? 'active' : ''}`}></div>
                <div className={`react-step ${activeStep >= 2 ? 'done' : ''}`}>2</div>
                <div className={`react-line ${activeStep > 2 ? 'active' : ''}`}></div>
                <div className={`react-step ${activeStep >= 3 ? 'done' : ''}`}>3</div>
                <div className={`react-line ${activeStep > 3 ? 'active' : ''}`}></div>
                <div className={`react-step ${activeStep >= 4 ? 'done' : ''}`}>4</div>
              </div>
            </div>

            {/* Step 1: Service detail */}
            {activeStep === 1 && (
              <div className="react-booking-body">
                <div className="react-service-stats">
                  <div className="react-stat">
                    <span className="react-label">Service:</span>
                    <span className="react-value">{selectedService === 'chat' ? 'Chat' : selectedService === 'voice' ? 'Voice Call' : 'Video Call'}</span>
                  </div>
                  <div className="react-stat">
                    <span className="react-label">Rate:</span>
                    <span className="react-value">₹{astrologer.ratePerMin[selectedService]}/min</span>
                  </div>
                  <div className="react-stat">
                    <span className="react-label">Your Balance:</span>
                    <span className="react-value">
                      {typeof astrologer.balance === 'string' ? astrologer.balance : `₹${astrologer.balance.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="react-stat">
                    <span className="react-label">Max Duration:</span>
                    <span className="react-value">{astrologer.maxDuration}</span>
                  </div>
                </div>
                <div className="react-how-it-works">
                  <h4>How it works?</h4>
                  <p>Simply click Start button to initiate session.</p>
                </div>
                <div className="react-booking-actions">
                  <button className="react-btn react-btn-outline" onClick={closeBooking}>Cancel</button>
                  <button className="react-btn react-btn-primary" onClick={handleStart}>Start</button>
                </div>
              </div>
            )}

            {/* Step 2: Intake form */}
            {activeStep === 2 && (
              <div className="react-booking-body">
                <div className="react-form-grid">
                  <div className="react-form-group">
                    <label>Enter Name</label>
                    <input type="text" placeholder="Name" value={intake.name} onChange={(e) => handleIntakeChange('name', e.target.value)} />
                  </div>
                  <div className="react-form-group">
                    <label>Birth Date</label>
                    <input type="text" placeholder="dd-mm-yyyy" value={intake.birthDate} onChange={(e) => handleIntakeChange('birthDate', e.target.value)} />
                  </div>
                  <div className="react-form-group">
                    <label>Time</label>
                    <input type="text" placeholder="--:-- --" value={intake.time} onChange={(e) => handleIntakeChange('time', e.target.value)} />
                  </div>
                  <div className="react-form-group">
                    <label>Birth Place</label>
                    <input type="text" placeholder="Birth Place" value={intake.birthPlace} onChange={(e) => handleIntakeChange('birthPlace', e.target.value)} />
                  </div>
                  <div className="react-form-group">
                    <label>Marital Status</label>
                    <select value={intake.maritalStatus} onChange={(e) => handleIntakeChange('maritalStatus', e.target.value)}>
                      <option value="">Please Select Marital Status</option>
                      <option>Single</option>
                      <option>Married</option>
                      <option>Divorced</option>
                      <option>Widowed</option>
                    </select>
                  </div>
                  <div className="react-form-group">
                    <label>Occupation</label>
                    <input type="text" placeholder="Occupation" value={intake.occupation} onChange={(e) => handleIntakeChange('occupation', e.target.value)} />
                  </div>
                  <div className="react-form-group react-full">
                    <label>Topic of Concern</label>
                    <textarea placeholder="Topic of Concern" rows={3} value={intake.topic} onChange={(e) => handleIntakeChange('topic', e.target.value)} />
                  </div>
                </div>
                <div className="react-booking-actions">
                  <button className="react-btn react-btn-outline" onClick={handleIntakeBack}>Back</button>
                  <button className="react-btn react-btn-primary" onClick={handleIntakeContinue}>Continue</button>
                </div>
              </div>
            )}

            {/* Step 3: Waitlist */}
            {activeStep === 3 && (
              <div className="react-booking-body react-waitlist">
                <div className="react-wait-illustration">
                  <div className="react-spinner"></div>
                </div>
                <p>Your {selectedService} request has been successfully booked. <strong>{astrologer.name}</strong> will answer you within 10min</p>
                <div className="react-booking-actions react-center">
                  <button className="react-btn react-btn-primary" onClick={handleAcknowledgeWaitlist} disabled={isJoining}>{isJoining ? 'Preparing...' : 'Ok'}</button>
                </div>
              </div>
            )}

            {/* Step 4: Connection UI */}
            {activeStep === 4 && (
              <div className="react-booking-body react-connection">
                {selectedService === 'chat' && (
                  <div className="react-chat-ui">
                    <div className="react-chat-header">
                      <div className="react-avatar"></div>
                      <div>
                        <h4>{astrologer.name}</h4>
                        <span className="react-status">Connected • ₹{astrologer.ratePerMin.chat}/min</span>
                      </div>
                    </div>
                    <div className="react-chat-messages">
                      {loadingChat ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>Loading messages...</div>
                      ) : chatMessages.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                          No messages yet. Start the conversation!
                        </div>
                      ) : (
                        chatMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`react-msg ${msg.is_customer ? 'react-outgoing' : 'react-incoming'}`}
                          >
                            {msg.message_type === 'Image' && msg.file_url ? (
                              <div>
                                <img 
                                  src={msg.file_url} 
                                  alt="Chat image" 
                                  style={{ maxWidth: '200px', borderRadius: '8px', marginBottom: '4px' }}
                                />
                                {msg.message && <div>{msg.message}</div>}
                              </div>
                            ) : msg.message_type === 'Voice' && msg.file_url ? (
                              <div>
                                <audio controls src={msg.file_url} style={{ maxWidth: '200px' }} />
                                {msg.message && <div>{msg.message}</div>}
                              </div>
                            ) : (
                              <div>{msg.message}</div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    <div className="react-chat-input">
                      <input
                        placeholder="Type your message..."
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyPress={handleChatKeyPress}
                        disabled={sendingMessage || !chatChannelName}
                      />
                      <button
                        className="react-btn react-btn-primary"
                        onClick={handleSendMessage}
                        disabled={sendingMessage || !chatMessage.trim() || !chatChannelName}
                      >
                        {sendingMessage ? (
                          <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                          <i className="fas fa-paper-plane"></i>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {selectedService === 'voice' && (
                  <div className="react-call-ui">
                    <div className="react-call-visual react-voice">
                      <div className="react-avatar react-large"></div>
                      <h4>{astrologer.name}</h4>
                      <span className="react-status">Voice call • ₹{astrologer.ratePerMin.voice}/min</span>
                    </div>
                    <div className="react-call-controls">
                      <button className="react-control"><i className="fas fa-microphone"></i></button>
                      <button className="react-control react-danger" onClick={closeBooking}><i className="fas fa-phone-slash"></i></button>
                      <button className="react-control"><i className="fas fa-volume-up"></i></button>
                    </div>
                  </div>
                )}

                {selectedService === 'video' && (
                  <div className="react-video-ui">
                    <div className="react-video-stage">
                      <div className="react-remote-video">Remote Video</div>
                      <div className="react-local-video">You</div>
                    </div>
                    <div className="react-call-controls">
                      <button className="react-control"><i className="fas fa-microphone"></i></button>
                      <button className="react-control"><i className="fas fa-video"></i></button>
                      <button className="react-control react-danger" onClick={closeBooking}><i className="fas fa-phone-slash"></i></button>
                      <button className="react-control"><i className="fas fa-expand"></i></button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default TalkToAstrologers


