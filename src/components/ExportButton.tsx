'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Download } from 'lucide-react'
import { toast } from 'sonner'

interface ExportButtonProps {
  taskListId: string
  taskListName: string
}

export function ExportButton({ taskListId, taskListName }: ExportButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)

    try {
      const res = await fetch(`/api/task-lists/${taskListId}/export`)

      if (!res.ok) {
        throw new Error('Failed to export task list')
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = `${taskListName.replace(/[^a-z0-9]/gi, '_')}.csv`

      document.body.appendChild(a)
      a.click()

      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Task list exported successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to export task list')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={loading}
    >
      <Download className="mr-2 h-4 w-4" />
      {loading ? 'Exporting...' : 'Export CSV'}
    </Button>
  )
}
