"use client";

export function FlowAnimation() {
  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox="0 0 1000 220"
        width="100%"
        style={{ minWidth: 700 }}
        className="block"
      >
        <defs>
          <filter
            id="glow-origin"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter
            id="glow-reactive"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter
            id="glow-dest"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradient for the reactive node glow ring */}
          <linearGradient id="reactive-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>

        <style>{`
          @keyframes fadeSlideIn {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.02); opacity: 0.7; }
          }
          @keyframes reactiveGlow {
            0%, 100% { opacity: 0.15; }
            50% { opacity: 0.35; }
          }
          .node { animation: fadeSlideIn 0.5s ease-out both; }
          .node-1 { animation-delay: 0ms; }
          .node-2 { animation-delay: 200ms; }
          .node-3 { animation-delay: 400ms; }
          .node-4 { animation-delay: 600ms; }
          .node-5 { animation-delay: 800ms; }
          .pulse-border {
            animation: pulse 3s ease-in-out infinite;
            transform-origin: center;
          }
          .reactive-ring {
            animation: reactiveGlow 2.5s ease-in-out infinite;
          }
          .connection-line { stroke-dasharray: 6 4; opacity: 0.25; }
        `}</style>

        {/* ── Connection lines ──────────────────────────────── */}
        {/* Origin Event → Reactive Network */}
        <path
          d="M 200 110 L 300 110"
          fill="none"
          stroke="#4f46e5"
          strokeWidth="2"
          className="connection-line"
        />
        {/* Reactive Network → ReactVM */}
        <path
          d="M 420 110 L 470 110"
          fill="none"
          stroke="#7c3aed"
          strokeWidth="2"
          className="connection-line"
        />
        {/* ReactVM → Condition */}
        <path
          d="M 590 110 L 640 110"
          fill="none"
          stroke="#a855f7"
          strokeWidth="2"
          className="connection-line"
        />
        {/* Condition → Destination */}
        <path
          d="M 760 110 L 810 110"
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          className="connection-line"
        />

        {/* ── Animated dots ─────────────────────────────────── */}
        {/* Origin → Reactive Network */}
        {[0, 0.8, 1.6].map((delay, i) => (
          <circle
            key={`d1-${i}`}
            r="4"
            fill="#4f46e5"
            filter="url(#glow-origin)"
          >
            <animateMotion
              dur="1.6s"
              repeatCount="indefinite"
              begin={`${delay}s`}
              path="M 200 110 L 300 110"
            />
            <animate
              attributeName="fill"
              values="#4f46e5;#7c3aed"
              dur="1.6s"
              repeatCount="indefinite"
              begin={`${delay}s`}
            />
          </circle>
        ))}
        {/* Reactive Network → ReactVM */}
        {[0.3, 1.1, 1.9].map((delay, i) => (
          <circle
            key={`d2-${i}`}
            r="3.5"
            fill="#7c3aed"
            filter="url(#glow-reactive)"
          >
            <animateMotion
              dur="1.2s"
              repeatCount="indefinite"
              begin={`${delay}s`}
              path="M 420 110 L 470 110"
            />
          </circle>
        ))}
        {/* ReactVM → Condition */}
        {[0.5, 1.3, 2.1].map((delay, i) => (
          <circle
            key={`d3-${i}`}
            r="3.5"
            fill="#a855f7"
            filter="url(#glow-reactive)"
          >
            <animateMotion
              dur="1.2s"
              repeatCount="indefinite"
              begin={`${delay}s`}
              path="M 590 110 L 640 110"
            />
          </circle>
        ))}
        {/* Condition → Destination */}
        {[0.7, 1.5, 2.3].map((delay, i) => (
          <circle
            key={`d4-${i}`}
            r="4"
            fill="#10b981"
            filter="url(#glow-dest)"
          >
            <animateMotion
              dur="1.6s"
              repeatCount="indefinite"
              begin={`${delay}s`}
              path="M 760 110 L 810 110"
            />
            <animate
              attributeName="fill"
              values="#a855f7;#10b981"
              dur="1.6s"
              repeatCount="indefinite"
              begin={`${delay}s`}
            />
          </circle>
        ))}

        {/* ── Node 1: Origin Event ──────────────────────────── */}
        <g className="node node-1">
          <rect
            x="10"
            y="78"
            width="190"
            height="64"
            rx="12"
            fill="rgba(79, 70, 229, 0.05)"
            stroke="#4f46e5"
            strokeWidth="2"
          />
          {/* Lightning bolt icon */}
          <path
            d="M 95 86 L 108 86 L 103 96 L 113 96 L 93 118 L 100 104 L 88 104 Z"
            fill="#4f46e5"
            opacity="0.12"
          />
          <text
            x="105"
            y="104"
            fill="currentColor"
            fontSize="13"
            fontWeight="600"
            fontFamily="system-ui, sans-serif"
            textAnchor="middle"
          >
            Origin Event
          </text>
          <text
            x="105"
            y="122"
            fill="currentColor"
            opacity="0.5"
            fontSize="10"
            fontFamily="system-ui, sans-serif"
            textAnchor="middle"
          >
            Sepolia / Base Sepolia
          </text>
        </g>

        {/* ── Node 2: Reactive Network ──────────────────────── */}
        <g className="node node-2">
          {/* Outer glow ring */}
          <rect
            x="297"
            y="75"
            width="126"
            height="70"
            rx="14"
            fill="none"
            stroke="url(#reactive-gradient)"
            strokeWidth="1.5"
            opacity="0.2"
            className="reactive-ring"
          />
          <rect
            x="300"
            y="78"
            width="120"
            height="64"
            rx="12"
            fill="rgba(124, 58, 237, 0.08)"
            stroke="#7c3aed"
            strokeWidth="2"
          />
          {/* Hexagon icon */}
          <polygon
            points="350,84 360,80 370,84 370,96 360,100 350,96"
            fill="none"
            stroke="#7c3aed"
            strokeWidth="1.2"
            opacity="0.2"
          />
          <text
            x="360"
            y="104"
            fill="currentColor"
            fontSize="12"
            fontWeight="700"
            fontFamily="system-ui, sans-serif"
            textAnchor="middle"
          >
            Reactive
          </text>
          <text
            x="360"
            y="122"
            fill="currentColor"
            opacity="0.5"
            fontSize="10"
            fontFamily="system-ui, sans-serif"
            textAnchor="middle"
          >
            Network
          </text>
        </g>

        {/* ── Node 3: ReactVM ───────────────────────────────── */}
        <g className="node node-3">
          <rect
            x="470"
            y="78"
            width="120"
            height="64"
            rx="12"
            fill="rgba(168, 85, 247, 0.05)"
            stroke="#a855f7"
            strokeWidth="2"
          />
          {/* Gear-like icon */}
          <circle
            cx="530"
            cy="92"
            r="8"
            fill="none"
            stroke="#a855f7"
            strokeWidth="1.2"
            opacity="0.15"
          />
          <text
            x="530"
            y="104"
            fill="currentColor"
            fontSize="13"
            fontWeight="600"
            fontFamily="system-ui, sans-serif"
            textAnchor="middle"
          >
            ReactVM
          </text>
          <text
            x="530"
            y="122"
            fill="currentColor"
            opacity="0.5"
            fontSize="10"
            fontFamily="system-ui, sans-serif"
            textAnchor="middle"
          >
            react() called
          </text>
        </g>

        {/* ── Node 4: Condition Check ───────────────────────── */}
        <g className="node node-4">
          <rect
            x="640"
            y="78"
            width="120"
            height="64"
            rx="12"
            fill="rgba(245, 158, 11, 0.05)"
            stroke="#f59e0b"
            strokeWidth="2"
          />
          {/* Filter/funnel icon */}
          <path
            d="M 690 86 L 710 86 L 703 96 L 703 104 L 697 104 L 697 96 Z"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1.2"
            opacity="0.15"
          />
          <text
            x="700"
            y="104"
            fill="currentColor"
            fontSize="13"
            fontWeight="600"
            fontFamily="system-ui, sans-serif"
            textAnchor="middle"
          >
            IF Condition
          </text>
          <text
            x="700"
            y="122"
            fill="currentColor"
            opacity="0.5"
            fontSize="10"
            fontFamily="system-ui, sans-serif"
            textAnchor="middle"
          >
            {"amount >= threshold"}
          </text>
        </g>

        {/* ── Node 5: Destination Action ────────────────────── */}
        <g className="node node-5">
          <rect
            x="810"
            y="78"
            width="180"
            height="64"
            rx="12"
            fill="rgba(16, 185, 129, 0.05)"
            stroke="#10b981"
            strokeWidth="2"
          />
          {/* Check circle icon */}
          <circle
            cx="900"
            cy="90"
            r="7"
            fill="none"
            stroke="#10b981"
            strokeWidth="1.2"
            opacity="0.15"
          />
          <text
            x="900"
            y="104"
            fill="currentColor"
            fontSize="13"
            fontWeight="600"
            fontFamily="system-ui, sans-serif"
            textAnchor="middle"
          >
            Destination Action
          </text>
          <text
            x="900"
            y="122"
            fill="currentColor"
            opacity="0.5"
            fontSize="10"
            fontFamily="system-ui, sans-serif"
            textAnchor="middle"
          >
            Alert / Callback / Custom
          </text>
        </g>

        {/* ── Role labels above the pipeline ────────────────── */}
        <text
          x="105"
          y="65"
          fill="currentColor"
          opacity="0.35"
          fontSize="9"
          fontWeight="600"
          fontFamily="system-ui, sans-serif"
          textAnchor="middle"
          letterSpacing="0.5"
        >
          ORIGIN CHAIN
        </text>
        <text
          x="450"
          y="65"
          fill="currentColor"
          opacity="0.35"
          fontSize="9"
          fontWeight="600"
          fontFamily="system-ui, sans-serif"
          textAnchor="middle"
          letterSpacing="0.5"
        >
          REACTIVE NETWORK
        </text>
        <text
          x="900"
          y="65"
          fill="currentColor"
          opacity="0.35"
          fontSize="9"
          fontWeight="600"
          fontFamily="system-ui, sans-serif"
          textAnchor="middle"
          letterSpacing="0.5"
        >
          DESTINATION CHAIN
        </text>

        {/* ── Bracket lines grouping Reactive Network nodes ── */}
        <line
          x1="300"
          y1="70"
          x2="590"
          y2="70"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.08"
        />
      </svg>
    </div>
  );
}
