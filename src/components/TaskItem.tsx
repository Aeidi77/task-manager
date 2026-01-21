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
  Redo,
} from 'lucide-react'
import { toast } from 'sonner'
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

  const initialState: TaskState = {
    title: task.title,
    status: task.status,
    deadline: task.deadline
      ? new Date(task.deadline).toISOString().split('T')[0]
      : '',
  }

  const { state, setState, undo, redo, canUndo, canRedo } =
    useUndoRedo<TaskState>(initialState)

  const [title, setTitle] = useState(state.title)
  const [status, setStatus] = useState(state.status)
  const [deadline, setDeadline] = useState(state.deadline)

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
        body: JSON.stringify({ title, status, deadline: deadline || null }),
      })

      if (!res.ok) throw new Error('Failed to update task')

      setState({ title, status, deadline })

      toast.success('Task updated')
      setEditing(false)
      router.refresh()
    } catch (err: any) {
      toast.error('Update failed', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return
    setLoading(true)

    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete task')

      toast.success('Task deleted')
      router.refresh()
    } catch (err: any) {
      toast.error('Delete failed', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleMove = async (direction: 'up' | 'down') => {
    const index = tasks.findIndex((t) => t.id === task.id)
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === tasks.length - 1)
    )
      return

    const swapTask = tasks[direction === 'up' ? index - 1 : index + 1]

    try {
      await Promise.all([
        fetch(`/api/tasks/${task.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: swapTask.order }),
        }),
        fetch(`/api/tasks/${swapTask.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: task.order }),
        }),
      ])
      router.refresh()
    } catch {
      toast.error('Failed to reorder tasks')
    }
  }

  return (
    <div className="flex items-center gap-2 p-3 border rounded-lg">
      {editing ? (
        <>
          <div className="flex-1 space-y-2">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
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
              <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={undo} disabled={!canUndo}><Undo size={16} /></Button>
              <Button size="icon" variant="ghost" onClick={redo} disabled={!canRedo}><Redo size={16} /></Button>
            </div>
          </div>
          <Button size="icon" onClick={handleUpdate}><Check size={16} /></Button>
          <Button size="icon" variant="ghost" onClick={() => setEditing(false)}><X size={16} /></Button>
        </>
      ) : (
        <>
          <div className="flex-1">
            <div className="font-medium">{task.title}</div>
            {task.deadline && (
              <div className="text-xs text-muted-foreground flex gap-1">
                <Calendar size={12} /> {formatDate(task.deadline)}
              </div>
            )}
          </div>
          <Button size="icon" variant="ghost" onClick={() => handleMove('up')}><ChevronUp size={16} /></Button>
          <Button size="icon" variant="ghost" onClick={() => handleMove('down')}><ChevronDown size={16} /></Button>
          <Button size="icon" variant="ghost" onClick={() => setEditing(true)}><Edit2 size={16} /></Button>
          <Button size="icon" variant="ghost" onClick={handleDelete}><Trash2 size={16} /></Button>
        </>
      )}
    </div>
  )
}
