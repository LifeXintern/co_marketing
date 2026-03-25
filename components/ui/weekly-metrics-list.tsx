"use client"

import React from 'react'

export interface WeeklyMetricItem {
  key: string;
  label: string;
  value: number;
  format: 'number' | 'currency' | 'decimal';
  change?: number;
  changeType: 'positive' | 'negative';
}

export interface WeeklyDataCard {
  weekStart: string;
  weekEnd: string;
  weekEndDate: Date;
  metrics: WeeklyMetricItem[];
}

interface WeeklyMetricsListProps {
  weeks: WeeklyDataCard[];
  title?: string;
}

const formatNumber = (num: number, format: string) => {
  if (format === 'currency') {
    return '$' + (num >= 1000000 ? (num / 1000000).toFixed(1) + 'M' : num >= 1000 ? (num / 1000).toFixed(1) + 'K' : num.toFixed(0));
  }
  if (format === 'decimal') {
    return num.toFixed(2);
  }
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toFixed(0);
}

const formatWeekEndDate = (weekEndDate: Date) => {
  return weekEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const renderChangePercent = (change: number | undefined, metricType: 'positive' | 'negative' = 'positive') => {
  if (change === undefined) return null;
  
  const isPositive = change > 0;
  const arrow = isPositive ? '↑' : change < 0 ? '↓' : '→';
  
  let color = '';
  if (metricType === 'positive') {
    color = isPositive ? 'text-green-600' : 'text-red-600';
  } else {
    color = isPositive ? 'text-red-600' : 'text-green-600';
  }
  
  return (
    <span className={`${color} text-xs font-medium font-montserrat`}>
      {arrow} {Math.abs(change).toFixed(1)}%
    </span>
  );
}

export function WeeklyMetricsList({ weeks, title = "Weekly Performance Details" }: WeeklyMetricsListProps) {
  if (!weeks || weeks.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-lg border border-gray-200/50 p-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
              <span className="text-purple-600 text-lg">📅</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 font-montserrat">{title}</h3>
          </div>
        </div>
        <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-lg border border-gray-200/50 p-8">
          <p className="text-center text-gray-500">No weekly data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-lg border border-gray-200/50 p-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
            <span className="text-purple-600 text-lg">📅</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 font-montserrat">{title}</h3>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {weeks.map((weekData, index) => (
          <div key={index} className="bg-white/95 backdrop-blur-xl rounded-lg shadow-lg border border-gray-200/50 p-4">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
              <div className="flex-1">
                <h4 className="text-2xl font-black text-[#751FAE] font-montserrat">
                  Week of {formatWeekEndDate(weekData.weekEndDate)}
                </h4>
              </div>
              {index === 0 && (
                <span className="px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs rounded-full font-semibold">
                  Latest
                </span>
              )}
            </div>
            
            <div className="space-y-2">
              {weekData.metrics.map((metric) => (
                <div key={metric.key} className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200/60 p-3 hover:shadow-lg transition-all duration-200 relative">
                  <div className="text-xs font-semibold text-[#751FAE] font-montserrat mb-2">{metric.label}</div>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-semibold text-[#FF1493] font-montserrat">
                      {formatNumber(metric.value, metric.format)}
                    </div>
                    {renderChangePercent(metric.change, metric.changeType)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
