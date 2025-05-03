import React, { ReactNode } from 'react';
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

interface GlassCardProps {
  className?: string;
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  iconColor?: string;
  footer?: ReactNode;
  children: ReactNode;
  glowColor?: string;
  noBorder?: boolean;
  fullHeight?: boolean;
  hideHeader?: boolean;
}

export function GlassCard({
  className,
  title,
  description,
  icon,
  iconColor = "#6366f1",
  footer,
  children,
  glowColor = "#6366f1",
  noBorder = false,
  fullHeight = false,
  hideHeader = false
}: GlassCardProps) {
  return (
    <Card className={cn(
      "relative overflow-hidden border-0 shadow-xl bg-transparent transition-all duration-300 group",
      fullHeight && "h-full",
      className
    )}>
      {/* Glassmorphism background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-md"></div>
      
      {/* Background glow effect */}
      <div 
        className="absolute -top-40 -right-20 w-60 h-60 rounded-full blur-[100px] opacity-20 transition-opacity duration-500 group-hover:opacity-25"
        style={{ backgroundColor: glowColor }}
      ></div>
      
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIwLjUiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMzAgNUwzMCAzMCAzMCA1NSI+PC9wYXRoPjxwYXRoIGQ9Ik01IDMwTDMwIDMwIDU1IDMwIj48L3BhdGg+PC9nPjwvc3ZnPg==')] opacity-5"></div>
      
      {/* Animated scanning line */}
      <div className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent animate-scanner-line opacity-0 group-hover:opacity-100"></div>
      
      {/* Border effect */}
      {!noBorder && (
        <div className="absolute inset-0 border rounded-lg border-slate-700/30 group-hover:border-slate-700/50 transition-colors duration-300"></div>
      )}

      {!hideHeader && (title || description) && (
        <CardHeader className="relative border-b border-slate-700/30 pb-4 z-10">
          <div className="flex items-start gap-3">
            {icon && (
              <div 
                className="p-2 rounded-lg transition-transform duration-300 shrink-0 group-hover:scale-110 group-hover:rotate-3" 
                style={{ 
                  backgroundColor: `${iconColor}20`,
                  border: `1px solid ${iconColor}30`
                }}
              >
                <div style={{ color: iconColor }}>{icon}</div>
              </div>
            )}
            
            <div>
              {title && (
                <CardTitle className="text-lg font-semibold text-white">
                  {typeof title === 'string' ? (
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
                      {title}
                    </span>
                  ) : (
                    title
                  )}
                </CardTitle>
              )}
              
              {description && (
                <CardDescription className="text-slate-400 mt-1">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
      )}
      
      <CardContent className={cn(
        "relative z-10",
        hideHeader ? "pt-6" : "pt-5"
      )}>
        {children}
      </CardContent>
      
      {footer && (
        <CardFooter className="relative border-t border-slate-700/30 pt-4 z-10">
          {footer}
        </CardFooter>
      )}
      
      {/* Corner accents */}
      <div className="absolute top-0 right-0 w-10 h-10 overflow-hidden opacity-70">
        <div className="absolute top-0 right-0 w-[1px] h-6 bg-gradient-to-b from-indigo-400/80 to-transparent"></div>
        <div className="absolute top-0 right-0 h-[1px] w-6 bg-gradient-to-l from-indigo-400/80 to-transparent"></div>
      </div>
      <div className="absolute bottom-0 left-0 w-10 h-10 overflow-hidden opacity-70">
        <div className="absolute bottom-0 left-0 w-[1px] h-6 bg-gradient-to-t from-indigo-400/80 to-transparent"></div>
        <div className="absolute bottom-0 left-0 h-[1px] w-6 bg-gradient-to-r from-indigo-400/80 to-transparent"></div>
      </div>
    </Card>
  );
}

export default GlassCard; 