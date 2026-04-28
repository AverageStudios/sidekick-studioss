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
    label: "Car Detailing",
    description: "Launch from the live SideKick template library for detailing offers, coatings, correction, and maintenance.",
    status: "available",
    helper: "Available now",
  },
  {
    id: "chiropractic",
    label: "Chiropractic",
    description: "Templates for local health and appointment-driven offers.",
    status: "available",
    helper: "Available now",
  },
  {
    id: "physical-therapy",
    label: "Physical Therapy",
    description: "Templates for evaluation, treatment, and recovery-focused offers.",
    status: "available",
    helper: "Available now",
  },
  {
    id: "cleaning-services",
    label: "Cleaning Services",
    description: "Templates for residential and commercial cleaning offers.",
    status: "available",
    helper: "Available now",
  },
  {
    id: "fitness-personal-training",
    label: "Fitness / Personal Training",
    description: "Templates for consultation, program, and membership-based fitness offers.",
    status: "available",
    helper: "Available now",
  },
  {
    id: "flooring",
    label: "Flooring",
    description: "Templates for quote-driven flooring and installation leads.",
    status: "available",
    helper: "Available now",
  },
  {
    id: "landscape-lawn-care",
    label: "Landscape / Lawn Care",
    description: "Templates for seasonal and recurring landscaping offers.",
    status: "available",
    helper: "Available now",
  },
  {
    id: "plumbing",
    label: "Plumbing",
    description: "Templates for emergency, inspection, and service-booking plumbing offers.",
    status: "available",
    helper: "Available now",
  },
  {
    id: "pool-services",
    label: "Pool Services",
    description: "Templates for maintenance and service offers for pool businesses.",
    status: "available",
    helper: "Available now",
  },
  {
    id: "roofing",
    label: "Roofing",
    description: "Templates for inspection, quote request, and repair booking offers.",
    status: "available",
    helper: "Available now",
  },
  {
    id: "spas-massage",
    label: "Spas & Massage",
    description: "Templates for relaxation, appointment, and membership-style wellness offers.",
    status: "available",
    helper: "Available now",
  },
];

export function getIndustryLabel(industryId: string | null | undefined) {
  return onboardingIndustries.find((industry) => industry.id === industryId)?.label || "Your industry";
}
