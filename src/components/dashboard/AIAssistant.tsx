
import React, { useRef, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Brain, Zap, Crown, Loader2, Trash2 } from 'lucide-react';
import { useAIAssistant, Message } from '@/hooks/useAIAssistant';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

const AIAssistant = () => {
  const { messages, isLoading, isPro, sendMessage, clearMessages } = useAIAssistant();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput('');
    }
  };

  // Render each message with appropriate styling
  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';
    
    if (message.role === 'system') return null; // Don't display system messages
    
    return (
      <div 
        key={message.id} 
        className={`p-4 rounded-lg mb-4 ${
          isUser 
            ? 'ml-12 bg-neon-blue/10 border border-neon-blue/20' 
            : 'mr-12 bg-white/5 border border-white/10'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isUser 
              ? 'bg-neon-blue/20' 
              : 'bg-neon-purple/20'
          }`}>
            {isUser ? (
              <div className="w-5 h-5 text-neon-blue">👤</div>
            ) : (
              <Brain className="w-5 h-5 text-neon-purple" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">
              {isUser ? 'You' : 'Auto-Assist AI'}
            </p>
            <p className="text-foreground/90 whitespace-pre-wrap">{message.content}</p>
            <p className="text-xs text-foreground/50 mt-2">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>
    );
  };
  
  // For non-pro users, we show an upgrade banner
  const renderUpgradeBanner = () => {
    if (isPro) return null;
    
    return (
      <Card className="bg-gradient-to-r from-neon-purple/20 to-neon-blue/20 border-white/10 mb-4 overflow-hidden">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-full bg-neon-purple/20">
              <Crown className="h-5 w-5 text-neon-purple" />
            </div>
            <h3 className="text-lg font-semibold">Pro Feature</h3>
          </div>
          <p className="text-foreground/90 mb-4">
            Unlock our advanced AI assistant with a Pro membership. Get personalized maintenance advice, troubleshooting help, and instant answers to all your vehicle questions.
          </p>
          <div className="flex justify-end">
            <Button asChild className="bg-neon-purple hover:bg-neon-purple/90 text-white">
              <Link to="/pricing">Upgrade to Pro</Link>
            </Button>
          </div>
        </div>
      </Card>
    );
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-neon-purple/10 p-2 rounded-lg">
              <Brain className="h-5 w-5 text-neon-purple" />
            </div>
            <h2 className="text-xl font-bold">AI Assistant</h2>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-foreground/70 hover:text-foreground"
            onClick={clearMessages}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear Chat
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {renderUpgradeBanner()}
        
        {messages.length <= 1 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-neon-purple/10 flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-neon-purple" />
            </div>
            <h3 className="text-xl font-bold mb-2">Auto-Assist AI</h3>
            <p className="text-foreground/70 max-w-md mb-6">
              Get instant answers about vehicle maintenance, repair diagnostics, and service recommendations.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl w-full">
              <Button 
                variant="outline" 
                className="border-white/10 justify-start text-left"
                onClick={() => sendMessage("What maintenance should I do for my 2019 Toyota Camry at 50,000 miles?")}
              >
                <Zap className="w-4 h-4 mr-2 text-neon-blue" />
                <span>Maintenance schedule for my car</span>
              </Button>
              <Button 
                variant="outline" 
                className="border-white/10 justify-start text-left"
                onClick={() => sendMessage("Why is my car making a clicking noise when I turn?")}
              >
                <Zap className="w-4 h-4 mr-2 text-neon-blue" />
                <span>Diagnose a problem</span>
              </Button>
              <Button 
                variant="outline" 
                className="border-white/10 justify-start text-left"
                onClick={() => sendMessage("How do I check my transmission fluid?")}
              >
                <Zap className="w-4 h-4 mr-2 text-neon-blue" />
                <span>How-to instructions</span>
              </Button>
              <Button 
                variant="outline" 
                className="border-white/10 justify-start text-left"
                onClick={() => sendMessage("What's the difference between synthetic and conventional oil?")}
              >
                <Zap className="w-4 h-4 mr-2 text-neon-blue" />
                <span>Compare different options</span>
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-white/10">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <Textarea
            placeholder={isPro ? "Ask anything about vehicle maintenance..." : "Upgrade to Pro to ask our AI assistant..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading || (!isPro && messages.length > 1)}
            className="flex-1 min-h-[80px] resize-none bg-white/5 border-white/10 focus-visible:ring-neon-purple"
          />
          <Button 
            type="submit" 
            disabled={isLoading || input.trim() === '' || (!isPro && messages.length > 1)}
            className="bg-neon-purple hover:bg-neon-purple/90 h-10 px-4"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
        <p className="text-xs text-foreground/50 mt-2">
          {isPro 
            ? "Your assistant will provide general advice based on your inputs. For critical issues, consult with a professional mechanic."
            : "Upgrade to Pro for unlimited access to our AI assistant."}
        </p>
      </div>
    </div>
  );
};

export default AIAssistant;
