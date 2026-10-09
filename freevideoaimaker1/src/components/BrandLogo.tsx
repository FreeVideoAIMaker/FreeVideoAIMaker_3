import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', size = 36 }) => {
  return (
    <div 
      style={{ width: size, height: size }} 
      className={`relative rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-0.5 transition-transform group-hover:scale-105 ${className}`}
    >
      <svg 
        viewBox="0 0 64 64" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]"
      >
        <defs>
          <linearGradient id="logoGradCore" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <linearGradient id="logoRingGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <filter id="neonBloom" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Dark Cybernetic Capsule */}
        <rect width="64" height="64" rx="16" fill="#090d16" />
        <rect x="2" y="2" width="60" height="60" rx="14" fill="none" stroke="url(#logoGradCore)" strokeWidth="1.5" strokeOpacity="0.8" />

        {/* Neural Optical Prism Rings */}
        <circle cx="32" cy="32" r="22" stroke="url(#logoRingGrad)" strokeWidth="1.5" strokeDasharray="6 3" strokeOpacity="0.7" />
        <circle cx="32" cy="32" r="15" stroke="url(#logoGradCore)" strokeWidth="1.8" strokeOpacity="0.9" />

        {/* Central Geometric Kinetic Play Triangle with Ocular Core */}
        <polygon 
          points="27,21 44,32 27,43" 
          fill="url(#logoGradCore)" 
          filter="url(#neonBloom)"
        />

        {/* Crystalline Energy Sparkles */}
        <circle cx="16" cy="16" r="2" fill="#22d3ee" />
        <circle cx="48" cy="16" r="1.5" fill="#f43f5e" />
        <circle cx="48" cy="48" r="2" fill="#a855f7" />
        <circle cx="16" cy="48" r="1.5" fill="#10b981" />

        {/* Central Core Photon */}
        <circle cx="32" cy="32" r="2.5" fill="#ffffff" filter="drop-shadow(0 0 3px #22d3ee)" />
      </svg>
    </div>
  );
};
