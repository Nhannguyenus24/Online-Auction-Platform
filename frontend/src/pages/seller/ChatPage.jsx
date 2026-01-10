import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  TextField,
  IconButton,
  Stack,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  Send,
  ArrowBack,
  CheckCircle,
  Schedule,
} from '@mui/icons-material';
import Page from '../../components/Page';
import { formatPrice } from '../../utils/formatNumber';
import useChatSocket from '../../hooks/useChatSocket';
import useConversationsSocket from '../../hooks/useConversationsSocket';
import { getMessagesByOrder, getConversations, markConversationAsRead } from '../../services/chatApi';
import { useAuth } from '../../hooks/useAuth';

const SellerChatPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // Map API conversation to UI format
  const mapConversationToUI = useCallback((conv) => {
    return {
      orderId: conv.orderId,
      winner: {
        name: conv.bidderName || `Bidder ${conv.orderId}`,
      },
      status: conv.status || 'pending_payment',
      amount: conv.amount ? Number(conv.amount) : 0,
      lastMessage: {
        text: conv.lastMessageContent || '',
        sender: conv.lastMessageSenderRole?.toLowerCase() === 'bidder' ? 'buyer' : 'seller',
        time: conv.lastMessageTime ? new Date(conv.lastMessageTime) : new Date(),
        read: (conv.unreadCountSeller || 0) === 0,
      },
      unreadCount: conv.unreadCountSeller || 0,
    };
  }, []);

  const selectedConversation = conversations.find((conv) => conv.orderId === orderId);

  const mapDtoToMessage = useCallback((dto) => {
    const role = (dto.senderRole || '').toLowerCase();
    return {
      id: dto.id || Date.now(),
      text: dto.content || '',
      sender: role === 'seller' ? 'seller' : 'buyer',
      time: dto.createdAt ? new Date(dto.createdAt) : new Date(),
      read: true,
    };
  }, []);

  const handleIncomingMessage = useCallback(
    (payload) => {
      setMessages((prev) => [...prev, mapDtoToMessage(payload)]);
    },
    [mapDtoToMessage]
  );

  // Handle incoming messages for conversation list updates
  const handleConversationMessage = useCallback(
    (payload) => {
      const isCurrentConversation = orderId === payload.orderId;
      const isSeller = payload.senderRole?.toLowerCase() === 'seller';
      const isFromOtherParty = !isSeller;
      
      // If we're viewing this conversation and message is from other party,
      // backend will increment unread count, but we should keep it at 0
      // because user is actively viewing it. We'll refresh from DB when leaving.
      // If we're NOT viewing it, we need to fetch the latest unread count from DB.
      if (isFromOtherParty && !isCurrentConversation) {
        // Message from other party and we're NOT viewing it -> refresh from DB to get accurate unread count
        // Add small delay to ensure backend has committed the transaction
        const userId = user?.id?.toString();
        if (!userId) return; // Don't refresh if user is not loaded
        
        setTimeout(() => {
          getConversations('SELLER', userId)
            .then((data) => {
              const updatedConversations = (data || []).map(mapConversationToUI);
              setConversations(updatedConversations);
              
              // Check if the conversation has unread count, if not, retry once after another delay
              const targetConv = updatedConversations.find(c => c.orderId === payload.orderId);
              if (targetConv && targetConv.unreadCount === 0) {
                setTimeout(() => {
                  getConversations('SELLER', userId)
                    .then((retryData) => {
                      setConversations((retryData || []).map(mapConversationToUI));
                    })
                    .catch((err) => {
                      console.error('Retry failed to refresh conversations:', err);
                    });
                }, 300);
              }
            })
            .catch((err) => {
              console.error('Failed to refresh conversations:', err);
              // Fallback: update locally
              setConversations((prev) => {
                const updated = prev.map((conv) => {
                  if (conv.orderId === payload.orderId) {
                    return {
                      ...conv,
                      lastMessage: {
                        text: payload.content || '',
                        sender: isSeller ? 'seller' : 'buyer',
                        time: payload.createdAt ? new Date(payload.createdAt) : new Date(),
                        read: false,
                      },
                      unreadCount: (conv.unreadCount || 0) + 1,
                    };
                  }
                  return conv;
                });
                return updated.sort((a, b) => b.lastMessage.time - a.lastMessage.time);
              });
            });
        }, 100); // 100ms delay to ensure backend transaction is committed
      } else {
        // Message from current user or we're viewing this conversation -> just update last message
        setConversations((prev) => {
          const updated = prev.map((conv) => {
            if (conv.orderId === payload.orderId) {
              return {
                ...conv,
                lastMessage: {
                  text: payload.content || '',
                  sender: isSeller ? 'seller' : 'buyer',
                  time: payload.createdAt ? new Date(payload.createdAt) : new Date(),
                  read: isCurrentConversation, // If viewing, it's read
                },
                unreadCount: isCurrentConversation ? 0 : (conv.unreadCount || 0),
              };
            }
            return conv;
          });
          return updated.sort((a, b) => b.lastMessage.time - a.lastMessage.time);
        });
      }
    },
    [orderId, mapConversationToUI, user]
  );

  const { connected: socketConnected, error: socketError, sendMessage } = useChatSocket({
    orderId: orderId,
    onMessage: handleIncomingMessage,
  });

  // Subscribe to all conversations for real-time updates
  const conversationOrderIds = useMemo(() => {
    return conversations.map((conv) => conv.orderId);
  }, [conversations]);
  
  useConversationsSocket({
    orderIds: conversationOrderIds,
    onMessage: handleConversationMessage,
  });

  // Load conversations list
  useEffect(() => {
    if (!user?.id) return; // Don't load if user is not available
    
    let isMounted = true;
    setLoadingConversations(true);
    const userId = user.id.toString();

    getConversations('SELLER', userId)
      .then((data) => {
        if (!isMounted) return;
        setConversations((data || []).map(mapConversationToUI));
      })
      .catch(() => {
        if (!isMounted) return;
        setConversations([]);
      })
      .finally(() => {
        if (isMounted) setLoadingConversations(false);
      });

    return () => {
      isMounted = false;
    };
  }, [mapConversationToUI, user]);

  // Refresh conversations list when returning from a conversation (orderId becomes null)
  useEffect(() => {
    if (!orderId || !user?.id) return; // Don't refresh if user is not available
    
    // We're on the conversation list page, refresh to get latest unread counts
    const userId = user.id.toString();
    getConversations('SELLER', userId)
      .then((data) => {
        setConversations((data || []).map(mapConversationToUI));
      })
      .catch(() => {
        // Silently fail, don't show error
      });
  }, [orderId, mapConversationToUI, user]);

  // Load messages when orderId selected and mark as read
  useEffect(() => {
    if (!orderId) return;
    let isMounted = true;
    setLoading(true);
    setError(null);
    // Clear messages when switching to a new conversation
    setMessages([]);

    // Mark conversation as read
    const userId = user?.id?.toString();
    if (!userId) {
      setLoading(false);
      return;
    }
    
    markConversationAsRead(orderId, 'SELLER')
      .then(() => {
        // Refresh conversations list to update unread status
        return getConversations('SELLER', userId);
      })
      .then((data) => {
        if (!isMounted) return;
        setConversations((data || []).map(mapConversationToUI));
      })
      .catch((err) => {
        console.error('Error marking as read:', err);
      });

    // Load messages
    getMessagesByOrder(orderId)
      .then((data) => {
        if (!isMounted) return;
        const mappedMessages = (data || []).map(mapDtoToMessage);
        setMessages(mappedMessages);
        setLoading(false);
        if (mappedMessages.length === 0) {
          // Only show error if we expected messages but got none
          // This is normal for new conversations
        }
      })
      .catch((err) => {
        console.error('Error loading messages:', err);
        if (!isMounted) return;
        setError('Không tải được lịch sử chat. Vui lòng thử lại.');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [mapDtoToMessage, mapConversationToUI, orderId, user]);

  useEffect(() => {
    // Auto scroll to bottom when messages change or orderId changes
    // Use setTimeout to ensure DOM has updated
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, orderId]);

  const handleSelectConversation = (orderId) => {
    // Don't clear messages here - let useEffect handle loading
    setError(null);
    navigate(`/seller/chat/${orderId}`);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !orderId || !user?.id) return;
    const payload = {
      orderId: orderId,
      senderRole: 'SELLER',
      senderName: user.fullName || user.name || `User ${user.id}`,
      senderEmail: user.email || `user${user.id}@example.com`,
      content: message.trim(),
    };

    try {
      setSending(true);
      sendMessage(payload);
      setMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Không thể gửi tin nhắn. Vui lòng kiểm tra kết nối và thử lại.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getTimeDisplay = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' });
  };
  // Show conversation list when no orderId
  if (!orderId) {
    return (
      <Page title="Chat - Seller Dashboard">
        <Container maxWidth="lg" sx={{ py: 2 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
              Chat with Winners
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Communicate with buyers to complete orders
            </Typography>
          </Box>

          <Card elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'white' }}>
              <Typography variant="h6" fontWeight={600}>
                Conversations
              </Typography>
              </Box>
              <List sx={{ p: 0 }}>
                {loadingConversations ? (
                  <Box sx={{ p: 2 }}>
                    {[...Array(5)].map((_, index) => (
                      <Box key={`skeleton-conv-${index}`} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-start' }}>
                        <Skeleton variant="circular" width={56} height={56} flexShrink={0} />
                        <Box sx={{ flexGrow: 1, width: '100%' }}>
                          <Skeleton variant="text" width="40%" height={20} sx={{ mb: 1 }} />
                          <Skeleton variant="text" width="100%" height={16} sx={{ mb: 1 }} />
                          <Skeleton variant="text" width="60%" height={14} />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : conversations.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      There is no conversation yet
                    </Typography>
                  </Box>
                ) : (
                  conversations.map((conversation) => (
                <ListItem key={conversation.orderId} disablePadding>
                  <ListItemButton
                    onClick={() => handleSelectConversation(conversation.orderId)}
                    sx={{
                      py: 2,
                      px: 2,
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" fontWeight={conversation.unreadCount > 0 ? 600 : 400}>
                          {conversation.winner.name}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography
                            component="div"
                            variant="caption"
                            sx={{
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              mb: 0.5,
                              fontWeight: conversation.unreadCount > 0 ? 600 : 400,
                            }}
                          >
                            {conversation.lastMessage.text}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography component="span" variant="caption" color="text.secondary">
                              {getTimeDisplay(conversation.lastMessage.time)}
                            </Typography>
                          </Box>
                        </Box>
                      }
                      secondaryTypographyProps={{ component: 'div' }}
                    />
                    </ListItemButton>
                  </ListItem>
                  ))
                )}
              </List>
          </Card>
        </Container>
      </Page>
    );
  }

  // Show chat view when orderId exists (similar to bidder)
  if (!selectedConversation) {
    return (
      <Page title="Chat - Seller">
        <Container maxWidth="lg" sx={{ py: 2 }}>
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6">No conversation found.</Typography>
          </Box>
        </Container>
      </Page>
    );
  }

  return (
    <Page title="Chat - Seller">
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Card
          elevation={0}
          sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}
        >
          {/* Header */}
          <Box
            sx={{
              p: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              bgcolor: 'grey.50',
            }}
          >
            <IconButton onClick={() => navigate('/seller/chat')}>
              <ArrowBack />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {selectedConversation.winner.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Order: {selectedConversation.orderId} • {formatPrice(selectedConversation.amount)}
              </Typography>
            </Box>
          </Box>

          {/* Messages */}
          <Box
            sx={{
              minHeight: 500,
              maxHeight: '75vh',
              overflow: 'auto',
              p: { xs: 2, sm: 3 },
              bgcolor: '#f5f5f5',
              backgroundImage:
                'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 119, 198, 0.03) 0%, transparent 50%)',
            }}
          >
            {(error || socketError) && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error || socketError}
              </Alert>
            )}
            {loading ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, py: 3 }}>
                {[...Array(5)].map((_, index) => (
                  <Box key={`skeleton-msg-${index}`} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                    <Skeleton variant="circular" width={36} height={36} flexShrink={0} />
                    <Box sx={{ flexGrow: 1, width: '100%' }}>
                      <Skeleton variant="text" width="40%" height={16} sx={{ mb: 0.5 }} />
                      <Skeleton variant="rectangular" width="80%" height={44} sx={{ borderRadius: 1, mb: 1 }} />
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : messages.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="body1" color="text.secondary">
                  No messages yet. Start the conversation!
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {messages.map((msg, index) => {
                  const isSeller = msg.sender === 'seller';
                  const showTime =
                    index === messages.length - 1 ||
                    new Date(msg.time) - new Date(messages[index + 1].time) > 5 * 60 * 1000;

                  return (
                    <Box
                      key={msg.id}
                      sx={{
                        display: 'flex',
                        justifyContent: isSeller ? 'flex-end' : 'flex-start',
                        gap: 1,
                        alignItems: 'flex-end',
                      }}
                    >
                      <Box
                        sx={{
                          maxWidth: { xs: '85%', sm: '75%', md: '70%' },
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isSeller ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.5,
                            bgcolor: isSeller ? 'primary.main' : 'white',
                            color: isSeller ? 'white' : 'text.primary',
                            borderRadius: 2,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                          }}
                        >
                          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                            {msg.text}
                          </Typography>
                        </Paper>
                        {showTime && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, px: 1 }}>
                            <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                              {getTimeDisplay(msg.time)}
                            </Typography>
                            {isSeller && (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {msg.read ? (
                                  <CheckCircle sx={{ fontSize: 14, color: 'primary.main' }} />
                                ) : (
                                  <Schedule sx={{ fontSize: 14, color: 'text.disabled' }} />
                                )}
                              </Box>
                            )}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  );
                })}
                <div ref={messagesEndRef} />
              </Stack>
            )}
          </Box>

          {/* Input */}
          <Box
            sx={{
              p: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'white',
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <TextField
                fullWidth
                multiline
                maxRows={4}
                placeholder="Nhập tin nhắn..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={sending}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    bgcolor: 'grey.50',
                    minHeight: 24,
                    alignItems: 'center',
                  },
                  '& .MuiInputBase-input': {
                    py: 0,
                  },
                }}
              />
              <IconButton
                color="primary"
                onClick={handleSendMessage}
                disabled={!message.trim() || sending || !socketConnected}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  minWidth: 40,
                  width: 40,
                  height: 40,
                  flexShrink: 0,
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'grey.300',
                    color: 'white',
                  },
                }}
              >
                {sending ? <Send /> : <Send />}
              </IconButton>
            </Stack>
          </Box>
        </Card>
      </Container>
    </Page>
  );
};

export default SellerChatPage;

