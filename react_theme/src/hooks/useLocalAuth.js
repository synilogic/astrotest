import { useEffect, useState, useCallback } from 'react'

const STORAGE_KEY = 'user'

const readUserFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default function useLocalAuth() {
  const [user, setUser] = useState(() => readUserFromStorage())

  const login = useCallback((userData) => {
    setUser(userData)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
    } catch {}
    window.dispatchEvent(new CustomEvent('auth:change', { detail: { user: userData } }))
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {}
    window.dispatchEvent(new CustomEvent('auth:change', { detail: { user: null } }))
  }, [])

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === STORAGE_KEY) {
        setUser(readUserFromStorage())
      }
    }
    const handleAuthChange = (e) => {
      setUser(e.detail?.user ?? readUserFromStorage())
    }
    window.addEventListener('storage', handleStorage)
    window.addEventListener('auth:change', handleAuthChange)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('auth:change', handleAuthChange)
    }
  }, [])

  return { user, login, logout }
}


