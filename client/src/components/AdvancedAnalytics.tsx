import React, { useState, useEffect } from 'react';

interface AnalyticsData {
  trendsData: Array<{
    date: string;
    heartRate: number;
    temperature: number;
    oxygenLevel: number;
  }>;
  complianceBreakdown: {
    excellent: number;
    good: number;
    needs_improvement: number;
  };
  alertHistory: Array<{
    type: string;
    count: number;
    severity: string;
  }>;
  vitalsAverages: {
    heartRate: number;
    bloodPressure: string;
    temperature: number;
    oxygenLevel: number;
  };
}

interface AdvancedAnalyticsProps {
  onClose: () => void;
}

export default function AdvancedAnalytics({ onClose }: AdvancedAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedTimeRange]);

  const loadAnalyticsData = async () => {
    try {
      const response = await fetch('/api/dashboard/admin');
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <p className="text-gray-600">Unable to load analytics data</p>
          <button onClick={onClose} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">Close</button>
        </div>
      </div>
    );
  }

  const totalCompliance = analyticsData.complianceBreakdown.excellent + 
                         analyticsData.complianceBreakdown.good + 
                         analyticsData.complianceBreakdown.needs_improvement;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold mb-2">Advanced Analytics</h2>
              <p className="text-indigo-100">Health Trends & Insights Dashboard</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="bg-white bg-opacity-20 text-white border border-white border-opacity-30 rounded-lg px-3 py-2"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 3 Months</option>
              </select>
              <button
                onClick={onClose}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vital Signs Trends */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Vital Signs Trends</h3>
              <div className="space-y-4">
                {analyticsData.trendsData.slice(0, 7).map((day, index) => (
                  <div key={day.date} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{new Date(day.date).toLocaleDateString()}</span>
                    <div className="flex space-x-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span>HR: {Math.round(day.heartRate)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span>Temp: {day.temperature.toFixed(1)}°C</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>O2: {Math.round(day.oxygenLevel)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Simple Visual Chart */}
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-3">Heart Rate Trend</h4>
                <div className="flex items-end space-x-2 h-32">
                  {analyticsData.trendsData.slice(0, 7).map((day, index) => {
                    const height = (day.heartRate / 100) * 100; // Scale to 100px max
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div
                          className="bg-gradient-to-t from-red-500 to-red-300 rounded-t w-full"
                          style={{ height: `${height}%` }}
                        ></div>
                        <span className="text-xs text-gray-500 mt-1">
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Compliance Breakdown */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Patient Compliance</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700">Excellent</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(analyticsData.complianceBreakdown.excellent / totalCompliance) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-8">{analyticsData.complianceBreakdown.excellent}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                    <span className="text-gray-700">Good</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{ width: `${(analyticsData.complianceBreakdown.good / totalCompliance) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-8">{analyticsData.complianceBreakdown.good}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <span className="text-gray-700">Needs Improvement</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${(analyticsData.complianceBreakdown.needs_improvement / totalCompliance) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-8">{analyticsData.complianceBreakdown.needs_improvement}</span>
                  </div>
                </div>
              </div>

              {/* Compliance Pie Chart */}
              <div className="mt-6 flex justify-center">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#10B981"
                      strokeWidth="20"
                      strokeDasharray={`${(analyticsData.complianceBreakdown.excellent / totalCompliance) * 251.2} 251.2`}
                      strokeDashoffset="0"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#EAB308"
                      strokeWidth="20"
                      strokeDasharray={`${(analyticsData.complianceBreakdown.good / totalCompliance) * 251.2} 251.2`}
                      strokeDashoffset={`-${(analyticsData.complianceBreakdown.excellent / totalCompliance) * 251.2}`}
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#EF4444"
                      strokeWidth="20"
                      strokeDasharray={`${(analyticsData.complianceBreakdown.needs_improvement / totalCompliance) * 251.2} 251.2`}
                      strokeDashoffset={`-${((analyticsData.complianceBreakdown.excellent + analyticsData.complianceBreakdown.good) / totalCompliance) * 251.2}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-lg font-bold">{totalCompliance}</div>
                      <div className="text-xs text-gray-500">Patients</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Alert History */}
            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Alert History</h3>
              <div className="space-y-3">
                {analyticsData.alertHistory.map((alert, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        alert.severity === 'high' ? 'bg-red-500' :
                        alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`}></div>
                      <span className="text-gray-700">{alert.type}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Count:</span>
                      <span className="font-semibold">{alert.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vitals Averages */}
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Average Vital Signs</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{analyticsData.vitalsAverages.heartRate}</div>
                  <div className="text-sm text-gray-600">Heart Rate (BPM)</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${(analyticsData.vitalsAverages.heartRate / 120) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{analyticsData.vitalsAverages.oxygenLevel}%</div>
                  <div className="text-sm text-gray-600">Oxygen Level</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${analyticsData.vitalsAverages.oxygenLevel}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{analyticsData.vitalsAverages.bloodPressure}</div>
                  <div className="text-sm text-gray-600">Blood Pressure</div>
                  <div className="text-xs text-gray-500 mt-1">Systolic/Diastolic</div>
                </div>

                <div className="bg-white rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {analyticsData.vitalsAverages.temperature || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Temperature (°C)</div>
                  {analyticsData.vitalsAverages.temperature && (
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{ width: `${((analyticsData.vitalsAverages.temperature - 35) / 5) * 100}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* AI Insights Section */}
          <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">AI Health Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                <h4 className="font-semibold text-blue-700 mb-2">Trend Analysis</h4>
                <p className="text-sm text-gray-600">
                  Heart rate patterns show stable readings across most patients. 
                  Consider monitoring patients with readings above 100 BPM more frequently.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                <h4 className="font-semibold text-green-700 mb-2">Compliance Insights</h4>
                <p className="text-sm text-gray-600">
                  {Math.round((analyticsData.complianceBreakdown.excellent + analyticsData.complianceBreakdown.good) / totalCompliance * 100)}% 
                  of patients maintain good to excellent compliance. Focus on engagement strategies for improvement group.
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-4 border-l-4 border-red-500">
                <h4 className="font-semibold text-red-700 mb-2">Alert Patterns</h4>
                <p className="text-sm text-gray-600">
                  High heart rate alerts are most common. Consider reviewing medication schedules 
                  and stress management for affected patients.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}