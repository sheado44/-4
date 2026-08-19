export type WidgetId =
  | "desk"
  | "alerts"
  | "trending"
  | "watch"
  | "find"
  | "moshpit"
  | "rules"
  | "fantasy";

export const WIDGET_CATALOG: { id: WidgetId; label: string }[] = [
  { id: "desk", label: "Your desk" },
  { id: "alerts", label: "Event log" },
  { id: "trending", label: "Trending IRL" },
  { id: "watch", label: "Watchlist" },
  { id: "find", label: "Find" },
  { id: "moshpit", label: "theMoshpit" },
  { id: "rules", label: "House rules" },
  { id: "fantasy", label: "fantasiDesk" },
];

export const DEFAULT_WIDGETS = WIDGET_CATALOG.map((w) => w.id);

const ORDER_KEY = "ballpit-widget-order";
const ON_KEY = "ballpit-widget-on";

export function loadWidgetLayout() {
  let order = DEFAULT_WIDGETS.slice();
  const on = Object.fromEntries(DEFAULT_WIDGETS.map((id) => [id, true])) as Record<
    WidgetId,
    boolean
  >;

  try {
    const rawOrder = localStorage.getItem(ORDER_KEY);
    if (rawOrder) {
      const parsed = JSON.parse(rawOrder) as string[];
      const known = parsed.filter((id): id is WidgetId =>
        DEFAULT_WIDGETS.includes(id as WidgetId)
      );
      const missing = DEFAULT_WIDGETS.filter((id) => !known.includes(id));
      order = [...known, ...missing];
    }

    const rawOn = localStorage.getItem(ON_KEY);
    if (rawOn) {
      const parsed = JSON.parse(rawOn) as Record<string, boolean>;
      DEFAULT_WIDGETS.forEach((id) => {
        if (typeof parsed[id] === "boolean") on[id] = parsed[id];
      });
    }
  } catch {
    // keep defaults
  }

  return { order, on };
}

export function saveWidgetLayout(order: WidgetId[], on: Record<WidgetId, boolean>) {
  try {
    localStorage.setItem(ORDER_KEY, JSON.stringify(order));
    localStorage.setItem(ON_KEY, JSON.stringify(on));
    window.dispatchEvent(new Event("ballpit-layout-updated"));
  } catch {
    // ignore
  }
}
