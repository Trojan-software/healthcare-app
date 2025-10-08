// Re-export the real Bluetooth implementation
export { useHC03Bluetooth as useBluetoothDevice } from './useHC03Bluetooth';

// Legacy type exports for backward compatibility
export type { DetectionType as BluetoothDevice } from '@/services/BluetoothService';