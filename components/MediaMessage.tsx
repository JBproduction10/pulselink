'use client';

import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { Card, CardContent } from './ui/card';

interface MediaMessageProps {
  onSendImage: (imageData: string, caption: string) => void;
  onSendVoice: (audioData: string) => void;
}

export function MediaMessage({ onSendImage, onSendVoice }: MediaMessageProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageCaption, setImageCaption] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      // Limit file size to 500KB for mesh network efficiency
      if (file.size > 500000) {
        toast('Image too large. Please select an image under 500KB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendImage = () => {
    if (imagePreview) {
      onSendImage(imagePreview, imageCaption);
      setImagePreview(null);
      setImageCaption('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioURL(audioUrl);

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          onSendVoice(base64Audio);
          setAudioURL(null);
        };
        reader.readAsDataURL(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      toast('Could not access microphone. Please grant permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Image Upload */}
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
          id="image-upload"
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1"
        >
          📷 Add Photo
        </Button>
        <Button
          variant={isRecording ? 'destructive' : 'outline'}
          onClick={isRecording ? stopRecording : startRecording}
          className="flex-1"
        >
          {isRecording ? '⏹️ Stop Recording' : '🎤 Voice Message'}
        </Button>
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <Card className="border-2 border-blue-300">
          <CardContent className="p-3 space-y-2">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-48 object-cover rounded"
            />
            <input
              type="text"
              placeholder="Add a caption (optional)"
              value={imageCaption}
              onChange={(e) => setImageCaption(e.target.value)}
              className="w-full p-2 border rounded text-sm"
            />
            <div className="flex gap-2">
              <Button onClick={handleSendImage} className="flex-1">
                Send Photo
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setImagePreview(null);
                  setImageCaption('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <Card className="border-2 border-red-300 bg-red-50">
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
              <span className="text-red-900 font-semibold">Recording...</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
