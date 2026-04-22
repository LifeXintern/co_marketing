// LifeCAR数据处理器
export interface LifeCarDailyData {
  date: string
  spend: number
  impressions: number
  clicks: number
  clickRate: number
  avgClickCost: number
  cpm: number
  likes: number
  comments: number
  saves: number
  followers: number
  shares: number
  interactions: number
  avgInteractionCost: number
  actionButtonClicks: number
  actionButtonClickRate: number
  screenshots: number
  imageSaves: number
  searchClicks: number
  searchConversionRate: number
  avgReadNotesAfterSearch: number
  readCountAfterSearch: number
  multiConversion1: number // 多转化人数（添加企微+私信咨询）
  multiConversionCost1: number
  multiConversion2: number // 多转化人数（添加企微成功+私信留资）
  multiConversionCost2: number
}

export interface LifeCarMonthlyData {
  month: string
  totalSpend: number
  totalFollowers: number
  totalInteractions: number
  totalImpressions: number
  avgDailySpend: number
  avgDailyInteractions: number
  cpm: number // 每千次展现成本
  cpi: number // 每次互动成本
}

export interface LifeCarWeeklyData {
  week: string
  totalSpend: number
  totalFollowers: number
  totalInteractions: number
  totalImpressions: number
  avgDailySpend: number
}

// RMB转AUD汇率常量 (4.7 RMB = 1 AUD)
const RMB_TO_AUD_RATE = 4.7

// 解析CSV数据
export function parseLifeCarData(csvText: string): LifeCarDailyData[] {
  // Remove BOM if present
  let cleanText = csvText
  if (cleanText.charCodeAt(0) === 0xFEFF) {
    cleanText = cleanText.substring(1)
  }

  const lines = cleanText.trim().split('\n')
  const data: LifeCarDailyData[] = []

  if (lines.length < 2) return data

  // Build header name → column index map from the first row
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const headerMap: Record<string, number> = {}
  headers.forEach((h, i) => { headerMap[h] = i })

  // Get a cell value by column name; accepts multiple fallback names for resilience
  const col = (columns: string[], ...names: string[]): string => {
    for (const name of names) {
      const idx = headerMap[name]
      if (idx !== undefined && columns[idx] !== undefined) {
        return columns[idx].trim().replace(/^"|"$/g, '')
      }
    }
    return ''
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    if (line.includes('合计')) continue

    const columns = line.split(',')

    const dateRaw = col(columns, '时间', 'Date', '日期')

    // 解析日期格式：支持三种格式 YYYY-MM-DD、YYYY-MM-DD HH:MM:SS 和 DD/MM/YYYY
    let formattedDate = ''
    if (dateRaw.match(/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/)) {
      formattedDate = dateRaw.substring(0, 10)
    } else if (dateRaw.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
      const [day, month, year] = dateRaw.split('/')
      formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    } else {
      continue
    }

    data.push({
      date: formattedDate,
      spend: (parseFloat(col(columns, '消费')) || 0) / RMB_TO_AUD_RATE,
      impressions: parseInt(col(columns, '展现量')) || 0,
      clicks: parseInt(col(columns, '点击量')) || 0,
      clickRate: parseFloat(col(columns, '点击率').replace('%', '')) || 0,
      avgClickCost: (parseFloat(col(columns, '平均点击成本')) || 0) / RMB_TO_AUD_RATE,
      cpm: (() => { const imp = parseInt(col(columns, '展现量')) || 0; return imp > 0 ? ((parseFloat(col(columns, '消费')) || 0) / RMB_TO_AUD_RATE / imp) * 1000 : 0 })(),
      likes: parseInt(col(columns, '点赞')) || 0,
      comments: parseInt(col(columns, '评论')) || 0,
      saves: parseInt(col(columns, '收藏')) || 0,
      followers: parseInt(col(columns, '关注')) || 0,
      shares: parseInt(col(columns, '分享')) || 0,
      interactions: parseInt(col(columns, '互动量')) || 0,
      avgInteractionCost: (parseFloat(col(columns, '平均互动成本')) || 0) / RMB_TO_AUD_RATE,
      actionButtonClicks: parseInt(col(columns, '行动按钮点击量')) || 0,
      actionButtonClickRate: parseFloat(col(columns, '行动按钮点击率').replace('%', '')) || 0,
      screenshots: parseInt(col(columns, '截图')) || 0,
      imageSaves: parseInt(col(columns, '保存图片')) || 0,
      searchClicks: parseInt(col(columns, '搜索组件点击量')) || 0,
      searchConversionRate: parseFloat(col(columns, '搜索组件点击转化率').replace('%', '')) || 0,
      avgReadNotesAfterSearch: parseFloat(col(columns, '平均搜索后阅读笔记篇数')) || 0,
      readCountAfterSearch: parseInt(col(columns, '搜后阅读量')) || 0,
      multiConversion1: parseInt(col(columns, '新增种草人群', '多转化人数（添加企微+私信咨询）', '多转化人数(添加企微+私信咨询)')) || 0,
      multiConversionCost1: (parseFloat(col(columns, '新增种草人群成本', '多转化成本（添加企微+私信咨询）', '多转化成本(添加企微+私信咨询)')) || 0) / RMB_TO_AUD_RATE,
      multiConversion2: parseInt(col(columns, '新增深度种草人群', '多转化人数（添加企微成功+私信留资）', '多转化人数(添加企微成功+私信留资)', '多转化人数（私信留资+添加企微成功）', '多转化人数(私信留资+添加企微成功)')) || 0,
      multiConversionCost2: (parseFloat(col(columns, '新增深度种草人群成本', '多转化成本（添加企微成功+私信留资）', '多转化成本(添加企微成功+私信留资)', '多转化成本（私信留资+添加企微成功）', '多转化成本(私信留资+添加企微成功)')) || 0) / RMB_TO_AUD_RATE,
    })
  }

  return data.sort((a, b) => a.date.localeCompare(b.date))
}

// 按月聚合数据
export function aggregateByMonth(dailyData: LifeCarDailyData[]): LifeCarMonthlyData[] {
  const monthlyMap: Record<string, LifeCarDailyData[]> = {}

  dailyData.forEach(item => {
    const month = item.date.substring(0, 7) // YYYY-MM
    if (!monthlyMap[month]) {
      monthlyMap[month] = []
    }
    monthlyMap[month].push(item)
  })
  
  return Object.entries(monthlyMap).map(([month, items]) => {
    const totalSpend = items.reduce((sum, item) => sum + item.spend, 0)
    const totalFollowers = items.reduce((sum, item) => sum + item.followers, 0)
    const totalInteractions = items.reduce((sum, item) => sum + item.interactions, 0)
    const totalImpressions = items.reduce((sum, item) => sum + item.impressions, 0)
    const daysCount = items.length

    return {
      month,
      totalSpend,
      totalFollowers,
      totalInteractions,
      totalImpressions,
      avgDailySpend: totalSpend / daysCount,
      avgDailyInteractions: totalInteractions / daysCount,
      cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
      cpi: totalInteractions > 0 ? totalSpend / totalInteractions : 0
    }
  }).sort((a, b) => a.month.localeCompare(b.month))
}

// 按周聚合数据
export function aggregateByWeek(dailyData: LifeCarDailyData[]): LifeCarWeeklyData[] {
  const weeklyMap: Record<string, LifeCarDailyData[]> = {}

  dailyData.forEach(item => {
    const date = new Date(item.date)
    const year = date.getFullYear()
    const weekNum = getWeekNumber(date)
    const weekKey = `${year}/wk${weekNum.toString().padStart(2, '0')}`
    
    if (!weeklyMap[weekKey]) {
      weeklyMap[weekKey] = []
    }
    weeklyMap[weekKey].push(item)
  })
  
  return Object.entries(weeklyMap).map(([week, items]) => {
    const totalSpend = items.reduce((sum, item) => sum + item.spend, 0)
    const totalFollowers = items.reduce((sum, item) => sum + item.followers, 0)
    const totalInteractions = items.reduce((sum, item) => sum + item.interactions, 0)
    const totalImpressions = items.reduce((sum, item) => sum + item.impressions, 0)
    const daysCount = items.length

    return {
      week,
      totalSpend,
      totalFollowers,
      totalInteractions,
      totalImpressions,
      avgDailySpend: totalSpend / daysCount
    }
  }).sort((a, b) => a.week.localeCompare(b.week))
}

// 计算周数
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}

// 按日期范围过滤数据
export function filterByDateRange(
  dailyData: LifeCarDailyData[], 
  startDate?: string, 
  endDate?: string
): LifeCarDailyData[] {
  if (!startDate && !endDate) return dailyData
  
  return dailyData.filter(item => {
    const itemDate = item.date
    if (startDate && itemDate < startDate) return false
    if (endDate && itemDate > endDate) return false
    return true
  })
}