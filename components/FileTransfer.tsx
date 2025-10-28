'use client';

import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Upload, File, X, Download } from 'lucide-react';
import { Badge } from './ui/badge';

interface FileTransferProps {
  peerId: string;
  peerName: string;
  onSendFile: (file: File, onProgress: (progress: number) => void) => Promise<void>;
}

interface TransferringFile {
  name: string;
  size: number;
  progress: number;
  status: 'uploading' | 'completed' | 'failed';
}

export function FileTransfer({ peerId, peerName, onSendFile }: FileTransferProps) {
  const [transferringFiles, setTransferringFiles] = useState<TransferringFile[]>([]);
  const [receivedFiles, setReceivedFiles] = useState<
    { name: string; data: Blob; mimeType: string }[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const transferFile: TransferringFile = {
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'uploading',
    };

    setTransferringFiles((prev) => [...prev, transferFile]);

    try {
      await onSendFile(file, (progress) => {
        setTransferringFiles((prev) =>
          prev.map((f) =>
            f.name === file.name ? { ...f, progress } : f
          )
        );
      });

      setTransferringFiles((prev) =>
        prev.map((f) =>
          f.name === file.name ? { ...f, status: 'completed', progress: 100 } : f
        )
      );
    } catch (error) {
      console.error('File transfer failed:', error);
      setTransferringFiles((prev) =>
        prev.map((f) =>
          f.name === file.name ? { ...f, status: 'failed' } : f
        )
      );
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDownloadFile = (file: { name: string; data: Blob; mimeType: string }) => {
    const url = URL.createObjectURL(file.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const removeCompletedTransfer = (fileName: string) => {
    setTransferringFiles((prev) => prev.filter((f) => f.name !== fileName));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>File Transfer - {peerName}</span>
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Send File
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Transferring files */}
        {transferringFiles.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Sending</h3>
            {transferringFiles.map((file, index) => (
              <div
                key={index}
                className="border rounded-lg p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4" />
                    <span className="text-sm font-medium">{file.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        file.status === 'completed'
                          ? 'default'
                          : file.status === 'failed'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {file.status === 'uploading' && `${Math.round(file.progress)}%`}
                      {file.status === 'completed' && 'Sent'}
                      {file.status === 'failed' && 'Failed'}
                    </Badge>
                    {file.status === 'completed' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeCompletedTransfer(file.name)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </div>
                {file.status === 'uploading' && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Received files */}
        {receivedFiles.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Received</h3>
            {receivedFiles.map((file, index) => (
              <div
                key={index}
                className="border rounded-lg p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <File className="h-4 w-4" />
                  <div>
                    <div className="text-sm font-medium">{file.name}</div>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(file.data.size)}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleDownloadFile(file)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        )}

        {transferringFiles.length === 0 && receivedFiles.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Upload className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No files transferred yet</p>
            <p className="text-sm">Click "Send File" to start</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
