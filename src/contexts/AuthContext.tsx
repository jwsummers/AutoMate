
import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isPro: boolean; // Added this property to indicate pro status
  signUp: (email: string, password: string, userData?: { full_name?: string }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPro, setIsPro] = useState(false); // Default to non-pro
  const navigate = useNavigate();
  
  // Function to check if user is a pro member
  const checkProStatus = async (userId: string) => {
    try {
      // This is where you would normally check against a subscriptions table
      // For this implementation, we'll use user metadata or just mock it
      
      // MOCK: For demo purposes, any user with an email containing "pro" is a pro user
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      // This is a mock implementation - in a real app, you'd check subscription status
      // For demo, users with email containing 'pro' or set directly in metadata are pro
      const userEmail = user?.email || '';
      const isPro = userEmail.includes('pro') || (user?.user_metadata?.is_pro === true);
      
      setIsPro(isPro);
    } catch (error) {
      console.error('Error checking pro status:', error);
      setIsPro(false);
    }
  };
  
  useEffect(() => {
    // Set up the auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        // Only update state synchronously
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Check pro status when user changes
        if (currentSession?.user) {
          checkProStatus(currentSession.user.id);
        } else {
          setIsPro(false);
        }
        
        // Handle specific auth events
        if (event === 'SIGNED_IN') {
          // Use setTimeout to defer any data fetching to avoid deadlocks
          setTimeout(() => {
            toast.success('Signed in successfully');
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setTimeout(() => {
            toast.info('Signed out');
            navigate('/');
          }, 0);
        }
      }
    );
    
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      // Check pro status on initial load
      if (currentSession?.user) {
        checkProStatus(currentSession.user.id);
      }
      
      setIsLoading(false);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);
  
  const signUp = async (email: string, password: string, userData?: { full_name?: string }) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: userData
        }
      });
      
      if (error) throw error;
      
      toast.success('Registration successful! Please check your email for confirmation.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during sign up');
      console.error('Sign up error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Invalid login credentials');
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'Error signing out');
      console.error('Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <AuthContext.Provider value={{ user, session, isLoading, isPro, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
