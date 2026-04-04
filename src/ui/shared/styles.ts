import { css } from 'lit';

export const designTokens = css`
  :host {
    --bg: #1a1a2e;
    --card: #2a2a4a;
    --card-raised: #33335a;
    --text: #e0e0e0;
    --text-dim: #8888aa;
    --text-muted: #6a6a8a;
    --accent-orange: #f4a261;
    --accent-teal: #4ecdc4;
    --accent-purple: #7c5cfc;
    --accent-gray: #8a8a9a;
    --danger: #e74c3c;
    --success: #2ecc71;
    --radius: 12px;
    --radius-sm: 8px;
    --touch-min: 48px;
    --transition: 0.2s ease;
    --text-xs: clamp(0.7rem, 0.65rem + 0.25vw, 0.8rem);
    --text-sm: clamp(0.8rem, 0.75rem + 0.25vw, 0.9rem);
    --text-base: clamp(0.875rem, 0.825rem + 0.25vw, 1rem);
    --text-lg: clamp(1rem, 0.9rem + 0.5vw, 1.25rem);
    --text-xl: clamp(1.25rem, 1rem + 1.25vw, 1.75rem);
    --text-2xl: clamp(1.5rem, 1.25rem + 1.25vw, 2.25rem);
    --space-xs: clamp(4px, 0.2rem + 0.25vw, 8px);
    --space-sm: clamp(8px, 0.4rem + 0.5vw, 12px);
    --space-md: clamp(12px, 0.6rem + 0.75vw, 20px);
    --space-lg: clamp(16px, 0.8rem + 1vw, 28px);
    --text-warm: #f0d9b5;
    --text-celebrate: #ffd700;
    --surface-progress: rgba(78, 205, 196, 0.08);
    --surface-complete: rgba(46, 204, 113, 0.1);
  }
`;

export const resetStyles = css`
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
`;

export const baseStyles = css`
  :host {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: var(--text);
    line-height: 1.5;
    -webkit-tap-highlight-color: transparent;
  }
`;
