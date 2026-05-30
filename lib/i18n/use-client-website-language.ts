"use client";

import { useSyncExternalStore } from "react";
import {
  DEFAULT_WEBSITE_LANGUAGE,
  resolveClientWebsiteLanguage,
  type WebsiteLanguage,
} from "@/lib/i18n/core";

/**
 * Hydration-safe website language for client components.
 *
 * The server has no `window`, so it always renders with
 * `DEFAULT_WEBSITE_LANGUAGE` ("en"). If a client component read the stored /
 * browser language during its first render, that render would disagree with the
 * server markup and React would throw a hydration mismatch.
 *
 * `useSyncExternalStore` is the React-recommended way to read client-only state:
 * it returns the server snapshot (`DEFAULT_WEBSITE_LANGUAGE`) for SSR and the
 * first hydration render, then switches to the real client snapshot — without a
 * setState-in-effect cascade.
 */
function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  // Pick up language changes made in another tab (Settings / Login toggle).
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getClientSnapshot(): WebsiteLanguage {
  return resolveClientWebsiteLanguage();
}

function getServerSnapshot(): WebsiteLanguage {
  return DEFAULT_WEBSITE_LANGUAGE;
}

export function useClientWebsiteLanguage(): WebsiteLanguage {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
