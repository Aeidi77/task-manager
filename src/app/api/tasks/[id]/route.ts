import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApiResponse } from '@/types'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await context.params

    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' } as ApiResponse,
        { status: 400 }
      )
    }

    const body = await request.json()
    const { title, status, deadline, order } = body

    const task = await prisma.task.findFirst({
      where: {
        id,
        deletedAt: null
      },
      include: {
        taskList: {
          select: {
            ownerId: true
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' } as ApiResponse,
        { status: 404 }
      )
    }
    const isOwner = task.taskList.ownerId === user.userId
    const isTaskCreator = task.createdById === user.userId

    if (!isOwner && !isTaskCreator) {
      return NextResponse.json(
        { error: 'You do not have permission to update this task' } as ApiResponse,
        { status: 403 }
      )
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(status !== undefined && { status }),
        ...(deadline !== undefined && {
          deadline: deadline ? new Date(deadline) : null
        }),
        ...(order !== undefined && { order })
      }
    })

    return NextResponse.json(
      { data: updated, message: 'Task updated successfully' } as ApiResponse
    )
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' } as ApiResponse,
        { status: 401 }
      )
    }

    console.error('Update task error:', error)
    return NextResponse.json(
      { error: 'Internal server error' } as ApiResponse,
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()

    const { id } = await context.params

    if (!id) {
      return NextResponse.json(
        { error: 'Task ID is required' } as ApiResponse,
        { status: 400 }
      )
    }

    const task = await prisma.task.findFirst({
      where: {
        id,
        deletedAt: null
      },
      include: {
        taskList: {
          select: {
            ownerId: true
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' } as ApiResponse,
        { status: 404 }
      )
    }

    const isOwner = task.taskList.ownerId === user.userId
    const isTaskCreator = task.createdById === user.userId

    if (!isOwner && !isTaskCreator) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this task' } as ApiResponse,
        { status: 403 }
      )
    }

    await prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    return NextResponse.json(
      { message: 'Task deleted successfully' } as ApiResponse
    )
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' } as ApiResponse,
        { status: 401 }
      )
    }

    console.error('Delete task error:', error)
    return NextResponse.json(
      { error: 'Internal server error' } as ApiResponse,
      { status: 500 }
    )
  }
}