export default function IntelliTestLogo({ className = '', size = 40 }: { className?: string; size?: number }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <rect width="48" height="48" rx="12" fill="url(#intellitest-gradient)" />
        <path
          d="M14 16h6v2h-4v4h4v2h-4v6h-2V16zm10 0h2v16h-2V16zm8 0h2v2h-2v2h2v2h-2v2h2v2h-2v2h2v2h-2v2h-2v-2h2v-2h-2v-2h2v-2h-2v-2h2v-2z"
          fill="white"
        />
        <circle cx="36" cy="14" r="4" fill="white" opacity="0.9" />
        <defs>
          <linearGradient id="intellitest-gradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366f1" />
            <stop offset="1" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <span className="text-xl font-bold tracking-tight text-slate-800">IntelliTest</span>
    </div>
  );
}

