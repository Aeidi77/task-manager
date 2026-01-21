import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest, { params }: { params: any }) {
  try {
    
    const resolvedParams = await params
    const { id } = resolvedParams

    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const user = await requireAuth()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    const invitedUser = await prisma.user.findUnique({
      where: { email }
    })

    if (!invitedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const exists = await prisma.collaborator.findUnique({
      where: {
        taskListId_userId: {
          taskListId: id,      
          userId: invitedUser.id
        }
      }
    })

    if (exists) {
      return NextResponse.json({ error: 'User is already a collaborator' }, { status: 400 })
    }

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
