import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SocialLeadItem {
  network: string;
  percentage: number;
  icon: React.ReactNode;
  color: string;
}

interface SocialLeadsProps {
  className?: string;
  title?: string;
  data: SocialLeadItem[];
}

export function SocialLeads({ className, title = "Social Leads", data }: SocialLeadsProps) {
  return (
    <Card className={cn(
      "border-[1.5px] transition-all duration-300 shadow-md rounded-xl border-slate-800/60 bg-slate-900/90 backdrop-blur-sm",
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-medium text-slate-300">{title}</h3>
          <button className="text-slate-400 p-1 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-4">
              <div className={`flex-shrink-0 p-2.5 rounded-lg`} style={{ backgroundColor: `${item.color}25` }}>
                {item.icon}
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-slate-300">{item.network}</span>
                  <span className="text-sm font-semibold text-white">{item.percentage}%</span>
                </div>
                <div className="overflow-hidden bg-slate-800 rounded-full h-2">
                  <div 
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ 
                      width: `${item.percentage}%`,
                      backgroundColor: item.color
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default SocialLeads;
