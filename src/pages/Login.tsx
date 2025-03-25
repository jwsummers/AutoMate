
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Car, EyeOff, Eye, Mail, Lock } from 'lucide-react';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login attempt with:', { email, password });
    // Here would be authentication logic
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-dark-bg">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center pt-20 pb-16">
        <div className="w-full max-w-md px-4">
          <div className="glass-card rounded-xl border border-white/10 overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <Car className="w-10 h-10 text-neon-blue animate-pulse-glow" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
                <p className="text-foreground/70">
                  Sign in to your AutoMate account
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/50">
                      <Mail className="w-5 h-5" />
                    </div>
                    <Input
                      id="email"
                      type="email" 
                      placeholder="Enter your email"
                      className="pl-10 py-5 bg-dark-bg border-white/10 focus-visible:ring-neon-blue"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label htmlFor="password" className="text-sm font-medium">
                      Password
                    </label>
                    <Link to="/forgot-password" className="text-sm text-neon-blue hover:text-neon-blue/90">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/50">
                      <Lock className="w-5 h-5" />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="pl-10 pr-10 py-5 bg-dark-bg border-white/10 focus-visible:ring-neon-blue"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground/50 hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-neon-blue hover:bg-neon-blue/90 text-black font-medium py-5"
                >
                  Sign In
                </Button>
              </form>
              
              <div className="mt-6 pt-6 border-t border-white/10 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="text-foreground/70">Don't have an account?</span>
                  <Link to="/register" className="text-neon-blue hover:text-neon-blue/90 font-medium">
                    Sign up
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Login;
