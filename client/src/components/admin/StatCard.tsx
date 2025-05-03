import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface StatCardProps {
  className?: string;
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  trend: number;
  trendText?: string;
  chartData?: { name: string; value: number }[];
  chartColor: string;
  type?: 'currency' | 'number' | 'percentage';
}

export function StatCard({ 
  className,
  title,
  value,
  icon,
  iconBg,
  trend,
  trendText,
  chartData = [],
  chartColor,
  type = 'number'
}: StatCardProps) {
  // Format value based on type
  const formattedValue = React.useMemo(() => {
    if (typeof value === 'string') return value;
    
    if (type === 'currency') {
      return `$${value.toLocaleString('en-US', { maximumFractionDigits: 1 })}`;
    } else if (type === 'percentage') {
      return `${value}%`;
    } else {
      return value.toLocaleString('en-US', { 
        notation: value > 10000 ? 'compact' : 'standard',
        maximumFractionDigits: 1
      });
    }
  }, [value, type]);

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 border-0 hover:shadow-xl rounded-xl bg-transparent animate-fadeIn backdrop-blur-lg group",
      className
    )}>
      {/* Glossy gradient background with animated gradient */}
      <div className="absolute inset-0 w-full h-full opacity-90 pointer-events-none bg-gradient-to-br from-slate-950/80 to-slate-900/60">
        <div 
          className="absolute inset-0 bg-gradient-to-br opacity-30 transition-opacity duration-500 group-hover:opacity-60" 
          style={{ 
            backgroundImage: `linear-gradient(to bottom right, ${chartColor}40, ${chartColor}10)` 
          }}
        ></div>
        
        {/* Glow effect */}
        <div 
          className="absolute -top-24 -right-24 w-56 h-56 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-all duration-700"
          style={{ backgroundColor: chartColor }}
        ></div>
      </div>
      
      {/* Glass border effect */}
      <div className="absolute inset-0 rounded-xl border border-slate-700/30 bg-gradient-to-br from-slate-700/10 to-slate-700/5"></div>
      
      <CardContent className="p-6 relative z-10">
        <div className="flex justify-between items-center mb-4 relative z-10">
          <h3 className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors duration-200">{title}</h3>
          <div className={`${iconBg} p-2.5 rounded-lg shadow-lg border border-slate-700/50 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
            <div className="relative z-10 transition-all duration-300 group-hover:text-white">{icon}</div>
          </div>
        </div>
        
        <div className="flex items-end gap-2.5 mb-2 relative z-10">
          <span className="text-3xl font-bold tracking-tight text-white transition-all duration-300 group-hover:text-shadow group-hover:scale-105 origin-left">
            {formattedValue}
          </span>
          <div className={cn(
            "px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-all duration-300",
            trend > 0 
              ? "bg-emerald-900/30 text-emerald-300 border border-emerald-700/40 group-hover:bg-emerald-800/40 group-hover:border-emerald-600/50" 
              : "bg-rose-900/30 text-rose-300 border border-rose-700/40 group-hover:bg-rose-800/40 group-hover:border-rose-600/50"
          )}>
            {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend)}%
          </div>
        </div>
        
        <p className="text-xs text-slate-400 mb-4 relative z-10 transition-colors duration-300 group-hover:text-slate-300">
          {trendText || `${trend > 0 ? 'Increased' : 'Decreased'} from last month`}
        </p>

        {/* Chart visualization with animation */}
        {chartData.length > 0 && (
          <div className="h-16 mt-auto -mx-1 -mb-1 transition-all duration-500 group-hover:h-20">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id={`gradient-${title.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.5} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone"
                  dataKey="value"
                  stroke={chartColor}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#gradient-${title.replace(/\s+/g, '-')})`}
                  animationDuration={2000}
                  animationEasing="ease-in-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default StatCard;
