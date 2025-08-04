import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SubscriptionData {
  subscribed: boolean;
  plan: string;
  vehicles_limit: number;
  maintenance_limit: number;
  ai_access: boolean;
  ai_predictions: boolean;
  current_period_end?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isPro: boolean;
  subscriptionData: SubscriptionData | null;
  signUp: (
    email: string,
    password: string,
    userData?: { full_name?: string }
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionData | null>(null);
  const navigate = useNavigate();

  const checkSubscription = useCallback(async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase.functions.invoke(
        'check-subscription'
      );

      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }

      setSubscriptionData(data);
      setIsPro(data.ai_access);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Failed to check subscription:', error.message);
      } else {
        console.error('Failed to check subscription: Unknown error');
      }
    }
  }, [user]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (event === 'SIGNED_IN') {
        setTimeout(() => {
          toast.success('Signed in successfully');
          checkSubscription();
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        setTimeout(() => {
          toast.info('Signed out');
          setIsPro(false);
          setSubscriptionData(null);
          navigate('/');
        }, 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        setTimeout(() => {
          checkSubscription();
        }, 0);
      }

      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, checkSubscription]);

  const signUp = async (
    email: string,
    password: string,
    userData?: { full_name?: string }
  ) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
        },
      });

      if (error) throw error;

      toast.success(
        'Registration successful! Please check your email for confirmation.'
      );
      navigate('/login');
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || 'An error occurred during sign up');
        console.error('Sign up error:', error);
      } else {
        toast.error('An unknown error occurred during sign up');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      navigate('/dashboard');
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || 'Invalid login credentials');
        console.error('Sign in error:', error);
      } else {
        toast.error('An unknown error occurred during sign in');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || 'Error signing out');
        console.error('Sign out error:', error);
      } else {
        toast.error('An unknown error occurred during sign out');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isPro,
        subscriptionData,
        signUp,
        signIn,
        signOut,
        checkSubscription,
      }}
    >
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
