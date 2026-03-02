import { useEffect, useState } from 'react';

export function MartiniLoading() {
  const [loadingText, setLoadingText] = useState('');
  const texts = ['Pouring...', 'Shaking...', 'Straining...', 'Serving...'];

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setLoadingText(texts[index]);
      index = (index + 1) % texts.length;
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 dark:from-primary/20 dark:to-secondary/20">
      <div className="relative">
        {/* Martini Glass */}
        <svg
          width="120"
          height="180"
          viewBox="0 0 120 180"
          className="animate-pulse"
        >
          {/* Glass Stem */}
          <line
            x1="60"
            y1="106.6"
            x2="60"
            y2="160"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            className="text-foreground/60"
          />
          {/* Glass Base */}
          <ellipse
            cx="60"
            cy="165"
            rx="45"
            ry="10"
            fill="currentColor"
            className="text-foreground/60"
          />
          {/* Glass Body */}
          <path
            d="M10 20 L110 20 L60 106.6 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-foreground/60"
          />
          {/* Liquid Line */}
          <path
            d="M22 40 L98 40 L60 106.6 Z"
            fill="hsl(var(--primary))"
            opacity="0.8"
          />
          {/* Olive */}
          <circle
            cx="68"
            cy="75"
            r="8"
            fill="hsl(var(--primary))"
            stroke="hsl(var(--primary)/0.8)"
            strokeWidth="2"
          />
          {/* Olive Pit */}
          <circle
            cx="68"
            cy="75"
            r="3"
            fill="hsl(var(--accent))"
            opacity="0.8"
          />
          {/* Sparkles */}
          <g className="sparkles">
            {[0, 1, 2].map((i) => (
              <g
                key={i}
                className="sparkle"
                style={{
                  animationDelay: `${i * 0.2}s`,
                  transformOrigin: `${30 + i * 30}px ${40 + i * 20}px`
                }}
              >
                <line
                  x1={30 + i * 30}
                  y1={40 + i * 20}
                  x2={30 + i * 30}
                  y2={30 + i * 20}
                  stroke="hsl(var(--secondary))"
                  strokeWidth="2"
                />
                <line
                  x1={30 + i * 30}
                  y1={40 + i * 20}
                  x2={30 + i * 30 + 8}
                  y2={40 + i * 20 - 8}
                  stroke="hsl(var(--secondary))"
                  strokeWidth="2"
                />
              </g>
            ))}
          </g>
          {/* Glass Reflection */}
          <path
            d="M20 30 L40 30"
            fill="none"
            stroke="white"
            strokeWidth="4"
            opacity="0.3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* App Name */}
      <h1 className="mt-8 text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
        Martini Records
      </h1>
      
      {/* Loading Text */}
      <p className="mt-4 text-muted-foreground animate-pulse">
        {loadingText}
      </p>

      {/* Decorative Lines */}
      <div className="mt-8 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
