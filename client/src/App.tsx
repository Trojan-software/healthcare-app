import ComprehensiveHealthcareApp from './ComprehensiveHealthcareApp';
import { DeviceDataProvider } from './contexts/DeviceDataContext';
import { DeviceProvider } from './contexts/DeviceContext';

export default function App() {
  return (
    <DeviceDataProvider>
      <DeviceProvider>
        <ComprehensiveHealthcareApp />
      </DeviceProvider>
    </DeviceDataProvider>
  );
}
