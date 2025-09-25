import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Activity, TrendingUp, TrendingDown, AlertTriangle, Calendar, Clock } from 'lucide-react';

interface VitalSigns {
  id: number;
  heartRate: number;
  timestamp: string;
}

interface HeartRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentHeartRate: number;
  vitalsHistory: VitalSigns[];
  deviceId?: string;
}

export default function HeartRateModal({ 
  isOpen, 
  onClose, 
  currentHeartRate, 
  vitalsHistory,
  deviceId = 'HC03-002' 
}: HeartRateModalProps) {
  
  // Get recent heart rate data (last 24 hours)
  const getRecentHeartRateData = () => {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    return vitalsHistory
      .filter(vital => new Date(vital.timestamp) >= last24Hours && vital.heartRate > 0)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-20); // Last 20 readings
  };

  const recentData = getRecentHeartRateData();
  
  // Calculate heart rate zone
  const getHeartRateZone = (hr: number) => {
    if (hr < 60) return { zone: 'Bradycardia', color: 'bg-blue-100 text-blue-800', risk: 'low' };
    if (hr <= 70) return { zone: 'Resting', color: 'bg-green-100 text-green-800', risk: 'normal' };
    if (hr <= 85) return { zone: 'Active', color: 'bg-yellow-100 text-yellow-800', risk: 'normal' };
    if (hr <= 100) return { zone: 'Elevated', color: 'bg-orange-100 text-orange-800', risk: 'moderate' };
    return { zone: 'Tachycardia', color: 'bg-red-100 text-red-800', risk: 'high' };
  };

  const currentZone = getHeartRateZone(currentHeartRate);
  
  // Calculate trend
  const getTrend = () => {
    if (recentData.length < 2) return { direction: 'stable', change: 0 };
    
    const recent = recentData.slice(-5);
    const older = recentData.slice(-10, -5);
    
    if (older.length === 0) return { direction: 'stable', change: 0 };
    
    const recentAvg = recent.reduce((sum, d) => sum + d.heartRate, 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => sum + d.heartRate, 0) / older.length;
    
    const change = recentAvg - olderAvg;
    
    if (Math.abs(change) < 3) return { direction: 'stable', change: Math.round(change) };
    return { direction: change > 0 ? 'increasing' : 'decreasing', change: Math.round(change) };
  };

  const trend = getTrend();

  // Get min/max/avg for today
  const todaysStats = () => {
    if (recentData.length === 0) return { min: currentHeartRate, max: currentHeartRate, avg: currentHeartRate };
    
    const rates = recentData.map(d => d.heartRate);
    return {
      min: Math.min(...rates),
      max: Math.max(...rates),
      avg: Math.round(rates.reduce((sum, rate) => sum + rate, 0) / rates.length)
    };
  };

  const stats = todaysStats();

  // Simple chart visualization (text-based for now)
  const renderMiniChart = () => {
    if (recentData.length < 2) return null;
    
    const chartData = recentData.slice(-12); // Last 12 readings
    const maxRate = Math.max(...chartData.map(d => d.heartRate));
    const minRate = Math.min(...chartData.map(d => d.heartRate));
    const range = maxRate - minRate || 1;
    
    return (
      <div className="mt-4">
        <h4 className="font-medium text-gray-800 mb-2">Recent Trend (Last 12 readings)</h4>
        <div className="flex items-end justify-between h-20 bg-gray-50 rounded-lg p-2 space-x-1">
          {chartData.map((data, index) => {
            const height = ((data.heartRate - minRate) / range) * 60 + 10; // Min 10px height
            const isHigh = data.heartRate > 100;
            const isLow = data.heartRate < 60;
            
            return (
              <div
                key={index}
                className={`w-full rounded-t ${isHigh ? 'bg-red-400' : isLow ? 'bg-blue-400' : 'bg-green-400'} transition-all hover:opacity-80`}
                style={{ height: `${height}px` }}
                title={`${data.heartRate} BPM at ${new Date(data.timestamp).toLocaleTimeString()}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{minRate} BPM</span>
          <span>{maxRate} BPM</span>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-heart-rate">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Heart className="w-6 h-6 text-red-500" />
            <span>Heart Rate Monitor</span>
            <Badge variant="outline" className="ml-2">{deviceId}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Reading */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Reading</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-4xl font-bold text-gray-800">
                    {currentHeartRate} 
                    <span className="text-lg text-gray-500 ml-1">BPM</span>
                  </div>
                  <div className="flex flex-col">
                    <Badge className={currentZone.color}>{currentZone.zone}</Badge>
                    <div className="flex items-center mt-2 text-sm text-gray-600">
                      {trend.direction === 'increasing' ? (
                        <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                      ) : trend.direction === 'decreasing' ? (
                        <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                      ) : (
                        <Activity className="w-4 h-4 text-gray-500 mr-1" />
                      )}
                      <span>
                        {trend.direction === 'stable' ? 'Stable' : 
                         `${trend.direction} by ${Math.abs(trend.change)} BPM`}
                      </span>
                    </div>
                  </div>
                </div>
                {currentZone.risk === 'high' && (
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Today's Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Today's Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-semibold text-blue-600">{stats.min}</div>
                  <div className="text-sm text-gray-600">Minimum</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-green-600">{stats.avg}</div>
                  <div className="text-sm text-gray-600">Average</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-red-600">{stats.max}</div>
                  <div className="text-sm text-gray-600">Maximum</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Heart Rate Zones Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Heart Rate Zones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                  <span className="font-medium">Bradycardia</span>
                  <span className="text-sm text-gray-600">&lt; 60 BPM</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                  <span className="font-medium">Resting</span>
                  <span className="text-sm text-gray-600">60-70 BPM</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                  <span className="font-medium">Active</span>
                  <span className="text-sm text-gray-600">71-85 BPM</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                  <span className="font-medium">Elevated</span>
                  <span className="text-sm text-gray-600">86-100 BPM</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                  <span className="font-medium">Tachycardia</span>
                  <span className="text-sm text-gray-600">&gt; 100 BPM</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chart */}
          {renderMiniChart()}

          {/* Recent Readings */}
          {recentData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Recent Readings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {recentData.slice(-10).reverse().map((reading, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">{reading.heartRate} BPM</span>
                      <div className="text-sm text-gray-600">
                        {new Date(reading.timestamp).toLocaleString()}
                      </div>
                      <Badge className={getHeartRateZone(reading.heartRate).color} variant="secondary">
                        {getHeartRateZone(reading.heartRate).zone}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} data-testid="button-close-heart-rate-modal">
              Close
            </Button>
            <Button 
              onClick={() => alert('Export functionality would save heart rate data to PDF/CSV')}
              data-testid="button-export-heart-rate"
            >
              Export Data
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}