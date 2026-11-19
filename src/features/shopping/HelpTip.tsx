import { usePreferences } from "@/app/preferences";
import { dismissTip, type TipId } from "@/app/tips";
import { Tip } from "@/ui/Tip";

/**
 * Bulle d'aide de l'app (docs/03 H12) : montrée tant qu'elle n'a pas été vue, puis
 * plus jamais (Réglages → « Revoir les conseils » la fait revenir).
 */
export function HelpTip({
  id,
  show = true,
  ...props
}: {
  id: TipId;
  text: string;
  target?: string;
  show?: boolean;
}) {
  const { seenTips } = usePreferences();
  return (
    <Tip
      {...props}
      show={show && !seenTips.includes(id)}
      onDismiss={() => {
        dismissTip(id);
      }}
    />
  );
}
