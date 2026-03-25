"use client"

import React from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LabelList, ReferenceLine } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export interface MonthlyCostChartData {
  month: string;
  monthKey: string;
  cost: number;
  [key: string]: string | number; // For dynamic metric values
}

export interface MetricDefinition {
  value: string;
  label: string;
  color: string;
}

export interface MonthlyCostChartProps {
  data: MonthlyCostChartData[];
  title?: string;
  
  metricConfig: {
    dataKey: string;
    label: string;
    color: string;
    yAxisLabel: string;
  };
  
  avgCost: number;
  avgMetric: number;
  costScale: { domain: number[]; ticks: number[] };
  metricScale: { domain: number[]; ticks: number[] };
  
  notesMonthlyCount?: {[key: string]: number};
  
  selectedMetric: string;
  availableMetrics: MetricDefinition[];
  onMetricChange?: (metric: string) => void;
}

// Custom Label functionality extracted
function CustomLabel(props: any) {
  const { x, y, value, index, color, data, dataKey, payload, metricScale, costScale, isCost } = props

  if (!value || value === 0) return null

  const displayValue = isCost ? `$${value >= 1000 ? `${(value/1000).toFixed(1)}K` : value.toFixed(0)}` : (value >= 1000 ? `${(value/1000).toFixed(1)}K` : value.toFixed(0))
  const width = isCost ? 36 : 30
  const height = 14

  const currentData = payload || data?.[index]
  if (!currentData || !metricScale || !costScale) {
    const baseOffset = 15
    const staggerOffset = (index % 2) * 8
    const yOffset = baseOffset + staggerOffset
    const labelY = y - yOffset - height

    return (
      <g>
        <rect x={x - width/2} y={labelY} width={width} height={height} fill={`${color}CC`} stroke={color} strokeWidth="1" rx="3" />
        <text x={x} y={labelY + height/2} fill="white" fontSize={10} fontWeight="bold" textAnchor="middle" dominantBaseline="central">
          {displayValue}
        </text>
      </g>
    )
  }

  // Need to figure out the current metricKey from the non-cost dataKey 
  // By analyzing what was passed
  const metricKey = Object.keys(currentData).find(k => k !== 'month' && k !== 'monthKey' && k !== 'cost' && k !== 'leads') || 'views'
  
  const metricValue = currentData[metricKey] || 0
  const costValue = currentData.cost || 0

  const metricRatio = metricValue / metricScale.domain[1]
  const costRatio = costValue / costScale.domain[1]

  const baseOffset = 15
  const staggerOffset = (index % 3) * 6
  const yOffset = baseOffset + staggerOffset

  let labelY
  if (isCost) {
    if (costRatio > metricRatio) labelY = y - yOffset - height
    else labelY = y + yOffset
  } else {
    if (metricRatio > costRatio) labelY = y - yOffset - height
    else labelY = y + yOffset
  }

  return (
    <g>
      <rect x={x - width/2} y={labelY} width={width} height={height} fill={`${color}CC`} stroke={color} strokeWidth="1" rx="3" />
      <text x={x} y={labelY + height/2} fill="white" fontSize={10} fontWeight="bold" textAnchor="middle" dominantBaseline="central">
        {displayValue}
      </text>
    </g>
  )
}

function CustomTooltip({ active, payload, label, notesMonthlyCount, metricConfig }: any) {
  if (active && payload && payload.length) {
    const postsCount = notesMonthlyCount && notesMonthlyCount[label] ? notesMonthlyCount[label] : 0
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-3 min-w-[200px]">
        <p className="font-semibold text-gray-900 mb-2 border-b pb-2">{label}</p>
        <p className="text-sm text-blue-600 mb-2">📝 Posts: {postsCount}</p>
        {payload.map((entry: any, index: number) => {
          const isCost = entry.dataKey === 'cost'
          const val = isCost ? `$${entry.value.toFixed(2)}` : entry.value.toLocaleString()
          return (
            <p key={index} style={{ color: entry.color }} className="text-sm font-semibold mb-1">
              {entry.name.split(' (')[0]}: <span className="text-gray-700 font-normal">{val}</span>
            </p>
          )
        })}
      </div>
    )
  }
  return null
}

export function MonthlyCostChart({
  data,
  title = "Monthly Analysis",
  metricConfig,
  avgCost,
  avgMetric,
  costScale,
  metricScale,
  notesMonthlyCount = {},
  selectedMetric,
  availableMetrics,
  onMetricChange
}: MonthlyCostChartProps) {

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
              Monthly {metricConfig.label} & Cost Trend
            </CardTitle>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
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
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 40, right: 80, left: 40, bottom: 60 }}>
              <XAxis 
                dataKey="month"
                tick={(props: any) => {
                  const { x, y, payload } = props
                  const monthStr = payload.value
                  
                  // Try to find the matching key in notesMonthlyCount
                  // Since monthStr might be "Jan 2024" or "2024-01"
                  let postsCount = 0;
                  if (notesMonthlyCount) {
                    if (notesMonthlyCount[monthStr] !== undefined) {
                      postsCount = notesMonthlyCount[monthStr];
                    } else {
                      // Attempt to parse and match
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
                    <g>
                      <text x={x} y={y + 16} textAnchor="end" fill="#6B7280" fontSize="11" transform={`rotate(-45, ${x}, ${y + 16})`}>
                        {monthStr}
                      </text>
                      <text x={x} y={y + 30} textAnchor="end" fill="#6B7280" fontSize="10" transform={`rotate(-45, ${x}, ${y + 30})`}>
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
                yAxisId="metric"
                orientation="left"
                domain={metricScale.domain}
                ticks={metricScale.ticks}
                tick={{ fontSize: 11 }}
                label={{ value: metricConfig.yAxisLabel, angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
                tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : (val >= 1000 ? `${(val/1000).toFixed(1)}K` : val)}
              />
              
              <YAxis 
                yAxisId="cost"
                orientation="right"
                domain={costScale.domain}
                ticks={costScale.ticks}
                tick={{ fontSize: 11 }}
                label={{ value: 'Cost ($)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle' } }}
                tickFormatter={(val) => val >= 1000000 ? `$${(val/1000000).toFixed(1)}M` : (val >= 1000 ? `$${(val/1000).toFixed(1)}K` : `$${val}`)}
              />

              <Tooltip content={(props) => <CustomTooltip {...props} notesMonthlyCount={notesMonthlyCount} metricConfig={metricConfig} />} />
              <Legend />

              {avgCost > 0 && <ReferenceLine yAxisId="cost" y={avgCost} stroke="#C4A5E7" strokeWidth={2} strokeDasharray="8 8" />}
              {avgMetric > 0 && <ReferenceLine yAxisId="metric" y={avgMetric} stroke={`${metricConfig.color}80`} strokeWidth={2} strokeDasharray="8 8" />}

              <Line
                yAxisId="metric"
                type="monotone"
                dataKey={metricConfig.dataKey}
                stroke={metricConfig.color}
                strokeWidth={3}
                dot={{ fill: metricConfig.color, r: 5 }}
                name={`${metricConfig.label} (Avg: ${avgMetric >= 1000 ? `${(avgMetric/1000).toFixed(2)}K` : avgMetric.toFixed(2)})`}
                connectNulls={false}
              />

              <Line
                yAxisId="cost"
                type="monotone"
                dataKey="cost"
                stroke="#751FAE"
                strokeWidth={3}
                dot={{ fill: "#751FAE", r: 5 }}
                name={`Cost (Avg: $${avgCost.toFixed(2)})`}
                connectNulls={false}
              />

              {/* Labels */}
              <Line yAxisId="cost" type="monotone" dataKey="cost" stroke="transparent" dot={false} connectNulls={false} legendType="none">
                <LabelList content={(props) => <CustomLabel {...props} isCost={true} color="#751FAE" data={data} metricScale={metricScale} costScale={costScale} />} position="top" />
              </Line>

              <Line yAxisId="metric" type="monotone" dataKey={metricConfig.dataKey} stroke="transparent" dot={false} connectNulls={false} legendType="none">
                <LabelList content={(props) => <CustomLabel {...props} isCost={false} color={metricConfig.color} data={data} metricScale={metricScale} costScale={costScale} />} position="top" />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
