import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireAuth()
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
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
      tasks: {
        where: { deletedAt: null },
        orderBy: { order: 'asc' }
      }
    }
  })

  if (!taskList) {
    return new NextResponse('Not found', { status: 404 })
  }

  const csv = [
    'Title,Status,Deadline,Created At',
    ...taskList.tasks.map(t =>
      `"${t.title}","${t.status}","${t.deadline ?? '-'}","${t.createdAt.toISOString()}"`
    )
  ].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${taskList.name}.csv"`
    }
  })
}
