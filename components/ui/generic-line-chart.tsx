"use client"

import React, { ReactNode } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export interface LineConfig {
  key: string;
  name?: string;
  color?: string;
  yAxisId?: "left" | "right";
  strokeWidth?: number;
  label?: any;
}

export interface GenericLineChartProps {
  data: any[];
  xAxisKey: string;
  lines: LineConfig[];
  title?: string;
  subtitle?: string;
  height?: number | string;
  showComment?: boolean;
  commentId?: string;
  averageLine?: {
    yAxisId: "left" | "right";
    value: number;
    color: string;
    label: string;
  };
  tooltipFormatter?: (value: any, name: any) => [any, any];
  legendContent?: (props: any) => ReactNode;
}

export function GenericLineChart({
  data,
  xAxisKey,
  lines,
  title,
  subtitle,
  height = 400,
  showComment = true,
  commentId,
  averageLine,
  tooltipFormatter,
  legendContent
}: GenericLineChartProps) {
  const [comment, setComment] = React.useState('');
  
  React.useEffect(() => {
    if (commentId) {
      const savedComment = localStorage.getItem(commentId);
      if (savedComment) {
        setComment(savedComment);
      }
    }
  }, [commentId]);

  const hasLeftAxis = lines.some(l => l.yAxisId === 'left' || !l.yAxisId);
  const hasRightAxis = lines.some(l => l.yAxisId === 'right');

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
          <LineChart 
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
            
            {lines.map((line, i) => (
              <Line 
                key={line.key}
                yAxisId={line.yAxisId || "left"}
                type="monotone" 
                dataKey={line.key}
                stroke={line.color || "#8884d8"}
                strokeWidth={line.strokeWidth || 2}
                name={line.name || line.key}
                dot={{ fill: line.color || "#8884d8", strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, stroke: line.color || "#8884d8", strokeWidth: 2, fill: '#fff' }}
                label={line.label}
              />
            ))}

            {averageLine && (
              <ReferenceLine 
                yAxisId={averageLine.yAxisId}
                y={averageLine.value}
                stroke={averageLine.color}
                strokeWidth={2}
                strokeDasharray="5 5"
                label={{
                  value: averageLine.label,
                  position: 'insideTopLeft',
                  style: { fontSize: '12px', fill: averageLine.color, fontWeight: 'bold' }
                }}
              />
            )}
          </LineChart>
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
