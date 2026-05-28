import { useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';

const TiltCard = forwardRef(({ children, className = '', style = {}, id, intensity = 8, onClick }, ref) => {
  const [tiltStyle, setTiltStyle] = useState({});
  const [glarePos, setGlarePos]   = useState({ x: 50, y: 50 });
  const [hovered, setHovered]     = useState(false);
  const cardRef = useRef(null);

  useImperativeHandle(ref, () => cardRef.current);

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width  / 2;
    const cy = rect.height / 2;

    const rotX = ((y - cy) / cy) * -intensity;
    const rotY = ((x - cx) / cx) *  intensity;

    // Glare position (0-100%)
    const glareX = Math.round((x / rect.width)  * 100);
    const glareY = Math.round((y / rect.height) * 100);

    setGlarePos({ x: glareX, y: glareY });
    setTiltStyle({
      transform: `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02, 1.02, 1.02)`,
      transition: 'transform 0.12s ease-out',
    });
  }, [intensity]);

  const handleMouseEnter = useCallback(() => setHovered(true), []);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    setTiltStyle({
      transform: 'perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 0.55s cubic-bezier(0.34,1.56,0.64,1)',
    });
  }, []);

  return (
    <div
      id={id}
      ref={cardRef}
      className={className}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        ...style,
        ...tiltStyle,
        willChange: 'transform',
        transformStyle: 'preserve-3d',
        position: style.position || 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Dynamic glare layer */}
      {hovered && (
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.12) 0%, transparent 60%)`,
          pointerEvents: 'none',
          zIndex: 10,
          mixBlendMode: 'overlay',
        }} />
      )}
      {children}
    </div>
  );
});

TiltCard.displayName = 'TiltCard';
export default TiltCard;
