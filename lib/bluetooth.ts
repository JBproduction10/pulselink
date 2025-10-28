export interface BluetoothDevice {
  id: string;
  name: string;
  connected: boolean;
  lastSeen: number;
}

export interface BluetoothMessage {
  from: string;
  type: string;
  data: any;
  timestamp: number;
}

const PULSELINK_SERVICE_UUID = '12345678-1234-5678-1234-56789abcdef0';
const MESSAGE_CHARACTERISTIC_UUID = '12345678-1234-5678-1234-56789abcdef1';
const DISCOVERY_CHARACTERISTIC_UUID = '12345678-1234-5678-1234-56789abcdef2';

export class BluetoothManager {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private messageCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private discoveredDevices: Map<string, BluetoothDevice> = new Map();
  private onMessageCallbacks: ((message: BluetoothMessage) => void)[] = [];
  private onDeviceDiscoveredCallbacks: ((device: BluetoothDevice) => void)[] = [];
  private userId: string;
  private isSupported: boolean;

  constructor(userId: string) {
    this.userId = userId;
    this.isSupported = this.checkBluetoothSupport();
  }

  private checkBluetoothSupport(): boolean {
    if (typeof navigator === 'undefined') return false;
    return 'bluetooth' in navigator;
  }

  isBluetoothSupported(): boolean {
    return this.isSupported;
  }

  async requestDevice(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Bluetooth is not supported in this browser');
      return false;
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [PULSELINK_SERVICE_UUID] }],
        optionalServices: [PULSELINK_SERVICE_UUID],
      });

      if (!device.gatt) {
        throw new Error('GATT not supported on this device');
      }

      this.server = await device.gatt.connect();
      const service = await this.server.getPrimaryService(PULSELINK_SERVICE_UUID);
      this.messageCharacteristic = await service.getCharacteristic(MESSAGE_CHARACTERISTIC_UUID);

      // Listen for incoming messages
      await this.messageCharacteristic.startNotifications();
      this.messageCharacteristic.addEventListener('characteristicvaluechanged', (event) => {
        this.handleIncomingMessage(event);
      });

      this.device = {
        id: device.id,
        name: device.name || 'Unknown Device',
        connected: true,
        lastSeen: Date.now(),
      };

      console.log('Bluetooth device connected:', this.device.name);
      return true;
    } catch (error) {
      console.error('Bluetooth connection error:', error);
      return false;
    }
  }

  async scanForDevices(): Promise<void> {
    if (!this.isSupported) {
      console.warn('Bluetooth scanning not supported');
      return;
    }

    try {
      // Note: Web Bluetooth API doesn't support background scanning
      // This is a simplified implementation
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [PULSELINK_SERVICE_UUID],
      });

      const discoveredDevice: BluetoothDevice = {
        id: device.id,
        name: device.name || 'Unknown Device',
        connected: false,
        lastSeen: Date.now(),
      };

      this.discoveredDevices.set(device.id, discoveredDevice);
      this.onDeviceDiscoveredCallbacks.forEach(cb => cb(discoveredDevice));
    } catch (error) {
      console.error('Bluetooth scan error:', error);
    }
  }

  async sendMessage(data: any): Promise<boolean> {
    if (!this.messageCharacteristic || !this.device?.connected) {
      console.warn('No connected Bluetooth device');
      return false;
    }

    try {
      const message: BluetoothMessage = {
        from: this.userId,
        type: data.type,
        data: data.content,
        timestamp: Date.now(),
      };

      const encoder = new TextEncoder();
      const messageBytes = encoder.encode(JSON.stringify(message));

      // Bluetooth LE has a max payload of ~512 bytes per write
      // Split message if needed
      const chunkSize = 512;
      for (let i = 0; i < messageBytes.length; i += chunkSize) {
        const chunk = messageBytes.slice(i, i + chunkSize);
        await this.messageCharacteristic.writeValue(chunk);
      }

      return true;
    } catch (error) {
      console.error('Error sending Bluetooth message:', error);
      return false;
    }
  }

  private handleIncomingMessage(event: Event) {
    try {
      const target = event.target as BluetoothRemoteGATTCharacteristic;
      const value = target.value;

      if (!value) return;

      const decoder = new TextDecoder();
      const messageStr = decoder.decode(value);
      const message: BluetoothMessage = JSON.parse(messageStr);

      this.onMessageCallbacks.forEach(cb => cb(message));
    } catch (error) {
      console.error('Error handling Bluetooth message:', error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.server) {
      this.server.disconnect();
      this.server = null;
    }

    if (this.device) {
      this.device.connected = false;
      this.device = null;
    }

    this.messageCharacteristic = null;
  }

  onMessage(callback: (message: BluetoothMessage) => void) {
    this.onMessageCallbacks.push(callback);
  }

  onDeviceDiscovered(callback: (device: BluetoothDevice) => void) {
    this.onDeviceDiscoveredCallbacks.push(callback);
  }

  getConnectedDevice(): BluetoothDevice | null {
    return this.device;
  }

  getDiscoveredDevices(): BluetoothDevice[] {
    return Array.from(this.discoveredDevices.values());
  }

  isConnected(): boolean {
    return this.device?.connected || false;
  }
}

// Simplified Bluetooth alternative using Web Bluetooth Scanning API (experimental)
export class BluetoothBeaconManager {
  private userId: string;
  private isAdvertising = false;

  constructor(userId: string) {
    this.userId = userId;
  }

  async startAdvertising(): Promise<boolean> {
    // Note: This requires the Experimental Web Platform features flag
    // chrome://flags/#enable-experimental-web-platform-features

    try {
      // Check if advertising is supported (very limited browser support)
      if (!('bluetooth' in navigator) || !('requestLEScan' in (navigator.bluetooth as any))) {
        console.warn('Bluetooth LE Scanning/Advertising not supported');
        return false;
      }

      // This is experimental and may not work in most browsers
      const scan = await (navigator.bluetooth as any).requestLEScan({
        filters: [{ services: [PULSELINK_SERVICE_UUID] }],
      });

      this.isAdvertising = true;
      console.log('Bluetooth advertising started');
      return true;
    } catch (error) {
      console.error('Bluetooth advertising error:', error);
      return false;
    }
  }

  stopAdvertising(): void {
    this.isAdvertising = false;
  }

  getAdvertisingStatus(): boolean {
    return this.isAdvertising;
  }
}
