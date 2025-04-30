import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Shield, Key, Users } from "lucide-react";
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
  Cell
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
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
        <p className="text-slate-300 font-medium mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div 
            key={`item-${index}`} 
            className="flex items-center gap-2 mb-1"
          >
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <p style={{ color: entry.color }} className="text-sm font-medium">
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
    <div className="flex justify-center gap-5 flex-wrap mt-1 mb-2">
      {payload.map((entry: any, index: number) => (
        <div key={`item-${index}`} className="flex items-center gap-1">
          <div 
            className="w-7 h-7 rounded-lg flex items-center justify-center" 
            style={{ backgroundColor: `${entry.color}15` }}
          >
            <div style={{ color: entry.color }}>
              {icons[entry.dataKey]}
            </div>
          </div>
          <span className="text-xs font-medium text-slate-400">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export function DashboardChart({ 
  className, 
  title = "System Overview", 
  data,
  stats
}: DashboardChartProps) {
  // Define colors for the chart
  const colors = {
    roles: "#a855f7",      // Purple
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
      "border-[1.5px] transition-all duration-300 shadow-md rounded-xl border-slate-800/60 bg-slate-900/90 backdrop-blur-sm",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-medium text-slate-300">{title}</h3>
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-purple-900 p-2 rounded-lg">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Total Roles</p>
                <p className="text-lg font-bold text-white">{stats.roles.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-amber-900 p-2 rounded-lg">
                <Key className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Total Permissions</p>
                <p className="text-lg font-bold text-white">{stats.permissions.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-900 p-2 rounded-lg">
                <Users className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Active Users</p>
                <p className="text-lg font-bold text-white">{stats.activeUsers.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[280px] w-full">
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
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis 
                dataKey="name" 
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis 
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#334155' }}
                domain={[0, yAxisMax]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
              
              <Area 
                type="monotone" 
                dataKey="roles" 
                name="Total Roles"
                stroke={colors.roles} 
                fill={`url(#color-gradient-roles)`}
                strokeWidth={2}
                activeDot={{ r: 6, stroke: colors.roles, strokeWidth: 2, fill: '#ffffff' }}
              />
              <Area 
                type="monotone" 
                dataKey="permissions" 
                name="Total Permissions"
                stroke={colors.permissions} 
                fill={`url(#color-gradient-permissions)`}
                strokeWidth={2}
                activeDot={{ r: 6, stroke: colors.permissions, strokeWidth: 2, fill: '#ffffff' }}
              />
              <Area 
                type="monotone" 
                dataKey="activeUsers" 
                name="Active Users"
                stroke={colors.activeUsers} 
                fill={`url(#color-gradient-activeUsers)`}
                strokeWidth={2}
                activeDot={{ r: 6, stroke: colors.activeUsers, strokeWidth: 2, fill: '#ffffff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default DashboardChart;
