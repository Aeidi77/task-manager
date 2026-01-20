import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApiResponse } from '@/types'

// PATCH: Update task
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const { id } = params
    const body = await request.json()
    const { title, status, deadline, order } = body

    // Cek akses melalui task list
    const task = await prisma.task.findFirst({
      where: {
        id,
        deletedAt: null
      },
      include: {
        taskList: {
          include: {
            collaborators: true
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

    // Cek apakah user punya akses
    const hasAccess = 
      task.taskList.ownerId === user.userId ||
      task.taskList.collaborators.some(c => c.userId === user.userId)

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to update this task' } as ApiResponse,
        { status: 403 }
      )
    }

    // Update task
    const updated = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(status !== undefined && { status }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
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

// DELETE: Soft delete task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const { id } = params

    // Cek akses melalui task list
    const task = await prisma.task.findFirst({
      where: {
        id,
        deletedAt: null
      },
      include: {
        taskList: {
          include: {
            collaborators: true
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

    // Cek apakah user punya akses
    const hasAccess = 
      task.taskList.ownerId === user.userId ||
      task.taskList.collaborators.some(c => c.userId === user.userId)

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this task' } as ApiResponse,
        { status: 403 }
      )
    }

    // Soft delete
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