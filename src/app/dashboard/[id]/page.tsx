import { redirect, notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/Navbar'
import { TaskList } from '@/components/TaskList'
import { InviteCollaboratorDialog } from '@/components/InviteCollaboratorDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Download, Trash2, Users } from 'lucide-react'
import Link from 'next/link'
import { DeleteTaskListButton } from '@/components/DeleteTaskListButton'
import { ExportButton } from '@/components/ExportButton'

export default async function TaskListDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await requireAuth()

  const taskList = await prisma.taskList.findFirst({
    where: {
      id: params.id,
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
        },
        orderBy: {
          createdAt: 'asc'
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
    notFound()
  }

  const isOwner = taskList.ownerId === user.userId
  const allMembers = [
    { ...taskList.owner, isOwner: true },
    ...taskList.collaborators.map(c => ({ ...c.user, isOwner: false }))
  ]

  const stats = {
    total: taskList.tasks.length,
    todo: taskList.tasks.filter(t => t.status === 'TODO').length,
    inProgress: taskList.tasks.filter(t => t.status === 'IN_PROGRESS').length,
    done: taskList.tasks.filter(t => t.status === 'DONE').length,
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{taskList.name}</h1>
              {taskList.description && (
                <p className="text-muted-foreground mt-2">
                  {taskList.description}
                </p>
              )}
              {!isOwner && (
                <Badge variant="secondary" className="mt-2">
                  Shared with you
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <ExportButton taskListId={taskList.id} taskListName={taskList.name} />
              {isOwner && (
                <>
                  <InviteCollaboratorDialog taskListId={taskList.id} />
                  <DeleteTaskListButton taskListId={taskList.id} />
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Tasks</CardDescription>
                  <CardTitle className="text-2xl">{stats.total}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>To Do</CardDescription>
                  <CardTitle className="text-2xl text-gray-600">{stats.todo}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>In Progress</CardDescription>
                  <CardTitle className="text-2xl text-blue-600">{stats.inProgress}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Done</CardDescription>
                  <CardTitle className="text-2xl text-green-600">{stats.done}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Tasks */}
            <Card>
              <CardHeader>
                <CardTitle>Tasks</CardTitle>
                <CardDescription>
                  Manage your tasks and track progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TaskList taskListId={taskList.id} tasks={taskList.tasks} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Members ({allMembers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allMembers.map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {member.name
                            ? member.name.substring(0, 2).toUpperCase()
                            : member.email.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {member.name || member.email}
                          {member.id === user.userId && (
                            <span className="text-muted-foreground"> (You)</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.email}
                        </p>
                      </div>
                      {member.isOwner && (
                        <Badge variant="outline" className="text-xs">
                          Owner
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}