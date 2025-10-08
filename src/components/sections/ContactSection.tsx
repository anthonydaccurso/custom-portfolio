import React, { memo, useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Linkedin, FileText, Folders, Award } from 'lucide-react';

const contactItems = [
  {
    href: "https://www.linkedin.com/in/anthony-daccurso/",
    icon: Linkedin,
    title: "LinkedIn",
    className: "contact-item"
  },
  {
    href: "https://drive.google.com/file/d/1AZAafbFGVqKAw0Vn2Jjwf27jYux-Fngh/view?usp=sharing",
    icon: FileText,
    title: "Resume",
    className: "contact-item"
  },
  {
    href: "https://drive.google.com/drive/folders/1zNDvHaLsJNsLUyehQu8ZxmiWXM4sA0E2?usp=sharing",
    icon: Folders,
    title: "Certifications",
    className: "contact-item"
  },
  {
    href: "https://drive.google.com/drive/folders/1B0ONHc3X5C6KA4RYtRZl72SnqrJMupuu?usp=sharing",
    icon: Award,
    title: "Awards",
    className: "contact-item"
  }
];

const ContactItem = memo(({ item, index }) => {
  const Icon = item.icon;
  const contactRef = useRef(null);
  const isInView = useInView(contactRef, { once: true, amount: 0.2 });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div ref={contactRef}>
      <motion.a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        className="w-full aspect-[2/1] sm:aspect-[3.8/1] bg-[#1a2f5c] hover:bg-[#60a5fa] rounded-2xl p-6 text-center transition-all duration-300 group flex flex-col items-center justify-center hover:shadow-xl"
      >
        <Icon className="h-12 w-12 mb-4 text-blue-400 group-hover:scale-110 transition-transform duration-300" />
        <h3 className="text-xl font-semibold text-white">{item.title}</h3>
      </motion.a>
        </div>
        );
      });

function ContactSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: window.innerWidth <= 768 ? 0.7 : 0.5,
        ease: window.innerWidth <= 768 ? "easeInOut" : "easeOut"
      }}
      className="bg-[#1a2f5c]/50 rounded-3xl p-6 sm:p-8 md:p-12 w-full mx-auto"
    >
      <motion.h2
        initial={{ opacity: 0, y: window.innerWidth <= 768 ? 0 : -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: window.innerWidth <= 768 ? 0.6 : 0.5,
          ease: window.innerWidth <= 768 ? "easeInOut" : "easeOut"
        }}
        className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-blue-200 to-blue-400 bg-clip-text text-transparent mb-8"
      >
        Let's Connect
      </motion.h2>

      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-6 w-full md:max-w-full mx-auto md:px-4"
        style={window.innerWidth <= 768 ? { minHeight: '700px' } : {}}
      >
        {contactItems.map((item, index) => (
          <div key={item.title} className="w-full">
            <ContactItem item={item} index={index} />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default ContactSection;