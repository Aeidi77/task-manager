'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'
import { ThemeToggle } from './ThemeToggle'
import { RealtimeNotifications } from './RealtimeNotifications'
import { useEffect, useState, useRef } from 'react'

export function Navbar() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me', {method: "GET"})
        if (res.ok && isMounted.current) {
          const data = await res.json()
          setUserId(data.userId)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      }
    }

    fetchUser()

    return () => {
      isMounted.current = false 
    }
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST'
      })
      router.push('/login')
      setTimeout(() => {
        window.location.reload() 
      }, 100)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="text-xl font-bold">
          Task Manager
        </Link>
        <div className="flex items-center gap-2">
          {userId && <RealtimeNotifications userId={userId} />}
          <ThemeToggle />
          <Button 
            variant="outline" 
            onClick={handleLogout}
            key={`logout-${Date.now()}`}
          >
            Logout
          </Button>
        </div>
      </div>
    </nav>
  )
}