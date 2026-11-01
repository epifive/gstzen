export interface NavItem {
  href: string;
  label: string;
}

/** App navigation. Pro adds Clients, Products, Recurring and Reports here. */
export const APP_NAV: NavItem[] = [
  { href: "/app/", label: "Documents" },
  { href: "/app/settings/", label: "Settings" },
];
