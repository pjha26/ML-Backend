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
    const [clientId] = useState(() => `client_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
    const reconnectTimerRef = useRef(null);
    const retryCountRef = useRef(0);
    const MAX_RETRIES = 3;

    const getBackendUrl = useCallback(() => {
        // In production, use the env variable pointing to Render backend
        const backendUrl = import.meta.env.VITE_BACKEND_URL;
        if (backendUrl) {
            // Convert http(s) to ws(s)
            const wsUrl = backendUrl.replace(/^http/, 'ws');
            return `${wsUrl}/ws/${clientId}`;
        }
        // In development, use the Vite proxy (same host)
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        return `${protocol}://${window.location.host}/ws/${clientId}`;
    }, [clientId]);

    const getApiBaseUrl = useCallback(() => {
        return import.meta.env.VITE_BACKEND_URL || '';
    }, []);

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        if (retryCountRef.current >= MAX_RETRIES) {
            console.error('[ConcentraAI] Max retries reached. Backend may be down.');
            return;
        }

        const wsUrl = getBackendUrl();
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            setIsConnected(true);
            retryCountRef.current = 0; // Reset retries on success
            console.log(`[ConcentraAI] WebSocket connected for client ${clientId}`);
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
            retryCountRef.current++;
            // eslint-disable-next-line react-hooks/immutability
            reconnectTimerRef.current = setTimeout(connect, 2000);
        };

        ws.onerror = (err) => {
            console.error('[ConcentraAI] WebSocket error:', err);
            ws.close();
        };

        wsRef.current = ws;
    }, [getBackendUrl, clientId]);

    const disconnect = useCallback(() => {
        clearTimeout(reconnectTimerRef.current);
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setIsConnected(false);
    }, []);

    const sendFrame = useCallback((base64Image, roomCode) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            const msg = { image: base64Image, clientId: clientId };
            if (roomCode) msg.roomCode = roomCode;
            wsRef.current.send(JSON.stringify(msg));
        }
    }, [clientId]);

    const resetSession = useCallback(async () => {
        try {
            const baseUrl = getApiBaseUrl();
            await fetch(`${baseUrl}/api/session/${clientId}/reset`, { method: 'POST' });
            setData(null);
        } catch (e) {
            console.error('[ConcentraAI] Reset error:', e);
        }
    }, [getApiBaseUrl, clientId]);

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
        clientId: clientId,
    };
}
