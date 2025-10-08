import React from 'react';
import { motion } from 'framer-motion';

function AboutMeSection() {
  return (
    <div className="w-full">
      <div className="bg-[#1a2f5c]/50 rounded-2xl p-6 sm:p-8 md:p-12 w-full mx-auto">
        <motion.h2 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-blue-200 to-blue-400 bg-clip-text text-transparent mb-6 md:hidden"
        >
          About Me
        </motion.h2>
        <div className="flex flex-col md:flex-row gap-5 md:gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              scale: 1
            }}
            transition={{ 
              duration: 0.6,
              ease: "easeOut"
            }}
            className="w-full md:w-1/3 aspect-square rounded-xl overflow-hidden shadow-2xl"
          >
            <img
              src="https://bvevrurqtidadhfsuoee.supabase.co/storage/v1/object/public/media//anthony-daccurso-fcp.webp?quality=80&width=400"
              srcSet="
                https://bvevrurqtidadhfsuoee.supabase.co/storage/v1/object/public/media//anthony-daccurso-fcp.webp?quality=80&width=400 1x,
                https://bvevrurqtidadhfsuoee.supabase.co/storage/v1/object/public/media//anthony-daccurso-fcp.webp?quality=80&width=800 2x
              "
              alt="Anthony Daccurso"
              loading="eager"
              fetchpriority="high"
              width="400"
              height="400"
              className="w-full h-full object-cover brightness-40"
            />
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.28 }}
            className="w-full md:w-2/3 space-y-6"
          >
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-blue-200 to-blue-400 bg-clip-text text-transparent mb-6 hidden md:block">
              About Me
            </h2>
            <p className="text-lg md:text-xl leading-relaxed text-gray-300">
              I'm Anthony Daccurso, a Digital Marketing & Content Specialist at Custom Pool Pros, and a graduate from TCNJ with a B.S. in Marketing and a minor in Information Systems & Technology. I specialize in digital marketing and web development, where I have begun to take on many relevant tasks at Wedgewood Health. 
            </p>
            <p className="text-lg md:text-xl leading-relaxed text-gray-300">
              My journey in digital marketing and web development has driven me to complete both work and personal projects that enable me to enhance my skills. I aim to strengthen my expertise as I advance in my career and consistently create deliverables of the highest possible quality. 
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default AboutMeSection;