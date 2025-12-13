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
    // Ensure API key is a string, not an object
    const sanitizedUserData = { ...userData }
    
    // Helper to extract API key from value (handles string, object, nested object, etc.)
    const extractApiKeyValue = (value) => {
      if (!value) return null;
      if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed !== '' ? trimmed : null;
      }
      if (typeof value === 'object' && value !== null) {
        // Try to extract api_key property from object
        if (value.api_key && typeof value.api_key === 'string') {
          const trimmed = value.api_key.trim();
          return trimmed !== '' ? trimmed : null;
        }
        // If it's already "[object Object]" string, return null (corrupted)
        if (String(value) === '[object Object]') {
          console.warn('[useLocalAuth] API key is corrupted "[object Object]" string, cannot extract');
          return null;
        }
        // Try JSON.stringify and parse
        try {
          const str = JSON.stringify(value);
          const parsed = JSON.parse(str);
          if (parsed.api_key && typeof parsed.api_key === 'string') {
            const trimmed = parsed.api_key.trim();
            return trimmed !== '' ? trimmed : null;
          }
        } catch (e) {
          // If JSON parsing fails, it's corrupted
          console.warn('[useLocalAuth] API key object cannot be parsed:', e);
          return null;
        }
      }
      return null;
    };
    
    // Fix api_key if it's an object or corrupted
    if (sanitizedUserData.api_key) {
      if (typeof sanitizedUserData.api_key === 'object' || 
          (typeof sanitizedUserData.api_key === 'string' && sanitizedUserData.api_key === '[object Object]')) {
        console.warn('[useLocalAuth] api_key needs extraction:', {
          type: typeof sanitizedUserData.api_key,
          value: sanitizedUserData.api_key
        });
        const extracted = extractApiKeyValue(sanitizedUserData.api_key);
        if (extracted) {
          sanitizedUserData.api_key = extracted;
          console.log('[useLocalAuth] ✅ Extracted api_key:', extracted.substring(0, 10) + '...');
        } else {
          console.error('[useLocalAuth] ❌ Could not extract api_key from:', sanitizedUserData.api_key);
          // Don't set to null, keep original and let getUserApiKey handle it
        }
      }
    }
    
    // Fix user_api_key if it's an object or corrupted
    if (sanitizedUserData.user_api_key) {
      if (typeof sanitizedUserData.user_api_key === 'object' || 
          (typeof sanitizedUserData.user_api_key === 'string' && sanitizedUserData.user_api_key === '[object Object]')) {
        console.warn('[useLocalAuth] user_api_key needs extraction:', {
          type: typeof sanitizedUserData.user_api_key,
          value: sanitizedUserData.user_api_key
        });
        const extracted = extractApiKeyValue(sanitizedUserData.user_api_key);
        if (extracted) {
          sanitizedUserData.user_api_key = extracted;
          console.log('[useLocalAuth] ✅ Extracted user_api_key:', extracted.substring(0, 10) + '...');
        } else {
          console.error('[useLocalAuth] ❌ Could not extract user_api_key from:', sanitizedUserData.user_api_key);
          // Don't set to null, keep original and let getUserApiKey handle it
        }
      }
    }
    
    console.log('[useLocalAuth] ===== Storing user in localStorage =====')
    console.log('[useLocalAuth] User data keys:', Object.keys(sanitizedUserData))
    console.log('[useLocalAuth] api_key:', {
      exists: !!sanitizedUserData.api_key,
      type: typeof sanitizedUserData.api_key,
      length: sanitizedUserData.api_key ? String(sanitizedUserData.api_key).length : 0,
      preview: sanitizedUserData.api_key ? `${String(sanitizedUserData.api_key).substring(0, 10)}...${String(sanitizedUserData.api_key).substring(String(sanitizedUserData.api_key).length - 10)}` : 'MISSING'
    })
    console.log('[useLocalAuth] user_api_key:', {
      exists: !!sanitizedUserData.user_api_key,
      type: typeof sanitizedUserData.user_api_key,
      length: sanitizedUserData.user_api_key ? String(sanitizedUserData.user_api_key).length : 0,
      preview: sanitizedUserData.user_api_key ? `${String(sanitizedUserData.user_api_key).substring(0, 10)}...${String(sanitizedUserData.user_api_key).substring(String(sanitizedUserData.user_api_key).length - 10)}` : 'MISSING'
    })
    console.log('[useLocalAuth] user_uni_id:', sanitizedUserData.user_uni_id)
    
    setUser(sanitizedUserData)
    try {
      const jsonString = JSON.stringify(sanitizedUserData)
      localStorage.setItem(STORAGE_KEY, jsonString)
      console.log('[useLocalAuth] ✅ Successfully stored user in localStorage')
      
      // Verify it was stored correctly
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        console.log('[useLocalAuth] ✅ Verified stored data:', {
          hasApiKey: !!parsed.api_key,
          apiKeyType: typeof parsed.api_key,
          apiKeyLength: parsed.api_key ? String(parsed.api_key).length : 0
        })
      }
    } catch (error) {
      console.error('[useLocalAuth] ❌ Error storing user in localStorage:', error)
    }
    window.dispatchEvent(new CustomEvent('auth:change', { detail: { user: sanitizedUserData } }))
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


