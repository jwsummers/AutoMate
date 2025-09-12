import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, Car, User, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Dynamic navigation links based on authentication status
  const navLinks = user
    ? [
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'Profile', path: '/profile' },
      ]
    : [
        { name: 'Home', path: '/' },
        { name: 'Pricing', path: '/pricing' },
      ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'py-3 bg-dark-bg/90 backdrop-blur-lg border-b border-white/5'
          : 'py-5 bg-transparent'
      }`}
    >
      <div className='container mx-auto px-4 flex justify-between items-center'>
        <Link to='/' className='flex items-center gap-1'>
          <div className='relative'>
            <img
              src='/Logo-automate-rb.png'
              alt='AutoMate Logo'
              height={80}
              width={80}
              className='text-neon-blue'
            />
          </div>
          <span className='text-2xl font-bold tracking-tight'>
            Auto<span className='text-gradient'>Mate</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className='hidden md:flex items-center gap-6'>
          <ul className='flex gap-6'>
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.path}
                  className={`relative py-1 px-1 transition-colors duration-300 ${
                    isActive(link.path)
                      ? 'text-neon-blue'
                      : 'text-foreground/90 hover:text-foreground'
                  }`}
                >
                  {link.name}
                  {isActive(link.path) && (
                    <span className='absolute bottom-0 left-0 w-full h-0.5 bg-neon-blue rounded-full' />
                  )}
                </Link>
              </li>
            ))}
          </ul>
          <div className='flex items-center gap-3'>
            {user ? (
              <Button
                variant='outline'
                size='sm'
                className='gap-2 border-white/10 hover:bg-white/5'
                onClick={() => signOut()}
              >
                <LogOut className='w-4 h-4' />
                <span>Log Out</span>
              </Button>
            ) : (
              <>
                <Link to='/login'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='gap-2 border-white/10 hover:bg-white/5'
                  >
                    <LogIn className='w-4 h-4' />
                    <span>Login</span>
                  </Button>
                </Link>
                <Link to='/register'>
                  <Button
                    size='sm'
                    className='bg-neon-blue hover:bg-neon-blue/90 text-black font-medium'
                  >
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className='block md:hidden'
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label='Menu'
        >
          {isMobileMenuOpen ? (
            <X className='w-6 h-6 text-foreground' />
          ) : (
            <Menu className='w-6 h-6 text-foreground' />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`fixed inset-0 bg-dark-bg z-40 transform transition-transform duration-300 pt-20 ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <nav className='container mx-auto px-4'>
          <ul className='flex flex-col gap-4'>
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link
                  to={link.path}
                  className={`block py-3 px-4 text-lg font-medium rounded-md transition-colors ${
                    isActive(link.path)
                      ? 'text-neon-blue bg-white/5'
                      : 'text-foreground hover:bg-white/5'
                  }`}
                  onClick={closeMobileMenu}
                >
                  {link.name}
                </Link>
              </li>
            ))}
            <li className='pt-4 mt-4 border-t border-white/10'>
              {user ? (
                <button
                  onClick={() => {
                    signOut();
                    closeMobileMenu();
                  }}
                  className='flex w-full items-center gap-2 py-3 px-4 text-lg font-medium rounded-md text-foreground hover:bg-white/5'
                >
                  <LogOut className='w-5 h-5' />
                  <span>Log Out</span>
                </button>
              ) : (
                <>
                  <Link
                    to='/login'
                    className='flex items-center gap-2 py-3 px-4 text-lg font-medium rounded-md text-foreground hover:bg-white/5'
                    onClick={closeMobileMenu}
                  >
                    <LogIn className='w-5 h-5' />
                    <span>Login</span>
                  </Link>
                  <Link
                    to='/register'
                    className='flex items-center gap-2 py-3 px-4 mt-2 text-lg font-medium rounded-md bg-neon-blue text-black hover:bg-neon-blue/90'
                    onClick={closeMobileMenu}
                  >
                    <User className='w-5 h-5' />
                    <span>Sign Up</span>
                  </Link>
                </>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
