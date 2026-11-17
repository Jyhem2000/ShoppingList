import { useState } from "react";
import { fr } from "@/i18n/fr";
import { Button } from "@/ui/button";
import { TextArea } from "@/ui/form";

/**
 * Coller à la main un message reçu (docs/03 F2, E3), quand le presse-papiers n'a pas
 * pu être lu : un champ, puis « Continuer ».
 */
export function PasteForm({
  label,
  placeholder,
  onPaste,
}: {
  label: string;
  placeholder: string;
  onPaste: (text: string) => void;
}) {
  const [pasted, setPasted] = useState("");
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (pasted.trim()) onPaste(pasted);
      }}
    >
      <TextArea
        value={pasted}
        autoFocus
        aria-label={label}
        placeholder={placeholder}
        className="font-sans"
        onChange={(event) => {
          setPasted(event.target.value);
        }}
      />
      <Button type="submit" disabled={!pasted.trim()}>
        {fr.share.pasteContinue}
      </Button>
    </form>
  );
}
