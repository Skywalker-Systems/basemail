"use client";

import { useEffect, useRef, useState } from 'react';

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected';

interface UseWebSocketProps {
    url: string;
    enabled?: boolean;
    onMessage?: (data: any) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
}

export function useWebSocket({
    url,
    enabled = true,
    onMessage,
    onConnect,
    onDisconnect,
}: UseWebSocketProps) {
    const [status, setStatus] = useState<WebSocketStatus>('disconnected');
    const ws = useRef<WebSocket | null>(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const connect = () => {
        if (!enabled) {
            console.debug('[WebSocket] Connection disabled');
            return;
        }

        if (!url) {
            console.debug('[WebSocket] No URL provided');
            return;
        }

        try {
            console.debug(`[WebSocket] Attempting connection to ${url}`);
            ws.current = new WebSocket(url);
            setStatus('connecting');

            ws.current.onopen = () => {
                console.debug('[WebSocket] Connection established');
                setStatus('connected');
                reconnectAttempts.current = 0;
                onConnect?.();
            };

            ws.current.onmessage = (event) => {
                console.debug('[WebSocket] Message received:', event.data.slice(0, 200) + (event.data.length > 200 ? '...' : ''));
                onMessage?.(JSON.parse(event.data));
            };

            ws.current.onclose = () => {
                console.debug('[WebSocket] Connection closed');
                setStatus('disconnected');
                onDisconnect?.();

                if (reconnectAttempts.current < maxReconnectAttempts) {
                    reconnectAttempts.current += 1;
                    const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
                    console.debug(`[WebSocket] Attempting reconnect ${reconnectAttempts.current}/${maxReconnectAttempts} in ${timeout}ms`);
                    reconnectTimeoutRef.current = setTimeout(connect, timeout);
                } else {
                    console.debug('[WebSocket] Max reconnection attempts reached');
                }
            };

            ws.current.onerror = (error) => {
                console.error('[WebSocket] Connection error:', error);
                ws.current?.close();
            };
        } catch (err) {
            setStatus('disconnected');
            console.error('[WebSocket] Connection error:', err);
        }
    };

    useEffect(() => {
        console.debug(`[WebSocket] Hook initialized - enabled: ${enabled}, url: ${url}`);
        if (enabled) {
            connect();
        }

        return () => {
            console.debug('[WebSocket] Cleaning up connection');
            ws.current?.close();
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [url, enabled]);

    return { status, ws: ws.current };
}