export type OnboardingIndustry = {
  id: string;
  label: string;
  description: string;
  status: "available" | "coming-soon";
  helper: string;
};

export const onboardingIndustries: OnboardingIndustry[] = [
  {
    id: "auto-detailing",
    label: "Auto detailing",
    description: "Launch from the live SideKick template library for detailing offers, coatings, correction, and maintenance.",
    status: "available",
    helper: "Available now",
  },
  {
    id: "home-services",
    label: "Home services",
    description: "Service-business campaign libraries are on the roadmap, but not live inside the app yet.",
    status: "coming-soon",
    helper: "Coming soon",
  },
  {
    id: "beauty-wellness",
    label: "Beauty and wellness",
    description: "Future template libraries will support consultation-driven offers and follow-up flows.",
    status: "coming-soon",
    helper: "Coming soon",
  },
];

export function getIndustryLabel(industryId: string | null | undefined) {
  return onboardingIndustries.find((industry) => industry.id === industryId)?.label || "Your industry";
}
