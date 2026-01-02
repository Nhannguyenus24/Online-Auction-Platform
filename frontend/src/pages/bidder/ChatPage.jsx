import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  Avatar,
  TextField,
  IconButton,
  Stack,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Badge,
} from '@mui/material';
import { Send, ArrowBack, CheckCircle, Schedule } from '@mui/icons-material';
import Page from '../../components/Page';
import { formatPrice } from '../../utils/formatNumber';
import useChatSocket from '../../hooks/useChatSocket';
import useConversationsSocket from '../../hooks/useConversationsSocket';
import { getMessagesByOrder, getConversations, markConversationAsRead } from '../../services/chatApi';
import { useAuth } from '../../hooks/useAuth';

const defaultAvatar = '/anonymous-user.jpg';

const BidderChatPage = () => {
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
      seller: {
        name: conv.sellerName || `Seller ${conv.orderId}`,
        avatar: conv.sellerAvatar || defaultAvatar,
      },
      status: conv.status || 'pending_payment',
      amount: conv.amount ? Number(conv.amount) : 0,
      lastMessage: {
        text: conv.lastMessageContent || '',
        sender: conv.lastMessageSenderRole?.toLowerCase() === 'seller' ? 'seller' : 'buyer',
        time: conv.lastMessageTime ? new Date(conv.lastMessageTime) : new Date(),
        read: (conv.unreadCountBidder || 0) === 0,
      },
      unreadCount: conv.unreadCountBidder || 0,
    };
  }, []);

  const selectedConversation = conversations.find((conv) => conv.orderId === orderId);

  const mapDtoToMessage = useCallback((dto) => {
    const role = (dto.senderRole || '').toLowerCase();
    return {
      id: dto.id || Date.now(),
      text: dto.content || '',
      sender: role === 'bidder' ? 'buyer' : 'seller',
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
      console.log('handleConversationMessage received:', payload);
      console.log('orderId from URL:', orderId);
      const isCurrentConversation = orderId === payload.orderId;
      const isBidder = payload.senderRole?.toLowerCase() === 'bidder';
      const isFromOtherParty = !isBidder; // Bidder receives messages from seller
      
      console.log('isFromOtherParty:', isFromOtherParty, 'isCurrentConversation:', isCurrentConversation);
      
      // If we're viewing this conversation and message is from other party,
      // backend will increment unread count, but we should keep it at 0
      // because user is actively viewing it. We'll refresh from DB when leaving.
      // If we're NOT viewing it, we need to fetch the latest unread count from DB.
      if (isFromOtherParty && !isCurrentConversation) {
        // Message from other party and we're NOT viewing it -> refresh from DB to get accurate unread count
        // Add small delay to ensure backend has committed the transaction
        console.log('Refreshing conversations from DB for bidder...');
        const userId = user?.id?.toString();
        if (!userId) return; // Don't refresh if user is not loaded
        
        setTimeout(() => {
          getConversations('BIDDER', userId)
            .then((data) => {
              console.log('Refreshed conversations:', data);
              const updatedConversations = (data || []).map(mapConversationToUI);
              setConversations(updatedConversations);
              
              // Check if the conversation has unread count, if not, retry once after another delay
              const targetConv = updatedConversations.find(c => c.orderId === payload.orderId);
              if (targetConv && targetConv.unreadCount === 0) {
                console.log('Unread count is 0, retrying refresh after delay...');
                setTimeout(() => {
                  getConversations('BIDDER', userId)
                    .then((retryData) => {
                      console.log('Retry refreshed conversations:', retryData);
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
                        sender: isBidder ? 'buyer' : 'seller',
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
        console.log('Updating last message only (message from current user or viewing conversation)');
        setConversations((prev) => {
          const updated = prev.map((conv) => {
            if (conv.orderId === payload.orderId) {
              return {
                ...conv,
                lastMessage: {
                  text: payload.content || '',
                  sender: isBidder ? 'buyer' : 'seller',
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
    orderId,
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

    getConversations('BIDDER', userId)
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
    getConversations('BIDDER', userId)
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
    
    markConversationAsRead(orderId, 'BIDDER')
      .then(() => {
        // Refresh conversations list to update unread status
        return getConversations('BIDDER', userId);
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim() || !orderId || !user?.id) return;
    const payload = {
      orderId,
      senderRole: 'BIDDER',
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending_payment':
        return 'warning';
      case 'paid':
        return 'info';
      case 'shipping':
        return 'primary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending_payment':
        return 'Pending Payment';
      case 'paid':
        return 'Paid';
      case 'shipping':
        return 'Shipping';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const handleSelectConversation = (orderId) => {
    // Don't clear messages here - let useEffect handle loading
    setError(null);
    navigate(`/bidder/chat/${orderId}`);
  };

  const isSelf = (msg) => msg.sender === 'buyer';

  // Show conversation list when no orderId
  if (!orderId) {
    return (
      <Page title="Chat - Bidder">
        <Container maxWidth="lg" sx={{ py: 2 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
              Chat with Sellers
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Communicate with sellers about your orders
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
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
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
                    <ListItemAvatar>
                      <Badge
                        variant="dot"
                        color="error"
                        invisible={conversation.unreadCount === 0}
                      >
                        <Avatar src={conversation.seller.avatar} alt={conversation.seller.name} />
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" fontWeight={conversation.unreadCount > 0 ? 600 : 400}>
                          {conversation.seller.name}
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
                            <Chip
                              label={getStatusLabel(conversation.status)}
                              size="small"
                              color={getStatusColor(conversation.status)}
                              sx={{ height: 18, fontSize: '0.65rem' }}
                            />
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

  // Show chat view when orderId exists
  if (!selectedConversation) {
    return (
      <Page title="Chat - Bidder">
        <Container maxWidth="lg" sx={{ py: 2 }}>
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6">No conversation found.</Typography>
          </Box>
        </Container>
      </Page>
    );
  }

  return (
    <Page title="Chat - Bidder">
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
            <IconButton onClick={() => navigate('/bidder/chat')}>
              <ArrowBack />
            </IconButton>
            <Avatar src={selectedConversation.seller.avatar} alt={selectedConversation.seller.name} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {selectedConversation.seller.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Order: {selectedConversation.orderId} • {formatPrice(selectedConversation.amount)}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={getStatusLabel(selectedConversation.status)}
                size="small"
                color={getStatusColor(selectedConversation.status)}
              />
              <Chip
                label={socketConnected ? 'Live' : 'Offline'}
                size="small"
                color={socketConnected ? 'success' : 'default'}
                variant={socketConnected ? 'filled' : 'outlined'}
              />
            </Stack>
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
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
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
                  const self = isSelf(msg);
                  const showAvatar = index === 0 || messages[index - 1].sender !== msg.sender;
                  const showTime =
                    index === messages.length - 1 ||
                    new Date(msg.time) - new Date(messages[index + 1].time) > 5 * 60 * 1000;

                  return (
                    <Box
                      key={msg.id}
                      sx={{
                        display: 'flex',
                        justifyContent: self ? 'flex-end' : 'flex-start',
                        gap: 1,
                        alignItems: 'flex-end',
                      }}
                    >
                      {!self && showAvatar && (
                        <Avatar src={selectedConversation.seller.avatar} alt={selectedConversation.seller.name} sx={{ width: 32, height: 32 }} />
                      )}
                      <Box
                        sx={{
                          maxWidth: { xs: '85%', sm: '75%', md: '70%' },
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: self ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.5,
                            bgcolor: self ? 'primary.main' : 'white',
                            color: self ? 'white' : 'text.primary',
                            borderRadius: 2,
                            borderTopLeftRadius: showAvatar && !self ? 0.5 : 2,
                            borderTopRightRadius: showAvatar && self ? 0.5 : 2,
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
                            {self && (
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
                      {self && showAvatar && <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>B</Avatar>}
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
                {sending ? <CircularProgress size={20} color="inherit" /> : <Send />}
              </IconButton>
            </Stack>
          </Box>
        </Card>
      </Container>
    </Page>
  );
};

export default BidderChatPage;

