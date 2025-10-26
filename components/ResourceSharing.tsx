'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

interface ResourceSharingProps {
  onShareResource: (type: string, quantity: string, description: string) => void;
}

export function ResourceSharing({ onShareResource }: ResourceSharingProps) {
  const [selectedType, setSelectedType] = useState<string>('');
  const [quantity, setQuantity] = useState('');
  const [description, setDescription] = useState('');

  const resourceTypes = [
    { id: 'water', label: 'Water', icon: '💧', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
    { id: 'food', label: 'Food', icon: '🍞', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
    { id: 'medical', label: 'Medical', icon: '⚕️', color: 'bg-red-100 text-red-700 hover:bg-red-200' },
    { id: 'shelter', label: 'Shelter', icon: '🏠', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
    { id: 'other', label: 'Other', icon: '📦', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
  ];

  const handleShare = () => {
    if (selectedType && quantity && description) {
      onShareResource(selectedType, quantity, description);
      setSelectedType('');
      setQuantity('');
      setDescription('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Share Emergency Resource</CardTitle>
        <CardDescription>
          Let others know what resources you have available to share
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resource Type Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Resource Type</label>
          <div className="grid grid-cols-2 gap-2">
            {resourceTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedType === type.id
                    ? 'border-red-500 ' + type.color
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-2xl mb-1">{type.icon}</div>
                <div className="text-sm font-medium">{type.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Quantity */}
        {selectedType && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Quantity/Amount</label>
              <Input
                type="text"
                placeholder="e.g., 5 bottles, 10 meals, 1 first aid kit"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Input
                type="text"
                placeholder="Additional details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleShare()}
              />
            </div>

            <Button
              onClick={handleShare}
              className="w-full"
              disabled={!quantity || !description}
            >
              Share Resource
            </Button>
          </>
        )}

        {!selectedType && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Select a resource type to begin
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface ResourceListProps {
  resources: Array<{
    id: string;
    fromName: string;
    type: string;
    quantity: string;
    content: string;
    timestamp: number;
    location?: { lat: number; lng: number };
  }>;
  formatTime: (timestamp: number) => string;
}

export function ResourceList({ resources, formatTime }: ResourceListProps) {
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'water': return '💧';
      case 'food': return '🍞';
      case 'medical': return '⚕️';
      case 'shelter': return '🏠';
      default: return '📦';
    }
  };

  const getResourceColor = (type: string) => {
    switch (type) {
      case 'water': return 'border-blue-300 bg-blue-50';
      case 'food': return 'border-orange-300 bg-orange-50';
      case 'medical': return 'border-red-300 bg-red-50';
      case 'shelter': return 'border-green-300 bg-green-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  if (resources.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>No resources shared yet</p>
          <p className="text-xs mt-2">Share resources to help others in your area</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {resources.map((resource) => (
        <Card key={resource.id} className={`border-2 ${getResourceColor(resource.type)}`}>
          <CardContent className="py-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getResourceIcon(resource.type)}</span>
                <div>
                  <p className="font-semibold">{resource.fromName}</p>
                  <Badge variant="outline" className="mt-1">
                    {resource.type}
                  </Badge>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatTime(resource.timestamp)}
              </span>
            </div>
            <p className="font-medium mt-2">Quantity: {resource.quantity}</p>
            <p className="text-sm text-muted-foreground">{resource.content}</p>
            {resource.location && (
              <p className="text-xs text-muted-foreground mt-2">
                📍 {resource.location.lat.toFixed(4)}, {resource.location.lng.toFixed(4)}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
