'use client'

import { NotesModal, type NotesModalProps, type Note } from './notes-modal'

export type { Note as LifeCarNote }

export function LifeCarNotesModal(props: Omit<NotesModalProps, 'title' | 'accentColor' | 'apiBase' | 'fileInputId'>) {
  return (
    <NotesModal
      {...props}
      title="LifeCar 笔记列表"
      accentColor="purple"
      apiBase="/api/lifecar-notes"
      fileInputId="lifecar-file-upload"
    />
  )
}
