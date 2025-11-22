import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface ConsolidatedVital {
  id: number;
  timestamp: string;
  heartRate: number | null;
  bloodPressure: string;
  systolic: number | null;
  diastolic: number | null;
  temperature: number | null;
  oxygenLevel: number | null;
  bloodGlucose: number | null;
  status: 'normal' | 'attention' | 'critical';
}

interface ConsolidatedVitalsTableProps {
  patientId: string;
}

export default function ConsolidatedVitalsTable({ patientId }: ConsolidatedVitalsTableProps) {
  const { data: vitals = [], isLoading } = useQuery<ConsolidatedVital[]>({
    queryKey: ['/api/vital-signs/consolidated', patientId],
    refetchInterval: 5000,
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'critical':
        return 'destructive';
      case 'attention':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'critical':
        return 'Critical';
      case 'attention':
        return 'Attention';
      default:
        return 'Normal';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Vital Signs History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-8 bg-gray-200 rounded w-full"></div>
            <div className="h-8 bg-gray-200 rounded w-full"></div>
            <div className="h-8 bg-gray-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Vital Signs History - One Record Per Check
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">Date & Time</th>
                <th className="text-left py-2 px-2">Heart Rate</th>
                <th className="text-left py-2 px-2">Blood Pressure</th>
                <th className="text-left py-2 px-2">Temperature</th>
                <th className="text-left py-2 px-2">Oxygen</th>
                <th className="text-left py-2 px-2">Blood Glucose</th>
                <th className="text-left py-2 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {vitals && vitals.length > 0 ? (
                vitals.map((vital: ConsolidatedVital) => (
                  <tr key={vital.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="py-2 px-2 whitespace-nowrap">{formatTimestamp(vital.timestamp)}</td>
                    <td className="py-2 px-2">
                      {vital.heartRate ? `${vital.heartRate} BPM` : 'N/A'}
                    </td>
                    <td className="py-2 px-2">
                      {vital.bloodPressure !== 'N/A' ? `${vital.bloodPressure} mmHg` : 'N/A'}
                    </td>
                    <td className="py-2 px-2">
                      {vital.temperature ? `${vital.temperature}°C` : 'N/A'}
                    </td>
                    <td className="py-2 px-2">
                      {vital.oxygenLevel ? `${vital.oxygenLevel}%` : 'N/A'}
                    </td>
                    <td className="py-2 px-2">
                      {vital.bloodGlucose ? `${vital.bloodGlucose} mg/dL` : 'N/A'}
                    </td>
                    <td className="py-2 px-2">
                      <Badge variant={getStatusBadgeVariant(vital.status)}>
                        {getStatusLabel(vital.status)}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-4 px-2 text-center text-gray-500">
                    No vital signs recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Each row represents one complete health check with all measurements (Heart Rate, Blood Pressure, Temperature, Oxygen, Blood Glucose). No duplicate records.
        </p>
      </CardContent>
    </Card>
  );
}
