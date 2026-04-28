import type { TemplateIndustry, TemplateOfferType } from "@/types";

export const supportedIndustries: TemplateIndustry[] = [
  "Car Detailing",
  "Chiropractic",
  "Physical Therapy",
  "Cleaning Services",
  "Fitness / Personal Training",
  "Flooring",
  "Landscape / Lawn Care",
  "Plumbing",
  "Pool Services",
  "Roofing",
  "Spas & Massage",
];

export const supportedOfferTypes: TemplateOfferType[] = [
  "Consultation",
  "Quote Request",
  "Service Booking",
  "Inspection",
  "Route Fill",
  "Appointment Booking",
  "Emergency Service",
  "Recurring Maintenance",
  "Membership / Program",
  "High-Ticket Offer",
  "Seasonal Promotion",
  "Reactivation / Follow-Up",
];

export function normalizeIndustryLabel(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return "";

  switch (trimmed.toLowerCase()) {
    case "car detailing":
      return "Car Detailing";
    case "chiropractic":
      return "Chiropractic";
    case "physical therapy":
      return "Physical Therapy";
    case "cleaning services":
      return "Cleaning Services";
    case "fitness / personal training":
    case "fitness personal training":
      return "Fitness / Personal Training";
    case "flooring":
      return "Flooring";
    case "landscape / lawn care":
    case "landscape lawn care":
      return "Landscape / Lawn Care";
    case "plumbing":
      return "Plumbing";
    case "pool services":
      return "Pool Services";
    case "roofing":
      return "Roofing";
    case "spas & massage":
    case "spas and massage":
      return "Spas & Massage";
    case "auto-detailing":
    case "auto detailing":
    case "detailing":
      return "Car Detailing";
    case "cleaning services":
    case "cleaning":
      return "Cleaning Services";
    case "fitness":
    case "fitness studio":
    case "personal training":
      return "Fitness / Personal Training";
    case "landscaping":
    case "landscape":
      return "Landscape / Lawn Care";
    case "spa":
    case "spa & massage":
    case "massage":
      return "Spas & Massage";
    default:
      return trimmed;
  }
}

export function normalizeOfferTypeLabel(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return "";

  switch (trimmed.toLowerCase()) {
    case "consultation":
      return "Consultation";
    case "quote request":
    case "quote":
      return "Quote Request";
    case "service booking":
    case "booking":
      return "Service Booking";
    case "inspection":
      return "Inspection";
    case "route fill":
      return "Route Fill";
    case "appointment booking":
    case "appointment":
      return "Appointment Booking";
    case "emergency service":
      return "Emergency Service";
    case "recurring maintenance":
    case "recurring revenue":
    case "monthly maintenance":
      return "Recurring Maintenance";
    case "membership / program":
    case "membership program":
    case "membership push":
      return "Membership / Program";
    case "high-ticket offer":
    case "high-ticket":
      return "High-Ticket Offer";
    case "seasonal promotion":
    case "seasonal offer":
      return "Seasonal Promotion";
    case "reactivation / follow-up":
    case "reactivation":
    case "follow-up":
      return "Reactivation / Follow-Up";
    default:
      return trimmed;
  }
}
