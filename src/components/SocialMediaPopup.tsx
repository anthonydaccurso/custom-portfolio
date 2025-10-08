import React from 'react';
import { Instagram, Atom as Tiktok, X, Briefcase, Laptop, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SocialMediaPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const SocialMediaPopup: React.FC<SocialMediaPopupProps> = ({ isOpen, onClose }) => {
  const [isPWA, setIsPWA] = React.useState(false);

  React.useEffect(() => {
    setIsPWA(window.matchMedia('(display-mode: standalone)').matches);
  }, []);

  if (!isOpen) return null;

  const socialLinks = [
    {
      name: 'Instagram (Updating)',
      icon: Instagram,
      url: 'https://instagram.com/daccursodigitalmarketing',
    },
    {
      name: 'TikTok (Updating)',
      icon: Tiktok,
      url: 'https://www.tiktok.com/@daccursodigitalmarketing',
    },
    {
      name: 'Upwork',
      icon: Briefcase,
      url: 'https://www.upwork.com/freelancers/~01b388c14c201f7114?mp_source=share',
    },
    {
      name: 'Fiverr',
      icon: Laptop,
      url: 'https://www.fiverr.com/theantdac',
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
        onClick={onClose}
      >
        <div className="absolute inset-0" />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={`absolute ${
            isPWA 
              ? 'md:top-[40px] md:right-80 top-[462px]' 
              : 'md:top-[76px] md:right-80 top-[400px]'
          } right-4 bg-[#1a2f5c] rounded-xl shadow-xl w-64 overflow-hidden`}
          onClick={e => e.stopPropagation()}
        >
          <div className="p-4 border-b border-blue-800/30 flex justify-between items-center">
            <h3 className="text-lg font-semibold">Social Media</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-2 flex flex-col gap-2 items-start">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 hover:bg-white/10 rounded-lg transition-colors"
              >
                <social.icon className="w-5 h-5" />
                <span>{social.name}</span>
              </a>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SocialMediaPopup;