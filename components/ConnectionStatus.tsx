'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Wifi, Users, Radio } from 'lucide-react';
import { Peer } from '../lib/p2p';

interface ConnectionStatusProps {
  peers: Peer[];
}

export function ConnectionStatus({ peers }: ConnectionStatusProps) {
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
        <CardDescription>
          Active peer connections
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
            <p className="text-xs text-gray-500 pl-6">No active connections</p>
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
