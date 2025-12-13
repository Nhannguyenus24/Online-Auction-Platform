import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_ENDPOINT = import.meta.env.VITE_CHAT_WS_URL || 'http://localhost:8085/ws-chat';
const SEND_DESTINATION = '/app/chat.send';

const useChatSocket = ({ orderId, onMessage }) => {
  const clientRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  const cleanupClient = () => {
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }
  };

  const handleMessage = useCallback(
    (frame) => {
      try {
        const payload = JSON.parse(frame.body);
        if (payload?.orderId === orderId && onMessage) {
          onMessage(payload);
        }
      } catch (err) {
        console.error('Failed to parse message', err);
      }
    },
    [onMessage, orderId]
  );

  useEffect(() => {
    if (!orderId) {
      cleanupClient();
      setConnected(false);
      return () => {};
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_ENDPOINT),
      reconnectDelay: 4000,
      onConnect: () => {
        setConnected(true);
        setError(null);
        client.subscribe(`/topic/chat.${orderId}`, handleMessage);
      },
      onStompError: (frame) => {
        setError(frame.headers?.message || 'STOMP error');
      },
      onWebSocketError: (evt) => {
        setError(evt?.message || 'WebSocket error');
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      cleanupClient();
      setConnected(false);
    };
  }, [handleMessage, orderId]);

  const sendMessage = (payload) => {
    if (!clientRef.current || !clientRef.current.connected) {
      throw new Error('Socket not connected');
    }

    clientRef.current.publish({
      destination: SEND_DESTINATION,
      body: JSON.stringify(payload),
    });
  };

  return {
    connected,
    error,
    sendMessage,
  };
};

export default useChatSocket;

