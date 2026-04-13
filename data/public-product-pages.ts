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
    description: "Choose your industry, then start from a ready-to-go template.",
    href: "/product/templates",
    icon: Layers3,
    menuGroup: "Start here",
    eyebrow: "Templates",
    headline: "Ready-to-go templates for faster launch",
    subheadline:
      "Choose your industry, pick a template that fits it, and start from a cleaner launch path instead of a blank page.",
    highlights: ["Choose your industry", "Template-first setup", "Launch faster"],
    frameTitle: "Built to remove blank-page drag",
    frameLabel: "Ready-to-go",
    frameSteps: ["Choose your industry", "Pick the template", "Launch from one system"],
    ctaLabel: "See Templates",
    pillars: ["Industry-ready", "Launch faster", "Cleaner setup"],
    pillarDetails: [
      "Start with the kind of business and offer you actually want to run.",
      "Use a structure that is already ready for launch instead of building from zero.",
      "Keep the template, lead path, and follow-up flow connected from the start.",
    ],
    workflowLabel: "How templates work",
    workflowTitle: "Start from a structure that already fits",
    workflowDescription:
      "Templates help small businesses skip the blank page and move straight into launch mode.",
    workflowSteps: ["Choose your industry", "Pick a template", "Customize the essentials"],
    workflowStepDetails: [
      "Start with the kind of business you actually run.",
      "Choose the layout and offer structure that fits the campaign.",
      "Update the details that make it yours, then keep moving.",
    ],
    includesTitle: "What comes with each template",
    includesDescription:
      "Every template gives you more than a page layout. It brings the launch pieces into one place.",
    includes: [
      "Offer-led copy structure",
      "Campaign page layout",
      "Lead management path",
      "Simple follow-up flow",
    ],
    previewKind: "templates",
  },
  {
    slug: "ads",
    title: "Ads",
    shortTitle: "Ads",
    description: "Launch campaigns faster from proven ad-ready setups.",
    href: "/product/ads",
    icon: Megaphone,
    menuGroup: "Start here",
    eyebrow: "Ads",
    headline: "Plug-and-play ads for faster campaign launch",
    subheadline:
      "Start from ad-ready structures that help small businesses move from idea to launch without the usual setup drag.",
    highlights: ["Proven structure", "Faster launch", "Cleaner messaging"],
    frameTitle: "Built for quicker campaign launch",
    frameLabel: "Ad-ready",
    frameSteps: ["Pick the angle", "Match the offer", "Launch the campaign"],
    ctaLabel: "Start Free Trial",
    pillars: ["Sharper setup", "Cleaner campaigns", "Less drag"],
    pillarDetails: [
      "Start with a structure that already makes sense for paid traffic.",
      "Keep the campaign message tighter from ad to landing experience.",
      "Reduce the usual back-and-forth that slows launch down.",
    ],
    workflowLabel: "How ads work",
    workflowTitle: "From campaign idea to launch, kept simple",
    workflowDescription:
      "SideKick gives you a cleaner ad launch path instead of piecing together separate campaign assets by hand.",
    workflowSteps: ["Choose the offer", "Align the campaign", "Launch from one flow"],
    workflowStepDetails: [
      "Pick the service or promotion you want to push.",
      "Match the offer to a ready-to-go template and page structure.",
      "Launch from one connected system instead of patching tools together.",
    ],
    includesTitle: "Inside the ads workflow",
    includesDescription:
      "The ads side of SideKick is built to remove setup friction without turning the product into an ad manager clone.",
    includes: [
      "Offer-backed ad structure",
      "Cleaner campaign page handoff",
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
    highlights: ["Focused pages", "Simpler forms", "Fewer drop-offs"],
    frameTitle: "Built for a cleaner inquiry flow",
    frameLabel: "Lead capture",
    frameSteps: ["Visitor lands", "Form stays focused", "Inquiry comes through"],
    ctaLabel: "Start Free Trial",
    pillars: ["Mobile-first", "Clear next step", "Less drop-off"],
    pillarDetails: [
      "Pages are built to keep the visitor focused on the next step.",
      "Forms stay light enough for real small-business traffic.",
      "A cleaner path helps fewer leads get lost before they inquire.",
    ],
    workflowLabel: "How lead capture works",
    workflowTitle: "Turn attention into a real inquiry",
    workflowDescription:
      "Lead capture should feel like part of the launch flow, not a separate conversion tool glued on top.",
    workflowSteps: ["Campaign page opens", "Visitor submits inquiry", "Lead is captured inside SideKick"],
    workflowStepDetails: [
      "The campaign page is aligned to the offer the visitor clicked on.",
      "The form keeps the next step clear and simple.",
      "The lead lands inside the same system so you can act on it quickly.",
    ],
    includesTitle: "What the capture flow includes",
    includesDescription:
      "Lead capture is built into the SideKick system so the handoff into lead management stays clean.",
    includes: [
      "Campaign page layout",
      "Inquiry form flow",
      "Lead status entry point",
      "Connected follow-up path",
    ],
    previewKind: "leadCapture",
  },
  {
    slug: "lead-management",
    title: "Lead Management",
    shortTitle: "Lead Management",
    description: "Track, view, and organize incoming leads in one place.",
    href: "/product/lead-management",
    icon: Blocks,
    menuGroup: "Keep leads moving",
    eyebrow: "Lead Management",
    headline: "Keep every lead in one clearer workspace",
    subheadline:
      "Capture inquiries, update statuses, and see lead flow without switching between disconnected tools.",
    highlights: ["Lead list", "Status updates", "Cleaner pipeline"],
    frameTitle: "Built to keep leads visible",
    frameLabel: "Lead management",
    frameSteps: ["Lead captured", "Status updated", "Next step tracked"],
    ctaLabel: "Start Free Trial",
    pillars: ["One place", "Clear statuses", "Less tool switching"],
    pillarDetails: [
      "Keep incoming leads in the same system as the launch flow.",
      "Use simple statuses to see what needs action next.",
      "Reduce the usual tool switching that slows response time down.",
    ],
    workflowLabel: "How lead management works",
    workflowTitle: "A simpler way to keep leads organized",
    workflowDescription:
      "SideKick makes the lead list part of the product itself, so the next step stays close to the original campaign.",
    workflowSteps: ["Leads come in", "Status stays visible", "Next action is easier to manage"],
    workflowStepDetails: [
      "New inquiries show up in the platform right away.",
      "Statuses help you see what is new, contacted, or moving forward.",
      "The lead stays connected to the campaign that brought it in.",
    ],
    includesTitle: "Inside the lead workspace",
    includesDescription:
      "Lead management is intentionally simple so small teams can act without getting buried in CRM complexity.",
    includes: [
      "Lead list view",
      "Status tracking",
      "Campaign source context",
      "Outreach-ready next step",
    ],
    previewKind: "leadManagement",
  },
  {
    slug: "outreach",
    title: "Outreach",
    shortTitle: "Outreach",
    description: "Keep follow-up moving from the same system as the lead.",
    href: "/product/outreach",
    icon: Send,
    menuGroup: "Keep leads moving",
    eyebrow: "Outreach",
    headline: "Simple follow-up that keeps momentum moving",
    subheadline:
      "Handle outreach and next steps without sending the lead into another disconnected workflow.",
    highlights: ["Faster replies", "Cleaner outreach", "Less drop-off"],
    frameTitle: "Built to keep outreach moving",
    frameLabel: "Follow-up",
    frameSteps: ["Lead comes in", "Outreach starts", "Conversation keeps moving"],
    ctaLabel: "Start Free Trial",
    pillars: ["Quicker response", "Cleaner outreach", "Less chasing"],
    pillarDetails: [
      "Keep the first response close to the lead instead of buried in another system.",
      "Make it easier for a small business to keep momentum after inquiry.",
      "Reduce the manual chasing that often causes leads to cool off.",
    ],
    workflowLabel: "How outreach works",
    workflowTitle: "Keep the next step tied to the lead",
    workflowDescription:
      "Outreach should feel like the natural next step after lead capture, not a messy handoff into another tool.",
    workflowSteps: ["Lead arrives", "Follow-up starts", "Conversation keeps moving"],
    workflowStepDetails: [
      "The lead comes into the same system that launched the campaign.",
      "SideKick supports the next outreach step without extra patchwork.",
      "The conversation keeps moving from a clearer workflow.",
    ],
    includesTitle: "Inside the outreach flow",
    includesDescription:
      "Follow-up stays intentionally lightweight so small businesses can act quickly without enterprise workflow clutter.",
    includes: [
      "Simple follow-up prompts",
      "Lead-linked outreach flow",
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
    highlights: ["Meta/Facebook ready", "Core connections", "Cleaner stack"],
    frameTitle: "Built for a cleaner connected stack",
    frameLabel: "Connected",
    frameSteps: ["Meta connection", "Lead flow stays connected", "Expansion stays simple"],
    ctaLabel: "Get Started",
    pillars: ["Cleaner handoff", "Fewer fragments", "Future-ready"],
    pillarDetails: [
      "Connect the tools you need without blowing up the simplicity of the product.",
      "Keep launch, leads, and outreach tied together instead of split across disconnected tools.",
      "Leave room to grow later without making version one feel heavy.",
    ],
    workflowLabel: "How integrations work",
    workflowTitle: "Connect the workflow, not just the tools",
    workflowDescription:
      "Integrations should support the SideKick flow, not distract from it. That means fewer connectors, but better handoffs.",
    workflowSteps: ["Connect Meta/Facebook", "Keep leads inside SideKick", "Expand when needed"],
    workflowStepDetails: [
      "Use connected sources for the campaigns you want to launch.",
      "Keep the lead and outreach path inside the platform where it stays easier to manage.",
      "Add more integrations later without turning the workflow into a maze.",
    ],
    includesTitle: "What the connected setup supports",
    includesDescription:
      "SideKick keeps the integrations list focused so the product still feels like one system instead of a connector catalog.",
    includes: [
      "Meta/Facebook connection path",
      "Connected lead workflow",
      "Email and follow-up support",
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
