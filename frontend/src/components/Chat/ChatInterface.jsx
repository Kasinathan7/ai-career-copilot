// file: frontend/src/components/Chat/ChatInterface.jsx
import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Paper,
  Typography,
  List,
  ListItem,
  Avatar,
  Chip,
  InputAdornment,
  Tooltip,
  Divider,
  CircularProgress
} from '@mui/material';
import { 
  Send, 
  SmartToy,
  Person,
  UploadFile,
  ContentCopy,
  RestartAlt
} from '@mui/icons-material';
import { useBotContext } from '../BotRouter';
import { chatAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ChatInterface = () => {
  const { switchBot } = useBotContext();
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your AI Resume Assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const scrollRef = useRef(null);

  // Initialize chat session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const response = await chatAPI.createSession({ type: 'general' });
        if (response.success) {
          setSessionId(response.data.sessionId);
        }
      } catch (error) {
        console.error('Failed to create chat session:', error);
        toast.error('Failed to initialize chat. Please try again.');
      }
    };

    initializeSession();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !sessionId) return;

    const userMessageText = inputValue.trim();
    const newMessage = {
      id: Date.now(),
      text: userMessageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setSending(true);

    try {
      const response = await chatAPI.sendMessage({
        sessionId,
        message: userMessageText,
        type: 'user'
      });

      if (response.success && response.data.botMessage) {
        const botResponse = {
          id: response.data.botMessage.id || Date.now() + 1,
          text: response.data.botMessage.content,
          sender: 'bot',
          timestamp: new Date(response.data.botMessage.timestamp),
          suggestions: response.data.suggestions
        };
        
        setMessages(prev => [...prev, botResponse]);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      const errorResponse = {
        id: Date.now() + 1,
        text: "I apologize, but I'm having trouble processing your message right now. Please try again later.",
        sender: 'bot',
        timestamp: new Date(),
        error: true
      };
      
      setMessages(prev => [...prev, errorResponse]);
      toast.error('Failed to get AI response. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: 0
    }}>
      {/* Header */}
      <Paper
        sx={{
          p: 2,
          borderRadius: 0,
          borderBottom: '1px solid',
          borderColor: 'divider',
          background: (t) => (t.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255,255,255,0.8)'),
          backdropFilter: 'saturate(180%) blur(8px)',
          flexShrink: 0
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <SmartToy color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            AI Resume Assistant
          </Typography>
          <Chip 
            label="LIVE CHAT" 
            color="success" 
            size="small" 
            variant="outlined"
            sx={{ ml: 'auto' }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary">
          Your intelligent career companion - Ask me anything about resumes, jobs, or career advice!
        </Typography>
      </Paper>

      {/* Messages */}
      <Box
        ref={scrollRef}
        sx={{ 
          flex: 1, 
          overflow: 'auto', 
          p: 2,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <List sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {messages.map((message) => (
            <ListItem
              key={message.id}
              disableGutters
              sx={{ display: 'flex', justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start' }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 1,
                  maxWidth: '75%',
                  flexDirection: message.sender === 'user' ? 'row-reverse' : 'row'
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: message.sender === 'user' ? 'primary.main' : 'secondary.main',
                    width: 32,
                    height: 32
                  }}
                >
                  {message.sender === 'user' ? <Person fontSize="small" /> : <SmartToy fontSize="small" />}
                </Avatar>

                <Paper
                  sx={{
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    borderTopLeftRadius: message.sender === 'user' ? 2 : 0,
                    borderTopRightRadius: message.sender === 'user' ? 0 : 2,
                    bgcolor: message.sender === 'user' ? 'primary.main' : 'background.paper',
                    color: message.sender === 'user' ? 'white' : 'text.primary',
                    border: '1px solid',
                    borderColor: message.sender === 'user' ? 'transparent' : 'divider'
                  }}
                >
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {message.text}
                  </Typography>
                </Paper>
              </Box>
            </ListItem>
          ))}

          {sending && (
            <ListItem disableGutters>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                <CircularProgress size={16} />
                <Typography variant="caption">Thinking...</Typography>
              </Box>
            </ListItem>
          )}
        </List>
      </Box>

      {/* Input */}
      <Paper
        sx={{
          px: 2,
          py: 1.5,
          borderRadius: 0,
          borderTop: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
          backgroundColor: 'background.paper'
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type your message here... Ask about resumes, interviews, jobs, or career advice!"
            variant="outlined"
            size="small"
            disabled={sending}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
          />

          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || sending}
            startIcon={sending ? <CircularProgress size={16} /> : <Send />}
            sx={{
              minWidth: 100,
              height: 40,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary">
            💡 Quick actions:
          </Typography>
          <Button size="small" variant="text" onClick={() => setInputValue("Analyze my resume for ATS compatibility")}>
            Analyze Resume
          </Button>
          <Button size="small" variant="text" onClick={() => setInputValue("Help me find relevant jobs")}>
            Find Jobs
          </Button>
          <Button size="small" variant="text" onClick={() => setInputValue("Practice interview questions")}>
            Mock Interview
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ChatInterface;
