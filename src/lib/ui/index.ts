// Minispiele takes AppHeader, InstallButton, OfflineIndicator and the
// primitives from web-base; it composes its own shell (AppShellRoute) and keeps
// the theme in its settings blob, so AppShell, AppNav, PageHeader, ThemeToggle
// and useTheme are not part of it (see CLAUDE.md).
export type { AppHeaderProps } from "./AppHeader.tsx";
export { AppHeader } from "./AppHeader.tsx";
export { InstallButton } from "./InstallButton.tsx";
export { OfflineIndicator } from "./OfflineIndicator.tsx";
export * from "./primitives.tsx";
export type { UseInstallPromptResult } from "./useInstallPrompt.ts";
export { useInstallPrompt } from "./useInstallPrompt.ts";
export { useOnlineStatus } from "./useOnlineStatus.ts";
