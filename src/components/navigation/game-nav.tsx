import Link from "next/link";

const items = [
  { label: "World Map", href: "/", enabled: true, key: "map" },
  { label: "Adventure Log", href: "/adventure-log", enabled: true, key: "journal" },
  { label: "Main Quests", href: "/main-quests", enabled: true, key: "quests" },
  { label: "Daily Quests", href: "#", enabled: false, key: "daily" },
  { label: "Skills", href: "#", enabled: false, key: "skills" },
  { label: "Achievements", href: "#", enabled: false, key: "achievements" },
];

export function GameNav({ active }: { active: "map" | "journal" | "quests" }) {
  return (
    <nav className="rpg-nav" aria-label="Main menu">
      {items.map((item) =>
        item.enabled ? (
          <Link key={item.label} className={active === item.key ? "active" : ""} href={item.href} aria-current={active === item.key ? "page" : undefined}>
            {item.label}
          </Link>
        ) : (
          <span className="nav-disabled" key={item.label}>{item.label}<small>soon</small></span>
        ),
      )}
    </nav>
  );
}
