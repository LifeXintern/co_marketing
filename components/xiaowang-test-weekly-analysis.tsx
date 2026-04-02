"use client"

import React from 'react'
import { WeeklyMetricsList, type WeeklyDataCard, type WeeklyMetricItem } from "@/components/ui/weekly-metrics-list"

interface XiaowangTestWeeklyAnalysisProps {
  xiaowangTestData?: any
  brokerData?: any[]
  title?: string
}

interface WeeklyMetrics {
  weekStart: string
  weekEnd: string
  weekEndDate: Date
  totalCost: number
  totalViews: number
  totalLikes: number
  totalNewFollowers: number
  totalLeads: number
  dailyLeads: number
  costPerLead: number
  costChange?: number
  viewsChange?: number
  likesChange?: number
  newFollowersChange?: number
  leadsChange?: number
  dailyLeadsChange?: number
  costPerLeadChange?: number
}

export function XiaowangTestWeeklyAnalysis({
  xiaowangTestData,
  brokerData = [],
  title = "Weekly Performance Details"
}: XiaowangTestWeeklyAnalysisProps) {
  // Process data to get weekly metrics
  const weeklyMetrics = React.useMemo(() => {
    if (!xiaowangTestData?.dailyData || !Array.isArray(xiaowangTestData.dailyData)) {
      return []
    }

    // Create a map of leads by date from broker data
    const leadsPerDate: Record<string, number> = {}

    if (brokerData && Array.isArray(brokerData)) {
      brokerData.forEach(item => {
        if (!item || typeof item !== 'object') return

        let dateValue: string | null = null
        let dateField = ''

        // Try different date field names
        const dateFields = ['Date', 'date', '时间', 'Date ', 'date ']
        for (const field of dateFields) {
          if (item[field] !== undefined && item[field] !== null && item[field] !== '') {
            if (typeof item[field] === 'number') {
              // Excel serial number conversion
              const excelDate = new Date((item[field] - 25569) * 86400 * 1000)
              if (!isNaN(excelDate.getTime())) {
                dateValue = excelDate.toISOString().split('T')[0]
                dateField = field
                break
              }
            } else if (typeof item[field] === 'string') {
              // Try to parse string date
              const parsedDate = new Date(item[field])
              if (!isNaN(parsedDate.getTime())) {
                dateValue = parsedDate.toISOString().split('T')[0]
                dateField = field
                break
              }
            }
          }
        }

        if (dateValue) {
          leadsPerDate[dateValue] = (leadsPerDate[dateValue] || 0) + 1
        }
      })
    }

    // Group data by week
    const weekMap = new Map<string, any[]>()

    xiaowangTestData.dailyData.forEach((item: any) => {
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
      weekMap.get(weekKey)?.push({
        ...item,
        leads: leadsPerDate[item.date] || 0
      })
    })

    // Calculate metrics for each week
    const weeks: WeeklyMetrics[] = []

    weekMap.forEach((weekData, weekStartStr) => {
      const weekStart = new Date(weekStartStr)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)

      const totalCost = weekData.reduce((sum, d) => sum + (d.cost || 0), 0)
      const totalLeads = weekData.reduce((sum, d) => sum + (d.leads || 0), 0)
      const dailyLeads = totalLeads / 7 // Average leads per day
      const costPerLead = totalLeads > 0 ? totalCost / totalLeads : 0

      const metrics: WeeklyMetrics = {
        weekStart: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weekEnd: weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        weekEndDate: weekEnd,
        totalCost: totalCost,
        totalViews: weekData.reduce((sum, d) => sum + (d.clicks || 0), 0), // Map clicks to views
        totalLikes: weekData.reduce((sum, d) => sum + (d.likes || 0), 0),
        totalNewFollowers: weekData.reduce((sum, d) => sum + (d.followers || 0), 0),
        totalLeads: totalLeads,
        dailyLeads: dailyLeads,
        costPerLead: costPerLead
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
      if (previous.totalViews > 0) {
        current.viewsChange = ((current.totalViews - previous.totalViews) / previous.totalViews) * 100
      }
      if (previous.totalLikes > 0) {
        current.likesChange = ((current.totalLikes - previous.totalLikes) / previous.totalLikes) * 100
      }
      if (previous.totalNewFollowers > 0) {
        current.newFollowersChange = ((current.totalNewFollowers - previous.totalNewFollowers) / previous.totalNewFollowers) * 100
      }
      if (previous.totalLeads > 0) {
        current.leadsChange = ((current.totalLeads - previous.totalLeads) / previous.totalLeads) * 100
      }
      if (previous.dailyLeads > 0) {
        current.dailyLeadsChange = ((current.dailyLeads - previous.dailyLeads) / previous.dailyLeads) * 100
      }
      if (previous.costPerLead > 0) {
        current.costPerLeadChange = ((current.costPerLead - previous.costPerLead) / previous.costPerLead) * 100
      }
    }

    // Transform into WeeklyDataCard format
    return weeks.reverse().slice(0, 12).map(week => {
      const metrics: WeeklyMetricItem[] = [
        { key: 'leads', label: 'Leads', value: week.totalLeads, format: 'number', change: week.leadsChange, changeType: 'positive' },
        { key: 'dailyLeads', label: 'Daily Leads', value: week.dailyLeads, format: 'decimal', change: week.dailyLeadsChange, changeType: 'positive' },
        { key: 'cost', label: 'Cost', value: week.totalCost, format: 'currency', change: week.costChange, changeType: 'negative' },
        { key: 'costPerLead', label: 'Cost per Lead', value: week.costPerLead, format: 'currency', change: week.costPerLeadChange, changeType: 'negative' },
        { key: 'followers', label: 'New Followers', value: week.totalNewFollowers, format: 'number', change: week.newFollowersChange, changeType: 'positive' },
      ];
      
      return {
        weekStart: week.weekStart,
        weekEnd: week.weekEnd,
        weekEndDate: week.weekEndDate,
        metrics
      };
    });
  }, [xiaowangTestData, brokerData])

  return <WeeklyMetricsList weeks={weeklyMetrics} title={title} />;
}