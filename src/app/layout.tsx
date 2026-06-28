import type { Metadata } from "next";
import { LanguageProvider } from "@/components/i18n/language-provider";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { LocalProfileGate } from "@/components/profiles/local-profile-gate";
import "./globals.css";

export const metadata: Metadata = {
  title: "Earth Online RPG",
  description: "Turn a life well lived into an adventure worth remembering.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <LanguageSwitcher />
          <LocalProfileGate />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
