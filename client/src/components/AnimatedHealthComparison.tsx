import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Heart, 
  Thermometer, 
  Droplets, 
  TrendingUp,
  TrendingDown,
  BarChart3,
  LineChart,
  Users,
  Play,
  Pause,
  RotateCcw,
  Settings,
  GitCompare,
  ArrowRight,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface ComparisonData {
  patientId: string;
  patientName: string;
  timeframe: string;
  metrics: {
    heartRate: { current: number; previous: number; trend: 'up' | 'down' | 'stable' };
    bloodPressure: { 
      systolic: { current: number; previous: number; trend: 'up' | 'down' | 'stable' };
      diastolic: { current: number; previous: number; trend: 'up' | 'down' | 'stable' };
    };
    bloodOxygen: { current: number; previous: number; trend: 'up' | 'down' | 'stable' };
    temperature: { current: number; previous: number; trend: 'up' | 'down' | 'stable' };
    riskScore: { current: number; previous: number; trend: 'up' | 'down' | 'stable' };
  };
  color: string;
}

interface AnimatedMetricProps {
  label: string;
  current: number;
  previous: number;
  trend: 'up' | 'down' | 'stable';
  unit: string;
  icon: React.ReactNode;
  color: string;
  animationDelay: number;
  isAnimating: boolean;
}

const AnimatedMetric: React.FC<AnimatedMetricProps> = ({
  label,
  current,
  previous,
  trend,
  unit,
  icon,
  color,
  animationDelay,
  isAnimating
}) => {
  const [displayValue, setDisplayValue] = useState(previous);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        animateValue(previous, current, 1500);
      }, animationDelay);
      return () => clearTimeout(timer);
    } else {
      setDisplayValue(current);
      setIsVisible(true);
    }
  }, [isAnimating, current, previous, animationDelay]);

  const animateValue = (start: number, end: number, duration: number) => {
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentValue = start + (end - start) * easeOutCubic;
      
      setDisplayValue(Math.round(currentValue * 100) / 100);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-4 h-4 text-red-500" />;
      case 'down': return <ArrowDown className="w-4 h-4 text-green-500" />;
      default: return <ArrowRight className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-red-600';
      case 'down': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getChangePercentage = () => {
    if (previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  return (
    <div 
      className={`transform transition-all duration-1000 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
      style={{ transitionDelay: `${animationDelay}ms` }}
    >
      <Card className="hover:shadow-lg transition-shadow duration-300" style={{ borderLeftColor: color, borderLeftWidth: '4px' }}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full" style={{ backgroundColor: `${color}20` }}>
                {icon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{label}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {displayValue.toFixed(label === 'Temperature' ? 1 : 0)}{unit}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center gap-1 mb-1">
                {getTrendIcon()}
                <span className={`text-sm font-medium ${getTrendColor()}`}>
                  {Math.abs(parseFloat(getChangePercentage()))}%
                </span>
              </div>
              <p className="text-xs text-gray-500">vs previous</p>
            </div>
          </div>
          
          {/* Progress bar showing change */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 rounded-full transition-all duration-1500 ease-out"
              style={{ 
                width: `${Math.min(Math.abs(parseFloat(getChangePercentage())) * 2, 100)}%`,
                backgroundColor: trend === 'up' ? '#ef4444' : trend === 'down' ? '#10b981' : '#6b7280'
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function AnimatedHealthComparison() {
  const [selectedPatients, setSelectedPatients] = useState<string[]>(['PAT001', 'PAT002']);
  const [timeframe, setTimeframe] = useState('7d');
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [comparisonMode, setComparisonMode] = useState<'patients' | 'timeframes'>('patients');

  // Fetch comparison data
  const { data: comparisonData, isLoading } = useQuery({
    queryKey: ['/api/admin/health-comparison', selectedPatients, timeframe, comparisonMode],
    refetchInterval: 30000,
  });

  // Fetch available patients for selection
  const { data: availablePatients } = useQuery({
    queryKey: ['/api/admin/patients-list'],
  });

  const mockComparisonData: ComparisonData[] = comparisonData || [
    {
      patientId: 'PAT001',
      patientName: 'Sarah Johnson',
      timeframe: '7d',
      metrics: {
        heartRate: { current: 78, previous: 82, trend: 'down' },
        bloodPressure: { 
          systolic: { current: 125, previous: 130, trend: 'down' },
          diastolic: { current: 82, previous: 85, trend: 'down' }
        },
        bloodOxygen: { current: 98, previous: 96, trend: 'up' },
        temperature: { current: 36.8, previous: 37.1, trend: 'down' },
        riskScore: { current: 25, previous: 35, trend: 'down' }
      },
      color: '#3b82f6'
    },
    {
      patientId: 'PAT002',
      patientName: 'Michael Chen',
      timeframe: '7d',
      metrics: {
        heartRate: { current: 85, previous: 78, trend: 'up' },
        bloodPressure: { 
          systolic: { current: 140, previous: 125, trend: 'up' },
          diastolic: { current: 90, previous: 82, trend: 'up' }
        },
        bloodOxygen: { current: 94, previous: 97, trend: 'down' },
        temperature: { current: 37.2, previous: 36.9, trend: 'up' },
        riskScore: { current: 65, previous: 45, trend: 'up' }
      },
      color: '#10b981'
    }
  ];

  const mockPatients = availablePatients || [
    { id: 'PAT001', name: 'Sarah Johnson' },
    { id: 'PAT002', name: 'Michael Chen' },
    { id: 'PAT003', name: 'Emma Davis' },
    { id: 'PAT004', name: 'James Wilson' },
    { id: 'PAT005', name: 'Lisa Anderson' }
  ];

  const startAnimation = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 3000 / animationSpeed);
  };

  const resetAnimation = () => {
    setIsAnimating(false);
    setTimeout(() => startAnimation(), 100);
  };

  const togglePatientSelection = (patientId: string) => {
    if (selectedPatients.includes(patientId)) {
      if (selectedPatients.length > 1) {
        setSelectedPatients(selectedPatients.filter(id => id !== patientId));
      }
    } else if (selectedPatients.length < 4) {
      setSelectedPatients([...selectedPatients, patientId]);
    }
  };

  const getMetricComparison = (metricName: string) => {
    return mockComparisonData.map(patient => ({
      patient: patient.patientName,
      value: metricName === 'bloodPressure' 
        ? `${patient.metrics.bloodPressure.systolic.current}/${patient.metrics.bloodPressure.diastolic.current}`
        : patient.metrics[metricName as keyof typeof patient.metrics].current,
      trend: metricName === 'bloodPressure' 
        ? patient.metrics.bloodPressure.systolic.trend
        : patient.metrics[metricName as keyof typeof patient.metrics].trend,
      color: patient.color
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            Animated Health Metrics Comparison
          </h2>
          <p className="text-gray-600 mt-1">Compare patient health metrics with real-time animations</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <select 
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          <select 
            value={animationSpeed}
            onChange={(e) => setAnimationSpeed(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="0.5">Slow Animation</option>
            <option value="1">Normal Speed</option>
            <option value="2">Fast Animation</option>
          </select>
          
          <Button onClick={startAnimation} variant="default" size="sm">
            <Play className="w-4 h-4 mr-2" />
            Animate
          </Button>
          
          <Button onClick={resetAnimation} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Patient Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Select Patients to Compare
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {mockPatients.map((patient: any) => (
              <button
                key={patient.id}
                onClick={() => togglePatientSelection(patient.id)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                  selectedPatients.includes(patient.id)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-sm">{patient.name}</div>
                <div className="text-xs text-gray-500">{patient.id}</div>
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-3">
            Select 1-4 patients to compare. Currently selected: {selectedPatients.length}
          </p>
        </CardContent>
      </Card>

      {/* Animated Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {mockComparisonData.map((patient, patientIndex) => (
          <div key={patient.patientId} className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: patient.color }}
              />
              <h3 className="text-xl font-semibold text-gray-900">{patient.patientName}</h3>
              <Badge variant="outline" className="text-xs">
                {patient.timeframe}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatedMetric
                label="Heart Rate"
                current={patient.metrics.heartRate.current}
                previous={patient.metrics.heartRate.previous}
                trend={patient.metrics.heartRate.trend}
                unit=" BPM"
                icon={<Heart className="w-5 h-5" style={{ color: patient.color }} />}
                color={patient.color}
                animationDelay={patientIndex * 200}
                isAnimating={isAnimating}
              />
              
              <AnimatedMetric
                label="Blood Oxygen"
                current={patient.metrics.bloodOxygen.current}
                previous={patient.metrics.bloodOxygen.previous}
                trend={patient.metrics.bloodOxygen.trend}
                unit="%"
                icon={<Droplets className="w-5 h-5" style={{ color: patient.color }} />}
                color={patient.color}
                animationDelay={patientIndex * 200 + 300}
                isAnimating={isAnimating}
              />
              
              <AnimatedMetric
                label="Systolic BP"
                current={patient.metrics.bloodPressure.systolic.current}
                previous={patient.metrics.bloodPressure.systolic.previous}
                trend={patient.metrics.bloodPressure.systolic.trend}
                unit=" mmHg"
                icon={<Activity className="w-5 h-5" style={{ color: patient.color }} />}
                color={patient.color}
                animationDelay={patientIndex * 200 + 600}
                isAnimating={isAnimating}
              />
              
              <AnimatedMetric
                label="Temperature"
                current={patient.metrics.temperature.current}
                previous={patient.metrics.temperature.previous}
                trend={patient.metrics.temperature.trend}
                unit="°C"
                icon={<Thermometer className="w-5 h-5" style={{ color: patient.color }} />}
                color={patient.color}
                animationDelay={patientIndex * 200 + 900}
                isAnimating={isAnimating}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Side-by-Side Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Side-by-Side Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="heartRate" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="heartRate">Heart Rate</TabsTrigger>
              <TabsTrigger value="bloodOxygen">Blood Oxygen</TabsTrigger>
              <TabsTrigger value="bloodPressure">Blood Pressure</TabsTrigger>
              <TabsTrigger value="temperature">Temperature</TabsTrigger>
            </TabsList>

            {['heartRate', 'bloodOxygen', 'bloodPressure', 'temperature'].map((metric) => (
              <TabsContent key={metric} value={metric} className="space-y-4">
                <div className="grid gap-4">
                  {getMetricComparison(metric).map((comparison: any, index: number) => (
                    <div 
                      key={comparison.patient}
                      className={`flex items-center justify-between p-4 rounded-lg border-l-4 transition-all duration-500 ${
                        isAnimating ? 'transform translate-x-0 opacity-100' : ''
                      }`}
                      style={{ 
                        borderLeftColor: comparison.color,
                        transitionDelay: `${index * 150}ms`
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: comparison.color }}
                        />
                        <span className="font-medium">{comparison.patient}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold">{comparison.value}</span>
                        {comparison.trend === 'up' && <TrendingUp className="w-4 h-4 text-red-500" />}
                        {comparison.trend === 'down' && <TrendingDown className="w-4 h-4 text-green-500" />}
                        {comparison.trend === 'stable' && <ArrowRight className="w-4 h-4 text-gray-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}