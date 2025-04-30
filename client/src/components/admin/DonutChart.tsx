import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Laptop, Tablet, Smartphone } from "lucide-react";

interface DonutChartProps {
  className?: string;
  title: string;
  data: {
    name: string;
    value: number;
    icon: React.ReactNode;
    color: string;
  }[];
}

export function DonutChart({ className, title, data }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const mainSegment = data.sort((a, b) => b.value - a.value)[0];
  const mainPercentage = Math.round((mainSegment?.value / total) * 100) || 0;

  return (
    <Card className={cn(
      "border-[1.5px] transition-all duration-300 shadow-md rounded-xl border-slate-800/60 bg-slate-900/90 backdrop-blur-sm",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-slate-300">{title}</h3>
          <button className="text-slate-400 p-1 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="relative h-[240px] mx-auto flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg bg-slate-800 p-2 shadow-md border border-slate-700 text-white text-xs">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: data.color }}></div>
                            <span>{data.name}: {data.value}%</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="text-3xl font-bold text-white">{mainPercentage}%</div>
              <div className="text-xs text-slate-400">Total Views</div>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            {data.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-md flex items-center justify-center`} style={{ backgroundColor: `${item.color}25` }}>
                    {item.icon}
                  </div>
                  <span className="text-sm font-medium text-slate-300">{item.name}</span>
                </div>
                <span className="text-sm font-semibold text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default DonutChart;
