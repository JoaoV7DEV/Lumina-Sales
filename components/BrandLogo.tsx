'use client';

import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function BrandLogo({ size = 'md', showText = true, className = '' }: BrandLogoProps) {
  const dimensions = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Monograma Vetorial Refinado: L estilizado com abertura de luz fotográfica */}
      <div
        className={`${dimensions[size]} rounded-xl bg-gradient-to-br from-[#EBD1A0] via-[#C9A46B] to-[#9E7337] p-[1.5px] shadow-sm shadow-[#C9A46B]/25 shrink-0 flex items-center justify-center transition-transform hover:scale-105`}
        title="Lumina Sales"
      >
        <div className="w-full h-full rounded-[10px] bg-gradient-to-br from-[#1A1E29] to-[#0E121A] flex items-center justify-center relative overflow-hidden">
          {/* Brilho de iluminação de estúdio sutil ao fundo */}
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#EBD1A0]/25 rounded-full blur-[4px]" />
          
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-[70%] h-[70%]"
          >
            {/* Feixe de luz / prisma fotográfico */}
            <path
              d="M17 7L24 14L17 21"
              stroke="#EBD1A0"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity="0.4"
            />
            {/* Letra L arquitetônica e precisa */}
            <path
              d="M10 7V23.5C10 24.3284 10.6716 25 11.5 25H23"
              stroke="url(#goldGradient)"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Estrela / Ponto focal de iluminação e captura */}
            <circle cx="10" cy="7" r="1.5" fill="#FFF0D0" />
            <circle cx="23" cy="25" r="1.5" fill="#FFF0D0" />

            <defs>
              <linearGradient id="goldGradient" x1="10" y1="7" x2="23" y2="25" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFF0D0" />
                <stop offset="0.5" stopColor="#C9A46B" />
                <stop offset="1" stopColor="#A87C3E" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Identidade Tipográfica */}
      {showText && (
        <div className="flex items-baseline gap-1.5 leading-none transition-opacity duration-200">
          <span className="font-bold text-base text-white tracking-tight font-sans">
            Lumina
          </span>
          <span className="text-sm font-light text-slate-400 font-sans">
            Sales
          </span>
        </div>
      )}
    </div>
  );
}
