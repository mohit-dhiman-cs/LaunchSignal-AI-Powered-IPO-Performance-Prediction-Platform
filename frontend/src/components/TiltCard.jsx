import { useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';

const TiltCard = forwardRef(({ children, className = '', style = {}, id }, ref) => {
  const [tiltStyle, setTiltStyle] = useState({});
  const cardRef = useRef(null);

  useImperativeHandle(ref, () => cardRef.current);

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -4;
    const rotateY = ((x - centerX) / centerX) * 4;

    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`,
      transition: 'transform 0.1s ease-out, box-shadow 0.1s ease-out',
      boxShadow: '0 20px 40px rgba(0,0,0,0.06)'
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.5s ease-out, box-shadow 0.5s ease-out',
      boxShadow: 'var(--shadow-card)'
    });
  }, []);

  return (
    <div
      id={id}
      ref={cardRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ ...style, ...tiltStyle, willChange: 'transform' }}
    >
      {children}
    </div>
  );
});

export default TiltCard;
