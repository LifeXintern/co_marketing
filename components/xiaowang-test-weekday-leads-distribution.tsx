"use client"

import React, { useMemo, useState } from 'react'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Calendar as CalendarIcon } from "lucide-react"

interface XiaowangTestWeekdayLeadsDistributionProps {
  xiaowangTestData?: any
  brokerData?: any[]
  title?: string
  globalStartDate?: string  // 全局时间 filter
  globalEndDate?: string    // 全局时间 filter
  globalDailyLeadsAvg?: number  // 全局 Daily Leads Average (from Daily Leads & Cost Trend)
}

interface WeekdayData {
  weekday: string
  independentLeads: number     // 独立时间段的 leads (total)
  independentAvgLeads: number  // 独立时间段的 leads (daily average per weekday)
  globalLeads: number          // 全局时间段的 leads
}

// Process broker data to get leads by weekday
function processWeekdayLeads(brokerData: any[], startDate?: string, endDate?: string): Record<string, number> {
  const weekdayLeads: Record<string, number> = {
    'Mon': 0,
    'Tue': 0,
    'Wed': 0,
    'Thu': 0,
    'Fri': 0,
    'Sat': 0,
    'Sun': 0
  }

  if (!brokerData || brokerData.length === 0) return weekdayLeads

  // Count unique clients by weekday
  const uniqueClientsByWeekday: Record<string, Set<any>> = {
    'Mon': new Set(),
    'Tue': new Set(),
    'Wed': new Set(),
    'Thu': new Set(),
    'Fri': new Set(),
    'Sat': new Set(),
    'Sun': new Set()
  }

  brokerData.forEach(item => {
    const dateField = item.date || item['日期'] || item.Date || item.时间 || item['Date '] || item['date ']

    if (dateField && item.no !== null && item.no !== undefined) {
      let date: string

      // Handle different date formats
      if (typeof dateField === 'number') {
        const excelDate = new Date((dateField - 25569) * 86400 * 1000)
        date = excelDate.toISOString().split('T')[0]
      } else if (typeof dateField === 'string' && /^\d+$/.test(dateField)) {
        const excelSerialNumber = parseInt(dateField)
        const excelDate = new Date((excelSerialNumber - 25569) * 86400 * 1000)
        date = excelDate.toISOString().split('T')[0]
      } else if (dateField instanceof Date) {
        date = dateField.toISOString().split('T')[0]
      } else {
        date = String(dateField).split(' ')[0]
      }

      if (date && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Apply date filter if provided
        if (startDate && date < startDate) return
        if (endDate && date > endDate) return

        // Get weekday
        const dateObj = new Date(date)
        const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' })

        if (uniqueClientsByWeekday[weekday]) {
          uniqueClientsByWeekday[weekday].add(item.no)
        }
      }
    }
  })

  // Convert sets to counts
  Object.keys(uniqueClientsByWeekday).forEach(weekday => {
    weekdayLeads[weekday] = uniqueClientsByWeekday[weekday].size
  })

  return weekdayLeads
}

// Count occurrences of each weekday in the date range
function countWeekdayOccurrences(brokerData: any[], startDate?: string, endDate?: string): Record<string, number> {
  const weekdayCount: Record<string, number> = {
    'Mon': 0,
    'Tue': 0,
    'Wed': 0,
    'Thu': 0,
    'Fri': 0,
    'Sat': 0,
    'Sun': 0
  }

  if (!brokerData || brokerData.length === 0) return weekdayCount

  // Track unique dates that fall within the range
  const uniqueDates = new Set<string>()

  brokerData.forEach(item => {
    const dateField = item.date || item['日期'] || item.Date || item.时间 || item['Date '] || item['date ']

    if (dateField) {
      let date: string

      // Handle different date formats (same logic as processWeekdayLeads)
      if (typeof dateField === 'number') {
        const excelDate = new Date((dateField - 25569) * 86400 * 1000)
        date = excelDate.toISOString().split('T')[0]
      } else if (typeof dateField === 'string' && /^\d+$/.test(dateField)) {
        const excelSerialNumber = parseInt(dateField)
        const excelDate = new Date((excelSerialNumber - 25569) * 86400 * 1000)
        date = excelDate.toISOString().split('T')[0]
      } else if (dateField instanceof Date) {
        date = dateField.toISOString().split('T')[0]
      } else {
        date = String(dateField).split(' ')[0]
      }

      if (date && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Apply date filter if provided
        if (startDate && date < startDate) return
        if (endDate && date > endDate) return

        uniqueDates.add(date)
      }
    }
  })

  // Count occurrences of each weekday from unique dates
  uniqueDates.forEach(date => {
    const dateObj = new Date(date)
    const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' })
    if (weekdayCount[weekday] !== undefined) {
      weekdayCount[weekday]++
    }
  })

  return weekdayCount
}

export function XiaowangTestWeekdayLeadsDistribution({
  xiaowangTestData,
  brokerData = [],
  title = "Weekday Leads Distribution",
  globalStartDate,
  globalEndDate,
  globalDailyLeadsAvg = 0
}: XiaowangTestWeekdayLeadsDistributionProps) {
  // Component: Weekday Leads Distribution with dual Y-axis
  // Independent time filter state
  const [independentStartDate, setIndependentStartDate] = useState(globalStartDate || '')
  const [independentEndDate, setIndependentEndDate] = useState(globalEndDate || '')

  // Process data for independent time period (bar chart)
  const independentWeekdayLeads = useMemo(() => {
    return processWeekdayLeads(brokerData, independentStartDate, independentEndDate)
  }, [brokerData, independentStartDate, independentEndDate])

  // Count weekday occurrences for average calculation
  const independentWeekdayOccurrences = useMemo(() => {
    return countWeekdayOccurrences(brokerData, independentStartDate, independentEndDate)
  }, [brokerData, independentStartDate, independentEndDate])

  // Process data for global time period (line chart)
  const globalWeekdayLeads = useMemo(() => {
    return processWeekdayLeads(brokerData, globalStartDate, globalEndDate)
  }, [brokerData, globalStartDate, globalEndDate])

  // Combine data for chart
  const chartData: WeekdayData[] = useMemo(() => {
    const weekdayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return weekdayOrder.map(weekday => {
      const totalLeads = independentWeekdayLeads[weekday] || 0
      const occurrences = independentWeekdayOccurrences[weekday] || 1
      const avgLeads = occurrences > 0 ? totalLeads / occurrences : 0

      return {
        weekday,
        independentLeads: totalLeads,
        independentAvgLeads: avgLeads,
        globalLeads: globalWeekdayLeads[weekday] || 0
      }
    })
  }, [independentWeekdayLeads, independentWeekdayOccurrences, globalWeekdayLeads])

  // Calculate max values for each Y axis independently
  const { independentMaxValue, globalMaxValue } = useMemo(() => {
    const independentValues = chartData.map(d => d.independentLeads)
    const independentAvgValues = chartData.map(d => d.independentAvgLeads)
    const globalValues = chartData.map(d => d.globalLeads)

    const independentMax = Math.max(...independentValues, 1)
    const globalMax = Math.max(...globalValues, ...independentAvgValues, 1)

    return {
      independentMaxValue: Math.ceil(independentMax * 1.1),
      globalMaxValue: Math.ceil(globalMax * 1.1)
    }
  }, [chartData])

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50">
      <CardHeader>
        <div className="space-y-4">
          <CardTitle className="text-xl font-semibold text-gray-900 font-montserrat">
            {title}
          </CardTitle>

          {/* Independent Time Filter */}
          <div className="bg-purple-50/50 rounded-lg p-4 border border-purple-200/50">
            <div className="flex items-center gap-2 mb-3">
              <CalendarIcon className="h-4 w-4 text-purple-600" />
              <h3 className="text-sm font-bold text-gray-800 font-montserrat">Independent Time Filter (Bar Chart)</h3>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              {/* Start Date */}
              <div className="flex-1 min-w-[150px]">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1 font-montserrat mb-1">
                  <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                  Start Date
                </label>
                <Input
                  type="date"
                  value={independentStartDate}
                  onChange={(e) => setIndependentStartDate(e.target.value)}
                  min="2024-09-01"
                  max="2025-12-31"
                  className="w-full bg-white border-gray-300 text-gray-800 focus:border-purple-500 focus:ring-purple-500/20 h-9 text-sm"
                />
              </div>

              {/* End Date */}
              <div className="flex-1 min-w-[150px]">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1 font-montserrat mb-1">
                  <div className="w-1.5 h-1.5 bg-pink-600 rounded-full"></div>
                  End Date
                </label>
                <Input
                  type="date"
                  value={independentEndDate}
                  onChange={(e) => setIndependentEndDate(e.target.value)}
                  min="2024-09-01"
                  max="2025-12-31"
                  className="w-full bg-white border-gray-300 text-gray-800 focus:border-pink-500 focus:ring-pink-500/20 h-9 text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 60, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="weekday"
                tick={{ fontSize: 12, fill: '#6B7280' }}
              />

              {/* Left Y-axis for Independent Period (Bar) */}
              <YAxis
                yAxisId="independent"
                orientation="left"
                domain={[0, independentMaxValue]}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                label={{ value: 'Independent Period Leads', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
              />

              {/* Right Y-axis for Global Period (Line) */}
              <YAxis
                yAxisId="global"
                orientation="right"
                domain={[0, globalMaxValue]}
                tick={{ fontSize: 10, fill: '#F59E0B' }}
                label={{ value: 'Global Period Leads', angle: 90, position: 'insideRight', style: { fontSize: 10, fill: '#F59E0B' } }}
              />

              <Tooltip content={<CustomTooltip />} />
              <Legend />

              {/* Global Daily Leads Average Reference Line - Yellow dashed line */}
              {globalDailyLeadsAvg > 0 && (
                <ReferenceLine
                  yAxisId="global"
                  y={globalDailyLeadsAvg}
                  stroke="#F59E0B"
                  strokeDasharray="8 4"
                  strokeWidth={2}
                  label={{ value: `Leads Avg: ${globalDailyLeadsAvg.toFixed(2)}`, position: 'insideTopRight', fill: '#F59E0B', fontSize: 12, fontWeight: 'bold' }}
                />
              )}

              {/* Bar chart for independent time period - Total - Left axis */}
              <Bar
                yAxisId="independent"
                dataKey="independentLeads"
                fill="rgba(139, 92, 246, 0.6)"
                name="Independent Period Leads (Total)"
                radius={[18, 18, 0, 0]}
                barSize={35}
              />

              {/* Bar chart for independent time period - Average - Right axis */}
              <Bar
                yAxisId="global"
                dataKey="independentAvgLeads"
                fill="rgba(139, 92, 246, 0.85)"
                name="Independent Period Leads (Daily Avg)"
                radius={[18, 18, 0, 0]}
                barSize={35}
              />

              {/* Line chart for global time period - Right axis */}
              <Line
                yAxisId="global"
                type="monotone"
                dataKey="globalLeads"
                stroke="#F59E0B"
                strokeWidth={3}
                dot={{ fill: '#F59E0B', r: 5 }}
                name="Global Period Leads (Right Axis)"
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
