import { SignJWT, jwtVerify, type JWTPayload as JoseJWTPayload } from 'jose'

/**
 * Payload JWT yang digunakan aplikasi
 */
export interface AppJWTPayload extends JoseJWTPayload {
  userId: string
  email: string
}

/**
 * Pastikan JWT_SECRET tersedia
 * (mencegah error silent & crash saat build/runtime)
 */
const jwtSecret = process.env.JWT_SECRET

if (!jwtSecret) {
  throw new Error('JWT_SECRET is not defined in environment variables')
}

const secret = new TextEncoder().encode(jwtSecret)

/**
 * Membuat JWT token
 */
export async function signToken(
  payload: Pick<AppJWTPayload, 'userId' | 'email'>
): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

/**
 * Verifikasi JWT token
 * Return payload jika valid, null jika invalid/expired
 */
export async function verifyToken(token: string): Promise<AppJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as AppJWTPayload
  } catch {
    return null
  }
}
