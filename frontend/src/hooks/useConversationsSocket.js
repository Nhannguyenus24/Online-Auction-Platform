import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_ENDPOINT = import.meta.env.VITE_CHAT_WS_URL || 'http://localhost:8085/ws-chat';

const useConversationsSocket = ({ orderIds, onMessage }) => {
  const clientRef = useRef(null);
  const subscriptionsRef = useRef([]);
  const [connected, setConnected] = useState(false);

  const cleanupClient = () => {
    // Unsubscribe from all topics
    subscriptionsRef.current.forEach((sub) => {
      if (sub) {
        sub.unsubscribe();
      }
    });
    subscriptionsRef.current = [];

    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }
  };

  useEffect(() => {
    if (!orderIds || orderIds.length === 0) {
      cleanupClient();
      setConnected(false);
      return () => {};
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_ENDPOINT),
      reconnectDelay: 4000,
      onConnect: () => {
        setConnected(true);
        // Subscribe to all conversations
        subscriptionsRef.current = orderIds.map((orderId) => {
          const topic = `/topic/chat.${orderId}`;
          return client.subscribe(topic, (frame) => {
            try {
              const payload = JSON.parse(frame.body);
              if (payload?.orderId && onMessage) {
                onMessage(payload);
              }
            } catch (err) {
              console.error('Failed to parse message', err);
            }
          });
        });
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers?.message);
      },
      onWebSocketError: (evt) => {
        console.error('WebSocket error:', evt?.message);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      cleanupClient();
      setConnected(false);
    };
  }, [orderIds.join(','), onMessage]);

  return { connected };
};

export default useConversationsSocket;

