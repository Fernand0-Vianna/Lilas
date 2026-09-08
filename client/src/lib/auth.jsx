import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    const initAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      setSession(currentSession)
      
      if (currentSession?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('id, apelido, avatar_url, bio, is_admin, created_at')
          .eq('id', currentSession.user.id)
          .maybeSingle()
        setProfile(data)
      }

      setLoading(false)
    }

    initAuth()

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      if (!s) setProfile(null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user) return
    if (profile?.id === session.user.id) return
    supabase
      .from('profiles')
      .select('id, apelido, avatar_url, bio, is_admin, created_at')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data))
  }, [session?.user?.id])

  const refreshProfile = async () => {
    if (!session?.user) return
    const { data } = await supabase
      .from('profiles')
      .select('id, apelido, avatar_url, bio, is_admin, created_at')
      .eq('id', session.user.id)
      .maybeSingle()
    setProfile(data)
  }

  const signOut = () => supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{ session, profile, refreshProfile, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}