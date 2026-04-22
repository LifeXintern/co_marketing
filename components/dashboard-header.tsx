"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { AccountSwitcher } from "@/components/ui/platform-switcher"

interface DashboardHeaderProps {
  selectedAccount: string;
  handleAccountChange: (account: string) => void;
}

export function DashboardHeader({
  selectedAccount,
  handleAccountChange
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
        {/* 左侧：Logo */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <img
            src="/LifeX_logo.png"
            alt="LifeX Logo"
            className="h-12 w-auto"
          />
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
