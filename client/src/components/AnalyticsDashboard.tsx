import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function AnalyticsDashboard() {
  const analyticsData = {
    completedCheckups: 156,
    missedCheckups: 12,
    adherenceRate: 92.8,
  };

  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Completed',
        data: [23, 19, 25, 22, 28, 15, 18],
        backgroundColor: 'hsl(var(--healthcare-green))',
        borderRadius: 4,
      },
      {
        label: 'Missed',
        data: [2, 3, 1, 2, 1, 4, 2],
        backgroundColor: 'hsl(var(--alert-red))',
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'hsl(var(--border))',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <Card className="medical-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-foreground">
            Patient Analytics
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Select defaultValue="7days">
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="3months">Last 3 months</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" className="hover:bg-muted">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Analytics Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-2xl font-bold text-medical-blue">
              {analyticsData.completedCheckups}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Completed Check-ups
            </p>
          </div>
          
          <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-2xl font-bold text-alert-red">
              {analyticsData.missedCheckups}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Missed Check-ups
            </p>
          </div>
          
          <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-2xl font-bold text-healthcare-green">
              {analyticsData.adherenceRate}%
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Adherence Rate
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64">
          <Bar data={chartData} options={chartOptions} />
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Weekly Trend</span>
              <span className="text-sm font-medium text-healthcare-green">+5.2%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Best Day</span>
              <span className="text-sm font-medium text-foreground">Friday</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Average Daily</span>
              <span className="text-sm font-medium text-foreground">21 check-ups</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Improvement</span>
              <span className="text-sm font-medium text-healthcare-green">+12% vs last week</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
