import React, { useEffect, useRef, memo } from 'react';

interface Particle {
  x: number;
  y: number;
  z: number;
  size: number;
  baseSpeed: number;
  vx: number;
  vy: number;
  vz: number;
  brightness: number;
}

const ParticleBackground: React.FC = memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const particlesArrayRef = useRef<Particle[]>([]);
  const mouseXRef = useRef(0);
  const mouseYRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const resizeCanvas = () => {
      const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
      canvas.width = window.innerWidth;
      canvas.height = vh;
      canvas.style.height = `${vh}px`;
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
    };

    resizeCanvas();

    const debouncedResize = () => {
      if (window.requestAnimationFrame) {
        window.requestAnimationFrame(resizeCanvas);
      } else {
        setTimeout(resizeCanvas, 66);
      }
    };

    window.addEventListener('resize', debouncedResize, { passive: true });
    window.addEventListener('orientationchange', () => {
      setTimeout(resizeCanvas, 100);
    }, { passive: true });

    const isMobile = window.innerWidth < 768;
    const numberOfParticles = isMobile ? 80 : 400;
    const maxDepth = 1000;
    const mouseInfluenceRadius = 100;
    const connectionDistance = isMobile ? 140 : 120;
    const minSpeed = isMobile ? 0.6 : 0.4;
    const maxSpeed = isMobile ? 0.6 : 0.4;

    const handlePointerMove = (e: TouchEvent | MouseEvent) => {
      const event = 'touches' in e ? e.touches[0] : e;
      if (event) {
        mouseXRef.current = event.clientX;
        mouseYRef.current = event.clientY;
      }
    };

    canvas.addEventListener('mousemove', handlePointerMove, { passive: true });
    canvas.addEventListener('touchmove', handlePointerMove, { passive: true });

    // Pre-allocate particles array
    particlesArrayRef.current = new Array(numberOfParticles);
    for (let i = 0; i < numberOfParticles; i++) {
      particlesArrayRef.current[i] = {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        z: Math.random() * maxDepth,
        size: Math.random() * (isMobile ? 0.6 : 0.7) + (isMobile ? 0.2 : 0.2),
        baseSpeed: minSpeed + Math.random() * (maxSpeed - minSpeed),
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        vz: (Math.random() - 0.5) * 2,
        brightness: 200 + Math.random() * 55
      };
    }

    const animate = () => {
      if (!canvas || !ctx) return;

      ctx.fillStyle = '#0d2242';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const time = performance.now() * 0.001;
      const particles = particlesArrayRef.current;

      // Sort particles by z-index for proper depth rendering
      particles.sort((a, b) => b.z - a.z);

      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];

        // Update particle position with optimized calculations
        particle.x += particle.vx * particle.baseSpeed;
        particle.y += particle.vy * particle.baseSpeed;
        particle.z += particle.vz * particle.baseSpeed;

        const dx = mouseXRef.current - particle.x;
        const dy = mouseYRef.current - particle.y;
        const distance = Math.hypot(dx, dy);
        
        if (distance < mouseInfluenceRadius) {
          const force = (mouseInfluenceRadius - distance) / mouseInfluenceRadius;
          particle.vx += (dx / distance) * force * 0.2;
          particle.vy += (dy / distance) * force * 0.2;
        }

        // Simplified movement patterns
        particle.vx += Math.sin(particle.y * 0.01 + time) * 0.05;
        particle.vy += Math.cos(particle.x * 0.01 + time) * 0.05;

        // Optimized speed normalization
        const speed = Math.hypot(particle.vx, particle.vy, particle.vz);
        if (speed < minSpeed) {
          const scale = minSpeed / speed;
          particle.vx *= scale;
          particle.vy *= scale;
          particle.vz *= scale;
        } else if (speed > maxSpeed * 2) {
          const scale = (maxSpeed * 2) / speed;
          particle.vx *= scale;
          particle.vy *= scale;
          particle.vz *= scale;
        }

        // Boundary checks with padding
        const padding = 50;
        if (particle.x < -padding) {
          particle.x = canvas.width + (Math.random() * padding);
          particle.vx = Math.abs(particle.vx) * -1;
        }
        if (particle.x > canvas.width + padding) {
          particle.x = -(Math.random() * padding);
          particle.vx = Math.abs(particle.vx);
        }
        if (particle.y < -padding) {
          particle.y = canvas.height + (Math.random() * padding);
          particle.vy = Math.abs(particle.vy) * -1;
        }
        if (particle.y > canvas.height + padding) {
          particle.y = -(Math.random() * padding);
          particle.vy = Math.abs(particle.vy);
        }
        if (particle.z < 0) particle.z = maxDepth;
        if (particle.z > maxDepth) particle.z = 0;

        const scale = (maxDepth - particle.z) / maxDepth;
        const perspective = 0.8 + scale * 0.5;

        const projectedX = particle.x * perspective;
        const projectedY = particle.y * perspective;
        const projectedSize = particle.size * perspective * 2;

        const opacity = isMobile ? scale * 0.8 : scale * 0.7;
        
        // Batch rendering operations
        ctx.beginPath();
        ctx.arc(projectedX, projectedY, projectedSize, 0, Math.PI * 2);
        
        const brightness = Math.floor(particle.brightness * scale);
        ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness}, ${opacity})`;
        ctx.fill();

        // Optimized connection drawing
        if (i < particles.length - 1) {
          for (let j = i + 1; j < particles.length; j++) {
            const otherParticle = particles[j];
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const dz = particle.z - otherParticle.z;
            const distance = Math.hypot(dx, dy, dz);

            if (distance < connectionDistance) {
              const otherScale = (maxDepth - otherParticle.z) / maxDepth;
              const otherPerspective = 0.8 + otherScale * 0.5;
              const lineOpacity = (1 - distance / connectionDistance) * opacity * (isMobile ? 0.5 : 0.4);
              
              if (lineOpacity > 0.05) {
                ctx.beginPath();
                ctx.moveTo(projectedX, projectedY);
                ctx.lineTo(
                  otherParticle.x * otherPerspective,
                  otherParticle.y * otherPerspective
                );
                const lineBrightness = Math.floor((particle.brightness + otherParticle.brightness) / 2);
                ctx.strokeStyle = `rgba(${lineBrightness}, ${lineBrightness}, ${lineBrightness}, ${lineOpacity})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
              }
            }
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', resizeCanvas);
      canvas.removeEventListener('mousemove', handlePointerMove);
      canvas.removeEventListener('touchmove', handlePointerMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none"
      style={{ 
        zIndex: 0,
        touchAction: 'none',
        WebkitOverflowScrolling: 'touch'
      }}
    />
  );
});

ParticleBackground.displayName = 'ParticleBackground';
export default ParticleBackground;