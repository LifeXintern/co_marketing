/**
 * Utility functions for parsing and filtering dates and weeks.
 */

// 将各类日期输入格式化为标准Date对象
export function parseDate(dateInput: string | number): Date | null {
  if (!dateInput && dateInput !== 0) return null
  
  try {
    // 处理 Excel 序列号格式（数字）
    if (typeof dateInput === 'number' || !isNaN(Number(dateInput))) {
      const excelDate = Number(dateInput)
      // Excel 日期从 1900/1/1 开始，序列号为 1
      // JavaScript 日期从 1970/1/1 开始
      // Excel 错误地将 1900 年当作闰年，所以要减去 2 天
      const date = new Date((excelDate - 25569) * 86400 * 1000)
      return isNaN(date.getTime()) ? null : date
    }
    
    // 处理字符串格式
    const dateStr = String(dateInput)
    
    // 处理 "9/20/24" 格式
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/')
      if (parts.length === 3) {
        const month = parseInt(parts[0])
        const day = parseInt(parts[1])
        let year = parseInt(parts[2])
        
        // 处理两位数年份
        if (year < 100) {
          year = year > 50 ? 1900 + year : 2000 + year
        }
        
        return new Date(year, month - 1, day)
      }
    }
    
    // 尝试直接解析
    const date = new Date(dateStr)
    return isNaN(date.getTime()) ? null : date
  } catch {
    return null
  }
}

// 将类似 "2024/wk44" 的周次转换为日期范围，包括周一和周日
export function parseWeekToDateRange(weekStr: string): { start: Date, end: Date } | null {
  if (!weekStr) return null;
  const match = weekStr.match(/(\d{4})\/wk(\d+)/)
  if (!match) return null
  
  const year = parseInt(match[1])
  const weekNum = parseInt(match[2])
  
  // 计算该年第一天
  const firstDay = new Date(year, 0, 1)
  const dayOfWeek = firstDay.getDay()
  
  // 计算第一周的开始（周一）
  const firstMonday = new Date(firstDay)
  firstMonday.setDate(firstDay.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1))
  
  // 计算目标周的开始
  const weekStart = new Date(firstMonday)
  weekStart.setDate(firstMonday.getDate() + (weekNum - 1) * 7)
  
  // 计算目标周的结束
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  
  return { start: weekStart, end: weekEnd }
}
