import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Droplet, Thermometer, Wind, RefreshCw, Activity } from "lucide-react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function VitalSignsCard() {
  const [vitals, setVitals] = useState({
    heartRate: 72,
    bloodPressure: { systolic: 120, diastolic: 80 },
    temperature: 98.6,
    oxygenLevel: 98,
  });

  const [isLive, setIsLive] = useState(true);

  // Simulate real-time updates
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setVitals(prev => ({
        heartRate: Math.max(60, Math.min(100, prev.heartRate + (Math.random() - 0.5) * 4)),
        bloodPressure: {
          systolic: Math.max(110, Math.min(140, prev.bloodPressure.systolic + (Math.random() - 0.5) * 6)),
          diastolic: Math.max(70, Math.min(90, prev.bloodPressure.diastolic + (Math.random() - 0.5) * 4)),
        },
        temperature: Math.max(97.0, Math.min(100.0, prev.temperature + (Math.random() - 0.5) * 0.2)),
        oxygenLevel: Math.max(95, Math.min(100, prev.oxygenLevel + (Math.random() - 0.5) * 2)),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [isLive]);

  // Chart data
  const chartData = {
    labels: ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM'],
    datasets: [
      {
        label: 'Heart Rate (BPM)',
        data: [68, 72, 75, 71, 69, vitals.heartRate],
        borderColor: 'hsl(var(--alert-red))',
        backgroundColor: 'hsl(var(--alert-red) / 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Blood Pressure (Systolic)',
        data: [118, 120, 125, 122, 119, vitals.bloodPressure.systolic],
        borderColor: 'hsl(var(--medical-blue))',
        backgroundColor: 'hsl(var(--medical-blue) / 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
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
        beginAtZero: false,
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

  const getVitalStatus = (type: string, value: number) => {
    switch (type) {
      case 'heartRate':
        return value >= 60 && value <= 100 ? 'normal' : 'abnormal';
      case 'systolic':
        return value < 140 ? 'normal' : 'abnormal';
      case 'diastolic':
        return value < 90 ? 'normal' : 'abnormal';
      case 'temperature':
        return value >= 97.0 && value <= 100.4 ? 'normal' : 'abnormal';
      case 'oxygen':
        return value >= 95 ? 'normal' : 'abnormal';
      default:
        return 'normal';
    }
  };

  const getProgressWidth = (type: string, value: number) => {
    switch (type) {
      case 'heartRate':
        return Math.min(100, (value / 100) * 100);
      case 'systolic':
        return Math.min(100, (value / 140) * 100);
      case 'temperature':
        return Math.min(100, ((value - 95) / 6) * 100);
      case 'oxygen':
        return value;
      default:
        return 75;
    }
  };

  return (
    <Card className="medical-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-foreground">
            Current Vital Signs
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge className={`${isLive ? 'bg-healthcare-green' : 'bg-muted'} text-white`}>
              <Activity className="w-3 h-3 mr-1" />
              {isLive ? 'Live' : 'Paused'}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLive(!isLive)}
              className="hover:bg-muted"
            >
              <RefreshCw className={`h-4 w-4 ${isLive ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Vital Signs Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Heart Rate */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Heart className="text-alert-red h-5 w-5" />
              <span className="text-xs text-muted-foreground">BPM</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {Math.round(vitals.heartRate)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Heart Rate</p>
            <div className="mt-2 h-1 bg-border rounded-full overflow-hidden">
              <div
                className={`h-1 rounded-full transition-all duration-500 ${
                  getVitalStatus('heartRate', vitals.heartRate) === 'normal'
                    ? 'bg-healthcare-green'
                    : 'bg-alert-red'
                }`}
                style={{ width: `${getProgressWidth('heartRate', vitals.heartRate)}%` }}
              />
            </div>
          </div>

          {/* Blood Pressure */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Droplet className="text-medical-blue h-5 w-5" />
              <span className="text-xs text-muted-foreground">mmHg</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {Math.round(vitals.bloodPressure.systolic)}/{Math.round(vitals.bloodPressure.diastolic)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Blood Pressure</p>
            <div className="mt-2 h-1 bg-border rounded-full overflow-hidden">
              <div
                className={`h-1 rounded-full transition-all duration-500 ${
                  getVitalStatus('systolic', vitals.bloodPressure.systolic) === 'normal'
                    ? 'bg-healthcare-green'
                    : 'bg-alert-red'
                }`}
                style={{ width: `${getProgressWidth('systolic', vitals.bloodPressure.systolic)}%` }}
              />
            </div>
          </div>

          {/* Temperature */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Thermometer className="text-amber-500 h-5 w-5" />
              <span className="text-xs text-muted-foreground">°F</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {vitals.temperature.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Temperature</p>
            <div className="mt-2 h-1 bg-border rounded-full overflow-hidden">
              <div
                className={`h-1 rounded-full transition-all duration-500 ${
                  getVitalStatus('temperature', vitals.temperature) === 'normal'
                    ? 'bg-healthcare-green'
                    : 'bg-alert-red'
                }`}
                style={{ width: `${getProgressWidth('temperature', vitals.temperature)}%` }}
              />
            </div>
          </div>

          {/* Oxygen Level */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Wind className="text-cyan-500 h-5 w-5" />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {Math.round(vitals.oxygenLevel)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Oxygen Level</p>
            <div className="mt-2 h-1 bg-border rounded-full overflow-hidden">
              <div
                className={`h-1 rounded-full transition-all duration-500 ${
                  getVitalStatus('oxygen', vitals.oxygenLevel) === 'normal'
                    ? 'bg-healthcare-green'
                    : 'bg-alert-red'
                }`}
                style={{ width: `${vitals.oxygenLevel}%` }}
              />
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64">
          <Line data={chartData} options={chartOptions} />
        </div>
      </CardContent>
    </Card>
  );
}
