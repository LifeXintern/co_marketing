"use client"

import React from 'react'
import { type LifeCarDailyData } from "@/lib/lifecar-data-processor"
import { WeeklyMetricsList, type WeeklyDataCard, type WeeklyMetricItem } from "@/components/ui/weekly-metrics-list"

interface LifeCarWeeklyAnalysisProps {
  data: LifeCarDailyData[]
  title?: string
}

interface WeeklyMetrics {
  weekStart: string
  weekEnd: string
  weekEndDate: Date
  totalCost: number
  totalImpressions: number
  totalClicks: number
  totalLikes: number
  totalNewFollowers: number
  totalPrivateMessages: number
  costChange?: number
  impressionsChange?: number
  clicksChange?: number
  likesChange?: number
  newFollowersChange?: number
  privateMessagesChange?: number
}

export function LifeCarWeeklyAnalysis({ data, title = "Weekly Performance Details" }: LifeCarWeeklyAnalysisProps) {
  // Process data to get weekly metrics
  const weeklyMetrics = React.useMemo(() => {
    if (!data || data.length === 0) return []

    // Group data by week
    const weekMap = new Map<string, LifeCarDailyData[]>()
    
    data.forEach(item => {
      // Parse date in local timezone to avoid timezone offset issues
      const [year, month, day] = item.date.split('-').map(Number)
      const date = new Date(year, month - 1, day, 12, 0, 0, 0) // Set to noon
      const weekStart = new Date(date)
      const dayOfWeek = weekStart.getDay()
      // For Monday-Sunday weeks where Sunday is the LAST day of the week:
      // Sunday (0) should be grouped with the Monday 6 days BEFORE it
      // Monday (1) stays at Monday  
      // Tuesday (2) goes back 1 day to Monday
      // etc.
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1  // Sunday goes back 6 days to find its Monday
      weekStart.setDate(weekStart.getDate() - daysFromMonday)
      weekStart.setHours(0, 0, 0, 0)
      
      // Format date in local timezone
      const weekKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`
      
      if (!weekMap.has(weekKey)) {
        weekMap.set(weekKey, [])
      }
      weekMap.get(weekKey)?.push(item)
    })

    // Calculate metrics for each week
    const weeks: WeeklyMetrics[] = []
    
    weekMap.forEach((weekData, weekStartStr) => {
      const weekStart = new Date(weekStartStr)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      
      const metrics: WeeklyMetrics = {
        weekStart: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weekEnd: weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        weekEndDate: weekEnd,
        totalCost: weekData.reduce((sum, d) => sum + (d.spend || 0), 0),
        totalImpressions: weekData.reduce((sum, d) => sum + (d.impressions || 0), 0),
        totalClicks: weekData.reduce((sum, d) => sum + (d.clicks || 0), 0),
        totalLikes: weekData.reduce((sum, d) => sum + (d.likes || 0), 0),
        totalNewFollowers: weekData.reduce((sum, d) => sum + (d.followers || 0), 0),
        totalPrivateMessages: weekData.reduce((sum, d) => sum + ((d.multiConversion1 || 0) + (d.multiConversion2 || 0)), 0)

      }
      
      weeks.push(metrics)
    })

    // Sort weeks chronologically
    weeks.sort((a, b) => {
      return a.weekEndDate.getTime() - b.weekEndDate.getTime()
    })

    // Calculate week-over-week changes
    for (let i = 1; i < weeks.length; i++) {
      const current = weeks[i]
      const previous = weeks[i - 1]
      
      if (previous.totalCost > 0) {
        current.costChange = ((current.totalCost - previous.totalCost) / previous.totalCost) * 100
      }
      if (previous.totalImpressions > 0) {
        current.impressionsChange = ((current.totalImpressions - previous.totalImpressions) / previous.totalImpressions) * 100
      }
      if (previous.totalClicks > 0) {
        current.clicksChange = ((current.totalClicks - previous.totalClicks) / previous.totalClicks) * 100
      }
      if (previous.totalLikes > 0) {
        current.likesChange = ((current.totalLikes - previous.totalLikes) / previous.totalLikes) * 100
      }
      if (previous.totalNewFollowers > 0) {
        current.newFollowersChange = ((current.totalNewFollowers - previous.totalNewFollowers) / previous.totalNewFollowers) * 100
      }
      if (previous.totalPrivateMessages > 0) {
        current.privateMessagesChange = ((current.totalPrivateMessages - previous.totalPrivateMessages) / previous.totalPrivateMessages) * 100
      }
    }

    // Transform into WeeklyDataCard format
    return weeks.reverse().map(week => {
      const metrics: WeeklyMetricItem[] = [
        { key: 'cost', label: 'Total Cost', value: week.totalCost, format: 'currency', change: week.costChange, changeType: 'negative' },
        { key: 'impressions', label: 'Views', value: week.totalImpressions, format: 'number', change: week.impressionsChange, changeType: 'positive' },
        { key: 'likes', label: 'Likes', value: week.totalLikes, format: 'number', change: week.likesChange, changeType: 'positive' },
        { key: 'followers', label: 'New Followers', value: week.totalNewFollowers, format: 'number', change: week.newFollowersChange, changeType: 'positive' },
        { key: 'messages', label: 'Private Messages', value: week.totalPrivateMessages, format: 'number', change: week.privateMessagesChange, changeType: 'positive' },
      ];
      
      return {
        weekStart: week.weekStart,
        weekEnd: week.weekEnd,
        weekEndDate: week.weekEndDate,
        metrics
      };
    });
  }, [data])

  return <WeeklyMetricsList weeks={weeklyMetrics} title={title} />;
}