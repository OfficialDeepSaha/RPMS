import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface BarChartProps {
  className?: string;
  title: string;
  data: {
    name: string;
    value: number;
  }[];
  barColor?: string;
  xAxisDataKey?: string;
  valueDataKey?: string;
  subtitle?: string;
}

export function BarChartComponent({ 
  className, 
  title, 
  data, 
  barColor = '#38bdf8', 
  xAxisDataKey = 'name',
  valueDataKey = 'value',
  subtitle
}: BarChartProps) {
  return (
    <Card className={cn(
      "border-[1.5px] transition-all duration-300 shadow-md rounded-xl border-slate-800/60 bg-slate-900/90 backdrop-blur-sm",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-medium text-slate-300">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          </div>
          <button className="text-slate-400 p-1 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
            </svg>
          </button>
        </div>

        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 5,
                right: 5,
                left: 5,
                bottom: 20,
              }}
            >
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={barColor} stopOpacity={1} />
                  <stop offset="100%" stopColor={barColor} stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey={xAxisDataKey}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                dy={10}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg bg-slate-800 p-2 shadow-md border border-slate-700 text-white text-xs">
                        <p className="mb-1 font-medium">{payload[0].payload[xAxisDataKey]}</p>
                        <p className="text-cyan-400 font-semibold">{payload[0].value}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar 
                dataKey={valueDataKey} 
                fill="url(#barGradient)" 
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default BarChartComponent;
