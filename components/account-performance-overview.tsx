"use client"

import React, { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  type Granularity,
  GRANULARITY_LABEL,
  bucketKeyFor,
  formatBucketLabel,
  pickGranularity,
  spanInDays,
  xAxisInterval,
} from "@/lib/chart-aggregation"

function parseDateField(val: any): string {
  if (typeof val === 'string') return val.split(' ')[0]
  if (typeof val === 'number') {
    const d = new Date((val - 25569) * 86400 * 1000)
    return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0]
  }
  return ''
}

interface AccountPerformanceOverviewProps {
  title: string
  dailyData?: any[]
  startDate?: string
  endDate?: string
  notesData?: any[]
  accountName?: string
}

interface DailyMetrics {
  date: string
  displayDate: string
  cost: number
  message: number
  views: number   // stored as clicks/50 for scale; tooltip shows real value
  likes: number
  followers: number
  posts?: any[]
}

function processData(
  dailyData: any[],
  startDate?: string,
  endDate?: string
): { chartData: DailyMetrics[]; granularity: Granularity } {
  if (!dailyData || !Array.isArray(dailyData) || dailyData.length === 0) {
    return { chartData: [], granularity: 'day' }
  }

  const filtered = (startDate && endDate)
    ? dailyData.filter((item: any) => item.date && item.date >= startDate && item.date <= endDate)
    : dailyData.filter((item: any) => item.date)

  if (filtered.length === 0) return { chartData: [], granularity: 'day' }

  const sortedDates = filtered.map((d: any) => d.date).sort()
  const granularity = pickGranularity(
    spanInDays(startDate, endDate, sortedDates[0], sortedDates[sortedDates.length - 1])
  )

  // Bucket and sum (views stays scaled by /50 for dual-axis readability)
  const buckets = new Map<string, { cost: number; message: number; views: number; likes: number; followers: number }>()
  for (const item of filtered) {
    const key = bucketKeyFor(item.date, granularity)
    const b = buckets.get(key) || { cost: 0, message: 0, views: 0, likes: 0, followers: 0 }
    b.cost      += item.cost        || 0
    b.message   += item.conversions || 0
    b.views     += (item.clicks     || 0) / 50
    b.likes     += item.likes       || 0
    b.followers += item.followers   || 0
    buckets.set(key, b)
  }

  const chartData: DailyMetrics[] = Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => ({
      date: key,
      displayDate: formatBucketLabel(key, granularity),
      ...v,
    }))

  return { chartData, granularity }
}

const CustomTooltip = ({ active, payload, label, accountName, showPosts }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as DailyMetrics | undefined
  const posts: any[] = d?.posts || []

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-3 min-w-[200px] max-w-[300px]">
      <p className="font-semibold text-gray-900 mb-2">{label}</p>

      {posts.length > 0 && (
        <div className="mb-3 pb-2 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 mb-1.5">📝 New Posts</p>
          <div className="space-y-1 max-h-36 overflow-y-auto">
            {posts.map((post: any, i: number) => (
              <div key={i} className="text-xs p-1.5 bg-purple-50 rounded border-l-2 border-purple-300">
                <div className="font-medium text-purple-800 line-clamp-2">{post.名称}</div>
                <div className="text-purple-500 mt-0.5">{accountName} · {parseDateField(post.发布时间)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

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
  notesData = [],
  accountName = '',
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

  const { chartData, granularity } = useMemo(
    () => processData(dailyData, startDate, endDate),
    [dailyData, startDate, endDate]
  )

  // Enrich chart data with posts, bucketed to match the current granularity
  const enrichedChartData = useMemo<DailyMetrics[]>(() => {
    if (!notesData.length) return chartData
    const postMap: Record<string, any[]> = {}
    notesData.forEach((note: any) => {
      const date = parseDateField(note.发布时间)
      if (!date) return
      const key = bucketKeyFor(date, granularity)
      postMap[key] = [...(postMap[key] || []), note]
    })
    return chartData.map(d => ({ ...d, posts: postMap[d.date] || [] }))
  }, [chartData, notesData, granularity])

  const showDots = granularity !== 'day'
  const xInterval = xAxisInterval(enrichedChartData.length)

  const { leftAxisDomain, rightAxisDomain } = useMemo(() => {
    if (!enrichedChartData.length) return { leftAxisDomain: [0, 100], rightAxisDomain: [0, 100] }
    const maxCost = Math.max(...enrichedChartData.map(d => d.cost), 1)
    const rightValues = enrichedChartData.flatMap(d => [d.message, d.views, d.likes, d.followers])
    const maxRight = Math.max(...rightValues, 1)
    return {
      leftAxisDomain: [0, Math.ceil(maxCost * 1.1)],
      rightAxisDomain: [0, Math.ceil(maxRight * 1.1)],
    }
  }, [enrichedChartData])

  const [showPosts, setShowPosts] = useState(false)

  // Data points with at least one post (for reference lines)
  const postDataPoints = useMemo(
    () => enrichedChartData.filter(d => (d.posts?.length || 0) > 0),
    [enrichedChartData]
  )
  const hasAnyPosts = postDataPoints.length > 0

  if (!enrichedChartData.length) {
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
            <p className="text-sm text-gray-600 mt-1">
              Cost, Message, Views, Likes, and Followers
              <span className="ml-2 text-gray-500">· {GRANULARITY_LABEL[granularity]}</span>
            </p>
          </div>

          {/* Toggle buttons */}
          <div className="flex flex-wrap gap-2">
            {hasAnyPosts && (
              <Button
                variant={showPosts ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowPosts(p => !p)}
                className="text-xs"
                style={showPosts
                  ? { backgroundColor: '#6B7280', borderColor: '#6B7280', color: '#fff' }
                  : { borderColor: '#6B7280', color: '#6B7280', backgroundColor: '#fff' }
                }
              >
                📝 Posts
              </Button>
            )}
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
            <LineChart data={enrichedChartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="displayDate"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 11 }}
                interval={xInterval}
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
              <Tooltip content={<CustomTooltip accountName={accountName} showPosts={showPosts} />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="line" />

              {showPosts && postDataPoints.map(d => (
                <ReferenceLine
                  key={d.date}
                  yAxisId="left"
                  x={d.displayDate}
                  stroke="#6B7280"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  opacity={0.8}
                />
              ))}

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
                    dot={showDots ? { r: 3 } : false}
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
