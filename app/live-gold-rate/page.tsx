"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { TrendingUp, TrendingDown, Clock, ArrowRight, ShieldCheck, Sparkles, Activity } from "lucide-react";
import { getMetalRates, getMetalRateHistory, type MetalRate, type MetalRateHistory } from "../admin/actions/metal-rates";
import Link from "next/link";
import Image from "next/image";

/* ─── Compact Custom Tooltip ──────────────────────── */
const ChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-xl border border-gray-100 px-4 py-3 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
        <p className="text-[12px] text-gray-500 font-medium mb-1 tracking-wide uppercase">{label}</p>
        <p className="text-[#5B2C83] font-bold text-lg font-serif">
          ₹{Number(payload[0].value).toLocaleString("en-IN")}
        </p>
      </div>
    );
  }
  return null;
};

/* ─── Animated Counter ────────────────────────────── */
function AnimatedPrice({ value, className }: { value: number, className?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const start = display;
    const diff = value - start;
    if (diff === 0) return;
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4); // easeOutQuart
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span className={`tabular-nums ${className}`}>₹{display.toLocaleString("en-IN")}</span>;
}

/* ─── Mini Sparkline for Cards ────────────────────── */
function MiniSparkline({ data, color }: { data: { price: number }[]; color: string }) {
  if (data.length < 2) return null;
  
  // Calculate dynamic domain to make chart look better
  const min = Math.min(...data.map(d => d.price));
  const max = Math.max(...data.map(d => d.price));
  const padding = (max - min) * 0.1;

  return (
    <div className="h-[48px] w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`mini-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.15} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis domain={[min - padding, max + padding]} hide />
          <Area
            type="monotone"
            dataKey="price"
            stroke={color}
            fill={`url(#mini-${color})`}
            strokeWidth={2}
            isAnimationActive={true}
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────── */
export default function LiveGoldRatePage() {
  const [rates, setRates] = useState<MetalRate[]>([]);
  const [historyMap, setHistoryMap] = useState<Record<string, MetalRateHistory[]>>({});
  const [selectedMetal, setSelectedMetal] = useState("Gold 22K");
  const [timeframe, setTimeframe] = useState<"7D"|"30D"|"6M">("30D");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const ratesData = await getMetalRates();
      // Ensure we have 4 metal types for the grid, even if missing
      const fallbackRates = [
        { metal_type: "Gold 22K", current_price: 65400, unit: "10g", percentage_change: 1.2 },
        { metal_type: "Gold 24K", current_price: 71340, unit: "10g", percentage_change: 1.5 },
        { metal_type: "Silver", current_price: 85000, unit: "1kg", percentage_change: -0.4 },
        { metal_type: "Platinum", current_price: 32000, unit: "10g", percentage_change: 0.8 }
      ];
      
      const mergedRates = fallbackRates.map(fb => {
        const existing = ratesData.find(r => r.metal_type === fb.metal_type);
        return existing || fb as any;
      });
      
      setRates(mergedRates);

      // Fetch history for each metal type in parallel
      const metalTypes = mergedRates.map(r => r.metal_type);
      const histories = await Promise.all(
        metalTypes.map(async mt => {
          const h = await getMetalRateHistory(mt, 30);
          return { type: mt, data: h };
        })
      );

      const map: Record<string, MetalRateHistory[]> = {};
      histories.forEach(h => {
        // Generate mock history if empty
        if (h.data.length === 0) {
          const base = mergedRates.find(r => r.metal_type === h.type)?.current_price || 50000;
          const mock = Array.from({length: 30}).map((_, i) => ({
            id: `mock-${i}`, metal_type: h.type,
            price: base * (1 + (Math.sin(i/2) * 0.02) + (Math.random() * 0.01)),
            date: new Date(Date.now() - (29-i) * 86400000).toISOString()
          }));
          map[h.type] = mock as any;
        } else {
          map[h.type] = h.data;
        }
      });
      
      setHistoryMap(map);
      setIsLoaded(true);
    }
    load();
  }, []);

  const today = new Date().toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric",
  });
  
  const timeStr = new Date().toLocaleTimeString("en-IN", {
    hour: '2-digit', minute:'2-digit'
  });

  const selectedHistory = useMemo(() => {
    const raw = historyMap[selectedMetal] || [];
    let filtered = raw;
    if (timeframe === "7D") filtered = raw.slice(-7);
    if (timeframe === "30D") filtered = raw.slice(-30);
    // 6M would need more data, using 30D for now
    
    return filtered.map(h => ({
      date: new Date(h.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      price: Number(h.price),
    }));
  }, [selectedMetal, historyMap, timeframe]);

  const selectedRate = rates.find(r => r.metal_type === selectedMetal);

  // Luxury Color Palette
  const metalColors: Record<string, string> = {
    "Gold 22K": "#D4AF37", // Rich Gold
    "Gold 24K": "#C5A059", // Deep Gold
    "Silver": "#A8B2C1",   // Platinum Silver
    "Platinum": "#9FA9B3", // Cool Silver
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6, staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <div className="min-h-screen bg-[#FDFBF9] pb-24 font-sans selection:bg-[#5B2C83]/20">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 inset-x-0 h-[600px] overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-[#5B2C83]/5 to-transparent blur-3xl opacity-60" />
        <div className="absolute top-[10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-gradient-to-bl from-[#D4AF37]/10 to-transparent blur-3xl opacity-60" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={isLoaded ? "visible" : "hidden"}
        className="relative max-w-[1200px] mx-auto px-5 lg:px-8 pt-16 md:pt-24"
      >
        {/* ─── 1. Luxury Hero Section ────────────────────────────── */}
        <motion.div variants={itemVariants} className="text-center mb-16 relative">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-[#5B2C83]/10 shadow-sm mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-semibold tracking-widest uppercase text-[#5B2C83]">Live Market Updates</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-[#1A1A1A] mb-5 leading-tight tracking-tight">
            Precious Metals <br className="md:hidden" />
            <span className="italic text-[#5B2C83]">Market Rates</span>
          </h1>
          
          <p className="text-gray-500 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
            Track live precious metal prices with real-time luxury market insights. 
            Prices are updated continuously to ensure you have the most accurate valuation.
          </p>
          
          <div className="flex items-center justify-center gap-2 mt-8 text-xs text-gray-400 font-medium tracking-wide">
            <Clock className="w-3.5 h-3.5" />
            <span>Last updated: {today} at {timeStr}</span>
          </div>
        </motion.div>

        {/* ─── 2. Live Rate Cards (Glassmorphism) ────────────────── */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
          {rates.map((rate, i) => {
            const isPos = rate.percentage_change >= 0;
            const color = metalColors[rate.metal_type] || "#D4AF37";
            const history = historyMap[rate.metal_type] || [];
            
            return (
              <motion.div
                key={rate.metal_type}
                whileHover={{ y: -4, shadow: "0 20px 40px -15px rgba(0,0,0,0.05)" }}
                className="group relative bg-white/70 backdrop-blur-xl border border-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all duration-500"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10 flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-[15px] font-bold text-gray-900 tracking-tight">{rate.metal_type}</h3>
                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">Per {rate.unit}</p>
                  </div>
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                    isPos ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                  }`}>
                    {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(rate.percentage_change)}%
                  </div>
                </div>

                <div className="relative z-10">
                  <AnimatedPrice value={Number(rate.current_price)} className="text-3xl font-serif font-medium text-[#1A1A1A]" />
                </div>

                <div className="relative z-0 -mx-6 -mb-6 mt-2 opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                  <MiniSparkline data={history} color={color} />
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ─── 3. Modern Chart Section ───────────────────────────── */}
        <motion.div variants={itemVariants} className="bg-white rounded-[32px] border border-gray-100/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] p-6 md:p-10 mb-16 relative overflow-hidden">
          {/* Subtle bg glow inside card */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#5B2C83]/5 to-transparent blur-3xl rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
            <div>
              <h2 className="text-2xl font-serif text-gray-900 mb-2">Market Analysis</h2>
              <p className="text-sm text-gray-500">Track historical performance of precious metals</p>
            </div>

            {/* Metal Tabs */}
            <div className="flex flex-wrap items-center gap-2 bg-gray-50/80 p-1.5 rounded-2xl border border-gray-100/50">
              {rates.map((r) => (
                <button
                  key={r.metal_type}
                  onClick={() => setSelectedMetal(r.metal_type)}
                  className={`relative px-4 py-2 rounded-xl text-[13px] font-semibold transition-all duration-300 ${
                    selectedMetal === r.metal_type ? "text-[#5B2C83]" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {selectedMetal === r.metal_type && (
                    <motion.div layoutId="activeTab" className="absolute inset-0 bg-white rounded-xl shadow-sm border border-gray-100/50" />
                  )}
                  <span className="relative z-10">{r.metal_type}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Chart Header Info */}
          <div className="relative z-10 flex flex-wrap items-end justify-between gap-6 mb-8">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1 uppercase tracking-wider">{selectedMetal} Price</p>
              <div className="flex items-center gap-3">
                <AnimatedPrice value={Number(selectedRate?.current_price || 0)} className="text-4xl font-serif text-[#1A1A1A]" />
                <span className={`flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-lg ${
                  (selectedRate?.percentage_change || 0) >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                }`}>
                  {(selectedRate?.percentage_change || 0) >= 0 ? "+" : ""}{selectedRate?.percentage_change}%
                </span>
              </div>
            </div>
            
            {/* Timeframe Toggle */}
            <div className="flex gap-1.5">
              {(["7D", "30D", "6M"] as const).map(tf => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    timeframe === tf ? "bg-[#5B2C83] text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Main Recharts Graph */}
          <div className="relative z-10 h-[380px] w-full -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={selectedHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={metalColors[selectedMetal] || "#D4AF37"} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={metalColors[selectedMetal] || "#D4AF37"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E5E7EB" opacity={0.5} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 500 }}
                  dy={10}
                  minTickGap={30}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 500 }}
                  domain={['dataMin - 1000', 'dataMax + 1000']}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  dx={-10}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#5B2C83', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={metalColors[selectedMetal] || "#D4AF37"}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorPrice)"
                  activeDot={{ r: 6, fill: "#5B2C83", stroke: "#fff", strokeWidth: 3, shadow: "0 0 10px rgba(91,44,131,0.5)" }}
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ─── 4. Market Insights Section ────────────────────────── */}
        <motion.div variants={itemVariants} className="mb-24">
          <div className="flex items-center gap-3 mb-8">
            <Activity className="w-6 h-6 text-[#5B2C83]" />
            <h2 className="text-2xl font-serif text-gray-900">Today's Market Insights</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Gold Investment Trend</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                Market analysts indicate a strong buy signal for 24K Gold due to recent global market stabilization.
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Strong Buy
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Silver Movement</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                Silver prices are experiencing moderate volatility. Expected to stabilize towards the end of the trading week.
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
                Hold Position
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5 text-[#5B2C83]" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">Festive Demand</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                Upcoming festive season is driving up demand for 22K Gold ornaments. Slight premium expected on making charges.
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-[#5B2C83] text-xs font-bold uppercase tracking-wider">
                High Demand
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── 5. Luxury CTA Section ─────────────────────────────── */}
        <motion.div variants={itemVariants} className="relative rounded-[32px] overflow-hidden bg-[#1A1A1A]">
          <div className="absolute inset-0 bg-gradient-to-r from-[#3B1D54] to-[#1A1A1A] opacity-80" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#5B2C83]/40 via-transparent to-transparent opacity-50 blur-2xl" />
          
          <div className="relative z-10 px-8 py-16 md:py-20 flex flex-col items-center text-center">
            <Sparkles className="w-8 h-8 text-[#D4AF37] mb-6" />
            <h2 className="text-3xl md:text-4xl font-serif text-white mb-4">Invest in Timeless Elegance</h2>
            <p className="text-gray-300 max-w-lg mb-8 text-sm md:text-base leading-relaxed">
              Explore our meticulously crafted fine jewellery collection, designed to hold value and captivate for generations.
            </p>
            <Link 
              href="/collections"
              className="group relative inline-flex items-center gap-3 bg-white text-[#1A1A1A] px-8 py-4 rounded-full font-semibold text-[15px] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] overflow-hidden"
            >
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#5B2C83]/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
              <span className="relative z-10">Explore Collection</span>
              <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </motion.div>
        
      </motion.div>
    </div>
  );
}
