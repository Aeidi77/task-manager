import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApiResponse } from '@/types'


export async function GET() {
  try {
    const user = await requireAuth()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' } as ApiResponse,
        { status: 401 }
      )
    }

    const taskLists = await prisma.taskList.findMany({
      where: {
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
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json(
      { data: taskLists } as ApiResponse,
      { status: 200 }
    )
  } catch (error) {
    console.error('Get task lists error:', error)
    return NextResponse.json(
      { error: 'Internal server error' } as ApiResponse,
      { status: 500 }
    )
  }
}
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' } as ApiResponse,
        { status: 401 }
      )
    }

    const { name, description } = await request.json()

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required' } as ApiResponse,
        { status: 400 }
      )
    }

    const taskList = await prisma.taskList.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        ownerId: user.userId
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
        tasks: true 
      }
    })

    return NextResponse.json(
      {
        data: taskList,
        message: 'Task list created successfully'
      } as ApiResponse,
      { status: 201 }
    )
  } catch (error) {
    console.error('Create task list error:', error)
    return NextResponse.json(
      { error: 'Internal server error' } as ApiResponse,
      { status: 500 }
    )
  }
}
