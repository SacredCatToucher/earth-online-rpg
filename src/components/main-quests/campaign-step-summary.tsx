"use client";

import { useState } from "react";
import { useLanguage } from "@/components/i18n/language-provider";
import { AddNextStepForm, type CreatedNextStep } from "@/components/main-quests/add-next-step-form";

export type CampaignStep = {
  id: string;
  title: string;
  startDate: string;
  status: string;
  locationId: string | null;
};

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "Asia/Taipei" }).format(new Date(value));
}

export function CampaignStepSummary({ questId, initialSteps }: { questId: string; initialSteps: CampaignStep[] }) {
  const { t } = useLanguage();
  const [steps, setSteps] = useState(initialSteps);
  const currentStep = steps.find((entry) => entry.status === "ONGOING") ?? null;
  const latestCompleted = steps.find((entry) => entry.status === "COMPLETED") ?? null;

  function addCreatedStep(step: CreatedNextStep) {
    setSteps((current) => [step, ...current.filter((entry) => entry.id !== step.id)]);
  }

  return (
    <>
      <div className="campaign-chapters">
        <span>{t("mainQuest.recentNotes")}</span>
        {steps.length ? (
          <ol>{steps.slice(0, 3).map((entry) => (
            <li key={entry.id}>
              <div>
                <strong>{entry.title}</strong>
                <small>{displayDate(entry.startDate)} - {entry.status === "ONGOING" ? t("phase.active") : t("phase.completed")}</small>
              </div>
              {entry.locationId ? <em>{t("worldMap.milestone")}</em> : null}
            </li>
          ))}</ol>
        ) : <p>{t("mainQuest.roadBegins")}</p>}
      </div>

      <section className="campaign-next-step" aria-label={t("mainQuest.addNextStep")}>
        <div className="next-step-context">
          {currentStep ? <p><span>{t("mainQuest.currentStep")}</span><strong>{currentStep.title}</strong></p> : null}
          {latestCompleted ? <p><span>{t("mainQuest.latestCompleted")}</span><strong>{latestCompleted.title}</strong></p> : null}
          {!steps.length ? <p>{t("mainQuest.noStepsYet")}</p> : !currentStep ? <p>{t("mainQuest.noActivePhase")}</p> : <p>{t("mainQuest.nextHint")}</p>}
        </div>
        <AddNextStepForm questId={questId} hasSteps={steps.length > 0} onCreated={addCreatedStep} />
      </section>
    </>
  );
}
