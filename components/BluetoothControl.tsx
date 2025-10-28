'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Bluetooth, BluetoothConnected, BluetoothSearching, WifiOff } from 'lucide-react';
import P2PNetwork from '../lib/p2p';

interface BluetoothControlProps {
  network: P2PNetwork;
}

export function BluetoothControl({ network }: BluetoothControlProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    setIsSupported(network.isBluetoothSupported());
    setIsConnected(network.isBluetoothConnected());
  }, [network]);

  const handleConnect = async () => {
    const success = await network.connectBluetooth();
    if (success) {
      setIsConnected(true);
    }
  };

  const handleScan = async () => {
    setIsScanning(true);
    await network.scanBluetoothDevices();
    setIsScanning(false);
  };

  const handleDisconnect = () => {
    network.disconnectBluetooth();
    setIsConnected(false);
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WifiOff className="h-5 w-5" />
            Bluetooth
          </CardTitle>
          <CardDescription>
            Bluetooth is not supported in this browser
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bluetooth className="h-5 w-5" />
          Bluetooth Connection
        </CardTitle>
        <CardDescription>
          Connect to nearby devices for closer-range communication
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <BluetoothConnected className="h-5 w-5 text-blue-500" />
                <span className="font-medium">Connected</span>
                <Badge variant="outline" className="bg-blue-50">Active</Badge>
              </>
            ) : (
              <>
                <Bluetooth className="h-5 w-5 text-gray-400" />
                <span className="text-gray-500">Not connected</span>
              </>
            )}
          </div>
          {isConnected ? (
            <Button variant="outline" onClick={handleDisconnect}>
              Disconnect
            </Button>
          ) : (
            <Button onClick={handleConnect}>
              Connect Device
            </Button>
          )}
        </div>

        {!isConnected && (
          <div className="pt-4 border-t">
            <Button
              onClick={handleScan}
              disabled={isScanning}
              className="w-full"
              variant="outline"
            >
              {isScanning ? (
                <>
                  <BluetoothSearching className="h-4 w-4 mr-2 animate-pulse" />
                  Scanning...
                </>
              ) : (
                <>
                  <BluetoothSearching className="h-4 w-4 mr-2" />
                  Scan for Devices
                </>
              )}
            </Button>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Bluetooth provides closer-range peer-to-peer communication</p>
          <p>• Works within ~10-100 meters depending on device</p>
          <p>• Enable Bluetooth on your device for best results</p>
        </div>
      </CardContent>
    </Card>
  );
}
