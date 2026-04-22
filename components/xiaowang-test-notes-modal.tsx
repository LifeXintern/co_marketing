'use client'

import { NotesModal, type NotesModalProps, type Note } from './notes-modal'

export type { Note as XiaoWangTestNote }

export function XiaoWangTestNotesModal(props: Omit<NotesModalProps, 'title' | 'accentColor' | 'apiBase' | 'fileInputId'>) {
  return (
    <NotesModal
      {...props}
      title="小王测试 笔记列表"
      accentColor="blue"
      apiBase="/api/xiaowang-test-notes"
      fileInputId="xiaowang-test-file-upload"
    />
  )
}
