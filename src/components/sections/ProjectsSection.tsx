import React, { memo, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import CaseStudyModal from '../CaseStudyModal';
import { ArrowUpRight, BookOpen } from 'lucide-react';

const projects = [
  {
    title: "Custom Pool Pros",
    image: "https://bvevrurqtidadhfsuoee.supabase.co/storage/v1/object/public/media/custom-pool-pros.webp",
    description: "A comprehensive digital redesign focused on improving user experience and brand consistency across various platforms.",
    skills: ["keyword research", "Web design", "Google Analytics 4", "SEO"],
    link: "https://custompoolpros.com/",
    instagram: "https://www.instagram.com/custompoolprosnj/?hl=en",
    caseStudy: {
      overview: "Contributed to the comprehensive redesign of the Custom Pool Pros' digital presence, focusing on improving user experience and brand consistency across their digital platforms.",
      challenge: "The existing website lacked cohesive design elements and clear user pathways, resulting in lower engagement and conversion rates. The platform needed to better communicate its value proposition while maintaining trust and quality.",
      approach: "Implemented a user-centered design strategy, conducting thorough research on financial service websites and user behavior. Created prototypes focusing on clear navigation and trust-building elements.",
      implementation: "Developed a modern, responsive design using the latest web technologies. Integrated SEO best practices and optimized for performance. Created a consistent visual language across all platforms.",
      results: "Achieved an increase in user engagement, improvement in conversion rates, and significantly enhanced brand perception through cohesive design implementation.",
      conclusion: "The redesign successfully modernized Custom Pool Pros' digital presence while maintaining its professional image in the financial sector. The new design system provides a foundation for future growth and client acquisition."
    }
  },
    {
    title: "Silverback Mobile",
    image: "https://bvevrurqtidadhfsuoee.supabase.co/storage/v1/object/public/media//silverback-card.webp",
    description: "Contributing to the redesign of a personal finances application platforms through collaboration, web design, and SEO.",
    skills: ["Collaboration", "Website Builder", "Google Analytics 4", "SEO"],
    link: "https://silverbackmobile.com/",
    instagram: "https://www.instagram.com/silverbackmobile/?__d=11",
    caseStudy: {
      overview: "Contributed to the comprehensive redesign of Silverback Mobile's digital presence, focusing on improving user experience and brand consistency across their financial application platforms.",
      challenge: "The existing website lacked cohesive design elements and clear user pathways, resulting in lower engagement and conversion rates. The platform needed to better communicate its value proposition while maintaining trust and security.",
      approach: "Implemented a user-centered design strategy, conducting thorough research on financial service websites and user behavior. Created prototypes focusing on clear navigation and trust-building elements.",
      implementation: "Developed a modern, responsive design using the latest web technologies. Integrated SEO best practices and optimized for performance. Created a consistent visual language across all platforms.",
      results: "Achieved an increase in user engagement, improvement in conversion rates, and significantly enhanced brand perception through cohesive design implementation.",
      conclusion: "The redesign successfully modernized Silverback Mobile's digital presence while maintaining its professional image in the financial sector. The new design system provides a foundation for future growth and feature additions."
    }
  },
  {
    title: "Personal Touch Engravings",
    image: "https://bvevrurqtidadhfsuoee.supabase.co/storage/v1/object/public/media//engraving-map.webp",
    description: "Designing an engraving collection through website design, keyword research, catalog organization, and SEO.",
    skills: ["Adobe Portfolio", "CSS", "SEO", "Google Analytics 4", "HTML"],
    link: "https://personaltouchengravingsandphotos.com",
    caseStudy: {
      overview: "Created a digital portfolio and catalog for a custom engraving business, focusing on portfolio presentation and e-commerce functionality.",
      challenge: "The client needed a platform to display their intricate engraving work while making it easy for customers to place orders. The previous solution lacked proper organization and search visibility.",
      approach: "Developed a structured catalog system with detailed categorization. Implemented SEO strategies targeting local and national customers. Created a simple ordering process.",
      implementation: "Built a responsive website using Adobe Portfolio, optimized images for fast loading, and integrated analytics for tracking user behavior and popular items.",
      results: "Increased organic search traffic, improved average session duration, and boosted online order volume within three months.",
      conclusion: "The new website successfully bridges the gap between artistic showcase and e-commerce functionality, providing a sustainable platform for business growth."
    }
  },
  {
    title: "Images by Carmen",
    image: "https://bvevrurqtidadhfsuoee.supabase.co/storage/v1/object/public/media//waterfowls-photography.webp",
    description: "Designing a nature photography portfolio through website design, keyword research, catalog organization, SEO, and performance optimization.",
    skills: ["Adobe Portfolio", "CSS", "SEO", "Google Analytics 4", "HTML"],
    link: "https://imagesbycarmen.com",
    caseStudy: {
      overview: "Developed a professional photography portfolio website showcasing nature and wildlife photography, with a focus on image quality and performance.",
      challenge: "Needed to balance high-resolution image display with website performance while creating an engaging user experience that highlights the photographer's unique style.",
      approach: "Implemented advanced image optimization techniques and lazy loading. Created a minimalist design that puts the focus on the photographs while maintaining easy navigation.",
      implementation: "Utilized Adobe Portfolio with custom CSS modifications. Implemented SEO best practices and integrated with Google Analytics for performance tracking.",
      results: "Achieved a strong PageSpeed score while maintaining image quality. Increased portfolio views and improved client inquiries.",
      conclusion: "Successfully created a professional platform that effectively showcases the photographer's work while maintaining optimal performance and user experience."
    }
  },
  {
    title: "Flextech",
    image: "https://bvevrurqtidadhfsuoee.supabase.co/storage/v1/object/public/media//dumbbell-rack.webp",
    description: "Providing fitness guidance through web design, keyword research, SEO, database management, and performance optimization.",
    skills: ["WordPress", "HTML", "CSS", "JavaScript", "PHP", "SEO"],
    link: "https://flextech.fit",
    caseStudy: {
      overview: "Developed a comprehensive fitness platform offering workout plans, nutrition guidance, and progress tracking capabilities.",
      challenge: "Needed to create an accessible fitness resource that caters to both beginners and advanced users while maintaining engagement and providing actionable information.",
      approach: "Focused on clean, user-friendly design with clear navigation and concise fitness content. Prioritized accessibility and easy-to-understand layouts to keep users engaged.",
      implementation: "Used WordPress with a customized theme tailored for fitness content. Optimized the site for SEO and mobile devices, and organized content into intuitive sections like workouts, nutrition, and blog tips.",
      results: "Increased traffic through targeted keywords and strong on-page SEO. Users praised the site's simplicity and usefulness, helping to build trust and boost return visits.",
      conclusion: "Successfully created a sustainable fitness platform that effectively serves users across all experience levels while maintaining high engagement rates."
    }
  },
  {
    title: "Mercer Gems",
    image: "https://bvevrurqtidadhfsuoee.supabase.co/storage/v1/object/public/media//mercer-county.webp",
    description: "A recreation of my first project, promoting Mercer County restaurants through web design, keyword research, SEO, and performance optimization.",
    skills: ["WordPress", "HTML", "CSS", "JavaScript", "PHP", "SEO"],
    link: "https://mercergems.blog",
    caseStudy: {
      overview: "Created a comprehensive restaurant review and discovery platform focused on Mercer County's dining scene.",
      challenge: "The local area lacked a centralized, reliable source for restaurant information and reviews. Needed to create a user-friendly platform that serves both diners and restaurant owners.",
      approach: "Developed a WordPress-based solution with custom post types for restaurants. Implemented advanced search and filtering options. Created a review system with verified visits.",
      implementation: "Built on WordPress with custom CSS, HTML, and PHP development. Integrated optimization techniques for smooth website navigation. Implemented structured data for enhanced SEO.",
      results: "Became a top-ranking restaurant guide for Mercer County. Achieved 10,000+ pageviews and partnerships with local restaurants.",
      conclusion: "Successfully filled a gap in the local digital ecosystem while providing value to both consumers and businesses in the Mercer County restaurant industry."
    }
  },
];

const ProjectCard = memo(({ project, index }) => {
  const [showCaseStudy, setShowCaseStudy] = useState(false);
  const cardRef = useRef(null);
  const isInView = index === 0 || useInView(cardRef, { amount: 0.2, once: true });
  const direction = index % 2 === 0 ? -100 : 100;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, x: direction }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: direction }}
      transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
      className={`w-full max-w-full md:w-[896px] h-[370px] md:h-[400px] relative rounded-xl overflow-hidden transform hover:scale-[1.02] hover:shadow-2xl shadow-[0_0_25px_rgba(0,0,0,0.45)] shadow-blue-900/45 mx-auto md:mx-0 ${
        index % 2 === 0 ? 'md:ml-0' : 'md:ml-auto'
      }`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${project.image})` }}
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-black/40 p-6 md:p-8">
        <h3 className="text-2xl md:text-3xl font-bold mb-3">{project.title}</h3>
        <p className="text-gray-300 text-base md:text-lg mb-4">{project.description}</p>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
          <div className="flex flex-wrap gap-2 md:gap-3">
            {project.skills.map((skill) => (
              <span 
                key={skill} 
                className="px-2 md:px-4 py-1 md:py-2 bg-blue-500/20 rounded-full text-blue-300 text-sm md:text-base font-medium whitespace-nowrap"
              >
                {skill}
              </span>
            ))}
          </div>
          <div className="flex md:flex-col items-center md:items-end gap-2 md:gap-1">
            <button 
              onClick={() => setShowCaseStudy(true)} 
              className="text-white text-base md:text-base flex items-center gap-2 hover:text-blue-300 transition-colors duration-300 whitespace-nowrap bg-blue-500/20 px-3 md:px-4 py-1.5 md:py-2 rounded-lg"
            >
              Case Study <BookOpen className="w-4 h-4 flex-shrink-0" />
            </button>
            <div className="flex flex-col md:flex-row items-end gap-0 md:gap-4 md:mt-1">
              {project.instagram && (
                <a 
                  href={project.instagram} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-white text-base md:text-base flex items-center gap-2 hover:text-blue-300 transition-colors duration-300 whitespace-nowrap"
                >
                  Visit IG <ArrowUpRight className="w-4 h-4 flex-shrink-0" />
                </a>
              )}
              <a 
                href={project.link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-white text-base md:text-base flex items-center gap-2 hover:text-blue-300 transition-colors duration-300 whitespace-nowrap"
              >
                Visit Site <ArrowUpRight className="w-4 h-4 flex-shrink-0" />
              </a>
            </div>
          </div>
        </div>
      </div>
      <CaseStudyModal
        isOpen={showCaseStudy}
        onClose={() => setShowCaseStudy(false)}
        caseStudy={project.caseStudy}
      />
    </motion.div>
  );
});

const ProjectsSection = () => (
  <div className="w-full">
    <div className="bg-[#1a2f5c]/50 rounded-2xl p-6 sm:p-8 md:p-12 w-full mx-auto">
      <motion.h2
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-blue-200 to-blue-400 bg-clip-text text-transparent mb-8"
      >
        My Projects
      </motion.h2>
      <div className="flex flex-col gap-[35px] md:gap-12 overflow-hidden">
        {projects.map((project, index) => (
          <ProjectCard key={index} project={project} index={index} />
        ))}
      </div>
    </div>
  </div>
);

export default ProjectsSection;