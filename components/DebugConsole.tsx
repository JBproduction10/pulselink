'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Terminal, X, ChevronDown, ChevronUp } from 'lucide-react';

interface LogEntry {
    timestamp: number;
    type: 'info' | 'warn' | 'error' | 'success';
    message: string;
}

export function DebugConsole() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Intercept console logs
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;

        console.log = (...args) => {
            originalLog(...args);
            const message = args.join(' ');
            // Only log PulseLink-related messages
            if (message.includes('BroadcastChannel') ||
                message.includes('peer') ||
                message.includes('signal') ||
                message.includes('WebRTC') ||
                message.includes('Peer') ||
                message.includes('Connected') ||
                message.includes('Announced')) {
                const newLog: LogEntry = {
                    timestamp: Date.now(),
                    type: message.toLowerCase().includes('error') ? 'error' :
                        message.toLowerCase().includes('connected') ? 'success' : 'info',
                    message
                };
                setLogs(prev => [...prev, newLog].slice(-50)); // Keep last 50 logs
            }
        };

        console.warn = (...args) => {
            originalWarn(...args);
            const newLog: LogEntry = {
                timestamp: Date.now(),
                type: 'warn',
                message: args.join(' ')
            };
            setLogs(prev => [...prev, newLog].slice(-50));
        };

        console.error = (...args) => {
            originalError(...args);
            const newLog: LogEntry = {
                timestamp: Date.now(),
                type: 'error',
                message: args.join(' ')
            };
            setLogs(prev => [...prev, newLog].slice(-50));
        };

        return () => {
            console.log = originalLog;
            console.warn = originalWarn;
            console.error = originalError;
        };
    }, []);

    useEffect(() => {
        if (isExpanded && logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, isExpanded]);

    const clearLogs = () => {
        setLogs([]);
    };

    const getLogColor = (type: LogEntry['type']) => {
        switch (type) {
            case 'error':
                return 'text-red-600';
            case 'warn':
                return 'text-yellow-600';
            case 'success':
                return 'text-green-600';
            default:
                return 'text-gray-700';
        }
    };

    const getLogIcon = (type: LogEntry['type']) => {
        switch (type) {
            case 'error':
                return '❌';
            case 'warn':
                return '⚠️';
            case 'success':
                return '✅';
            default:
                return '📝';
        }
    };

    if (!isVisible) {
        return (
            <Button
                onClick={() => setIsVisible(true)}
                className="fixed bottom-4 right-4 z-50"
                size="sm"
            >
                <Terminal className="h-4 w-4 mr-2" />
                Show Debug Console
            </Button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <Terminal className="h-4 w-4" />
                            Debug Console
                            {logs.length > 0 && (
                                <span className="text-xs font-normal text-gray-500">
                                    ({logs.length} logs)
                                </span>
                            )}
                        </CardTitle>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="h-7 w-7 p-0"
                            >
                                {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronUp className="h-4 w-4" />
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearLogs}
                                className="h-7 w-7 p-0"
                                title="Clear logs"
                            >
                                Clear
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsVisible(false)}
                                className="h-7 w-7 p-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                {isExpanded && (
                    <CardContent className="pt-0">
                        <div className="bg-gray-50 rounded-lg p-3 max-h-96 overflow-y-auto border border-gray-200">
                            {logs.length === 0 ? (
                                <p className="text-xs text-gray-500 text-center py-4">
                                    No logs yet. Connection events will appear here.
                                </p>
                            ) : (
                                <div className="space-y-1">
                                    {logs.map((log, index) => (
                                        <div
                                            key={index}
                                            className={`text-xs font-mono ${getLogColor(log.type)} wrap-break-words`}
                                        >
                                            <span className="text-gray-400">
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                            </span>
                                            {' '}
                                            <span>{getLogIcon(log.type)}</span>
                                            {' '}
                                            {log.message}
                                        </div>
                                    ))}
                                    <div ref={logsEndRef} />
                                </div>
                            )}
                        </div>
                        <div className="mt-2 text-xs text-gray-500 text-center">
                            Shows peer discovery and connection events
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}
