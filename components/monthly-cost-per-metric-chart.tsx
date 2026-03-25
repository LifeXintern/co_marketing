"use client"

import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MonthlySingleMetricChart } from "@/components/ui/monthly-single-metric-chart"
import { LifeCarDailyData } from "@/lib/lifecar-data-processor"

interface MonthlyCostPerMetricChartProps {
  data: LifeCarDailyData[]
  title?: string
  selectedMetric?: 'views' | 'likes' | 'followers'
  onMetricChange?: (metric: 'views' | 'likes' | 'followers') => void
  notesMonthlyCount?: {[key: string]: number}
}

interface MonthlyData {
  month: string
  costPerFollower: number
  costPerClick: number
  costPerLike: number
}

type MetricType = 'costPerFollower' | 'costPerClick' | 'costPerLike'

// Process data grouped by month with complete month filling
function processMonthlyData(data: LifeCarDailyData[]): MonthlyData[] {
  const monthlyGroups: { [key: string]: { items: LifeCarDailyData[], daysInMonth: number, actualDays: number } } = {}
  
  // Group data by month and track days
  data.forEach(item => {
    const month = item.date.substring(0, 7) // YYYY-MM format
    if (!monthlyGroups[month]) {
      // Calculate days in this month
      const [year, monthNum] = month.split('-').map(Number)
      const daysInMonth = new Date(year, monthNum, 0).getDate()
      
      monthlyGroups[month] = { 
        items: [],
        daysInMonth,
        actualDays: 0
      }
    }
    monthlyGroups[month].items.push(item)
    monthlyGroups[month].actualDays++
  })
  
  // Calculate cost per metrics for each month
  return Object.entries(monthlyGroups).map(([month, group]) => {
    const totalSpend = group.items.reduce((sum, item) => sum + item.spend, 0)
    const totalFollowers = group.items.reduce((sum, item) => sum + item.followers, 0)
    const totalClicks = group.items.reduce((sum, item) => sum + item.clicks, 0)
    const totalLikes = group.items.reduce((sum, item) => sum + item.likes, 0)
    
    // Missing days are treated as 0 for all metrics (no additional cost, no additional engagement)
    const missingDays = group.daysInMonth - group.actualDays
    
    return {
      month,
      costPerFollower: totalFollowers > 0 ? totalSpend / totalFollowers : 0,
      costPerClick: totalClicks > 0 ? totalSpend / totalClicks : 0,
      costPerLike: totalLikes > 0 ? totalSpend / totalLikes : 0
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

// Custom label extracted to shared component

export function MonthlyCostPerMetricChart({ 
  data, 
  title = "Monthly Cost Analysis",
  selectedMetric: propSelectedMetric,
  onMetricChange,
  notesMonthlyCount = {}
}: MonthlyCostPerMetricChartProps) {
  // Map shared metric from MonthlyViewsCostChart to local metric type
  const selectedMetric = useMemo(() => {
    if (propSelectedMetric) {
      switch (propSelectedMetric) {
        case 'views': return 'costPerClick' as MetricType
        case 'likes': return 'costPerLike' as MetricType
        case 'followers': return 'costPerFollower' as MetricType
        default: return 'costPerFollower'
      }
    }
    return 'costPerFollower'
  }, [propSelectedMetric])
  
  // Handle metric selection - map back to shared state format
  const handleMetricSelect = (metric: MetricType) => {
    if (onMetricChange) {
      switch (metric) {
        case 'costPerClick': onMetricChange('views'); break
        case 'costPerLike': onMetricChange('likes'); break
        case 'costPerFollower': onMetricChange('followers'); break
      }
    }
  }
  
  // Get metric display info
  const getMetricInfo = (metric: MetricType) => {
    switch (metric) {
      case 'costPerFollower':
        return { label: 'Cost per Follower', emoji: '👥', color: '#10B981' }
      case 'costPerClick':
        return { label: 'Cost per View', emoji: '👁️', color: '#3CBDE5' }
      case 'costPerLike':
        return { label: 'Cost per Like', emoji: '❤️', color: '#EF3C99' }
    }
  }
  
  const currentMetricInfo = getMetricInfo(selectedMetric)


  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    return processMonthlyData(data)
  }, [data])

  // Calculate dynamic scale and average directly from raw data
  const { metricScale, average } = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        metricScale: { domain: [0, 1], ticks: [0, 0.25, 0.5, 0.75, 1] },
        average: 0
      }
    }

    // Calculate average as SUM(Cost)/SUM(Metric) from all data
    const totalCost = data.reduce((sum, item) => sum + item.spend, 0)
    let totalMetric = 0

    switch (selectedMetric) {
      case 'costPerClick':
        totalMetric = data.reduce((sum, item) => sum + item.clicks, 0)
        break
      case 'costPerLike':
        totalMetric = data.reduce((sum, item) => sum + item.likes, 0)
        break
      case 'costPerFollower':
        totalMetric = data.reduce((sum, item) => sum + item.followers, 0)
        break
    }

    const average = totalMetric > 0 ? totalCost / totalMetric : 0

    // For scale calculation, still use processed chartData but include raw average
    if (!chartData || chartData.length === 0) {
      return {
        metricScale: { domain: [0, Math.max(1, average * 1.2)], ticks: [0, 0.25, 0.5, 0.75, 1] },
        average
      }
    }

    const metricValues = chartData.map(d => d[selectedMetric]).filter(v => v > 0)
    if (average > 0) metricValues.push(average)
    const minMetric = metricValues.length > 0 ? Math.min(...metricValues) : 0
    const maxMetric = metricValues.length > 0 ? Math.max(...metricValues) : 1

    return {
      metricScale: calculateNiceScale(minMetric, maxMetric, 5),
      average
    }
  }, [data, chartData, selectedMetric])

  const availableMetrics = [
    { value: 'costPerClick', label: 'View', color: '#3CBDE5' },
    { value: 'costPerLike', label: 'Like', color: '#EF3C99' },
    { value: 'costPerFollower', label: 'Follower', color: '#10B981' }
  ];

  return (
    <MonthlySingleMetricChart
      data={chartData}
      title={title}
      metricConfig={{...currentMetricInfo, dataKey: selectedMetric}}
      average={average}
      metricScale={metricScale}
      notesMonthlyCount={notesMonthlyCount}
      selectedMetric={selectedMetric}
      availableMetrics={availableMetrics}
      onMetricChange={(m) => handleMetricSelect(m as MetricType)}
    />
  )
}