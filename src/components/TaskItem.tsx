'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Input } from './ui/input'
import { 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Calendar,
  Check,
  Edit2,
  X,
  Undo,
  Redo
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/utils'
import { useUndoRedo } from '@/hooks/use-undo-redo'

interface Task {
  id: string
  title: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  deadline: Date | null
  order: number
}

interface TaskItemProps {
  task: Task
  tasks: Task[]
}

interface TaskState {
  title: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  deadline: string
}

export function TaskItem({ task, tasks }: TaskItemProps) {
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const initialState: TaskState = {
    title: task.title,
    status: task.status,
    deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : ''
  }

  const { state, setState, undo, redo, canUndo, canRedo } = useUndoRedo<TaskState>(initialState)

  const [title, setTitle] = useState(state.title)
  const [status, setStatus] = useState(state.status)
  const [deadline, setDeadline] = useState(state.deadline)

  // Sync with undo/redo state
  useEffect(() => {
    setTitle(state.title)
    setStatus(state.status)
    setDeadline(state.deadline)
  }, [state])

  const handleUpdate = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          status,
          deadline: deadline || null
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update task')
      }

      // Save to history
      setState({ title, status, deadline })

      toast({
        title: 'Success',
        description: 'Task updated successfully'
      })

      setEditing(false)
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUndo = () => {
    undo()
    toast({
      title: 'Undo',
      description: 'Reverted to previous state'
    })
  }

  const handleRedo = () => {
    redo()
    toast({
      title: 'Redo',
      description: 'Restored to next state'
    })
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return

    setLoading(true)
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete task')
      }

      toast({
        title: 'Success',
        description: 'Task deleted successfully'
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMove = async (direction: 'up' | 'down') => {
    const currentIndex = tasks.findIndex(t => t.id === task.id)
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === tasks.length - 1)
    ) {
      return
    }

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    const swapTask = tasks[swapIndex]

    setLoading(true)
    try {
      await Promise.all([
        fetch(`/api/tasks/${task.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: swapTask.order })
        }),
        fetch(`/api/tasks/${swapTask.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: task.order })
        })
      ])

      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to reorder tasks',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const statusColors = {
    TODO: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    IN_PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    DONE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  }

  return (
    <div className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent/50">
      {editing ? (
        <>
          <div className="flex-1 space-y-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
            />
            <div className="flex gap-2">
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="DONE">Done</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-[180px]"
              />
            </div>
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={handleUndo}
                disabled={!canUndo}
                title="Undo"
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleRedo}
                disabled={!canRedo}
                title="Redo"
              >
                <Redo className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button size="icon" variant="ghost" onClick={handleUpdate} disabled={loading}>
            <Check className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setEditing(false)}>
            <X className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <>
          <div className="flex-1">
            <div className="font-medium">{task.title}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded ${statusColors[task.status]}`}>
                {task.status.replace('_', ' ')}
              </span>
              {task.deadline && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(task.deadline)}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleMove('up')}
              disabled={loading || tasks.findIndex(t => t.id === task.id) === 0}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleMove('down')}
              disabled={loading || tasks.findIndex(t => t.id === task.id) === tasks.length - 1}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setEditing(true)}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleDelete}
              disabled={loading}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </>
      )}
    </div>
  )
}