"use client"

import React, { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface XiaowangTestLeadsTypeDistributionProps {
  brokerData?: any[]
  title?: string
  startDate?: string  // Global time filter
  endDate?: string    // Global time filter
  selectedWeekStart?: string  // Selected week start date (Monday)
  selectedWeekEnd?: string    // Selected week end date (Sunday)
}

interface TypeData {
  type: number
  typeLabel: string
  totalLeads: number        // Total leads in the time filter range
  weeklyAvg: number         // Weekly average (active weeks only)
  selectedWeek: number      // Leads in selected week
  percentageShare: number   // Percentage of total leads
}

// TYPE mapping as specified
const TYPE_LABELS: Record<number, string> = {
  0: 'No Response',
  1: 'ABN',
  2: 'PAYG',
  3: '485 Visa',
  4: 'Bridging Visa',
  5: 'Student Visa',
  6: 'Personal / Business Unsecured Loan',
  7: 'Others (Refinance / Top-up)'
}

// Parse date from various formats
function parseDateField(dateField: any): string | null {
  if (!dateField && dateField !== 0) return null

  try {
    let date: string

    // Handle Excel serial number
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
      return date
    }
  } catch {
    return null
  }

  return null
}

// Get Monday of the week for a given date
function getWeekMonday(dateStr: string): string {
  const date = new Date(dateStr)
  const dayOfWeek = date.getDay()
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const monday = new Date(date)
  monday.setDate(date.getDate() - daysFromMonday)
  return monday.toISOString().split('T')[0]
}

// Process broker data to get leads by TYPE
function processTypeLeads(
  brokerData: any[],
  startDate?: string,
  endDate?: string,
  selectedWeekStart?: string,
  selectedWeekEnd?: string
): TypeData[] {
  const typeStats: Record<number, {
    totalLeads: Set<any>,
    weeklyLeads: Map<string, Set<any>>,  // Map of week start date to unique client IDs
    selectedWeekLeads: Set<any>
  }> = {}

  // Initialize for all TYPE values 0-7
  for (let i = 0; i <= 7; i++) {
    typeStats[i] = {
      totalLeads: new Set(),
      weeklyLeads: new Map(),
      selectedWeekLeads: new Set()
    }
  }

  if (!brokerData || brokerData.length === 0) {
    return Object.keys(typeStats).map(typeKey => {
      const type = parseInt(typeKey)
      return {
        type,
        typeLabel: TYPE_LABELS[type] || `Type ${type}`,
        totalLeads: 0,
        weeklyAvg: 0,
        selectedWeek: 0,
        percentageShare: 0
      }
    })
  }

  // Sample first 10 records to debug TYPE extraction
  const typeSample: any[] = []

  brokerData.forEach((item, index) => {
    const dateField = item.date || item['日期'] || item.Date || item.时间 || item['Date '] || item['date ']

    // Extract TYPE value - handle both string and number, use nullish coalescing
    let typeValue = item.type ?? item.Type ?? item.TYPE ?? item['类型']

    // Convert to number, handling both string "0" and number 0
    // Use Number() which properly converts "0" -> 0, 0 -> 0, null -> 0, undefined -> NaN
    let type = Number(typeValue)

    // If NaN or invalid, default to 0
    if (isNaN(type)) {
      type = 0
    }

    // Normalize type to 0-7 range
    const normalizedType = (type >= 0 && type <= 7) ? Math.floor(type) : 0

    // Collect sample for debugging (first 10 records)
    if (index < 10) {
      typeSample.push({
        no: item.no,
        rawType: typeValue,
        convertedType: type,
        normalizedType: normalizedType,
        date: dateField
      })
    }

    if (dateField && item.no !== null && item.no !== undefined) {
      const date = parseDateField(dateField)

      if (date) {
        // Apply date filter for total leads
        const inDateRange = (!startDate || date >= startDate) && (!endDate || date <= endDate)

        if (inDateRange) {
          typeStats[normalizedType].totalLeads.add(item.no)

          // Calculate week for this date (Monday-Sunday)
          const weekMonday = getWeekMonday(date)

          // Track weekly leads for active weeks calculation
          if (!typeStats[normalizedType].weeklyLeads.has(weekMonday)) {
            typeStats[normalizedType].weeklyLeads.set(weekMonday, new Set())
          }
          typeStats[normalizedType].weeklyLeads.get(weekMonday)!.add(item.no)

          // Check if this date falls in selected week
          if (selectedWeekStart && selectedWeekEnd) {
            if (date >= selectedWeekStart && date <= selectedWeekEnd) {
              typeStats[normalizedType].selectedWeekLeads.add(item.no)
            }
          }
        }
      }
    }
  })

  // Calculate total leads across all types for percentage
  const totalLeadsAllTypes = Object.values(typeStats).reduce(
    (sum, stats) => sum + stats.totalLeads.size,
    0
  )

  // Build result array in fixed order 0-7
  const results = [0, 1, 2, 3, 4, 5, 6, 7].map(type => {
    const stats = typeStats[type]
    const totalLeads = stats.totalLeads.size
    const activeWeeks = stats.weeklyLeads.size  // Number of weeks where this TYPE appeared
    const weeklyAvg = activeWeeks > 0 ? totalLeads / activeWeeks : 0
    const selectedWeek = stats.selectedWeekLeads.size
    const percentageShare = totalLeadsAllTypes > 0 ? (totalLeads / totalLeadsAllTypes) * 100 : 0

    return {
      type,
      typeLabel: TYPE_LABELS[type] || `Type ${type}`,
      totalLeads,
      weeklyAvg,
      selectedWeek,
      percentageShare
    }
  })

  // Debug logging
  console.log('TYPE Distribution Debug:', {
    totalRecordsProcessed: brokerData.length,
    dateRange: { startDate, endDate },
    selectedWeek: { selectedWeekStart, selectedWeekEnd },
    typeSample: typeSample,
    results: results.map(r => ({
      type: r.type,
      totalLeads: r.totalLeads,
      activeWeeks: typeStats[r.type].weeklyLeads.size,
      weeklyAvg: r.weeklyAvg,
      selectedWeek: r.selectedWeek,
      percentageShare: r.percentageShare
    }))
  })

  return results
}

export function XiaowangTestLeadsTypeDistribution({
  brokerData = [],
  title = "Leads Type Distribution",
  startDate,
  endDate,
  selectedWeekStart,
  selectedWeekEnd
}: XiaowangTestLeadsTypeDistributionProps) {
  // Log props for debugging
  console.log('LeadsTypeDistribution Props:', {
    brokerDataCount: brokerData?.length || 0,
    startDate,
    endDate,
    selectedWeekStart,
    selectedWeekEnd
  })

  // Process data for chart
  const chartData = useMemo(() => {
    return processTypeLeads(brokerData, startDate, endDate, selectedWeekStart, selectedWeekEnd)
  }, [brokerData, startDate, endDate, selectedWeekStart, selectedWeekEnd])

  // Calculate max value for Y axis
  const maxValue = useMemo(() => {
    const values = chartData.flatMap(d => [d.totalLeads, d.weeklyAvg, d.selectedWeek])
    const max = Math.max(...values, 1)
    return Math.ceil(max * 1.1)
  }, [chartData])

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = chartData.find(d => d.typeLabel === label)

      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {data && (
            <>
              <p className="text-sm text-purple-700">
                Total Leads: <span className="font-bold">{data.totalLeads}</span>
              </p>
              <p className="text-sm text-purple-600">
                Weekly Avg (Active Weeks): <span className="font-bold">{data.weeklyAvg.toFixed(2)}</span>
              </p>
              <p className="text-sm text-pink-600">
                Selected Week: <span className="font-bold">{data.selectedWeek}</span>
              </p>
              <p className="text-sm text-gray-600 mt-1 pt-1 border-t border-gray-200">
                Share: <span className="font-bold">{data.percentageShare.toFixed(1)}%</span>
              </p>
            </>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900 font-montserrat">
          {title}
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Distribution and structural status of leads by TYPE
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="type"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                label={{ value: 'TYPE', position: 'insideBottom', offset: -10, style: { fontSize: 14, fontWeight: 'bold' } }}
              />
              <YAxis
                domain={[0, maxValue]}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                label={{ value: 'Leads Count', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />

              {/* Total Leads - Light purple */}
              <Bar
                dataKey="totalLeads"
                fill="rgba(139, 92, 246, 0.5)"
                name="Total Leads"
                radius={[8, 8, 0, 0]}
                barSize={25}
              />

              {/* Weekly Avg (Active Weeks) - Medium purple */}
              <Bar
                dataKey="weeklyAvg"
                fill="rgba(139, 92, 246, 0.75)"
                name="Weekly Avg (Active Weeks)"
                radius={[8, 8, 0, 0]}
                barSize={25}
              />

              {/* Selected Week - Dark purple/pink gradient */}
              <Bar
                dataKey="selectedWeek"
                fill="rgba(236, 72, 153, 0.9)"
                name="Selected Week"
                radius={[8, 8, 0, 0]}
                barSize={25}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* TYPE Legend */}
        <div className="mt-6 p-4 bg-purple-50/50 rounded-lg border border-purple-200/50">
          <h4 className="text-sm font-bold text-gray-800 mb-3 font-montserrat">TYPE Reference</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[0, 1, 2, 3, 4, 5, 6, 7].map(type => (
              <div key={type} className="flex items-start gap-2">
                <span className="font-bold text-purple-600 min-w-[20px]">{type}</span>
                <span className="text-gray-700">{TYPE_LABELS[type]}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
