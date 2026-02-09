// ============================================================
// NAD.FUN DATAFEED — TradingView datafeed for nad.fun tokens
// ============================================================

import { Token } from '@/types';

const API_BASE = 'https://api.nadapp.net';
const WS_URL = 'wss://wss.nadapp.net/wss';

export const supportedResolutions = [
  '1', '5', '15', '30', '60', '240', '1D', '1W',
];

// Convert resolution to milliseconds
function getResolutionMs(resolution: string): number {
  // Map TradingView-style resolutions to minutes
  const resolutionToMinutes: Record<string, number> = {
    '1': 1,
    '5': 5,
    '15': 15,
    '30': 30,
    '60': 60,
    '240': 240,
    '1D': 1440,
    '1W': 10080,
  };
  const minutes = resolutionToMinutes[resolution] || 15;
  return minutes * 60 * 1000;
}

interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const lastBarsCache = new Map<string, Bar>();
const subscribers = new Map<string, WebSocket>();

// ============================================================
// DATAFEED FACTORY
// ============================================================

export const createNadFunDatafeed = (token: Token) => {
  let ws: WebSocket | null = null;
  let realtimeCallback: ((bar: Bar) => void) | null = null;

  return {
    // --------------------------------------------------------
    // REQUIRED: onReady
    // --------------------------------------------------------
    onReady: (callback: (config: any) => void) => {
      setTimeout(() => {
        callback({
          supported_resolutions: supportedResolutions,
          supports_time: true,
          supports_marks: false,
          supports_timescale_marks: false,
        });
      }, 0);
    },

    // --------------------------------------------------------
    // REQUIRED: resolveSymbol
    // --------------------------------------------------------
    resolveSymbol: (
      symbolName: string,
      onResolve: (symbolInfo: any) => void,
      onError: (error: string) => void
    ) => {
      setTimeout(() => {
        const price = token.price || 0.000000001;
        
        // Calculate pricescale for very small memecoin prices
        // We need enough precision to show price movements
      
        const symbolInfo = {
         name: (token?.symbol),
        description: "",
        type: "crypto",
        session: "24x7",
        ticker: token?.symbol,
        minmov: 1,
        pricescale: Math.min(
          10 ** String(Math.round(10000 / price)).length,
          10000000000000000
        ),
        has_intraday: true,
        intraday_multipliers: ["1", "5", "15", "30", "60"],
        supported_resolution: supportedResolutions,
        volume_precision: 2,
        data_status: "streaming",
        };

        onResolve(symbolInfo);
      }, 0);
    },

    // --------------------------------------------------------
    // REQUIRED: getBars
    // --------------------------------------------------------
    getBars: async (
      symbolInfo: any,
      resolution: string,
      periodParams: { from: number; to: number; firstDataRequest: boolean; countBack?: number },
      onResult: (bars: Bar[], meta: { noData: boolean }) => void,
      onError: (error: string) => void
    ) => {
      const { from, to, firstDataRequest, countBack = 300 } = periodParams;

      try {
        const url = `${API_BASE}/trade/chart/${token.address}?resolution=${resolution}&from=${from}&to=${to}&countback=${countBack}&chart_type=price_usd`;
        
        console.log(`📊 Fetching bars: ${url}`);
        const response = await fetch(url);
        
        if (!response.ok) {
          console.error(`Chart API error: ${response.status}`);
          onResult([], { noData: true });
          return;
        }
        
        const data = await response.json();

        if (data && data.t && data.t.length > 0) {
          const bars: Bar[] = [];
          
          for (let i = 0; i < data.t.length; i++) {
            // Parse values carefully - handle scientific notation
            const open = parseFloat(data.o[i]) || 0;
            const high = parseFloat(data.h[i]) || 0;
            const low = parseFloat(data.l[i]) || 0;
            const close = parseFloat(data.c[i]) || 0;
            const volume = parseFloat(data.v?.[i]) || 0;
            const time = (data.t[i] * 1000);
            
            // Skip invalid bars
            if (open <= 0 || high <= 0 || low <= 0 || close <= 0) continue;
            if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) continue;
            
            bars.push({ time, open, high, low, close, volume });
          }

          // Sort by time
          bars.sort((a, b) => a.time - b.time);

          if (bars.length === 0) {
            console.log('📊 No valid bars after filtering');
            onResult([], { noData: true });
            return;
          }

          if (firstDataRequest && bars.length > 0) {
            lastBarsCache.set(token.address, bars[bars.length - 1]);
            console.log(`📊 Cached last bar for ${token.symbol}: $${bars[bars.length - 1].close}`);
          }

          console.log(`📊 Returning ${bars.length} bars for ${token.symbol}`);
          onResult(bars, { noData: false });
        } else {
          console.log('📊 No data from API');
          onResult([], { noData: true });
        }
      } catch (error) {
        console.error('Error fetching bars:', error);
        onResult([], { noData: true });
      }
    },

    // --------------------------------------------------------
    // REQUIRED: subscribeBars - Real-time updates
    // --------------------------------------------------------
    subscribeBars: (
      symbolInfo: any,
      resolution: string,
      onRealtimeCallback: (bar: Bar) => void,
      subscriberUID: string,
      onResetCacheNeededCallback: () => void
    ) => {
      console.log(`📈 Subscribing to real-time bars for ${token.symbol}`);
      
      // Connect to nad.fun WebSocket
      try {
        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
          console.log('📈 Chart WebSocket connected');
          
          // Subscribe to token trades/price updates
          ws.send(JSON.stringify({
            type: 'subscribe',
            channel: 'trades',
            token: token.address,
          }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Handle different message types from nad.fun
            if (data.type === 'trade' || data.type === 'price_update' || data.type === 'chart') {
              const lastBar = lastBarsCache.get(token.address);
              
              if (lastBar) {
                const tradePrice = parseFloat(data.price || data.close || 0);
                const tradeTime = (data.timestamp || data.time || Date.now() / 1000) * 1000;
                const volume = parseFloat(data.volume || data.amount || 0);
                
                if (tradePrice <= 0) return;

                // Check if we need a new bar or update existing
                const resolutionMs = getResolutionMs(resolution);
                const barStartTime = Math.floor(tradeTime / resolutionMs) * resolutionMs;

                let bar: Bar;

                if (barStartTime > lastBar.time) {
                  // New bar
                  bar = {
                    time: barStartTime,
                    open: tradePrice,
                    high: tradePrice,
                    low: tradePrice,
                    close: tradePrice,
                    volume: volume,
                  };
                } else {
                  // Update existing bar
                  bar = {
                    ...lastBar,
                    high: Math.max(lastBar.high, tradePrice),
                    low: Math.min(lastBar.low, tradePrice),
                    close: tradePrice,
                    volume: lastBar.volume + volume,
                  };
                }

                lastBarsCache.set(token.address, bar);
                onRealtimeCallback(bar);
              }
            }
          } catch (e) {
            // Ignore parse errors
          }
        };

        ws.onerror = (error) => {
          console.error('Chart WebSocket error:', error);
        };

        ws.onclose = () => {
          console.log('📈 Chart WebSocket closed');
        };

        subscribers.set(subscriberUID, ws);
      } catch (error) {
        console.error('Error connecting to chart WebSocket:', error);
      }
      
      // Also poll for updates as fallback (every 10 seconds)
      const pollInterval = setInterval(async () => {
        try {
          const now = Math.floor(Date.now() / 1000);
          const from = now - 120; // Last 2 minutes
          
          const url = `${API_BASE}/trade/chart/${token.address}?resolution=${resolution}&from=${from}&to=${now}&countback=5&chart_type=price_usd`;
          const response = await fetch(url);
          
          if (!response.ok) return;
          
          const data = await response.json();
          
          if (data && data.t && data.t.length > 0) {
            const lastIdx = data.t.length - 1;
            const bar: Bar = {
              time: data.t[lastIdx] * 1000,
              open: parseFloat(data.o[lastIdx]),
              high: parseFloat(data.h[lastIdx]),
              low: parseFloat(data.l[lastIdx]),
              close: parseFloat(data.c[lastIdx]),
              volume: parseFloat(data.v?.[lastIdx] || 0),
            };
            
            const lastBar = lastBarsCache.get(token.address);
            
            // Only update if price changed
            if (!lastBar || bar.close !== lastBar.close || bar.time > lastBar.time) {
              lastBarsCache.set(token.address, bar);
              onRealtimeCallback(bar);
            }
          }
        } catch (e) {
          // Ignore polling errors
        }
      }, 10000);

      // Store interval for cleanup
      (subscribers as any)[`${subscriberUID}_poll`] = pollInterval;
    },

    // --------------------------------------------------------
    // REQUIRED: unsubscribeBars
    // --------------------------------------------------------
    unsubscribeBars: (subscriberUID: string) => {
      // Close WebSocket
      const existingWs = subscribers.get(subscriberUID);
      if (existingWs) {
        existingWs.close();
        subscribers.delete(subscriberUID);
      }
      
      // Clear polling interval
      const pollInterval = (subscribers as any)[`${subscriberUID}_poll`];
      if (pollInterval) {
        clearInterval(pollInterval);
        delete (subscribers as any)[`${subscriberUID}_poll`];
      }
      
      console.log(`📈 Unsubscribed from ${subscriberUID}`);
    },

    // --------------------------------------------------------
    // OPTIONAL: searchSymbols (not needed for single token)
    // --------------------------------------------------------
    searchSymbols: (
      userInput: string,
      exchange: string,
      symbolType: string,
      onResult: (symbols: any[]) => void
    ) => {
      onResult([]);
    },
  };
};

export default createNadFunDatafeed;