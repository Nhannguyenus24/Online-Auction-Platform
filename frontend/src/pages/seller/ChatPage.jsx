import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  TextField,
  IconButton,
  Stack,
  Paper,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Badge,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Send,
  AttachFile,
  EmojiEmotions,
  ArrowBack,
  CheckCircle,
  Schedule,
} from '@mui/icons-material';
import Page from '../../components/Page';
import { fVNDate } from '../../utils/formatTime';
import { formatPrice } from '../../utils/formatNumber';

// Mock data for conversations (orders with winners)
const mockConversations = [
  {
    orderId: 'ORD-001',
    productId: 1,
    productTitle: 'Vintage Rolex Submariner Watch',
    productImage: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=200',
    winner: {
      id: 201,
      name: 'Alice Johnson',
      avatar: 'https://i.pravatar.cc/150?img=1',
    },
    status: 'pending_payment',
    amount: 25000000,
    lastMessage: {
      text: 'Thank you! I will send the payment today.',
      sender: 'buyer',
      time: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      read: false,
    },
    unreadCount: 2,
  },
  {
    orderId: 'ORD-002',
    productId: 2,
    productTitle: 'Omega Speedmaster Professional Moonwatch',
    productImage: 'https://images.unsplash.com/photo-1622434641406-a158123450f9?w=200',
    winner: {
      id: 202,
      name: 'Bob Smith',
      avatar: 'https://i.pravatar.cc/150?img=2',
    },
    status: 'paid',
    amount: 18000000,
    lastMessage: {
      text: 'When will you ship the item?',
      sender: 'buyer',
      time: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: true,
    },
    unreadCount: 0,
  },
  {
    orderId: 'ORD-003',
    productId: 3,
    productTitle: 'TAG Heuer Carrera Automatic Chronograph',
    productImage: 'https://images.unsplash.com/photo-1606403726988-eb66a8c2d233?w=200',
    winner: {
      id: 203,
      name: 'Charlie Brown',
      avatar: 'https://i.pravatar.cc/150?img=3',
    },
    status: 'shipping',
    amount: 12000000,
    lastMessage: {
      text: 'The package has been shipped. Tracking number: TR123456789',
      sender: 'seller',
      time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      read: true,
    },
    unreadCount: 0,
  },
];

// Mock messages for a conversation
const mockMessages = {
  'ORD-001': [
    {
      id: 1,
      text: 'Hello! I won the auction for the Rolex watch. When can I make the payment?',
      sender: 'buyer',
      time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      read: true,
    },
    {
      id: 2,
      text: 'Congratulations on winning! You can make the payment anytime. The payment details are in the order confirmation email.',
      sender: 'seller',
      time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000),
      read: true,
    },
    {
      id: 3,
      text: 'Thank you! I will send the payment today.',
      sender: 'buyer',
      time: new Date(Date.now() - 30 * 60 * 1000),
      read: false,
    },
    {
      id: 4,
      text: 'Great! Once payment is confirmed, I will ship the item within 24 hours.',
      sender: 'seller',
      time: new Date(Date.now() - 25 * 60 * 1000),
      read: false,
    },
  ],
  'ORD-002': [
    {
      id: 1,
      text: 'Hi! I have completed the payment. Please confirm.',
      sender: 'buyer',
      time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      read: true,
    },
    {
      id: 2,
      text: 'Payment received! Thank you. I will prepare the shipment.',
      sender: 'seller',
      time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000),
      read: true,
    },
    {
      id: 3,
      text: 'When will you ship the item?',
      sender: 'buyer',
      time: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: true,
    },
  ],
  'ORD-003': [
    {
      id: 1,
      text: 'Hello! I received the watch. It looks great!',
      sender: 'buyer',
      time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      read: true,
    },
    {
      id: 2,
      text: 'I am glad you like it! Enjoy your new watch!',
      sender: 'seller',
      time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000),
      read: true,
    },
  ],
};

const SellerChatPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [selectedOrderId, setSelectedOrderId] = useState(orderId || null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const selectedConversation = mockConversations.find((conv) => conv.orderId === selectedOrderId);

  useEffect(() => {
    if (selectedOrderId) {
      setLoading(true);
      // Mock API call
      setTimeout(() => {
        setMessages(mockMessages[selectedOrderId] || []);
        setLoading(false);
      }, 500);
    }
  }, [selectedOrderId]);

  useEffect(() => {
    // Auto scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectConversation = (orderId) => {
    setSelectedOrderId(orderId);
    navigate(`/seller/chat/${orderId}`);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedOrderId) return;

    const newMessage = {
      id: Date.now(),
      text: message.trim(),
      sender: 'seller',
      time: new Date(),
      read: false,
    };

    setSending(true);
    // Mock API call
    await new Promise((resolve) => setTimeout(resolve, 300));

    setMessages((prev) => [...prev, newMessage]);
    setMessage('');
    setSending(false);
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

  return (
    <Page title="Chat - Seller Dashboard">
      <Container maxWidth="xl">
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
            Chat with Winners
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Communicate with buyers to complete orders
          </Typography>
        </Box>

        <Card elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', height: 'calc(100vh - 250px)', minHeight: 600 }}>
            {/* Conversations List */}
            <Box
              sx={{
                width: 350,
                borderRight: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'grey.50',
              }}
            >
              <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'white' }}>
                <Typography variant="h6" fontWeight={600}>
                  Conversations
                </Typography>
              </Box>
              <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
                {mockConversations.map((conversation) => (
                  <ListItem key={conversation.orderId} disablePadding>
                    <ListItemButton
                      selected={selectedOrderId === conversation.orderId}
                      onClick={() => handleSelectConversation(conversation.orderId)}
                      sx={{
                        py: 2,
                        px: 2,
                        '&.Mui-selected': {
                          bgcolor: 'primary.lighter',
                          borderLeft: '3px solid',
                          borderColor: 'primary.main',
                        },
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
                          <Avatar src={conversation.winner.avatar} alt={conversation.winner.name} />
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {conversation.winner.name}
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
                              <Typography variant="caption" color="text.secondary">
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
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Box>

            {/* Chat Area */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: 'white' }}>
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
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
                    <IconButton onClick={() => navigate('/seller/chat')} sx={{ display: { md: 'none' } }}>
                      <ArrowBack />
                    </IconButton>
                    <Avatar src={selectedConversation.winner.avatar} alt={selectedConversation.winner.name} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {selectedConversation.winner.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Order: {selectedConversation.orderId} • {formatPrice(selectedConversation.amount)}
                      </Typography>
                    </Box>
                    <Chip
                      label={getStatusLabel(selectedConversation.status)}
                      size="small"
                      color={getStatusColor(selectedConversation.status)}
                    />
                  </Box>

                  {/* Messages Area */}
                  <Box
                    sx={{
                      flex: 1,
                      overflow: 'auto',
                      p: 3,
                      bgcolor: '#f5f5f5',
                      backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255, 119, 198, 0.03) 0%, transparent 50%)',
                    }}
                  >
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
                          const isSeller = msg.sender === 'seller';
                          const showAvatar = index === 0 || messages[index - 1].sender !== msg.sender;
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
                              {!isSeller && showAvatar && (
                                <Avatar
                                  src={selectedConversation.winner.avatar}
                                  alt={selectedConversation.winner.name}
                                  sx={{ width: 32, height: 32 }}
                                />
                              )}
                              <Box
                                sx={{
                                  maxWidth: '70%',
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
                                    borderTopLeftRadius: showAvatar && !isSeller ? 0.5 : 2,
                                    borderTopRightRadius: showAvatar && isSeller ? 0.5 : 2,
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
                              {isSeller && showAvatar && (
                                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>S</Avatar>
                              )}
                            </Box>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </Stack>
                    )}
                  </Box>

                  {/* Message Input */}
                  <Box
                    sx={{
                      p: 2,
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'white',
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="flex-end">
                      <IconButton size="small" color="primary">
                        <AttachFile />
                      </IconButton>
                      <TextField
                        fullWidth
                        multiline
                        maxRows={4}
                        placeholder="Type your message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={sending}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            bgcolor: 'grey.50',
                          },
                        }}
                      />
                      <IconButton size="small" color="primary">
                        <EmojiEmotions />
                      </IconButton>
                      <IconButton
                        color="primary"
                        onClick={handleSendMessage}
                        disabled={!message.trim() || sending}
                        sx={{
                          bgcolor: 'primary.main',
                          color: 'white',
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
                </>
              ) : (
                <Box
                  sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 2,
                    bgcolor: 'grey.50',
                  }}
                >
                  <Typography variant="h6" color="text.secondary">
                    Select a conversation to start chatting
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Choose a conversation from the list on the left
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Card>
      </Container>
    </Page>
  );
};

export default SellerChatPage;

