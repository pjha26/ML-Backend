import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for WebSocket connection to ConcentraAI backend.
 * Handles connection, reconnection, and frame sending.
 */
export function useConcentraSocket() {
    const [isConnected, setIsConnected] = useState(false);
    const [data, setData] = useState(null);
    const wsRef = useRef(null);
    const clientIdRef = useRef(`client_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
    const reconnectTimerRef = useRef(null);

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const host = window.location.host;
        const wsUrl = `${protocol}://${host}/ws/${clientIdRef.current}`;

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            setIsConnected(true);
            console.log('[ConcentraAI] WebSocket connected');
        };

        ws.onmessage = (event) => {
            try {
                const result = JSON.parse(event.data);
                if (!result.error) {
                    setData(result);
                }
            } catch (e) {
                console.error('[ConcentraAI] Parse error:', e);
            }
        };

        ws.onclose = () => {
            setIsConnected(false);
            console.log('[ConcentraAI] WebSocket disconnected');
            // Auto reconnect after 2s
            reconnectTimerRef.current = setTimeout(connect, 2000);
        };

        ws.onerror = (err) => {
            console.error('[ConcentraAI] WebSocket error:', err);
            ws.close();
        };

        wsRef.current = ws;
    }, []);

    const disconnect = useCallback(() => {
        clearTimeout(reconnectTimerRef.current);
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setIsConnected(false);
    }, []);

    const sendFrame = useCallback((base64Image) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ image: base64Image }));
        }
    }, []);

    const resetSession = useCallback(async () => {
        try {
            await fetch(`/api/session/${clientIdRef.current}/reset`, { method: 'POST' });
            setData(null);
        } catch (e) {
            console.error('[ConcentraAI] Reset error:', e);
        }
    }, []);

    useEffect(() => {
        return () => {
            clearTimeout(reconnectTimerRef.current);
            wsRef.current?.close();
        };
    }, []);

    return {
        isConnected,
        data,
        connect,
        disconnect,
        sendFrame,
        resetSession,
        clientId: clientIdRef.current,
    };
}
