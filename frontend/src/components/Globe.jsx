import createGlobe from 'cobe';
import { useEffect, useRef } from 'react';

export default function Globe() {
  const canvasRef = useRef();

  useEffect(() => {
    let phi = 0;
    let width = 0;
    
    const updateSize = () => {
      if (canvasRef.current) {
        width = canvasRef.current.offsetWidth;
      }
    };
    
    window.addEventListener('resize', updateSize);
    updateSize();

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: 500 * 2,
      height: 500 * 2,
      phi: 0,
      theta: 0.15,
      dark: 1, 
      diffuse: 1.2,
      mapSamples: 4000, 
      mapBrightness: 6,
      baseColor: [0.15, 0.2, 0.3], // Navy blue earth
      markerColor: [1, 1, 1], // White markers
      glowColor: [0.15, 0.2, 0.3],
      markers: [
        { location: [19.0760, 72.8777], size: 0.1 },
        { location: [40.7128, -74.0060], size: 0.08 },
        { location: [51.5074, -0.1278], size: 0.08 },
        { location: [22.3193, 114.1694], size: 0.08 },
        { location: [35.6762, 139.6503], size: 0.08 },
      ],
      onRender: (state) => {
        state.phi = phi;
        phi += 0.004;
      },
    });

    return () => {
      globe.destroy();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  return (
    <div style={{ 
      width: '100%', 
      maxWidth: '500px', 
      aspectRatio: '1', 
      margin: '0 auto', 
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '500px',
          height: '500px',
          maxWidth: '100%',
          aspectRatio: '1',
          cursor: 'grab',
        }}
        width={1000}
        height={1000}
        className="animate-fadeUp"
      />
    </div>
  );
}
