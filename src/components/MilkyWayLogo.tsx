import React from 'react';

interface MilkyWayLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textColor?: 'dark' | 'light';
}

export const MilkyWayLogo: React.FC<MilkyWayLogoProps> = ({
  className = '',
  size = 'md',
  showText = false,
  textColor = 'dark',
}) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const imageSize = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div className={`relative ${imageSize} rounded-xl overflow-hidden bg-white shadow-xs border border-[#26352D]/15 flex items-center justify-center p-0.5 shrink-0`}>
        <img
          src="/milkyway-logo.png"
          alt="MilkyWay Emblem"
          className="w-full h-full object-contain"
          referrerPolicy="no-referrer"
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span
            className={`font-bold tracking-tight font-sans ${
              size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-xl'
            } ${textColor === 'light' ? 'text-[#FFFDF7]' : 'text-[#202521]'}`}
          >
            MilkyWay
          </span>
          <span className="text-[9px] uppercase font-mono tracking-[0.2em] text-[#66734A] font-bold -mt-1">
            Supply-Chain Intelligence
          </span>
        </div>
      )}
    </div>
  );
};
