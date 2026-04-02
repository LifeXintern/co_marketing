"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { AccountSwitcher } from "@/components/ui/platform-switcher"

interface DashboardHeaderProps {
  selectedAccount: string;
  handleAccountChange: (account: string) => void;
  setShowAllInOneUpload: (show: boolean) => void;
}

export function DashboardHeader({
  selectedAccount,
  handleAccountChange,
  setShowAllInOneUpload
}: DashboardHeaderProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Listen for fullscreenchange (handles Escape key, etc.)
  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen toggle failed:', err);
    }
  }, []);

  return (
    <div className="w-full px-4 md:px-8">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3 md:gap-4 py-2.5 md:py-3">
        {/* 左侧：Logo + 上传按钮组 */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <img 
            src="/LifeX_logo.png" 
            alt="LifeX Logo" 
            className="h-12 w-auto"
          />

          <div className="flex items-center space-x-2 border-l border-gray-300 pl-4">


            {/* All in One 上传按钮 */}
            <button
              type="button"
              onClick={() => {
                console.log('All in One button clicked');
                setShowAllInOneUpload(true);
              }}
              className="flex items-center gap-1 px-3 py-2 text-xs text-white bg-gradient-to-r from-[#751FAE] to-[#EF3C99] hover:from-[#6919A6] hover:to-[#E73691] transition-all duration-200 rounded-md shadow-md"
              title="Upload Dataset"
              style={{ pointerEvents: 'auto' }}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="font-medium">Upload Dataset</span>
            </button>
          </div>
        </div>

        {/* 中间：标题区域 */}
        <div className="flex-1 min-w-[220px] text-center">
          <h1 className="text-2xl md:text-4xl font-black bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat leading-tight">
            Marketing Dashboard
          </h1>
        </div>

        {/* 右侧：账号选择 + 全屏按钮组 */}
        <div className="ml-auto flex items-center space-x-3 flex-shrink-0">
          <AccountSwitcher
            onAccountChange={handleAccountChange}
            defaultAccount={selectedAccount}
          />

          {/* Fullscreen toggle button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 bg-white/80 hover:bg-gray-100 transition-all duration-200 shadow-sm"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            id="fullscreen-toggle-btn"
          >
            {isFullscreen ? (
              /* Compress / exit-fullscreen icon */
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9L4 4m0 0v4m0-4h4M15 9l5-5m0 0v4m0-4h-4M9 15l-5 5m0 0v-4m0 4h4M15 15l5 5m0 0v-4m0 4h-4" />
              </svg>
            ) : (
              /* Expand / enter-fullscreen icon */
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5M20 8V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5M20 16v4m0 0h-4m4 0l-5-5" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
