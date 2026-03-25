import { useMemo } from 'react';
import { parseWeekToDateRange } from '@/lib/date-filters';

/**
 * Hook to filter data containing a 'week' property in "YYYY/wkNN" format based on a date range.
 * It also filters out weeks that haven't finished yet based on the current date.
 */
export function useWeeklyDataFilter<T extends { week?: string }>(
  data: T[],
  startDate?: string,
  endDate?: string
): T[] {
  return useMemo(() => {
    const now = new Date();
    
    let filteredByDate = data;
    
    // 1. 如果有日期筛选，先应用日期筛选
    if (startDate && endDate) {
      filteredByDate = data.filter(item => {
        if (!item.week) return true;
        const range = parseWeekToDateRange(item.week);
        if (!range) return true;
        
        // 检查是否在筛选范围内
        const filterStart = new Date(startDate);
        const filterEnd = new Date(endDate);
        
        return !(range.end < filterStart || range.start > filterEnd);
      });
    }
    
    // 2. 过滤掉未完成的周（当前时间还没有超过该周的结束日期）
    return filteredByDate.filter(item => {
      if (!item.week) return true;
      const range = parseWeekToDateRange(item.week);
      if (!range) return true;
      
      // 设置到当天结束时间（23:59:59）进行比较
      range.end.setHours(23, 59, 59, 999);
      
      // 只显示已经完成的周（当前时间已经超过该周的结束时间）
      return now > range.end;
    });
  }, [data, startDate, endDate]);
}

/**
 * Hook to filter data containing a 'date' property based on a date range.
 */
export function useDailyDataFilter<T extends { date?: string }>(
  data: T[],
  startDate?: string,
  endDate?: string
): T[] {
  return useMemo(() => {
    if (!startDate || !endDate) return data;
    const filterStart = new Date(startDate);
    const filterEnd = new Date(endDate);
    
    return data.filter(item => {
      if (!item.date) return true;
      const itemDate = new Date(item.date);
      return itemDate >= filterStart && itemDate <= filterEnd;
    });
  }, [data, startDate, endDate]);
}
