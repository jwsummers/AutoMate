import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Car, EyeOff, Eye, Mail, Lock, Loader2 } from 'lucide-react';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, isLoading, user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn(email, password);
  };

  // Redirect if already authenticated
  if (user) {
    return <Navigate to='/dashboard' replace />;
  }

  return (
    <div className='min-h-screen flex flex-col bg-dark-bg'>
      <Navbar />

      <main className='flex-1 flex items-center justify-center pt-20 pb-16'>
        <div className='w-full max-w-md px-4'>
          <div className='glass-card rounded-xl border border-white/10 overflow-hidden'>
            <div className='p-8'>
              <div className='text-center mb-8'>
                <div className='flex justify-center mb-4'>
                  <div className='relative'>
                    <Link to='/' className='flex items-center gap-3'>
                      <img
                        src='/Logo-automate-rb.png'
                        alt='AutoMate Logo'
                        height={64}
                        width={64}
                        loading='lazy'
                      />
                      <span className='text-xl font-bold tracking-tight'>
                        Auto<span className='text-gradient'>Mate</span>
                      </span>
                    </Link>
                  </div>
                </div>
                <h1 className='text-2xl font-bold mb-2'>Welcome back</h1>
                <p className='text-foreground/70'>
                  Sign in to your AutoMate account
                </p>
              </div>

              <form onSubmit={handleSubmit} className='space-y-4'>
                <div className='space-y-2'>
                  <label htmlFor='email' className='text-sm font-medium'>
                    Email
                  </label>
                  <div className='relative'>
                    <div className='absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/50'>
                      <Mail className='w-5 h-5' />
                    </div>
                    <Input
                      id='email'
                      type='email'
                      placeholder='Enter your email'
                      className='pl-10 py-5 bg-dark-bg border-white/10 focus-visible:ring-neon-blue'
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <div className='flex justify-between'>
                    <label htmlFor='password' className='text-sm font-medium'>
                      Password
                    </label>
                    <Link
                      to='/forgot-password'
                      className='text-sm text-neon-blue hover:text-neon-blue/90'
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className='relative'>
                    <div className='absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/50'>
                      <Lock className='w-5 h-5' />
                    </div>
                    <Input
                      id='password'
                      type={showPassword ? 'text' : 'password'}
                      placeholder='Enter your password'
                      className='pl-10 pr-10 py-5 bg-dark-bg border-white/10 focus-visible:ring-neon-blue'
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                    <button
                      type='button'
                      className='absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground/50 hover:text-foreground'
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className='w-5 h-5' />
                      ) : (
                        <Eye className='w-5 h-5' />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type='submit'
                  className='w-full bg-neon-blue hover:bg-neon-blue/90 text-black font-medium py-5'
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className='mt-6 pt-6 border-t border-white/10 text-center'>
                <div className='flex items-center justify-center gap-1.5'>
                  <span className='text-foreground/70'>
                    Don't have an account?
                  </span>
                  <Link
                    to='/register'
                    className='text-neon-blue hover:text-neon-blue/90 font-medium'
                  >
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
