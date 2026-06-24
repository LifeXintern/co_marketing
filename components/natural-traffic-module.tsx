"use client"

import React, { useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts'

interface Note {
  发布时间: string | number
  类型: string
  名称: string
  链接?: string
  views?: number
  likes?: number
  comments?: number
  saves?: number
  followers?: number
  shares?: number
  videoCompletionRate?: number
  organicImpressions?: number
}

interface NaturalTrafficModuleProps {
  xiaowangNotesData?: Note[]
  lifeCarNotesData?: Note[]
  selectedAccount?: string
  weeklyTimePeriod?: number
}

function parseNoteDate(val: string | number): Date | null {
  if (!val) return null
  if (typeof val === 'number') return new Date((val - 25569) * 86400 * 1000)
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}

function getWeekStart(date: Date): string {
  const d = new Date(date)
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  return d.toISOString().split('T')[0]
}

function fmt(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}w`
  return n.toLocaleString()
}

const TYPE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#f43f5e']

export function NaturalTrafficModule({
  xiaowangNotesData = [],
  lifeCarNotesData = [],
  selectedAccount = 'combined',
  weeklyTimePeriod = 12,
}: NaturalTrafficModuleProps) {
  const notesData = useMemo(() => {
    if (selectedAccount === 'xiaowang') return xiaowangNotesData
    if (selectedAccount === 'lifecar') return lifeCarNotesData
    return [...xiaowangNotesData, ...lifeCarNotesData]
  }, [selectedAccount, xiaowangNotesData, lifeCarNotesData])

  const hasData = notesData.length > 0

  const totals = useMemo(() =>
    notesData.reduce((acc, n) => ({
      organicImpressions: acc.organicImpressions + (n.organicImpressions || 0),
      views: acc.views + (n.views || 0),
      likes: acc.likes + (n.likes || 0),
      comments: acc.comments + (n.comments || 0),
      saves: acc.saves + (n.saves || 0),
      shares: acc.shares + (n.shares || 0),
      engagement: acc.engagement + (n.likes || 0) + (n.comments || 0) + (n.saves || 0) + (n.shares || 0),
      count: acc.count + 1,
    }), { organicImpressions: 0, views: 0, likes: 0, comments: 0, saves: 0, shares: 0, engagement: 0, count: 0 }),
  [notesData])

  const weeklyData = useMemo(() => {
    const weekMap: Record<string, { impressions: number; views: number; engagement: number; posts: number }> = {}
    notesData.forEach(n => {
      const d = parseNoteDate(n.发布时间)
      if (!d) return
      const wk = getWeekStart(d)
      if (!weekMap[wk]) weekMap[wk] = { impressions: 0, views: 0, engagement: 0, posts: 0 }
      weekMap[wk].impressions += n.organicImpressions || 0
      weekMap[wk].views += n.views || 0
      weekMap[wk].engagement += (n.likes || 0) + (n.comments || 0) + (n.saves || 0) + (n.shares || 0)
      weekMap[wk].posts += 1
    })
    return Object.entries(weekMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-weeklyTimePeriod)
      .map(([week, v]) => ({
        week: new Date(week + 'T00:00:00Z').toLocaleDateString('en-AU', {
          month: 'short', day: 'numeric', timeZone: 'UTC',
        }),
        impressions: v.impressions,
        views: v.views,
        engagement: v.engagement,
        posts: v.posts,
      }))
  }, [notesData, weeklyTimePeriod])

  const typeData = useMemo(() => {
    const typeMap: Record<string, { impressions: number; views: number; engagement: number; count: number }> = {}
    notesData.forEach(n => {
      const type = n.类型 || 'Unknown'
      if (!typeMap[type]) typeMap[type] = { impressions: 0, views: 0, engagement: 0, count: 0 }
      typeMap[type].impressions += n.organicImpressions || 0
      typeMap[type].views += n.views || 0
      typeMap[type].engagement += (n.likes || 0) + (n.comments || 0) + (n.saves || 0) + (n.shares || 0)
      typeMap[type].count += 1
    })
    return Object.entries(typeMap).map(([type, v]) => ({
      type,
      avgViews: v.count > 0 ? Math.round(v.views / v.count) : 0,
      avgEngagement: v.count > 0 ? Math.round(v.engagement / v.count) : 0,
      count: v.count,
    }))
  }, [notesData])

  const topPosts = useMemo(() =>
    [...notesData]
      .filter(n => (n.views || 0) > 0)
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 10),
  [notesData])

  const engagementRate = totals.views > 0
    ? ((totals.engagement / totals.views) * 100).toFixed(1)
    : '0.0'

  if (!hasData) {
    return (
      <div className="text-center bg-white/95 backdrop-blur-xl rounded-xl shadow-xl shadow-green-500/10 ring-1 ring-green-500/20 p-16">
        <div className="text-6xl mb-6">🌱</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-3">No Natural Traffic Data Yet</h3>
        <p className="text-gray-500 mb-2">Upload your Rednote Excel file to see organic performance.</p>
        <p className="text-sm text-gray-400">The file should include a <strong>小王笔记</strong> or <strong>LifeCar笔记</strong> sheet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Summary banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/60 rounded-xl px-6 py-4">
        <p className="text-sm text-emerald-700 font-medium">
          🌱 Natural Traffic — organic reach with <strong>zero paid spend</strong> on Rednote (小红书)
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Organic Impressions', value: fmt(totals.organicImpressions), sub: 'Total natural reach', icon: '👁️', grad: 'from-emerald-500 to-teal-500' },
          { label: 'Total Views (UV)', value: fmt(totals.views), sub: 'Unique readers', icon: '📖', grad: 'from-blue-500 to-cyan-500' },
          { label: 'Total Engagement', value: fmt(totals.engagement), sub: `${engagementRate}% eng. rate`, icon: '❤️', grad: 'from-rose-500 to-pink-500' },
          { label: 'Posts Published', value: totals.count.toString(), sub: 'Organic posts', icon: '📝', grad: 'from-violet-500 to-purple-500' },
        ].map(({ label, value, sub, icon, grad }) => (
          <div key={label} className="bg-white/95 backdrop-blur-xl rounded-xl shadow-md ring-1 ring-gray-200/60 p-5">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${grad} text-white text-xl mb-3`}>
              {icon}
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm font-medium text-gray-700 mt-0.5">{label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Weekly Trend Line Chart */}
      <div className="bg-white/95 backdrop-blur-xl rounded-xl shadow-md ring-1 ring-gray-200/60 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Weekly Natural Traffic Trend</h3>
          <p className="text-sm text-gray-500 mt-0.5">Organic impressions, views &amp; engagement — last {weeklyTimePeriod} weeks, no paid spend</p>
        </div>
        {weeklyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={fmt} width={55} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Legend />
              <Line type="monotone" dataKey="impressions" name="Organic Impressions" stroke="#10b981" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="views" name="Views (UV)" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="engagement" name="Engagement" stroke="#f43f5e" strokeWidth={2} dot={false} strokeDasharray="5 3" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-400 py-12 text-sm">Not enough weekly data to display trend</p>
        )}
      </div>

      {/* Content Type + Top Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Content Type Bar Chart */}
        <div className="bg-white/95 backdrop-blur-xl rounded-xl shadow-md ring-1 ring-gray-200/60 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Content Type Performance</h3>
            <p className="text-sm text-gray-500 mt-0.5">Average views &amp; engagement per post by type</p>
          </div>
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={typeData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={fmt} width={50} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Legend />
                <Bar dataKey="avgViews" name="Avg Views/Post" radius={[4, 4, 0, 0]}>
                  {typeData.map((_, i) => (
                    <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
                  ))}
                </Bar>
                <Bar dataKey="avgEngagement" name="Avg Engagement/Post" radius={[4, 4, 0, 0]} fill="#c4b5fd" opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-400 py-12 text-sm">No content type data</p>
          )}
        </div>

        {/* Top 10 Posts Table */}
        <div className="bg-white/95 backdrop-blur-xl rounded-xl shadow-md ring-1 ring-gray-200/60 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Top 10 Posts by Views</h3>
            <p className="text-sm text-gray-500 mt-0.5">Best performing organic content (no paid boost)</p>
          </div>
          {topPosts.length > 0 ? (
            <div className="overflow-y-auto max-h-[220px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-gray-100">
                    <th className="text-left pb-2 text-gray-400 font-medium text-xs w-6">#</th>
                    <th className="text-left pb-2 text-gray-400 font-medium text-xs">Post</th>
                    <th className="text-right pb-2 text-gray-400 font-medium text-xs">Views</th>
                    <th className="text-right pb-2 text-gray-400 font-medium text-xs">Likes</th>
                    <th className="text-right pb-2 text-gray-400 font-medium text-xs">Saves</th>
                  </tr>
                </thead>
                <tbody>
                  {topPosts.map((n, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                      <td className="py-2 pr-2 text-gray-300 font-mono text-xs">{i + 1}</td>
                      <td className="py-2 pr-2">
                        <div className="truncate text-gray-700 max-w-[140px]" title={n.名称}>{n.名称 || '—'}</div>
                        <div className="text-xs text-gray-400">{n.类型}</div>
                      </td>
                      <td className="py-2 text-right font-semibold text-blue-600 tabular-nums">{fmt(n.views || 0)}</td>
                      <td className="py-2 text-right text-rose-500 tabular-nums">{fmt(n.likes || 0)}</td>
                      <td className="py-2 text-right text-emerald-600 tabular-nums">{fmt(n.saves || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-400 py-12 text-sm">No post data available</p>
          )}
        </div>
      </div>

      {/* Engagement Breakdown */}
      <div className="bg-white/95 backdrop-blur-xl rounded-xl shadow-md ring-1 ring-gray-200/60 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Organic Engagement Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Likes', value: totals.likes, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100', icon: '❤️' },
            { label: 'Comments', value: totals.comments, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: '💬' },
            { label: 'Saves', value: totals.saves, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: '🔖' },
            { label: 'Shares', value: totals.shares, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', icon: '↗️' },
          ].map(({ label, value, color, bg, border, icon }) => (
            <div key={label} className={`${bg} border ${border} rounded-xl p-5 text-center`}>
              <div className="text-2xl mb-1">{icon}</div>
              <div className={`text-2xl font-bold ${color}`}>{fmt(value)}</div>
              <div className="text-sm text-gray-600 mt-1">{label}</div>
              <div className="text-xs text-gray-400 mt-0.5">
                {totals.engagement > 0 ? `${((value / totals.engagement) * 100).toFixed(0)}% of total` : '—'}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
