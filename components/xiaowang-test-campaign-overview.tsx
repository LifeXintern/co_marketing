"use client"

import React, { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDateWithWeekday } from "@/lib/date-utils"

interface XiaowangTestCampaignOverviewProps {
  dailyData?: any[]
  brokerData?: any[]
  startDate?: string
  endDate?: string
}

interface DailyMetrics {
  date: string
  displayDate: string
  cost: number
  leads: number
}

function processData(
  dailyData: any[],
  brokerData: any[],
  startDate?: string,
  endDate?: string
): DailyMetrics[] {
  if (!dailyData || !Array.isArray(dailyData)) return []

  // Build leads-per-date from broker data (account-independent)
  const leadsPerDate: Record<string, number> = {}
  if (brokerData && Array.isArray(brokerData)) {
    brokerData.forEach(item => {
      if (!item || typeof item !== 'object') return
      let dateValue: string | null = null
      const dateFields = ['Date', 'date', '时间', 'Date ', 'date ']
      for (const field of dateFields) {
        if (item[field] !== undefined && item[field] !== null && item[field] !== '') {
          if (typeof item[field] === 'number') {
            const d = new Date((item[field] - 25569) * 86400 * 1000)
            if (!isNaN(d.getTime())) { dateValue = d.toISOString().split('T')[0]; break }
          } else if (typeof item[field] === 'string') {
            const d = new Date(item[field])
            if (!isNaN(d.getTime())) { dateValue = d.toISOString().split('T')[0]; break }
          }
        }
      }
      if (dateValue) leadsPerDate[dateValue] = (leadsPerDate[dateValue] || 0) + 1
    })
  }

  // Collect all dates: union of ad dates + lead dates, filtered by range
  const allDates = new Set<string>([
    ...dailyData.map((d: any) => d.date).filter(Boolean),
    ...Object.keys(leadsPerDate),
  ])

  return Array.from(allDates)
    .filter(date => {
      if (startDate && endDate) return date >= startDate && date <= endDate
      return true
    })
    .map(date => {
      const adItem = dailyData.find((d: any) => d.date === date)
      return {
        date,
        displayDate: formatDateWithWeekday(date),
        cost: adItem?.cost || 0,
        leads: leadsPerDate[date] || 0,
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date))
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {`${entry.name}: ${entry.value.toLocaleString()}`}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function XiaowangTestCampaignOverview({
  dailyData = [],
  brokerData = [],
  startDate,
  endDate
}: XiaowangTestCampaignOverviewProps) {
  const chartData = useMemo(() => processData(dailyData, brokerData, startDate, endDate), [dailyData, brokerData, startDate, endDate])

  const { leftAxisDomain, rightAxisDomain } = useMemo(() => {
    if (!chartData.length) return { leftAxisDomain: [0, 100], rightAxisDomain: [0, 10] }
    const maxCost = Math.max(...chartData.map(d => d.cost), 1)
    const maxLeads = Math.max(...chartData.map(d => d.leads), 1)
    return {
      leftAxisDomain: [0, Math.ceil(maxCost * 1.1)],
      rightAxisDomain: [0, Math.ceil(maxLeads * 1.1)],
    }
  }, [chartData])

  if (!chartData.length) {
    return (
      <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 font-montserrat">Trend Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 flex items-center justify-center text-gray-500">No data available for the selected period</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900 font-montserrat">Trend Overview</CardTitle>
        <p className="text-sm text-gray-600 mt-1">Combined Total Cost and Total Leads across both accounts</p>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="displayDate"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 11 }}
                interval={Math.floor(chartData.length / 20)}
              />
              <YAxis
                yAxisId="left"
                domain={leftAxisDomain}
                tick={{ fontSize: 11 }}
                label={{ value: 'Cost ($)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={rightAxisDomain}
                tick={{ fontSize: 11 }}
                label={{ value: 'Leads', angle: 90, position: 'insideRight', style: { fontSize: 12 } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="line" />
              <Line yAxisId="left" type="monotone" dataKey="cost" name="Total Cost" stroke="#751FAE" strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} />
              <Line yAxisId="right" type="monotone" dataKey="leads" name="Total Leads" stroke="#F59E0B" strokeWidth={2.5} dot={false} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
