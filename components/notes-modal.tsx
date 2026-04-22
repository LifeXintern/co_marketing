'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { X, ExternalLink, FileText, Upload, Trash2 } from "lucide-react"

export interface Note {
  发布时间: string | number
  类型: string
  名称: string
  链接: string
  views?: number
  likes?: number
  comments?: number
  saves?: number
  followers?: number
  shares?: number
  videoCompletionRate?: number
  organicImpressions?: number
}

// Full Tailwind class strings required — no dynamic interpolation (purge safety)
const COLOR_CONFIG = {
  blue: {
    icon: 'text-blue-600',
    spinner: 'border-blue-600',
    badge: 'bg-blue-100 text-blue-700',
    dateSelected: 'bg-blue-100 text-blue-700',
    dateHover: 'hover:text-blue-600',
    link: 'text-blue-600 hover:text-blue-800',
  },
  purple: {
    icon: 'text-purple-600',
    spinner: 'border-purple-600',
    badge: 'bg-purple-100 text-purple-700',
    dateSelected: 'bg-purple-100 text-purple-700',
    dateHover: 'hover:text-purple-600',
    link: 'text-purple-600 hover:text-purple-800',
  },
} as const

export interface NotesModalProps {
  title: string
  accentColor: keyof typeof COLOR_CONFIG
  apiBase: string
  fileInputId: string
  isOpen: boolean
  onClose: () => void
  onDateSelect?: (date: string) => void
  selectedDates?: string[]
  onDataUpdate?: (data: Note[]) => void
  initialData?: Note[]
}

function convertDateFormat(noteDate: any): string {
  if (!noteDate) return ''
  if (typeof noteDate === 'number') {
    const d = new Date((noteDate - 25569) * 86400 * 1000)
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0]
  }
  if (noteDate instanceof Date) {
    return isNaN(noteDate.getTime()) ? '' : noteDate.toISOString().split('T')[0]
  }
  return String(noteDate).split(' ')[0]
}

export function NotesModal({
  title,
  accentColor,
  apiBase,
  fileInputId,
  isOpen,
  onClose,
  onDateSelect,
  selectedDates = [],
  onDataUpdate,
  initialData = [],
}: NotesModalProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dataSource, setDataSource] = useState<'uploaded' | 'default' | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const c = COLOR_CONFIG[accentColor]

  useEffect(() => {
    if (isOpen) {
      if (initialData && initialData.length > 0) {
        setNotes([...initialData].sort((a, b) =>
          convertDateFormat(b.发布时间).localeCompare(convertDateFormat(a.发布时间))
        ))
        setDataSource('uploaded')
        setError(null)
      } else {
        fetchNotes()
      }
    }
  }, [isOpen, initialData])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose() }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const fetchNotes = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(apiBase)
      if (!response.ok) throw new Error('Failed to fetch notes')
      const result = await response.json()
      if (result.success) {
        setNotes((result.data || []).sort((a: Note, b: Note) =>
          convertDateFormat(b.发布时间).localeCompare(convertDateFormat(a.发布时间))
        ))
        setDataSource(result.source || null)
      } else {
        throw new Error(result.error || 'Unknown error')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notes')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const response = await fetch(`${apiBase}/upload`, { method: 'POST', body: formData })
      if (!response.ok) throw new Error('Failed to upload file')
      const result = await response.json()
      if (result.success) {
        const sorted = (result.data || []).sort((a: Note, b: Note) =>
          convertDateFormat(b.发布时间).localeCompare(convertDateFormat(a.发布时间))
        )
        setNotes(sorted)
        setDataSource('uploaded')
        onDataUpdate?.(result.data)
        if (fileInputRef.current) fileInputRef.current.value = ''
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const handleClearData = async () => {
    if (!confirm('确定要清除所有数据吗？')) return
    try {
      const response = await fetch(`${apiBase}/clear`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to clear data')
      setNotes([])
      setError(null)
      setDataSource(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear data')
    }
  }

  const handleDateClick = (noteDate: any) => onDateSelect?.(convertDateFormat(noteDate))
  const isDateSelected = (noteDate: any) => selectedDates.includes(convertDateFormat(noteDate))

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-4xl mx-4 bg-white rounded-lg shadow-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FileText className={`w-5 h-5 ${c.icon}`} />
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
              id={fileInputId}
            />
            <label htmlFor={fileInputId}>
              <Button variant="outline" size="sm" disabled={uploading} className="cursor-pointer" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? '上传中...' : '上传文件'}
                </span>
              </Button>
            </label>
            {notes.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearData}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                清除数据
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 hover:bg-gray-100">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${c.spinner}`} />
              <span className="ml-3 text-gray-600">加载中...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <div className="text-red-600 mb-2">加载失败</div>
              <div className="text-gray-500 text-sm mb-4">{error}</div>
              <Button onClick={fetchNotes} variant="outline" size="sm">重试</Button>
            </div>
          )}

          {!loading && !error && notes.length === 0 && (
            <div className="text-center py-12 text-gray-500">没有找到笔记数据</div>
          )}

          {!loading && !error && notes.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4 p-3 bg-gray-50 rounded-lg font-medium text-gray-700">
                <div className="col-span-3">Date</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-7">Post Name</div>
              </div>

              {notes.map((note, index) => (
                <div key={index} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors space-y-2">
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-3 text-sm">
                      <button
                        onClick={() => handleDateClick(note.发布时间)}
                        className={`text-left transition-all cursor-pointer px-2 py-1 rounded ${
                          isDateSelected(note.发布时间)
                            ? `${c.dateSelected} font-semibold`
                            : `text-gray-600 ${c.dateHover} hover:underline`
                        }`}
                        title={isDateSelected(note.发布时间) ? "Click to deselect" : "Click to highlight date in chart"}
                      >
                        {isDateSelected(note.发布时间) && '✓ '}
                        {convertDateFormat(note.发布时间)}
                      </button>
                    </div>
                    <div className="col-span-2">
                      <span className={`inline-block px-2 py-1 ${c.badge} rounded text-xs`}>{note.类型}</span>
                    </div>
                    <div className="col-span-7">
                      {note.链接 && note.链接.trim() ? (
                        <button
                          onClick={() => window.open(note.链接, '_blank', 'noopener,noreferrer')}
                          className={`text-left w-full ${c.link} hover:underline flex items-center gap-1 group`}
                          title="Open link"
                        >
                          <span>{note.名称}</span>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ) : (
                        <span className="text-gray-800">{note.名称}</span>
                      )}
                    </div>
                  </div>
                  {(note.views || note.likes || note.comments || note.saves || note.followers || note.shares || note.videoCompletionRate || note.organicImpressions) ? (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 pl-1">
                      {note.views != null && <span>Views: <span className="font-medium text-gray-700">{note.views.toLocaleString()}</span></span>}
                      {note.likes != null && <span>Likes: <span className="font-medium text-gray-700">{note.likes.toLocaleString()}</span></span>}
                      {note.comments != null && <span>Comments: <span className="font-medium text-gray-700">{note.comments.toLocaleString()}</span></span>}
                      {note.saves != null && <span>Saves: <span className="font-medium text-gray-700">{note.saves.toLocaleString()}</span></span>}
                      {note.followers != null && <span>Followers: <span className="font-medium text-gray-700">{note.followers.toLocaleString()}</span></span>}
                      {note.shares != null && <span>Shares: <span className="font-medium text-gray-700">{note.shares.toLocaleString()}</span></span>}
                      {note.videoCompletionRate != null && note.videoCompletionRate > 0 && <span>Completion: <span className="font-medium text-gray-700">{note.videoCompletionRate.toFixed(1)}%</span></span>}
                      {note.organicImpressions != null && <span>Organic Impr: <span className="font-medium text-gray-700">{note.organicImpressions.toLocaleString()}</span></span>}
                    </div>
                  ) : null}
                </div>
              ))}

              <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-200">
                共 {notes.length} 条记录
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
