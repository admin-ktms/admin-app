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
    sm: { height: 26, width: 56, text: 'text-xs', sub: 'text-[8px]' },
    md: { height: 34, width: 72, text: 'text-sm', sub: 'text-[9px]' },
    lg: { height: 42, width: 88, text: 'text-base', sub: 'text-[10px]' },
  }[size];

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Clean Geometric Wordmark Pill (No Shield) */}
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox="0 0 88 42"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Subtle Charcoal Container with Crisp Stadium Border */}
        <rect
          x="1"
          y="1"
          width="86"
          height="40"
          rx="6"
          fill="#11151D"
          stroke="#2A3342"
          strokeWidth="1.5"
        />

        {/* Minimal Cyan Focus Accent Bar */}
        <rect x="1" y="1" width="4" height="40" rx="2" fill="#00D9FF" />

        {/* High-Impact Geometric Typography */}
        <text
          x="46"
          y="28"
          textAnchor="middle"
          fill="#F5F7FA"
          fontFamily="system-ui, -apple-system, 'Segoe UI', 'Impact', sans-serif"
          fontWeight="900"
          fontSize="21"
          letterSpacing="2.5"
        >
          KT<tspan fill="#00D9FF">MS</tspan>
        </text>
      </svg>

      {showText && (
        <div className="flex flex-col justify-center">
          <span
            className={`font-black tracking-wider text-ktms-text uppercase leading-tight ${dimensions.text}`}
          >
            KickOff
          </span>
          <span
            className={`font-mono font-semibold tracking-widest text-ktms-muted uppercase ${dimensions.sub}`}
          >
            Ops Console
          </span>
        </div>
      )}
    </div>
  );
};
