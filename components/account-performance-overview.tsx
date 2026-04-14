"use client"

import React, { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDateWithWeekday } from "@/lib/date-utils"

interface AccountPerformanceOverviewProps {
  title: string
  dailyData?: any[]
  startDate?: string
  endDate?: string
}

interface DailyMetrics {
  date: string
  displayDate: string
  cost: number
  message: number
  views: number   // stored as clicks/50 for scale; tooltip shows real value
  likes: number
  followers: number
}

function processData(
  dailyData: any[],
  startDate?: string,
  endDate?: string
): DailyMetrics[] {
  if (!dailyData || !Array.isArray(dailyData) || dailyData.length === 0) return []

  let data = dailyData
  if (startDate && endDate) {
    data = dailyData.filter((item: any) => item.date >= startDate && item.date <= endDate)
  }

  return data
    .map((item: any) => ({
      date: item.date,
      displayDate: formatDateWithWeekday(item.date),
      cost: item.cost || 0,
      message: item.conversions || 0,
      views: (item.clicks || 0) / 50,   // scale down for dual-axis readability
      likes: item.likes || 0,
      followers: item.followers || 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => {
          const displayValue = entry.dataKey === 'views'
            ? (entry.value * 50).toLocaleString()
            : entry.value.toLocaleString()
          const displayName = entry.dataKey === 'views' ? 'Views' : entry.name
          return (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${displayName}: ${displayValue}`}
            </p>
          )
        })}
      </div>
    )
  }
  return null
}

const LINE_CONFIG = [
  { key: 'cost',      label: 'Cost',      color: '#751FAE', axis: 'left'  },
  { key: 'message',   label: 'Message',   color: '#EF4444', axis: 'right' },
  { key: 'views',     label: 'Views',     color: '#3CBDE5', axis: 'right' },
  { key: 'likes',     label: 'Likes',     color: '#EF3C99', axis: 'right' },
  { key: 'followers', label: 'Followers', color: '#10B981', axis: 'right' },
] as const

type LineKey = typeof LINE_CONFIG[number]['key']

export function AccountPerformanceOverview({
  title,
  dailyData = [],
  startDate,
  endDate,
}: AccountPerformanceOverviewProps) {
  const [visibleLines, setVisibleLines] = useState<Record<LineKey, boolean>>({
    cost: true,
    message: true,
    views: false,
    likes: false,
    followers: false,
  })

  const toggleLine = (key: LineKey) =>
    setVisibleLines(prev => ({ ...prev, [key]: !prev[key] }))

  const chartData = useMemo(() => processData(dailyData, startDate, endDate), [dailyData, startDate, endDate])

  const { leftAxisDomain, rightAxisDomain } = useMemo(() => {
    if (!chartData.length) return { leftAxisDomain: [0, 100], rightAxisDomain: [0, 100] }
    const maxCost = Math.max(...chartData.map(d => d.cost), 1)
    const rightValues = chartData.flatMap(d => [d.message, d.views, d.likes, d.followers])
    const maxRight = Math.max(...rightValues, 1)
    return {
      leftAxisDomain: [0, Math.ceil(maxCost * 1.1)],
      rightAxisDomain: [0, Math.ceil(maxRight * 1.1)],
    }
  }, [chartData])

  if (!chartData.length) {
    return (
      <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 font-montserrat">{title}</CardTitle>
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
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-xl font-semibold text-gray-900 font-montserrat">{title}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Daily Cost, Message, Views, Likes, and Followers</p>
          </div>

          {/* Toggle buttons */}
          <div className="flex flex-wrap gap-2">
            {LINE_CONFIG.map(({ key, label, color }) => (
              <Button
                key={key}
                variant={visibleLines[key] ? "default" : "outline"}
                size="sm"
                onClick={() => toggleLine(key)}
                className={`text-xs ${
                  visibleLines[key]
                    ? 'text-white border-0'
                    : 'bg-white'
                }`}
                style={visibleLines[key]
                  ? { backgroundColor: color, borderColor: color }
                  : { borderColor: color, color }
                }
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
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
                label={{ value: 'Count', angle: 90, position: 'insideRight', style: { fontSize: 12 } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="line" />

              {LINE_CONFIG.map(({ key, label, color, axis }) =>
                visibleLines[key] ? (
                  <Line
                    key={key}
                    yAxisId={axis}
                    type="monotone"
                    dataKey={key}
                    name={key === 'views' ? 'Views (÷50)' : label}
                    stroke={color}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                ) : null
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
