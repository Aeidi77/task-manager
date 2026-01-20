import { cookies } from 'next/headers'
import { verifyToken, JWTPayload } from './jwt'

export async function getCurrentUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    return null
  }

  return verifyToken(token)
}

export async function requireAuth(): Promise<JWTPayload> {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}