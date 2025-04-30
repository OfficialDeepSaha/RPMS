import React from 'react';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface AreaChartProps {
  className?: string;
  title: string;
  value: string | number;
  data: {
    name: string;
    value: number;
  }[];
  trend?: number;
  trendLabel?: string;
  areaColor?: string;
  valuePrefix?: string;
  valueSuffix?: string;
}

export function AreaChartComponent({ 
  className, 
  title, 
  value,
  data, 
  trend,
  trendLabel = "from last month",
  areaColor = '#f59e0b',
  valuePrefix = "",
  valueSuffix = ""
}: AreaChartProps) {
  return (
    <Card className={cn(
      "border-[1.5px] transition-all duration-300 shadow-md rounded-xl border-slate-800/60 bg-slate-900/90 backdrop-blur-sm",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-medium text-slate-300">{title}</h3>
          <button className="text-slate-400 p-1 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
            </svg>
          </button>
        </div>
        
        <div className="flex items-baseline mb-2">
          <span className="text-2xl font-bold text-white">{valuePrefix}{value}{valueSuffix}</span>
          {trend !== undefined && (
            <div className="ml-2 flex items-center text-xs font-medium">
              <div className={cn(
                "flex items-center",
                trend >= 0 ? "text-emerald-400" : "text-rose-400"
              )}>
                {trend >= 0 
                  ? <ArrowUpRight size={14} className="mr-1" /> 
                  : <ArrowDownRight size={14} className="mr-1" />
                }
                {Math.abs(trend)}%
              </div>
              <span className="text-slate-500 ml-1">{trendLabel}</span>
            </div>
          )}
        </div>

        <div className="h-[120px] mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{
                top: 0,
                right: 0,
                left: 0,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id={`areaGradient-${title.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={areaColor} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={areaColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                cursor={{ stroke: 'rgba(255, 255, 255, 0.2)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg bg-slate-800 p-2 shadow-md border border-slate-700 text-white text-xs">
                        <p className="mb-1 font-medium">{payload[0].payload.name}</p>
                        <p style={{ color: areaColor }} className="font-semibold">
                          {valuePrefix}{payload[0].value}{valueSuffix}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={areaColor}
                fill={`url(#areaGradient-${title.replace(/\s+/g, '-')})`}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default AreaChartComponent;
