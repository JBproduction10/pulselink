'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Wifi, Users, Radio, CheckCircle2, AlertCircle } from 'lucide-react';
import { Peer } from '../lib/p2p';

interface ConnectionStatusProps {
  peers: Peer[];
}

export function ConnectionStatus({ peers }: ConnectionStatusProps) {
  const [connectionMethod, setConnectionMethod] = useState<string>('Initializing...');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check if BroadcastChannel is available
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      setConnectionMethod('BroadcastChannel (Local)');
      setIsConnected(true);
    } else {
      setConnectionMethod('Signaling Server');
      // In production, check if signaling server is connected
    }
  }, []);

  const webrtcPeers = peers.filter(p => p.connectionType === 'webrtc');
  const otherPeers = peers.filter(p => !p.connectionType);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe':
        return 'bg-green-500';
      case 'help':
        return 'bg-yellow-500';
      case 'emergency':
        return 'bg-red-500';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radio className="h-5 w-5" />
          Network Status
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          {isConnected ? (
            <><CheckCircle2 className="h-3 w-3 text-green-500" />
            <span className="text-green-600">Connected via {connectionMethod}</span></>
          ) : (
            <><AlertCircle className="h-3 w-3 text-yellow-500" />
            <span className="text-yellow-600">Connecting...</span></>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* WebRTC Connections */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Wifi className="h-4 w-4 text-blue-500" />
            <span className="font-medium text-sm">Connected Peers</span>
            <Badge variant="outline">{webrtcPeers.length}</Badge>
          </div>
          {webrtcPeers.length > 0 ? (
            <div className="space-y-1">
              {webrtcPeers.map((peer) => (
                <div
                  key={peer.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(peer.status)}`} />
                    <span>{peer.name}</span>
                  </div>
                  {peer.distance && (
                    <span className="text-xs text-gray-500">
                      {Math.round(peer.distance)}m
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
              <p className="font-medium mb-1">💡 Testing Instructions:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>Open this app in multiple browser tabs</li>
                <li>Each tab will auto-discover other tabs</li>
                <li>Peers will appear here within 3-5 seconds</li>
              </ul>
            </div>
          )}
        </div>

        {/* Other Peers (Discovered) */}
        {otherPeers.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-sm">Nearby Peers</span>
              <Badge variant="outline">{otherPeers.length}</Badge>
            </div>
            <div className="space-y-1">
              {otherPeers.map((peer) => (
                <div
                  key={peer.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(peer.status)}`} />
                    <span>{peer.name}</span>
                  </div>
                  {peer.distance && (
                    <span className="text-xs text-gray-500">
                      {Math.round(peer.distance)}m
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {peers.length === 0 && (
          <div className="text-center py-6">
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No peers connected</p>
            <p className="text-xs text-gray-400 mt-1">
              Searching for nearby users...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
