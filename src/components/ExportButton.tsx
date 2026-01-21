'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

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
        const errorText = await res.text()
        throw new Error(errorText || 'Failed to export task list')
      }

      const text = await res.text()
      const lines = text.split('\n')

      const data = lines.map((line, index) => {
        const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)
        if (!values) return []

        return values.map(val => {
          let v = val.replace(/^"|"$/g, '')

          if (index > 0) {
            if (v.match(/\d{4}-\d{2}-\d{2}T/)) {
              const d = new Date(v)
              if (!isNaN(d.getTime())) {
                const local = new Date(d.getTime() + 7 * 60 * 60 * 1000)
                const yyyy = local.getFullYear()
                const mm = String(local.getMonth() + 1).padStart(2, '0')
                const dd = String(local.getDate()).padStart(2, '0')
                const hh = String(local.getHours()).padStart(2, '0')
                const min = String(local.getMinutes()).padStart(2, '0')
                const ss = String(local.getSeconds()).padStart(2, '0')
                v = `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`
              }
            }
          }

          return v
        })
      })

      const ws = XLSX.utils.aoa_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'TaskList')

      XLSX.writeFile(wb, `${taskListName.replace(/[^a-z0-9]/gi, '_')}.xlsx`)

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
      {loading ? 'Exporting...' : 'Export Excel'}
    </Button>
  )
}
