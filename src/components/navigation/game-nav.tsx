import Link from "next/link";
import { T } from "@/components/i18n/language-provider";
import type { TranslationKey } from "@/lib/i18n";

const items = [
  { labelKey: "nav.worldMap", href: "/", enabled: true, key: "map" },
  { labelKey: "nav.adventureLog", href: "/adventure-log", enabled: true, key: "journal" },
  { labelKey: "nav.mainQuests", href: "/main-quests", enabled: true, key: "quests" },
  { labelKey: "nav.dailyQuests", href: "/daily-quests", enabled: true, key: "daily" },
  { labelKey: "nav.skills", href: "#", enabled: false, key: "skills" },
  { labelKey: "nav.achievements", href: "#", enabled: false, key: "achievements" },
] satisfies { labelKey: TranslationKey; href: string; enabled: boolean; key: string }[];

function label(key: TranslationKey) {
  return <T k={key} />;
}

function soon() {
  return <T k="common.soon" />;
}

export function GameNav({ active }: { active: "map" | "journal" | "quests" | "daily" }) {
  return (
    <nav className="rpg-nav" aria-label="Main menu">
      {items.map((item) =>
        item.enabled ? (
          <Link key={item.key} className={active === item.key ? "active" : ""} href={item.href} aria-current={active === item.key ? "page" : undefined}>
            {label(item.labelKey)}
          </Link>
        ) : (
          <span className="nav-disabled" key={item.key}>{label(item.labelKey)}<small>{soon()}</small></span>
        ),
      )}
    </nav>
  );
}
