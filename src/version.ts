import { fr } from "@/i18n/fr";

/**
 * Version de l'app. Source unique : `version` de package.json, injectée au build
 * avec l'empreinte du commit, la date et le canal de déploiement (docs/07 § 9).
 */
export type Channel = "production" | "preprod" | "preview" | "dev";

export interface BuildInfo {
  version: string;
  commit: string;
  channel: string;
  buildDate: string;
}

export const buildInfo: BuildInfo = {
  version: __APP_VERSION__,
  commit: __APP_COMMIT__,
  channel: __APP_CHANNEL__,
  buildDate: __APP_BUILD_DATE__,
};

/**
 * Libellé affiché : « 1.2.0 » en production,
 * « 1.2.0 · préproduction · a1b2c3d » ailleurs (canal et commit pour s'y retrouver).
 */
export function formatVersion(
  info: Pick<BuildInfo, "version" | "commit" | "channel">,
): string {
  if (info.channel === "production") return info.version;
  const channel = fr.about.channels[info.channel] ?? info.channel;
  return `${info.version} · ${channel} · ${info.commit}`;
}
