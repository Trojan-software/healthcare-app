import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  History, 
  Heart, 
  Thermometer, 
  Wind, 
  Activity,
  Calendar,
  Filter,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  Plus
} from "lucide-react";

interface VitalSigns {
  id: number;
  patientId: string;
  heartRate?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  temperature?: number;
  oxygenLevel?: number;
  timestamp: string;
}

export default function VitalSignsHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [dateRange, setDateRange] = useState<string>("all");
  const queryClient = useQueryClient();

  // Fetch vital signs history
  const { data: vitalsHistory, isLoading, error } = useQuery<VitalSigns[]>({
    queryKey: ['/api/vital-signs'],
    staleTime: 30000,
  });

  // Create sample data mutation
  const createSampleDataMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/create-sample-data', 'POST', {});
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vital-signs'] });
    },
  });

  // Filter and process data
  const processedHistory = useMemo(() => {
    if (!vitalsHistory) return [];

    // Filter out entries with all null vital signs
    const filteredData = vitalsHistory.filter(vital => 
      vital.heartRate !== null ||
      vital.bloodPressureSystolic !== null ||
      vital.bloodPressureDiastolic !== null ||
      vital.temperature !== null ||
      vital.oxygenLevel !== null
    );

    // Apply filters
    let filtered = filteredData;

    // Date range filter
    if (dateRange !== "all") {
      const now = new Date();
      const days = parseInt(dateRange);
      const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      
      filtered = filtered.filter(vital => 
        new Date(vital.timestamp) >= cutoffDate
      );
    }

    // Type filter
    if (filterType !== "all") {
      filtered = filtered.filter(vital => {
        switch (filterType) {
          case "heartRate":
            return vital.heartRate !== null;
          case "bloodPressure":
            return vital.bloodPressureSystolic !== null || vital.bloodPressureDiastolic !== null;
          case "temperature":
            return vital.temperature !== null;
          case "oxygen":
            return vital.oxygenLevel !== null;
          default:
            return true;
        }
      });
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(vital => 
        vital.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        new Date(vital.timestamp).toLocaleDateString().includes(searchTerm)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [vitalsHistory, searchTerm, filterType, sortOrder, dateRange]);

  const getVitalIcon = (type: string) => {
    switch (type) {
      case "heartRate":
        return <Heart className="h-4 w-4 text-red-500" />;
      case "bloodPressure":
        return <Activity className="h-4 w-4 text-blue-500" />;
      case "temperature":
        return <Thermometer className="h-4 w-4 text-amber-500" />;
      case "oxygen":
        return <Wind className="h-4 w-4 text-cyan-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getVitalStatus = (type: string, value: number) => {
    switch (type) {
      case "heartRate":
        if (value < 60) return { status: "low", color: "text-red-600 bg-red-50 dark:bg-red-900/20" };
        if (value > 100) return { status: "high", color: "text-red-600 bg-red-50 dark:bg-red-900/20" };
        return { status: "normal", color: "text-green-600 bg-green-50 dark:bg-green-900/20" };
      case "systolic":
        if (value >= 140) return { status: "high", color: "text-red-600 bg-red-50 dark:bg-red-900/20" };
        if (value < 90) return { status: "low", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" };
        return { status: "normal", color: "text-green-600 bg-green-50 dark:bg-green-900/20" };
      case "temperature":
        if (value > 100.4) return { status: "fever", color: "text-red-600 bg-red-50 dark:bg-red-900/20" };
        if (value < 96.8) return { status: "low", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" };
        return { status: "normal", color: "text-green-600 bg-green-50 dark:bg-green-900/20" };
      case "oxygen":
        if (value < 95) return { status: "low", color: "text-red-600 bg-red-50 dark:bg-red-900/20" };
        return { status: "normal", color: "text-green-600 bg-green-50 dark:bg-green-900/20" };
      default:
        return { status: "normal", color: "text-gray-600 bg-gray-50 dark:bg-gray-900/20" };
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 48) {
      return `Yesterday ${date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    }
  };

  const exportData = () => {
    const csvContent = [
      "Date,Time,Patient ID,Heart Rate,Blood Pressure,Temperature,Oxygen Level",
      ...processedHistory.map(vital => {
        const date = new Date(vital.timestamp);
        const bloodPressure = vital.bloodPressureSystolic && vital.bloodPressureDiastolic 
          ? `${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic}`
          : "";
        
        return [
          date.toLocaleDateString(),
          date.toLocaleTimeString(),
          vital.patientId,
          vital.heartRate || "",
          bloodPressure,
          vital.temperature || "",
          vital.oxygenLevel || ""
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vital-signs-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-300">Loading history...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
        <CardContent className="p-6">
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400">Failed to load vital signs history</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
            <History className="h-5 w-5 text-blue-500" />
            <span>Vital Signs History</span>
          </CardTitle>
          <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
            {processedHistory.length} records
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Readings</SelectItem>
              <SelectItem value="heartRate">Heart Rate</SelectItem>
              <SelectItem value="bloodPressure">Blood Pressure</SelectItem>
              <SelectItem value="temperature">Temperature</SelectItem>
              <SelectItem value="oxygen">Blood Oxygen</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger>
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="1">Last 24 hours</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex space-x-2">
            <Button
              onClick={() => createSampleDataMutation.mutate()}
              variant="outline"
              size="sm"
              disabled={createSampleDataMutation.isPending}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>{createSampleDataMutation.isPending ? "Creating..." : "Add Sample"}</span>
            </Button>
            <Button
              onClick={exportData}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setSortOrder("newest")}
              variant={sortOrder === "newest" ? "default" : "outline"}
              size="sm"
            >
              <TrendingDown className="h-4 w-4 mr-1" />
              Newest First
            </Button>
            <Button
              onClick={() => setSortOrder("oldest")}
              variant={sortOrder === "oldest" ? "default" : "outline"}
              size="sm"
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              Oldest First
            </Button>
          </div>
        </div>

        {/* History List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {processedHistory.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <History className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">No vital signs records found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Records with valid readings will appear here
              </p>
            </div>
          ) : (
            processedHistory.map((vital) => (
              <div
                key={vital.id}
                className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Patient {vital.patientId}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(vital.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {vital.heartRate && (
                    <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-2">
                        {getVitalIcon("heartRate")}
                        <span className="text-sm text-gray-600 dark:text-gray-300">HR</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {vital.heartRate} BPM
                        </p>
                        <div className={`text-xs px-2 py-1 rounded-full ${getVitalStatus("heartRate", vital.heartRate).color}`}>
                          {getVitalStatus("heartRate", vital.heartRate).status}
                        </div>
                      </div>
                    </div>
                  )}

                  {(vital.bloodPressureSystolic || vital.bloodPressureDiastolic) && (
                    <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-2">
                        {getVitalIcon("bloodPressure")}
                        <span className="text-sm text-gray-600 dark:text-gray-300">BP</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {vital.bloodPressureSystolic || "—"}/{vital.bloodPressureDiastolic || "—"}
                        </p>
                        {vital.bloodPressureSystolic && (
                          <div className={`text-xs px-2 py-1 rounded-full ${getVitalStatus("systolic", vital.bloodPressureSystolic).color}`}>
                            {getVitalStatus("systolic", vital.bloodPressureSystolic).status}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {vital.temperature && (
                    <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-2">
                        {getVitalIcon("temperature")}
                        <span className="text-sm text-gray-600 dark:text-gray-300">Temp</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {vital.temperature}°F
                        </p>
                        <div className={`text-xs px-2 py-1 rounded-full ${getVitalStatus("temperature", vital.temperature).color}`}>
                          {getVitalStatus("temperature", vital.temperature).status}
                        </div>
                      </div>
                    </div>
                  )}

                  {vital.oxygenLevel && (
                    <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-2">
                        {getVitalIcon("oxygen")}
                        <span className="text-sm text-gray-600 dark:text-gray-300">SpO2</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {vital.oxygenLevel}%
                        </p>
                        <div className={`text-xs px-2 py-1 rounded-full ${getVitalStatus("oxygen", vital.oxygenLevel).color}`}>
                          {getVitalStatus("oxygen", vital.oxygenLevel).status}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}