"use client"

import React from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface DashboardTimeFilterProps {
  startDate: string
  setStartDate: (date: string) => void
  endDate: string
  setEndDate: (date: string) => void
  handleLastWeek: () => void
  isLastWeekSelected: () => boolean
  handleClearFilter: () => void
  handlePreviousPeriod: () => void
  handleNextPeriod: () => void
  error: string | null
  selectedAccount: string
  isSticky?: boolean // if true, uses the sticky compact design
}

export function DashboardTimeFilter({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  handleLastWeek,
  isLastWeekSelected,
  handleClearFilter,
  handlePreviousPeriod,
  handleNextPeriod,
  error,
  selectedAccount,
  isSticky = false
}: DashboardTimeFilterProps) {
  const minDate = selectedAccount === 'lifecar' ? "2025-05-01" : "2024-09-01";
  const today = new Date();
  const maxDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  if (isSticky) {
    return (
      <div className="w-full bg-white/[0.73] backdrop-blur-3xl border-t border-purple-200/40">
        <div className="w-full px-4 md:px-8 py-2">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap items-center gap-2 justify-center">
              {/* Date inputs */}
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={minDate}
                  max={maxDate}
                  className="text-sm border border-gray-300 rounded-md px-2.5 py-1.5 bg-white/90 backdrop-blur-sm focus:border-purple-400 focus:outline-none h-9"
                  placeholder="Start"
                />
                <span className="text-sm text-gray-500 font-medium">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={minDate}
                  max={maxDate}
                  className="text-sm border border-gray-300 rounded-md px-2.5 py-1.5 bg-white/90 backdrop-blur-sm focus:border-purple-400 focus:outline-none h-9"
                  placeholder="End"
                />
              </div>

              {/* Quick action buttons */}
              <Button
                onClick={handleLastWeek}
                variant="secondary"
                size="sm"
                className={`${
                  isLastWeekSelected()
                    ? 'bg-purple-400/90 text-white hover:bg-purple-500/90'
                    : 'bg-purple-100/80 text-purple-700 hover:bg-purple-200/80'
                } transition-all duration-200 font-semibold h-9 px-3 text-sm backdrop-blur-sm`}
              >
                Last Week
              </Button>

              <Button
                onClick={handleClearFilter}
                variant="outline"
                size="sm"
                className="bg-white/80 border-gray-300 text-gray-700 hover:bg-gray-100/80 hover:border-gray-400 transition-all duration-200 h-9 px-3 text-sm backdrop-blur-sm"
              >
                Clear
              </Button>

              {/* Navigation buttons */}
              {startDate && endDate && (
                <>
                  <Button
                    onClick={handlePreviousPeriod}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 bg-white/80 border-gray-300 text-gray-700 hover:bg-purple-50/80 hover:border-purple-400 hover:text-purple-700 transition-all duration-200 h-9 px-3 text-sm backdrop-blur-sm"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Prev</span>
                  </Button>

                  <div className="text-sm text-gray-600 font-semibold flex items-center px-1.5">
                    {(() => {
                      const start = new Date(startDate);
                      const end = new Date(endDate);
                      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                      return `${days}d`;
                    })()}
                  </div>

                  <Button
                    onClick={handleNextPeriod}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 bg-white/80 border-gray-300 text-gray-700 hover:bg-purple-50/80 hover:border-purple-400 hover:text-purple-700 transition-all duration-200 h-9 px-3 text-sm backdrop-blur-sm"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular card design
  return (
    <div className="max-w-7xl mx-auto mb-6">
      <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-xl shadow-purple-500/10 ring-1 ring-purple-500/20 p-6">
        {/* 主体标签 */}
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
          <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
            <CalendarIcon className="h-5 w-5 text-purple-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 font-montserrat">Time Filters</h3>
        </div>
        
        {/* 单行布局 */}
        <div className="flex flex-wrap items-end gap-3">
          {/* Start Date */}
          <div className="flex-1 min-w-[150px]">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1 font-montserrat mb-1">
              <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
              Start Date
            </label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={minDate}
              max={maxDate}
              className="w-full justify-start text-left font-normal bg-white border-gray-300 text-gray-800 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200 hover:bg-gray-50 h-9 text-sm"
            />
          </div>
          
          {/* End Date */}
          <div className="flex-1 min-w-[150px]">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1 font-montserrat mb-1">
              <div className="w-1.5 h-1.5 bg-pink-600 rounded-full"></div>
              End Date
            </label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={minDate}
              max={maxDate}
              className="w-full justify-start text-left font-normal bg-white border-gray-300 text-gray-800 focus:border-pink-500 focus:ring-pink-500/20 transition-all duration-200 hover:bg-gray-50 h-9 text-sm"
            />
          </div>

          {/* Quick actions */}
          <Button 
            onClick={handleLastWeek} 
            variant="secondary"
            size="sm"
            className={`${
              isLastWeekSelected() 
                ? 'bg-purple-400 text-white hover:bg-purple-500' 
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            } transition-all duration-200 font-semibold h-9 px-3`}
          >
            Last Week
          </Button>
          
          <Button 
            onClick={handleClearFilter} 
            variant="outline"
            size="sm"
            className="bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 h-9 px-3"
          >
            Clear
          </Button>

          {/* Navigation buttons - only show when dates are selected */}
          {startDate && endDate && (
            <>
              <Button
                onClick={handlePreviousPeriod}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 bg-white border-gray-300 text-gray-700 hover:bg-purple-50 hover:border-purple-400 hover:text-purple-700 transition-all duration-200 h-9 px-3"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">{isSticky ? 'Prev' : 'Previous'}</span>
              </Button>
              
              <div className="text-xs text-gray-500 font-medium flex items-center px-2">
                {(() => {
                  const start = new Date(startDate);
                  const end = new Date(endDate);
                  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                  const suffix = isSticky ? 'days' : (days !== 1 ? 'days' : 'day');
                  return `${days} ${suffix}`;
                })()}
              </div>
              
              <Button
                onClick={handleNextPeriod}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 bg-white border-gray-300 text-gray-700 hover:bg-purple-50 hover:border-purple-400 hover:text-purple-700 transition-all duration-200 h-9 px-3"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
        
        {error && (
          <div className="mt-4 text-red-600 text-sm font-medium font-montserrat">{error}</div>
        )}
        
        {startDate && endDate && (
          <div className="mt-4 text-sm text-purple-600 font-medium font-montserrat">
            Filtering data from {startDate} to {endDate}
          </div>
        )}
      </div>
    </div>
  );
}
