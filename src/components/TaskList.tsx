'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'
import { Input } from './ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { TaskItem } from './TaskItem'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

interface Task {
  id: string
  title: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  deadline: Date | null
  order: number
}

interface TaskListProps {
  taskListId: string
  tasks: Task[]
}

export function TaskList({ taskListId, tasks }: TaskListProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState<'TODO' | 'IN_PROGRESS' | 'DONE'>('TODO')
  const [deadline, setDeadline] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, status, deadline: deadline || null, taskListId }),
      })

      if (!res.ok) throw new Error('Failed to create task')

      toast.success('Task created')
      setIsAdding(false)
      setTitle('')
      setStatus('TODO')
      setDeadline('')
      router.refresh()
    } catch (err: any) {
      toast.error('Create failed', { description: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} tasks={tasks} />
      ))}

      {isAdding ? (
        <form onSubmit={handleAddTask} className="border p-3 rounded-lg space-y-3">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Select value={status} onValueChange={(v: any) => setStatus(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="TODO">To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="DONE">Done</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>Add</Button>
            <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" className="w-full" onClick={() => setIsAdding(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Task
        </Button>
      )}
    </div>
  )
}
