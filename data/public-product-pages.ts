import {
  Blocks,
  Layers3,
  Link2,
  Megaphone,
  MousePointerClick,
  Send,
  type LucideIcon,
} from "lucide-react";

export type PublicProductItem = {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  href: string;
  icon: LucideIcon;
  menuGroup: string;
  eyebrow: string;
  headline: string;
  subheadline: string;
  highlights: string[];
  frameTitle: string;
  frameLabel: string;
  frameSteps: string[];
  ctaLabel: string;
  pillars: string[];
  pillarDetails: string[];
  workflowLabel: string;
  workflowTitle: string;
  workflowDescription: string;
  workflowSteps: string[];
  workflowStepDetails: string[];
  includesTitle: string;
  includesDescription: string;
  includes: string[];
  previewKind:
    | "templates"
    | "ads"
    | "leadCapture"
    | "leadManagement"
    | "outreach"
    | "integrations";
};

export const publicProductItems: PublicProductItem[] = [
  {
    slug: "templates",
    title: "Templates",
    shortTitle: "Templates",
    description: "Start from ready-to-launch detailing campaign templates.",
    href: "/product/templates",
    icon: Layers3,
    menuGroup: "Start here",
    eyebrow: "Templates",
    headline: "Ready-to-launch templates for booked details",
    subheadline:
      "Pick a plug and play detailing campaign, add your offer, and launch with your brand in front.",
    highlights: ["Detailing-first", "Template-first setup", "Launch faster"],
    frameTitle: "Built to remove blank-page drag",
    frameLabel: "Ready-to-go",
    frameSteps: ["Choose your industry", "Pick the template", "Launch from one system"],
    ctaLabel: "See Templates",
    pillars: ["Industry-ready", "Launch faster", "Cleaner setup"],
    pillarDetails: [
      "Start with a detailing offer you actually want to run.",
      "Use a structure that is already ready for launch instead of building from zero.",
      "Keep the template, lead path, and follow-up flow connected from the start.",
    ],
    workflowLabel: "How templates work",
    workflowTitle: "Start from a structure that already fits",
    workflowDescription:
      "Templates help car detailers skip the blank page and move straight into launch mode.",
    workflowSteps: ["Choose your offer", "Pick a template", "Customize the essentials"],
    workflowStepDetails: [
      "Start with the service or package you want to book.",
      "Choose the layout and offer structure that fits the campaign.",
      "Update the details that make it yours, then keep moving.",
    ],
    includesTitle: "What comes with each template",
    includesDescription:
      "Every template gives you more than ad copy. It brings the campaign pieces into one place.",
    includes: [
      "Offer-led copy structure",
      "Lead capture form",
      "CRM handoff path",
      "Simple launch flow",
    ],
    previewKind: "templates",
  },
  {
    slug: "ads",
    title: "Ads",
    shortTitle: "Ads",
    description: "Launch detailing campaigns faster from proven ad-ready setups.",
    href: "/product/ads",
    icon: Megaphone,
    menuGroup: "Start here",
    eyebrow: "Ads",
    headline: "Plug-and-play ads for faster campaign launch",
    subheadline:
      "Start from ad-ready structures that help car detailers move from offer to launch without the usual setup drag.",
    highlights: ["Proven structure", "Faster launch", "Cleaner messaging"],
    frameTitle: "Built for quicker campaign launch",
    frameLabel: "Ad-ready",
    frameSteps: ["Pick the angle", "Match the offer", "Launch the campaign"],
    ctaLabel: "Start Free Trial",
    pillars: ["Sharper setup", "Cleaner campaigns", "Less drag"],
    pillarDetails: [
      "Start with a structure that already makes sense for paid traffic.",
      "Keep the campaign message tighter from ad to lead form.",
      "Reduce the usual back-and-forth that slows launch down.",
    ],
    workflowLabel: "How ads work",
    workflowTitle: "From campaign idea to launch, kept simple",
    workflowDescription:
      "SideKick gives you a cleaner ad launch path instead of piecing together separate campaign assets by hand.",
    workflowSteps: ["Choose the offer", "Align the campaign", "Launch from one flow"],
    workflowStepDetails: [
      "Pick the service or promotion you want to push.",
      "Match the offer to a ready-to-go campaign template and lead flow.",
      "Launch from one connected system instead of patching tools together.",
    ],
    includesTitle: "Inside the ads workflow",
    includesDescription:
      "The ads side of SideKick is built to remove setup friction without turning the product into an ad manager clone.",
    includes: [
      "Offer-backed ad structure",
      "Cleaner lead handoff",
      "Built-in lead path",
      "Simple next-step flow",
    ],
    previewKind: "ads",
  },
  {
    slug: "lead-capture",
    title: "Lead Capture",
    shortTitle: "Lead Capture",
    description: "Capture inquiries in a cleaner path from click to form.",
    href: "/product/lead-capture",
    icon: MousePointerClick,
    menuGroup: "Keep leads moving",
    eyebrow: "Lead Capture",
    headline: "Cleaner inquiry capture without extra friction",
    subheadline:
      "Keep the path from campaign click to inquiry simple, mobile-friendly, and easier to complete.",
    highlights: ["Focused lead flow", "Simpler forms", "Fewer drop-offs"],
    frameTitle: "Built for a cleaner inquiry flow",
    frameLabel: "Lead capture",
    frameSteps: ["Visitor lands", "Form stays focused", "Inquiry comes through"],
    ctaLabel: "Start Free Trial",
    pillars: ["Mobile-first", "Clear next step", "Less drop-off"],
    pillarDetails: [
      "Lead forms and response paths are built to keep the next step clear.",
      "Forms stay light enough for real small-business traffic.",
      "A cleaner path helps fewer leads get lost before they inquire.",
    ],
    workflowLabel: "How lead capture works",
    workflowTitle: "Turn attention into a real inquiry",
    workflowDescription:
      "Lead capture should feel like part of the launch flow, not a separate conversion tool glued on top.",
    workflowSteps: ["Prospect responds to the ad", "Visitor submits inquiry", "Lead is captured inside SideKick"],
    workflowStepDetails: [
      "The response path is aligned to the offer the visitor clicked on.",
      "The form keeps the next step clear and simple.",
      "The lead lands inside the same system so you can act on it quickly.",
    ],
    includesTitle: "What the capture flow includes",
    includesDescription:
      "Lead capture is built into SideKick so the handoff into your connected CRM stays clean.",
    includes: [
      "Lead form structure",
      "Inquiry form flow",
      "Campaign source tracking",
      "Connected CRM handoff",
    ],
    previewKind: "leadCapture",
  },
  {
    slug: "lead-management",
    title: "Lead Management",
    shortTitle: "Lead Management",
    description: "See incoming leads clearly and hand them off into your connected CRM.",
    href: "/product/lead-management",
    icon: Blocks,
    menuGroup: "Keep leads moving",
    eyebrow: "Lead Management",
    headline: "Keep every lead in one clearer workspace",
    subheadline:
      "Capture inquiries, review lead activity, and keep CRM handoff visible without switching between disconnected tools.",
    highlights: ["Lead visibility", "CRM handoff", "Clear lead status"],
    frameTitle: "Built to keep leads visible",
    frameLabel: "Lead management",
    frameSteps: ["Lead captured", "Status visible", "CRM handoff tracked"],
    ctaLabel: "Start Free Trial",
    pillars: ["One place", "Clear statuses", "Cleaner handoff"],
    pillarDetails: [
      "Keep incoming leads visible in the same system as the launch flow.",
      "Use simple statuses to see what needs attention next.",
      "Push leads into your CRM without losing campaign context.",
    ],
    workflowLabel: "How lead visibility works",
    workflowTitle: "A simpler way to keep lead activity visible",
    workflowDescription:
      "SideKick keeps lead activity close to the original campaign so your team can respond quickly and route leads into the right CRM.",
    workflowSteps: ["Leads come in", "Status stays visible", "CRM receives the lead"],
    workflowStepDetails: [
      "New inquiries show up in the platform right away.",
      "Statuses help you see what is new, delivered, or needs attention.",
      "The lead stays connected to the campaign that brought it in while SideKick hands it off to your CRM.",
    ],
    includesTitle: "Inside the lead workspace",
    includesDescription:
      "Lead visibility stays intentionally simple so small teams can act without turning SideKick into a CRM replacement.",
    includes: [
      "Lead list view",
      "Status tracking",
      "Campaign source context",
      "CRM delivery visibility",
    ],
    previewKind: "leadManagement",
  },
  {
    slug: "outreach",
    title: "Outreach",
    shortTitle: "Outreach",
    description: "Keep follow-up moving with faster alerts and cleaner CRM handoff.",
    href: "/product/outreach",
    icon: Send,
    menuGroup: "Keep leads moving",
    eyebrow: "Outreach",
    headline: "Simple follow-up that keeps momentum moving",
    subheadline:
      "Help your team respond faster without losing campaign context before the lead reaches your CRM.",
    highlights: ["Faster replies", "Cleaner handoff", "Less drop-off"],
    frameTitle: "Built to keep outreach moving",
    frameLabel: "Follow-up",
    frameSteps: ["Lead comes in", "Team is alerted", "CRM follow-up keeps moving"],
    ctaLabel: "Start Free Trial",
    pillars: ["Quicker response", "Cleaner handoff", "Less chasing"],
    pillarDetails: [
      "Keep the first response close to the lead instead of losing it in disconnected tools.",
      "Make it easier for a small business to keep momentum after inquiry.",
      "Reduce the manual chasing that often causes leads to cool off.",
    ],
    workflowLabel: "How outreach works",
    workflowTitle: "Keep the next step tied to the lead",
    workflowDescription:
      "Follow-up should feel like the natural next step after lead capture, not a messy handoff with missing context.",
    workflowSteps: ["Lead arrives", "Team gets context", "CRM follow-up keeps moving"],
    workflowStepDetails: [
      "The lead stays tied to the campaign that launched it.",
      "SideKick gives your team the context needed to respond quickly.",
      "Your CRM takes over long-term follow-up from a cleaner workflow.",
    ],
    includesTitle: "Inside the outreach flow",
    includesDescription:
      "Follow-up stays intentionally lightweight so small businesses can act quickly without enterprise workflow clutter.",
    includes: [
      "Fast handoff prompts",
      "Lead-linked campaign context",
      "Clear next-step handling",
      "Less manual patching",
    ],
    previewKind: "outreach",
  },
  {
    slug: "integrations",
    title: "Integrations",
    shortTitle: "Integrations",
    description: "Connect the tools that matter without fragmenting the workflow.",
    href: "/product/integrations",
    icon: Link2,
    menuGroup: "Connected workflow",
    eyebrow: "Integrations",
    headline: "The right integrations, without extra clutter",
    subheadline:
      "Connect the systems that matter while keeping the core SideKick workflow clean and easy to understand.",
    highlights: ["Meta ready", "Core connections", "Cleaner stack"],
    frameTitle: "Built for a cleaner connected stack",
    frameLabel: "Connected",
    frameSteps: ["Meta connection", "CRM handoff is connected", "Expansion stays simple"],
    ctaLabel: "Get Started",
    pillars: ["Cleaner handoff", "Fewer fragments", "Future-ready"],
    pillarDetails: [
      "Connect the tools you need without blowing up the simplicity of the product.",
      "Keep launch, lead capture, and CRM handoff tied together instead of split across disconnected tools.",
      "Leave room to grow later without making version one feel heavy.",
    ],
    workflowLabel: "How integrations work",
    workflowTitle: "Connect the workflow, not just the tools",
    workflowDescription:
      "Integrations should support the SideKick flow, not distract from it. That means fewer connectors, but better handoffs.",
    workflowSteps: ["Connect Meta", "Send leads into your CRM", "Expand when needed"],
    workflowStepDetails: [
      "Use connected Meta assets for the campaigns you want to launch.",
      "Let SideKick capture the lead and hand it off into your connected CRM automatically.",
      "Add more integrations later without turning the workflow into a maze.",
    ],
    includesTitle: "What the connected setup supports",
    includesDescription:
      "SideKick keeps the integrations list focused so the product still feels like one system instead of a connector catalog.",
    includes: [
      "Meta connection path",
      "Connected CRM delivery",
      "Delivery status visibility",
      "Expandable integration hooks",
    ],
    previewKind: "integrations",
  },
];

export const publicProductMap = Object.fromEntries(
  publicProductItems.map((item) => [item.slug, item]),
) as Record<string, PublicProductItem>;

export const publicProductGroups = [
  {
    title: "Start here",
    items: publicProductItems.filter((item) => item.menuGroup === "Start here"),
  },
  {
    title: "Keep leads moving",
    items: publicProductItems.filter((item) => item.menuGroup === "Keep leads moving"),
  },
  {
    title: "Connected workflow",
    items: publicProductItems.filter((item) => item.menuGroup === "Connected workflow"),
  },
];
