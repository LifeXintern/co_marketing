"use client"

import React, { useEffect } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function XiaowangPostPerformancePage() {
  useEffect(() => {
    // Load Tableau visualization script
    const script = document.createElement('script');
    script.src = 'https://public.tableau.com/javascripts/api/viz_v1.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-purple-100 to-pink-100">
      {/* Header */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-purple-200/30 sticky top-0 z-50 shadow-lg shadow-purple-500/10">
        <div className="w-full px-4 md:px-8">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3 md:gap-4 py-3 md:py-4">
            {/* 左侧：Logo */}
            <div className="flex items-center space-x-4 flex-shrink-0">
              <img
                src="/LifeX_logo.png"
                alt="LifeX Logo"
                className="h-12 w-auto"
              />
            </div>

            {/* 中间：标题 */}
            <div className="flex-1 min-w-[220px] text-center">
              <h1 className="text-2xl md:text-4xl font-black bg-gradient-to-r from-[#751FAE] to-[#EF3C99] bg-clip-text text-transparent font-montserrat">
                Post Performance Analysis
              </h1>
              <p className="text-xs md:text-base text-purple-600 mt-1 font-montserrat font-light">
                Xiaowang Marketing Insights
              </p>
            </div>

            {/* 右侧：按钮组 */}
            <div className="ml-auto flex items-center gap-3 flex-shrink-0">
              <Button
                onClick={() => (window.location.href = '/information-hub')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Hub
              </Button>
              <Button
                onClick={() => (window.location.href = '/')}
                variant="outline"
                className="flex items-center gap-2"
              >
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content - Tableau Embed */}
      <div className="container mx-auto px-8 py-8">
        <div className="bg-white/95 backdrop-blur-xl rounded-lg shadow-xl shadow-purple-500/10 ring-1 ring-purple-500/20 p-6">
          <div
            className='tableauPlaceholder'
            id='viz1758517488343'
            style={{ position: 'relative' }}
            dangerouslySetInnerHTML={{
              __html: `
                <noscript>
                  <a href='#'>
                    <img alt='Post Performance ' src='https://public.tableau.com/static/images/_1/_17585140079670/PostPerformance/1_rss.png' style='border: none' />
                  </a>
                </noscript>
                <object class='tableauViz' style='display:none;'>
                  <param name='host_url' value='https%3A%2F%2Fpublic.tableau.com%2F' />
                  <param name='embed_code_version' value='3' />
                  <param name='site_root' value='' />
                  <param name='name' value='_17585140079670/PostPerformance' />
                  <param name='tabs' value='no' />
                  <param name='toolbar' value='yes' />
                  <param name='static_image' value='https://public.tableau.com/static/images/_1/_17585140079670/PostPerformance/1.png' />
                  <param name='animate_transition' value='yes' />
                  <param name='display_static_image' value='yes' />
                  <param name='display_spinner' value='yes' />
                  <param name='display_overlay' value='yes' />
                  <param name='display_count' value='yes' />
                  <param name='language' value='en-GB' />
                  <param name='filter' value='publish=yes' />
                </object>
                <script type='text/javascript'>
                  var divElement = document.getElementById('viz1758517488343');
                  var vizElement = divElement.getElementsByTagName('object')[0];
                  if ( divElement.offsetWidth > 800 ) {
                    vizElement.style.width='920px';
                    vizElement.style.height='1227px';
                  } else if ( divElement.offsetWidth > 500 ) {
                    vizElement.style.width='920px';
                    vizElement.style.height='1227px';
                  } else {
                    vizElement.style.width='100%';
                    vizElement.style.height='827px';
                  }
                </script>
              `
            }}
          />
        </div>
      </div>
    </div>
  )
}