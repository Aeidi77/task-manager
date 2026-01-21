import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Buat response kosong
    const response = NextResponse.json({
      success: true,
      message: 'Logout berhasil'
    })

    // HAPUS COOKIE TOKEN
    response.cookies.set({
      name: 'token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0), // ⬅️ kunci logout (hapus cookie)
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Gagal logout' },
      { status: 500 }
    )
  }
}
