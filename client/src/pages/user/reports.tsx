import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import UserLayout from "@/components/layout/user-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { FileText, Download, Loader2, Calendar as CalendarIcon, FileJson, FileType } from "lucide-react";
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
        <Calendar
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

// Define the form schema
const reportFormSchema = z.object({
  startDate: z.date({
    required_error: "Start date is required",
  }),
  endDate: z.date({
    required_error: "End date is required",
  }),
}).refine(data => {
  return data.startDate <= data.endDate;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

// Type definitions for our report data
interface ReportData {
  id: number;
  type: string;
  content: string;
  createdAt: string;
  userId: number;
  username?: string;
  details?: Record<string, any>;
  [key: string]: any;
}

export default function ReportsPage() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [activeTab, setActiveTab] = useState("form");

  // Initialize the form
  const form = useForm<z.infer<typeof reportFormSchema>>({
    resolver: zodResolver(reportFormSchema),
  });

  // Function to handle report generation
  const onSubmit = async (data: z.infer<typeof reportFormSchema>) => {
    setIsGenerating(true);
    
    try {
      // Format dates for API request - ensure timezone is properly handled
      // Create new date objects at the start of the selected day and end of the selected day
      const startDate = new Date(data.startDate);
      startDate.setHours(0, 0, 0, 0); // Set to start of day
      
      const endDate = new Date(data.endDate);
      endDate.setHours(23, 59, 59, 999); // Set to end of day
      
      const formattedStartDate = startDate.toISOString();
      const formattedEndDate = endDate.toISOString();
      
      console.log("Selected date range:", {
        startRaw: data.startDate,
        endRaw: data.endDate,
        startFormatted: formattedStartDate,
        endFormatted: formattedEndDate
      });
      
      // Create the API URL with very clear date parameters
      const apiUrl = `/api/reports?startDate=${encodeURIComponent(formattedStartDate)}&endDate=${encodeURIComponent(formattedEndDate)}`;
      console.log("Calling API:", apiUrl);
      
      // Make real API call to generate report with credentials
      const response = await fetch(apiUrl, {
        credentials: 'include',  // Important for including cookies/session
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response:", text);
        
        // Check if this is an auth issue (redirected to login page)
        if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
          throw new Error("Authentication issue. Please make sure you're logged in.");
        } else {
          throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}...`);
        }
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate report");
      }
      
      const reportResults = await response.json();
      console.log(`Received ${reportResults.length} records from server`);
      
      // Post-process the data to ensure only records within the date range are shown
      // This is a client-side fallback filtering in case server-side filtering fails
      const filteredResults = reportResults.filter((record: ReportData) => {
        const recordDate = new Date(record.createdAt);
        return recordDate >= startDate && recordDate <= endDate;
      });
      
      console.log(`After client-side filtering: ${filteredResults.length} records (removed ${reportResults.length - filteredResults.length})`);
      
      setReportData(filteredResults);
      
      toast({
        title: "Report Generated Successfully",
        description: `Activity report from ${format(data.startDate, "MMM d, yyyy")} to ${format(data.endDate, "MMM d, yyyy")} with ${filteredResults.length} records.`,
      });
      
      // Switch to results tab
      setActiveTab("results");
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error Generating Report",
        description: error instanceof Error ? error.message : "There was a problem generating your report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Function to download report
  const downloadReport = async (format: 'csv' | 'json') => {
    setIsDownloading(true);
    
    try {
      const { startDate, endDate } = form.getValues();
      
      if (!startDate || !endDate) {
        throw new Error("Missing report parameters");
      }
      
      // Format dates for API request
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Set endDate to end of day
      end.setHours(23, 59, 59, 999);
      
      const formattedStartDate = start.toISOString();
      const formattedEndDate = end.toISOString();
      
      // Instead of direct link, make a fetch request first to check auth
      const checkUrl = `/api/test`;
      const checkResponse = await fetch(checkUrl, { 
        credentials: 'include'
      });
      
      if (!checkResponse.ok) {
        throw new Error("Authentication issue. Please make sure you're logged in.");
      }
      
      // Create a direct download link using URL API
      const downloadUrl = `/api/reports/export?startDate=${encodeURIComponent(formattedStartDate)}&endDate=${encodeURIComponent(formattedEndDate)}&format=${format}`;
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `activity-report.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: `Your report is being downloaded as a ${format.toUpperCase()} file.`,
      });
    } catch (error) {
      console.error("Error downloading report:", error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "There was a problem downloading your report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Format the date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm a");
    } catch (error) {
      return "Invalid date";
    }
  };

  return (
    <UserLayout title="Reports">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Generate Reports</h1>
          <p className="text-gray-600">Create customized reports for your system data within a specified date range.</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="form">Generate Report</TabsTrigger>
            <TabsTrigger value="results" disabled={reportData.length === 0}>
              View Results
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="form">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-indigo-500" />
                  Activity Report Generator
                </CardTitle>
                <CardDescription>
                  Select date range for your complete activity report
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
                            <FormLabel>Start Date</FormLabel>
                            <DatePicker 
                              date={field.value} 
                              onSelect={field.onChange}
                              disabled={(date: Date) => date > new Date()}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>End Date</FormLabel>
                            <DatePicker 
                              date={field.value} 
                              onSelect={field.onChange}
                              disabled={(date: Date) => date > new Date()}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Button type="submit" disabled={isGenerating} className="w-full md:w-auto">
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 h-4 w-4" />
                          Generate Report
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle>
                  Activity Report Results
                </CardTitle>
                <CardDescription>
                  {reportData.length > 0 ? (
                    <p>
                      {reportData.length} records found
                      {form.getValues().startDate && form.getValues().endDate ? 
                        ` from ${format(form.getValues().startDate, "MMM d, yyyy")} to ${format(form.getValues().endDate, "MMM d, yyyy")}` : 
                        ""}
                    </p>
                  ) : (
                    <p>No results found. Try adjusting your search criteria.</p>
                  )}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {reportData.length > 0 ? (
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
                            <TableCell>{formatDate(item.createdAt)}</TableCell>
                            <TableCell className="font-medium">{item.type.replace(/_/g, " ")}</TableCell>
                            <TableCell>{item.username || `User ID: ${item.userId}`}</TableCell>
                            <TableCell>{item.content}</TableCell>
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
                <Button variant="outline" onClick={() => setActiveTab("form")}>
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
                      Download JSON
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </UserLayout>
  );
}
