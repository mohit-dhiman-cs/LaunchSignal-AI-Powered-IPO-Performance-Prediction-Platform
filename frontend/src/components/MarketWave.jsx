import React from 'react';

export default function MarketWave() {
  return (
    <div className="relative w-full max-w-lg mx-auto aspect-square flex flex-col items-center justify-center">
      
      {/* Background glow orb to give it depth */}
      <div className="absolute w-64 h-64 bg-blue-400 rounded-full blur-[80px] opacity-20 animate-pulse"></div>

      {/* Modern SVG Stock Wave */}
      <svg viewBox="0 0 500 400" className="w-full h-full relative z-10 drop-shadow-2xl overflow-visible">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#93c5fd" stopOpacity="0" />
            <stop offset="20%" stopColor="#3b82f6" stopOpacity="1" />
            <stop offset="80%" stopColor="#1d4ed8" stopOpacity="1" />
            <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Shadow Wave */}
        <path 
          d="M 0 300 C 100 300, 150 200, 250 250 C 350 300, 400 100, 500 150" 
          fill="none" 
          stroke="#e2e8f0" 
          strokeWidth="4"
          className="opacity-50"
        />

        {/* Primary Glowing Wave */}
        <path 
          d="M 0 250 C 120 250, 180 150, 250 180 C 320 210, 400 80, 500 100" 
          fill="none" 
          stroke="url(#lineGradient)" 
          strokeWidth="6"
          filter="url(#glow)"
        />

        {/* Data Nodes */}
        <circle cx="250" cy="180" r="6" fill="#ffffff" stroke="#3b82f6" strokeWidth="3" className="animate-pulse" />
        <circle cx="500" cy="100" r="8" fill="#ffffff" stroke="#1d4ed8" strokeWidth="4" />
        
        {/* Connection Lines (Grid) */}
        <line x1="250" y1="180" x2="250" y2="350" stroke="#cbd5e1" strokeDasharray="4 4" strokeWidth="2" />
        <line x1="500" y1="100" x2="500" y2="350" stroke="#94a3b8" strokeDasharray="4 4" strokeWidth="2" />
      </svg>

      {/* Floating UI Elements */}
      <div 
        className="absolute top-[25%] right-[5%] bg-white/90 backdrop-blur-sm border border-blue-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-xl px-4 py-3 z-20 transition-transform duration-1000 ease-in-out hover:-translate-y-2"
      >
        <div className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Projected Return</div>
        <div className="text-xl font-bold text-blue-600 flex items-center gap-1">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
          + 42.8%
        </div>
      </div>

      <div 
        className="absolute top-[50%] left-[15%] bg-white/90 backdrop-blur-sm border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-xl px-4 py-2 z-20 animate-bounce"
        style={{ animationDuration: '4s' }}
      >
        <div className="text-xs text-gray-500 font-semibold">Live GMP</div>
        <div className="text-sm font-bold text-gray-800">₹145.00</div>
      </div>

    </div>
  );
}
