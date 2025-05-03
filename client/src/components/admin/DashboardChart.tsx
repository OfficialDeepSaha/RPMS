import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Shield, Key, Users, ChevronUp, ChevronDown } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  ComposedChart,
  Cell,
  ReferenceLine
} from 'recharts';

interface ChartDataItem {
  name: string;
  roles: number;
  permissions: number;
  activeUsers: number;
}

interface DashboardChartProps {
  className?: string;
  title?: string;
  data: ChartDataItem[];
  stats: {
    roles: number;
    permissions: number;
    activeUsers: number;
  };
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950/90 backdrop-blur-md border border-slate-700/50 rounded-lg p-4 shadow-2xl animate-fadeIn">
        <p className="text-slate-200 font-medium mb-2 text-sm">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div 
            key={`item-${index}`} 
            className="flex items-center gap-2 mb-1.5 group"
          >
            <div 
              className="w-3 h-3 rounded-full transition-all duration-300 group-hover:scale-125" 
              style={{ backgroundColor: entry.color }}
            />
            <p className="text-sm font-medium transition-all duration-300 group-hover:translate-x-1" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    );
  }

  return null;
};

// Custom legend with icons
const CustomLegend = ({ payload }: any) => {
  const icons: Record<string, React.ReactNode> = {
    roles: <Shield className="h-3.5 w-3.5" />,
    permissions: <Key className="h-3.5 w-3.5" />,
    activeUsers: <Users className="h-3.5 w-3.5" />
  };

  return (
    <div className="flex justify-center gap-5 flex-wrap mt-2 mb-3">
      {payload.map((entry: any, index: number) => (
        <div key={`item-${index}`} className="flex items-center gap-1.5 group cursor-pointer">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110" 
            style={{ backgroundColor: `${entry.color}20` }}
          >
            <div style={{ color: entry.color }} className="transition-transform duration-300 group-hover:rotate-12">
              {icons[entry.dataKey]}
            </div>
          </div>
          <span className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors duration-300">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export function DashboardChart({ 
  className, 
  title = "System Analytics", 
  data,
  stats
}: DashboardChartProps) {
  const [expanded, setExpanded] = useState(true);

  // Define colors for the chart with more vibrant options
  const colors = {
    roles: "#a855f7",      // Vibrant Purple
    permissions: "#f59e0b", // Amber
    activeUsers: "#3b82f6"  // Blue
  };

  // Calculate max value for better chart display
  const maxValue = Math.max(
    ...data.map(item => Math.max(item.roles, item.permissions, item.activeUsers))
  );
  
  // Round up to create nice y-axis
  const yAxisMax = Math.ceil(maxValue * 1.2);

  return (
    <Card className={cn(
      "transition-all duration-500 border-0 rounded-xl overflow-hidden group backdrop-blur-lg bg-gradient-to-br from-slate-950/90 to-slate-900/80",
      className
    )}>
      {/* Glass border effect */}
      <div className="absolute inset-0 rounded-xl border border-slate-700/30 bg-gradient-to-br from-slate-700/10 to-slate-700/5 pointer-events-none"></div>
      
      {/* Animated gradient background */}
      <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 group-hover:opacity-20 transition-opacity duration-700"></div>
      
      {/* Glow effects */}
      <div className="absolute -top-32 -left-32 w-64 h-64 rounded-full blur-3xl opacity-10 bg-purple-700 group-hover:opacity-20 transition-opacity duration-700"></div>
      <div className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full blur-3xl opacity-10 bg-blue-700 group-hover:opacity-20 transition-opacity duration-700"></div>
      
      <CardContent className="p-6 relative z-10">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-medium text-slate-200 group-hover:text-white transition-colors duration-300">{title}</h3>
          <button 
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors duration-300"
          >
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>

        {/* Stats overview with hover effects */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-slate-800/70 to-slate-800/30 rounded-xl p-4 border border-slate-700/30 hover:border-purple-600/30 transition-all duration-300 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)] group/stat">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-purple-900/80 p-2 rounded-lg transition-transform duration-300 group-hover/stat:scale-110 group-hover/stat:rotate-3">
                <Shield className="h-4 w-4 text-purple-200" />
              </div>
              <div>
                <p className="text-xs text-slate-400 group-hover/stat:text-slate-300 transition-colors duration-300">Total Roles</p>
                <p className="text-lg font-bold text-white group-hover/stat:text-purple-200 transition-colors duration-300">{stats.roles.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-slate-800/70 to-slate-800/30 rounded-xl p-4 border border-slate-700/30 hover:border-amber-600/30 transition-all duration-300 hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] group/stat">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-amber-900/80 p-2 rounded-lg transition-transform duration-300 group-hover/stat:scale-110 group-hover/stat:rotate-3">
                <Key className="h-4 w-4 text-amber-200" />
              </div>
              <div>
                <p className="text-xs text-slate-400 group-hover/stat:text-slate-300 transition-colors duration-300">Total Permissions</p>
                <p className="text-lg font-bold text-white group-hover/stat:text-amber-200 transition-colors duration-300">{stats.permissions.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-slate-800/70 to-slate-800/30 rounded-xl p-4 border border-slate-700/30 hover:border-blue-600/30 transition-all duration-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] group/stat">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-900/80 p-2 rounded-lg transition-transform duration-300 group-hover/stat:scale-110 group-hover/stat:rotate-3">
                <Users className="h-4 w-4 text-blue-200" />
              </div>
              <div>
                <p className="text-xs text-slate-400 group-hover/stat:text-slate-300 transition-colors duration-300">Active Users</p>
                <p className="text-lg font-bold text-white group-hover/stat:text-blue-200 transition-colors duration-300">{stats.activeUsers.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chart with animated transitions */}
        <div 
          className={cn(
            "w-full transition-all duration-500 overflow-hidden", 
            expanded ? "h-[280px] opacity-100" : "h-0 opacity-0"
          )}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
            >
              <defs>
                {Object.entries(colors).map(([key, color]) => (
                  <linearGradient key={key} id={`color-gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={{ stroke: '#334155' }}
              />
              <YAxis 
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={{ stroke: '#334155' }}
                domain={[0, yAxisMax]}
              />
              <Tooltip content={<CustomTooltip />} animationDuration={300} animationEasing="ease-out" />
              <Legend content={<CustomLegend />} />
              
              {/* Reference line for average */}
              <ReferenceLine 
                y={maxValue / 2} 
                stroke="#475569" 
                strokeDasharray="3 3" 
                label={{ 
                  value: "Avg", 
                  fill: "#94a3b8", 
                  fontSize: 10,
                  position: "insideBottomRight" 
                }} 
              />
              
              <Area 
                type="monotone" 
                dataKey="roles" 
                name="Total Roles"
                stroke={colors.roles} 
                fill={`url(#color-gradient-roles)`}
                strokeWidth={2}
                activeDot={{ 
                  r: 6, 
                  stroke: colors.roles, 
                  strokeWidth: 2, 
                  fill: '#ffffff',
                  className: "animate-pulse-slow" 
                }}
                animationDuration={2000}
                animationEasing="ease-in-out"
              />
              <Area 
                type="monotone" 
                dataKey="permissions" 
                name="Total Permissions"
                stroke={colors.permissions} 
                fill={`url(#color-gradient-permissions)`}
                strokeWidth={2}
                activeDot={{ 
                  r: 6, 
                  stroke: colors.permissions, 
                  strokeWidth: 2, 
                  fill: '#ffffff',
                  className: "animate-pulse-slow" 
                }}
                animationDuration={2000}
                animationEasing="ease-in-out"
                animationBegin={300}
              />
              <Area 
                type="monotone" 
                dataKey="activeUsers" 
                name="Active Users"
                stroke={colors.activeUsers} 
                fill={`url(#color-gradient-activeUsers)`}
                strokeWidth={2}
                activeDot={{ 
                  r: 6, 
                  stroke: colors.activeUsers, 
                  strokeWidth: 2, 
                  fill: '#ffffff',
                  className: "animate-pulse-slow" 
                }}
                animationDuration={2000}
                animationEasing="ease-in-out"
                animationBegin={600}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default DashboardChart;
