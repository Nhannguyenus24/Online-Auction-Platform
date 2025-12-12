import { useState, useEffect, useRef, useCallback } from 'react';
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
import { getMessagesByOrder } from '../../services/chatApi';

const defaultAvatar = '/anonymous-user.jpg';

// Mock conversations for bidder (orders they won)
const mockConversations = [
  {
    orderId: 'ORD-001',
    productTitle: 'Vintage Rolex Submariner Watch',
    productImage: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=200',
    seller: {
      name: 'Seller ORD-001',
      avatar: defaultAvatar,
    },
    status: 'pending_payment',
    amount: 25000000,
    lastMessage: {
      text: 'Great! Once payment is confirmed, I will ship the item within 24 hours.',
      sender: 'seller',
      time: new Date(Date.now() - 25 * 60 * 1000),
      read: false,
    },
    unreadCount: 1,
  },
  {
    orderId: 'ORD-002',
    productTitle: 'Omega Speedmaster Professional Moonwatch',
    productImage: 'https://images.unsplash.com/photo-1622434641406-a158123450f9?w=200',
    seller: {
      name: 'Seller ORD-002',
      avatar: defaultAvatar,
    },
    status: 'paid',
    amount: 18000000,
    lastMessage: {
      text: 'Payment received! Thank you. I will prepare the shipment.',
      sender: 'seller',
      time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000),
      read: true,
    },
    unreadCount: 0,
  },
  {
    orderId: 'ORD-003',
    productTitle: 'TAG Heuer Carrera Automatic Chronograph',
    productImage: 'https://images.unsplash.com/photo-1606403726988-eb66a8c2d233?w=200',
    seller: {
      name: 'Seller ORD-003',
      avatar: defaultAvatar,
    },
    status: 'shipping',
    amount: 12000000,
    lastMessage: {
      text: 'The package has been shipped. Tracking number: TR123456789',
      sender: 'seller',
      time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      read: true,
    },
    unreadCount: 0,
  },
];

const BidderChatPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const selectedConversation = mockConversations.find((conv) => conv.orderId === orderId);

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

  const { connected: socketConnected, error: socketError, sendMessage } = useChatSocket({
    orderId,
    onMessage: handleIncomingMessage,
  });

  useEffect(() => {
    if (!orderId) return;
    let isMounted = true;
    setLoading(true);
    setError(null);

    getMessagesByOrder(orderId)
      .then((data) => {
        if (!isMounted) return;
        setMessages((data || []).map(mapDtoToMessage));
      })
      .catch(() => {
        if (!isMounted) return;
        setMessages([]);
        setError('Không tải được lịch sử chat. Vui lòng thử lại.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [mapDtoToMessage, orderId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim() || !orderId) return;
    const payload = {
      orderId,
      senderRole: 'BIDDER',
      senderName: `Bidder ${orderId}`,
      senderEmail: `bidder+${orderId}@example.com`,
      content: message.trim(),
    };

    try {
      setSending(true);
      sendMessage(payload);
      setMessage('');
    } catch (err) {
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
              {mockConversations.map((conversation) => (
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
                        badgeContent={conversation.unreadCount}
                        color="error"
                        invisible={conversation.unreadCount === 0}
                      >
                        <Avatar src={conversation.seller.avatar} alt={conversation.seller.name} />
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {conversation.seller.name}
                          </Typography>
                          {conversation.unreadCount > 0 && (
                            <Chip
                              label={conversation.unreadCount}
                              size="small"
                              color="error"
                              sx={{ height: 18, fontSize: '0.7rem', fontWeight: 'bold' }}
                            />
                          )}
                        </Box>
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
              ))}
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
            <Typography variant="h6">Không tìm thấy conversation.</Typography>
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
                  Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện!
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

