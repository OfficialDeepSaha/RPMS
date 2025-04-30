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
      "relative overflow-hidden border-[1.5px] transition-all duration-300 hover:shadow-xl rounded-xl border-slate-800/60 bg-slate-900/90 backdrop-blur-sm",
      className
    )}>
      {/* Subtle gradient background */}
      <div className="absolute inset-0 w-full h-full opacity-30 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br to-transparent" 
             style={{ 
               backgroundImage: `linear-gradient(to bottom right, ${chartColor}20, transparent)` 
             }}></div>
      </div>
      
      <CardContent className="p-6 relative z-10">
        <div className="flex justify-between items-center mb-4 relative z-10">
          <h3 className="text-sm font-medium text-slate-400">{title}</h3>
          <div className={`${iconBg} p-2.5 rounded-lg shadow-md border border-slate-700/50`}>
            <div className="relative z-10">{icon}</div>
          </div>
        </div>
        
        <div className="flex items-end gap-2.5 mb-2 relative z-10">
          <span className="text-2xl font-bold tracking-tight text-white">
            {formattedValue}
          </span>
          <div className={cn(
            "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1",
            trend > 0 ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/20" : 
                        "bg-rose-950/60 text-rose-400 border border-rose-800/20"
          )}>
            {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend)}%
          </div>
        </div>
        
        <p className="text-xs text-slate-500 mb-4 relative z-10">
          {trendText || `${trend > 0 ? 'Increased' : 'Decreased'} from last month`}
        </p>

        {/* Chart visualization */}
        {chartData.length > 0 && (
          <div className="h-14 mt-auto -mx-1 -mb-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id={`gradient-${title.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
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
