'use client';

// ============================================================
// TRADINGVIEW CHART — Always visible, preloaded
// ============================================================

import { useEffect, useRef, useState, useCallback } from 'react';
import { Token } from '@/types';
import { createNadFunDatafeed } from '@/lib/datafeed';

interface ChartProps {
  token: Token | null;
  className?: string;
}

declare global {
  interface Window {
    TradingView: any;
    tvWidget: any;
  }
}

// Default token to show when nothing is selected
const DEFAULT_TOKEN: Token = {
  address: '0x0000000000000000000000000000000000000000',
  symbol: 'MON',
  name: 'Monad',
  price: 1,
  priceChange24h: 0,
  mcap: 0,
  liquidity: 0,
  holders: 0,
  deployer: '',
  createdAt: new Date(),
};

export function Chart({ token, className = '' }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);
  const [isChartReady, setIsChartReady] = useState(false);
  const [currentSymbol, setCurrentSymbol] = useState<string | null>(null);
  const initializingRef = useRef(false);

  // Use provided token or default
  const activeToken = token || DEFAULT_TOKEN;

  // --------------------------------------------------------
  // PRELOAD TRADINGVIEW LIBRARY ON MOUNT
  // --------------------------------------------------------
  useEffect(() => {
    if (window.TradingView) {
      setIsLibraryLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = '/static/charting_library/charting_library.js';
    script.async = true;
    
    script.onload = () => {
      console.log('📈 TradingView library loaded');
      setIsLibraryLoaded(true);
    };

    script.onerror = () => {
      console.error('Failed to load TradingView library');
    };

    document.head.appendChild(script);

    return () => {
      // Don't remove script on unmount - keep it cached
    };
  }, []);

  // --------------------------------------------------------
  // INITIALIZE CHART ONCE LIBRARY IS LOADED
  // --------------------------------------------------------
  const initChart = useCallback((tokenToShow: Token) => {
    if (!isLibraryLoaded || !containerRef.current || !window.TradingView) return;
    if (initializingRef.current) return;
    
    initializingRef.current = true;
    console.log(`📈 Initializing chart for ${tokenToShow.symbol}`);

    try {
      // Remove existing widget
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
        } catch (e) {}
        widgetRef.current = null;
      }

      const datafeed = createNadFunDatafeed(tokenToShow);

      widgetRef.current = new window.TradingView.widget({
        symbol: tokenToShow.symbol,
        datafeed,
        container: containerRef.current,
        library_path: '/static/charting_library/',
        locale: 'en',
        fullscreen: false,
        autosize: true,
        theme: 'Dark',
        
        // Styling
        custom_css_url: '/static/chart.css',
        loading_screen: {
          backgroundColor: '#0a0a0a',
          foregroundColor: '#22c55e',
        },
        overrides: {
          'paneProperties.background': '#0a0a0a',
          'paneProperties.backgroundType': 'solid',
          'paneProperties.vertGridProperties.color': '#1a1a1a',
          'paneProperties.horzGridProperties.color': '#1a1a1a',
          'scalesProperties.backgroundColor': '#0a0a0a',
          'scalesProperties.textColor': '#666',
          'mainSeriesProperties.candleStyle.upColor': '#22c55e',
          'mainSeriesProperties.candleStyle.downColor': '#ef4444',
          'mainSeriesProperties.candleStyle.wickUpColor': '#22c55e',
          'mainSeriesProperties.candleStyle.wickDownColor': '#ef4444',
          'mainSeriesProperties.candleStyle.borderUpColor': '#22c55e',
          'mainSeriesProperties.candleStyle.borderDownColor': '#ef4444',
          'volumePaneSize': 'medium',
        },
        studies_overrides: {
          'volume.volume.color.0': '#ef4444',
          'volume.volume.color.1': '#22c55e',
          'volume.volume.transparency': 70,
        },

        // Disable unnecessary features for speed
        disabled_features: [
          'header_symbol_search',
          'header_compare',
          'header_undo_redo',
          'header_screenshot',
          'header_saveload',
          'use_localstorage_for_settings',
          'volume_force_overlay',
          'left_toolbar',
          'control_bar',
          'timeframes_toolbar',
          'edit_buttons_in_legend',
          'context_menus',
          'border_around_the_chart',
          'main_series_scale_menu',
          'symbol_search_hot_key',
          'study_dialog_search_control',
          'display_market_status',
        ],
        enabled_features: [
          'hide_left_toolbar_by_default',
          'move_logo_to_main_pane',
        ],

        // Time
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        interval: '15',
        toolbar_bg: '#0a0a0a',
        
        // Faster loading
        charts_storage_api_version: '1.1',
        client_id: 'council',
        user_id: 'public',
      });

      widgetRef.current.onChartReady(() => {
        console.log(`📈 Chart ready for ${tokenToShow.symbol}`);
        setIsChartReady(true);
        setCurrentSymbol(tokenToShow.symbol);
        initializingRef.current = false;
        
        // Store globally for reuse
        window.tvWidget = widgetRef.current;

        const chart = widgetRef.current.activeChart();
        chart.getTimeScale().setRightOffset(10);
      });

    } catch (err) {
      console.error('Chart init error:', err);
      initializingRef.current = false;
    }
  }, [isLibraryLoaded]);

  // --------------------------------------------------------
  // INIT CHART ON LIBRARY LOAD
  // --------------------------------------------------------
  useEffect(() => {
    if (isLibraryLoaded && !widgetRef.current) {
      initChart(activeToken);
    }
  }, [isLibraryLoaded, initChart, activeToken]);

  // --------------------------------------------------------
  // SWITCH SYMBOL WHEN TOKEN CHANGES
  // --------------------------------------------------------
  useEffect(() => {
    if (!token || !widgetRef.current || !isChartReady) return;
    if (currentSymbol === token.symbol) return;

    console.log(`📈 Switching chart to ${token.symbol}`);
    
    // Reinitialize with new token (TradingView doesn't support dynamic datafeed swap easily)
    initChart(token);
    
  }, [token?.address, isChartReady, currentSymbol, initChart]);

  return (
    <div className={`relative bg-[#0a0a0a] rounded-lg overflow-hidden ${className}`}>
      {/* Loading overlay - only show before first chart */}
      {!isChartReady && (
        <div className="absolute inset-0 bg-[#0a0a0a] flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-2" />
            <div className="text-zinc-500 text-sm">
              {isLibraryLoaded ? 'Initializing chart...' : 'Loading TradingView...'}
            </div>
          </div>
        </div>
      )}

      {/* Token indicator overlay */}
      {isChartReady && token && (
        <div className="absolute top-2 left-2 z-20 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs">
          <span className="text-green-400 font-bold">${token.symbol}</span>
          <span className="text-zinc-500 ml-2">{token.name}</span>
        </div>
      )}

      {/* Waiting overlay when no token */}
      {isChartReady && !token && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10">
          <div className="text-center">
            <div className="text-4xl mb-2">🔍</div>
            <div className="text-zinc-400">Waiting for next token...</div>
          </div>
        </div>
      )}

      {/* Chart container - always rendered */}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

export default Chart;