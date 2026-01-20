import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

type Task = Prisma.TaskGetPayload<{}>

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
      return new NextResponse('Task list not found', { status: 404 })
    }

    // CSV Header
    const headers: string[] = ['Title', 'Status', 'Deadline', 'Created At']

    // CSV Rows
    const rows: string[][] = taskList.tasks.map((task: Task) => [
      task.title,
      task.status,
      task.deadline
        ? new Date(task.deadline).toLocaleDateString('id-ID')
        : '-',
      new Date(task.createdAt).toLocaleDateString('id-ID')
    ])

    const csv = [
      headers.join(','),
      ...rows.map((row: string[]) =>
        row.map((cell: string) => `"${cell}"`).join(',')
      )
    ].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${taskList.name.replace(
          /[^a-z0-9]/gi,
          '_'
        )}.csv"`
      }
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    console.error('Export task list error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
