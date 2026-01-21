import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  const user = await requireAuth()

  return NextResponse.json({
    data: {
      id: user.userId
    }
  })
}
