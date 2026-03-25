"use client"

import React from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DashboardTimeFilter } from '@/components/dashboard-time-filter'
import { LifeCarOverviewStats } from "@/components/lifecar-overview-stats"
import { LifeCarDailyTrends } from "@/components/lifecar-daily-trends"
import { LifeCarMonthlySummary } from "@/components/lifecar-monthly-summary"
import { ViewsCostDailyChart } from "@/components/views-cost-daily-chart"
import { CostPerFollowerDailyChart } from "@/components/cost-per-follower-daily-chart"
import { MonthlyViewsCostChart } from "@/components/monthly-views-cost-chart"
import { MonthlyCostPerMetricChart } from "@/components/monthly-cost-per-metric-chart"
import { LifeCarWeeklyAnalysis } from "@/components/lifecar-weekly-analysis"

export interface LifecarDashboardProps {
  selectedAccount: string;
  lifeCarData: any[];
  lifeCarLoading: boolean;
  filteredLifeCarData: any[];
  error: string | null;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  handleLastWeek: () => void;
  isLastWeekSelected: () => boolean;
  handleClearFilter: () => void;
  handlePreviousPeriod: () => void;
  handleNextPeriod: () => void;
  setShowNotesModal: (show: boolean) => void;
  selectedNoteDates: string[];
  setSelectedNoteDates: (dates: string[]) => void;
  allModules: any[];
  accountHiddenModules: string[];
  activeModule: string;
  handleModuleChange: (moduleId: string) => void;
  toggleModuleVisibility: (moduleId: string) => void;
  lifeCarMonthlyData: any[];
  lifeCarNotesData: any[];
  lifecarChartMetric: 'views' | 'likes' | 'followers';
  setLifecarChartMetric: (metric: 'views' | 'likes' | 'followers') => void;
  lifecarChartFiltered: boolean;
  setLifecarChartFiltered: (filtered: boolean) => void;
  notesInDateRange: string[];
  notesWeekdayCount: Record<string, number>;
  monthlyChartMetric: 'views' | 'likes' | 'followers';
  setMonthlyChartMetric: (metric: 'views' | 'likes' | 'followers') => void;
  notesMonthlyCount: Record<string, number>;
}

export function LifecarDashboard(props: LifecarDashboardProps) {
  const {
    selectedAccount,
    lifeCarData,
    lifeCarLoading,
    filteredLifeCarData,
    error,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    handleLastWeek,
    isLastWeekSelected,
    handleClearFilter,
    handlePreviousPeriod,
    handleNextPeriod,
    setShowNotesModal,
    selectedNoteDates,
    setSelectedNoteDates,
    allModules,
    accountHiddenModules,
    activeModule,
    handleModuleChange,
    toggleModuleVisibility,
    lifeCarMonthlyData,
    lifeCarNotesData,
    lifecarChartMetric,
    setLifecarChartMetric,
    lifecarChartFiltered,
    setLifecarChartFiltered,
    notesInDateRange,
    notesWeekdayCount,
    monthlyChartMetric,
    setMonthlyChartMetric,
    notesMonthlyCount
  } = props;

  return (
    <>
      {/* Date Filter Card Area */}
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
        isSticky={false}
      />

      {/* LifeCAR数据加载状态 */}
      {lifeCarLoading && (
        <div className="max-w-7xl mx-auto mb-6 flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-purple-600 font-medium">Loading LifeCAR data...</p>
          </div>
        </div>
      )}

      {/* LifeCAR概览统计 */}
      {!lifeCarLoading && filteredLifeCarData.length > 0 && (
        <div className="max-w-7xl mx-auto">
          <LifeCarOverviewStats data={filteredLifeCarData} allTimeData={lifeCarData} />
        </div>
      )}

      {/* 浮动笔记按钮 - 只在LifeCar账号且有数据时显示 */}
      {selectedAccount === 'lifecar' && !lifeCarLoading && filteredLifeCarData.length > 0 && (
        <div className="fixed top-1/2 right-6 transform -translate-y-1/2 z-40 space-y-2">
          <Button
            onClick={() => setShowNotesModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 rounded-full px-4 py-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="font-medium">Posts</span>
          </Button>
          {selectedNoteDates.length > 0 && (
            <Button
              onClick={() => setSelectedNoteDates([])}
              variant="outline"
              size="sm"
              className="w-full text-xs text-gray-500 border-gray-300 hover:bg-gray-50"
            >
              Clear
            </Button>
          )}
          {selectedNoteDates.length > 0 && (
            <div className="text-xs text-gray-600 bg-white px-2 py-1 rounded shadow max-h-32 overflow-y-auto">
              {[...selectedNoteDates].sort().map((date, index) => (
                <div key={index} className="text-gray-500">{date}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* LifeCAR模块导航 */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-lg border border-gray-200/50 p-1">
          <div className="flex">
            {allModules.map((module, index) => {
              const isHidden = accountHiddenModules.includes(module.id);
              const isActive = activeModule === module.id;
              return (
                <div key={module.id} className={`flex-1 relative ${
                  isHidden ? 'opacity-50' : ''
                }`}>
                  <button
                    onClick={() => !isHidden && handleModuleChange(module.id)}
                    disabled={isHidden}
                    className={`w-full px-4 py-3 text-sm font-medium transition-all duration-200 ${
                      isActive && !isHidden
                        ? 'bg-gradient-to-r from-[#751FAE] to-[#EF3C99] text-white shadow-md'
                        : isHidden
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-transparent hover:bg-gray-50 text-gray-700'
                    } ${
                      index === 0 ? 'rounded-l-lg' : index === allModules.length - 1 ? 'rounded-r-lg' : ''
                    }`}
                  >
                    {module.name}
                  </button>
                  <button
                    onClick={() => toggleModuleVisibility(module.id)}
                    className="absolute top-1 right-1 p-1 rounded-full hover:bg-black/10 transition-colors duration-200"
                    title={isHidden ? 'Show module' : 'Hide module'}
                  >
                    {isHidden ? (
                      <EyeOff className="w-3 h-3 text-gray-400" />
                    ) : (
                      <Eye className="w-3 h-3 text-gray-500 hover:text-gray-700" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* LifeCAR动态内容区域 */}
      {!lifeCarLoading && filteredLifeCarData.length > 0 && (
        <>
          {activeModule === 'broker' && (
            <div className="max-w-7xl mx-auto mb-4 space-y-6">
              <h2 className="text-xl font-semibold mb-3 bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat flex items-center gap-2">
                <div className="w-4 h-4 bg-[#751FAE]"></div>
                LifeCAR Performance Overview
              </h2>
              
              <LifeCarDailyTrends data={filteredLifeCarData} title="Daily Marketing Performance" />
            </div>
          )}

          {activeModule === 'cost' && (
            <div className="max-w-7xl mx-auto mb-4 space-y-6">
              <h2 className="text-xl font-semibold mb-3 bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat flex items-center gap-2">
                <div className="w-4 h-4 bg-[#751FAE]"></div>
                Trend Overview
              </h2>
              
              <LifeCarMonthlySummary
                data={lifeCarMonthlyData}
                dailyData={lifeCarData}
                unfilteredDailyData={lifeCarData}
                title="Monthly Cost Analysis"
                selectedDates={selectedNoteDates}
                notesData={lifeCarNotesData}
              />
            </div>
          )}

          {activeModule === 'cost-interaction' && (
            <div className="max-w-7xl mx-auto mb-4 space-y-6">
              <h2 className="text-xl font-semibold mb-3 bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat flex items-center gap-2">
                <div className="w-4 h-4 bg-[#751FAE]"></div>
                Day of Week Analysis
              </h2>
              
              {filteredLifeCarData && filteredLifeCarData.length > 0 && (
                <ViewsCostDailyChart
                  data={filteredLifeCarData}
                  title="Daily Views & Cost Trend"
                  startDate={startDate}
                  endDate={endDate}
                  allData={lifeCarData}
                  selectedMetric={lifecarChartMetric}
                  onMetricChange={setLifecarChartMetric}
                  isFiltered={lifecarChartFiltered}
                  onFilterChange={setLifecarChartFiltered}
                  selectedDates={notesInDateRange}
                  notesWeekdayCount={notesWeekdayCount}
                  notesData={lifeCarNotesData}
                />
              )}
              
              {filteredLifeCarData && filteredLifeCarData.length > 0 && (
                <CostPerFollowerDailyChart
                  data={filteredLifeCarData}
                  title="Daily Cost Per Follower Trend"
                  startDate={startDate}
                  endDate={endDate}
                  allData={lifeCarData}
                  selectedMetric={lifecarChartMetric}
                  onMetricChange={setLifecarChartMetric}
                  isFiltered={lifecarChartFiltered}
                  onFilterChange={setLifecarChartFiltered}
                  selectedDates={notesInDateRange}
                  notesWeekdayCount={notesWeekdayCount}
                  notesData={lifeCarNotesData}
                />
              )}
            </div>
          )}

          {activeModule === 'activity-heatmap' && (
            <div className="max-w-7xl mx-auto mb-4 space-y-6">
              <h2 className="text-xl font-semibold mb-3 bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat flex items-center gap-2">
                <div className="w-4 h-4 bg-[#751FAE]"></div>
                Monthly Analysis
              </h2>
              
              {lifeCarData && lifeCarData.length > 0 && (
                <MonthlyViewsCostChart 
                  data={lifeCarData} 
                  title="Monthly Metrics & Cost Analysis"
                  selectedMetric={monthlyChartMetric}
                  onMetricChange={setMonthlyChartMetric}
                  notesMonthlyCount={notesMonthlyCount}
                />
              )}
              
              {lifeCarData && lifeCarData.length > 0 && (
                <MonthlyCostPerMetricChart 
                  data={lifeCarData} 
                  title="Monthly Cost Analysis"
                  selectedMetric={monthlyChartMetric}
                  onMetricChange={setMonthlyChartMetric}
                  notesMonthlyCount={notesMonthlyCount}
                />
              )}
            </div>
          )}

          {activeModule === 'weekly-analysis' && (
            <div className="max-w-7xl mx-auto mb-4">
              <h2 className="text-xl font-semibold mb-3 bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat flex items-center gap-2">
                <div className="w-4 h-4 bg-[#751FAE]"></div>
                Weekly Analysis
              </h2>
              <LifeCarWeeklyAnalysis 
                data={lifeCarData} 
                title="Weekly Performance Metrics"
              />
            </div>
          )}
        </>
      )}

      {/* 无数据状态 */}
      {!lifeCarLoading && filteredLifeCarData.length === 0 && (
        <div className="max-w-7xl mx-auto flex items-center justify-center py-12">
          <div className="text-center bg-white/95 backdrop-blur-xl rounded-lg shadow-xl shadow-purple-500/10 ring-1 ring-purple-500/20 p-12">
            <div className="text-6xl mb-6">📊</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-4">No Data Available</h3>
            <p className="text-gray-500">No data found for the selected date range. Please adjust your filters.</p>
          </div>
        </div>
      )}
    </>
  );
}
