import { NextResponse } from 'next/server'

export async function DELETE() {
  return NextResponse.json({ success: true, message: '数据已清除' })
}
