import { Play, ShoppingCart, Trash2 } from "lucide-react";
import { type ReactNode, useState } from "react";
import { soundEvents } from "@/app/preferences";
import { routes } from "@/app/routes";
import { feedback, previewSound } from "@/feedback";
import { fr } from "@/i18n/fr";
import { useIconPack } from "@/icons/pack";
import { AddBar } from "@/ui/AddBar";
import { AisleSection } from "@/ui/AisleHeader";
import { Button } from "@/ui/button";
import { CatalogCard } from "@/ui/CatalogCard";
import { ItemRow } from "@/ui/ItemRow";
import { PageHeader } from "@/ui/Page";
import { palette, paletteColors } from "@/ui/palette";
import { ProductIcon } from "@/ui/ProductIcon";
import { Sheet } from "@/ui/Sheet";
import { Switch } from "@/ui/switch";
import {
  type MockAisle,
  mockAisles,
  mockCatalog,
  mockColors,
  mockShoppingAisle,
} from "./mockData";

const t = fr.devUi;

/** Une partie de la maquette, séparée de la précédente par un filet et de l'air. */
function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-12 border-t-4 border-surface pt-8 first-of-type:mt-6 first-of-type:border-t-0 first-of-type:pt-2">
      <h2 className="px-5 pb-4 text-xs font-bold tracking-widest text-muted-foreground uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Aisle({ aisle, large }: { aisle: MockAisle; large?: boolean }) {
  const [expanded, setExpanded] = useState(true);
  const [checked, setChecked] = useState(
    () => new Set(aisle.items.filter((i) => i.checked).map((i) => i.label)),
  );
  // En mode courses, les lignes cochées glissent en bas du rayon.
  const items = large
    ? [...aisle.items].sort(
        (a, b) => Number(checked.has(a.label)) - Number(checked.has(b.label)),
      )
    : aisle.items;
  const remaining = aisle.items.filter((i) => !checked.has(i.label)).length;

  return (
    <AisleSection
      label={aisle.label}
      icon={aisle.icon}
      color={aisle.color}
      count={large ? remaining : aisle.items.length}
      expanded={expanded}
      done={large && remaining === 0}
      outlined={!large}
      onToggle={() => setExpanded((value) => !value)}
    >
      {items.map((item) => (
        <ItemRow
          key={item.label}
          label={item.label}
          icon={item.icon}
          color={aisle.color}
          details={item.details}
          quantity={item.quantity}
          shopping={large}
          checked={large && checked.has(item.label)}
          onClick={() => {
            if (!large) return;
            const next = new Set(checked);
            if (next.has(item.label)) next.delete(item.label);
            else {
              next.add(item.label);
              feedback.check();
            }
            setChecked(next);
          }}
        />
      ))}
    </AisleSection>
  );
}

/**
 * Maquette des composants (docs/09, phase 2) : à ouvrir sur l'iPhone pour valider
 * couleurs, tailles, icônes et sons avant de construire les fonctionnalités.
 */
export function UiPage() {
  const pack = useIconPack();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toggle, setToggle] = useState(true);
  const [lastAdded, setLastAdded] = useState<string>();

  return (
    <>
      <PageHeader title={t.title} backTo={routes.about} />
      <p className="px-5 text-sm text-muted-foreground">{t.intro}</p>

      <Block title={t.colors}>
        <div className="grid grid-cols-2 gap-2 px-4">
          {mockColors.map((color) => (
            <div
              key={color.token}
              className="flex items-center gap-2 rounded-xl bg-surface p-2"
            >
              <span
                className={`size-8 shrink-0 rounded-lg border border-border ${color.className}`}
              />
              <span className="min-w-0 text-xs">
                <span className="block font-bold">{color.label}</span>
                <span className="text-muted-foreground">{color.token}</span>
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 px-4">
          {paletteColors.map((color) => (
            <span
              key={color}
              className={`rounded-full px-3 py-1 text-xs font-bold ${palette[color].soft} ${palette[color].text}`}
            >
              {color}
            </span>
          ))}
        </div>
      </Block>

      <Block title={t.typography}>
        <div className="space-y-1 px-5">
          <p className="text-2xl font-extrabold tracking-tight text-primary">
            {t.typeTitle}
          </p>
          <p className="text-[17px] font-semibold">{t.typeBody}</p>
          <p className="text-sm text-muted-foreground">{t.typeMuted}</p>
          <p className="font-bold text-secondary tabular-nums">1,2 kg · × 6</p>
        </div>
      </Block>

      <Block title={t.buttons}>
        <div className="flex flex-wrap items-center gap-2 px-4">
          <Button>
            <ShoppingCart />
            {t.letsGo}
          </Button>
          <Button variant="outline">{t.outline}</Button>
          <Button variant="destructive">
            <Trash2 />
            {t.delete}
          </Button>
          <Button variant="icon" size="icon" aria-label={t.listen}>
            <Play />
          </Button>
          <Switch
            checked={toggle}
            onCheckedChange={setToggle}
            aria-label={t.toggle}
          />
        </div>
      </Block>

      <Block title={t.list}>
        <div className="space-y-4 px-3">
          {mockAisles.map((aisle) => (
            <Aisle key={aisle.label} aisle={aisle} />
          ))}
        </div>
        <div className="flex justify-center pt-5">
          <Button size="lg">
            <ShoppingCart />
            {t.letsGo}
          </Button>
        </div>
      </Block>

      <Block title={t.shopping}>
        <p className="px-5 pb-2 text-sm text-muted-foreground">
          {t.shoppingHint}
        </p>
        <div className="px-3">
          <Aisle aisle={mockShoppingAisle} large />
        </div>
      </Block>

      <Block title={t.catalog}>
        <div className="grid grid-cols-3 gap-2 px-3">
          {mockCatalog.map((card) => (
            <CatalogCard key={card.label} {...card} />
          ))}
        </div>
      </Block>

      <Block title={t.sheet}>
        <div className="px-4">
          <Button variant="outline" onClick={() => setSheetOpen(true)}>
            {t.openSheet}
          </Button>
        </div>
        <Sheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          title={t.sheetTitle}
          description={t.sheetText}
        >
          <div className="flex flex-col gap-2">
            <Button
              size="lg"
              onClick={() => {
                feedback.add();
                setSheetOpen(false);
              }}
            >
              {t.sheetAdd}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setSheetOpen(false)}
            >
              {t.sheetNothing}
            </Button>
          </div>
        </Sheet>
      </Block>

      <Block title={t.sounds}>
        <p className="px-5 pb-3 text-sm text-muted-foreground">
          {t.soundsHint}
        </p>
        <div className="space-y-2 px-3">
          {soundEvents.map((name) => (
            <div
              key={name}
              className="flex items-center gap-2 rounded-2xl bg-surface p-3"
            >
              <p className="min-w-0 flex-1 font-semibold">
                {fr.soundsPage.events[name]}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => previewSound(name, "recorded")}
              >
                <Play />
                {t.soundRecorded}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => previewSound(name, "generated")}
              >
                <Play />
                {t.soundGenerated}
              </Button>
            </div>
          ))}
        </div>
      </Block>

      <Block title={t.icons(pack ? Object.keys(pack).length : 0)}>
        <p className="px-5 pb-3 text-sm text-muted-foreground">{t.iconsHint}</p>
        <div className="grid grid-cols-5 gap-x-1 gap-y-3 px-3">
          {pack &&
            Object.entries(pack).map(([name, icon]) => (
              <div
                key={name}
                className="flex flex-col items-center gap-1 text-center"
              >
                <ProductIcon icon={name} label={icon.l} size={40} />
                <span className="line-clamp-2 text-[10px] leading-tight text-muted-foreground">
                  {icon.l}
                </span>
              </div>
            ))}
        </div>
      </Block>

      {/* Barre d'ajout flottante, comme sur l'écran Liste. */}
      <div className="sticky bottom-0 mt-6 bg-gradient-to-t from-bg via-bg/90 to-transparent px-3 pt-6 pb-3">
        {lastAdded && (
          <p role="status" className="pb-2 text-center text-sm text-success">
            {t.added(lastAdded)}
          </p>
        )}
        <AddBar
          placeholder={t.addPlaceholder}
          addLabel={t.add}
          onSubmit={(text) => {
            feedback.add();
            setLastAdded(text);
          }}
        />
      </div>
    </>
  );
}
