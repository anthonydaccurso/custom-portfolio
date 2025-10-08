import React, { useRef, useEffect, useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useGesture } from '@use-gesture/react';
import { Linkedin, Github, FileText, Folders, Award, Move3d } from 'lucide-react';

const Card = () => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [{ transform, scale, opacity }, api] = useSpring(() => ({
    transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
    scale: 0.9,
    opacity: 0,
    config: {
      mass: 1,
      tension: 170,
      friction: 26,
    },
  }));

  useEffect(() => {
    api.start({
      scale: 1,
      opacity: 1,
      delay: 0,
      config: {
        tension: 280,
        friction: 60,
      },
    });
  }, [api]);

  useGesture(
    {
      onMove: ({ xy: [px, py], dragging }) => {
        if (dragging || isMobile) return;
        if (!cardRef.current) return;

        const bounds = cardRef.current.getBoundingClientRect();
        const x = px - bounds.left;
        const y = py - bounds.top;
        const centerX = bounds.width / 2;
        const centerY = bounds.height / 2;

        const rotateX = ((y - centerY) / centerY) * -30;
        const rotateY = ((x - centerX) / centerX) * 30;

        api.start({
          transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        });
      },
      onHover: ({ hovering }) => {
        if (!isMobile) {
          api.start({ scale: hovering ? 1.02 : 1 });
        }
      },
      onMouseLeave: () => {
        if (!isMobile) {
          api.start({
            transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
            scale: 1,
          });
        }
      },
    },
    {
      target: cardRef,
      eventOptions: { passive: true },
    }
  );

  return (
    <animated.div
      ref={cardRef}
      style={{
        transform,
        scale,
        opacity,
      }}
      className="w-full h-full flex items-center justify-center"
    >
      <div className={`bg-[#1a2f5c] rounded-xl p-4 shadow-lg border border-blue-500/40 ${isMobile ? '' : 'py-3'}`}>
        <div className={`text-white ${isMobile ? 'w-[336px]' : 'w-[310px]'} text-sm select-none`}>
          <div className="flex items-center gap-4 mb-2">
            <img
              src="https://bvevrurqtidadhfsuoee.supabase.co/storage/v1/object/public/media//anthony-daccurso-64x64.webp?quality=80&width=64"
              srcSet="
                https://bvevrurqtidadhfsuoee.supabase.co/storage/v1/object/public/media//anthony-daccurso-64x64.webp?quality=80&width=64 1x,
                https://bvevrurqtidadhfsuoee.supabase.co/storage/v1/object/public/media//anthony-daccurso-128x128.webp?quality=80&width=128 2x
              "
              alt="Anthony Daccurso"
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover"
              draggable={false}
            />
            <div>
              <h2 className="font-semibold text-lg select-none">Anthony Daccurso</h2>
              <p className="text-[13px] text-gray-300 select-none whitespace-nowrap">
                {isMobile ? 'Digital Marketer & Web Developer' : 'Digital Marketer & Web Developer'}
              </p>
            </div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <div className="flex gap-0">
              <a
                href="https://www.linkedin.com/in/anthony-daccurso/"
                target="_blank"
                rel="noreferrer"
                className="text-blue-300 hover:text-blue-200 transition-colors p-1"
                aria-label="Visit Anthony Daccurso's LinkedIn profile"
              >
                <Linkedin className="w-[22px] h-[22px]" />
              </a>
              <a
                href="https://drive.google.com/file/d/1AZAafbFGVqKAw0Vn2Jjwf27jYux-Fngh/view?usp=sharing"
                target="_blank"
                rel="noreferrer"
                className="text-blue-300 hover:text-blue-200 transition-colors p-1"
                aria-label="View Anthony Daccurso's Resume on Google Drive"
              >
                <FileText className="w-[22px] h-[22px]" />
              </a>
              <a
                href="https://github.com/anthonydaccurso"
                target="_blank"
                rel="noreferrer"
                className="text-blue-300 hover:text-blue-200 transition-colors p-1"
                aria-label="Visit Anthony Daccurso's GitHub profile"
              >
                <Github className="w-[22px] h-[22px]" />
              </a>
              <a
                href="https://drive.google.com/drive/folders/1zNDvHaLsJNsLUyehQu8ZxmiWXM4sA0E2?usp=sharing"
                target="_blank"
                rel="noreferrer"
                className="text-blue-300 hover:text-blue-200 transition-colors p-1"
                aria-label="Browse Anthony Daccurso's Certifications folder on Google Drive"
              >
                <Folders className="w-[22px] h-[22px]" />
              </a>
              <a
                href="https://drive.google.com/drive/folders/1B0ONHc3X5C6KA4RYtRZl72SnqrJMupuu?usp=sharing"
                target="_blank"
                rel="noreferrer"
                className="text-blue-300 hover:text-blue-200 transition-colors p-1"
                aria-label="Send an email to Anthony Daccurso"
              >
                <Award className="w-[22px] h-[22px]" />
              </a>
            </div>

            <span className="flex items-center gap-1 text-xs text-blue-100 group">
              <Move3d className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="group-hover:text-blue-300 transition-colors">
                {isMobile ? 'Movement on Desktop' : 'Hover to move'}
              </span>
            </span>
          </div>
        </div>
      </div>
    </animated.div>
  );
};

export default Card;