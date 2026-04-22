
"use client"

import React, { useState, useMemo, useEffect } from "react"
import dynamic from "next/dynamic"
import { sessionStorageUtils, type StorageData } from "@/lib/sessionStorageUtils"
import { ChevronLeft, ChevronRight } from "lucide-react"
const PieChartWithFilter = dynamic(() => import("@/components/pie-chart-with-filter").then(mod => mod.PieChartWithFilter), { ssr: false })
const BrokerWeeklyDonutChart = dynamic(() => import("@/components/broker-weekly-donut-chart").then(mod => mod.BrokerWeeklyDonutChart), { ssr: false })
const MonthlyPatternChart = dynamic(() => import("@/components/monthly-pattern-chart").then(mod => mod.MonthlyPatternChart), { ssr: false })

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

import { parseLifeCarData, aggregateByMonth, filterByDateRange, type LifeCarDailyData, type LifeCarMonthlyData } from "@/lib/lifecar-data-processor"
const LifeCarNotesModal = dynamic(() => import("@/components/lifecar-notes-modal").then(mod => mod.LifeCarNotesModal), { ssr: false })
const XiaoWangTestNotesModal = dynamic(() => import("@/components/xiaowang-test-notes-modal").then(mod => mod.XiaoWangTestNotesModal), { ssr: false })

const AllInOneUpload = dynamic(() => import("@/components/all-in-one-upload").then(mod => mod.AllInOneUpload), { ssr: false })
const XiaowangTestWeeklyCostPerMetric = dynamic(() => import("@/components/xiaowang-test-weekly-cost-per-metric").then(mod => mod.XiaowangTestWeeklyCostPerMetric), { ssr: false })
const WeeklyCostTrendOverview = dynamic(() => import("@/components/weekly-cost-trend-overview").then(mod => mod.WeeklyCostTrendOverview), { ssr: false })

const XiaowangTestWeeklyOverallAverage = dynamic(() => import("@/components/xiaowang-test-weekly-analysis-adapted").then(mod => mod.XiaowangTestWeeklyOverallAverage), { ssr: false })
const XiaowangTestWeeklyAnalysisAdapted = dynamic(() => import("@/components/xiaowang-test-weekly-analysis-adapted").then(mod => mod.XiaowangTestWeeklyAnalysisAdapted), { ssr: false })
const XiaowangTestMonthlyCostAnalysis = dynamic(() => import("@/components/xiaowang-test-monthly-cost-analysis").then(mod => mod.XiaowangTestMonthlyCostAnalysis), { ssr: false })
const XiaowangTestMonthlyCostPerMetric = dynamic(() => import("@/components/xiaowang-test-monthly-cost-per-metric").then(mod => mod.XiaowangTestMonthlyCostPerMetric), { ssr: false })
const XiaowangTestCampaignOverview = dynamic(() => import("@/components/xiaowang-test-campaign-overview").then(mod => mod.XiaowangTestCampaignOverview), { ssr: false })
const AccountPerformanceOverview = dynamic(() => import("@/components/account-performance-overview").then(mod => mod.AccountPerformanceOverview), { ssr: false })

const DashboardHeader = dynamic(() => import("@/components/dashboard-header").then(mod => mod.DashboardHeader), { ssr: false })
const DashboardTimeFilter = dynamic(() => import("@/components/dashboard-time-filter").then(mod => mod.DashboardTimeFilter), { ssr: false })
// 移除静态导入，改为动态API调用

// 小王测试数据类型定义
interface XiaowangTestData {
  adData: any[];
  rawData: any[]; // 组件期望的字段
  brokerData: any[];
  dailyData?: any[];
  summary: {
    totalCost: number;
    totalImpressions: number;
    totalClicks: number;
    totalInteractions: number;
    totalConversions: number;
    totalBrokerClients: number;
    avgClickRate: number;
    avgConversionCost: number;
  };
}

// --- Date Utilities ---

/**
 * Parses various date formats (Excel serial, "19/09/2024" DD/MM/YYYY, "2025-12-15 08:43:27", ISO strings) into a Date object.
 */
function parseDate(dateInput: any): Date | null {
  if (!dateInput && dateInput !== 0) return null;

  try {
    // Handle Excel serial number (number or stringified number)
    if (typeof dateInput === 'number' || (!isNaN(Number(dateInput)) && !String(dateInput).includes('-') && !String(dateInput).includes('/'))) {
      const excelDate = Number(dateInput);
      const date = new Date((excelDate - 25569) * 86400 * 1000);
      return isNaN(date.getTime()) ? null : date;
    }

    const dateStr = String(dateInput).trim();

    // Handle "DD/MM/YY" or "DD/MM/YYYY"
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        let year = parseInt(parts[2]);
        if (year < 100) year = year > 50 ? 1900 + year : 2000 + year;
        return new Date(year, month - 1, day);
      }
    }

    // Handle "YYYY-MM-DD HH:MM:SS" — strip time component before parsing
    const dateOnly = dateStr.includes(' ') ? dateStr.split(' ')[0] : dateStr;
    const date = new Date(dateOnly);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Formats a Date object as "YYYY-MM-DD" in local time.
 */
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Extracts a "YYYY-MM-DD" string from various object fields (Date, date, 时间, 日期).
 */
function extractDateString(item: any): string | null {
  if (!item || typeof item !== 'object') return null;
  const dateFields = ['Date', 'date', '时间', '日期', 'Date ', 'date '];
  for (const field of dateFields) {
    const v = item[field];
    if (v === undefined || v === null || v === '') continue;
    const d = parseDate(v);
    if (d) return formatLocalDate(d);
  }
  return null;
}

// Normalize broker names: trim whitespace, title-case each word, fix known typos.
// Returns empty string for blank entries so callers can decide how to handle them.
function normalizeBrokerName(name: string | undefined | null): string {
  if (!name) return ''
  const trimmed = name.trim()
  if (!trimmed) return ''
  const titleCased = trimmed.replace(/\b\w+/g, word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  )
  // Fix known data-entry typos
  if (titleCased === 'Linudo') return 'Linduo'
  return titleCased
}

// 处理饼图数据 - 使用真实Excel数据中的 Broker 列，不受时间筛选影响
function processBrokerData(brokerDataJson: any[]) {
  try {
    let clientsData = brokerDataJson || []

    // 统计每个 Broker 的客户数量 - skip records with no broker assigned
    const brokerCounts = clientsData.reduce((acc: any, client: any) => {
      const broker = normalizeBrokerName(client.broker)
      if (!broker) return acc
      acc[broker] = (acc[broker] || 0) + 1
      return acc
    }, {})

    const total = clientsData.length
    return Object.entries(brokerCounts)
      .map(([broker, count]: [string, any]) => ({
        broker,
        count,
        percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => b.count - a.count) // 按数量降序排列
  } catch (error) {
    console.error('处理饼图数据失败:', error)
    return []
  }
}

// 将周次转换为日期范围
function parseWeekToDateRange(weekStr: string): { start: Date, end: Date } | null {
  const match = weekStr.match(/(\d{4})\/wk(\d+)/)
  if (!match) return null

  const year = parseInt(match[1])
  const weekNum = parseInt(match[2])

  // 计算该年第一天
  const firstDay = new Date(year, 0, 1)
  const dayOfWeek = firstDay.getDay()

  // 计算第一周的开始（周一）
  const firstMonday = new Date(firstDay)
  firstMonday.setDate(firstDay.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1))

  // 计算目标周的开始
  const weekStart = new Date(firstMonday)
  weekStart.setDate(firstMonday.getDate() + (weekNum - 1) * 7)

  // 计算目标周的结束
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  return { start: weekStart, end: weekEnd }
}

// 按年份和周次排序周数据的辅助函数
function sortWeeklyData(data: any[]) {
  const parseWeek = (week: string) => {
    const match = week?.match(/(\d{4})\/wk(\d+)/);
    return match ? (parseInt(match[1]) * 100 + parseInt(match[2])) : 0;
  };
  return [...data].sort((a, b) => parseWeek(a.week) - parseWeek(b.week));
}

// 处理折线图数据 - 使用真实Excel数据中的Week和Leads单价（aud）
function processWeeklyData(weeklyDataJson: any[]) {
  try {
    return sortWeeklyData((weeklyDataJson || []).filter((item: any) => item.week && item.leadsPrice && item.leadsPrice > 0));
  } catch (error) {
    console.error('处理折线图数据失败:', error);
    return [];
  }
}

// 处理月度数据 - 使用真实Excel数据
function processMonthlyData(monthlyDataJson: any[]) {
  try {
    return [...(monthlyDataJson || [])].sort((a: any, b: any) => a.month.localeCompare(b.month));
  } catch (error) {
    console.error('处理月度数据失败:', error);
    return [];
  }
}


export default function Home() {
  // 模块导航状态
  const [activeModule, setActiveModule] = useState('campaign-overview');
  const [showAllInOneUpload, setShowAllInOneUpload] = useState(false);
  const [dataRefreshKey, setDataRefreshKey] = useState(0);

  // 账号筛选状态
  const [selectedAccount, setSelectedAccount] = useState('combined');

  // 小王测试组件间共享的指标选择状态
  const [xiaowangSelectedMetric, setXiaowangSelectedMetric] = useState<'views' | 'likes' | 'followers' | 'leads'>('leads');

  const [weeklyTimePeriod, setWeeklyTimePeriod] = useState<number>(12);

  // 日期范围状态（替代之前的dateRange）
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  // 账号切换处理函数
  const handleAccountChange = (account: string) => {
    setSelectedAccount(account);
  };

  // 模块切换处理函数
  const handleModuleChange = (moduleId: string) => {
    setActiveModule(moduleId);
  };

  // 时间筛选器处理函数
  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    setError('');
  };

  const handleLastWeek = () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const dayOfWeek = today.getDay();
    const daysToThisMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const daysToLastMonday = daysToThisMonday + 7;

    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(today.getDate() - daysToLastMonday);

    const lastWeekEnd = new Date(lastWeekStart);
    lastWeekEnd.setDate(lastWeekStart.getDate() + 6);

    setStartDate(formatLocalDate(lastWeekStart));
    setEndDate(formatLocalDate(lastWeekEnd));
    setError('');
  };

  const isLastWeekSelected = () => {
    if (!startDate || !endDate) return false;
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const dayOfWeek = today.getDay();
    const daysToThisMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const daysToLastMonday = daysToThisMonday + 7;

    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(today.getDate() - daysToLastMonday);
    const lastWeekEnd = new Date(lastWeekStart);
    lastWeekEnd.setDate(lastWeekStart.getDate() + 6);

    return startDate === formatLocalDate(lastWeekStart) && endDate === formatLocalDate(lastWeekEnd);
  };

  // 导航到前一个时间段
  const handlePreviousPeriod = () => {
    if (startDate && endDate) {
      // Create UTC dates to avoid local daylight savings time bugs
      const start = new Date(startDate + "T00:00:00Z");
      const end = new Date(endDate + "T00:00:00Z");
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // 向前移动相同的天数
      start.setUTCDate(start.getUTCDate() - daysDiff);
      end.setUTCDate(end.getUTCDate() - daysDiff);

      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
      setError('');
    }
  };

  // 导航到后一个时间段
  const handleNextPeriod = () => {
    if (startDate && endDate) {
      // Create UTC dates to avoid local daylight savings time bugs
      const start = new Date(startDate + "T00:00:00Z");
      const end = new Date(endDate + "T00:00:00Z");
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // 向后移动相同的天数
      start.setUTCDate(start.getUTCDate() + daysDiff);
      end.setUTCDate(end.getUTCDate() + daysDiff);

      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
      setError('');
    }
  };

  // API数据状态 - 使用sessionStorage，避免hydration错误
  const [storageData, setStorageData] = useState<StorageData>(() => {
    // 在服务端渲染时返回默认数据，避免hydration错误
    if (typeof window === 'undefined') {
      return {
        brokerData: [],
        weeklyData: [],
        monthlyData: [],
        dailyCostData: [],
        xiaowangTestData: null,
        xiaowangTestNotesData: [],
        lifeCarData: [],
        lifeCarMonthlyData: [],
        lifeCarNotesData: [],
      };
    }
    return sessionStorageUtils.getData();
  });

  // 数据获取函数
  const brokerDataJson = storageData.brokerData;
  const weeklyDataJson = storageData.weeklyData;
  const monthlyDataJson = storageData.monthlyData;
  const dailyCostDataJson = storageData.dailyCostData;
  const xiaowangTestData = storageData.xiaowangTestData;
  const xiaowangTestNotesData = storageData.xiaowangTestNotesData;
  const lifeCarData = storageData.lifeCarData;
  const lifeCarMonthlyData = storageData.lifeCarMonthlyData;
  const lifeCarNotesData = storageData.lifeCarNotesData;

  // 添加mounted状态来避免hydration错误
  const [mounted, setMounted] = useState(false);

  // 在客户端加载实际数据，避免hydration错误
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const actualData = sessionStorageUtils.getData();
      setStorageData(actualData);
    }
  }, []);

  // 数据更新辅助函数
  const updateStorage = (newData: Partial<StorageData>) => {
    sessionStorageUtils.setData(newData);
    setStorageData(prev => ({ ...prev, ...newData }));
  };

  const setBrokerDataJson = (data: any[]) => updateStorage({ brokerData: data });
  const setWeeklyDataJson = (data: any[]) => updateStorage({ weeklyData: data });
  const setMonthlyDataJson = (data: any[]) => updateStorage({ monthlyData: data });
  const setDailyCostDataJson = (data: any[]) => updateStorage({ dailyCostData: data });
  const setXiaowangTestData = (data: any | null) => updateStorage({ xiaowangTestData: data });
  const setXiaowangTestNotesData = (data: any[]) => updateStorage({ xiaowangTestNotesData: data });
  const setLifeCarData = (data: any[]) => updateStorage({ lifeCarData: data });
  const setLifeCarMonthlyData = (data: any[]) => updateStorage({ lifeCarMonthlyData: data });
  const setLifeCarNotesData = (data: any[]) => updateStorage({ lifeCarNotesData: data });

  const updateAllData = (data: any) => {
    sessionStorageUtils.updateData(data);
    setStorageData(sessionStorageUtils.getData());
  };

  const clearAllData = () => {
    sessionStorageUtils.clearAll();
    setStorageData(sessionStorageUtils.getData());
  };
  const [isLoading, setIsLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // LifeCAR加载状态
  const [lifeCarLoading, setLifeCarLoading] = useState(false);

  // 小王测试加载状态
  const [xiaowangTestLoading, setXiaowangTestLoading] = useState(false);

  // LifeCar 笔记浮窗状态
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedNoteDates, setSelectedNoteDates] = useState<string[]>([]);

  // XiaoWang Test 笔记浮窗状态
  const [showXiaowangNotesModal, setShowXiaowangNotesModal] = useState(false);
  const [selectedXiaowangNoteDates, setSelectedXiaowangNoteDates] = useState<string[]>([]);


  // 检查是否选择了一周时间范围
  const isOneWeekSelected = useMemo(() => {
    if (!startDate || !endDate) return false;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 6; // 7天范围实际相差6天
  }, [startDate, endDate]);

  // Notes数据中在当前时间范围内的日期
  const [notesInDateRange, setNotesInDateRange] = useState<string[]>([]);

  // 加载LifeCar Notes数据
  const fetchNotesData = async () => {
    try {
      console.log('Fetching notes data...');
      const response = await fetch('/api/lifecar-notes');
      const result = await response.json();
      if (result.success) {
        console.log('Loaded notes data:', result.data.length, 'notes');
        setLifeCarNotesData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch notes data:', error);
    }
  };

  // 页面初始加载时不自动获取Notes数据，要求用户上传

  // 当Notes Modal关闭时保持数据（只在浏览器会话期间保留）
  const handleNotesModalClose = () => {
    setShowNotesModal(false);
    // 不清空数据，保持在浏览器会话期间可用
  };

  // 当XiaoWang Test Notes Modal关闭时保持数据（只在浏览器会话期间保留）
  const handleXiaowangNotesModalClose = () => {
    setShowXiaowangNotesModal(false);
    // 不清空数据，保持在浏览器会话期间可用
  };


  // --- Note Statistics Computation ---

  const parseDateField = (val: any): string => {
    if (typeof val === 'string') return val.split(' ')[0];
    if (typeof val === 'number') {
      const d = new Date((val - 25569) * 86400 * 1000);
      return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
    }
    return '';
  };

  const calculateNoteStats = (notesData: any[], campaignData: any[], type: 'weekday' | 'weekly' | 'monthly') => {
    if (!notesData?.length || !campaignData?.length) return {};

    // Get date range from campaign data
    const campaignDates = campaignData.map((d: any) => new Date(d.date || d).getTime());
    const minDate = Math.min(...campaignDates);
    const maxDate = Math.max(...campaignDates);

    const stats: Record<string, number> = {};

    notesData.forEach((note: any) => {
      const dateStr = parseDateField(note.发布时间);
      if (!dateStr) return;
      const noteTime = new Date(dateStr).getTime();
      if (noteTime < minDate || noteTime > maxDate) return;

      const date = new Date(dateStr);
      let key = '';

      if (type === 'weekday') {
        key = date.toLocaleDateString('en-US', { weekday: 'short' });
      } else if (type === 'monthly') {
        key = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      } else if (type === 'weekly') {
        // Shared weekly logic
        const dayOfWeek = date.getDay();
        const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - mondayOffset);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        key = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      }

      stats[key] = (stats[key] || 0) + 1;
    });

    return stats;
  };

  // State for all note stats
  const [notesWeekdayCount, setNotesWeekdayCount] = useState<Record<string, number>>({});
  const [notesMonthlyCount, setNotesMonthlyCount] = useState<Record<string, number>>({});
  const [xiaowangNotesWeeklyCount, setXiaowangNotesWeeklyCount] = useState<Record<string, number>>({});
  const [xiaowangNotesMonthlyCount, setXiaowangNotesMonthlyCount] = useState<Record<string, number>>({});

  // Effect for Lifecar Notes
  useEffect(() => {
    if (lifeCarNotesData.length > 0 && lifeCarData.length > 0) {
      setNotesWeekdayCount(calculateNoteStats(lifeCarNotesData, lifeCarData, 'weekday'));
      setNotesMonthlyCount(calculateNoteStats(lifeCarNotesData, lifeCarData, 'monthly'));
    } else {
      setNotesWeekdayCount({});
      setNotesMonthlyCount({});
    }
  }, [lifeCarNotesData, lifeCarData]);

  // Effect for XiaoWang Test Notes
  useEffect(() => {
    if (xiaowangTestNotesData.length > 0 && xiaowangTestData?.rawData?.length > 0) {
      setXiaowangNotesWeeklyCount(calculateNoteStats(xiaowangTestNotesData, xiaowangTestData.rawData, 'weekly'));
      setXiaowangNotesMonthlyCount(calculateNoteStats(xiaowangTestNotesData, xiaowangTestData.rawData, 'monthly'));
    } else {
      setXiaowangNotesWeeklyCount({});
      setXiaowangNotesMonthlyCount({});
    }
  }, [xiaowangTestNotesData, xiaowangTestData]);

  // Effect for Notes in date range
  useEffect(() => {
    if (!isOneWeekSelected || !startDate || !endDate || !lifeCarNotesData.length) {
      setNotesInDateRange([]);
      return;
    }

    const datesInRange = lifeCarNotesData
      .map((note: any) => parseDateField(note.发布时间))
      .filter((date: string) => date && date >= startDate && date <= endDate)
      .filter((date: string, index: number, array: string[]) => array.indexOf(date) === index);

    setNotesInDateRange(datesInRange);
  }, [isOneWeekSelected, startDate, endDate, lifeCarNotesData]);


  // 加载数据函数
  const loadData = async () => {
    try {
      setIsLoading(true);
      setDataError(null);

      const response = await fetch('/api/excel-data');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.data) {
        // === 单个上传数据内容详细检查 (手动触发) ===
        console.log('=== 手动触发单个上传数据内容详细检查 ===');
        if (result.data?.broker_data) {
          console.log('单个上传 Broker数据总数:', result.data.broker_data.length);
          console.log('单个上传 前5条broker记录:', result.data.broker_data.slice(0, 5));

          // 按broker分组统计
          const brokerCounts: Record<string, number> = {};
          result.data.broker_data.forEach((item: any) => {
            brokerCounts[item.broker] = (brokerCounts[item.broker] || 0) + 1;
          });
          console.log('单个上传 每个broker的记录数:', brokerCounts);

          // 检查空值情况
          const emptyFields = {
            no: result.data.broker_data.filter((item: any) => !item.no).length,
            broker: result.data.broker_data.filter((item: any) => !item.broker).length,
            date: result.data.broker_data.filter((item: any) => !item.date).length,
            wechat: result.data.broker_data.filter((item: any) => !item.wechat).length,
            source: result.data.broker_data.filter((item: any) => !item.source).length
          };
          console.log('单个上传 空值字段统计:', emptyFields);
        }

        updateAllData({
          broker_data: result.data.broker_data || [],
          weekly_data: result.data.weekly_data || [],
          monthly_data: result.data.monthly_data || [],
          daily_cost_data: result.data.daily_cost_data || []
        });
      } else {
        throw new Error('Invalid data structure received');
      }
    } catch (error: any) {
      console.error('Failed to load data:', error);
      setDataError(error.message || 'Failed to load data');
      // 设置空数据以防止组件崩溃
      clearAllData();
    } finally {
      setIsLoading(false);
    }
  };

  // 加载LifeCAR数据函数
  const loadLifeCarData = async () => {
    try {
      setLifeCarLoading(true);
      const response = await fetch('/database_lifecar/lifecar-data.csv');
      if (!response.ok) {
        throw new Error(`Failed to load LifeCAR data: ${response.statusText}`);
      }
      const csvText = await response.text();
      const parsedData = parseLifeCarData(csvText).map((d: any) => ({
        date: d.date,
        cost: d.spend || 0,
        impressions: d.impressions || 0,
        clicks: d.clicks || 0,
        likes: d.likes || 0,
        followers: d.followers || 0,
        conversions: d.multiConversion1 || 0,
        interactions: d.interactions || 0,
        saves: d.saves || 0,
        comments: 0,
        shares: d.shares || 0,
      }));

      setLifeCarData(parsedData);
      setLifeCarMonthlyData([]);
    } catch (error) {
      console.error('Failed to load LifeCAR data:', error);
      setLifeCarData([]);
      setLifeCarMonthlyData([]);
    } finally {
      setLifeCarLoading(false);
    }
  };

  // 移除预加载数据函数 - 小王测试只使用上传的数据
  // const loadXiaowangTestData = async () => {
  //   try {
  //     setXiaowangTestLoading(true);
  //     const response = await fetch('/api/xiaowang-test');
  //     if (!response.ok) {
  //       throw new Error(`Failed to load xiaowang test data: ${response.statusText}`);
  //     }
  //     const result = await response.json();
  //     setXiaowangTestData(result.data);
  //   } catch (error) {
  //     console.error('Failed to load xiaowang test data:', error);
  //     setXiaowangTestData(null);
  //   } finally {
  //     setXiaowangTestLoading(false);
  //   }
  // };

  // 页面加载时不自动获取数据，只有在用户上传数据后才显示图表
  // useEffect(() => {
  //   loadData();
  //   loadLifeCarData();
  // }, []);

  // 监听dataRefreshKey变化，重新加载数据 - 但不要覆盖All-in-One上传的数据
  useEffect(() => {
    if (dataRefreshKey > 0) {
      console.log('Data refresh triggered, but skipping loadData to preserve uploaded data');
      // 注释掉自动刷新，避免覆盖用户上传的数据
      // loadData();
    }
  }, [dataRefreshKey]);

  // Handle successful upload - use uploaded data directly
  const handleUploadSuccess = async (uploadedData?: any) => {
    try {

      if (uploadedData) {
        // === 单个上传数据内容详细检查 ===
        console.log('=== 单个上传数据内容详细检查 ===');
        if (uploadedData?.broker_data) {
          console.log('单个上传 Broker数据总数:', uploadedData.broker_data.length);
          console.log('单个上传 前5条broker记录:', uploadedData.broker_data.slice(0, 5));
          console.log('单个上传 broker字段样例:', uploadedData.broker_data.slice(0, 3).map((item: any) => ({
            no: item.no,
            broker: item.broker,
            date: item.date,
            wechat: item.wechat,
            source: item.source
          })));

          // 检查所有唯一的broker名称
          const uniqueBrokers = [...new Set(uploadedData.broker_data.map((item: any) => item.broker))];
          console.log('单个上传 所有唯一的broker名称:', uniqueBrokers);

          // 检查日期格式
          const datesSample = uploadedData.broker_data.slice(0, 10).map((item: any) => item.date);
          console.log('单个上传 日期格式样例:', datesSample);

          // 按broker分组统计
          const brokerCounts: Record<string, number> = {};
          uploadedData.broker_data.forEach((item: any) => {
            brokerCounts[item.broker] = (brokerCounts[item.broker] || 0) + 1;
          });
          console.log('单个上传 每个broker的记录数:', brokerCounts);

          // 检查空值情况
          const emptyFields = {
            no: uploadedData.broker_data.filter((item: any) => !item.no).length,
            broker: uploadedData.broker_data.filter((item: any) => !item.broker).length,
            date: uploadedData.broker_data.filter((item: any) => !item.date).length,
            wechat: uploadedData.broker_data.filter((item: any) => !item.wechat).length,
            source: uploadedData.broker_data.filter((item: any) => !item.source).length
          };
          console.log('单个上传 空值字段统计:', emptyFields);
        }

        // 直接使用上传返回的数据，不需要重新调用API
        updateAllData({
          broker_data: uploadedData.broker_data || [],
          weekly_data: uploadedData.weekly_data || [],
          monthly_data: uploadedData.monthly_data || [],
          daily_cost_data: uploadedData.daily_cost_data || []
        });
        console.log('Data updated from upload:', {
          broker_data: uploadedData.broker_data?.length || 0,
          weekly_data: uploadedData.weekly_data?.length || 0,
          monthly_data: uploadedData.monthly_data?.length || 0,
          daily_cost_data: uploadedData.daily_cost_data?.length || 0
        });
      } else {
        // 如果没有数据，回退到重新加载
        await loadData();
      }

      setDataRefreshKey((prev: number) => prev + 1);
    } catch (error) {
      console.error('Error refreshing data:', error);
      // 如果出错，尝试重新加载数据
      await loadData();
    }
  };




  // 模块配置 - 所有账号使用相同的模块
  const getModulesForAccount = (_account: string) => {
    return [
      { id: 'campaign-overview', name: 'Trend Overview', icon: '📈', desc: 'Daily performance metrics' },
      { id: 'broker', name: 'Broker Distribution', icon: '📊', desc: 'Broker performance analysis' },
      { id: 'cost', name: 'Cost Analysis', icon: '💰', desc: 'Cost comparison analysis' },
      { id: 'weekly-analysis', name: 'Weekly Analysis', icon: '📈', desc: 'Weekly performance insights' },
      { id: 'activity-heatmap', name: 'Testing Graphs', icon: '🔥', desc: 'Compare same month performance across years' }
    ];
  };

  const allModules = getModulesForAccount(selectedAccount);

  // 获取数据（受全局时间筛选器影响）
  const processedBrokerData = useMemo(() => {
    if (isLoading || !brokerDataJson.length) return [];
    const data = processBrokerData(brokerDataJson);
    console.log('Broker data:', data);
    return data;
  }, [brokerDataJson, isLoading]);


  // Normalize lifeCarData to the standard shape — handles both old shape (spend/multiConversion1)
  // and new shape (cost/conversions) so sessionStorage data from before the format change still works.
  const lifeCarDailyData = useMemo(() => {
    return (lifeCarData || []).map((d: any) => {
      if ('cost' in d) return d
      return {
        date: d.date,
        cost: d.spend || 0,
        impressions: d.impressions || 0,
        clicks: d.clicks || 0,
        likes: d.likes || 0,
        followers: d.followers || 0,
        conversions: d.multiConversion1 || 0,
        interactions: d.interactions || 0,
        saves: d.saves || 0,
        comments: d.comments || 0,
        shares: d.shares || 0,
      }
    })
  }, [lifeCarData])

  // Always-combined daily data — used for Trend Overview regardless of selected account
  const combinedDailyData = useMemo(() => {
    const xiaowangDays: any[] = xiaowangTestData?.dailyData || []
    const merged: Record<string, any> = {}
    ;[...xiaowangDays, ...lifeCarDailyData].forEach((d: any) => {
      if (!d.date) return
      if (!merged[d.date]) {
        merged[d.date] = { ...d }
      } else {
        merged[d.date].cost += d.cost || 0
        merged[d.date].impressions += d.impressions || 0
        merged[d.date].clicks += d.clicks || 0
        merged[d.date].likes += d.likes || 0
        merged[d.date].followers += d.followers || 0
        merged[d.date].conversions += d.conversions || 0
        merged[d.date].interactions += d.interactions || 0
        merged[d.date].saves += d.saves || 0
        merged[d.date].shares += d.shares || 0
      }
    })
    return Object.values(merged).sort((a: any, b: any) => a.date.localeCompare(b.date))
  }, [xiaowangTestData, lifeCarDailyData])

  // Active daily data — depends on selected account
  const activeDailyData = useMemo(() => {
    const xiaowangDays: any[] = xiaowangTestData?.dailyData || []

    if (selectedAccount === 'xiaowang') return xiaowangDays
    if (selectedAccount === 'lifecar') return lifeCarDailyData

    // combined: merge both datasets by date
    const merged: Record<string, any> = {}
    ;[...xiaowangDays, ...lifeCarDailyData].forEach((d: any) => {
      if (!d.date) return
      if (!merged[d.date]) {
        merged[d.date] = { ...d }
      } else {
        merged[d.date].cost += d.cost || 0
        merged[d.date].impressions += d.impressions || 0
        merged[d.date].clicks += d.clicks || 0
        merged[d.date].likes += d.likes || 0
        merged[d.date].followers += d.followers || 0
        merged[d.date].conversions += d.conversions || 0
        merged[d.date].interactions += d.interactions || 0
        merged[d.date].saves += d.saves || 0
        merged[d.date].shares += d.shares || 0
      }
    })
    return Object.values(merged).sort((a: any, b: any) => a.date.localeCompare(b.date))
  }, [selectedAccount, xiaowangTestData, lifeCarDailyData])

  // Wrap activeDailyData in the XiaowangTestData shape that existing components expect
  const activeTestData = useMemo(() => {
    if (!activeDailyData.length) return null
    const totalCost = activeDailyData.reduce((s: number, d: any) => s + (d.cost || 0), 0)
    const totalConversions = activeDailyData.reduce((s: number, d: any) => s + (d.conversions || 0), 0)
    return {
      ...(xiaowangTestData || {}),
      dailyData: activeDailyData,
      rawData: activeDailyData,
      summary: {
        totalCost,
        totalImpressions: activeDailyData.reduce((s: number, d: any) => s + (d.impressions || 0), 0),
        totalClicks: activeDailyData.reduce((s: number, d: any) => s + (d.clicks || 0), 0),
        totalInteractions: activeDailyData.reduce((s: number, d: any) => s + (d.interactions || 0), 0),
        totalConversions,
        totalFollowers: activeDailyData.reduce((s: number, d: any) => s + (d.followers || 0), 0),
        totalSaves: activeDailyData.reduce((s: number, d: any) => s + (d.saves || 0), 0),
        totalLikes: activeDailyData.reduce((s: number, d: any) => s + (d.likes || 0), 0),
        totalComments: 0,
        totalShares: activeDailyData.reduce((s: number, d: any) => s + (d.shares || 0), 0),
        avgClickRate: 0,
        avgConversionCost: totalConversions > 0 ? totalCost / totalConversions : 0,
      }
    }
  }, [activeDailyData, xiaowangTestData])

  // 处理数据（受时间筛选器影响）
  const filteredXiaowangTestData = useMemo(() => {
    if (!activeTestData) return null;

    // 如果没有选择日期范围，返回全部数据
    if (!startDate || !endDate) return activeTestData;

    // 过滤日数据
    const filteredDailyData = activeTestData.dailyData?.filter((item: any) => {
      const itemDate = item.date;
      return itemDate >= startDate && itemDate <= endDate;
    }) || [];

    // 过滤原始数据
    const filteredRawData = activeTestData.rawData?.filter((item: any) => {
      const itemDate = item.date;
      return itemDate >= startDate && itemDate <= endDate;
    }) || [];

    // 重新计算汇总数据
    const filteredSummary = {
      totalCost: 0,
      totalImpressions: 0,
      totalClicks: 0,
      totalInteractions: 0,
      totalConversions: 0,
      totalFollowers: 0,
      totalSaves: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      avgClickRate: 0,
      avgConversionCost: 0,
    };

    filteredRawData.forEach((item: any) => {
      filteredSummary.totalCost += item.cost || 0;
      filteredSummary.totalImpressions += item.impressions || 0;
      filteredSummary.totalClicks += item.clicks || 0;
      filteredSummary.totalInteractions += item.interactions || 0;
      filteredSummary.totalConversions += item.conversions || 0;
      filteredSummary.totalFollowers += item.followers || 0;
      filteredSummary.totalSaves += item.saves || 0;
      filteredSummary.totalLikes += item.likes || 0;
      filteredSummary.totalComments += item.comments || 0;
      filteredSummary.totalShares += item.shares || 0;
    });

    // 计算平均值
    if (filteredRawData.length > 0) {
      filteredSummary.avgClickRate = filteredSummary.totalImpressions > 0
        ? (filteredSummary.totalClicks / filteredSummary.totalImpressions) * 100
        : 0;
      filteredSummary.avgConversionCost = filteredSummary.totalConversions > 0
        ? filteredSummary.totalCost / filteredSummary.totalConversions
        : 0;
    }

    return {
      ...activeTestData,
      summary: filteredSummary,
      dailyData: filteredDailyData,
      rawData: filteredRawData,
      totalRows: filteredRawData.length
    };
  }, [activeTestData, startDate, endDate]);

  // Calculate global Daily Leads Average (for Weekday Leads Distribution yellow dashed line)
  const globalDailyLeadsAvg = useMemo(() => {
    if (!activeTestData?.rawData || !brokerDataJson || brokerDataJson.length === 0) return 0;

    const rawData = activeTestData.rawData;

    const leadsPerDate: Record<string, number> = {};
    const uniqueClientsByDate: Record<string, Set<any>> = {};

    brokerDataJson.forEach((item: any) => {
      const dateField = item.date || item['日期'] || item.Date || item.时间;
      if (dateField && item.no !== null && item.no !== undefined) {
        let date: string;
        if (typeof dateField === 'number') {
          const excelDate = new Date((dateField - 25569) * 86400 * 1000);
          date = excelDate.toISOString().split('T')[0];
        } else if (typeof dateField === 'string' && /^\d+$/.test(dateField)) {
          const excelSerialNumber = parseInt(dateField);
          const excelDate = new Date((excelSerialNumber - 25569) * 86400 * 1000);
          date = excelDate.toISOString().split('T')[0];
        } else if (dateField instanceof Date) {
          date = dateField.toISOString().split('T')[0];
        } else {
          date = String(dateField).split(' ')[0];
        }
        if (date && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          if (!uniqueClientsByDate[date]) {
            uniqueClientsByDate[date] = new Set();
          }
          uniqueClientsByDate[date].add(item.no);
        }
      }
    });

    Object.keys(uniqueClientsByDate).forEach(date => {
      leadsPerDate[date] = uniqueClientsByDate[date].size;
    });

    const totalLeads = rawData.reduce((sum: number, item: any) => sum + (leadsPerDate[item.date] || 0), 0);
    const totalDays = rawData.length;
    return totalDays > 0 ? totalLeads / totalDays : 0;
  }, [activeTestData, brokerDataJson]);

  // 如果正在加载，显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-purple-600 font-medium">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // 如果有错误，显示错误信息
  if (dataError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-center bg-white/95 backdrop-blur-xl rounded-lg shadow-xl p-8 max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Failed to Load Data</h2>
          <p className="text-gray-600 mb-4">{dataError}</p>
          <button
            onClick={loadData}
            className="bg-gradient-to-r from-[#751FAE] to-[#EF3C99] text-white px-4 py-2 rounded hover:from-[#6919A6] hover:to-[#E73691] transition-all duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // 在组件完全挂载前不渲染动态内容，避免hydration错误
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100 to-pink-100">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100 to-pink-100">
      {/* 导航栏 - 始终吸附在顶部，包含标题、账户切换、全屏按钮，以及时间筛选器 */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-purple-200/30 sticky top-0 z-[100] shadow-lg shadow-purple-500/10">

        <DashboardHeader
          selectedAccount={selectedAccount}
          handleAccountChange={handleAccountChange}
        />

        {/* 时间筛选器 - 作为导航栏的一部分，随导航栏吸附。Upload 按钮置于左侧（LifeX 标志下方） */}
        {activeDailyData.length > 0 && filteredXiaowangTestData && (
          <div className="relative">
            <div className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-10">
              <button
                type="button"
                onClick={() => {
                  console.log('All in One button clicked');
                  setShowAllInOneUpload(true);
                }}
                className="flex items-center gap-1.5 h-9 px-3 text-sm text-white bg-gradient-to-r from-[#751FAE] to-[#EF3C99] hover:from-[#6919A6] hover:to-[#E73691] transition-all duration-200 rounded-md shadow-md"
                title="Upload Dataset"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span className="font-medium">Upload Dataset</span>
              </button>
            </div>
            <DashboardTimeFilter
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              handleLastWeek={handleLastWeek}
              isLastWeekSelected={isLastWeekSelected}
              handleClearFilter={handleClearFilter}
              handlePreviousPeriod={handlePreviousPeriod}
              handleNextPeriod={handleNextPeriod}
              error={error}
              selectedAccount={selectedAccount}
              isSticky={true}
            />
          </div>
        )}

      </nav>

      {/* 主内容区域 */}
      <div className="w-full px-8 py-4 pt-16">

        {/* 统一的欢迎界面 */}
        {activeDailyData.length === 0 && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center bg-white/95 backdrop-blur-xl rounded-lg shadow-xl shadow-purple-500/10 ring-1 ring-purple-500/20 p-16">
              <div className="text-8xl mb-8">📊</div>
              <h1 className="text-4xl font-bold text-gray-800 mb-4">
                LifeX Marketing Dashboard
              </h1>
              <p className="text-xl text-gray-600 mb-10 font-montserrat font-light text-center">
                Data Analytics & Insights
              </p>
              <button
                onClick={() => setShowAllInOneUpload(true)}
                className="px-8 py-4 text-white rounded-lg transition-all duration-200 font-semibold shadow-lg mx-auto bg-gradient-to-r from-[#751FAE] to-[#EF3C99] hover:from-[#6919A6] hover:to-[#E73691]"
              >
                Upload Dataset
              </button>
            </div>
          </div>
        )}


        {/* 统一数据面板 */}
        {activeDailyData.length > 0 && (
          <>


            {/* ================= Overview – One Row / Five Cards ================= */}
            {activeTestData?.rawData && (() => {
              // ─── Shared derived values (computed once for all 5 cards) ───────────────
              const extractLeadDate = (item: any): string | null => {
                if (!item || typeof item !== 'object') return null;
                const dateFields = ['Date', 'date', '时间', '日期', 'Date ', 'date '];
                for (const field of dateFields) {
                  const v = item[field];
                  if (v === undefined || v === null || v === '') continue;
                  if (typeof v === 'number') {
                    const d = new Date((v - 25569) * 86400 * 1000);
                    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
                  } else if (typeof v === 'string') {
                    const d = new Date(v);
                    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
                  }
                }
                return null;
              };

              const hasLeadsData = brokerDataJson && brokerDataJson.length > 0;
              const filteredLeads: any[] = hasLeadsData
                ? (startDate && endDate
                  ? brokerDataJson.filter((item: any) => {
                    const d = extractLeadDate(item);
                    return d && d >= startDate && d <= endDate;
                  })
                  : brokerDataJson)
                : [];
              const currentLeadsCount = filteredLeads.length;
              const allTimeTotalLeads = brokerDataJson?.length ?? 0;

              const currentPeriodDays = startDate && endDate
                ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1
                : 0;

              const totalSpend = (filteredXiaowangTestData?.dailyData || []).reduce(
                (sum: number, item: any) => sum + (item.cost || 0), 0
              );
              const currentPeriodLength = filteredXiaowangTestData?.dailyData?.length ?? 0;
              const allTimeTotalSpend = activeTestData?.dailyData
                ? activeTestData.dailyData.reduce((sum: number, item: any) => sum + (item.cost || 0), 0)
                : 0;
              const allTimeTotalDays = activeTestData?.dailyData?.length ?? 1;

              const costPerLead = currentLeadsCount > 0 ? totalSpend / currentLeadsCount : 0;

              const isNoTimeFilter = !startDate || !endDate;

              // Historical baselines (same style as Daily Avg Leads & Red Msg Conv Rate)
              const historicalDailyAvgCost = allTimeTotalDays > 0 ? allTimeTotalSpend / allTimeTotalDays : 0;
              const historicalCPL = allTimeTotalLeads > 0 ? allTimeTotalSpend / allTimeTotalLeads : 0;

              // Week-based historical daily avg leads (computed once)
              // Uses span-based week count (same method as donut chart) to avoid
              // double-counting weeks at year boundaries (e.g. Dec 28–31 vs Jan 1–7).
              const historicalDailyAvgLeads = (() => {
                if (!hasLeadsData) return 0;
                let minDate: Date | null = null;
                let maxDate: Date | null = null;
                brokerDataJson.forEach((item: any) => {
                  const dateStr = extractLeadDate(item);
                  if (!dateStr) return;
                  const date = new Date(dateStr + 'T00:00:00');
                  if (isNaN(date.getTime())) return;
                  if (!minDate || date < minDate) minDate = date;
                  if (!maxDate || date > maxDate) maxDate = date;
                });
                if (!minDate || !maxDate) return 0;
                const daysDifference = Math.ceil((maxDate.getTime() - minDate.getTime()) / 86400000);
                const totalWeeks = Math.max(1, Math.ceil(daysDifference / 7));
                return (brokerDataJson.length / totalWeeks) / 7;
              })();

              const currentDailyAvgLeads = currentPeriodDays > 0 ? currentLeadsCount / currentPeriodDays : historicalDailyAvgLeads;

              // Enquiry-to-Lead Rate — messages from activeDailyData.conversions (same source as Trend Overview)
              const allTimeTotalMessages = activeDailyData.reduce((sum: number, d: any) => sum + (d.conversions || 0), 0);
              const hasMessageData = allTimeTotalMessages > 0;
              const currentPeriodMessages = filteredXiaowangTestData?.dailyData
                ? filteredXiaowangTestData.dailyData.reduce((sum: number, d: any) => sum + (d.conversions || 0), 0)
                : 0;
              const currentConvRate = currentPeriodMessages > 0 ? (currentLeadsCount / currentPeriodMessages) * 100 : null;
              const historicalConvRate = allTimeTotalMessages > 0 ? (allTimeTotalLeads / allTimeTotalMessages) * 100 : null;
              // ─────────────────────────────────────────────────────────────────────────

              return (
                <div className="max-w-7xl mx-auto mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">

                    {/* ================= Leads ================= */}
                    <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50 glass-card-hover relative">
                      <CardContent className="p-6 text-center">
                        <div className="text-sm font-bold text-gray-700 mb-2">Leads</div>
                        <div className="text-3xl font-black bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent mb-1">
                          {hasLeadsData ? currentLeadsCount.toLocaleString() : '0'}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-1">
                            {isNoTimeFilter || !hasLeadsData ? (
                              <span className="text-gray-400 text-sm font-bold flex items-center">▲ 0.0% <span className="text-xs text-gray-500 ml-1">vs Avg</span></span>
                            ) : (() => {
                              const historicalExpected = historicalDailyAvgLeads * currentPeriodDays;
                              const diff = currentLeadsCount - historicalExpected;
                              const pct = historicalExpected > 0 ? (diff / historicalExpected) * 100 : 0;
                              return (
                                <>
                                  <span className={`${diff >= 0 ? 'text-green-600' : 'text-red-600'} text-sm font-bold flex items-center`}>
                                    {diff >= 0 ? '▲' : '▼'}{Math.abs(pct).toFixed(1)}%
                                  </span>
                                  <span className="text-xs text-gray-500">vs Avg</span>
                                </>
                              );
                            })()}
                          </div>
                          <div className="text-xs text-gray-600">
                            {!hasLeadsData ? 'No data' : `Historical Avg: ${(historicalDailyAvgLeads * 7).toFixed(2)} leads/week`}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* ================= Cost ================= */}
                    <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50 glass-card-hover relative">
                      <CardContent className="p-6 text-center">
                        <div className="text-sm font-bold text-gray-700 mb-2">Cost</div>
                        <div className="text-3xl font-black bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent mb-1">
                          ${totalSpend.toFixed(2)}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-1">
                            {isNoTimeFilter ? (
                              <span className="text-gray-400 text-sm font-bold flex items-center">▲ 0.0% <span className="text-xs text-gray-500 ml-1">vs Avg</span></span>
                            ) : (() => {
                              const currentDailyCost = totalSpend / 7;
                              const diff = currentDailyCost - historicalDailyAvgCost;
                              const pct = historicalDailyAvgCost > 0 ? (diff / historicalDailyAvgCost) * 100 : 0;
                              return (
                                <>
                                  <span className={`${diff >= 0 ? 'text-red-600' : 'text-green-600'} text-sm font-bold flex items-center`}>
                                    {diff >= 0 ? '▲' : '▼'}{Math.abs(pct).toFixed(1)}%
                                  </span>
                                  <span className="text-xs text-gray-500">vs Avg</span>
                                </>
                              );
                            })()}
                          </div>
                          <div className="text-xs text-gray-600">
                            Historical Avg: ${(historicalDailyAvgCost * 7).toFixed(2)}/week
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* ================= Cost per Lead ================= */}
                    <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50 glass-card-hover relative">
                      <CardContent className="p-6 text-center">
                        <div className="text-sm font-bold text-gray-700 mb-2">Cost per Lead</div>
                        <div className="text-3xl font-black bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent mb-1">
                          ${hasLeadsData ? costPerLead.toFixed(2) : '0.00'}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-1">
                            {!hasLeadsData || isNoTimeFilter ? (
                              <span className="text-gray-400 text-sm font-bold flex items-center">▲ 0.0% <span className="text-xs text-gray-500 ml-1">vs Avg</span></span>
                            ) : (() => {
                              const diff = costPerLead - historicalCPL;
                              const pct = historicalCPL > 0 ? (diff / historicalCPL) * 100 : 0;
                              return (
                                <>
                                  <span className={`${diff >= 0 ? 'text-red-600' : 'text-green-600'} text-sm font-bold flex items-center`}>
                                    {diff >= 0 ? '▲' : '▼'}{Math.abs(pct).toFixed(1)}%
                                  </span>
                                  <span className="text-xs text-gray-500">vs Avg</span>
                                </>
                              );
                            })()}
                          </div>
                          <div className="text-xs text-gray-600">
                            {!hasLeadsData ? 'No data' : `Historical Avg: $${historicalCPL.toFixed(2)}/lead`}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* ================= Daily Avg Leads ================= */}
                    <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50 glass-card-hover relative">
                      <CardContent className="p-6 text-center">
                        <div className="text-sm font-bold text-gray-700 mb-2">Daily Avg Leads</div>
                        <div className="text-3xl font-black bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent mb-1">
                          {hasLeadsData ? currentDailyAvgLeads.toFixed(2) : '0.00'}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-1">
                            {!hasLeadsData || isNoTimeFilter ? (
                              <span className="text-gray-400 text-sm font-bold flex items-center">▲ 0.0% <span className="text-xs text-gray-500 ml-1">vs Avg</span></span>
                            ) : (() => {
                              const diff = currentDailyAvgLeads - historicalDailyAvgLeads;
                              const pct = historicalDailyAvgLeads > 0 ? (diff / historicalDailyAvgLeads) * 100 : 0;
                              return (
                                <>
                                  <span className={`${diff >= 0 ? 'text-green-600' : 'text-red-600'} text-sm font-bold flex items-center`}>
                                    {diff >= 0 ? '▲' : '▼'}{Math.abs(pct).toFixed(1)}%
                                  </span>
                                  <span className="text-xs text-gray-500">vs Avg</span>
                                </>
                              );
                            })()}
                          </div>
                          <div className="text-xs text-gray-600">
                            {!hasLeadsData ? 'No data' : `Historical Avg: ${historicalDailyAvgLeads.toFixed(2)} leads/day`}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* ================= Red Message Conv Rate ================= */}
                    <Card className="bg-white/95 backdrop-blur-xl shadow-lg border border-gray-200/50 glass-card-hover relative">
                      <CardContent className="p-6 text-center">
                        <div className="text-sm font-bold text-gray-700 mb-2">
                          Enquiry-to-Lead Rate
                        </div>
                        <div className="text-3xl font-black bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent mb-1">
                          {!hasMessageData || !hasLeadsData
                            ? '--'
                            : isNoTimeFilter
                              ? historicalConvRate !== null ? `${historicalConvRate.toFixed(1)}%` : '--'
                              : currentConvRate !== null ? `${currentConvRate.toFixed(1)}%` : '--'
                          }
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-1">
                            {!hasMessageData || !hasLeadsData || isNoTimeFilter || currentConvRate === null ? (
                              <span className="text-gray-400 text-sm font-bold flex items-center">▲ 0.0% <span className="text-xs text-gray-500 ml-1">vs Avg</span></span>
                            ) : (() => {
                              const hist = historicalConvRate ?? 0;
                              const diff = currentConvRate - hist;
                              const pct = hist > 0 ? (diff / hist) * 100 : 0;
                              return (
                                <>
                                  <span className={`${diff >= 0 ? 'text-green-600' : 'text-red-600'} text-sm font-bold flex items-center`}>
                                    {diff >= 0 ? '▲' : '▼'}{Math.abs(pct).toFixed(1)}%
                                  </span>
                                  <span className="text-xs text-gray-500">vs Avg</span>
                                </>
                              );
                            })()}
                          </div>
                          <div className="text-xs text-gray-600">
                            {!hasMessageData || !hasLeadsData || historicalConvRate === null
                              ? 'No data'
                              : `Historical Avg: ${historicalConvRate.toFixed(1)}%`
                            }
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                  </div>
                </div>
              );
            })()}

            {/* 模块导航 */}
            {filteredXiaowangTestData && (
              <div className="max-w-7xl mx-auto mb-6">
                <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-lg border border-gray-200/50 p-1">
                  <div className="flex">
                    {allModules.map((module: any, index: number) => {
                      const isActive = activeModule === module.id;
                      return (
                        <div key={module.id} className="flex-1">
                          <button
                            onClick={() => handleModuleChange(module.id)}
                            className={`w-full px-4 py-3 text-sm font-medium transition-all duration-200 ${isActive
                              ? 'bg-gradient-to-r from-[#751FAE] to-[#EF3C99] text-white shadow-md'
                              : 'bg-transparent hover:bg-gray-50 text-gray-700'
                              } ${index === 0 ? 'rounded-l-lg' : index === allModules.length - 1 ? 'rounded-r-lg' : ''
                              }`}
                          >
                            {module.name}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 动态内容区域 */}
            {filteredXiaowangTestData && (
              <>
                <div style={{ display: activeModule === 'broker' ? 'block' : 'none' }}>
                  <div className="max-w-7xl mx-auto mb-4 space-y-6">
                    <h2 className="text-xl font-semibold mb-3 bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">📊 Broker Distribution Analysis</h2>

                    {/* 小王测试数据图表（如果存在） */}
                    {brokerDataJson.length > 0 && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Broker分布饼图 */}
                        <div className="glass-card rounded-lg overflow-hidden">
                          <PieChartWithFilter startDate={startDate} endDate={endDate} brokerData={brokerDataJson} />
                        </div>

                        {/* 双环饼图 */}
                        {weeklyDataJson.length > 0 && (
                          <div className="glass-card rounded-lg overflow-hidden">
                            <BrokerWeeklyDonutChart startDate={startDate} endDate={endDate} brokerData={brokerDataJson} weeklyData={weeklyDataJson} leftChartLegendData={processedBrokerData} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Campaign Overview Module */}
                <div style={{ display: activeModule === 'campaign-overview' ? 'block' : 'none' }}>
                  <div className="max-w-7xl mx-auto mb-4 space-y-6">
                    <WeeklyCostTrendOverview
                      xiaowangTestData={activeTestData}
                      brokerData={brokerDataJson}
                    />

                    <XiaowangTestCampaignOverview
                      dailyData={combinedDailyData}
                      brokerData={brokerDataJson}
                      startDate={startDate}
                      endDate={endDate}
                    />

                    <AccountPerformanceOverview
                      title="小王 Performance Overview"
                      dailyData={xiaowangTestData?.dailyData || []}
                      startDate={startDate}
                      endDate={endDate}
                      notesData={xiaowangTestNotesData}
                      accountName="小王"
                    />

                    <AccountPerformanceOverview
                      title="LifeCAR Performance Overview"
                      dailyData={lifeCarDailyData}
                      startDate={startDate}
                      endDate={endDate}
                      notesData={lifeCarNotesData}
                      accountName="LifeCAR"
                    />
                  </div>
                </div>

                {/* Cost Analysis Module */}
                <div style={{ display: activeModule === 'cost' ? 'block' : 'none' }}>
                  {/* Main Content */}
                  <div className="max-w-7xl mx-auto mb-4">
                    <Accordion type="multiple" defaultValue={["weekly-performance", "monthly-analysis"]} className="space-y-4">

                      {/* Weekly Performance Section */}
                      <AccordionItem value="weekly-performance" id="weekly-performance" className="bg-white/95 backdrop-blur-xl rounded-lg border border-gray-200/50 shadow-lg">
                        <AccordionTrigger className="px-6 py-4 hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-4">
                            <h2 className="text-xl font-semibold bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat flex items-center gap-2">
                              <div className="w-4 h-4 bg-[#751FAE]"></div>
                              Weekly Performance
                            </h2>
                            <div className="flex items-center gap-3" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                              <span className="text-sm font-medium text-gray-700">Latest</span>
                              <input
                                type="number"
                                value={weeklyTimePeriod}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value);
                                  if (value > 0 && value <= 104) {
                                    setWeeklyTimePeriod(value);
                                  }
                                }}
                                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                min="1"
                                max="104"
                              />
                              <span className="text-sm font-medium text-gray-700">weeks</span>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                          <div className="space-y-8">
                            <XiaowangTestWeeklyCostPerMetric
                              xiaowangTestData={activeTestData}
                              brokerData={brokerDataJson}
                              selectedMetric={xiaowangSelectedMetric}
                              onMetricChange={setXiaowangSelectedMetric}
                              weeklyTimePeriod={weeklyTimePeriod}
                              notesWeeklyCount={xiaowangNotesWeeklyCount}
                            />
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      {/* Monthly Analysis Section */}
                      <AccordionItem value="monthly-analysis" id="monthly-analysis" className="bg-white/95 backdrop-blur-xl rounded-lg border border-gray-200/50 shadow-lg">
                        <AccordionTrigger className="px-6 py-4 hover:no-underline">
                          <h2 className="text-xl font-semibold bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat flex items-center gap-2">
                            <div className="w-4 h-4 bg-[#751FAE]"></div>
                            Monthly Analysis
                          </h2>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-6">
                          <div className="space-y-8">
                            <XiaowangTestMonthlyCostAnalysis
                              xiaowangTestData={activeTestData}
                              brokerData={brokerDataJson}
                              selectedMetric={xiaowangSelectedMetric}
                              onMetricChange={setXiaowangSelectedMetric}
                              notesMonthlyCount={xiaowangNotesMonthlyCount}
                            />

                            <XiaowangTestMonthlyCostPerMetric
                              xiaowangTestData={activeTestData}
                              brokerData={brokerDataJson}
                              selectedMetric={xiaowangSelectedMetric}
                              onMetricChange={setXiaowangSelectedMetric}
                              notesMonthlyCount={xiaowangNotesMonthlyCount}
                            />
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                    </Accordion>
                  </div>
                </div>

                {/* Weekly Analysis Module */}
                <div style={{ display: activeModule === 'weekly-analysis' ? 'block' : 'none' }}>
                  <div className="max-w-7xl mx-auto mb-4 space-y-6">
                    <h2 className="text-xl font-semibold mb-3 bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">📈 Weekly Analysis</h2>

                    {/* 检查是否有数据 */}
                    {activeTestData && brokerDataJson.length > 0 ? (
                      <>
                        {/* Weekly Performance Details */}
                        <div className="space-y-6">
                          {/* Overall Weekly Average */}
                          <XiaowangTestWeeklyOverallAverage
                            weeklyData={activeTestData?.dailyData || []}
                            brokerData={brokerDataJson}
                            startDate={startDate}
                            endDate={endDate}
                          />

                          {/* Weekly Performance Details */}
                          <XiaowangTestWeeklyAnalysisAdapted
                            weeklyData={activeTestData?.dailyData || []}
                            brokerData={brokerDataJson}
                            startDate={startDate}
                            endDate={endDate}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="text-center bg-white/95 backdrop-blur-xl rounded-lg shadow-xl shadow-purple-500/10 ring-1 ring-purple-500/20 p-12">
                        <div className="text-6xl mb-6">📈</div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-4">No Data Available</h3>
                        <p className="text-gray-500 mb-4">Please upload both test data and consultation data to view weekly analysis.</p>
                        <div className="text-sm text-gray-400 space-y-1">
                          <p>1. Upload 小王测试 data (CSV format)</p>
                          <p>2. Upload 小王测试 data with "new client info" sheet</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Month-to-Month Comparison Module (activity-heatmap) */}
                <div style={{ display: activeModule === 'activity-heatmap' ? 'block' : 'none' }}>
                  <div className="max-w-7xl mx-auto mb-4 space-y-6">

                    {/* Check if we have broker data for the components */}
                    {brokerDataJson.length > 0 ? (
                      <div className="space-y-6">
                        {/* Month-to-Month Comparison */}
                        <div className="glass-card rounded-lg overflow-hidden">
                          <div className="p-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800">Month-to-Month Comparison</h3>
                          </div>
                          <MonthlyPatternChart
                            data={monthlyDataJson}
                            title="Month-to-Month Comparison"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center bg-white/95 backdrop-blur-xl rounded-lg shadow-xl shadow-purple-500/10 ring-1 ring-purple-500/20 p-12">
                        <div className="text-6xl mb-6">🔥</div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-4">No Data Available</h3>
                        <p className="text-gray-500 mb-4">Please upload both test data and consultation data to view the template analysis.</p>
                        <div className="text-sm text-gray-400 space-y-1">
                          <p>1. Upload 小王测试 data (CSV format)</p>
                          <p>2. Upload 小王测试 data with broker information</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Placeholder for other modules */}
                {activeModule !== 'broker' && activeModule !== 'campaign-overview' && activeModule !== 'cost' && activeModule !== 'weekly-analysis' && activeModule !== 'activity-heatmap' && (
                  <div className="max-w-7xl mx-auto mb-4">
                    <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-xl shadow-purple-500/10 ring-1 ring-purple-500/20 p-12 text-center">
                      <div className="text-6xl mb-6">🚧</div>
                      <h3 className="text-xl font-semibold text-gray-700 mb-4">Module Under Development</h3>
                      <p className="text-gray-500">This module is currently being developed. More features coming soon!</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 浮动笔记按钮 */}
            {filteredXiaowangTestData && (() => {
              const isLifeCar = selectedAccount === 'lifecar'
              const openModal = isLifeCar ? () => setShowNotesModal(true) : () => setShowXiaowangNotesModal(true)
              const selectedDates = isLifeCar ? selectedNoteDates : selectedXiaowangNoteDates
              const clearDates = isLifeCar ? () => setSelectedNoteDates([]) : () => setSelectedXiaowangNoteDates([])
              return (
                <div className="fixed top-1/2 right-6 transform -translate-y-1/2 z-40 space-y-2">
                  <Button
                    onClick={openModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 rounded-full px-4 py-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-medium">Posts</span>
                  </Button>
                  {selectedDates.length > 0 && (
                    <Button
                      onClick={clearDates}
                      variant="outline"
                      size="sm"
                      className="bg-white/90 border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                      清除选中 ({selectedDates.length})
                    </Button>
                  )}
                  {selectedDates.length > 0 && (
                    <div className="text-xs text-gray-600 bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md border border-blue-200/50 max-h-32 overflow-y-auto">
                      <div className="font-medium text-blue-600 mb-1">选中的笔记日期:</div>
                      {[...selectedDates].sort().map((date: string, index: number) => (
                        <div key={index} className="text-gray-600 py-0.5">{date}</div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}

          </>
        )}

      </div>

      {/* LifeCar Notes Modal */}
      <LifeCarNotesModal
        isOpen={showNotesModal}
        onClose={handleNotesModalClose}
        onDataUpdate={(data: any) => {
          console.log('LifeCar Posts data updated:', data.length, 'posts')
          setLifeCarNotesData(data)
        }}
        initialData={lifeCarNotesData}
        onDateSelect={(date: string) => {
          setSelectedNoteDates((prev: string[]) => {
            const chartDate = date.split(' ')[0]; // Extract date part
            if (prev.includes(chartDate)) {
              // Remove if already selected
              return prev.filter((d: string) => d !== chartDate);
            } else {
              // Add if not selected
              return [...prev, chartDate];
            }
          });
        }}
        selectedDates={selectedNoteDates}
      />

      {/* XiaoWang Test Notes Modal */}
      <XiaoWangTestNotesModal
        isOpen={showXiaowangNotesModal}
        onClose={handleXiaowangNotesModalClose}
        onDataUpdate={(data: any) => {
          console.log('XiaoWang Test Posts data updated:', data.length, 'posts')
          setXiaowangTestNotesData(data)
        }}
        initialData={xiaowangTestNotesData}
        onDateSelect={(date: string) => {
          setSelectedXiaowangNoteDates((prev: string[]) => {
            const chartDate = date.split(' ')[0]; // Extract date part
            if (prev.includes(chartDate)) {
              // Remove if already selected
              return prev.filter(d => d !== chartDate);
            } else {
              // Add if not selected
              return [...prev, chartDate];
            }
          });
        }}
        selectedDates={selectedXiaowangNoteDates}
      />

      {/* All in One 上传模态框 */}
      {showAllInOneUpload && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white/90 backdrop-blur-xl rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl shadow-purple-500/20 border border-purple-200/50">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">All in One Upload</h2>
                <p className="text-sm text-gray-600 font-montserrat font-light">测试阶段 - Session Break</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllInOneUpload(false)}
                className="text-purple-500 hover:text-purple-700 hover:bg-purple-50"
              >
                ✕
              </Button>
            </div>
            <AllInOneUpload
              onUploadSuccess={async (data) => {
                console.log('All in One upload successful:', data);

                // === 详细数据内容检查 ===
                console.log('=== ALL-IN-ONE 数据内容详细检查 ===');
                if (data?.xiaowangConsultation?.broker_data) {
                  console.log('All-in-One Broker数据总数:', data.xiaowangConsultation.broker_data.length);
                  console.log('All-in-One 前5条broker记录:', data.xiaowangConsultation.broker_data.slice(0, 5));
                  console.log('All-in-One broker字段样例:', data.xiaowangConsultation.broker_data.slice(0, 3).map((item: any) => ({
                    no: item.no,
                    broker: item.broker,
                    date: item.date,
                    wechat: item.wechat,
                    source: item.source
                  })));

                  // 检查所有唯一的broker名称
                  const uniqueBrokers = [...new Set(data.xiaowangConsultation.broker_data.map((item: any) => item.broker))];
                  console.log('All-in-One 所有唯一的broker名称:', uniqueBrokers);

                  // 检查日期格式
                  const datesSample = data.xiaowangConsultation.broker_data.slice(0, 10).map((item: any) => item.date);
                  console.log('All-in-One 日期格式样例:', datesSample);

                  // 按broker分组统计
                  const brokerCounts: Record<string, number> = {};
                  data.xiaowangConsultation.broker_data.forEach((item: any) => {
                    brokerCounts[item.broker] = (brokerCounts[item.broker] || 0) + 1;
                  });
                  console.log('All-in-One 每个broker的记录数:', brokerCounts);

                  // 检查空值情况
                  const emptyFields = {
                    no: data.xiaowangConsultation.broker_data.filter((item: any) => !item.no).length,
                    broker: data.xiaowangConsultation.broker_data.filter((item: any) => !item.broker).length,
                    date: data.xiaowangConsultation.broker_data.filter((item: any) => !item.date).length,
                    wechat: data.xiaowangConsultation.broker_data.filter((item: any) => !item.wechat).length,
                    source: data.xiaowangConsultation.broker_data.filter((item: any) => !item.source).length
                  };
                  console.log('All-in-One 空值字段统计:', emptyFields);
                }

                // 处理数据映射到相应的状态
                if (data) {
                  // 更新小王 Broker 数据 (client_info -> xiaowang consultation)
                  if (data.xiaowangConsultation) {
                    updateAllData({
                      broker_data: data.xiaowangConsultation.broker_data || [],
                      weekly_data: data.xiaowangConsultation.weekly_data || [],
                      monthly_data: data.xiaowangConsultation.monthly_data || [],
                      daily_cost_data: data.xiaowangConsultation.daily_cost_data || []
                    });
                  }

                  // 更新小王测试数据 (小王投放 -> xiaowang advertising, 小王笔记 -> xiaowang notes)
                  if (data.xiaowangAdvertising || data.xiaowangNotes || data.xiaowangConsultation || data.xiaowangMessage) {
                    // All-in-One现在返回的是rawData而不是adData
                    if (data.xiaowangAdvertising && data.xiaowangAdvertising.rawData) {
                      // 使用新格式，构造正确的数据结构
                      setXiaowangTestData({
                        brokerData: data.xiaowangConsultation?.broker_data || [],
                        rawData: data.xiaowangAdvertising.rawData || [],  // 使用rawData
                        adData: data.xiaowangAdvertising.rawData || [],   // 同时设置adData保持兼容
                        dailyData: data.xiaowangAdvertising.dailyData || [],
                        summary: data.xiaowangAdvertising.summary || {},
                        notesData: data.xiaowangNotes || []
                      });
                    } else {
                      // 兼容旧格式或空数据
                      setXiaowangTestData({
                        brokerData: data.xiaowangConsultation?.broker_data || [],
                        rawData: [],
                        adData: [],
                        dailyData: [],
                        summary: {},
                        notesData: data.xiaowangNotes || []
                      });
                    }

                    // 更新小王笔记数据到正确的状态
                    if (data.xiaowangNotes && data.xiaowangNotes.length > 0) {
                      console.log('All-in-One: Updating XiaoWang notes data:', data.xiaowangNotes.length, 'notes');
                      setXiaowangTestNotesData(data.xiaowangNotes);
                    }

                    // 切换到 Combined 视图
                    setSelectedAccount('combined');
                  }

                  // 更新 LifeCar 数据 (LifeCar投放 -> lifecar data, LifeCar笔记 -> lifecar notes)
                  if (data.lifecarData) {
                    setLifeCarData(data.lifecarData);
                    // 如果有月度数据，也设置月度数据
                    if (data.lifecarMonthlyData) {
                      setLifeCarMonthlyData(data.lifecarMonthlyData);
                    } else {
                      // 如果没有月度数据，从日数据生成
                      try {
                        const { aggregateByMonth } = await import('@/lib/lifecar-data-processor');
                        const monthlyData = aggregateByMonth(data.lifecarData);
                        setLifeCarMonthlyData(monthlyData);
                      } catch (error) {
                        console.error('Failed to generate monthly data:', error);
                      }
                    }
                  }

                  // 更新 LifeCar 笔记数据
                  if (data.lifecarNotes && data.lifecarNotes.length > 0) {
                    console.log('All-in-One: Updating LifeCar notes data:', data.lifecarNotes.length, 'notes');
                    setLifeCarNotesData(data.lifecarNotes);
                  }

                  // 显示成功消息并刷新数据
                  setDataRefreshKey((prev: number) => prev + 1);
                }

                setShowAllInOneUpload(false);
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
}