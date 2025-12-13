import axios from 'axios';

const baseURL = import.meta.env.VITE_CHAT_API_URL || 'http://localhost:8085';

const chatApi = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

export const getMessagesByOrder = async (orderId) => {
  const { data } = await chatApi.get(`/api/chat/${orderId}/messages`);
  return data;
};

export const getConversations = async (userRole, userId = 'mock-user') => {
  const { data } = await chatApi.get('/api/chat/conversations', {
    params: { userRole, userId },
  });
  return data;
};

export const markConversationAsRead = async (orderId, userRole) => {
  await chatApi.post(`/api/chat/${orderId}/mark-read`, null, {
    params: { userRole },
  });
};

export default chatApi;

