"use client"

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useWeeklyDataFilter } from '@/hooks/useDateFilter';

interface WeeklyCostLeadsData {
  week: string;
  leadsPrice: number;
  leadsTotal: number;
  totalCost: number;
}

interface WeeklyCostLeadsProps {
  data: WeeklyCostLeadsData[];
  title?: string;
  startDate?: string;
  endDate?: string;
}

export function WeeklyCostLeads({ data, title = "Weekly Cost & Leads", startDate, endDate }: WeeklyCostLeadsProps) {
  // Comment状态
  const [comment, setComment] = useState('');
  
  // 从localStorage加载保存的评论
  useEffect(() => {
    const savedComment = localStorage.getItem('weeklyCostLeadsComment');
    if (savedComment) {
      setComment(savedComment);
    }
  }, []);
  
  // 使用共享的日期筛选Hook
  const filteredData = useWeeklyDataFilter(data, startDate, endDate);
  // 自定义标签组件 - 成本数据 (左Y轴, 紫色线)
  const renderCostLabel = (props: any): React.ReactElement<SVGElement> => {
    const { x, y, value, index } = props;
    if (!value || value === 0) return <></> as React.ReactElement<SVGElement>;
    
    // 只在每隔2个点显示标签，避免过度拥挤
    if (index % 2 !== 0) return <></> as React.ReactElement<SVGElement>;
    
    return (
      <g>
        {/* 背景矩形 - 位置更远离线条 */}
        <rect
          x={x - 22}
          y={y - 40}
          width={44}
          height={18}
          fill="white"
          stroke="#751fae"
          strokeWidth={1}
          rx={4}
          opacity={0.95}
          filter="drop-shadow(0 1px 2px rgba(0,0,0,0.1))"
        />
        {/* 文字 */}
        <text 
          x={x} 
          y={y - 27} 
          fill="#751fae" 
          textAnchor="middle" 
          fontSize="9"
          fontWeight="600"
        >
          ${Math.round(value)}
        </text>
      </g>
    );
  };

  // 自定义标签组件 - Leads数据 (右Y轴, 粉色线)
  const renderLeadsLabel = (props: any): React.ReactElement<SVGElement> => {
    const { x, y, value, index } = props;
    if (!value || value === 0) return <></> as React.ReactElement<SVGElement>;
    
    // 只在每隔2个点显示标签，与Cost标签错开显示
    if (index % 2 === 0) return <></> as React.ReactElement<SVGElement>;
    
    return (
      <g>
        {/* 背景矩形 - 位置更远离线条 */}
        <rect
          x={x - 18}
          y={y + 22}
          width={36}
          height={18}
          fill="white"
          stroke="#ef3c99"
          strokeWidth={1}
          rx={4}
          opacity={0.95}
          filter="drop-shadow(0 1px 2px rgba(0,0,0,0.1))"
        />
        {/* 文字 */}
        <text 
          x={x} 
          y={y + 35} 
          fill="#ef3c99" 
          textAnchor="middle" 
          fontSize="9"
          fontWeight="600"
        >
          {value}
        </text>
      </g>
    );
  };
  
  return (
    <div className="w-full">
      <div className="h-[500px]">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Weekly Cost & Leads
          {startDate && endDate && (
            <span className="text-sm text-gray-500 ml-2">({startDate} to {endDate})</span>
          )}
        </h2>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={filteredData}
            margin={{
              top: 80,
              right: 60,
              left: 20,
              bottom: 160,
            }}
          >
            <XAxis 
              dataKey="week" 
              angle={-45}
              textAnchor="end"
              height={100}
              fontSize={10}
              interval={0}
              stroke="#666"
            />
            <YAxis 
              yAxisId="left" 
              orientation="left" 
              fontSize={12}
              stroke="#666"
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              fontSize={12}
              stroke="#666"
            />
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'totalCost') return [`$${Number(value).toFixed(2)}`, 'Total Cost (AUD)'];
                if (name === 'leadsTotal') return [`${value}`, 'Total Leads'];
                return [value, name];
              }}
              labelFormatter={(label) => `Week: ${label}`}
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="totalCost" 
              stroke="#751fae" 
              strokeWidth={2}
              name="Total Cost (AUD)"
              dot={{ fill: '#751fae', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7, stroke: '#751fae', strokeWidth: 2, fill: '#fff' }}
              label={renderCostLabel}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="leadsTotal" 
              stroke="#ef3c99" 
              strokeWidth={2}
              name="Total Leads"
              dot={{ fill: '#ef3c99', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7, stroke: '#ef3c99', strokeWidth: 2, fill: '#fff' }}
              label={renderLeadsLabel}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Comment输入框 */}
      <div className="mt-6 p-4 bg-black rounded-lg border border-gray-600">
        <Label htmlFor="weekly-cost-leads-comment" className="text-sm text-white font-montserrat font-semibold mb-2 block">
          Comments & Notes
        </Label>
        <Textarea
          id="weekly-cost-leads-comment"
          placeholder="Add your comments or insights about the weekly cost & leads data..."
          value={comment}
          onChange={(e) => {
            const newComment = e.target.value;
            setComment(newComment);
            localStorage.setItem('weeklyCostLeadsComment', newComment);
          }}
          className="w-full min-h-[80px] resize-none bg-gray-800 border-gray-600 text-white placeholder-gray-400 font-montserrat font-light focus:border-purple-400 focus:ring-purple-400/20"
        />
        {comment && (
          <div className="mt-2 text-xs text-gray-400 font-montserrat font-light">
            Character count: {comment.length}
          </div>
        )}
      </div>
    </div>
  );
}