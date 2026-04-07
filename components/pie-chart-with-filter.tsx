"use client"

import React, { useMemo } from 'react';
import { WeeklyLeadsDistribution } from '@/components/weekly-leads-distribution';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// 移除静态导入，改为接收props
import { getDataRange } from '@/lib/date-utils';

// 处理饼图数据 - 使用真实Excel数据中的 Broker 列，支持时间筛选
function processBrokerData(brokerDataJson: any[], startDate?: string, endDate?: string) {
  try {
    const today = new Date()
    let clientsData = brokerDataJson || []

    // 如果有时间筛选，过滤数据
    if (startDate && endDate) {
      clientsData = clientsData.filter((client: any) => {
        const dateStr: string = client.date
        if (!dateStr) return false
        // date is stored as YYYY-MM-DD string — compare directly
        return dateStr >= startDate && dateStr <= endDate
      })
    }

    // 统计每个 Broker 的客户数量
    const brokerCounts = clientsData.reduce((acc: any, client: any) => {
      const rawBroker = (client.broker || '').trim()
      const dateStr: string = client.date || ''
      let broker: string

      if (!rawBroker) {
        // Empty broker: "External Broker" from 2026-03-30 onwards; otherwise ignored
        broker = dateStr >= '2026-03-30' ? 'External Broker' : 'Unknown'
      } else if (
        rawBroker === '小助手' ||
        rawBroker === '小助理' ||
        rawBroker.toLowerCase() === 'zoey'
      ) {
        // 90-day rule: leads stuck in 小助手/小助理 > 90 days are considered lost
        if (dateStr) {
          const leadDate = new Date(dateStr + 'T00:00:00')
          const daysSinceLead = (today.getTime() - leadDate.getTime()) / (1000 * 60 * 60 * 24)
          broker = daysSinceLead > 90 ? 'Unknown' : 'Pending Assignment'
        } else {
          broker = 'Unknown'
        }
      } else if (rawBroker.toLowerCase() === 'yuki') {
        broker = 'Yuki/Ruofan'
      } else if (rawBroker.toLowerCase() === 'ruofan') {
        broker = 'Yuki/Ruofan'
      } else if (rawBroker === 'Linudo') {
        broker = 'Linduo'
      } else if (rawBroker.toLowerCase() === 'ziv') {
        broker = 'Ziv'
      } else {
        broker = rawBroker
      }

      acc[broker] = (acc[broker] || 0) + 1
      return acc
    }, {})

    const excludeBrokers = ['Unknown'];
    const filteredBrokers = Object.entries(brokerCounts)
      .filter(([broker, count]: [string, any]) => {
        return count > 0 && !excludeBrokers.includes(broker);
      });
    
    // 计算过滤后的总数用于百分比计算
    const total = filteredBrokers.reduce((sum, [broker, count]) => sum + (count as number), 0);
    
    return filteredBrokers
      .map(([broker, count]: [string, any]) => ({
        broker,
        count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => b.count - a.count) // 按数量降序排列
  } catch (error) {
    console.error('Failed to process pie chart data:', error)
    return []
  }
}

interface PieChartWithFilterProps {
  startDate?: string;
  endDate?: string;
  brokerData?: any[];
}

export function PieChartWithFilter({ startDate = '', endDate = '', brokerData = [] }: PieChartWithFilterProps) {
  // 获取筛选后的数据
  const processedBrokerData = useMemo(() => {
    const data = processBrokerData(brokerData, startDate, endDate);
    return data;
  }, [brokerData, startDate, endDate]);

  const totalClients = useMemo(() => {
    return processedBrokerData.reduce((sum, broker) => sum + broker.count, 0);
  }, [processedBrokerData]);



  return (
    <div className="p-6 flex flex-col h-full">
      {/* 饼图标题 */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 font-montserrat">
          Broker Leads Distribution{(startDate && endDate) ? ' (Selected Period)' : ''}
        </h3>
      </div>

      {/* KPI 卡片 - Total Leads */}
      <div className="mb-6 bg-white/90 backdrop-blur-sm rounded-lg shadow-md border border-gray-200/60 p-4 text-center hover:shadow-lg transition-all duration-200">
        <div className="text-sm font-semibold text-[#0ea5e9] mb-2 font-montserrat">
          Total Leads{(startDate && endDate) ? ' (Selected Period)' : ''}
        </div>
        <div className="text-3xl font-semibold text-[#1e293b] font-montserrat">
          {totalClients}
        </div>
      </div>

      {/* 饼图 */}
      <div className="flex-1">
        <WeeklyLeadsDistribution 
          data={processedBrokerData} 
          title=""
        />
      </div>
      
      {/* Broker统计信息 */}
      <div className="mt-2">        
        {/* 详细列表 - 两列显示 */}
        <div className="grid grid-cols-2 gap-1">
          {processedBrokerData.length > 0 ? (
            processedBrokerData.map((broker, index) => {
              // 使用与右侧饼图完全一致的锁死颜色映射
              const getBrokerColor = (brokerName: string) => {
                // 锁死的broker颜色映射（与右侧饼图保持一致）
                const fixedBrokerColors: { [key: string]: string } = {
                  'Ziv': '#FF8C00',
                  'Yuki/Ruofan': '#751fae',
                  'Jo': '#a2e329',
                  'Amy': '#3cbde5',
                  'Pending Assignment': '#95A5A6',
                  'Linduo': '#8f4abc',
                  'External Broker': '#4A90D9',
                };
                
                // 直接返回预定义的颜色，不再使用动态逻辑
                if (fixedBrokerColors[brokerName]) {
                  return fixedBrokerColors[brokerName];
                }
                
                // 对于新的broker，使用备用颜色
                const fallbackColors = ['#a875ca', '#c29fd9', '#ef3c99', '#f186be', '#f3abd0', '#f4d0e3'];
                return fallbackColors[0]; // 默认第一个备用颜色
              };

              return (
                <div key={broker.broker} className="flex items-center gap-1.5 p-1.5 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ 
                      backgroundColor: getBrokerColor(broker.broker)
                    }}
                  />
                  <span className="text-xs font-medium text-gray-800 min-w-[30px]">{broker.broker}</span>
                  <span className="text-xs font-semibold text-gray-900">{broker.count} leads</span>
                  <span className="text-xs text-gray-600 ml-1">{broker.percentage}%</span>
                </div>
              );
            })
          ) : (
            <div className="col-span-2 text-center text-gray-500 py-4 font-montserrat font-light">
              No data available for the selected time period
            </div>
          )}
        </div>

      </div>
    </div>
  );
}