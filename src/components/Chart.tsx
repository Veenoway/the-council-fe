"use client";

// ============================================================
// TRADINGVIEW CHART — With bot trade markers
// ============================================================

import { useEffect, useRef, useState, useCallback } from "react";
import { Token } from "@/types";
import { createNadFunDatafeed } from "@/lib/datafeed";
import { useTokenTrades, TokenTrade } from "@/hooks/useTokenTrade";

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

const DEFAULT_TOKEN: Token = {
  address: "0x0000000000000000000000000000000000000000",
  symbol: "MON",
  name: "Monad",
  price: 1,
  priceChange24h: 0,
  mcap: 0,
  liquidity: 0,
  holders: 0,
  deployer: "",
  createdAt: new Date(),
};

export function Chart({ token, className = "" }: ChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);
  const [isChartReady, setIsChartReady] = useState(false);
  const [currentSymbol, setCurrentSymbol] = useState<string | null>(null);
  const initializingRef = useRef(false);
  const markersAddedRef = useRef<Set<string>>(new Set());

  const activeToken = token || DEFAULT_TOKEN;
  const { trades } = useTokenTrades(token?.address);

  // --------------------------------------------------------
  // PRELOAD TRADINGVIEW LIBRARY ON MOUNT
  // --------------------------------------------------------
  useEffect(() => {
    if (window.TradingView) {
      setIsLibraryLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "/static/charting_library/charting_library.js";
    script.async = true;

    script.onload = () => {
      console.log("📈 TradingView library loaded");
      setIsLibraryLoaded(true);
    };

    script.onerror = () => {
      console.error("Failed to load TradingView library");
    };

    document.head.appendChild(script);
  }, []);

  // --------------------------------------------------------
  // INITIALIZE CHART
  // --------------------------------------------------------
  const initChart = useCallback(
    (tokenToShow: Token) => {
      if (!isLibraryLoaded || !containerRef.current || !window.TradingView)
        return;
      if (initializingRef.current) return;

      initializingRef.current = true;
      markersAddedRef.current.clear();
      console.log(`📈 Initializing chart for ${tokenToShow.symbol}`);

      try {
        if (widgetRef.current) {
          try {
            widgetRef.current.remove();
          } catch (e) {}
          widgetRef.current = null;
        }

        const datafeed = createNadFunDatafeed(tokenToShow);

        const DISABLED_FEATURES = [
          "header_compare",
          "header_symbol_search",
          "symbol_info",
          "volume_force_overlay",
          "symbol_search_hot_key",
          "display_market_status",
          "compare_symbol",
          "show_interval_dialog_on_key_press",
          "header_widget",
          "header_settings",
          "header_undo_redo",
          "header_screenshot",
          "header_saveload",
          "use_localstorage_for_settings",
          "control_bar",
          "timeframes_toolbar",
          "edit_buttons_in_legend",
          "context_menus",
          "border_around_the_chart",
          "main_series_scale_menu",
          "study_dialog_search_control",
          "create_volume_indicator_by_default",
          "left_bar_time_scale",
        ];

        widgetRef.current = new window.TradingView.widget({
          symbol: tokenToShow.symbol,
          datafeed,
          container: containerRef.current,
          library_path: "/static/charting_library/",
          locale: "en",
          fullscreen: false,
          autosize: true,
          theme: "Dark",
          volume_precision: 2,
          api_version: "2",
          custom_css_url: "/static/chart.css",
          loading_screen: {
            backgroundColor: "#0a0a0a",
            foregroundColor: "#22c55e",
          },
          overrides: {
            "paneProperties.background": "#0a0a0a",
            "paneProperties.backgroundType": "solid",
            "paneProperties.vertGridProperties.color": "#1a1a1a",
            "paneProperties.horzGridProperties.color": "#1a1a1a",
            "scalesProperties.backgroundColor": "#0a0a0a",
            "scalesProperties.textColor": "#666",
            "mainSeriesProperties.candleStyle.upColor": "#22c55e",
            "mainSeriesProperties.candleStyle.downColor": "#ef4444",
            "mainSeriesProperties.candleStyle.wickUpColor": "#22c55e",
            "mainSeriesProperties.candleStyle.wickDownColor": "#ef4444",
            "mainSeriesProperties.candleStyle.borderUpColor": "#22c55e",
            "mainSeriesProperties.candleStyle.borderDownColor": "#ef4444",
            volumePaneSize: "medium",
            toolbar_bg: "#0a0a0a",
            "paneProperties.legendProperties.showText": false,
          },
          studies_overrides: {
            "volume.volume.color.0": "#ef4444",
            "volume.volume.color.1": "#22c55e",
            "volume.volume.transparency": 70,
          },
          disabled_features: DISABLED_FEATURES,
          enabled_features: ["show_spread_operators", "header_resolutions"],
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          interval: "15",
          toolbar_bg: "#0a0a0a",
          charts_storage_api_version: "1.1",
          client_id: "council",
          user_id: "public",
        });

        widgetRef.current.onChartReady(() => {
          console.log(`📈 Chart ready for ${tokenToShow.symbol}`);
          setIsChartReady(true);
          setCurrentSymbol(tokenToShow.symbol);
          initializingRef.current = false;
          window.tvWidget = widgetRef.current;

          const chart = widgetRef.current.activeChart();
          chart.getTimeScale().setRightOffset(10);
        });
      } catch (err) {
        console.error("Chart init error:", err);
        initializingRef.current = false;
      }
    },
    [isLibraryLoaded],
  );

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
    setIsChartReady(false);
    markersAddedRef.current.clear();
    initChart(token);
  }, [token?.address, isChartReady, currentSymbol, initChart]);

  // --------------------------------------------------------
  // ADD TRADE MARKERS TO CHART
  // --------------------------------------------------------
  useEffect(() => {
    if (!isChartReady || !widgetRef.current || !trades.length) return;

    try {
      const chart = widgetRef.current.activeChart();

      const newTrades = trades.filter(
        (t) => !markersAddedRef.current.has(t.id),
      );
      if (newTrades.length === 0) return;

      for (const t of newTrades) markersAddedRef.current.add(t.id);

      // Group trades by 15min candle
      const CANDLE_SIZE = 900;
      const grouped = new Map<number, TokenTrade[]>();

      for (const trade of trades) {
        const candleTime =
          Math.floor(trade.timestamp / CANDLE_SIZE) * CANDLE_SIZE;
        if (!grouped.has(candleTime)) grouped.set(candleTime, []);
        grouped.get(candleTime)!.push(trade);
      }

      for (const [candleTime, groupTrades] of grouped) {
        const details = groupTrades
          .map((t) => `${t.botName} ${Math.round(t.valueMon * 100) / 100}Ξ`)
          .join("\n");

        try {
          chart.createShape(
            { time: candleTime },
            {
              shape: "icon",
              icon: 0xf062,
              text: details,
              overrides: {
                color: "#F7F7F7",
                size: 12,
              },
              zOrder: "top",
              lock: true,
              disableSelection: true,
              disableSave: true,
              disableUndo: true,
            },
          );
        } catch {}
      }

      console.log(
        `📍 Created ${grouped.size} dot markers (${trades.length} trades)`,
      );
    } catch (err) {
      console.error("❌ Error adding markers:", err);
    }
  }, [trades, isChartReady]);

  return (
    <div
      className={`relative bg-[#0a0a0a] rounded-lg overflow-hidden ${className}`}
      style={{ height: "calc(100vh - 530px)" }}
    >
      {!isChartReady && (
        <div className="absolute inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center z-10 w-full h-full">
          <div className="animate-spin w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-2" />
          <div className="text-zinc-500 text-sm">
            Fetching a new token to analyze...
          </div>
        </div>
      )}

      {isChartReady && !token && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10">
          <div className="text-center">
            <div className="text-zinc-400">
              Waiting for a new token to analyze...
            </div>
          </div>
        </div>
      )}

      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

export default Chart;
