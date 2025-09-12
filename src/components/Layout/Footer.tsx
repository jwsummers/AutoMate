import { Link } from 'react-router-dom';
import { Car, Mail, Twitter, Instagram, Github, Linkedin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='bg-dark-card border-t border-white/5 pt-16 pb-8'>
      <div className='container mx-auto px-4'>
        {/* 12-col grid -> 3 equal columns on md+ */}
        <div className='grid grid-cols-1 md:grid-cols-12 gap-8 mb-8'>
          {/* Col 1 */}
          <div className='md:col-span-4 space-y-4'>
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

            {/* TechTuned badge */}
            <a
              href='https://techtunedwebdesign.com/'
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-foreground/70 hover:text-neon-blue transition-colors'
            >
              <span>A</span>
              <span className='font-semibold'>TechTuned</span>
              <span>product</span>
            </a>

            <p className='text-foreground/70 text-sm'>
              Your complete vehicle maintenance companion. Track, manage, and
              optimize your vehicle care with smart tools and AI assistance.
            </p>

            {/* Socials — add real links later */}
            <div className='flex gap-4'>
              <a
                href='#'
                className='text-foreground/70 hover:text-neon-blue transition-colors'
                aria-label='Twitter'
              >
                <Twitter className='w-5 h-5' />
              </a>
              <a
                href='#'
                className='text-foreground/70 hover:text-neon-blue transition-colors'
                aria-label='Instagram'
              >
                <Instagram className='w-5 h-5' />
              </a>
              <a
                href='#'
                className='text-foreground/70 hover:text-neon-blue transition-colors'
                aria-label='GitHub'
              >
                <Github className='w-5 h-5' />
              </a>
              <a
                href='#'
                className='text-foreground/70 hover:text-neon-blue transition-colors'
                aria-label='LinkedIn'
              >
                <Linkedin className='w-5 h-5' />
              </a>
            </div>
          </div>

          {/* Col 2 */}
          <div className='md:col-span-4 md:text-center'>
            <h3 className='font-medium text-lg mb-4'>Resources</h3>
            <ul className='space-y-2'>
              <li>
                <Link
                  to='/'
                  className='text-foreground/70 hover:text-foreground transition-colors text-sm'
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to='/dashboard'
                  className='text-foreground/70 hover:text-foreground transition-colors text-sm'
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to='/pricing'
                  className='text-foreground/70 hover:text-foreground transition-colors text-sm'
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className='md:col-span-4 md:text-right'>
            <h3 className='font-medium text-lg mb-4'>Company</h3>
            <ul className='space-y-2'>
              <li>
                <a
                  href='https://techtunedwebdesign.com/about'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-foreground/70 hover:text-foreground transition-colors text-sm'
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href='https://techtunedwebdesign.com/contact'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-foreground/70 hover:text-foreground transition-colors text-sm'
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className='border-t border-white/5 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center gap-4'>
          <p className='text-foreground/60 text-sm'>
            &copy; {currentYear} AutoMate. All rights reserved.
          </p>
          <div className='flex items-center gap-2'>
            <a
              href='mailto:contact@techtunedwebdesign.com'
              className='text-foreground/70 hover:text-neon-blue transition-colors text-sm flex items-center gap-1'
            >
              <Mail className='w-4 h-4' />
              <span>contact@techtunedwebdesign.com</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
