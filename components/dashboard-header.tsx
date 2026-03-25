"use client"

import React from 'react'
import { AccountSwitcher } from "@/components/ui/platform-switcher"

interface DashboardHeaderProps {
  selectedAccount: string;
  handleAccountChange: (account: string) => void;
  setShowXiaowangTestUpload: (show: boolean) => void;
  setUploadAccountType: (type: 'lifecar' | 'xiaowang') => void;
  setShowUpload: (show: boolean) => void;
  setShowAllInOneUpload: (show: boolean) => void;
}

export function DashboardHeader({
  selectedAccount,
  handleAccountChange,
  setShowXiaowangTestUpload,
  setUploadAccountType,
  setShowUpload,
  setShowAllInOneUpload
}: DashboardHeaderProps) {
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

        {/* 右侧：账号选择 + 按钮组 */}
        <div className="ml-auto flex items-center space-x-3 flex-shrink-0">
          <AccountSwitcher
            onAccountChange={handleAccountChange}
            defaultAccount={selectedAccount}
          />
          <button
            onClick={() => window.location.href = '/information-hub'}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#751FAE] to-[#EF3C99] rounded-lg hover:from-[#6919A6] hover:to-[#E73691] transition-all duration-200 shadow-md"
            title="Information Hub"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Information Hub
          </button>

        </div>
      </div>
    </div>
  )
}
