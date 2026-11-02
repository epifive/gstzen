/** Browser storage keys and the backup-file marker. */
export const STORAGE_KEY = "gst-invoice:v1";
export const THEME_KEY = "gst-invoice:theme";
export const EXPORT_KIND = "gst-invoice-backup";

/**
 * Key prefix used by the first 1.0.0 builds, before the product name changed.
 * Only read to carry existing browser data and backup files over to the new keys.
 */
const LEGACY_PREFIX = "gstzen";
export const LEGACY_STORAGE_KEY = `${LEGACY_PREFIX}:v1`;
export const LEGACY_THEME_KEY = `${LEGACY_PREFIX}:theme`;
export const LEGACY_EXPORT_KIND = `${LEGACY_PREFIX}-backup`;
