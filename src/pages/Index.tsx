import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Car,
  Bell,
  BarChart3,
  MessageSquare,
  ArrowRight,
  Check,
  Wrench,
} from 'lucide-react';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';
import { FeatureCarousel } from '@/components/common/FeatureCarousel';

const Index = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const features = [
    {
      title: 'Maintenance Tracking',
      description:
        'Keep records of all maintenance and repairs in one organized place.',
      icon: Wrench,
      color: 'text-neon-blue',
    },
    {
      title: 'Service Reminders',
      description:
        "Get timely alerts for upcoming maintenance based on your vehicle's needs.",
      icon: Bell,
      color: 'text-neon-purple',
    },
    {
      title: 'Performance Metrics',
      description:
        'Track fuel efficiency, costs, and other important performance metrics.',
      icon: BarChart3,
      color: 'text-neon-pink',
    },
    {
      title: 'AI Repair Assistant',
      description:
        'Get expert advice and DIY repair guidance from our intelligent AI assistant.',
      icon: MessageSquare,
      color: 'text-neon-blue',
    },
  ];

  const testimonials = [
    {
      name: 'Alex Johnson',
      role: 'Car Enthusiast',
      content:
        'AutoMate has completely changed how I maintain my vehicles. The reminders ensure I never miss an oil change, and the AI assistant has saved me thousands in repair costs.',
      avatar:
        'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=3270&auto=format&fit=crop&ixlib=rb-4.0.3',
    },
    {
      name: 'Sarah Miller',
      role: 'Busy Professional',
      content:
        'As someone who knows next to nothing about cars, this app is a lifesaver. It tells me exactly what needs to be done and when, in simple terms I can understand.',
      avatar:
        'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=3000&auto=format&fit=crop&ixlib=rb-4.0.3',
    },
    {
      name: 'David Chen',
      role: 'Small Fleet Owner',
      content:
        'Managing maintenance for multiple vehicles used to be a nightmare. With AutoMate, I can track everything in one place, saving me both time and money.',
      avatar:
        'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?q=80&w=3734&auto=format&fit=crop&ixlib=rb-4.0.3',
    },
  ];

  const pricingTiers = [
    {
      name: 'Free',
      price: '0',
      description: 'Basic maintenance tracking for a single vehicle',
      features: [
        'Single vehicle tracking',
        'Basic maintenance records',
        'Service reminders',
        'Limited AI assistant queries (5/month)',
      ],
      buttonText: 'Get Started',
      buttonVariant: 'outline',
    },
    {
      name: 'Premium',
      price: '9.99',
      description:
        'Advanced tracking for up to 3 vehicles with full AI support',
      features: [
        'Up to 3 vehicles',
        'Advanced maintenance analytics',
        'Custom service schedules',
        'Unlimited AI assistant access',
        'Export and backup data',
        'Priority support',
      ],
      buttonText: 'Start Free Trial',
      buttonVariant: 'default',
      popular: true,
    },
    {
      name: 'Family',
      price: '19.99',
      description: 'Complete fleet management for families and enthusiasts',
      features: [
        'Unlimited vehicles',
        'Complete maintenance history',
        'Cost tracking and budgeting',
        'DIY repair guides',
        'Parts inventory management',
        'Family sharing (up to 5 members)',
        '24/7 premium support',
      ],
      buttonText: 'Start Free Trial',
      buttonVariant: 'outline',
    },
  ];

  return (
    <div
      className={`min-h-screen flex flex-col transition-opacity duration-700 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <Navbar />

      {/* Hero Section */}
      <section className='pt-32 pb-20 md:pt-40 md:pb-32 bg-hero-pattern bg-cover bg-no-repeat'>
        <div className='container mx-auto px-4'>
          <div className='max-w-3xl mx-auto text-center stagger-animation'>
            <div className='inline-block px-3 py-1 rounded-full bg-neon-blue/10 border border-neon-blue/20 text-neon-blue text-sm font-medium mb-6'>
              The Ultimate Vehicle Companion
            </div>
            <h1 className='text-4xl md:text-6xl font-bold leading-tight mb-6'>
              Your <span className='text-gradient'>Smart Solution</span> for
              Vehicle Maintenance
            </h1>
            <p className='text-xl text-foreground/80 mb-8 leading-relaxed'>
              Keep your vehicles in peak condition with intelligent maintenance
              tracking, timely reminders, and AI-powered repair assistance.
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Link to='/register'>
                <Button
                  size='lg'
                  className='w-full sm:w-auto bg-neon-blue hover:bg-neon-blue/90 text-black font-medium'
                >
                  Get Started — It's Free
                </Button>
              </Link>
              <Link to='/pricing'>
                <Button
                  size='lg'
                  variant='outline'
                  className='w-full sm:w-auto border-white/10 hover:bg-white/5'
                >
                  View Pricing Plans
                </Button>
              </Link>
            </div>
            <div className='mt-8 text-sm text-foreground/60'>
              No credit card required for free plan
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className='py-20 md:py-28 relative overflow-hidden'>
        <div className='absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent'></div>
        <div className='container mx-auto px-4'>
          <div className='max-w-3xl mx-auto text-center mb-16'>
            <h2 className='text-3xl md:text-4xl font-bold mb-5'>
              Powerful Features for Your Vehicle
            </h2>
            <p className='text-lg text-foreground/70'>
              Everything you need to maintain your vehicles, all in one place
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'>
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className='glass-card rounded-xl p-6 transition-all hover:translate-y-[-5px] duration-300'
              >
                <div
                  className={`w-12 h-12 rounded-lg ${
                    feature.color === 'text-neon-blue'
                      ? 'bg-neon-blue/10'
                      : feature.color === 'text-neon-purple'
                      ? 'bg-neon-purple/10'
                      : 'bg-neon-pink/10'
                  } flex items-center justify-center mb-5`}
                >
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className='text-xl font-medium mb-3'>{feature.title}</h3>
                <p className='text-foreground/70'>{feature.description}</p>
              </div>
            ))}
          </div>

          <div className='mt-16 text-center'>
            <Link to='/register'>
              <Button
                variant='outline'
                size='lg'
                className='border-white/10 hover:bg-white/5 gap-2'
              >
                <span>Explore All Features</span>
                <ArrowRight className='w-4 h-4' />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* App Screenshot Section */}
      <section className='py-20 bg-dark-card relative overflow-hidden'>
        <div className='absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_30%,_rgba(0,243,255,0.05),_transparent_50%)]'></div>
        <div className='container mx-auto px-4 relative z-10'>
          <div className='flex flex-col lg:flex-row items-center gap-10 lg:gap-16'>
            <div className='lg:w-1/2 order-2 lg:order-1'>
              <div className='glass-card rounded-xl overflow-hidden border border-white/10 shadow-[0_20px_50px_-15px_rgba(0,243,255,0.15)]'>
                <FeatureCarousel
                  slides={[
                    {
                      src: '/dashboard-preview.png',
                      alt: 'AutoMate Dashboard Overview',
                      caption:
                        'Overview: vehicles, upcoming services, AI alerts',
                    },
                    {
                      src: '/maintenance-schedule-preview.png',
                      alt: 'Maintenance Schedule',
                      caption:
                        'Schedule & track upcoming and completed maintenance',
                    },
                    {
                      src: '/ai-predictions-preview.png',
                      alt: 'AI Predictions',
                      caption: 'Smart predictions based on your history',
                    },
                    {
                      src: '/vehicle-details-preview.png',
                      alt: 'Vehicle Details',
                      caption: 'Per-vehicle health and history at a glance',
                    },
                  ]}
                  autoPlayMs={4500}
                  className='h-[420px] bg-black'
                />
              </div>
            </div>

            <div className='lg:w-1/2 order-1 lg:order-2'>
              <div className='max-w-lg'>
                <div className='inline-block px-3 py-1 rounded-full bg-neon-purple/10 border border-neon-purple/20 text-neon-purple text-sm font-medium mb-6'>
                  Intuitive Dashboard
                </div>
                <h2 className='text-3xl md:text-4xl font-bold mb-6'>
                  Stay on Top of Your Vehicle Maintenance
                </h2>
                <p className='text-lg text-foreground/70 mb-8'>
                  AutoMate provides a comprehensive dashboard that gives you
                  instant visibility into your vehicle's health, upcoming
                  services, and maintenance history.
                </p>

                <div className='space-y-4'>
                  {[
                    'Track maintenance with detailed service logs',
                    'Get proactive alerts before issues arise',
                    'Monitor all your vehicles in one place',
                    'Access DIY guides and repair assistance',
                  ].map((item, i) => (
                    <div key={i} className='flex items-start gap-3'>
                      <div className='mt-0.5 bg-neon-purple/10 rounded-full p-0.5'>
                        <Check className='w-4 h-4 text-neon-purple' />
                      </div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className='mt-10'>
                  <Link to='/register'>
                    <Button className='gap-2 bg-neon-purple hover:bg-neon-purple/90 text-white font-medium'>
                      <span>Try the Dashboard</span>
                      <ArrowRight className='w-4 h-4' />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className='py-20 md:py-28'>
        <div className='container mx-auto px-4'>
          <div className='max-w-3xl mx-auto text-center mb-16'>
            <h2 className='text-3xl md:text-4xl font-bold mb-5'>
              What Our Users Say
            </h2>
            <p className='text-lg text-foreground/70'>
              Join thousands of vehicle owners who trust AutoMate
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className='glass-card rounded-xl p-6 transition-all animate-float'
              >
                <div className='flex items-center gap-4 mb-5'>
                  <div className='w-12 h-12 rounded-full overflow-hidden'>
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className='w-full h-full object-cover'
                    />
                  </div>
                  <div>
                    <h4 className='font-medium'>{testimonial.name}</h4>
                    <p className='text-sm text-foreground/70'>
                      {testimonial.role}
                    </p>
                  </div>
                </div>
                <p className='text-foreground/80 leading-relaxed'>
                  "{testimonial.content}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className='py-20 md:py-28 bg-dark-card relative overflow-hidden'>
        <div className='absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_70%_70%,_rgba(188,19,254,0.05),_transparent_50%)]'></div>
        <div className='container mx-auto px-4 relative z-10'>
          <div className='max-w-3xl mx-auto text-center mb-16'>
            <h2 className='text-3xl md:text-4xl font-bold mb-5'>
              Simple, Transparent Pricing
            </h2>
            <p className='text-lg text-foreground/70'>
              Choose a plan that works for you
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto'>
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`glass-card rounded-xl p-6 border ${
                  tier.popular
                    ? 'border-neon-purple/50 shadow-[0_0_30px_-10px_rgba(188,19,254,0.3)]'
                    : 'border-white/10'
                } relative`}
              >
                {tier.popular && (
                  <div className='absolute -top-4 left-1/2 -translate-x-1/2 bg-neon-purple text-white px-4 py-1 rounded-full text-sm font-medium'>
                    Most Popular
                  </div>
                )}

                <div className='text-center py-4'>
                  <h3 className='text-xl font-semibold mb-2'>{tier.name}</h3>
                  <div className='flex items-center justify-center gap-1 mb-2'>
                    <span className='text-sm'>$</span>
                    <span className='text-4xl font-bold'>{tier.price}</span>
                    <span className='text-foreground/70'>/mo</span>
                  </div>
                  <p className='text-foreground/70 text-sm mb-6'>
                    {tier.description}
                  </p>

                  <Link to='/register'>
                    <Button
                      className={`w-full ${
                        tier.buttonVariant === 'outline'
                          ? 'border-white/10 hover:bg-white/5'
                          : tier.popular
                          ? 'bg-neon-purple hover:bg-neon-purple/90 text-white'
                          : 'bg-neon-blue hover:bg-neon-blue/90 text-black'
                      }`}
                      variant={tier.buttonVariant as 'outline' | 'default'}
                    >
                      {tier.buttonText}
                    </Button>
                  </Link>
                </div>

                <div className='border-t border-white/10 pt-6 mt-6'>
                  <ul className='space-y-3'>
                    {tier.features.map((feature) => (
                      <li key={feature} className='flex items-start gap-3'>
                        <div className='mt-0.5 bg-neon-blue/10 rounded-full p-0.5'>
                          <Check className='w-4 h-4 text-neon-blue' />
                        </div>
                        <span className='text-foreground/80 text-sm'>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className='text-center mt-10 text-foreground/70'>
            All plans include a 14-day free trial. Cancel anytime.
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-20 relative overflow-hidden'>
        <div className='absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_rgba(0,243,255,0.05),_transparent_70%)]'></div>
        <div className='container mx-auto px-4 relative z-10'>
          <div className='max-w-3xl mx-auto text-center'>
            <h2 className='text-3xl md:text-4xl font-bold mb-6'>
              Ready to Take Control of Your Vehicle Maintenance?
            </h2>
            <p className='text-lg text-foreground/70 mb-8'>
              Join thousands of satisfied users and experience the AutoMate
              difference
            </p>
            <div className='flex justify-center'>
              <Link to='/register'>
                <Button
                  size='lg'
                  className='bg-neon-blue hover:bg-neon-blue/90 text-black font-medium'
                >
                  Start Your Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
