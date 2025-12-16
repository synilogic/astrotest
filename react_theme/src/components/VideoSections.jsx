import React, { useEffect, useState } from 'react'
import { fetchVideoSections } from '../utils/api'

export default function VideoSections() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        console.log('[VideoSections] Fetching video sections...')
        const res = await fetchVideoSections(0)
        console.log('[VideoSections] Full Response:', JSON.stringify(res, null, 2))
        if (!mounted) return
        
        // Check multiple response formats - be very aggressive in finding data
        let videoData = []
        
        // Priority 1: Check if res.data is an array (most common format)
        if (Array.isArray(res?.data)) {
          videoData = res.data
          console.log('[VideoSections] ✅ Got videos from res.data array:', videoData.length)
        }
        // Priority 2: Check status and data
        else if (res?.status === 1 || res?.status === '1') {
          if (Array.isArray(res.data)) {
            videoData = res.data
            console.log('[VideoSections] ✅ Got videos from status 1, data array:', videoData.length)
          } else if (Array.isArray(res)) {
            videoData = res
            console.log('[VideoSections] ✅ Got direct array response')
          } else if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
            // If data is object, try to extract array
            videoData = Object.values(res.data).filter(item => Array.isArray(item) ? item : false).flat()
            console.log('[VideoSections] ⚠️ Data is object, converted to array:', videoData.length)
          }
        }
        // Priority 3: Even if status is 0, check if data exists
        else if (res?.status === 0 || res?.status === '0') {
          if (Array.isArray(res?.data) && res.data.length > 0) {
            console.warn('[VideoSections] ⚠️ Status is 0 but data exists, using it anyway')
            videoData = res.data
          } else {
            console.warn('[VideoSections] ⚠️ Status is 0 and no data or empty data')
          }
        }
        // Priority 4: Direct array response
        else if (Array.isArray(res)) {
          videoData = res
          console.log('[VideoSections] ✅ Got direct array response')
        }
        // Priority 5: Unknown format
        else {
          console.warn('[VideoSections] ⚠️ Unknown response format:', res)
        }
        
        // Last resort: if we still have no data, try to find ANY array in the response
        if (videoData.length === 0) {
          console.log('[VideoSections] 🔄 Last resort: Searching for any array in response...')
          if (res?.data && Array.isArray(res.data)) {
            videoData = res.data
            console.log('[VideoSections] 🔄 Found array in res.data:', videoData.length)
          } else if (Array.isArray(res)) {
            videoData = res
            console.log('[VideoSections] 🔄 Found direct array:', videoData.length)
          } else {
            // Try to find arrays in nested objects
            const findArrays = (obj) => {
              if (Array.isArray(obj)) return obj
              if (typeof obj === 'object' && obj !== null) {
                for (const key in obj) {
                  if (Array.isArray(obj[key]) && obj[key].length > 0) {
                    return obj[key]
                  }
                  const found = findArrays(obj[key])
                  if (found) return found
                }
              }
              return null
            }
            const found = findArrays(res)
            if (found) {
              videoData = found
              console.log('[VideoSections] 🔄 Found nested array:', videoData.length)
            }
          }
        }
        
        console.log('[VideoSections] Processed video data:', videoData)
        console.log('[VideoSections] Video count:', videoData.length)
        
        if (videoData.length > 0) {
          console.log('[VideoSections] ✅ Videos loaded successfully:', videoData.length)
          console.log('[VideoSections] First video:', videoData[0])
          setVideos(videoData)
        } else {
          console.warn('[VideoSections] ⚠️ No videos found. Full response:', res)
          console.warn('[VideoSections] Response keys:', Object.keys(res || {}))
          console.warn('[VideoSections] Response status:', res?.status)
          console.warn('[VideoSections] Response data:', res?.data)
          setVideos([])
        }
      } catch (err) {
        console.error('[VideoSections] ❌ Error fetching video sections', err)
        setError(err.message || 'Failed to load video sections')
        setVideos([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  if (loading) {
    return (
      <section className="react-video-sections" style={{marginBottom: '20px', padding: '20px'}}>
        <div style={{textAlign: 'center', padding: '40px'}}>Loading videos...</div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="react-video-sections" style={{marginBottom: '20px', padding: '20px'}}>
        <div style={{textAlign: 'center', padding: '40px', color: 'red'}}>Error: {error}</div>
      </section>
    )
  }

  if (!videos || videos.length === 0) {
    // No videos available — render nothing (no static placeholder)
    return null
  }

  return (
    <section className="react-video-sections" style={{marginBottom: '40px', padding: '20px 0'}}>
      <div className="container">
        <h3 className="react-shop-filter-title" style={{fontSize: '24px', marginBottom: '30px', textAlign: 'center'}}>
          <i className="fas fa-video react-shop-Icon" style={{marginRight: '10px', color: '#8B5CF6'}}></i>
          Videos
        </h3>
        <div style={{
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '24px',
          marginTop: '20px'
        }}>
          {videos.map(v => {
            // Extract video ID from URL if it's a YouTube/Vimeo URL
            const getVideoEmbed = (url, embedd) => {
              if (embedd && embedd.trim() !== '') {
                return embedd
              }
              if (!url) return ''
              
              // YouTube URL patterns
              const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
              const youtubeMatch = url.match(youtubeRegex)
              if (youtubeMatch) {
                return `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${youtubeMatch[1]}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
              }
              
              // Vimeo URL patterns
              const vimeoRegex = /(?:vimeo\.com\/)(\d+)/
              const vimeoMatch = url.match(vimeoRegex)
              if (vimeoMatch) {
                return `<iframe width="100%" height="315" src="https://player.vimeo.com/video/${vimeoMatch[1]}" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`
              }
              
              // If URL is already an iframe, return as is
              if (url.includes('<iframe')) {
                return url
              }
              
              // Default: return URL as iframe src
              return `<iframe width="100%" height="315" src="${url}" frameborder="0" allowfullscreen></iframe>`
            }

            const videoEmbed = getVideoEmbed(v.url, v.embedd)

            return (
              <div 
                key={v.id} 
                style={{
                  background: '#fff', 
                  padding: '20px', 
                  borderRadius: '12px', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                {v.title && (
                  <h4 style={{
                    margin: '0 0 16px', 
                    fontSize: '18px', 
                    fontWeight: 'bold',
                    color: '#333'
                  }}>
                    {v.title}
                  </h4>
                )}
                {v.video_type && (
                  <div style={{
                    marginBottom: '12px',
                    fontSize: '12px',
                    color: '#666',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {v.video_type}
                  </div>
                )}
                {videoEmbed ? (
                  <div 
                    style={{
                      position: 'relative',
                      paddingBottom: '56.25%', // 16:9 aspect ratio
                      height: 0,
                      overflow: 'hidden',
                      borderRadius: '8px'
                    }}
                    dangerouslySetInnerHTML={{ __html: videoEmbed }} 
                  />
                ) : (
                  <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: '#999',
                    background: '#f5f5f5',
                    borderRadius: '8px'
                  }}>
                    No video URL available
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
