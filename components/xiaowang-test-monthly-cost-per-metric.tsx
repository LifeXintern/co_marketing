"use client"

import React, { useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MonthlySingleMetricChart } from "@/components/ui/monthly-single-metric-chart"

interface XiaowangTestMonthlyCostPerMetricProps {
  xiaowangTestData?: any
  brokerData?: any[]
  title?: string
  selectedMetric?: 'views' | 'likes' | 'followers' | 'leads'
  onMetricChange?: (metric: 'views' | 'likes' | 'followers' | 'leads') => void
  notesMonthlyCount?: {[key: string]: number} // Notes count by month
}

interface MonthlyData {
  month: string
  monthKey: string
  costPerView: number
  costPerLike: number
  costPerFollower: number
  costPerLead: number
}

type MetricType = 'costPerView' | 'costPerLike' | 'costPerFollower' | 'costPerLead'

// Process Xiaowang test data combined with consultation leads data - aggregated by month for cost per metrics
function processXiaowangTestMonthlyCostData(xiaowangTestData: any, brokerData: any[]): MonthlyData[] {
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

  // Convert to array and calculate cost per metrics
  return Object.entries(monthlyMap)
    .map(([monthKey, data]) => {
      const [year, month] = monthKey.split('-')
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const monthName = monthNames[parseInt(month) - 1]

      return {
        month: `${monthName} ${year}`,
        monthKey,
        costPerView: data.views > 0 ? data.cost / data.views : 0,
        costPerLike: data.likes > 0 ? data.cost / data.likes : 0,
        costPerFollower: data.followers > 0 ? data.cost / data.followers : 0,
        costPerLead: data.leads > 0 ? data.cost / data.leads : 0
      }
    })
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
}

// Custom label and tooltip extracted to shared component

export function XiaowangTestMonthlyCostPerMetric({
  xiaowangTestData,
  brokerData = [],
  title = "Monthly Cost Per Metric Analysis",
  selectedMetric: propSelectedMetric,
  onMetricChange,
  notesMonthlyCount = {}
}: XiaowangTestMonthlyCostPerMetricProps) {
  // Map external metric to internal metric type
  const mapToInternalMetric = (metric: 'views' | 'likes' | 'followers' | 'leads'): MetricType => {
    const mapping: Record<string, MetricType> = {
      'views': 'costPerView',
      'likes': 'costPerLike',
      'followers': 'costPerFollower',
      'leads': 'costPerLead'
    }
    return mapping[metric] || 'costPerView'
  }

  const mapToExternalMetric = (metric: MetricType): 'views' | 'likes' | 'followers' | 'leads' => {
    const mapping: Record<MetricType, 'views' | 'likes' | 'followers' | 'leads'> = {
      'costPerView': 'views',
      'costPerLike': 'likes',
      'costPerFollower': 'followers',
      'costPerLead': 'leads'
    }
    return mapping[metric] || 'views'
  }

  const [selectedMetric, setSelectedMetric] = useState<MetricType>(
    propSelectedMetric ? mapToInternalMetric(propSelectedMetric) : 'costPerView'
  )

  // Sync with prop changes
  useEffect(() => {
    if (propSelectedMetric) {
      setSelectedMetric(mapToInternalMetric(propSelectedMetric))
    }
  }, [propSelectedMetric])

  // Handle metric change
  const handleMetricChange = (metric: MetricType) => {
    setSelectedMetric(metric)
    onMetricChange?.(mapToExternalMetric(metric))
  }

  // Get current metric config
  const metricConfig = useMemo(() => {
    switch (selectedMetric) {
      case 'costPerView': return { label: 'Cost Per View', color: '#3CBDE5', dataKey: 'costPerView' }
      case 'costPerLike': return { label: 'Cost Per Like', color: '#EF3C99', dataKey: 'costPerLike' }
      case 'costPerFollower': return { label: 'Cost Per Follower', color: '#10B981', dataKey: 'costPerFollower' }
      case 'costPerLead': return { label: 'Cost Per Lead', color: '#F59E0B', dataKey: 'costPerLead' }
      default: return { label: 'Cost Per View', color: '#3CBDE5', dataKey: 'costPerView' }
    }
  }, [selectedMetric])

  // Process monthly cost per metric data (use all data, no filtering)
  const monthlyData = useMemo(() => {
    return processXiaowangTestMonthlyCostData(xiaowangTestData, brokerData)
  }, [xiaowangTestData, brokerData])

  // Calculate dynamic scales and average directly from raw data
  const { metricScale, average } = useMemo(() => {
    if (!monthlyData || monthlyData.length === 0) {
      return {
        metricScale: { domain: [0, 10], ticks: [0, 2.5, 5, 7.5, 10] },
        average: 0
      }
    }

    // Calculate average as SUM(Cost)/SUM(Metric) from filtered time period
    // Get the date range from the filtered monthly data
    const monthStartDates = monthlyData.map(item => item.monthKey + '-01')
    const monthEndDates = monthlyData.map(item => {
      const [year, month] = item.monthKey.split('-')
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate()
      return `${item.monthKey}-${lastDay.toString().padStart(2, '0')}`
    })
    const earliestDate = Math.min(...monthStartDates.map(d => new Date(d).getTime()))
    const latestDate = Math.max(...monthEndDates.map(d => new Date(d).getTime()))

    const filteredDailyData = xiaowangTestData?.dailyData?.filter((item: any) => {
      const itemDate = new Date(item.date).getTime()
      return itemDate >= earliestDate && itemDate <= latestDate
    }) || []

    const totalCost = filteredDailyData.reduce((sum, item) => sum + (item.cost || 0), 0)
    let totalMetric = 0

    switch (selectedMetric) {
      case 'costPerView':
        totalMetric = filteredDailyData.reduce((sum, item) => sum + (item.clicks || 0), 0)
        break
      case 'costPerLike':
        totalMetric = filteredDailyData.reduce((sum, item) => sum + (item.likes || 0), 0)
        break
      case 'costPerFollower':
        totalMetric = filteredDailyData.reduce((sum, item) => sum + (item.followers || 0), 0)
        break
      case 'costPerLead':
        // For leads, we need to calculate from brokerData for the filtered period
        const leadsPerDate: Record<string, number> = {}
        if (brokerData && brokerData.length > 0) {
          const uniqueClientsByDate: Record<string, Set<any>> = {}
          brokerData.forEach((item) => {
            const dateField = item.date || item['日期'] || item.Date || item.时间
            if (dateField && item.no !== null && item.no !== undefined) {
              let date: string
              if (typeof dateField === 'number') {
                const excelDate = new Date((dateField - 25569) * 86400 * 1000)
                date = excelDate.toISOString().split('T')[0]
              } else if (typeof dateField === 'string' && /^\d+$/.test(dateField)) {
                const excelSerialNumber = parseInt(dateField)
                const excelDate = new Date((excelSerialNumber - 25569) * 86400 * 1000)
                date = excelDate.toISOString().split('T')[0]
              } else if (dateField instanceof Date) {
                date = dateField.toISOString().split('T')[0]
              } else {
                date = String(dateField).split(' ')[0]
              }
              if (date && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
                if (!uniqueClientsByDate[date]) {
                  uniqueClientsByDate[date] = new Set()
                }
                uniqueClientsByDate[date].add(item.no)
              }
            }
          })
          Object.keys(uniqueClientsByDate).forEach(date => {
            leadsPerDate[date] = uniqueClientsByDate[date].size
          })
        }
        totalMetric = filteredDailyData.reduce((sum, item) => sum + (leadsPerDate[item.date] || 0), 0)
        break
      default:
        totalMetric = 0
    }

    const average = totalMetric > 0 ? totalCost / totalMetric : 0

    // For scale calculation, still use processed monthlyData
    const values = monthlyData.map(item => item[metricConfig.dataKey]).filter(v => v > 0)
    if (values.length === 0) {
      return {
        metricScale: { domain: [0, Math.max(10, average * 1.2)], ticks: [0, 2.5, 5, 7.5, 10] },
        average
      }
    }

    // Include average in scale calculation
    if (average > 0) values.push(average)

    const maxValue = Math.max(...values)
    const roundedMax = Math.ceil(maxValue * 1.2)
    const step = roundedMax / 4

    return {
      metricScale: {
        domain: [0, roundedMax],
        ticks: [0, step, step * 2, step * 3, roundedMax].map(v => Math.round(v * 100) / 100)
      },
      average
    }
  }, [monthlyData, metricConfig.dataKey, xiaowangTestData, brokerData, selectedMetric])

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
            No monthly data available - xiaowangTestData: {xiaowangTestData ? 'exists' : 'null'}, brokerData: {brokerData?.length || 0} items
          </div>
        </CardContent>
      </Card>
    )
  }

  const availableMetrics = [
    { value: 'costPerView', label: 'View', color: '#3CBDE5' },
    { value: 'costPerLike', label: 'Like', color: '#EF3C99' },
    { value: 'costPerFollower', label: 'Follower', color: '#10B981' },
    { value: 'costPerLead', label: 'Lead', color: '#F59E0B' }
  ];

  return (
    <MonthlySingleMetricChart
      data={monthlyData}
      title={title}
      metricConfig={metricConfig}
      average={average}
      metricScale={metricScale}
      notesMonthlyCount={notesMonthlyCount}
      selectedMetric={selectedMetric}
      availableMetrics={availableMetrics}
      onMetricChange={(m) => handleMetricChange(m as MetricType)}
    />
  )
}