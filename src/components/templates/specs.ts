/**
 * A template is a set of design tokens consumed by <DocView>. Adding a template = adding a spec.
 */
export interface TemplateSpec {
  id: string;
  name: string;
  pro?: boolean;
  description: string;
  /** Header layout */
  header: "split" | "band" | "centered" | "stacked";
  font: "sans" | "serif" | "mono";
  /** Item table style */
  table: "grid" | "lines" | "zebra" | "accent-head";
  /** Title treatment */
  title: "caps" | "large" | "pill";
  /** Rounded boxes */
  rounded: boolean;
  /** Use the accent as a coloured top rule */
  topRule: boolean;
}

export const FREE_TEMPLATES: TemplateSpec[] = [
  {
    id: "classic",
    name: "Classic",
    description: "Bordered GST layout that accountants expect",
    header: "split",
    font: "sans",
    table: "grid",
    title: "caps",
    rounded: false,
    topRule: true,
  },
  {
    id: "modern",
    name: "Modern",
    description: "Coloured header band and soft cards",
    header: "band",
    font: "sans",
    table: "zebra",
    title: "large",
    rounded: true,
    topRule: false,
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Quiet, airy and typographic",
    header: "stacked",
    font: "sans",
    table: "lines",
    title: "large",
    rounded: false,
    topRule: false,
  },
];

export const TEMPLATES: TemplateSpec[] = [...FREE_TEMPLATES];

export function getTemplate(id: string): TemplateSpec {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
