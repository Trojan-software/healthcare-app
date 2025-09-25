import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Thermometer, TrendingUp, TrendingDown, Activity, AlertTriangle, Calendar, Clock } from 'lucide-react';

interface VitalSigns {
  id: number;
  temperature: string;
  timestamp: string;
}

interface TemperatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTemperature: number;
  vitalsHistory: VitalSigns[];
  deviceId?: string;
}

export default function TemperatureModal({ 
  isOpen, 
  onClose, 
  currentTemperature, 
  vitalsHistory,
  deviceId = 'HC03-004' 
}: TemperatureModalProps) {
  
  // Get recent temperature data
  const getRecentTemperatureData = () => {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    return vitalsHistory
      .filter(vital => {
        const temp = parseFloat(vital.temperature);
        return new Date(vital.timestamp) >= last24Hours && !isNaN(temp) && temp > 0;
      })
      .map(vital => ({
        ...vital,
        temperatureValue: parseFloat(vital.temperature)
      }))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-20);
  };

  const recentData = getRecentTemperatureData();
  
  // Calculate temperature status
  const getTemperatureStatus = (temp: number) => {
    if (temp < 36.0) return { status: 'Hypothermia', color: 'bg-blue-100 text-blue-800', risk: 'high', icon: '🥶' };
    if (temp <= 37.2) return { status: 'Normal', color: 'bg-green-100 text-green-800', risk: 'low', icon: '😊' };
    if (temp <= 37.9) return { status: 'Mild Fever', color: 'bg-yellow-100 text-yellow-800', risk: 'moderate', icon: '🤒' };
    if (temp <= 39.0) return { status: 'Fever', color: 'bg-orange-100 text-orange-800', risk: 'moderate', icon: '🔥' };
    if (temp <= 41.0) return { status: 'High Fever', color: 'bg-red-100 text-red-800', risk: 'high', icon: '🚨' };
    return { status: 'Hyperthermia', color: 'bg-red-200 text-red-900', risk: 'critical', icon: '☠️' };
  };

  const currentStatus = getTemperatureStatus(currentTemperature);
  
  // Calculate trend
  const getTrend = () => {
    if (recentData.length < 2) return { direction: 'stable', change: 0 };
    
    const recent = recentData.slice(-5);
    const older = recentData.slice(-10, -5);
    
    if (older.length === 0) return { direction: 'stable', change: 0 };
    
    const recentAvg = recent.reduce((sum, d) => sum + d.temperatureValue, 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => sum + d.temperatureValue, 0) / older.length;
    
    const change = recentAvg - olderAvg;
    
    if (Math.abs(change) < 0.3) return { direction: 'stable', change: Math.round(change * 10) / 10 };
    return { direction: change > 0 ? 'increasing' : 'decreasing', change: Math.round(change * 10) / 10 };
  };

  const trend = getTrend();

  // Get statistics for today
  const todaysStats = () => {
    if (recentData.length === 0) {
      return { min: currentTemperature, max: currentTemperature, avg: currentTemperature };
    }
    
    const temps = recentData.map(d => d.temperatureValue);
    return {
      min: Math.round(Math.min(...temps) * 10) / 10,
      max: Math.round(Math.max(...temps) * 10) / 10,
      avg: Math.round((temps.reduce((sum, temp) => sum + temp, 0) / temps.length) * 10) / 10
    };
  };

  const stats = todaysStats();

  // Convert Celsius to Fahrenheit
  const celsiusToFahrenheit = (celsius: number) => {
    return Math.round((celsius * 9/5 + 32) * 10) / 10;
  };

  // Simple chart visualization
  const renderTemperatureChart = () => {
    if (recentData.length < 2) return null;
    
    const chartData = recentData.slice(-12);
    const maxTemp = Math.max(...chartData.map(d => d.temperatureValue));
    const minTemp = Math.min(...chartData.map(d => d.temperatureValue));
    const range = maxTemp - minTemp || 0.5; // Minimum range of 0.5°C for visualization
    
    return (
      <div className="mt-4">
        <h4 className="font-medium text-gray-800 mb-2">Recent Trend (Last 12 readings)</h4>
        <div className="flex items-end justify-between h-20 bg-gray-50 rounded-lg p-2 space-x-1">
          {chartData.map((data, index) => {
            const height = ((data.temperatureValue - minTemp) / range) * 60 + 10;
            const status = getTemperatureStatus(data.temperatureValue);
            
            return (
              <div
                key={index}
                className={`w-full rounded-t transition-all hover:opacity-80 ${
                  status.risk === 'critical' || status.risk === 'high' ? 'bg-red-400' : 
                  status.risk === 'moderate' ? 'bg-orange-400' : 
                  status.status === 'Hypothermia' ? 'bg-blue-400' : 'bg-green-400'
                }`}
                style={{ height: `${height}px` }}
                title={`${data.temperatureValue}°C at ${new Date(data.timestamp).toLocaleTimeString()}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{minTemp}°C</span>
          <span>{maxTemp}°C</span>
        </div>
      </div>
    );
  };

  // Get fever timeline
  const getFeverTimeline = () => {
    const feverReadings = recentData.filter(d => d.temperatureValue > 37.2);
    if (feverReadings.length === 0) return null;

    const firstFever = feverReadings[0];
    const lastFever = feverReadings[feverReadings.length - 1];
    const duration = new Date(lastFever.timestamp).getTime() - new Date(firstFever.timestamp).getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

    return {
      started: firstFever.timestamp,
      duration: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
      peakTemp: Math.max(...feverReadings.map(r => r.temperatureValue)),
      readings: feverReadings.length
    };
  };

  const feverInfo = getFeverTimeline();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-temperature">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Thermometer className="w-6 h-6 text-orange-500" />
            <span>Temperature Monitor</span>
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
                    {currentTemperature}°C
                    <div className="text-lg text-gray-500">
                      ({celsiusToFahrenheit(currentTemperature)}°F)
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{currentStatus.icon}</span>
                      <Badge className={currentStatus.color}>{currentStatus.status}</Badge>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      {trend.direction === 'increasing' ? (
                        <TrendingUp className="w-4 h-4 text-red-500 mr-1" />
                      ) : trend.direction === 'decreasing' ? (
                        <TrendingDown className="w-4 h-4 text-blue-500 mr-1" />
                      ) : (
                        <Activity className="w-4 h-4 text-gray-500 mr-1" />
                      )}
                      <span>
                        {trend.direction === 'stable' ? 'Stable' : 
                         `${trend.direction} by ${Math.abs(trend.change)}°C`}
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

          {/* Fever Alert */}
          {feverInfo && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center text-orange-800">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Fever Alert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Started:</span>
                    <div className="text-orange-700">
                      {new Date(feverInfo.started).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span>
                    <div className="text-orange-700">{feverInfo.duration}</div>
                  </div>
                  <div>
                    <span className="font-medium">Peak Temperature:</span>
                    <div className="text-orange-700">{feverInfo.peakTemp}°C</div>
                  </div>
                  <div>
                    <span className="font-medium">Fever Readings:</span>
                    <div className="text-orange-700">{feverInfo.readings}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
                  <div className="text-2xl font-semibold text-blue-600">{stats.min}°C</div>
                  <div className="text-sm text-gray-600">Minimum</div>
                  <div className="text-xs text-gray-500">({celsiusToFahrenheit(stats.min)}°F)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-green-600">{stats.avg}°C</div>
                  <div className="text-sm text-gray-600">Average</div>
                  <div className="text-xs text-gray-500">({celsiusToFahrenheit(stats.avg)}°F)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-red-600">{stats.max}°C</div>
                  <div className="text-sm text-gray-600">Maximum</div>
                  <div className="text-xs text-gray-500">({celsiusToFahrenheit(stats.max)}°F)</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Temperature Ranges */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Temperature Ranges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                  <div className="flex items-center space-x-2">
                    <span>🥶</span>
                    <span className="font-medium">Hypothermia</span>
                  </div>
                  <span className="text-sm text-gray-600">&lt; 36.0°C (96.8°F)</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                  <div className="flex items-center space-x-2">
                    <span>😊</span>
                    <span className="font-medium">Normal</span>
                  </div>
                  <span className="text-sm text-gray-600">36.0-37.2°C (96.8-99.0°F)</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-yellow-50 rounded">
                  <div className="flex items-center space-x-2">
                    <span>🤒</span>
                    <span className="font-medium">Mild Fever</span>
                  </div>
                  <span className="text-sm text-gray-600">37.3-37.9°C (99.1-100.2°F)</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                  <div className="flex items-center space-x-2">
                    <span>🔥</span>
                    <span className="font-medium">Fever</span>
                  </div>
                  <span className="text-sm text-gray-600">38.0-39.0°C (100.3-102.2°F)</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                  <div className="flex items-center space-x-2">
                    <span>🚨</span>
                    <span className="font-medium">High Fever</span>
                  </div>
                  <span className="text-sm text-gray-600">39.1-41.0°C (102.3-105.8°F)</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-red-100 rounded">
                  <div className="flex items-center space-x-2">
                    <span>☠️</span>
                    <span className="font-medium">Hyperthermia</span>
                  </div>
                  <span className="text-sm text-gray-600">&gt; 41.0°C (105.8°F)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chart */}
          {renderTemperatureChart()}

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
                    const status = getTemperatureStatus(reading.temperatureValue);
                    return (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{status.icon}</span>
                          <span className="font-medium">
                            {reading.temperatureValue}°C ({celsiusToFahrenheit(reading.temperatureValue)}°F)
                          </span>
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
            <Button variant="outline" onClick={onClose} data-testid="button-close-temperature-modal">
              Close
            </Button>
            <Button 
              onClick={() => alert('Export functionality would save temperature data to PDF/CSV')}
              data-testid="button-export-temperature"
            >
              Export Data
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}