/// <reference lib="webworker" />
import { registerAppShell } from "./base.ts";

// Precache, offline navigation and prompt-based updates (owned: base.ts). A new
// version waits until the page posts SKIP_WAITING — UpdateBanner's „Neu laden"
// or the settings sheet, both through usePwaUpdate.
registerAppShell();

// Minispiele has no service-worker handlers of its own (no push, no runtime
// caching: everything it needs is in the precache).
