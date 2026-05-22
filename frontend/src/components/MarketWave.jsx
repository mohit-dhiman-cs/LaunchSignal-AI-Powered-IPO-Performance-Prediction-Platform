import React from 'react';

export default function MarketWave() {
  return (
    <div className="relative w-full h-full flex items-center justify-start lg:-mt-12 lg:-ml-8">
      
      {/* Background glow orb to give it depth */}
      <div 
        className="absolute bg-blue-500 rounded-full blur-[100px] opacity-20 animate-pulse"
        style={{ width: '300px', height: '300px' }}
      ></div>

      {/* Modern SVG Stock Wave - Pure Visual */}
      <svg viewBox="0 0 600 300" className="w-[110%] max-w-[600px] h-auto relative z-10 drop-shadow-2xl overflow-visible">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0" />
            <stop offset="20%" stopColor="#3b82f6" stopOpacity="1" />
            <stop offset="80%" stopColor="#1d4ed8" stopOpacity="1" />
            <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Shadow / Secondary Wave */}
        <path 
          d="M 0 250 C 150 250, 200 150, 300 180 C 400 210, 450 80, 600 120" 
          fill="none" 
          stroke="#e2e8f0" 
          strokeWidth="3"
          className="opacity-60"
        />

        {/* Primary Glowing Wave */}
        <path 
          d="M 0 200 C 120 200, 180 100, 300 130 C 420 160, 480 40, 600 60" 
          fill="none" 
          stroke="url(#lineGradient)" 
          strokeWidth="6"
          filter="url(#glow)"
        />

        {/* Data Nodes */}
        <circle cx="300" cy="130" r="6" fill="#ffffff" stroke="#3b82f6" strokeWidth="3" className="animate-pulse" />
        <circle cx="600" cy="60" r="8" fill="#ffffff" stroke="#1d4ed8" strokeWidth="4" />
        
        {/* Connection Lines (Grid) */}
        <line x1="300" y1="130" x2="300" y2="280" stroke="#cbd5e1" strokeDasharray="4 4" strokeWidth="2" />
        <line x1="600" y1="60" x2="600" y2="280" stroke="#94a3b8" strokeDasharray="4 4" strokeWidth="2" />
      </svg>
    </div>
  );
}
