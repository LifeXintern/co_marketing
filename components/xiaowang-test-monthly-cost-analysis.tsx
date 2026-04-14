"use client"

import React, { useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MonthlyCostChart } from "@/components/ui/monthly-cost-chart"

interface XiaowangTestMonthlyCostAnalysisProps {
  xiaowangTestData?: any
  brokerData?: any[]
  title?: string
  selectedMetric?: MetricType
  onMetricChange?: (metric: MetricType) => void
  notesMonthlyCount?: {[key: string]: number} // Notes count by month
}

interface MonthlyData {
  month: string
  monthKey: string
  views: number
  likes: number
  followers: number
  leads: number
  cost: number
}

type MetricType = 'views' | 'likes' | 'followers' | 'leads'

// Process Xiaowang test data combined with consultation leads data - aggregated by month
function processXiaowangTestMonthlyData(xiaowangTestData: any, brokerData: any[]): MonthlyData[] {
  if (!xiaowangTestData?.dailyData || !Array.isArray(xiaowangTestData.dailyData)) {
    return []
  }

  // Aggregate leads by month directly from broker data — independent of which ad dates
  // exist in dailyData so that switching accounts never changes the leads count.
  const leadsPerMonth: Record<string, number> = {}

  if (brokerData && Array.isArray(brokerData)) {
    brokerData.forEach(item => {
      if (!item || typeof item !== 'object') return

      let dateValue: string | null = null

      // Try different date field names
      const dateFields = ['Date', 'date', '时间', 'Date ', 'date ']
      for (const field of dateFields) {
        if (item[field] !== undefined && item[field] !== null && item[field] !== '') {
          if (typeof item[field] === 'number') {
            const excelDate = new Date((item[field] - 25569) * 86400 * 1000)
            if (!isNaN(excelDate.getTime())) {
              dateValue = excelDate.toISOString().split('T')[0]
              break
            }
          } else if (typeof item[field] === 'string') {
            const parsedDate = new Date(item[field])
            if (!isNaN(parsedDate.getTime())) {
              dateValue = parsedDate.toISOString().split('T')[0]
              break
            }
          }
        }
      }

      if (dateValue) {
        const d = new Date(dateValue)
        if (!isNaN(d.getTime())) {
          const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          leadsPerMonth[monthKey] = (leadsPerMonth[monthKey] || 0) + 1
        }
      }
    })
  }

  // Process daily data and aggregate by month
  const monthlyMap: Record<string, {
    views: number
    likes: number
    followers: number
    leads: number
    cost: number
  }> = {}

  xiaowangTestData.dailyData.forEach((dailyItem: any) => {
    const date = new Date(dailyItem.date)
    if (isNaN(date.getTime())) return

    // Get year and month
    const year = date.getFullYear()
    const month = date.getMonth() + 1 // getMonth() returns 0-11
    const monthKey = `${year}-${String(month).padStart(2, '0')}`
    const dateKey = dailyItem.date

    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = {
        views: 0,
        likes: 0,
        followers: 0,
        leads: 0,
        cost: 0
      }
    }

    // Aggregate ad metrics only — leads are assigned after from leadsPerMonth
    monthlyMap[monthKey].views += dailyItem.clicks || 0
    monthlyMap[monthKey].likes += dailyItem.likes || 0
    monthlyMap[monthKey].followers += dailyItem.followers || 0
    monthlyMap[monthKey].cost += dailyItem.cost || 0
  })

  // Assign total leads per month from broker data (account-independent)
  Object.keys(monthlyMap).forEach(monthKey => {
    monthlyMap[monthKey].leads = leadsPerMonth[monthKey] || 0
  })

  // Convert to array and format
  return Object.entries(monthlyMap)
    .map(([monthKey, data]) => {
      const [year, month] = monthKey.split('-')
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const monthName = monthNames[parseInt(month) - 1]

      return {
        month: `${monthName} ${year}`,
        monthKey,
        views: data.views,
        likes: data.likes,
        followers: data.followers,
        leads: data.leads,
        cost: data.cost
      }
    })
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
}

// Custom Label and Tooltip logic have been extracted to components/ui/monthly-cost-chart.tsx

export function XiaowangTestMonthlyCostAnalysis({
  xiaowangTestData,
  brokerData = [],
  title = "Monthly Views/Likes/Followers/Leads & Cost Trend Analysis",
  selectedMetric: propSelectedMetric,
  onMetricChange,
  notesMonthlyCount = {}
}: XiaowangTestMonthlyCostAnalysisProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>(propSelectedMetric || 'views')

  // Sync with prop changes
  useEffect(() => {
    if (propSelectedMetric) {
      setSelectedMetric(propSelectedMetric)
    }
  }, [propSelectedMetric])

  // Handle metric change
  const handleMetricChange = (metric: MetricType) => {
    setSelectedMetric(metric)
    onMetricChange?.(metric)
  }

  // Process monthly data (use all data, no filtering)
  const monthlyData = useMemo(() => {
    return processXiaowangTestMonthlyData(xiaowangTestData, brokerData)
  }, [xiaowangTestData, brokerData])

  // Calculate dynamic scales and averages directly from raw data
  const { metricScale, costScale, avgMetric, avgCost } = useMemo(() => {
    if (!monthlyData || monthlyData.length === 0) {
      return {
        metricScale: { domain: [0, 100], ticks: [0, 25, 50, 75, 100] },
        costScale: { domain: [0, 1000], ticks: [0, 250, 500, 750, 1000] },
        avgMetric: 0,
        avgCost: 0
      }
    }

    // Calculate monthly averages from the processed monthly data
    const metricValues = monthlyData.map(item => item[selectedMetric])
    const costValues = monthlyData.map(item => item.cost)

    // Calculate averages for monthly data - SUM(Cost)/number of months and SUM(xxx)/number of months
    const totalCost = costValues.reduce((sum, val) => sum + val, 0)
    const totalMetric = metricValues.reduce((sum, val) => sum + val, 0)
    const numberOfMonths = monthlyData.length
    const avgCost = numberOfMonths > 0 ? totalCost / numberOfMonths : 0
    const avgMetric = numberOfMonths > 0 ? totalMetric / numberOfMonths : 0

    const maxMetric = Math.max(...metricValues, 1)
    const maxCost = Math.max(...costValues, 1)

    // Calculate nice scales
    const metricMax = Math.ceil(maxMetric * 1.1)
    const costMax = Math.ceil(maxCost * 1.1)

    const metricStep = Math.ceil(metricMax / 4)
    const costStep = Math.ceil(costMax / 4)

    return {
      metricScale: {
        domain: [0, metricMax],
        ticks: [0, metricStep, metricStep * 2, metricStep * 3, metricMax]
      },
      costScale: {
        domain: [0, costMax],
        ticks: [0, costStep, costStep * 2, costStep * 3, costMax]
      },
      avgMetric,
      avgCost
    }
  }, [monthlyData, selectedMetric])

  // Get current metric config
  const metricConfig = useMemo(() => {
    switch (selectedMetric) {
      case 'views': return { label: 'Views', color: '#3CBDE5' }
      case 'likes': return { label: 'Likes', color: '#EF3C99' }
      case 'followers': return { label: 'Followers', color: '#10B981' }
      case 'leads': return { label: 'Leads', color: '#F59E0B' }
      default: return { label: 'Views', color: '#3CBDE5' }
    }
  }, [selectedMetric])

  if (!monthlyData || monthlyData.length === 0) {
    return (
      <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 mb-6 font-montserrat">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-gray-500">
            No monthly data available
          </div>
        </CardContent>
      </Card>
    )
  }

  const availableMetrics = [
    { value: 'views', label: 'Views', color: '#3CBDE5' },
    { value: 'likes', label: 'Likes', color: '#EF3C99' },
    { value: 'followers', label: 'Followers', color: '#10B981' },
    { value: 'leads', label: 'Leads', color: '#F59E0B' }
  ];

  return (
    <MonthlyCostChart
      data={monthlyData as any}
      title={title}
      metricConfig={{...metricConfig, dataKey: selectedMetric, yAxisLabel: metricConfig.label}}
      avgCost={avgCost}
      avgMetric={avgMetric}
      costScale={costScale}
      metricScale={metricScale}
      notesMonthlyCount={notesMonthlyCount}
      selectedMetric={selectedMetric}
      availableMetrics={availableMetrics}
      onMetricChange={(m) => handleMetricChange(m as MetricType)}
    />
  )
}