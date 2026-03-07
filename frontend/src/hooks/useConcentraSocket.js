import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for WebSocket connection to ConcentraAI backend.
 * In development: connects to localhost via Vite proxy.
 * In production: connects directly to the backend URL set in VITE_BACKEND_URL.
 */
export function useConcentraSocket() {
    const [isConnected, setIsConnected] = useState(false);
    const [data, setData] = useState(null);
    const wsRef = useRef(null);
    const clientIdRef = useRef(`client_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
    const reconnectTimerRef = useRef(null);

    const getBackendUrl = useCallback(() => {
        // In production, use the env variable pointing to Render backend
        const backendUrl = import.meta.env.VITE_BACKEND_URL;
        if (backendUrl) {
            // Convert http(s) to ws(s)
            const wsUrl = backendUrl.replace(/^http/, 'ws');
            return `${wsUrl}/ws/${clientIdRef.current}`;
        }
        // In development, use the Vite proxy (same host)
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        return `${protocol}://${window.location.host}/ws/${clientIdRef.current}`;
    }, []);

    const getApiBaseUrl = useCallback(() => {
        return import.meta.env.VITE_BACKEND_URL || '';
    }, []);

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        const wsUrl = getBackendUrl();
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
            reconnectTimerRef.current = setTimeout(connect, 2000);
        };

        ws.onerror = (err) => {
            console.error('[ConcentraAI] WebSocket error:', err);
            ws.close();
        };

        wsRef.current = ws;
    }, [getBackendUrl]);

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
            const baseUrl = getApiBaseUrl();
            await fetch(`${baseUrl}/api/session/${clientIdRef.current}/reset`, { method: 'POST' });
            setData(null);
        } catch (e) {
            console.error('[ConcentraAI] Reset error:', e);
        }
    }, [getApiBaseUrl]);

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
