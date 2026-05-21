interface AudioWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

/** Returns the platform AudioContext constructor, including Safari's prefixed variant, or `null`. */
export function getAudioCtor(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null;
  const w = window as AudioWindow;
  return window.AudioContext ?? w.webkitAudioContext ?? null;
}
