"use client"

import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LabelList, ReferenceLine } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export interface MonthlySingleMetricChartProps {
  data: any[];
  title?: string;
  metricConfig: {
    dataKey: string;
    label: string;
    color: string;
  };
  average: number;
  metricScale: { domain: number[]; ticks: number[] };
  notesMonthlyCount?: {[key: string]: number};
  selectedMetric: string;
  availableMetrics: { value: string; label: string; color: string }[];
  onMetricChange?: (metric: string) => void;
}

// Label component for cost metrics
const CostMetricLabel = (props: any) => {
  const { x, y, value, viewBox, color } = props
  if (!value || value === 0) return null
  
  const text = `$${value.toFixed(2)}`
  const width = 40
  const height = 14
  
  const chartHeight = viewBox?.height || 300
  const chartTop = viewBox?.y || 0
  const relativePosition = (y - chartTop) / chartHeight
  const shouldPlaceAbove = relativePosition >= 0.5
  const labelY = shouldPlaceAbove ? y - height - 8 : y + 8
  
  const labelColor = color || '#751FAE'
  
  return (
    <g>
      <rect x={x - width/2} y={labelY} width={width} height={height} fill={`${labelColor}CC`} stroke={labelColor} strokeWidth="1" rx="3" />
      <text x={x} y={labelY + height/2} fill="white" fontSize={10} fontWeight="bold" textAnchor="middle" dominantBaseline="central">
        {text}
      </text>
    </g>
  )
}

function CustomTooltip({ active, payload, label, notesMonthlyCount, metricConfig }: any) {
  if (active && payload && payload.length) {
    let postsCount = 0;
    if (notesMonthlyCount && notesMonthlyCount[label] !== undefined) {
      postsCount = notesMonthlyCount[label];
    } else if (notesMonthlyCount) {
      // Handle the "Jan 2024" format vs "2024-01" format mismatch
      const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      if (label.includes('-')) {
        const [year, m] = label.split('-')
        const parsedKey = `${monthNamesShort[parseInt(m) - 1]} ${year}`
        postsCount = notesMonthlyCount[parsedKey] || 0;
      }
    }

    const value = payload[0].value
    
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-4 shadow-xl min-w-[200px]">
        <p className="font-bold text-gray-900 mb-3 border-b pb-2">{label}</p>
        <div className="mb-2">
          <p className="text-sm font-semibold mb-1" style={{ color: '#8B5CF6' }}>📝 Posts</p>
          <p className="text-sm text-gray-700">{postsCount}</p>
        </div>
        <div>
          <p className="text-sm font-semibold mb-1" style={{ color: metricConfig.color }}>
            💰 {metricConfig.label}
          </p>
          <p className="text-sm text-gray-700">${value.toFixed(2)}</p>
        </div>
      </div>
    )
  }
  return null
}

export function MonthlySingleMetricChart({
  data,
  title = "Monthly Cost Analysis",
  metricConfig,
  average,
  metricScale,
  notesMonthlyCount = {},
  selectedMetric,
  availableMetrics,
  onMetricChange
}: MonthlySingleMetricChartProps) {

  if (!data || data.length === 0) {
    return (
      <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 mb-6 font-montserrat">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-gray-500">No data available</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle className="text-xl font-semibold text-gray-900 mb-6 font-montserrat">
              Monthly {metricConfig.label}
            </CardTitle>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Cost per:</span>
            {availableMetrics.map(metric => (
              <Button
                key={metric.value}
                variant={selectedMetric === metric.value ? "default" : "outline"}
                size="sm"
                onClick={() => onMetricChange?.(metric.value)}
                style={selectedMetric === metric.value 
                  ? { backgroundColor: metric.color, color: 'white', border: 'none' } 
                  : { borderColor: metric.color, color: metric.color }
                }
                className="hover:opacity-80 disabled:opacity-100"
              >
                {metric.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 40, bottom: 60 }}>
              <XAxis 
                dataKey="month"
                tick={(props: any) => {
                  const { x, y, payload } = props
                  const monthStr = payload.value
                  
                  let postsCount = 0;
                  if (notesMonthlyCount) {
                    if (notesMonthlyCount[monthStr] !== undefined) {
                      postsCount = notesMonthlyCount[monthStr];
                    } else {
                      const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                      let parsedKey = monthStr;
                      if (monthStr.includes('-')) {
                        const [year, m] = monthStr.split('-')
                        parsedKey = `${monthNamesShort[parseInt(m) - 1]} ${year}`
                      }
                      postsCount = notesMonthlyCount[parsedKey] || 0;
                    }
                  }

                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text x={0} y={0} dy={16} textAnchor="middle" fill="#6B7280" fontSize="12">
                        {monthStr}
                      </text>
                      <text x={0} y={0} dy={32} textAnchor="middle" fill="#6B7280" fontSize="11">
                        {postsCount} Posts
                      </text>
                    </g>
                  )
                }}
                height={100}
                scale="point"
                padding={{ left: 30, right: 30 }}
              />
              
              <YAxis 
                orientation="left"
                domain={metricScale.domain}
                ticks={metricScale.ticks}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={(value) => {
                  if (value >= 1000) return `$${(value/1000).toFixed(1)}K`
                  return `$${value.toFixed(2)}`
                }}
                label={{ value: `${metricConfig.label} ($)`, angle: -90, position: 'insideLeft' }}
              />
              
              <Tooltip content={(props) => <CustomTooltip {...props} notesMonthlyCount={notesMonthlyCount} metricConfig={metricConfig} />} />
              <Legend />

              {average > 0 && <ReferenceLine y={average} stroke={`${metricConfig.color}80`} strokeWidth={2} strokeDasharray="8 8" />}
              
              <Line
                type="monotone"
                dataKey={metricConfig.dataKey}
                stroke={metricConfig.color}
                strokeWidth={3}
                dot={{ fill: metricConfig.color, strokeWidth: 2, r: 4 }}
                name={`${metricConfig.label} (Avg: $${average.toFixed(2)})`}
                connectNulls={false}
              />
              
              <Line type="monotone" dataKey={metricConfig.dataKey} stroke="transparent" dot={false} connectNulls={false} legendType="none">
                <LabelList content={(props: any) => <CostMetricLabel {...props} color={metricConfig.color} />} position="top" />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
