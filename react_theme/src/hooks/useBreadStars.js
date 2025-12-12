import { useEffect } from 'react'

const useBreadStars = () => {
  useEffect(() => {
    const container = document.getElementById('react-new-bread-stars-container')
    if (!container) return
    container.innerHTML = ''

    const starCount = 100
    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div')
      star.classList.add('react-new-bread-star')

      const size = Math.random() * 3 + 1
      const posX = Math.random() * 100
      const posY = Math.random() * 100
      const opacity = Math.random() * 0.7 + 0.3
      const duration = Math.random() * 5 + 3
      const delay = Math.random() * 5

      star.style.width = `${size}px`
      star.style.height = `${size}px`
      star.style.left = `${posX}%`
      star.style.top = `${posY}%`
      star.style.setProperty('--opacity', String(opacity))
      star.style.setProperty('--duration', `${duration}s`)
      star.style.animationDelay = `${delay}s`

      container.appendChild(star)
    }
  }, [])
}

export default useBreadStars


