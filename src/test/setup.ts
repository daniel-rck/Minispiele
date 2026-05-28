import '@testing-library/jest-dom/vitest';

// jsdom does not implement the canvas 2D API. Several canvas-based games
// (FlappyBird, Pong, Asteroids, …) call getContext('2d') inside their animation
// loop; without a stub jsdom throws "Not implemented: HTMLCanvasElement.getContext"
// on every frame, flooding test output. Provide a no-op 2D context so those
// components render quietly in tests.
if (typeof HTMLCanvasElement !== 'undefined') {
  const noop = () => undefined;
  const make2dContext = (canvas: HTMLCanvasElement): CanvasRenderingContext2D => {
    const base: Record<string, unknown> = {
      canvas,
      measureText: () => ({ width: 0 }),
      getImageData: () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 }),
      createLinearGradient: () => ({ addColorStop: noop }),
      createRadialGradient: () => ({ addColorStop: noop }),
      createPattern: () => null,
    };
    return new Proxy(base, {
      // Unknown methods (fillRect, beginPath, arc, fill, drawImage, …) become no-ops.
      get: (target, prop, receiver) =>
        prop in target ? Reflect.get(target, prop, receiver) : noop,
      // Accept property assignments (fillStyle, font, lineWidth, …).
      set: () => true,
    }) as unknown as CanvasRenderingContext2D;
  };

  HTMLCanvasElement.prototype.getContext = function getContext(
    this: HTMLCanvasElement,
    contextId: string,
  ) {
    return contextId === '2d' ? make2dContext(this) : null;
  } as unknown as typeof HTMLCanvasElement.prototype.getContext;
}
