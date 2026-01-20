import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApiResponse } from '@/types'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const { id } = params
    const body = await request.json()
    const { email } = body

    if (!email || email.trim() === '') {
      return NextResponse.json(
        { error: 'Email is required' } as ApiResponse,
        { status: 400 }
      )
    }

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

    // Cari user yang akan diundang
    const invitedUser = await prisma.user.findUnique({
      where: { email: email.trim() }
    })

    if (!invitedUser) {
      return NextResponse.json(
        { error: 'User with this email not found' } as ApiResponse,
        { status: 404 }
      )
    }

    // Cek apakah sudah collaborator atau owner
    if (invitedUser.id === user.userId) {
      return NextResponse.json(
        { error: 'You cannot invite yourself' } as ApiResponse,
        { status: 400 }
      )
    }

    const existingCollaborator = await prisma.collaborator.findUnique({
      where: {
        taskListId_userId: {
          taskListId: id,
          userId: invitedUser.id
        }
      }
    })

    if (existingCollaborator) {
      return NextResponse.json(
        { error: 'User is already a collaborator' } as ApiResponse,
        { status: 409 }
      )
    }

    // Tambahkan sebagai collaborator
    const collaborator = await prisma.collaborator.create({
      data: {
        taskListId: id,
        userId: invitedUser.id
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(
      { 
        data: collaborator, 
        message: 'Collaborator added successfully' 
      } as ApiResponse,
      { status: 201 }
    )
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' } as ApiResponse,
        { status: 401 }
      )
    }
    console.error('Invite collaborator error:', error)
    return NextResponse.json(
      { error: 'Internal server error' } as ApiResponse,
      { status: 500 }
    )
  }
}