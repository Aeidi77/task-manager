import { redirect } from 'next/navigation'
import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Navbar } from '@/components/Navbar'
import { CreateTaskListDialog } from '@/components/CreateTaskListDialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, ListTodo } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface TaskListWithDetails {
  id: string
  name: string
  description: string | null
  ownerId: string
  updatedAt: Date
  owner: {
    id: string
    email: string
    name: string | null
  }
  collaborators: {
    user: {
      id: string
      email: string
      name: string | null
    }
  }[]
  tasks: {
    status: string
  }[]
}

export default async function DashboardPage() {
  const user = await requireAuth()

  if (!user) {
    redirect('/login')
  }

  const taskLists = await prisma.taskList.findMany({
    where: {
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
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })


 

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">My Task Lists</h1>
            <p className="text-muted-foreground mt-1">
              Manage and organize your tasks efficiently
            </p>
          </div>
          <CreateTaskListDialog />
        </div>

        {taskLists.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ListTodo className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No task lists yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first task list to get started
              </p>
              <CreateTaskListDialog />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* PERBAIKAN: Tambahkan tipe ': TaskListWithDetails' pada 'taskList' */}
            {taskLists.map((taskList: TaskListWithDetails) => {
              const totalTasks = taskList.tasks.length
              const completedTasks = taskList.tasks.filter(
                (t) => t.status === 'DONE'
              ).length
              const isOwner = taskList.ownerId === user.userId

              return (
                <Link key={taskList.id} href={`/dashboard/${taskList.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="line-clamp-1">
                            {taskList.name}
                          </CardTitle>
                          <CardDescription className="line-clamp-2 mt-1">
                            {taskList.description || 'No description'}
                          </CardDescription>
                        </div>
                        {!isOwner && (
                          <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded">
                            Shared
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">
                            {totalTasks === 0
                              ? '0%'
                              : `${Math.round((completedTasks / totalTasks) * 100)}%`}
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{
                              width:
                                totalTasks === 0
                                  ? '0%'
                                  : `${(completedTasks / totalTasks) * 100}%`
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <ListTodo className="h-4 w-4" />
                            <span>
                              {completedTasks}/{totalTasks} tasks
                            </span>
                          </div>
                          {taskList.collaborators.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{taskList.collaborators.length + 1}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Updated {formatDate(taskList.updatedAt)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}