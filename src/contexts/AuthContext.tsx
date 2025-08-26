import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { safeInvoke } from '@/utils/safeInvoke';

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

// ⛔ Kill-switch for local dev: put VITE_SKIP_SUBSCRIPTION=1 in .env.local to skip hitting the Edge Function
const SKIP_SUB_CHECK = import.meta.env?.VITE_SKIP_SUBSCRIPTION === '1';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionData | null>(null);

  const checkingRef = useRef(false); // single-flight guard
  const lastCheckRef = useRef(0); // throttle timestamp (ms)
  const navigate = useNavigate();

  const checkSubscription = useCallback(async () => {
    if (!user?.id) return;

    if (SKIP_SUB_CHECK) {
      console.warn('checkSubscription skipped (VITE_SKIP_SUBSCRIPTION=1)');
      return;
    }

    // throttle to once every 30s regardless of success/failure
    const now = Date.now();
    if (now - lastCheckRef.current < 30_000) {
      return;
    }
    if (checkingRef.current) {
      return;
    }

    checkingRef.current = true;
    lastCheckRef.current = now;

    try {
      const data = await safeInvoke<SubscriptionData>({
        fn: 'check-subscription',
        timeoutMs: 10_000,
      });

      setSubscriptionData(data);
      setIsPro(Boolean(data?.ai_access));
    } catch (err) {
      // keep UI usable; log for visibility
      console.error('Error checking subscription:', err);
    } finally {
      checkingRef.current = false;
    }
  }, [user?.id]);

  // Subscribe to auth state ONCE; do not call checkSubscription here.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (event === 'SIGNED_IN') {
        toast.success('Signed in successfully');
      } else if (event === 'SIGNED_OUT') {
        toast.info('Signed out');
        setIsPro(false);
        setSubscriptionData(null);
        navigate('/');
      }
    });

    // Initialize from current session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Only call checkSubscription when we actually have a user (and when user changes)
  useEffect(() => {
    if (user?.id) {
      checkSubscription();
    } else {
      setIsPro(false);
      setSubscriptionData(null);
    }
  }, [user?.id, checkSubscription]);

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
        options: { data: userData },
      });
      if (error) throw error;

      toast.success(
        'Registration successful! Please check your email for confirmation.'
      );
      navigate('/login');
    } catch (error: unknown) {
      const msg =
        error && typeof error === 'object' && 'message' in error
          ? (error as { message: string }).message
          : 'An unknown error occurred during sign up';
      toast.error(msg);
      console.error('Sign up error:', error);
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
      const msg =
        error && typeof error === 'object' && 'message' in error
          ? (error as { message: string }).message
          : 'Invalid login credentials';
      toast.error(msg);
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
    } catch (error: unknown) {
      const msg =
        error && typeof error === 'object' && 'message' in error
          ? (error as { message: string }).message
          : 'Error signing out';
      toast.error(msg);
      console.error('Sign out error:', error);
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
