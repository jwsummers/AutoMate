
import { Link } from 'react-router-dom';
import { Car, Mail, Twitter, Instagram, GitHub, Linkedin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-dark-card border-t border-white/5 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <Car className="w-6 h-6 text-neon-blue" />
              <span className="text-xl font-bold tracking-tight">
                Auto<span className="text-gradient">Mate</span>
              </span>
            </Link>
            <p className="text-foreground/70 text-sm">
              Your complete vehicle maintenance companion. Track, manage, and optimize your vehicle care with smart tools and AI assistance.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-foreground/70 hover:text-neon-blue transition-colors" aria-label="Twitter">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-foreground/70 hover:text-neon-blue transition-colors" aria-label="Instagram">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-foreground/70 hover:text-neon-blue transition-colors" aria-label="GitHub">
                <GitHub className="w-5 h-5" />
              </a>
              <a href="#" className="text-foreground/70 hover:text-neon-blue transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-4">Features</h3>
            <ul className="space-y-2">
              <li><Link to="#" className="text-foreground/70 hover:text-foreground transition-colors text-sm">Maintenance Tracking</Link></li>
              <li><Link to="#" className="text-foreground/70 hover:text-foreground transition-colors text-sm">Service Reminders</Link></li>
              <li><Link to="#" className="text-foreground/70 hover:text-foreground transition-colors text-sm">AI Assistant</Link></li>
              <li><Link to="#" className="text-foreground/70 hover:text-foreground transition-colors text-sm">Vehicle Analytics</Link></li>
              <li><Link to="#" className="text-foreground/70 hover:text-foreground transition-colors text-sm">DIY Guides</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><Link to="#" className="text-foreground/70 hover:text-foreground transition-colors text-sm">Help Center</Link></li>
              <li><Link to="#" className="text-foreground/70 hover:text-foreground transition-colors text-sm">Blog</Link></li>
              <li><Link to="#" className="text-foreground/70 hover:text-foreground transition-colors text-sm">Community</Link></li>
              <li><Link to="/pricing" className="text-foreground/70 hover:text-foreground transition-colors text-sm">Pricing</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-lg mb-4">Company</h3>
            <ul className="space-y-2">
              <li><Link to="#" className="text-foreground/70 hover:text-foreground transition-colors text-sm">About Us</Link></li>
              <li><Link to="#" className="text-foreground/70 hover:text-foreground transition-colors text-sm">Careers</Link></li>
              <li><Link to="#" className="text-foreground/70 hover:text-foreground transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link to="#" className="text-foreground/70 hover:text-foreground transition-colors text-sm">Terms of Service</Link></li>
              <li><Link to="#" className="text-foreground/70 hover:text-foreground transition-colors text-sm">Contact Us</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/5 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-foreground/60 text-sm">
            &copy; {currentYear} AutoMate. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <a href="mailto:info@automate.com" className="text-foreground/70 hover:text-neon-blue transition-colors text-sm flex items-center gap-1">
              <Mail className="w-4 h-4" />
              <span>info@automate.com</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
