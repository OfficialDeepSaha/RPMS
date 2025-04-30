import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/admin-layout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  UserPlus, 
  UserMinus, 
  UserCheck, 
  Calendar, 
  Filter, 
  Download, 
  BarChart3,
  PieChart as PieChartIcon, 
  LineChart as LineChartIcon,
  Users,
  FileText,
  Loader2,
  Calendar as CalendarIcon,
  FileJson,
  FileType,
  ShieldCheck,
  Key,
  Search as SearchIcon,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Card as CardComponent, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// Import report service
import { 
  useActivityReport, 
  useDashboardAnalytics, 
  exportReportData,
  mockReportService,
  DashboardAnalytics
} from "@/lib/report-service";

// Define Activity Item interface for the admin reports
interface ActivityItem {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
  };
}

// Define DatePicker component inline
interface DatePickerProps {
  date?: Date;
  onSelect: (date: Date) => void;
  disabled?: (date: Date) => boolean;
}

function DatePicker({ date, onSelect, disabled }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <CalendarComponent
          mode="single"
          selected={date}
          onSelect={(date) => date && onSelect(date)}
          disabled={disabled}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

// Form schema for the report generator
const formSchema = z.object({
  startDate: z.date(),
  endDate: z.date().refine(
    (date) => {
      // Allow any date up to today (prevent future dates)
      return date <= new Date();
    },
    {
      message: "End date cannot be in the future."
    }
  ),
  format: z.enum(["json", "csv"]).optional(),
}).refine(
  (data) => {
    // Also add validation to ensure startDate is before or equal to endDate
    return data.startDate <= data.endDate;
  },
  {
    message: "Start date must be before or equal to end date.",
    path: ["startDate"],
  }
);

// Helper function to format date
function formatDate(date: Date | string) {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return format(date, "MMM d, yyyy h:mm a");
}

// Helper function to format date for filenames
function formatDateForFilename(date: Date) {
  return format(date, 'yyyyMMdd');
}

// Mock data for user reports
const generateMockUserActivityData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return months.map(month => ({
    name: month,
    'New Users': Math.floor(Math.random() * 40) + 5,
    'Active Users': Math.floor(Math.random() * 80) + 20,
    'Inactive Users': Math.floor(Math.random() * 20) + 5,
  }));
};

const generateMockUserRoleData = () => {
  return [
    { name: 'Admin', value: 8, color: '#8884d8' },
    { name: 'Manager', value: 15, color: '#83a6ed' },
    { name: 'Editor', value: 23, color: '#8dd1e1' },
    { name: 'Viewer', value: 54, color: '#82ca9d' },
  ];
};

const generateMockLoginData = () => {
  const days = Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`);
  
  return days.map(day => ({
    name: day,
    'Login Count': Math.floor(Math.random() * 100) + 10,
  }));
};

const generateMockPermissionUsageData = () => {
  return [
    { name: 'View Dashboard', value: 95 },
    { name: 'Manage Users', value: 45 },
    { name: 'Manage Roles', value: 28 },
    { name: 'Manage Permissions', value: 22 },
    { name: 'View Reports', value: 65 },
    { name: 'Edit Profile', value: 85 },
  ].map(item => ({
    ...item,
    value: item.value + Math.floor(Math.random() * 20) - 10, // Add some variation
  }));
};

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("user-activity");
  const [reportActiveTab, setReportActiveTab] = useState("form");
  const [timeRange, setTimeRange] = useState("month");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Activity reports fetching
  const {
    data: activityReportData,
    isLoading: isLoadingReport,
    isError: isReportError,
    error: reportError,
    refetch: refetchReport
  } = useActivityReport(
    new Date(new Date().setDate(new Date().getDate() - 30)),
    new Date(),
    {
      activityType: "all", // Fixed to "all"
      limit: 100,
      enabled: false // Don't fetch on mount, only when the form is submitted
    }
  );

  // Store report data in state so we can display it after submission
  const [reportData, setReportData] = useState<ActivityItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Initialize the form for activity reports
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startDate: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
      endDate: new Date(),
    }
  });

  // Dashboard analytics data
  const {
    data: analyticsData,
    isLoading: isLoadingAnalytics,
    isError: isAnalyticsError,
    error: analyticsError,
    refetch: refetchAnalytics
  } = useDashboardAnalytics(timeRange as 'week' | 'month' | 'quarter' | 'year' | 'all');
  
  // Use mock data if real API fails or during development
  const dashboardData: any = analyticsData || 
    mockReportService.getMockDashboardAnalytics(timeRange);
  
  // Function to handle report generation
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsGenerating(true);
    setReportActiveTab("results");
    
    try {
      // Set start date to beginning of the day (midnight)
      const startDateFormatted = new Date(data.startDate);
      startDateFormatted.setHours(0, 0, 0, 0);
      
      // Set end date to end of the day (23:59:59.999)
      const endDateFormatted = new Date(data.endDate);
      endDateFormatted.setHours(23, 59, 59, 999);
      
      // Create a new query key to force a refetch with the new parameters
      const report = await queryClient.fetchQuery({
        queryKey: ['activityReport', startDateFormatted.toISOString(), endDateFormatted.toISOString(), 'all', '', 100],
        queryFn: async () => {
          // Construct the query parameters
          const params = new URLSearchParams();
          
          // Format dates for API request with proper time ranges
          params.append('startDate', startDateFormatted.toISOString());
          params.append('endDate', endDateFormatted.toISOString());
          params.append('limit', '100');
          
          console.log("Fetching activity report with params:", {
            startDate: startDateFormatted.toISOString(),
            endDate: endDateFormatted.toISOString()
          });
          
          const response = await fetch(`/api/reports/activities?${params.toString()}`);
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch activity report data');
          }
          
          return await response.json();
        }
      });
      
      if (report && report.data) {
        // Filter the data again on the client side to ensure accuracy
        const filteredData = report.data.filter((activity: ActivityItem) => {
          const activityDate = new Date(activity.timestamp);
          return activityDate >= startDateFormatted && activityDate <= endDateFormatted;
        });
        
        setReportData(filteredData);
        toast({
          title: "Report Generated",
          description: `Found ${filteredData.length} activities in the selected date range.`,
        });
      } else {
        // If no data, show empty state
        setReportData([]);
        toast({
          title: "No Results",
          description: "No activities found within the selected date range.",
        });
      }
    } catch (error: any) {
      console.error("Error generating report:", error);
      
      toast({
        title: "Error Generating Report",
        description: error.message || "There was a problem generating your report. Please try again.",
        variant: "destructive",
      });
      
      // Use mock data as fallback but ensure it respects the date range
      const mockData = mockReportService.getMockActivityData(
        data.startDate, 
        data.endDate,
        50
      );
      
      // Filter mock data to match the date range
      const filteredMockData = mockData.data.filter(activity => {
        const activityDate = new Date(activity.timestamp);
        return activityDate >= data.startDate && activityDate <= data.endDate;
      });
      
      setReportData(filteredMockData);
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Function to handle report downloads
  const downloadReport = async (fileFormat: 'csv' | 'json') => {
    if (reportData.length === 0) {
      toast({
        title: "No Data to Download",
        description: "Please generate a report first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsDownloading(true);
    
    try {
      // Format the data for download
      const startDate = form.getValues().startDate;
      const endDate = form.getValues().endDate;
      
      const filename = `activity_report_${formatDateForFilename(startDate)}_to_${formatDateForFilename(endDate)}`;
      
      // Use the exportReportData function directly since we already have the data in memory
      exportReportData(reportData, fileFormat, filename);
      
      toast({
        title: "Report Downloaded",
        description: `The report has been downloaded as ${filename}.${fileFormat}`,
      });
    } catch (error) {
      console.error("Error downloading report:", error);
      toast({
        title: "Download Failed",
        description: "There was a problem downloading your report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <AdminLayout
      title="User Reports"
      description="Comprehensive analytics and insights on user activity, roles and system usage"
    >
      <div className="space-y-6">
        {/* Report Controls */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" className="h-9 gap-1">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </Button>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Select Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="quarter">Last Quarter</SelectItem>
                <SelectItem value="year">Last Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <SearchIcon className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
              <Input placeholder="Search reports..." className="pl-9 h-9 w-[200px]" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 gap-1">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
            <Button size="sm" className="h-9">Generate Report</Button>
          </div>
        </div>

        {/* Display loading state if data is loading */}
        {isLoadingAnalytics && (
          <div className="w-full py-12">
            <div className="flex flex-col items-center justify-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading analytics data...</p>
            </div>
          </div>
        )}

        {/* Display error state if API fails */}
        {isAnalyticsError && (
          <Alert variant="destructive" className="bg-red-50 text-red-800 border border-red-200">
            <AlertTitle className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              Error loading analytics data
            </AlertTitle>
            <AlertDescription>
              {analyticsError instanceof Error 
                ? analyticsError.message 
                : "There was a problem loading the analytics data. Using fallback data instead."}
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2 mt-2" 
                onClick={() => refetchAnalytics()}
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Activity Report Error State */}
        {isReportError && reportActiveTab === "results" && (
          <Alert variant="destructive" className="bg-red-50 text-red-800 border border-red-200 mb-4">
            <AlertTitle className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              Error loading activity report
            </AlertTitle>
            <AlertDescription>
              {reportError instanceof Error 
                ? reportError.message 
                : "There was a problem loading the report data. Please try again."}
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2 mt-2" 
                onClick={() => onSubmit(form.getValues())}
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Report Tabs */}
        <Tabs defaultValue="user-activity" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="user-activity" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">User Activity</span>
            </TabsTrigger>
            <TabsTrigger value="role-distribution" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Role Distribution</span>
            </TabsTrigger>
            <TabsTrigger value="login-statistics" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Login Statistics</span>
            </TabsTrigger>
            <TabsTrigger value="permission-usage" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Permission Usage</span>
            </TabsTrigger>
            <TabsTrigger value="activity-log" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Activity Log</span>
            </TabsTrigger>
          </TabsList>
          
          {/* User Activity Tab */}
          <TabsContent value="user-activity" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="col-span-full">
                <CardHeader>
                  <CardTitle>User Activity Overview</CardTitle>
                  <CardDescription>Monthly breakdown of new, active, and inactive users over time</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {isLoadingAnalytics ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="flex flex-col items-center space-y-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Loading user activity data...</p>
                      </div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboardData.userStats.monthlyGrowth}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" name="New Users" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                  <CardDescription>New user registration trend</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingAnalytics ? (
                    <div className="flex flex-col space-y-3">
                      <Skeleton className="h-12 w-24" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2">
                        <UserPlus className="h-10 w-10 text-blue-500" />
                        <div>
                          <div className="text-2xl font-bold">{dashboardData.userStats.newUsers.count}</div>
                          <div className="text-xs text-muted-foreground">
                            {dashboardData.userStats.newUsers.trend > 0 ? (
                              <span className="text-green-600">↑ {dashboardData.userStats.newUsers.trend}%</span>
                            ) : (
                              <span className="text-red-600">↓ {Math.abs(dashboardData.userStats.newUsers.trend)}%</span>
                            )}
                            <span className="ml-1">vs previous period</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Active Users</CardTitle>
                  <CardDescription>Users active in the last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingAnalytics ? (
                    <div className="flex flex-col space-y-3">
                      <Skeleton className="h-12 w-24" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2">
                        <UserCheck className="h-10 w-10 text-green-500" />
                        <div>
                          <div className="text-2xl font-bold">{dashboardData.userStats.activeUsers}</div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round((dashboardData.userStats.activeUsers / dashboardData.userStats.totalUsers) * 100)}% of total users
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Inactive Users</CardTitle>
                  <CardDescription>Users who haven't logged in for 30+ days</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingAnalytics ? (
                    <div className="flex flex-col space-y-3">
                      <Skeleton className="h-12 w-24" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2">
                        <UserMinus className="h-10 w-10 text-amber-500" />
                        <div>
                          <div className="text-2xl font-bold">{dashboardData.userStats.inactiveUsers}</div>
                          <div className="text-xs text-muted-foreground">
                            {Math.round((dashboardData.userStats.inactiveUsers / dashboardData.userStats.totalUsers) * 100)}% of total users
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Role Distribution Tab */}
          <TabsContent value="role-distribution" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>User Role Distribution</CardTitle>
                  <CardDescription>Breakdown of users by assigned role</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {isLoadingAnalytics ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="flex flex-col items-center space-y-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Loading role distribution data...</p>
                      </div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dashboardData.roleStats.usersPerRole}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="count"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {dashboardData.roleStats.usersPerRole.map((entry: { color: string }, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} users`, 'Count']} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Role Statistics</CardTitle>
                  <CardDescription>Detailed breakdown by role</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingAnalytics ? (
                    <div className="flex flex-col space-y-3">
                      {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {dashboardData.roleStats.usersPerRole.map((role: { 
                        name: string; 
                        count: number; 
                        color: string;
                        permissions?: { id: number; name: string; }[];
                      }) => (
                        <div key={role.name} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: role.color }}
                            />
                            <span className="font-medium">{role.name}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">
                              {role.permissions && (
                                <span>{role.permissions.length} permissions</span>
                              )}
                            </span>
                            <span className="font-semibold">{role.count} users</span>
                          </div>
                        </div>
                      ))}
                      {dashboardData.roleStats.usersPerRole.length === 0 && (
                        <div className="text-center py-4 text-muted-foreground">
                          No role data available
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Role Analysis</CardTitle>
                  <CardDescription>Insights on role usage and permission coverage</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingAnalytics ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-5 w-5 text-green-500" />
                          <h4 className="text-sm font-semibold">Total Roles</h4>
                        </div>
                        <p className="mt-2 text-2xl font-bold">{dashboardData.roleStats.totalRoles}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Available in the system
                        </p>
                      </div>
                      
                      <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-blue-500" />
                          <h4 className="text-sm font-semibold">Unused Roles</h4>
                        </div>
                        <p className="mt-2 text-2xl font-bold">
                          {dashboardData.roleStats.usersPerRole.filter((r: {count: number}) => r.count === 0).length}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Roles with no assigned users
                        </p>
                      </div>
                      
                      <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-5 w-5 text-indigo-500" />
                          <h4 className="text-sm font-semibold">Avg. Permissions</h4>
                        </div>
                        <p className="mt-2 text-2xl font-bold">
                          {dashboardData.roleStats.usersPerRole.length > 0 ? 
                            Math.round(
                              dashboardData.roleStats.usersPerRole.reduce(
                                (acc: number, role: {permissions?: {id: number; name: string}[]}) => acc + (role.permissions?.length || 0), 
                                0
                              ) / dashboardData.roleStats.usersPerRole.length
                            ) :
                            0
                          }
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Average permissions per role
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Login Statistics Tab */}
          <TabsContent value="login-statistics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Login Statistics</CardTitle>
                <CardDescription>Daily login counts across the platform</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {isLoadingAnalytics ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="flex flex-col items-center space-y-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Loading login statistics data...</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={dashboardData.loginStats.history}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => value}
                        tick={{ fontSize: 12 }}
                        tickMargin={5}
                      />
                      <YAxis tickFormatter={(value) => value.toLocaleString()} />
                      <Tooltip 
                        formatter={(value) => [value.toLocaleString(), 'Login Count']} 
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Area type="monotone" dataKey="count" name="Login Count" stroke="#8884d8" fill="#8884d8" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Total Logins</CardTitle>
                  <CardDescription>Historical login counts across the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingAnalytics ? (
                    <div className="flex flex-col space-y-3">
                      <Skeleton className="h-12 w-24" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-10 w-10 text-blue-500" />
                        <div>
                          <div className="text-2xl font-bold">{dashboardData.loginStats.totalLogins.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">
                            Total logins for selected time period
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Average Daily Logins</CardTitle>
                  <CardDescription>Average daily login activity</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingAnalytics ? (
                    <div className="flex flex-col space-y-3">
                      <Skeleton className="h-12 w-24" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2">
                        <LineChartIcon className="h-10 w-10 text-green-500" />
                        <div>
                          <div className="text-2xl font-bold">{dashboardData.loginStats.averageDaily.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">
                            {timeRange === 'week' 
                              ? 'Past 7 days average'
                              : timeRange === 'month'
                              ? 'Past 30 days average'
                              : timeRange === 'quarter'
                              ? 'Past 90 days average'
                              : timeRange === 'year'
                              ? 'Past 365 days average'
                              : 'All time average'}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Peak Login Day</CardTitle>
                  <CardDescription>Day with highest login activity</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingAnalytics ? (
                    <div className="flex flex-col space-y-3">
                      <Skeleton className="h-12 w-24" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="h-10 w-10 text-purple-500" />
                        <div>
                          <div className="text-2xl font-bold">{dashboardData.loginStats.peakDay.day}</div>
                          <div className="text-xs text-muted-foreground">
                            {dashboardData.loginStats.peakDay.count.toLocaleString()} logins
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Permission Usage Tab */}
          <TabsContent value="permission-usage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Permission Usage</CardTitle>
                <CardDescription>Analysis of how frequently different permissions are used across the system</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {isLoadingAnalytics ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="flex flex-col items-center space-y-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Loading permission usage data...</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={dashboardData.permissionStats.usageCount}
                      margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#8884d8" name="Usage Count" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Total Permissions</CardTitle>
                <CardDescription>Total number of permissions across the system</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAnalytics ? (
                  <div className="flex flex-col space-y-3">
                    <Skeleton className="h-12 w-24" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-2">
                      <Key className="h-10 w-10 text-indigo-500" />
                      <div>
                        <div className="text-2xl font-bold">{dashboardData.permissionStats.totalPermissions}</div>
                        <div className="text-xs text-muted-foreground">
                          Total permissions across the system
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Activity Log Tab - from user/reports page */}
          <TabsContent value="activity-log">
            <Tabs defaultValue="generator" value={reportActiveTab} onValueChange={setReportActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="form">Report Generator</TabsTrigger>
                <TabsTrigger value="results" disabled={reportData.length === 0 && !isGenerating}>Results</TabsTrigger>
              </TabsList>
              
              <TabsContent value="form">
                <CardComponent>
                  <CardHeader>
                    <CardTitle>
                      Activity Report Generator
                    </CardTitle>
                    <CardDescription>
                      Generate detailed activity reports for a specific date range
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="startDate"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>
                                  Start Date
                                </FormLabel>
                                <FormControl>
                                  <DatePicker
                                    date={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date > new Date()}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="endDate"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>
                                  End Date
                                </FormLabel>
                                <FormControl>
                                  <DatePicker
                                    date={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date > new Date()}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={isGenerating}
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating Report...
                            </>
                          ) : (
                            <>
                              <BarChart3 className="mr-2 h-4 w-4" />
                              Generate Report
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </CardComponent>
              </TabsContent>

              <TabsContent value="results">
                <CardComponent>
                  <CardHeader>
                    <CardTitle>
                      Activity Report Results
                    </CardTitle>
                    <CardDescription>
                      {reportData.length > 0 ? (
                        <p>
                          {reportData.length} records found
                          {form.getValues().startDate && form.getValues().endDate ? 
                            ` from ${formatDate(form.getValues().startDate)} to ${formatDate(form.getValues().endDate)}` : 
                            ""}
                        </p>
                      ) : isLoadingReport ? (
                        <p>Loading report data...</p>
                      ) : (
                        <p>No results found. Try adjusting your search criteria.</p>
                      )}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    {isLoadingReport ? (
                      <div className="space-y-4">
                        <Skeleton className="h-8 w-full" />
                        {[1, 2, 3, 4, 5].map(i => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : reportData.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date & Time</TableHead>
                              <TableHead>Activity Type</TableHead>
                              <TableHead>User</TableHead>
                              <TableHead>Description</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {reportData.slice(0, 50).map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>{formatDate(item.timestamp)}</TableCell>
                                <TableCell className="font-medium">{item.type.replace(/_/g, " ")}</TableCell>
                                <TableCell>{item.user.name}</TableCell>
                                <TableCell>{item.message}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                          {reportData.length > 50 && (
                            <TableCaption>
                              Showing 50 of {reportData.length} records. Download the report to see all data.
                            </TableCaption>
                          )}
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p>No records found for the selected criteria.</p>
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => setReportActiveTab("form")}>
                      Back to Generator
                    </Button>
                    
                    {reportData.length > 0 && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          disabled={isDownloading}
                          onClick={() => downloadReport('csv')}
                        >
                          <FileType className="mr-2 h-4 w-4" />
                          Download CSV
                        </Button>
                        <Button
                          variant="default"
                          disabled={isDownloading}
                          onClick={() => downloadReport('json')}
                        >
                          <FileJson className="mr-2 h-4 w-4" />
                          {isDownloading ? 'Downloading...' : 'Download JSON'}
                        </Button>
                      </div>
                    )}
                  </CardFooter>
                </CardComponent>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

// Missing icon component
const Search = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
};
