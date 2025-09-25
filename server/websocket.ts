import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import { storage } from './storage';

interface WebSocketClient extends WebSocket {
  patientId?: string;
  deviceId?: string;
  isAlive?: boolean;
}

interface HC03DataMessage {
  type: 'hc03_data';
  measurementType: 'ecg' | 'bloodOxygen' | 'bloodPressure' | 'bloodGlucose' | 'temperature' | 'battery';
  deviceId: string;
  patientId: string;
  data: any;
  timestamp: string;
}

interface DeviceStatusMessage {
  type: 'device_status';
  deviceId: string;
  status: 'connected' | 'disconnected' | 'scanning';
  patientId: string;
}

interface SubscriptionMessage {
  type: 'subscribe';
  patientId: string;
  deviceId?: string;
}

export class HC03WebSocketService {
  private wss: WebSocketServer;
  private clients: Map<string, Set<WebSocketClient>> = new Map();
  private deviceClients: Map<string, Set<WebSocketClient>> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/hc03'
    });

    this.setupWebSocketServer();
    this.setupHeartbeat();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocketClient, request) => {
      console.log('New WebSocket connection established');
      
      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', async (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          await this.handleMessage(ws, data);
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      });

      ws.on('close', () => {
        this.removeClient(ws);
        console.log('WebSocket connection closed');
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.removeClient(ws);
      });
    });

    console.log('HC03 WebSocket server initialized on /ws/hc03');
  }

  private async handleMessage(ws: WebSocketClient, message: any): Promise<void> {
    switch (message.type) {
      case 'auth':
        await this.handleAuth(ws, message);
        break;
      
      case 'subscribe':
        await this.handleSubscription(ws, message as SubscriptionMessage);
        break;
      
      case 'hc03_data':
        await this.handleHC03Data(ws, message as HC03DataMessage);
        break;
      
      case 'device_status':
        await this.handleDeviceStatus(ws, message as DeviceStatusMessage);
        break;
      
      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Unknown message type'
        }));
    }
  }

  private async handleAuth(ws: WebSocketClient, message: any): Promise<void> {
    try {
      const { token } = message;
      if (!token) {
        ws.send(JSON.stringify({
          type: 'auth_error',
          message: 'Token required'
        }));
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;
      const user = await storage.getUser(decoded.userId);
      
      if (!user) {
        ws.send(JSON.stringify({
          type: 'auth_error',
          message: 'Invalid token'
        }));
        return;
      }

      ws.patientId = user.patientId || user.id.toString();
      
      ws.send(JSON.stringify({
        type: 'auth_success',
        patientId: ws.patientId
      }));

    } catch (error) {
      console.error('WebSocket auth error:', error);
      ws.send(JSON.stringify({
        type: 'auth_error',
        message: 'Authentication failed'
      }));
    }
  }

  private async handleSubscription(ws: WebSocketClient, message: SubscriptionMessage): Promise<void> {
    if (!ws.patientId) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Authentication required'
      }));
      return;
    }

    // Subscribe to patient data
    if (!this.clients.has(message.patientId)) {
      this.clients.set(message.patientId, new Set());
    }
    this.clients.get(message.patientId)!.add(ws);

    // Subscribe to specific device if provided
    if (message.deviceId) {
      ws.deviceId = message.deviceId;
      if (!this.deviceClients.has(message.deviceId)) {
        this.deviceClients.set(message.deviceId, new Set());
      }
      this.deviceClients.get(message.deviceId)!.add(ws);
    }

    ws.send(JSON.stringify({
      type: 'subscription_success',
      patientId: message.patientId,
      deviceId: message.deviceId
    }));

    console.log(`Client subscribed to patient ${message.patientId}${message.deviceId ? ` and device ${message.deviceId}` : ''}`);
  }

  private async handleHC03Data(ws: WebSocketClient, message: HC03DataMessage): Promise<void> {
    try {
      // Store data in database
      let savedData;
      
      switch (message.measurementType) {
        case 'ecg':
          savedData = await storage.saveEcgData({
            patientId: message.patientId,
            deviceId: message.deviceId,
            ...message.data
          });
          break;
        
        case 'bloodOxygen':
          savedData = await storage.saveBloodOxygenData({
            patientId: message.patientId,
            deviceId: message.deviceId,
            ...message.data
          });
          break;
        
        case 'bloodPressure':
          savedData = await storage.saveBloodPressureData({
            patientId: message.patientId,
            deviceId: message.deviceId,
            ...message.data
          });
          break;
        
        case 'bloodGlucose':
          savedData = await storage.saveBloodGlucoseData({
            patientId: message.patientId,
            deviceId: message.deviceId,
            ...message.data
          });
          break;
        
        case 'temperature':
          savedData = await storage.saveTemperatureData({
            patientId: message.patientId,
            deviceId: message.deviceId,
            ...message.data
          });
          break;
        
        case 'battery':
          await storage.updateDeviceBattery(
            message.deviceId,
            message.data.batteryLevel,
            message.data.chargingStatus
          );
          savedData = { 
            batteryLevel: message.data.batteryLevel,
            chargingStatus: message.data.chargingStatus 
          };
          break;
      }

      // Broadcast to subscribed clients
      this.broadcastToPatient(message.patientId, {
        type: 'hc03_data_update',
        measurementType: message.measurementType,
        deviceId: message.deviceId,
        data: savedData,
        timestamp: message.timestamp
      });

      // Send confirmation to sender
      ws.send(JSON.stringify({
        type: 'data_received',
        measurementType: message.measurementType,
        timestamp: message.timestamp
      }));

      console.log(`HC03 ${message.measurementType} data received from device ${message.deviceId} for patient ${message.patientId}`);

    } catch (error) {
      console.error('Error handling HC03 data:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process data'
      }));
    }
  }

  private async handleDeviceStatus(ws: WebSocketClient, message: DeviceStatusMessage): Promise<void> {
    try {
      // Update device status in database
      await storage.updateDeviceStatus(message.deviceId, message.status);

      // Broadcast status update to all clients subscribed to this patient
      this.broadcastToPatient(message.patientId, {
        type: 'device_status_update',
        deviceId: message.deviceId,
        status: message.status,
        timestamp: new Date().toISOString()
      });

      // Broadcast to device-specific subscribers
      this.broadcastToDevice(message.deviceId, {
        type: 'device_status_update',
        deviceId: message.deviceId,
        status: message.status,
        timestamp: new Date().toISOString()
      });

      console.log(`Device ${message.deviceId} status updated to: ${message.status}`);

    } catch (error) {
      console.error('Error handling device status:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to update device status'
      }));
    }
  }

  private broadcastToPatient(patientId: string, message: any): void {
    const clients = this.clients.get(patientId);
    if (clients) {
      const messageStr = JSON.stringify(message);
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(messageStr);
        }
      });
    }
  }

  private broadcastToDevice(deviceId: string, message: any): void {
    const clients = this.deviceClients.get(deviceId);
    if (clients) {
      const messageStr = JSON.stringify(message);
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(messageStr);
        }
      });
    }
  }

  private removeClient(ws: WebSocketClient): void {
    // Remove from patient subscriptions
    if (ws.patientId) {
      const clients = this.clients.get(ws.patientId);
      if (clients) {
        clients.delete(ws);
        if (clients.size === 0) {
          this.clients.delete(ws.patientId);
        }
      }
    }

    // Remove from device subscriptions
    if (ws.deviceId) {
      const clients = this.deviceClients.get(ws.deviceId);
      if (clients) {
        clients.delete(ws);
        if (clients.size === 0) {
          this.deviceClients.delete(ws.deviceId);
        }
      }
    }
  }

  private setupHeartbeat(): void {
    const interval = setInterval(() => {
      this.wss.clients.forEach((ws: WebSocketClient) => {
        if (ws.isAlive === false) {
          console.log('Terminating inactive WebSocket connection');
          this.removeClient(ws);
          return ws.terminate();
        }
        
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds

    this.wss.on('close', () => {
      clearInterval(interval);
    });
  }

  // Public methods for external use
  public broadcastDataUpdate(patientId: string, measurementType: string, deviceId: string, data: any): void {
    this.broadcastToPatient(patientId, {
      type: 'hc03_data_update',
      measurementType,
      deviceId,
      data,
      timestamp: new Date().toISOString()
    });
  }

  public broadcastDeviceStatus(patientId: string, deviceId: string, status: string): void {
    this.broadcastToPatient(patientId, {
      type: 'device_status_update',
      deviceId,
      status,
      timestamp: new Date().toISOString()
    });
  }

  public getConnectedClients(): { 
    totalClients: number;
    patientSubscriptions: number;
    deviceSubscriptions: number;
  } {
    return {
      totalClients: this.wss.clients.size,
      patientSubscriptions: this.clients.size,
      deviceSubscriptions: this.deviceClients.size
    };
  }
}