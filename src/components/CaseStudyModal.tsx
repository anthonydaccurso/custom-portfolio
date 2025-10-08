import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CaseStudy {
  title: string;
  overview: string;
  challenge: string;
  approach: string;
  implementation: string;
  results: string;
  conclusion: string;
}

interface CaseStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseStudy: CaseStudy;
}

const CaseStudyModal: React.FC<CaseStudyModalProps> = ({ isOpen, onClose, caseStudy }) => {
  if (!isOpen) return null;

  const sections = [
    { title: 'Project Overview', content: caseStudy.overview },
    { title: 'Challenge', content: caseStudy.challenge },
    { title: 'Approach', content: caseStudy.approach },
    { title: 'Implementation', content: caseStudy.implementation },
    { title: 'Results', content: caseStudy.results },
    { title: 'Conclusion', content: caseStudy.conclusion },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="bg-[#1a2f5c] rounded-xl w-full max-w-[650px] md:max-h-[90vh] max-h-[85vh] overflow-y-auto shadow-xl md:w-full w-[92%]"
        >
          <div className="sticky top-0 bg-[#1a2f5c] p-6 border-b border-blue-800/30 flex justify-between items-center z-10">
            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-blue-200 to-blue-400 bg-clip-text text-transparent">
              {caseStudy.title} Case Study
            </h2>
            <button
              onClick={onClose}
              className="p-3 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close case study"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-6 space-y-8">
            {sections.map((section, index) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-3"
              >
                <h3 className="text-xl font-semibold text-white">{section.title}</h3>
                <p className="text-gray-300 leading-relaxed text-[15px] md:text-base">{section.content}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CaseStudyModal;