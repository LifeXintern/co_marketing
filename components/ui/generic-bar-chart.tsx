"use client"

import React, { ReactNode } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export interface BarConfig {
  key: string;
  name?: string;
  color?: string;
  yAxisId?: "left" | "right";
  stackId?: string;
  label?: any;
}

export interface GenericBarChartProps {
  data: any[];
  xAxisKey: string;
  bars: BarConfig[];
  title?: string;
  subtitle?: string;
  height?: number | string;
  showComment?: boolean;
  commentId?: string;
  tooltipFormatter?: (value: any, name: any) => [any, any];
  legendContent?: (props: any) => ReactNode;
}

export function GenericBarChart({
  data,
  xAxisKey,
  bars,
  title,
  subtitle,
  height = 400,
  showComment = true,
  commentId,
  tooltipFormatter,
  legendContent
}: GenericBarChartProps) {
  const [comment, setComment] = React.useState('');
  
  React.useEffect(() => {
    if (commentId) {
      const savedComment = localStorage.getItem(commentId);
      if (savedComment) {
        setComment(savedComment);
      }
    }
  }, [commentId]);

  const hasLeftAxis = bars.some(b => b.yAxisId === 'left' || !b.yAxisId);
  const hasRightAxis = bars.some(b => b.yAxisId === 'right');

  return (
    <div className="w-full">
      <div style={{ height }}>
        {title && (
          <h2 className="text-xl font-semibold text-gray-900 mb-4 font-montserrat">
            {title}
            {subtitle && (
              <span className="text-sm text-gray-500 ml-2 font-montserrat font-light">{subtitle}</span>
            )}
          </h2>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data}
            margin={{ top: 40, right: 30, left: 20, bottom: 80 }}
          >
            <XAxis 
              dataKey={xAxisKey}
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={10}
              interval={0}
              stroke="#666"
            />
            {hasLeftAxis && <YAxis yAxisId="left" orientation="left" fontSize={12} stroke="#666" />}
            {hasRightAxis && <YAxis yAxisId="right" orientation="right" fontSize={12} stroke="#666" />}
            <Tooltip 
              formatter={tooltipFormatter}
              labelFormatter={(label) => `${label}`}
            />
            {legendContent ? <Legend content={legendContent} /> : <Legend />}
            
            {bars.map((bar, i) => (
              <Bar
                key={bar.key}
                yAxisId={bar.yAxisId || "left"}
                dataKey={bar.key}
                stackId={bar.stackId}
                fill={bar.color || "#8884d8"}
                name={bar.name || bar.key}
                label={bar.label}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {showComment && commentId && (
        <div className="mt-6 p-4 bg-black rounded-lg border border-gray-600">
          <Label htmlFor={commentId} className="text-sm text-white font-montserrat font-semibold mb-2 block">
            Comments & Notes
          </Label>
          <Textarea
            id={commentId}
            placeholder="Add your comments or insights..."
            value={comment}
            onChange={(e) => {
              const newComment = e.target.value;
              setComment(newComment);
              localStorage.setItem(commentId, newComment);
            }}
            className="w-full min-h-[80px] resize-none bg-gray-800 border-gray-600 text-white placeholder-gray-400 font-montserrat font-light focus:border-purple-400 focus:ring-purple-400/20"
          />
        </div>
      )}
    </div>
  );
}
