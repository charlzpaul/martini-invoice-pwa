import { useEffect } from 'react';

export function MartiniSuccess() {
  useEffect(() => {
    // Add sparkle animation keyframes dynamically
    const style = document.createElement('style');
    style.textContent = `
      @keyframes sparkle {
        0%, 100% { opacity: 0; transform: scale(0); }
        50% { opacity: 1; transform: scale(1); }
      }
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }
      @keyframes shimmer {
        0% { opacity: 0.3; }
        50% { opacity: 1; }
        100% { opacity: 0.3; }
      }
      .sparkle {
        animation: sparkle 2s ease-in-out infinite;
      }
      .float {
        animation: float 3s ease-in-out infinite;
      }
      .shimmer {
        animation: shimmer 2s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20">
      <div className="float">
        {/* Success Checkmark Circle */}
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          className="mb-8"
        >
          {/* Outer Circle */}
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="4"
            className="shimmer"
          />
          
          {/* Inner Circle */}
          <circle
            cx="60"
            cy="60"
            r="40"
            fill="url(#gradient)"
            opacity="0.2"
          />
          
          {/* Checkmark */}
          <path
            d="M40 60 L55 75 L80 45"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="sparkle"
          />
          
          {/* Gradient Definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--secondary))" />
            </linearGradient>
          </defs>
        </svg>

        {/* Martini Glass Icon */}
        <svg
          width="80"
          height="120"
          viewBox="0 0 80 120"
          className="mb-6"
        >
          {/* Glass Stem */}
          <line
            x1="40"
            y1="81"
            x2="40"
            y2="110"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className="text-foreground/60"
          />
          {/* Glass Base */}
          <ellipse
            cx="40"
            cy="110"
            rx="30"
            ry="6"
            fill="currentColor"
            className="text-foreground/60"
          />
          {/* Glass Body */}
          <path
            d="M5 20 L75 20 L40 80.6 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-foreground/60"
          />
          {/* Liquid */}
          <path
            d="M14 35 L66 35 L40 80.6 Z"
            fill="hsl(var(--primary))"
            opacity="0.7"
          />
          {/* Olive with Twist */}
          <g className="sparkle">
            <circle
              cx="48"
              cy="55"
              r="6"
              fill="hsl(var(--primary))"
              stroke="hsl(var(--primary)/0.8)"
              strokeWidth="1.5"
            />
            <circle
              cx="48"
              cy="55"
              r="2.5"
              fill="hsl(var(--accent))"
              opacity="0.8"
            />
            {/* Olive Twist */}
            <path
              d="M48 49 Q52 51 52 55"
              fill="none"
              stroke="hsl(var(--secondary))"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </g>
          {/* Glass Reflection */}
          <path
            d="M12 28 L24 28"
            fill="none"
            stroke="white"
            strokeWidth="2"
            opacity="0.4"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Success Message */}
      <h2 className="text-3xl font-bold text-foreground mb-2">
        Martini Records
      </h2>
      <p className="text-lg text-muted-foreground">
        All changes saved successfully!
      </p>

      {/* Decorative Sparkles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-secondary sparkle"
            style={{
              left: `${10 + (i * 12)}%`,
              top: `${10 + (i * 8)}%`,
              animationDelay: `${i * 0.3}s`
            }}
          />
        ))}
      </div>
    </div>
  );
}
