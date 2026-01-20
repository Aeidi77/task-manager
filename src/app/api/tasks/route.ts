import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApiResponse } from '@/types'

// POST: Buat task baru
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { title, status, deadline, taskListId } = body

    if (!title || title.trim() === '') {
      return NextResponse.json(
        { error: 'Title is required' } as ApiResponse,
        { status: 400 }
      )
    }

    if (!taskListId) {
      return NextResponse.json(
        { error: 'Task list ID is required' } as ApiResponse,
        { status: 400 }
      )
    }

    // Cek akses ke task list
    const taskList = await prisma.taskList.findFirst({
      where: {
        id: taskListId,
        deletedAt: null,
        OR: [
          { ownerId: user.userId },
          {
            collaborators: {
              some: {
                userId: user.userId
              }
            }
          }
        ]
      },
      include: {
        tasks: {
          where: {
            deletedAt: null
          },
          orderBy: {
            order: 'desc'
          },
          take: 1
        }
      }
    })

    if (!taskList) {
      return NextResponse.json(
        { error: 'Task list not found' } as ApiResponse,
        { status: 404 }
      )
    }

    // Hitung order berikutnya
    const nextOrder = taskList.tasks.length > 0 ? taskList.tasks[0].order + 1 : 0

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        status: status || 'TODO',
        deadline: deadline ? new Date(deadline) : null,
        taskListId,
        createdById: user.userId,
        order: nextOrder
      }
    })

    return NextResponse.json(
      { data: task, message: 'Task created successfully' } as ApiResponse,
      { status: 201 }
    )
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' } as ApiResponse,
        { status: 401 }
      )
    }
    console.error('Create task error:', error)
    return NextResponse.json(
      { error: 'Internal server error' } as ApiResponse,
      { status: 500 }
    )
  }
}