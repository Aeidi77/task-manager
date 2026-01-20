'use client'

import { useEffect, useState } from 'react'
import { usePolling } from '@/hooks/use-polling'
import { useToast } from '@/hooks/use-toast'
import { Bell } from 'lucide-react'
import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Badge } from './ui/badge'

interface TaskUpdate {
  taskListId: string
  taskListName: string
  updatedAt: string
  updatedBy: string
}

interface NotificationsProps {
  userId: string
}

export function RealtimeNotifications({ userId }: NotificationsProps) {
  const [lastCheck, setLastCheck] = useState<Date>(new Date())
  const [notifications, setNotifications] = useState<TaskUpdate[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const { toast } = useToast()

  const fetchUpdates = async () => {
    const res = await fetch('/api/task-lists')
    const data = await res.json()
    return data.data || []
  }

  const { data: taskLists } = usePolling(fetchUpdates, 10000) // Poll every 10 seconds

  useEffect(() => {
    if (!taskLists) return

    const newUpdates: TaskUpdate[] = []

    taskLists.forEach((taskList: any) => {
      const updatedAt = new Date(taskList.updatedAt)
      
      // Check if updated after last check and not by current user
      if (updatedAt > lastCheck && taskList.ownerId !== userId) {
        // Check if any collaborator made the update
        const isCollaboratorUpdate = taskList.collaborators.some(
          (c: any) => c.userId !== userId
        )

        if (isCollaboratorUpdate) {
          newUpdates.push({
            taskListId: taskList.id,
            taskListName: taskList.name,
            updatedAt: taskList.updatedAt,
            updatedBy: taskList.owner.email
          })
        }
      }
    })

    if (newUpdates.length > 0) {
      setNotifications((prev) => [...newUpdates, ...prev].slice(0, 10)) // Keep last 10
      setUnreadCount((prev) => prev + newUpdates.length)

      // Show toast for first new update
      toast({
        title: 'New Update',
        description: `${newUpdates[0].taskListName} has been updated`
      })
    }

    setLastCheck(new Date())
  }, [taskLists, userId])

  const handleClearAll = () => {
    setNotifications([])
    setUnreadCount(0)
  }

  const handleMarkAsRead = () => {
    setUnreadCount(0)
  }

  return (
    <DropdownMenu onOpenChange={(open) => open && handleMarkAsRead()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={handleClearAll}
            >
              Clear all
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No new notifications
          </div>
        ) : (
          notifications.map((notif, index) => (
            <DropdownMenuItem key={index} className="flex flex-col items-start p-3">
              <div className="font-medium">{notif.taskListName}</div>
              <div className="text-xs text-muted-foreground">
                Updated by {notif.updatedBy}
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(notif.updatedAt).toLocaleString('id-ID')}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}