
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Check, CheckCircle } from 'lucide-react';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('annually');
  
  const pricingTiers = [
    {
      name: "Free",
      description: "Basic maintenance tracking for a single vehicle",
      monthlyPrice: "0",
      annualPrice: "0",
      features: [
        "Single vehicle tracking",
        "Basic maintenance records",
        "Service reminders",
        "Limited AI assistant queries (5/month)"
      ],
      buttonText: "Get Started",
      buttonVariant: "outline",
      highlight: false
    },
    {
      name: "Premium",
      description: "Advanced tracking for up to 3 vehicles with full AI support",
      monthlyPrice: "9.99",
      annualPrice: "7.99",
      annualSavings: "20%",
      features: [
        "Up to 3 vehicles",
        "Advanced maintenance analytics",
        "Custom service schedules",
        "Unlimited AI assistant access",
        "Export and backup data",
        "Priority support"
      ],
      buttonText: "Start Free Trial",
      buttonVariant: "default",
      highlight: true
    },
    {
      name: "Family",
      description: "Complete fleet management for families and enthusiasts",
      monthlyPrice: "19.99",
      annualPrice: "15.99",
      annualSavings: "20%",
      features: [
        "Unlimited vehicles",
        "Complete maintenance history",
        "Cost tracking and budgeting",
        "DIY repair guides",
        "Parts inventory management",
        "Family sharing (up to 5 members)",
        "24/7 premium support"
      ],
      buttonText: "Start Free Trial",
      buttonVariant: "outline",
      highlight: false
    }
  ];
  
  const faqItems = [
    {
      question: "What is the difference between the plans?",
      answer: "The Free plan allows you to track one vehicle with basic maintenance records. The Premium plan includes up to 3 vehicles, advanced analytics, and unlimited AI assistance. The Family plan offers unlimited vehicles, cost tracking, DIY guides, and family sharing for up to 5 members."
    },
    {
      question: "Can I switch between plans?",
      answer: "Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll immediately get access to all the new features. When downgrading, you'll continue to have access to your current plan's features until the end of your billing cycle."
    },
    {
      question: "Is there a free trial?",
      answer: "Yes, both Premium and Family plans come with a 14-day free trial. You won't be charged until the trial period ends, and you can cancel anytime during the trial."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, PayPal, and Apple Pay for subscription payments. Your payment information is securely processed and stored by our payment provider."
    },
    {
      question: "Can I cancel my subscription at any time?",
      answer: "Yes, you can cancel your subscription at any time from your account settings. If you cancel, you'll continue to have access to your current plan's features until the end of your billing cycle."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-dark-bg">
      <Navbar />
      
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="text-3xl md:text-5xl font-bold mb-6">
              Simple, Transparent <span className="text-gradient">Pricing</span>
            </h1>
            <p className="text-xl text-foreground/70 mb-10">
              Choose the perfect plan for your vehicle maintenance needs
            </p>
            
            <div className="inline-flex items-center p-1 bg-dark-card border border-white/10 rounded-lg">
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  billingCycle === 'monthly' 
                    ? 'bg-white/10 text-foreground' 
                    : 'text-foreground/70 hover:text-foreground'
                }`}
                onClick={() => setBillingCycle('monthly')}
              >
                Monthly
              </button>
              <button
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                  billingCycle === 'annually' 
                    ? 'bg-white/10 text-foreground' 
                    : 'text-foreground/70 hover:text-foreground'
                }`}
                onClick={() => setBillingCycle('annually')}
              >
                <span>Annually</span>
                <span className="bg-neon-blue/20 text-neon-blue text-xs px-2 py-0.5 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingTiers.map((tier) => (
              <div 
                key={tier.name} 
                className={`
                  glass-card rounded-xl p-6 transition-all hover:translate-y-[-5px] duration-300
                  ${tier.highlight 
                    ? 'border-neon-blue/50 shadow-[0_0_30px_-10px_rgba(0,243,255,0.3)]' 
                    : 'border-white/10'
                  } 
                  relative
                `}
              >
                {tier.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-neon-blue text-black px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                )}
                
                <div className="text-center py-4">
                  <h3 className="text-xl font-semibold mb-2">{tier.name}</h3>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <span className="text-sm">$</span>
                    <span className="text-4xl font-bold">
                      {billingCycle === 'monthly' ? tier.monthlyPrice : tier.annualPrice}
                    </span>
                    <span className="text-foreground/70">/mo</span>
                  </div>
                  
                  {billingCycle === 'annually' && tier.annualSavings && (
                    <div className="text-sm text-neon-blue mb-2">
                      Save {tier.annualSavings} with annual billing
                    </div>
                  )}
                  
                  <p className="text-foreground/70 text-sm mb-6">
                    {tier.description}
                  </p>
                  
                  <Link to="/register">
                    <Button 
                      className={`w-full ${
                        tier.buttonVariant === 'outline'
                          ? 'border-white/10 hover:bg-white/5'
                          : tier.highlight
                            ? 'bg-neon-blue hover:bg-neon-blue/90 text-black'
                            : 'bg-neon-blue hover:bg-neon-blue/90 text-black'
                      }`}
                      variant={tier.buttonVariant as "outline" | "default"}
                    >
                      {tier.buttonText}
                    </Button>
                  </Link>
                </div>
                
                <div className="border-t border-white/10 pt-6 mt-6">
                  <span className="block text-sm font-medium mb-4">
                    What's included:
                  </span>
                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <div className="mt-0.5 bg-neon-blue/10 rounded-full p-0.5">
                          <Check className="w-4 h-4 text-neon-blue" />
                        </div>
                        <span className="text-foreground/80 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-6 text-foreground/70">
            All paid plans include a 14-day free trial. No credit card required for the free plan.
          </div>
          
          <div className="mt-24 max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-6">
              {faqItems.map((item, index) => (
                <div key={index} className="glass-card rounded-xl p-6">
                  <h3 className="text-lg font-medium mb-3">{item.question}</h3>
                  <p className="text-foreground/70">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-20 glass-card rounded-xl p-8 border border-neon-purple/20 max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
              <div className="md:w-16 w-12 h-12 md:h-16 rounded-full flex-shrink-0 bg-neon-purple/10 flex items-center justify-center">
                <CheckCircle className="w-6 md:w-8 h-6 md:h-8 text-neon-purple" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl md:text-2xl font-bold mb-2">
                  100% Satisfaction Guarantee
                </h3>
                <p className="text-foreground/70">
                  If you're not completely satisfied with your AutoMate experience within the first 30 days, we'll refund your subscription payment in full. No questions asked.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Pricing;
