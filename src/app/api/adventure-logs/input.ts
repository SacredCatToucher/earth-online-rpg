export function journalFormInput(form: FormData) {
  return {
    title: String(form.get("title") ?? ""),
    description: String(form.get("description") ?? ""),
    startDate: String(form.get("startDate") ?? form.get("eventDate") ?? ""),
    endDate: String(form.get("endDate") ?? ""),
    status: String(form.get("status") ?? "ONGOING") as "ONGOING" | "COMPLETED",
    parentId: String(form.get("parentId") ?? ""),
    isMilestone: form.get("isMilestone") === "true",
  };
}
