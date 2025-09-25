import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, TrendingUp, TrendingDown, AlertTriangle, Calendar, Clock, Lung } from 'lucide-react';

interface VitalSigns {
  id: number;
  oxygenLevel: number;
  timestamp: string;
}

interface OxygenLevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOxygenLevel: number;
  vitalsHistory: VitalSigns[];
  deviceId?: string;
}

export default function OxygenLevelModal({ 
  isOpen, 
  onClose, 
  currentOxygenLevel, 
  vitalsHistory,
  deviceId = 'HC03-003' 
}: OxygenLevelModalProps) {
  
  // Get recent oxygen level data
  const getRecentOxygenData = () => {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    return vitalsHistory
      .filter(vital => 
        new Date(vital.timestamp) >= last24Hours && 
        vital.oxygenLevel > 0 && 
        vital.oxygenLevel <= 100
      )
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-20);
  };

  const recentData = getRecentOxygenData();
  
  // Calculate oxygen saturation status
  const getOxygenStatus = (level: number) => {
    if (level >= 96) return { status: 'Normal', color: 'bg-green-100 text-green-800', risk: 'low', icon: '😊' };
    if (level >= 94) return { status: 'Mild Hypoxemia', color: 'bg-yellow-100 text-yellow-800', risk: 'low', icon: '😐' };
    if (level >= 90) return { status: 'Moderate Hypoxemia', color: 'bg-orange-100 text-orange-800', risk: 'moderate', icon: '😟' };
    if (level >= 85) return { status: 'Severe Hypoxemia', color: 'bg-red-100 text-red-800', risk: 'high', icon: '😰' };
    return { status: 'Critical Hypoxemia', color: 'bg-red-200 text-red-900', risk: 'critical', icon: '🚨' };
  };

  const currentStatus = getOxygenStatus(currentOxygenLevel);
  
  // Calculate trend
  const getTrend = () => {
    if (recentData.length < 2) return { direction: 'stable', change: 0 };
    
    const recent = recentData.slice(-5);
    const older = recentData.slice(-10, -5);
    
    if (older.length === 0) return { direction: 'stable', change: 0 };
    
    const recentAvg = recent.reduce((sum, d) => sum + d.oxygenLevel, 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => sum + d.oxygenLevel, 0) / older.length;
    
    const change = recentAvg - olderAvg;
    
    if (Math.abs(change) < 1) return { direction: 'stable', change: Math.round(change * 10) / 10 };
    return { direction: change > 0 ? 'improving' : 'declining', change: Math.round(change * 10) / 10 };
  };

  const trend = getTrend();

  // Get statistics for today
  const todaysStats = () => {
    if (recentData.length === 0) {
      return { min: currentOxygenLevel, max: currentOxygenLevel, avg: currentOxygenLevel };
    }
    
    const levels = recentData.map(d => d.oxygenLevel);
    return {
      min: Math.min(...levels),
      max: Math.max(...levels),
      avg: Math.round((levels.reduce((sum, level) => sum + level, 0) / levels.length) * 10) / 10
    };
  };

  const stats = todaysStats();

  // Simple chart visualization
  const renderOxygenChart = () => {
    if (recentData.length < 2) return null;
    
    const chartData = recentData.slice(-12);
    const maxLevel = Math.max(...chartData.map(d => d.oxygenLevel), 100);
    const minLevel = Math.max(Math.min(...chartData.map(d => d.oxygenLevel)) - 2, 80); // Min display at 80%
    const range = maxLevel - minLevel || 5;
    
    return (
      <div className="mt-4">
        <h4 className="font-medium text-gray-800 mb-2">Recent Trend (Last 12 readings)</h4>
        <div className="flex items-end justify-between h-20 bg-gray-50 rounded-lg p-2 space-x-1">
          {chartData.map((data, index) => {
            const height = ((data.oxygenLevel - minLevel) / range) * 60 + 10;
            const status = getOxygenStatus(data.oxygenLevel);
            
            return (
              <div
                key={index}
                className={`w-full rounded-t transition-all hover:opacity-80 ${
                  status.risk === 'critical' || status.risk === 'high' ? 'bg-red-400' : 
                  status.risk === 'moderate' ? 'bg-orange-400' : 
                  status.risk === 'low' && status.status !== 'Normal' ? 'bg-yellow-400' : 'bg-green-400'
                }`}
                style={{ height: `${height}px` }}
                title={`${data.oxygenLevel}% at ${new Date(data.timestamp).toLocaleTimeString()}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{minLevel}%</span>
          <span>{maxLevel}%</span>
        </div>
      </div>
    );
  };

  // Calculate time in hypoxemia
  const getHypoxemiaTime = () => {
    const hypoxemiaReadings = recentData.filter(d => d.oxygenLevel < 95);
    if (hypoxemiaReadings.length === 0) return null;

    const firstHypoxemia = hypoxemiaReadings[0];
    const lastHypoxemia = hypoxemiaReadings[hypoxemiaReadings.length - 1];
    const duration = new Date(lastHypoxemia.timestamp).getTime() - new Date(firstHypoxemia.timestamp).getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

    return {
      started: firstHypoxemia.timestamp,
      duration: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
      lowestLevel: Math.min(...hypoxemiaReadings.map(r => r.oxygenLevel)),
      readings: hypoxemiaReadings.length
    };
  };

  const hypoxemiaInfo = getHypoxemiaTime();

  // Get breathing rate estimation (simplified)
  const getBreathingInsights = () => {
    if (currentOxygenLevel >= 96) {
      return {
        status: 'Normal breathing efficiency',
        recommendation: 'Continue current activity level',
        color: 'text-green-700'
      };
    } else if (currentOxygenLevel >= 90) {
      return {
        status: 'Breathing may be slightly labored',
        recommendation: 'Consider rest and deep breathing exercises',
        color: 'text-orange-700'
      };
    } else {
      return {
        status: 'Breathing difficulty likely',
        recommendation: 'Rest immediately and consider medical attention',
        color: 'text-red-700'
      };
    }
  };

  const breathingInsights = getBreathingInsights();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-oxygen-level">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Lung className="w-6 h-6 text-blue-500" />
            <span>Oxygen Level Monitor</span>
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
                    {currentOxygenLevel}%
                    <div className="text-lg text-gray-500">SpO₂</div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{currentStatus.icon}</span>
                      <Badge className={currentStatus.color}>{currentStatus.status}</Badge>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      {trend.direction === 'improving' ? (
                        <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                      ) : trend.direction === 'declining' ? (
                        <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                      ) : (
                        <Activity className="w-4 h-4 text-gray-500 mr-1" />
                      )}
                      <span>
                        {trend.direction === 'stable' ? 'Stable' : 
                         `${trend.direction} by ${Math.abs(trend.change)}%`}
                      </span>
                    </div>
                  </div>
                </div>
                {(currentStatus.risk === 'high' || currentStatus.risk === 'critical') && (
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Hypoxemia Alert */}
          {hypoxemiaInfo && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center text-orange-800">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Low Oxygen Alert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Started:</span>
                    <div className="text-orange-700">
                      {new Date(hypoxemiaInfo.started).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span>
                    <div className="text-orange-700">{hypoxemiaInfo.duration}</div>
                  </div>
                  <div>
                    <span className="font-medium">Lowest Level:</span>
                    <div className="text-orange-700">{hypoxemiaInfo.lowestLevel}%</div>
                  </div>
                  <div>
                    <span className="font-medium">Low Readings:</span>
                    <div className="text-orange-700">{hypoxemiaInfo.readings}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Breathing Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Lung className="w-5 h-5 mr-2" />
                Breathing Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Status: </span>
                  <span className={breathingInsights.color}>{breathingInsights.status}</span>
                </div>
                <div>
                  <span className="font-medium">Recommendation: </span>
                  <span className={breathingInsights.color}>{breathingInsights.recommendation}</span>
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
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-semibold text-red-600">{stats.min}%</div>
                  <div className="text-sm text-gray-600">Minimum</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-green-600">{stats.avg}%</div>
                  <div className="text-sm text-gray-600">Average</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-blue-600">{stats.max}%</div>
                  <div className="text-sm text-gray-600">Maximum</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Oxygen Saturation Levels */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Oxygen Saturation Levels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                  <div className="flex items-center space-x-2">
                    <span>😊</span>
                    <span className="font-medium">Normal</span>
                  </div>
                  <span className="text-sm text-gray-600">96-100%</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                  <div className="flex items-center space-x-2">
                    <span>😐</span>
                    <span className="font-medium">Mild Hypoxemia</span>
                  </div>
                  <span className="text-sm text-gray-600">94-95%</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                  <div className="flex items-center space-x-2">
                    <span>😟</span>
                    <span className="font-medium">Moderate Hypoxemia</span>
                  </div>
                  <span className="text-sm text-gray-600">90-93%</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                  <div className="flex items-center space-x-2">
                    <span>😰</span>
                    <span className="font-medium">Severe Hypoxemia</span>
                  </div>
                  <span className="text-sm text-gray-600">85-89%</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-red-100 rounded">
                  <div className="flex items-center space-x-2">
                    <span>🚨</span>
                    <span className="font-medium">Critical Hypoxemia</span>
                  </div>
                  <span className="text-sm text-gray-600">&lt; 85%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chart */}
          {renderOxygenChart()}

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
                    const status = getOxygenStatus(reading.oxygenLevel);
                    return (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{status.icon}</span>
                          <span className="font-medium">{reading.oxygenLevel}% SpO₂</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(reading.timestamp).toLocaleString()}
                        </div>
                        <Badge className={status.color} variant="secondary">
                          {status.status}
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
            <Button variant="outline" onClick={onClose} data-testid="button-close-oxygen-level-modal">
              Close
            </Button>
            <Button 
              onClick={() => alert('Export functionality would save oxygen level data to PDF/CSV')}
              data-testid="button-export-oxygen-level"
            >
              Export Data
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}