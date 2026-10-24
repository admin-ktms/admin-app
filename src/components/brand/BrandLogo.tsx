import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const dimensions = {
    sm: { box: 28, text: 'text-xs' },
    md: { box: 36, text: 'text-sm' },
    lg: { box: 44, text: 'text-base' },
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Geometric KTMS Stadium Shield Monogram */}
      <svg
        width={dimensions.box}
        height={dimensions.box}
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <rect width="44" height="44" rx="8" fill="#11151D" />
        <path
          d="M6 12L22 4L38 12V26C38 34.5 22 40 22 40C22 40 6 34.5 6 26V12Z"
          stroke="#2A3342"
          strokeWidth="2"
        />
        <path
          d="M10 15L22 9L34 15V25C34 31.5 22 36 22 36C22 36 10 31.5 10 25V15Z"
          fill="#1A2230"
        />
        <text
          x="22"
          y="26"
          textAnchor="middle"
          fill="#00D9FF"
          fontFamily="monospace"
          fontWeight="900"
          fontSize="10"
          letterSpacing="0.5"
        >
          KTMS
        </text>
      </svg>

      {showText && (
        <div className="flex flex-col">
          <span className={`font-black tracking-wider text-ktms-text leading-none ${dimensions.text}`}>
            KTMS
          </span>
          <span className="text-[9px] font-mono font-semibold tracking-widest text-ktms-muted uppercase mt-0.5">
            Operations Console
          </span>
        </div>
      )}
    </div>
  );
};
