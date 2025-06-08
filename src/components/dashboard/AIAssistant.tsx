
import React from 'react';
import { Card } from "@/components/ui/card";
import { MessageSquare, Brain, Crown, Zap } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';

const AIAssistant = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="bg-neon-purple/10 p-2 rounded-lg">
            <Brain className="h-5 w-5 text-neon-purple" />
          </div>
          <h2 className="text-xl font-bold">AI Assistant</h2>
          <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-500 font-medium">
            Coming Soon
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <Card className="bg-gradient-to-r from-neon-purple/20 to-neon-blue/20 border-white/10 mb-4 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-neon-purple/20">
                <Crown className="h-6 w-6 text-neon-purple" />
              </div>
              <h3 className="text-xl font-semibold">AI Assistant Coming Soon!</h3>
            </div>
            <p className="text-foreground/90 mb-6 leading-relaxed">
              We're developing an advanced AI assistant that will provide personalized maintenance advice, 
              troubleshooting help, and instant answers to all your vehicle questions. This feature will be 
              available exclusively for Pro members.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-neon-blue" />
                  <h4 className="font-medium">Smart Diagnostics</h4>
                </div>
                <p className="text-sm text-foreground/70">Get instant help diagnosing vehicle problems</p>
              </div>
              
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-neon-blue" />
                  <h4 className="font-medium">Maintenance Guidance</h4>
                </div>
                <p className="text-sm text-foreground/70">Receive personalized maintenance recommendations</p>
              </div>
              
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-neon-blue" />
                  <h4 className="font-medium">Cost Estimates</h4>
                </div>
                <p className="text-sm text-foreground/70">Get repair and maintenance cost predictions</p>
              </div>
              
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-neon-blue" />
                  <h4 className="font-medium">24/7 Support</h4>
                </div>
                <p className="text-sm text-foreground/70">Ask questions anytime, get instant responses</p>
              </div>
            </div>
            
            <div className="flex justify-center">
              <Button asChild className="bg-neon-purple hover:bg-neon-purple/90 text-white">
                <Link to="/pricing">Upgrade to Pro for Early Access</Link>
              </Button>
            </div>
          </div>
        </Card>
        
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-neon-purple/10 flex items-center justify-center mb-4 mx-auto">
            <MessageSquare className="w-8 h-8 text-neon-purple" />
          </div>
          <h3 className="text-lg font-medium mb-2">Stay Tuned!</h3>
          <p className="text-foreground/70 max-w-md mx-auto">
            We're working hard to bring you the most advanced vehicle maintenance AI assistant. 
            Sign up for Pro to be the first to know when it's ready.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
