import { expect } from 'vitest';
import axe, { type AxeResults, type RunOptions, type Spec } from 'axe-core';

const DEFAULT_RULES: Spec['rules'] = [
  { id: 'color-contrast', enabled: false },
  { id: 'region', enabled: false },
];

let configured = false;
function ensureConfigured(): void {
  if (configured) return;
  axe.configure({ rules: DEFAULT_RULES });
  configured = true;
}

export async function expectNoA11yViolations(
  container: Element,
  options?: RunOptions,
): Promise<void> {
  ensureConfigured();
  const results: AxeResults = await axe.run(container, {
    resultTypes: ['violations'],
    ...options,
  });
  if (results.violations.length === 0) return;

  const summary = results.violations
    .map((v) => `- ${v.id}: ${v.help} (${v.nodes.length} node(s))`)
    .join('\n');
  expect.fail(`axe-core found ${results.violations.length} violation(s):\n${summary}`);
}
