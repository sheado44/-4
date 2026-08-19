export type WidgetId =
  | "desk"
  | "alerts"
  | "scores"
  | "trending"
  | "watch"
  | "find"
  | "moshpit"
  | "rules";

export const WIDGET_CATALOG: { id: WidgetId; label: string; defaultOn: boolean }[] = [
  { id: "desk", label: "Your desk", defaultOn: true },
  { id: "alerts", label: "Event log", defaultOn: true },
  { id: "scores", label: "Scores & standings", defaultOn: true },
  { id: "trending", label: "Trending IRL", defaultOn: true },
  { id: "watch", label: "Watchlist", defaultOn: true },
  { id: "find", label: "Find", defaultOn: true },
  { id: "moshpit", label: "theMoshpit", defaultOn: false },
  { id: "rules", label: "House rules", defaultOn: false },
];

export const DEFAULT_WIDGETS = WIDGET_CATALOG.map((w) => w.id);

export function defaultWidgetOn(): Record<WidgetId, boolean> {
  return Object.fromEntries(WIDGET_CATALOG.map((w) => [w.id, w.defaultOn])) as Record<
    WidgetId,
    boolean
  >;
}

export function loadWidgetLayout(): {
  order: WidgetId[];
  on: Record<WidgetId, boolean>;
} {
  const on = defaultWidgetOn();
  let order = [...DEFAULT_WIDGETS];
  try {
    const raw = localStorage.getItem("ballpit-widget-order");
    if (raw) {
      const parsed = JSON.parse(raw) as WidgetId[];
      order = parsed.filter((id) => DEFAULT_WIDGETS.includes(id));
      DEFAULT_WIDGETS.forEach((id) => {
        if (!order.includes(id)) order.push(id);
      });
    }
    const onRaw = localStorage.getItem("ballpit-widget-on");
    if (onRaw) {
      const parsed = JSON.parse(onRaw) as Record<string, boolean>;
      WIDGET_CATALOG.forEach((w) => {
        if (typeof parsed[w.id] === "boolean") on[w.id] = parsed[w.id];
      });
    }
  } catch {
    /* defaults */
  }
  return { order, on };
}

export function saveWidgetLayout(order: WidgetId[], on: Record<WidgetId, boolean>) {
  localStorage.setItem("ballpit-widget-order", JSON.stringify(order));
  localStorage.setItem("ballpit-widget-on", JSON.stringify(on));
  window.dispatchEvent(new Event("ballpit-layout-updated"));
}
