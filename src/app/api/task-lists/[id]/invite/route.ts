// src/app/api/task-lists/[id]/invite/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest, { params }: { params: any }) {
  try {
    // 1️⃣ Unwrap params.id karena sekarang Promise
    const resolvedParams = await params
    const { id } = resolvedParams

    // 2️⃣ Ambil email dari request body
    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // 3️⃣ Pastikan user login
    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 4️⃣ Cek apakah task list ada dan milik user
    const taskList = await prisma.taskList.findFirst({
      where: {
        id,
        deletedAt: null,
        ownerId: user.userId
      }
    })

    if (!taskList) {
      return NextResponse.json({ error: 'Task list not found or not allowed' }, { status: 404 })
    }

    // 5️⃣ Cek apakah user yang diundang ada
    const invitedUser = await prisma.user.findUnique({
      where: { email }
    })

    if (!invitedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 6️⃣ Cek apakah user sudah collaborator
    const exists = await prisma.collaborator.findUnique({
      where: {
        taskListId_userId: {
          taskListId: id,       // <- pakai id nyata
          userId: invitedUser.id
        }
      }
    })

    if (exists) {
      return NextResponse.json({ error: 'User is already a collaborator' }, { status: 400 })
    }

    // 7️⃣ Tambahkan collaborator
    const collaborator = await prisma.collaborator.create({
      data: {
        taskListId: id,
        userId: invitedUser.id
      }
    })

    return NextResponse.json({ success: true, collaborator })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
