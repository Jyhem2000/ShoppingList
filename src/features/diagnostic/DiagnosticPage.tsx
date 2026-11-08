import { Check, X } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { checkForUpdate, hasRegistration } from "@/app/pwa/serviceWorker";
import { routes } from "@/app/routes";
import { iosHapticTick, isVibrationSupported, patterns, vibrate } from "@/feedback/haptics";
import { isAudioSupported, type SoundName, sounds } from "@/feedback/sounds";
import { fr } from "@/i18n/fr";
import {
  canPromptInstall,
  currentInstallEnvironment,
  subscribeInstallPrompt,
} from "@/platform/install";
import {
  isWakeLockSupported,
  keepScreenOn,
  type WakeLockHandle,
  type WakeLockState,
} from "@/platform/wakeLock";
import { Button } from "@/ui/button";
import { PageHeader, Row, Section } from "@/ui/Page";
import { Switch } from "@/ui/switch";
import { buildInfo, formatVersion } from "@/version";

const t = fr.diagnostic;

function Flag({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="flex items-center gap-1 font-semibold text-done">
      <Check className="size-4" aria-hidden />
      {t.yes}
    </span>
  ) : (
    <span className="flex items-center gap-1 font-semibold text-muted-foreground">
      <X className="size-4" aria-hidden />
      {t.no}
    </span>
  );
}

function ButtonGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-2 p-3">{children}</div>;
}

function useOnline(): boolean {
  return useSyncExternalStore(
    (listener) => {
      window.addEventListener("online", listener);
      window.addEventListener("offline", listener);
      return () => {
        window.removeEventListener("online", listener);
        window.removeEventListener("offline", listener);
      };
    },
    () => navigator.onLine,
  );
}

/**
 * Écran de vérification technique de la phase 1 (docs/09) : installation, hors ligne,
 * écran allumé, sons, vibrations, mises à jour, fonctionnalités disponibles.
 */
export function DiagnosticPage() {
  const online = useOnline();
  const canPrompt = useSyncExternalStore(subscribeInstallPrompt, canPromptInstall);
  const [standalone] = useState(() => currentInstallEnvironment().standalone);
  const [swActive, setSwActive] = useState(false);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [wakeState, setWakeState] = useState<WakeLockState>(
    isWakeLockSupported() ? "released" : "unsupported",
  );
  const [wakeError, setWakeError] = useState<string>();
  const wakeHandle = useRef<WakeLockHandle | null>(null);
  const [updateStatus, setUpdateStatus] = useState<string>();

  useEffect(() => {
    setSwActive(Boolean(navigator.serviceWorker?.controller));
    void navigator.storage?.persisted?.().then(setPersisted);
    return () => {
      void wakeHandle.current?.release();
    };
  }, []);

  const toggleWakeLock = async (on: boolean) => {
    if (on) {
      wakeHandle.current = await keepScreenOn((state, error) => {
        setWakeState(state);
        setWakeError(error);
      });
    } else {
      await wakeHandle.current?.release();
      wakeHandle.current = null;
    }
  };

  const requestPersist = async () => {
    const granted = (await navigator.storage?.persist?.()) ?? false;
    setPersisted(granted);
  };

  const runUpdateCheck = async () => {
    if (!hasRegistration()) {
      setUpdateStatus(t.updates.unavailable);
      return;
    }
    setUpdateStatus(t.updates.checking);
    await checkForUpdate();
    const waiting = (await navigator.serviceWorker.getRegistration())?.waiting;
    setUpdateStatus(waiting ? t.updates.available : t.updates.upToDate);
  };

  const wakeLabel =
    wakeState === "active"
      ? t.wakeLock.active
      : wakeState === "unsupported"
        ? t.wakeLock.unsupported
        : wakeState === "error"
          ? t.wakeLock.error(wakeError ?? "")
          : t.wakeLock.released;

  const soundButtons: { name: SoundName; label: string }[] = [
    { name: "add", label: t.sounds.add },
    { name: "check", label: t.sounds.check },
    { name: "aisleDone", label: t.sounds.aisleDone },
    { name: "done", label: t.sounds.done },
    { name: "remove", label: t.sounds.remove },
    { name: "error", label: t.sounds.error },
  ];

  const features: { label: string; ok: boolean }[] = [
    { label: t.features.vibrate, ok: isVibrationSupported() },
    { label: t.features.wakeLock, ok: isWakeLockSupported() },
    { label: t.features.share, ok: typeof navigator.share === "function" },
    {
      label: t.features.shareFiles,
      ok:
        typeof navigator.canShare === "function" &&
        navigator.canShare({
          files: [new File(["{}"], "test.json", { type: "application/json" })],
        }),
    },
    { label: t.features.clipboard, ok: Boolean(navigator.clipboard?.readText) },
    { label: t.features.persist, ok: typeof navigator.storage?.persist === "function" },
    { label: t.features.installPrompt, ok: canPrompt },
    { label: t.features.barcode, ok: "BarcodeDetector" in window },
    { label: t.features.audio, ok: isAudioSupported() },
  ];

  return (
    <>
      <PageHeader title={t.title} backTo={routes.settings} />
      <p className="px-5 text-sm text-muted-foreground">{t.intro}</p>

      <Section title={t.install.title}>
        <Row label={t.install.standalone}>
          <Flag ok={standalone} />
        </Row>
        <Row label={t.install.serviceWorker}>
          <Flag ok={swActive} />
        </Row>
        <Row label={t.install.online}>
          <Flag ok={online} />
        </Row>
        <Row label={t.install.persisted}>
          {persisted ? (
            <Flag ok />
          ) : (
            <Button size="sm" variant="secondary" onClick={() => void requestPersist()}>
              {t.install.requestPersist}
            </Button>
          )}
        </Row>
        <Row label={t.install.version}>
          <span className="text-right text-sm font-semibold text-gold">
            {formatVersion(buildInfo)}
          </span>
        </Row>
      </Section>

      <Section title={t.wakeLock.title}>
        <Row label={t.wakeLock.label} hint={wakeLabel}>
          <Switch
            checked={wakeState === "active"}
            disabled={wakeState === "unsupported"}
            onCheckedChange={(on) => void toggleWakeLock(on)}
            aria-label={t.wakeLock.label}
          />
        </Row>
      </Section>

      <Section title={t.sounds.title}>
        <ButtonGrid>
          {soundButtons.map(({ name, label }) => (
            <Button key={name} variant="secondary" onClick={() => sounds[name]()}>
              {label}
            </Button>
          ))}
        </ButtonGrid>
      </Section>

      <Section title={t.haptics.title}>
        <Row label={t.haptics.support}>
          <Flag ok={isVibrationSupported()} />
        </Row>
        <ButtonGrid>
          <Button variant="secondary" onClick={() => vibrate(patterns.check)}>
            {t.haptics.short}
          </Button>
          <Button variant="secondary" onClick={() => vibrate(patterns.aisleDone)}>
            {t.haptics.aisle}
          </Button>
          <Button variant="secondary" onClick={() => vibrate(patterns.done)}>
            {t.haptics.long}
          </Button>
        </ButtonGrid>
        <Row label={t.haptics.iosTitle} hint={t.haptics.iosHint}>
          <Button size="sm" variant="secondary" onClick={iosHapticTick}>
            {t.haptics.iosTry}
          </Button>
        </Row>
      </Section>

      <Section title={t.updates.title}>
        <Row label={t.updates.check} hint={updateStatus}>
          <Button size="sm" variant="secondary" onClick={() => void runUpdateCheck()}>
            {t.updates.check}
          </Button>
        </Row>
      </Section>

      <Section title={t.features.title} className="pb-6">
        {features.map(({ label, ok }) => (
          <Row key={label} label={label}>
            <Flag ok={ok} />
          </Row>
        ))}
      </Section>
    </>
  );
}
