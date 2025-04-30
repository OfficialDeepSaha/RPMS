import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LineChartProps {
  className?: string;
  title: string;
  value: string | number;
  data: {
    name: string;
    value: number;
  }[];
  lineColor?: string;
  trend?: number;
  trendText?: string;
  subtitle?: string;
}

export function LineChartComponent({ 
  className, 
  title, 
  value,
  data, 
  lineColor = '#8b5cf6', 
  trend,
  trendText,
  subtitle
}: LineChartProps) {
  return (
    <Card className={cn(
      "border-[1.5px] transition-all duration-300 shadow-md rounded-xl border-slate-800/60 bg-slate-900/90 backdrop-blur-sm",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex flex-col mb-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-slate-300">{title}</h3>
            <button className="text-slate-400 p-1 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
              </svg>
            </button>
          </div>
          <div className="flex items-baseline mt-1">
            <span className="text-2xl font-bold text-white mr-2">{value}</span>
            {trend !== undefined && (
              <div className={cn(
                "text-xs font-medium",
                trend > 0 ? "text-emerald-400" : "text-rose-400"
              )}>
                {trend > 0 ? "+" : ""}{trend}% {trendText || "from last month"}
              </div>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>

        <div className="h-[140px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 5,
                left: 5,
                bottom: 5,
              }}
            >
              <defs>
                <linearGradient id={`lineGradient-${title.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={lineColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                dy={10}
                interval="preserveStartEnd"
              />
              <YAxis hide={true} />
              <Tooltip
                cursor={{ stroke: 'rgba(255, 255, 255, 0.2)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg bg-slate-800 p-2 shadow-md border border-slate-700 text-white text-xs">
                        <p className="mb-1 font-medium">{payload[0].payload.name}</p>
                        <p style={{ color: lineColor }} className="font-semibold">{payload[0].value}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={lineColor} 
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2, fill: '#0f172a', stroke: lineColor }}
                activeDot={{ r: 6, strokeWidth: 0, fill: lineColor }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default LineChartComponent;
