import { useState, useEffect, useRef, useCallback } from 'react';

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [connectionError, setConnectionError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    try {
      // Add a small delay to ensure backend is ready
      setTimeout(() => {
        const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:5002';
        console.log('🔌 Attempting WebSocket connection to:', wsUrl);
        
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setIsConnected(true);
          setReconnectAttempts(0);
          setConnectionError(null);
          console.log('✅ WebSocket connected successfully');
          
          // Send authentication message if user is logged in
          const token = localStorage.getItem('token');
          if (token) {
            ws.send(JSON.stringify({
              type: 'auth',
              token: token
            }));
          }
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            setLastMessage(message);
            
            // Handle different message types
            switch (message.type) {
              case 'market:update':
                // Market data updates
                break;
              case 'price:alert':
                // Price alerts
                break;
              case 'carbon:verification':
                // Carbon credit verification updates
                break;
              case 'system:health':
                // System health updates
                break;
              case 'portfolio:update':
                // Portfolio updates
                break;
              case 'news:update':
                // News updates
                break;
              default:
                console.log('📨 Unknown WebSocket message type:', message.type);
            }
          } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
          }
        };

        ws.onclose = (event) => {
          setIsConnected(false);
          console.log('🔌 WebSocket disconnected:', event.code, event.reason);
          
          // Attempt to reconnect unless it was a clean close
          if (event.code !== 1000 && reconnectAttempts < 5) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
            console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts + 1}/5)`);
            reconnectTimeoutRef.current = setTimeout(() => {
              setReconnectAttempts(prev => prev + 1);
              connect();
            }, delay);
          } else if (reconnectAttempts >= 5) {
            setConnectionError('Max reconnection attempts reached. WebSocket connection failed.');
            console.error('❌ Max WebSocket reconnection attempts reached');
          }
        };

        ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          setIsConnected(false);
          setConnectionError('WebSocket connection error occurred');
        };

        wsRef.current = ws;
      }, 2000); // 2 second delay to ensure backend is ready
      
    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      setIsConnected(false);
      setConnectionError(error.message);
    }
  }, [reconnectAttempts]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'User initiated disconnect');
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
    setConnectionError(null);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    isConnected,
    lastMessage,
    connectionError,
    reconnectAttempts,
    connect,
    disconnect
  };
};
