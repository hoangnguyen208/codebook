export function TransformArrow() {
  return (
    <div className="flex items-center justify-center">
      <div className="flex flex-col items-center gap-2 md:flex-row md:gap-3">
        <div className="h-px w-12 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse md:w-px md:h-12 md:bg-gradient-to-b" />
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          className="text-blue-400 animate-pulse shrink-0 md:rotate-0 rotate-90"
        >
          <path
            d="M5 12h14M13 5l7 7-7 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="h-px w-12 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse md:w-px md:h-12 md:bg-gradient-to-b" />
      </div>
    </div>
  );
}
