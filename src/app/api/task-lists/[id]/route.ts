import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApiResponse } from '@/types'

// GET: Ambil detail task list
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const { id } = params

    const taskList = await prisma.taskList.findFirst({
      where: {
        id,
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
        owner: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          }
        },
        tasks: {
          where: {
            deletedAt: null
          },
          orderBy: {
            order: 'asc'
          }
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
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' } as ApiResponse,
        { status: 401 }
      )
    }
    console.error('Get task list error:', error)
    return NextResponse.json(
      { error: 'Internal server error' } as ApiResponse,
      { status: 500 }
    )
  }
}

// PATCH: Update task list
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const { id } = params
    const body = await request.json()
    const { name, description } = body

    // Cek akses (owner atau collaborator)
    const taskList = await prisma.taskList.findFirst({
      where: {
        id,
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
        ...(description !== undefined && { description: description?.trim() || null })
      },
      include: {
        owner: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          }
        },
        tasks: {
          where: {
            deletedAt: null
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    })

    return NextResponse.json(
      { data: updated, message: 'Task list updated successfully' } as ApiResponse
    )
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' } as ApiResponse,
        { status: 401 }
      )
    }
    console.error('Update task list error:', error)
    return NextResponse.json(
      { error: 'Internal server error' } as ApiResponse,
      { status: 500 }
    )
  }
}

// DELETE: Soft delete task list (hanya owner)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const { id } = params

    // Cek apakah user adalah owner
    const taskList = await prisma.taskList.findFirst({
      where: {
        id,
        ownerId: user.userId,
        deletedAt: null
      }
    })

    if (!taskList) {
      return NextResponse.json(
        { error: 'Task list not found or you do not have permission' } as ApiResponse,
        { status: 404 }
      )
    }

    // Soft delete task list dan semua tasks
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

    return NextResponse.json(
      { message: 'Task list deleted successfully' } as ApiResponse
    )
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' } as ApiResponse,
        { status: 401 }
      )
    }
    console.error('Delete task list error:', error)
    return NextResponse.json(
      { error: 'Internal server error' } as ApiResponse,
      { status: 500 }
    )
  }
}