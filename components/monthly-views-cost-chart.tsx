"use client"

import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MonthlyCostChart } from "@/components/ui/monthly-cost-chart"
import { LifeCarDailyData } from "@/lib/lifecar-data-processor"

interface MonthlyViewsCostChartProps {
  data: LifeCarDailyData[]
  title?: string
  selectedMetric?: 'views' | 'likes' | 'followers'
  onMetricChange?: (metric: 'views' | 'likes' | 'followers') => void
  notesMonthlyCount?: {[key: string]: number}
}

interface MonthlyData {
  month: string
  views: number
  likes: number
  followers: number
  cost: number
}

type MetricType = 'views' | 'likes' | 'followers'

// Process data grouped by month with complete month filling
function processMonthlyData(data: LifeCarDailyData[]): MonthlyData[] {
  const monthlyGroups: { [key: string]: { views: number[], likes: number[], followers: number[], costs: number[], daysInMonth: number, actualDays: number } } = {}
  
  // Group data by month and track actual days vs expected days
  data.forEach(item => {
    const month = item.date.substring(0, 7) // YYYY-MM format
    if (!monthlyGroups[month]) {
      // Calculate days in this month
      const [year, monthNum] = month.split('-').map(Number)
      const daysInMonth = new Date(year, monthNum, 0).getDate()
      
      monthlyGroups[month] = { 
        views: [], 
        likes: [], 
        followers: [], 
        costs: [],
        daysInMonth,
        actualDays: 0
      }
    }
    monthlyGroups[month].views.push(item.clicks)
    monthlyGroups[month].likes.push(item.likes)
    monthlyGroups[month].followers.push(item.followers)
    monthlyGroups[month].costs.push(item.spend)
    monthlyGroups[month].actualDays++
  })
  
  // Calculate totals and fill missing days with zeros
  return Object.entries(monthlyGroups).map(([month, group]) => {
    const totalViews = group.views.reduce((a, b) => a + b, 0)
    const totalLikes = group.likes.reduce((a, b) => a + b, 0)
    const totalFollowers = group.followers.reduce((a, b) => a + b, 0)
    const totalCost = group.costs.reduce((a, b) => a + b, 0)
    
    // Fill missing days with zeros
    const missingDays = group.daysInMonth - group.actualDays
    
    return {
      month,
      views: Math.round(totalViews), // Keep actual totals, missing days are implicitly 0
      likes: Math.round(totalLikes),
      followers: Math.round(totalFollowers),
      cost: Math.round(totalCost * 100) / 100 // Round to 2 decimal places
    }
  }).sort((a, b) => a.month.localeCompare(b.month))
}

// Calculate nice axis domain and ticks
function calculateNiceScale(minValue: number, maxValue: number, targetTicks: number = 5) {
  const range = maxValue - minValue
  const padding = range * 0.1
  const paddedMin = Math.max(0, minValue - padding)
  const paddedMax = maxValue + padding
  
  const rawInterval = (paddedMax - paddedMin) / targetTicks
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawInterval)))
  const normalizedInterval = rawInterval / magnitude
  
  let niceInterval: number
  if (normalizedInterval <= 1) niceInterval = 1
  else if (normalizedInterval <= 2) niceInterval = 2
  else if (normalizedInterval <= 2.5) niceInterval = 2.5
  else if (normalizedInterval <= 5) niceInterval = 5
  else niceInterval = 10
  
  niceInterval *= magnitude
  
  const niceMin = Math.floor(paddedMin / niceInterval) * niceInterval
  const niceMax = Math.ceil(paddedMax / niceInterval) * niceInterval
  
  const ticks: number[] = []
  for (let tick = niceMin; tick <= niceMax; tick += niceInterval) {
    ticks.push(tick)
  }
  
  return {
    domain: [Math.max(0, niceMin), niceMax],
    ticks: ticks.filter(t => t >= 0),
    interval: niceInterval
  }
}

// Custom Labels extracted to generic component

export function MonthlyViewsCostChart({ 
  data, 
  title = "Monthly Metrics & Cost Analysis",
  selectedMetric: propSelectedMetric,
  onMetricChange,
  notesMonthlyCount = {}
}: MonthlyViewsCostChartProps) {
  // Use shared state from props, fallback to default values
  const selectedMetric = propSelectedMetric ?? 'views'
  const setSelectedMetric = onMetricChange ?? (() => {})
  
  // Get current metric config
  const metricConfig = useMemo(() => {
    switch (selectedMetric) {
      case 'likes':
        return {
          dataKey: 'likes',
          name: 'Likes',
          color: '#EF3C99',
          label: 'Likes',
          yAxisLabel: 'Likes'
        }
      case 'followers':
        return {
          dataKey: 'followers',
          name: 'New Followers',
          color: '#10B981',
          label: 'New Followers',
          yAxisLabel: 'New Followers'
        }
      default: // views
        return {
          dataKey: 'views',
          name: 'Views',
          color: '#3CBDE5',
          label: 'Views',
          yAxisLabel: 'Views'
        }
    }
  }, [selectedMetric])

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    return processMonthlyData(data)
  }, [data])

  // Calculate average cost per month from monthly aggregated data
  const avgCostPerMonth = useMemo(() => {
    if (!chartData || chartData.length === 0) return 0
    const totalCost = chartData.reduce((sum, item) => sum + item.cost, 0)
    const totalMonths = chartData.length
    return totalMonths > 0 ? totalCost / totalMonths : 0
  }, [chartData])

  // Calculate average metric per month from monthly aggregated data
  const avgMetricPerMonth = useMemo(() => {
    if (!chartData || chartData.length === 0) return 0

    // Calculate average from raw daily data, but convert to monthly scale
    if (!data || data.length === 0) return 0

    // First, group by month and calculate monthly totals from raw data
    const monthlyTotals: { [key: string]: { metric: number, days: number } } = {}

    data.forEach(item => {
      const month = item.date.substring(0, 7) // YYYY-MM format
      if (!monthlyTotals[month]) {
        monthlyTotals[month] = { metric: 0, days: 0 }
      }

      let metricValue = 0
      switch (metricConfig.dataKey) {
        case 'views':
          metricValue = item.clicks
          break
        case 'likes':
          metricValue = item.likes
          break
        case 'followers':
          metricValue = item.followers
          break
      }

      monthlyTotals[month].metric += metricValue
      monthlyTotals[month].days++
    })

    // Calculate average monthly total
    const monthlyValues = Object.values(monthlyTotals).map(m => m.metric)
    return monthlyValues.length > 0
      ? monthlyValues.reduce((sum, val) => sum + val, 0) / monthlyValues.length
      : 0
  }, [data, chartData, metricConfig.dataKey])

  // Calculate dynamic scales for both axes
  const { metricScale, costScale } = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return {
        metricScale: { domain: [0, 100], ticks: [0, 25, 50, 75, 100] },
        costScale: { domain: [0, 1000], ticks: [0, 250, 500, 750, 1000] }
      }
    }
    
    const metricValues = chartData.map(d => d[metricConfig.dataKey as keyof MonthlyData] as number).filter(v => v > 0)
    if (avgMetricPerMonth > 0) metricValues.push(avgMetricPerMonth)
    const minMetric = metricValues.length > 0 ? Math.min(...metricValues) : 0
    const maxMetric = metricValues.length > 0 ? Math.max(...metricValues) : 100
    
    const costValues = chartData.map(d => d.cost).filter(v => v > 0)
    if (avgCostPerMonth > 0) costValues.push(avgCostPerMonth)
    const minCost = costValues.length > 0 ? Math.min(...costValues) : 0
    const maxCost = costValues.length > 0 ? Math.max(...costValues) : 1000
    
    return {
      metricScale: calculateNiceScale(minMetric, maxMetric, 5),
      costScale: calculateNiceScale(minCost, maxCost, 5)
    }
  }, [chartData, metricConfig.dataKey, avgCostPerMonth, avgMetricPerMonth])

  const availableMetrics = [
    { value: 'views', label: 'Views', color: '#3CBDE5' },
    { value: 'likes', label: 'Likes', color: '#EF3C99' },
    { value: 'followers', label: 'Followers', color: '#10B981' }
  ];

  return (
    <MonthlyCostChart
      data={chartData as any}
      title={title}
      metricConfig={{...metricConfig, yAxisLabel: metricConfig.name, label: metricConfig.name}}
      avgCost={avgCostPerMonth}
      avgMetric={avgMetricPerMonth}
      costScale={costScale}
      metricScale={metricScale}
      notesMonthlyCount={notesMonthlyCount}
      selectedMetric={selectedMetric}
      availableMetrics={availableMetrics}
      onMetricChange={(m) => setSelectedMetric(m as any)}
    />
  )
}