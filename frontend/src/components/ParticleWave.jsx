import { useEffect, useRef } from 'react';

export default function ParticleWave() {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width, height;
    const particles = [];
    const countX = 50; 
    const countY = 30;
    const gap = 35;

    const resize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    // Create a grid of points
    for (let i = 0; i < countX; i++) {
      for (let j = 0; j < countY; j++) {
        particles.push({
          ix: i,
          iy: j,
          x: i * gap - (countX * gap) / 2,
          y: j * gap - (countY * gap) / 2,
        });
      }
    }

    let time = 0;
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      
      const centerX = width / 2;
      const centerY = height / 2;
      
      // Draw wave lines/dots
      particles.forEach(p => {
        // Simple 3D Wave math
        const xOffset = p.ix * 0.15;
        const yOffset = p.iy * 0.15;
        const wave = Math.sin(xOffset + time) * Math.cos(yOffset + time) * 20;
        
        // Calculate screen position with depth
        const screenX = centerX + p.x;
        const screenY = centerY + p.y + wave;
        
        // Calculate size based on "depth" (y position)
        const size = (p.iy / countY) * 1.5 + 0.5;
        const opacity = (p.iy / countY) * 0.4 + 0.1;

        ctx.fillStyle = `rgba(59, 130, 246, ${opacity})`;
        ctx.beginPath();
        ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
        ctx.fill();
      });

      time += 0.02;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.8,
        maskImage: 'radial-gradient(circle, black 0%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(circle, black 0%, transparent 80%)',
      }}
    />
  );
}
