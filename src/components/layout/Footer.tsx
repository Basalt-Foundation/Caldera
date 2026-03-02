export function Footer() {
  return (
    <footer className="border-t border-border py-6 px-4">
      <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-text-tertiary">
          Built on{' '}
          <span className="text-text-secondary font-medium">Basalt</span>
        </p>
        <div className="flex items-center gap-6">
          <a
            href="https://basalt.foundation"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-text-tertiary hover:text-text-secondary transition-colors"
          >
            Basalt
          </a>
          <a
            href="https://basalt-foundation.github.io/basalt-docs/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-text-tertiary hover:text-text-secondary transition-colors"
          >
            Docs
          </a>
          <a
            href="https://github.com/basalt-foundation"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-text-tertiary hover:text-text-secondary transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
