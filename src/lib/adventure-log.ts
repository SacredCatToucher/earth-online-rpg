import { ADVENTURE_EVENT_TYPES } from "@/lib/constants";

export type AdventureEventType = (typeof ADVENTURE_EVENT_TYPES)[number];

export const EVENT_PRESENTATION: Record<AdventureEventType, { label: string; sigil: string; tone: string }> = {
  QUEST_COMPLETED: { label: "Quest Completed", sigil: "Q", tone: "gold" },
  ACHIEVEMENT_EARNED: { label: "Achievement Earned", sigil: "A", tone: "violet" },
  REWARD_UNLOCKED: { label: "Reward Unlocked", sigil: "R", tone: "rose" },
  LEVEL_UP: { label: "Level Up", sigil: "L", tone: "blue" },
  LOCATION_CREATED: { label: "Location Created", sigil: "M", tone: "green" },
  SKILL_MILESTONE: { label: "Skill Milestone", sigil: "S", tone: "cyan" },
  MANUAL_JOURNAL_ENTRY: { label: "Journal Entry", sigil: "J", tone: "parchment" },
};

export function isAdventureEventType(value: string): value is AdventureEventType {
  return (ADVENTURE_EVENT_TYPES as readonly string[]).includes(value);
}
