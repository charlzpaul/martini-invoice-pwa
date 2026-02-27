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
            y1="120"
            x2="60"
            y2="160"
            stroke="rgb(71, 48, 33)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Glass Base */}
          <ellipse
            cx="60"
            cy="160"
            rx="30"
            ry="8"
            fill="rgb(71, 48, 33)"
          />
          {/* Glass Body */}
          <path
            d="M30 20 Q30 120 60 120 Q90 120 90 20 Z"
            fill="none"
            stroke="rgb(71, 48, 33)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {/* Liquid Line */}
          <path
            d="M35 35 Q35 110 60 110 Q85 110 85 35 Z"
            fill="rgb(125, 157, 93)"
            opacity="0.7"
          />
          {/* Olive */}
          <circle
            cx="60"
            cy="40"
            r="8"
            fill="rgb(125, 157, 93)"
            stroke="rgb(91, 125, 65)"
            strokeWidth="2"
          />
          {/* Olive Pit */}
          <circle
            cx="60"
            cy="40"
            r="3"
            fill="rgb(65, 95, 45)"
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
                  stroke="rgb(237, 137, 23)"
                  strokeWidth="2"
                />
                <line
                  x1={30 + i * 30}
                  y1={40 + i * 20}
                  x2={30 + i * 30 + 8}
                  y2={40 + i * 20 - 8}
                  stroke="rgb(237, 137, 23)"
                  strokeWidth="2"
                />
              </g>
            ))}
          </g>
        </svg>

        {/* Glass Reflection */}
        <path
          d="M35 25 Q40 100 60 100 Q80 100 85 25"
          fill="none"
          stroke="white"
          strokeWidth="2"
          opacity="0.3"
          strokeLinecap="round"
        />
      </div>

      {/* App Name */}
      <h1 className="mt-8 text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
        Martini Shot Invoices
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
