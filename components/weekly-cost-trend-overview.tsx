"use client"

import React, { useMemo } from 'react'
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { weekStartKey } from '@/lib/chart-aggregation'

interface WeeklyCostTrendOverviewProps {
  xiaowangTestData?: any
  brokerData?: any[]
}

interface WeeklyRow {
  week: string
  weekStart: string
  weekEnd: string
  cost: number
  leads: number
}

function weekEndISO(weekStartStr: string): string {
  const d = new Date(weekStartStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + 6)
  return d.toISOString().split('T')[0]
}

function fmtWeekDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function processWeekly(xiaowangTestData: any, brokerData: any[]): WeeklyRow[] {
  if (!xiaowangTestData?.dailyData || !Array.isArray(xiaowangTestData.dailyData)) return []

  // Aggregate leads by week-start from broker data
  const leadsPerWeek: Record<string, number> = {}
  if (Array.isArray(brokerData)) {
    brokerData.forEach(item => {
      if (!item || typeof item !== 'object') return
      let dateStr: string | null = null
      for (const field of ['Date', 'date', '时间', 'Date ', 'date ']) {
        const v = item[field]
        if (v == null || v === '') continue
        if (typeof v === 'number') {
          const d = new Date((v - 25569) * 86400 * 1000)
          if (!isNaN(d.getTime())) { dateStr = d.toISOString().split('T')[0]; break }
        } else if (typeof v === 'string') {
          const d = new Date(v)
          if (!isNaN(d.getTime())) { dateStr = d.toISOString().split('T')[0]; break }
        }
      }
      if (dateStr) {
        const key = weekStartKey(dateStr)
        leadsPerWeek[key] = (leadsPerWeek[key] || 0) + 1
      }
    })
  }

  // Aggregate cost by week from daily ad data
  const weekMap: Record<string, { weekStart: string; weekEnd: string; cost: number }> = {}
  xiaowangTestData.dailyData.forEach((day: any) => {
    if (!day.date || isNaN(new Date(day.date).getTime())) return
    const key = weekStartKey(day.date)
    if (!weekMap[key]) {
      weekMap[key] = {
        weekStart: key,
        weekEnd: weekEndISO(key),
        cost: 0,
      }
    }
    weekMap[key].cost += day.cost || 0
  })

  // Build rows
  const rows: WeeklyRow[] = Object.entries(weekMap).map(([key, w]) => ({
    week: `${fmtWeekDate(w.weekStart)} – ${fmtWeekDate(w.weekEnd)}`,
    weekStart: w.weekStart,
    weekEnd: w.weekEnd,
    cost: w.cost,
    leads: leadsPerWeek[key] || 0,
  }))

  // Sort chronologically, drop current incomplete week
  const today = new Date()
  const todayUTC = today.toISOString().split('T')[0]
  const thisMonday = weekStartKey(todayUTC)
  const isDaySunday = new Date(todayUTC + 'T00:00:00Z').getUTCDay() === 0

  return rows
    .filter(r => isDaySunday || r.weekStart !== thisMonday)
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-900 mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {entry.name === 'Cost ($)' ? `$${Number(entry.value).toFixed(0)}` : entry.value}
        </p>
      ))}
    </div>
  )
}

export function WeeklyCostTrendOverview({ xiaowangTestData, brokerData = [] }: WeeklyCostTrendOverviewProps) {
  const allWeeks = useMemo(() => processWeekly(xiaowangTestData, brokerData), [xiaowangTestData, brokerData])
  const displayData = useMemo(() => allWeeks.slice(-8), [allWeeks])

  const { costMax, leadsMax, avgCost, avgLeads } = useMemo(() => {
    if (!displayData.length) return { costMax: 1000, leadsMax: 10, avgCost: 0, avgLeads: 0 }
    const costs = displayData.map(d => d.cost)
    const leads = displayData.map(d => d.leads)
    const avgCost = costs.reduce((s, v) => s + v, 0) / costs.length
    const avgLeads = leads.reduce((s, v) => s + v, 0) / leads.length
    return {
      costMax: Math.ceil(Math.max(...costs, 1) * 1.15),
      leadsMax: Math.ceil(Math.max(...leads, 1) * 1.15),
      avgCost,
      avgLeads,
    }
  }, [displayData])

  if (!displayData.length) {
    return (
      <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 font-montserrat">Weekly Cost Trend Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-gray-500">No weekly data available</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900 font-montserrat">Weekly Cost Trend Overview</CardTitle>
        <p className="text-sm text-gray-500 mt-1">Cost vs Leads — last 8 completed weeks</p>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={displayData} margin={{ top: 30, right: 60, left: 50, bottom: 70 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="week"
                tick={(props: any) => {
                  const { x, y, payload } = props
                  return (
                    <text
                      x={x}
                      y={y + 16}
                      textAnchor="end"
                      fill="#6B7280"
                      fontSize={11}
                      transform={`rotate(-40, ${x}, ${y + 16})`}
                    >
                      {payload.value}
                    </text>
                  )
                }}
                height={90}
                interval={0}
              />
              <YAxis
                yAxisId="cost"
                orientation="left"
                domain={[0, costMax]}
                tick={{ fontSize: 11 }}
                tickFormatter={v => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                label={{ value: 'Cost ($)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' }, offset: -10 }}
              />
              <YAxis
                yAxisId="leads"
                orientation="right"
                domain={[0, leadsMax]}
                tick={{ fontSize: 11 }}
                label={{ value: 'Leads', angle: 90, position: 'insideRight', style: { textAnchor: 'middle' }, offset: -10 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} />

              {avgCost > 0 && (
                <ReferenceLine yAxisId="cost" y={avgCost} stroke="#C4A5E7" strokeWidth={2} strokeDasharray="6 6" />
              )}
              {avgLeads > 0 && (
                <ReferenceLine yAxisId="leads" y={avgLeads} stroke="#F59E0B80" strokeWidth={2} strokeDasharray="6 6" />
              )}

              <Line
                yAxisId="cost"
                type="monotone"
                dataKey="cost"
                name="Cost ($)"
                stroke="#751FAE"
                strokeWidth={3}
                dot={{ fill: '#751FAE', r: 5 }}
                connectNulls={false}
              />
              <Line
                yAxisId="leads"
                type="monotone"
                dataKey="leads"
                name="Leads"
                stroke="#F59E0B"
                strokeWidth={3}
                dot={{ fill: '#F59E0B', r: 5 }}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
