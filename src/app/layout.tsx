import type { Metadata } from "next";
import { LanguageProvider } from "@/components/i18n/language-provider";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { LocalProfileGate } from "@/components/profiles/local-profile-gate";
import { db } from "@/lib/db";
import { ensureFirstLaunchDefaults } from "@/server/services/bootstrap";
import "./globals.css";

export const metadata: Metadata = {
  title: "Earth Online RPG",
  description: "Turn a life well lived into an adventure worth remembering.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await ensureFirstLaunchDefaults();
  const profiles = await db.profile.findMany({ orderBy: [{ createdAt: "asc" }, { name: "asc" }] });

  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <LanguageSwitcher />
          <LocalProfileGate initialProfiles={profiles.map((profile) => ({
            id: profile.id,
            name: profile.name,
            isDefault: profile.isDefault,
          }))} />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
