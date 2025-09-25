import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, TrendingUp, TrendingDown, AlertTriangle, Calendar, Clock, Heart } from 'lucide-react';

interface VitalSigns {
  id: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  timestamp: string;
}

interface BloodPressureModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBloodPressure: string;
  vitalsHistory: VitalSigns[];
  deviceId?: string;
}

export default function BloodPressureModal({ 
  isOpen, 
  onClose, 
  currentBloodPressure, 
  vitalsHistory,
  deviceId = 'HC03-001' 
}: BloodPressureModalProps) {
  
  // Parse current blood pressure
  const parseCurrentBP = () => {
    const parts = currentBloodPressure?.split('/') || ['120', '80'];
    return {
      systolic: parseInt(parts[0]) || 120,
      diastolic: parseInt(parts[1]) || 80
    };
  };

  const currentBP = parseCurrentBP();
  
  // Get recent blood pressure data
  const getRecentBPData = () => {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    return vitalsHistory
      .filter(vital => 
        new Date(vital.timestamp) >= last24Hours && 
        vital.bloodPressureSystolic > 0 && 
        vital.bloodPressureDiastolic > 0
      )
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-20);
  };

  const recentData = getRecentBPData();
  
  // Calculate blood pressure category
  const getBPCategory = (systolic: number, diastolic: number) => {
    if (systolic < 120 && diastolic < 80) {
      return { category: 'Normal', color: 'bg-green-100 text-green-800', risk: 'low' };
    }
    if (systolic <= 129 && diastolic < 80) {
      return { category: 'Elevated', color: 'bg-yellow-100 text-yellow-800', risk: 'moderate' };
    }
    if ((systolic >= 130 && systolic <= 139) || (diastolic >= 80 && diastolic <= 89)) {
      return { category: 'High Stage 1', color: 'bg-orange-100 text-orange-800', risk: 'moderate' };
    }
    if (systolic >= 140 || diastolic >= 90) {
      return { category: 'High Stage 2', color: 'bg-red-100 text-red-800', risk: 'high' };
    }
    if (systolic > 180 || diastolic > 120) {
      return { category: 'Crisis', color: 'bg-red-200 text-red-900', risk: 'critical' };
    }
    return { category: 'Normal', color: 'bg-green-100 text-green-800', risk: 'low' };
  };

  const currentCategory = getBPCategory(currentBP.systolic, currentBP.diastolic);
  
  // Calculate trends
  const getTrend = () => {
    if (recentData.length < 2) return { 
      systolic: { direction: 'stable', change: 0 }, 
      diastolic: { direction: 'stable', change: 0 } 
    };
    
    const recent = recentData.slice(-5);
    const older = recentData.slice(-10, -5);
    
    if (older.length === 0) return { 
      systolic: { direction: 'stable', change: 0 }, 
      diastolic: { direction: 'stable', change: 0 } 
    };
    
    const recentSystolicAvg = recent.reduce((sum, d) => sum + d.bloodPressureSystolic, 0) / recent.length;
    const olderSystolicAvg = older.reduce((sum, d) => sum + d.bloodPressureSystolic, 0) / older.length;
    const systolicChange = recentSystolicAvg - olderSystolicAvg;
    
    const recentDiastolicAvg = recent.reduce((sum, d) => sum + d.bloodPressureDiastolic, 0) / recent.length;
    const olderDiastolicAvg = older.reduce((sum, d) => sum + d.bloodPressureDiastolic, 0) / older.length;
    const diastolicChange = recentDiastolicAvg - olderDiastolicAvg;
    
    return {
      systolic: {
        direction: Math.abs(systolicChange) < 3 ? 'stable' : (systolicChange > 0 ? 'increasing' : 'decreasing'),
        change: Math.round(systolicChange)
      },
      diastolic: {
        direction: Math.abs(diastolicChange) < 3 ? 'stable' : (diastolicChange > 0 ? 'increasing' : 'decreasing'),
        change: Math.round(diastolicChange)
      }
    };
  };

  const trends = getTrend();

  // Get statistics for today
  const todaysStats = () => {
    if (recentData.length === 0) {
      return {
        systolic: { min: currentBP.systolic, max: currentBP.systolic, avg: currentBP.systolic },
        diastolic: { min: currentBP.diastolic, max: currentBP.diastolic, avg: currentBP.diastolic }
      };
    }
    
    const systolicReadings = recentData.map(d => d.bloodPressureSystolic);
    const diastolicReadings = recentData.map(d => d.bloodPressureDiastolic);
    
    return {
      systolic: {
        min: Math.min(...systolicReadings),
        max: Math.max(...systolicReadings),
        avg: Math.round(systolicReadings.reduce((sum, reading) => sum + reading, 0) / systolicReadings.length)
      },
      diastolic: {
        min: Math.min(...diastolicReadings),
        max: Math.max(...diastolicReadings),
        avg: Math.round(diastolicReadings.reduce((sum, reading) => sum + reading, 0) / diastolicReadings.length)
      }
    };
  };

  const stats = todaysStats();

  // Simple chart visualization
  const renderBPChart = () => {
    if (recentData.length < 2) return null;
    
    const chartData = recentData.slice(-10);
    const maxSystolic = Math.max(...chartData.map(d => d.bloodPressureSystolic));
    const minSystolic = Math.min(...chartData.map(d => d.bloodPressureSystolic));
    const systolicRange = maxSystolic - minSystolic || 1;
    
    return (
      <div className="mt-4">
        <h4 className="font-medium text-gray-800 mb-2">Recent Trend (Last 10 readings)</h4>
        <div className="space-y-3">
          {/* Systolic Chart */}
          <div>
            <div className="text-sm font-medium text-gray-600 mb-1">Systolic Pressure</div>
            <div className="flex items-end justify-between h-16 bg-red-50 rounded-lg p-2 space-x-1">
              {chartData.map((data, index) => {
                const height = ((data.bloodPressureSystolic - minSystolic) / systolicRange) * 48 + 8;
                const category = getBPCategory(data.bloodPressureSystolic, data.bloodPressureDiastolic);
                
                return (
                  <div
                    key={index}
                    className={`w-full rounded-t transition-all hover:opacity-80 ${
                      category.risk === 'high' || category.risk === 'critical' ? 'bg-red-400' : 
                      category.risk === 'moderate' ? 'bg-yellow-400' : 'bg-green-400'
                    }`}
                    style={{ height: `${height}px` }}
                    title={`${data.bloodPressureSystolic}/${data.bloodPressureDiastolic} mmHg at ${new Date(data.timestamp).toLocaleTimeString()}`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{minSystolic}</span>
              <span>{maxSystolic}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getPulse = () => {
    return currentBP.systolic - currentBP.diastolic;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-blood-pressure">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Heart className="w-6 h-6 text-red-500" />
            <span>Blood Pressure Monitor</span>
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
                    {currentBP.systolic}/{currentBP.diastolic}
                    <span className="text-lg text-gray-500 ml-1">mmHg</span>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Badge className={currentCategory.color}>{currentCategory.category}</Badge>
                    <div className="text-sm text-gray-600">
                      Pulse Pressure: <span className="font-medium">{getPulse()} mmHg</span>
                    </div>
                  </div>
                </div>
                {currentCategory.risk === 'high' || currentCategory.risk === 'critical' ? (
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                ) : null}
              </div>
              
              {/* Trends */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Systolic:</span>
                  {trends.systolic.direction === 'increasing' ? (
                    <TrendingUp className="w-4 h-4 text-red-500" />
                  ) : trends.systolic.direction === 'decreasing' ? (
                    <TrendingDown className="w-4 h-4 text-green-500" />
                  ) : (
                    <Activity className="w-4 h-4 text-gray-500" />
                  )}
                  <span className="text-sm text-gray-600">
                    {trends.systolic.direction === 'stable' ? 'Stable' : 
                     `${trends.systolic.direction} by ${Math.abs(trends.systolic.change)}`}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Diastolic:</span>
                  {trends.diastolic.direction === 'increasing' ? (
                    <TrendingUp className="w-4 h-4 text-red-500" />
                  ) : trends.diastolic.direction === 'decreasing' ? (
                    <TrendingDown className="w-4 h-4 text-green-500" />
                  ) : (
                    <Activity className="w-4 h-4 text-gray-500" />
                  )}
                  <span className="text-sm text-gray-600">
                    {trends.diastolic.direction === 'stable' ? 'Stable' : 
                     `${trends.diastolic.direction} by ${Math.abs(trends.diastolic.change)}`}
                  </span>
                </div>
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
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Systolic (mmHg)</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <div className="text-xl font-semibold text-blue-600">{stats.systolic.min}</div>
                      <div className="text-xs text-gray-600">Min</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-semibold text-green-600">{stats.systolic.avg}</div>
                      <div className="text-xs text-gray-600">Avg</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-semibold text-red-600">{stats.systolic.max}</div>
                      <div className="text-xs text-gray-600">Max</div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Diastolic (mmHg)</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <div className="text-xl font-semibold text-blue-600">{stats.diastolic.min}</div>
                      <div className="text-xs text-gray-600">Min</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-semibold text-green-600">{stats.diastolic.avg}</div>
                      <div className="text-xs text-gray-600">Avg</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-semibold text-red-600">{stats.diastolic.max}</div>
                      <div className="text-xs text-gray-600">Max</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Blood Pressure Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Blood Pressure Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                  <span className="font-medium">Normal</span>
                  <span className="text-sm text-gray-600">&lt; 120/80</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                  <span className="font-medium">Elevated</span>
                  <span className="text-sm text-gray-600">120-129/&lt;80</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                  <span className="font-medium">High Stage 1</span>
                  <span className="text-sm text-gray-600">130-139/80-89</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                  <span className="font-medium">High Stage 2</span>
                  <span className="text-sm text-gray-600">≥140/90</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-red-100 rounded">
                  <span className="font-medium">Crisis</span>
                  <span className="text-sm text-gray-600">&gt;180/120</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chart */}
          {renderBPChart()}

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
                  {recentData.slice(-10).reverse().map((reading, index) => {
                    const category = getBPCategory(reading.bloodPressureSystolic, reading.bloodPressureDiastolic);
                    return (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="font-medium">
                          {reading.bloodPressureSystolic}/{reading.bloodPressureDiastolic} mmHg
                        </span>
                        <div className="text-sm text-gray-600">
                          {new Date(reading.timestamp).toLocaleString()}
                        </div>
                        <Badge className={category.color} variant="secondary">
                          {category.category}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} data-testid="button-close-blood-pressure-modal">
              Close
            </Button>
            <Button 
              onClick={() => alert('Export functionality would save blood pressure data to PDF/CSV')}
              data-testid="button-export-blood-pressure"
            >
              Export Data
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}