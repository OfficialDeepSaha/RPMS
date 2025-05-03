import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface FuturisticStatCardProps {
  className?: string;
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  secondaryColor?: string;
  trend?: number;
  trendText?: string;
  chartData?: { name: string; value: number }[];
}

// Generate a unique ID for the gradient
const getGradientId = (title: string) => `gradient-${title.replace(/\s+/g, '-')}`;

export function FuturisticStatCard({ 
  className,
  title,
  value,
  icon,
  color,
  secondaryColor,
  trend = 0,
  trendText,
  chartData = []
}: FuturisticStatCardProps) {
  // Format value based on type
  const formattedValue = React.useMemo(() => {
    if (typeof value === 'string') return value;
    return value.toLocaleString('en-US', { 
      notation: value > 10000 ? 'compact' : 'standard',
      maximumFractionDigits: 0
    });
  }, [value]);

  const gradientId = getGradientId(title);

  return (
    <Card className={cn(
      "relative overflow-hidden border-0 shadow-xl transition-all duration-300 hover:translate-y-[-5px] group animate-fadeIn h-[180px] sm:h-[200px] md:h-[180px] w-full",
      className
    )}>
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-md"></div>
      
      {/* Glowing border effect */}
      <div 
        className="absolute inset-0 border rounded-lg opacity-50 group-hover:opacity-70 transition-opacity duration-300"
        style={{ borderColor: `${color}30` }}
      ></div>
      
      {/* Glow effect */}
      <div 
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[80px] opacity-20 group-hover:opacity-30 transition-all duration-500"
        style={{ backgroundColor: color }}
      ></div>
      
      {/* Card content with animations */}
      <CardContent className="p-5 relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors duration-200 truncate max-w-[70%]">{title}</h3>
          
          {/* Animated icon background */}
          <div 
            className="p-2.5 rounded-lg shadow-lg border transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shrink-0"
            style={{ 
              backgroundColor: `${color}20`,
              borderColor: `${color}30`
            }}
          >
            <div className="relative z-10 transition-colors duration-300 group-hover:text-white" style={{ color }}>
              {icon}
            </div>
          </div>
        </div>
        
        {/* Value with animated scale */}
        <div className="flex items-end gap-2 mb-2 relative z-10">
          <span 
            className="text-3xl font-bold tracking-tight text-white transition-all duration-300 group-hover:scale-105 origin-left"
            style={{ textShadow: `0 0 20px ${color}40` }}
          >
            {formattedValue}
          </span>
          
          {/* Trend indicator */}
          {trend !== 0 && (
            <div className={cn(
              "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-all duration-300 shrink-0",
              trend > 0 
                ? "bg-emerald-900/30 text-emerald-300 border border-emerald-700/40 group-hover:bg-emerald-800/40" 
                : "bg-rose-900/30 text-rose-300 border border-rose-700/40 group-hover:bg-rose-800/40"
            )}>
              {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        
        {trendText && (
          <p className="text-xs text-slate-400 mb-auto relative z-10 transition-colors duration-300 group-hover:text-slate-300 line-clamp-1 h-4 overflow-hidden">
            {trendText}
          </p>
        )}
        
        {/* Animated chart */}
        <div className="h-16 mt-auto -mx-1 -mb-1 transition-all duration-500 opacity-75 group-hover:opacity-100 group-hover:h-20">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.5} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area 
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
                animationDuration={2000}
                animationEasing="ease-in-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default FuturisticStatCard; 