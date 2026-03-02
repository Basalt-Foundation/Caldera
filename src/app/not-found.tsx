import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4 text-center">
      {/* Volcanic crater icon */}
      <div
        className="flex items-center justify-center w-24 h-24 rounded-full mb-8"
        style={{
          background:
            'radial-gradient(circle, hsla(33, 95%, 50%, 0.12) 0%, hsla(20, 5%, 10%, 1) 70%)',
          border: '1px solid hsla(33, 95%, 50%, 0.15)',
        }}
      >
        <span className="text-5xl font-bold text-accent/60">?</span>
      </div>

      <h1
        className="text-4xl sm:text-5xl font-bold tracking-tight mb-4"
        style={{
          background:
            'linear-gradient(135deg, hsl(33, 95%, 55%), hsl(20, 90%, 45%))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        Lost in the caldera
      </h1>

      <p className="text-lg text-text-secondary max-w-md mb-8">
        The page you are looking for does not exist. It may have been moved or
        the URL might be incorrect.
      </p>

      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-background font-semibold rounded-lg hover:bg-accent-hover transition-colors"
      >
        Return Home
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
          />
        </svg>
      </Link>
    </div>
  );
}
