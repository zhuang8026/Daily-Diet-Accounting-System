import { createContext, useContext, useState, useCallback } from 'react'
import { getCurrentSession, logout as authLogout } from '@/services/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getCurrentSession())

  const refresh = useCallback(() => setSession(getCurrentSession()), [])

  const logout = useCallback(() => {
    authLogout()
    setSession(null)
  }, [])

  return (
    <AuthContext.Provider value={{ session, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
