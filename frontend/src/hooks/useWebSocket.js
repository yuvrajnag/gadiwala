import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_URL = 'http://localhost:8080/ws-simulation';

export const useWebSocket = (rideId, onMessageReceived) => {
    const [connected, setConnected] = useState(false);
    const clientRef = useRef(null);

    // Save the latest callback to avoid unnecessary re-connections
    const callbackRef = useRef(onMessageReceived);
    useEffect(() => {
        callbackRef.current = onMessageReceived;
    }, [onMessageReceived]);

    useEffect(() => {
        if (!rideId) return;

        const client = new Client({
            webSocketFactory: () => new SockJS(WS_URL),
            reconnectDelay: 5000,
            onConnect: () => {
                setConnected(true);
                client.subscribe(`/topic/ride/${rideId}`, (message) => {
                    if (message.body && callbackRef.current) {
                        const parsedMessage = JSON.parse(message.body);
                        callbackRef.current(parsedMessage);
                    }
                });
            },
            onDisconnect: () => {
                setConnected(false);
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
                console.error('Additional details: ' + frame.body);
            },
        });

        client.activate();
        clientRef.current = client;

        return () => {
            if (clientRef.current) {
                clientRef.current.deactivate();
            }
        };
    }, [rideId]);

    const sendMessage = useCallback((destination, body) => {
        if (clientRef.current && connected) {
            clientRef.current.publish({ destination, body: JSON.stringify(body) });
        }
    }, [connected]);

    return { connected, sendMessage };
};
