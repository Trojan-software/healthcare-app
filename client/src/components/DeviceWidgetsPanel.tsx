import ECGWidget from './widgets/ECGWidget';
import SpO2Widget from './widgets/SpO2Widget';
import BloodPressureWidget from './widgets/BloodPressureWidget';
import BloodGlucoseWidget from './widgets/BloodGlucoseWidget';
import TemperatureWidget from './widgets/TemperatureWidget';

interface DeviceWidgetsPanelProps {
  patientId?: string;
  layout?: 'grid' | 'vertical';
  onConnectDevice?: () => void;
}

export default function DeviceWidgetsPanel({ 
  patientId, 
  layout = 'grid',
  onConnectDevice 
}: DeviceWidgetsPanelProps) {
  const widgetClassName = layout === 'grid' 
    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
    : 'space-y-4';

  return (
    <div className={widgetClassName} data-testid="device-widgets-panel">
      <ECGWidget patientId={patientId} onConnect={onConnectDevice} />
      <SpO2Widget patientId={patientId} onConnect={onConnectDevice} />
      <BloodPressureWidget patientId={patientId} onConnect={onConnectDevice} />
      <BloodGlucoseWidget patientId={patientId} onConnect={onConnectDevice} />
      <TemperatureWidget patientId={patientId} onConnect={onConnectDevice} />
    </div>
  );
}
