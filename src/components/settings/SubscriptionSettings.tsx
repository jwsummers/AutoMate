import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Crown,
  CheckCircle,
  Clock,
  CreditCard,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { safeInvoke } from '@/utils/safeInvoke';

interface SubscriptionPlan {
  id: 'free' | 'pro' | 'premium';
  name: string;
  description: string;
  price: string;
  features: string[];
  /** Friendly id the server maps to a Stripe Price (do not send raw Stripe price ids from client) */
  priceId: 'price_free' | 'price_pro' | 'price_premium';
  highlighted?: boolean;
}

interface SubscriptionData {
  subscribed: boolean;
  plan: 'free' | 'pro' | 'premium';
  vehicles_limit: number;
  maintenance_limit: number;
  ai_access: boolean;
  ai_predictions: boolean;
  current_period_end?: string;
}

type CheckoutResponse = { sessionId?: string; url: string };
type PortalResponse = { url: string };

const SubscriptionSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );

  const plans: SubscriptionPlan[] = [
    {
      id: 'free',
      name: 'Free Plan',
      description: 'Basic vehicle maintenance tracking',
      price: '$0/month',
      priceId: 'price_free',
      features: [
        'Track up to 1 vehicle',
        'Up to 25 maintenance logs',
        'Basic repair tracking',
        'Community support',
      ],
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      description: 'Advanced features for serious owners',
      price: '$4.99/month',
      priceId: 'price_pro',
      highlighted: true,
      features: [
        'Track up to 5 vehicles',
        'Up to 500 maintenance logs',
        'AI Assistant (30 prompts/month)',
        'AI repair predictions',
        'Priority email support',
      ],
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      description: 'Ultimate vehicle management solution',
      price: '$14.99/month',
      priceId: 'price_premium',
      features: [
        'Unlimited vehicles',
        'Unlimited maintenance logs',
        'Unlimited AI Assistant access',
        'Advanced AI predictions',
        'Premium support and future features',
      ],
    },
  ];

  const checkSubscription = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await safeInvoke<SubscriptionData>({
        fn: 'check-subscription',
        timeoutMs: 10_000,
      });
      setSubscription(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
      toast.error('Failed to check subscription status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) void checkSubscription();
  }, [user]);

  const handleSubscribe = async (priceId: SubscriptionPlan['priceId']) => {
    if (!user) {
      toast.error('Please sign in first.');
      return;
    }
    setCheckoutLoading(true);
    try {
      const data = await safeInvoke<
        CheckoutResponse,
        { priceId: SubscriptionPlan['priceId'] }
      >({
        fn: 'create-checkout',
        body: { priceId },
        timeoutMs: 20_000,
      });

      if (!data?.url) throw new Error('Checkout URL missing');
      window.location.href = data.url; // redirect to Stripe Checkout
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to start checkout process');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) {
      toast.error('Please sign in first.');
      return;
    }
    setPortalLoading(true);
    try {
      const data = await safeInvoke<PortalResponse>({
        fn: 'customer-portal',
        timeoutMs: 15_000,
      });

      if (!data?.url) throw new Error('Portal URL missing');
      window.location.href = data.url; // redirect to Stripe Customer Portal
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Failed to open subscription management portal');
    } finally {
      setPortalLoading(false);
    }
  };

  // Handle return from Stripe (success/canceled)
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get('success') === 'true') {
      toast.success('Subscription updated successfully!');
      void checkSubscription();
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (queryParams.get('canceled') === 'true') {
      toast.info('Subscription update was canceled.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <Card className='bg-dark-card border-white/10'>
      <CardHeader>
        <div className='flex items-center gap-2'>
          <CreditCard className='h-5 w-5 text-neon-blue' />
          <CardTitle>Subscription Plan</CardTitle>
        </div>
        <CardDescription>
          Manage your subscription and billing details
        </CardDescription>
      </CardHeader>

      {loading ? (
        <CardContent className='flex justify-center py-8'>
          <div className='flex flex-col items-center'>
            <Loader2 className='h-8 w-8 animate-spin text-neon-blue mb-2' />
            <p>Loading subscription details...</p>
          </div>
        </CardContent>
      ) : (
        <>
          <CardContent>
            {subscription && (
              <div className='mb-6 space-y-4'>
                <div className='bg-white/5 p-4 rounded-lg border border-white/10'>
                  <div className='flex items-center justify-between mb-2'>
                    <div className='flex items-center gap-2'>
                      <Crown className='h-5 w-5 text-yellow-500' />
                      <h3 className='text-lg font-medium capitalize'>
                        {subscription.plan} Plan
                      </h3>
                    </div>
                    <Badge
                      variant='outline'
                      className={`${
                        subscription.plan !== 'free'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-white/10'
                      }`}
                    >
                      {subscription.subscribed ? 'Active' : 'Free Tier'}
                    </Badge>
                  </div>

                  {subscription.subscribed &&
                    subscription.current_period_end && (
                      <div className='flex items-center text-sm text-foreground/70 mb-3'>
                        <Clock className='h-4 w-4 mr-1' />
                        <span>
                          Current period ends on{' '}
                          {new Date(
                            subscription.current_period_end
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2'>
                    <div className='flex items-center gap-1'>
                      <CheckCircle className='h-4 w-4 text-neon-blue' />
                      <span>
                        {subscription.vehicles_limit < 0
                          ? 'Unlimited vehicles'
                          : `${subscription.vehicles_limit} vehicles`}
                      </span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <CheckCircle className='h-4 w-4 text-neon-blue' />
                      <span>
                        {subscription.maintenance_limit < 0
                          ? 'Unlimited maintenance logs'
                          : `${subscription.maintenance_limit} maintenance logs`}
                      </span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <CheckCircle
                        className={`h-4 w-4 ${
                          subscription.ai_access
                            ? 'text-neon-blue'
                            : 'text-gray-500'
                        }`}
                      />
                      <span
                        className={
                          !subscription.ai_access ? 'text-gray-500' : ''
                        }
                      >
                        AI Assistant{' '}
                        {subscription.ai_access ? 'Access' : 'No access'}
                      </span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <CheckCircle
                        className={`h-4 w-4 ${
                          subscription.ai_predictions
                            ? 'text-neon-blue'
                            : 'text-gray-500'
                        }`}
                      />
                      <span
                        className={
                          !subscription.ai_predictions ? 'text-gray-500' : ''
                        }
                      >
                        AI Predictions{' '}
                        {subscription.ai_predictions ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>

                {subscription.subscribed && (
                  <Button
                    variant='outline'
                    className='w-full border-white/10'
                    disabled={portalLoading}
                    onClick={handleManageSubscription}
                  >
                    {portalLoading ? (
                      <>
                        <Loader2 className='h-4 w-4 animate-spin mr-2' />
                        Loading...
                      </>
                    ) : (
                      <>
                        <CreditCard className='h-4 w-4 mr-2' />
                        Manage Subscription
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            <div className='space-y-4'>
              <h3 className='text-lg font-medium'>Available Plans</h3>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`border rounded-lg p-4 ${
                      plan.highlighted
                        ? 'border-neon-blue bg-neon-blue/5'
                        : 'border-white/10 bg-white/5'
                    } ${
                      subscription?.plan === plan.id
                        ? 'ring-2 ring-neon-blue'
                        : ''
                    }`}
                  >
                    {subscription?.plan === plan.id && (
                      <Badge className='bg-neon-blue text-black mb-2'>
                        Current Plan
                      </Badge>
                    )}
                    <h4 className='text-lg font-medium mb-1'>{plan.name}</h4>
                    <p className='text-2xl font-bold mb-2'>{plan.price}</p>
                    <p className='text-sm text-foreground/70 mb-4'>
                      {plan.description}
                    </p>

                    <ul className='space-y-2 mb-4'>
                      {plan.features.map((feature, index) => (
                        <li
                          key={index}
                          className='flex items-start gap-2 text-sm'
                        >
                          <CheckCircle className='h-4 w-4 mt-0.5 text-neon-blue' />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {subscription?.plan !== plan.id && plan.id !== 'free' && (
                      <Button
                        className={`w-full ${
                          plan.highlighted
                            ? 'bg-neon-blue hover:bg-neon-blue/90 text-black'
                            : ''
                        }`}
                        disabled={checkoutLoading}
                        onClick={() => handleSubscribe(plan.priceId)}
                      >
                        {checkoutLoading ? (
                          <>
                            <Loader2 className='h-4 w-4 animate-spin mr-2' />
                            Loading...
                          </>
                        ) : (
                          <>Subscribe</>
                        )}
                      </Button>
                    )}

                    {subscription?.plan !== plan.id &&
                      plan.id === 'free' &&
                      subscription?.subscribed && (
                        <Button
                          variant='outline'
                          className='w-full border-white/10'
                          disabled={portalLoading}
                          onClick={handleManageSubscription}
                        >
                          {portalLoading ? (
                            <>
                              <Loader2 className='h-4 w-4 animate-spin mr-2' />
                              Loading...
                            </>
                          ) : (
                            <>Downgrade</>
                          )}
                        </Button>
                      )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>

          <CardFooter className='border-t border-white/10 pt-6 flex flex-col items-start'>
            <div className='flex items-start gap-2 text-sm text-foreground/70 mb-2'>
              <Shield className='h-4 w-4 mt-0.5' />
              <p>
                Your payment is securely processed by Stripe. We do not store
                your payment details.
              </p>
            </div>
          </CardFooter>
        </>
      )}
    </Card>
  );
};

export default SubscriptionSettings;
