
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export const useAIAssistant = () => {
  const { isPro } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'system-1',
      role: 'system',
      content: 'I am Auto-Assist AI, your vehicle maintenance assistant. I can help you with maintenance tips, troubleshooting advice, and general vehicle information.',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    // Create new user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date()
    };
    
    // Add user message to the list
    setMessages(prev => [...prev, userMessage]);
    
    // Pro members get real AI responses
    if (isPro) {
      setIsLoading(true);
      
      try {
        // Call Supabase Edge Function to get AI response
        const { data, error } = await supabase.functions.invoke('ai-assistant', {
          body: { 
            message: content,
            history: messages.filter(m => m.role !== 'system').map(m => ({
              role: m.role,
              content: m.content
            }))
          }
        });
        
        if (error) throw error;
        
        // Add AI response to messages
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.response || "I'm sorry, I couldn't process your request at the moment.",
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        
        // If this is a mock response (no API key), show info toast
        if (data.isMock) {
          toast.info("The AI assistant is in demo mode. Contact your administrator to enable full functionality.");
        }
      } catch (error) {
        console.error('Error communicating with AI:', error);
        toast.error('Failed to get a response from the AI assistant.');
        
        // Add error message
        const errorMessage: Message = {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          content: "I'm sorry, I encountered an error while processing your request. Please try again later.",
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    } else {
      // For non-pro users, add a message about upgrading
      setTimeout(() => {
        const upgradeMessage: Message = {
          id: `assistant-upgrade-${Date.now()}`,
          role: 'assistant',
          content: "This feature is available exclusively for Pro members. Upgrade your account to access our AI assistant for personalized maintenance advice and troubleshooting.",
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, upgradeMessage]);
      }, 500); // Small delay to make it feel more natural
    }
  };
  
  const clearMessages = () => {
    setMessages([
      {
        id: 'system-1',
        role: 'system',
        content: 'I am Auto-Assist AI, your vehicle maintenance assistant. I can help you with maintenance tips, troubleshooting advice, and general vehicle information.',
        timestamp: new Date()
      }
    ]);
  };
  
  return {
    messages,
    isLoading,
    isPro,
    sendMessage,
    clearMessages
  };
};
