/**
 * Version de l'app. Source unique : `version` de package.json, injectée au build
 * avec l'empreinte du commit, la date et le canal de déploiement (docs/07 § 9).
 */
export type Channel = "production" | "main" | "preview" | "dev";

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
 * Libellé affiché : « 1.2.0 » en production, « 1.2.0-dev · a1b2c3d · main » ailleurs.
 */
export function formatVersion(info: Pick<BuildInfo, "version" | "commit" | "channel">): string {
  if (info.channel === "production") return info.version;
  return `${info.version}-dev · ${info.commit} · ${info.channel}`;
}
