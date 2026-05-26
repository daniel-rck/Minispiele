declare const __APP_GIT_SHA__: string;
declare const __APP_BUILD_DATE__: string;

export const APP_GIT_SHA: string = __APP_GIT_SHA__;
export const APP_BUILD_DATE: string = __APP_BUILD_DATE__;

export function formatBuildDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}
