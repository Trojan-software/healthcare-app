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
import { hc03Sdk, Detection } from "@/lib/hc03-sdk";

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
    heartRate: 0,
    bloodPressure: { systolic: 0, diastolic: 0 },
    temperature: 0,
    oxygenLevel: 0,
  });

  const [isLive, setIsLive] = useState(true);
  const [history, setHistory] = useState({
    heartRate: [0, 0, 0, 0, 0, 0],
    systolic: [0, 0, 0, 0, 0, 0],
  });

  // Subscribe to HC03 device data
  useEffect(() => {
    if (!isLive) return;

    // Listen to blood oxygen (includes heart rate)
    hc03Sdk.setCallback(Detection.OX, (data: any) => {
      const oxyData = data.data;
      if (oxyData?.bloodOxygen > 0) {
        setVitals(prev => ({
          ...prev,
          oxygenLevel: oxyData.bloodOxygen,
          heartRate: oxyData.heartRate > 0 ? oxyData.heartRate : prev.heartRate,
        }));
        // Update heart rate history
        setHistory(prev => ({
          ...prev,
          heartRate: [...prev.heartRate.slice(1), oxyData.heartRate || prev.heartRate[5]],
        }));
      }
    });

    // Listen to blood pressure
    hc03Sdk.setCallback(Detection.BP, (data: any) => {
      const bpData = data.data;
      if (bpData?.ps > 0 && bpData?.pd > 0) {
        setVitals(prev => ({
          ...prev,
          bloodPressure: { systolic: bpData.ps, diastolic: bpData.pd },
          heartRate: bpData.hr > 0 ? bpData.hr : prev.heartRate,
        }));
        // Update systolic history
        setHistory(prev => ({
          ...prev,
          systolic: [...prev.systolic.slice(1), bpData.ps || prev.systolic[5]],
        }));
      }
    });

    // Listen to temperature
    hc03Sdk.setCallback(Detection.BT, (data: any) => {
      const tempData = data.data;
      if (tempData?.temperature > 0) {
        setVitals(prev => ({
          ...prev,
          temperature: tempData.temperature,
        }));
      }
    });

    return () => {
      hc03Sdk.removeCallback(Detection.OX);
      hc03Sdk.removeCallback(Detection.BP);
      hc03Sdk.removeCallback(Detection.BT);
    };
  }, [isLive]);

  // Chart data (using real device history)
  const chartData = {
    labels: ['T-5', 'T-4', 'T-3', 'T-2', 'T-1', 'Now'],
    datasets: [
      {
        label: 'Heart Rate (BPM)',
        data: history.heartRate,
        borderColor: 'hsl(var(--alert-red))',
        backgroundColor: 'hsl(var(--alert-red) / 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Blood Pressure (Systolic)',
        data: history.systolic,
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
