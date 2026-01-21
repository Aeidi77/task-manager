import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApiResponse } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params

  const taskList = await prisma.taskList.findFirst({
    where: {
      id,
      deletedAt: null,
      OR: [
        { ownerId: user.userId },
        {
          collaborators: {
            some: { userId: user.userId }
          }
        }
      ]
    },
    include: {
      owner: {
        select: { id: true, email: true, name: true }
      },
      collaborators: {
        include: {
          user: {
            select: { id: true, email: true, name: true }
          }
        }
      },
      tasks: {
        where: { deletedAt: null },
        orderBy: { order: 'asc' }
      }
    }
  })

  if (!taskList) {
    return NextResponse.json(
      { error: 'Task list not found' } as ApiResponse,
      { status: 404 }
    )
  }

  return NextResponse.json({ data: taskList } as ApiResponse)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params
  const { name, description } = await request.json()

  const taskList = await prisma.taskList.findFirst({
    where: {
      id,
      deletedAt: null,
      OR: [
        { ownerId: user.userId },
        {
          collaborators: {
            some: { userId: user.userId }
          }
        }
      ]
    }
  })

  if (!taskList) {
    return NextResponse.json(
      { error: 'Task list not found' } as ApiResponse,
      { status: 404 }
    )
  }

  const updated = await prisma.taskList.update({
    where: { id },
    data: {
      ...(name && { name: name.trim() }),
      ...(description !== undefined && {
        description: description?.trim() || null
      })
    }
  })

  return NextResponse.json({ data: updated } as ApiResponse)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params

  const taskList = await prisma.taskList.findFirst({
    where: {
      id,
      ownerId: user.userId,
      deletedAt: null
    }
  })

  if (!taskList) {
    return NextResponse.json(
      { error: 'No permission' } as ApiResponse,
      { status: 403 }
    )
  }

  await prisma.$transaction([
    prisma.task.updateMany({
      where: { taskListId: id },
      data: { deletedAt: new Date() }
    }),
    prisma.taskList.update({
      where: { id },
      data: { deletedAt: new Date() }
    })
  ])

  return NextResponse.json({ message: 'Deleted' } as ApiResponse)
}
