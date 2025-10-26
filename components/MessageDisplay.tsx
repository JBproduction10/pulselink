'use client';

import { useState } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import type { Message } from '../lib/p2p';

interface MessageDisplayProps {
  message: Message;
  formatTime: (timestamp: number) => string;
}

export function MessageDisplay({ message, formatTime }: MessageDisplayProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const playAudio = () => {
    if (message.audioData) {
      const audio = new Audio(message.audioData);
      setIsPlaying(true);
      audio.play();
      audio.onended = () => setIsPlaying(false);
    }
  };

  const getMessageBadgeColor = (type: string) => {
    switch (type) {
      case 'SOS': return 'danger';
      case 'STATUS': return 'warning';
      case 'IMAGE': return 'default';
      case 'VOICE': return 'default';
      case 'RESOURCE': return 'success';
      default: return 'outline';
    }
  };

  const getResourceIcon = (resourceType?: string) => {
    switch (resourceType) {
      case 'water': return '💧';
      case 'food': return '🍞';
      case 'medical': return '⚕️';
      case 'shelter': return '🏠';
      default: return '📦';
    }
  };

  return (
    <div className="py-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{message.fromName}</span>
          <Badge variant={getMessageBadgeColor(message.type)}>
            {message.type}
          </Badge>
          {message.type === 'RESOURCE' && message.resourceType && (
            <Badge variant="outline">
              {getResourceIcon(message.resourceType)} {message.resourceType}
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {formatTime(message.timestamp)}
        </span>
      </div>

      {/* Text Content */}
      {message.content && (
        <p className={message.type === 'SOS' ? 'font-bold text-red-900' : ''}>
          {message.content}
        </p>
      )}

      {/* Resource Info */}
      {message.type === 'RESOURCE' && message.resourceQuantity && (
        <p className="text-sm text-muted-foreground mt-1">
          Quantity: {message.resourceQuantity}
        </p>
      )}

      {/* Image Display */}
      {message.type === 'IMAGE' && message.imageData && (
        <div className="mt-2">
          <img
            src={message.imageData}
            alt="Shared image"
            className="max-w-full h-auto rounded-lg border-2 border-gray-300"
          />
        </div>
      )}

      {/* Voice Message */}
      {message.type === 'VOICE' && message.audioData && (
        <div className="mt-2">
          <Button
            onClick={playAudio}
            variant="outline"
            disabled={isPlaying}
            className="flex items-center gap-2"
          >
            {isPlaying ? '▶️ Playing...' : '🎤 Play Voice Message'}
          </Button>
        </div>
      )}

      {/* Location */}
      {message.location && (
        <p className="text-xs text-muted-foreground mt-2">
          📍 {message.location.lat.toFixed(4)}, {message.location.lng.toFixed(4)}
        </p>
      )}
    </div>
  );
}
