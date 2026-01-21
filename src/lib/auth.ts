import { cookies } from 'next/headers'
import { verifyToken, AppJWTPayload } from './jwt'

export async function getCurrentUser(): Promise<AppJWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) return null

  return verifyToken(token)
}

// ❗️tidak redirect, tidak throw
export async function requireAuth(): Promise<AppJWTPayload | null> {
  return getCurrentUser()
}
