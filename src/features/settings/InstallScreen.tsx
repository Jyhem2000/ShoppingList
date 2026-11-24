import { Download, Share, TriangleAlert } from "lucide-react";
import { useSyncExternalStore } from "react";
import { texts } from "@/i18n";
import { PageTitle } from "@/ui/Page";
import {
  canPromptInstall,
  type InstallContext,
  promptInstall,
  subscribeInstallPrompt,
} from "@/platform/install";
import { Button } from "@/ui/button";

function Steps({ steps }: { steps: readonly string[] }) {
  return (
    <ol className="space-y-3">
      {steps.map((step, index) => (
        <li key={step} className="flex items-start gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 font-bold text-primary">
            {index + 1}
          </span>
          <span className="pt-1">{step}</span>
        </li>
      ))}
    </ol>
  );
}

/** Premier lancement dans le navigateur : explique comment installer l'app (docs/04 § 2.11). */
export function InstallScreen({
  context,
  onContinue,
}: {
  context: Exclude<InstallContext, { kind: "installed" }>;
  onContinue: () => void;
}) {
  const canPrompt = useSyncExternalStore(
    subscribeInstallPrompt,
    canPromptInstall,
    () => false,
  );

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-6 pt-8 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
        <img
          src="/logo.svg"
          alt=""
          className="mx-auto mb-6 size-20 rounded-3xl"
        />
        <PageTitle className="mb-3 text-3xl">{texts.install.title}</PageTitle>
        <p className="mb-6 text-muted-foreground">{texts.install.intro}</p>

        <div className="flex-1 space-y-6">
          {context.kind === "ios" && (
            <>
              <div className="rounded-2xl bg-surface p-4">
                <div className="mb-4 flex items-center gap-2 font-bold text-primary">
                  <Share className="size-5" aria-hidden />
                  iPhone
                </div>
                <Steps
                  steps={
                    context.browser === "safari"
                      ? texts.install.iosSafariSteps
                      : texts.install.iosChromeSteps
                  }
                />
              </div>
              <p className="flex items-start gap-2 text-sm text-warning">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                {texts.install.iosWarning}
              </p>
            </>
          )}

          {context.kind === "android" && (
            <div className="space-y-3 rounded-2xl bg-surface p-4">
              <Button
                variant="default"
                size="lg"
                className="w-full"
                disabled={!canPrompt}
                onClick={() => void promptInstall()}
              >
                <Download aria-hidden />
                {texts.install.androidButton}
              </Button>
              <p className="text-sm text-muted-foreground">
                {texts.install.androidManual}
              </p>
            </div>
          )}

          {context.kind === "other" && (
            <p className="text-muted-foreground">{texts.install.otherText}</p>
          )}
        </div>

        <Button variant="outline" className="mt-8" onClick={onContinue}>
          {texts.install.continue}
        </Button>
      </div>
    </div>
  );
}
