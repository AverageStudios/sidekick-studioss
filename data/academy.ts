export type AcademySectionKey =
  | "getting-started"
  | "workspaces"
  | "templates"
  | "campaign-launch"
  | "campaign-management"
  | "performance"
  | "integrations"
  | "crm-handoff"
  | "billing-account-settings"
  | "support-troubleshooting"
  | "faq";

export type AcademyArticleBlock = {
  heading: string;
  body: string[];
  bullets?: string[];
  steps?: string[];
  note?: string;
};

export type AcademyArticle = {
  slug: string;
  title: string;
  section: AcademySectionKey;
  summary: string;
  description: string;
  readTime: string;
  updatedLabel: string;
  blocks: AcademyArticleBlock[];
  relatedSlugs: string[];
};

export const academySections: Array<{
  key: AcademySectionKey;
  title: string;
  description: string;
}> = [
  {
    key: "getting-started",
    title: "Getting Started",
    description: "What SideKick is, who it is for, and how the platform is organized.",
  },
  {
    key: "workspaces",
    title: "Workspaces",
    description: "How workspace context, switching, and branding work inside SideKick.",
  },
  {
    key: "templates",
    title: "Templates",
    description: "How template selection, categories, and industries shape campaign setup.",
  },
  {
    key: "campaign-launch",
    title: "Campaign Launch",
    description: "How to go from template to live Meta campaign with the right ad type.",
  },
  {
    key: "campaign-management",
    title: "Campaign Management",
    description: "Campaign states, previews, edits, and the day-to-day launch workflow.",
  },
  {
    key: "performance",
    title: "Performance",
    description: "What campaign metrics mean and how to use them to guide decisions.",
  },
  {
    key: "integrations",
    title: "Integrations",
    description: "How to connect Meta, GoHighLevel, and HubSpot at the workspace level.",
  },
  {
    key: "crm-handoff",
    title: "Sending Leads to Your CRM",
    description: "How SideKick sends new Meta Lead Form submissions to your connected CRM.",
  },
  {
    key: "billing-account-settings",
    title: "Billing / Account / Settings",
    description: "Profile settings, workspace settings, and support-related account basics.",
  },
  {
    key: "support-troubleshooting",
    title: "Support / Troubleshooting",
    description: "Common issues, what to check first, and how to contact the SideKick team.",
  },
  {
    key: "faq",
    title: "FAQ",
    description: "Quick answers to the most common product questions.",
  },
];

export const academyArticles: AcademyArticle[] = [
  {
    slug: "sidekick-overview",
    title: "What SideKick is and how the platform is organized",
    section: "getting-started",
    summary: "Start here to understand the product model, navigation, and where key work happens.",
    description:
      "SideKick is a campaign and lead-response workspace. It helps you launch campaigns, capture new leads, track simple statuses, and send leads to a connected CRM when you need deeper pipeline management.",
    readTime: "5 min read",
    updatedLabel: "Updated June 2026",
    blocks: [
      {
        heading: "What SideKick is built for",
        body: [
          "SideKick helps small businesses move faster from idea to live campaign. The product covers campaign setup, launch, previewing, performance tracking, lead capture, and the integrations that keep the workflow connected.",
          "SideKick is not a heavy CRM replacement. It gives you simple lead management — capture, status tracking, and follow-up — and can send leads to connected CRMs like GoHighLevel or HubSpot when you need deeper pipeline management.",
        ],
        bullets: [
          "Create and manage campaigns",
          "Start from ready-to-use templates",
          "Launch Meta campaign flows faster",
          "Capture and track new leads",
          "Track campaign performance",
          "Send Meta Lead Form submissions to connected CRMs",
        ],
      },
      {
        heading: "How the main product areas work",
        body: [
          "Home shows a broad view of launch activity and current workspace health.",
          "Campaigns is where you see drafts, live campaigns, and day-to-day campaign activity.",
          "Performance keeps reporting focused on campaign outcomes, separate from the day-to-day lead handling you do in your lead list.",
          "Workspace Settings is where you manage workspace identity, branding, integrations, and other setup details.",
        ],
      },
      {
        heading: "What happens to leads",
        body: [
          "For Meta Lead Form campaigns, SideKick captures the form submission, normalizes the data, keeps it in your workspace, and sends it to the connected CRM destinations for that workspace.",
          "SideKick keeps simple lead management in the workspace, while your connected CRM remains the place for deeper pipeline stages, follow-up ownership, and long-term customer management when you need it.",
        ],
        note: "If multiple CRM providers are connected for a workspace, SideKick sends eligible leads to each connected provider and logs each delivery independently.",
      },
    ],
    relatedSlugs: ["workspace-basics", "launch-your-first-campaign", "how-crm-handoff-works"],
  },
  {
    slug: "workspace-basics",
    title: "How workspaces, switching, and workspace branding work",
    section: "workspaces",
    summary: "Learn how SideKick scopes campaigns, settings, and integrations to a workspace.",
    description:
      "Workspaces keep campaigns, connected accounts, branding, and CRM handoff settings grouped for each business or operating unit.",
    readTime: "4 min read",
    updatedLabel: "Updated June 2026",
    blocks: [
      {
        heading: "What a workspace controls",
        body: [
          "A workspace is the operating context for your campaigns. It keeps the business identity, connected Meta account details, connected CRM destinations, and campaign records in one place.",
          "When you switch workspaces, SideKick updates the campaigns, settings, and integrations you are viewing so you are always working inside the right business context.",
        ],
        bullets: [
          "Workspace name and brand identity",
          "Workspace logo and imagery",
          "Connected Meta assets",
          "Connected CRM accounts",
          "Campaign records and related performance data",
        ],
      },
      {
        heading: "How to create or switch workspaces",
        body: [
          "Use the workspace switcher in the top-left area of the app to move between existing workspaces or create a new one.",
          "When you create a new workspace, start by setting the name and basic business profile so campaigns and connected assets reflect the right brand from the beginning.",
        ],
        steps: [
          "Open the workspace switcher from the app header.",
          "Select an existing workspace or choose New workspace.",
          "Complete the workspace name and business details.",
          "Open Workspace Settings to finish branding and integrations.",
        ],
      },
      {
        heading: "Workspace branding and images",
        body: [
          "Profile and workspace images are used in key parts of the app so your workspace feels recognizable and polished.",
          "Keep workspace branding current before launching new campaigns so preview screens and operational views stay aligned with the business you are launching for.",
        ],
      },
    ],
    relatedSlugs: ["sidekick-overview", "connect-meta-and-crms", "account-and-workspace-settings"],
  },
  {
    slug: "templates-and-categories",
    title: "How templates, categories, and industries work",
    section: "templates",
    summary: "Understand how SideKick uses industry and template structure to speed up campaign setup.",
    description:
      "Templates are designed to reduce setup friction by giving each campaign a head start based on business type, offer, and ad format.",
    readTime: "5 min read",
    updatedLabel: "Updated June 2026",
    blocks: [
      {
        heading: "What templates do",
        body: [
          "Templates give you a starting point for campaign setup so you are not building the entire structure from scratch. They help shape copy, positioning, offer framing, and launch flow defaults.",
          "Instead of treating templates as decoration, SideKick uses them as an operational starting point for real launch work.",
        ],
      },
      {
        heading: "How categories and industries affect template selection",
        body: [
          "Industries and categories help narrow the right campaign structure for the kind of business you are running. This keeps the template library easier to browse and makes it more likely that the starting point already fits the business.",
          "A cleaning business, a landscaping crew, and a fitness studio each need a different offer and lead flow, so categories and industries help SideKick organize those differences clearly.",
        ],
        bullets: [
          "Industry narrows the business context",
          "Category helps group similar campaign types",
          "Template content reflects both the offer and launch style",
        ],
      },
      {
        heading: "How to choose the right template",
        body: [
          "Look for the template that matches the offer and desired response. If you want a lead submission, choose a template built for Lead Form or Landing Page behavior. If the goal is phone calls, use a Call Now structure instead.",
          "The best template is the one that matches the real user action you want after the ad is clicked.",
        ],
        steps: [
          "Choose the industry that best matches the business.",
          "Review the available template options.",
          "Check the ad type and CTA behavior before launching.",
          "Open the template and confirm the campaign flow matches your goal.",
        ],
      },
    ],
    relatedSlugs: ["launch-your-first-campaign", "campaign-previews-and-statuses", "lead-form-vs-landing-page-vs-call-now-vs-messenger"],
  },
  {
    slug: "launch-your-first-campaign",
    title: "How to launch a campaign in SideKick",
    section: "campaign-launch",
    summary: "A practical launch walkthrough from template selection to publishing.",
    description:
      "Campaign launch in SideKick starts from a template and moves through preview, setup, and publishing without requiring you to assemble the entire system manually.",
    readTime: "6 min read",
    updatedLabel: "Updated June 2026",
    blocks: [
      {
        heading: "Before you launch",
        body: [
          "Make sure your workspace has the right brand identity, connected Meta account, and the CRM destinations you want ready for handoff if you are launching a Meta Lead Form campaign.",
          "If Meta assets or CRM connections are missing, finish that setup first so you do not need to stop mid-launch.",
        ],
      },
      {
        heading: "The launch flow",
        body: [
          "Launch starts from a template and moves through the setup flow for that specific campaign. You will review the campaign structure, preview the creative direction, and confirm any account-linked details before the campaign goes live.",
        ],
        steps: [
          "Open the template you want to use.",
          "Create a new campaign from that template.",
          "Review campaign details and preview content.",
          "Confirm the ad type and response path.",
          "Connect or confirm required Meta assets.",
          "Publish the campaign.",
        ],
      },
      {
        heading: "What happens after publish",
        body: [
          "After publish, the campaign moves into the campaign management and performance part of the workflow. You can review its state, see recent activity, and monitor reporting from the Performance area.",
          "For Lead Form campaigns, SideKick can also begin capturing and handing off leads to your connected CRM destinations as new submissions arrive.",
        ],
      },
    ],
    relatedSlugs: ["lead-form-vs-landing-page-vs-call-now-vs-messenger", "campaign-previews-and-statuses", "how-performance-reporting-works"],
  },
  {
    slug: "lead-form-vs-landing-page-vs-call-now-vs-messenger",
    title: "How ad types work in SideKick",
    section: "campaign-launch",
    summary: "Understand when to use Lead Form, Landing Page, Call Now, or Messenger campaign paths.",
    description:
      "Different ad types create different response flows, so it is important to choose the one that matches the real next step you want from the prospect.",
    readTime: "6 min read",
    updatedLabel: "Updated June 2026",
    blocks: [
      {
        heading: "Lead Form",
        body: [
          "Lead Form campaigns keep the submission inside Meta. They are often the fastest path to capturing structured lead details without sending the user to an external page.",
          "This is the campaign type that currently uses SideKick's CRM handoff flow for automated delivery into connected CRM providers.",
        ],
      },
      {
        heading: "Landing Page",
        body: [
          "Landing Page campaigns send the prospect to a page experience outside the in-platform Meta form flow. This is useful when you need more explanation, richer brand presentation, or a different conversion experience.",
        ],
      },
      {
        heading: "Call Now",
        body: [
          "Call Now is best when a live conversation is the primary conversion action. It reduces the path from impression to phone call and usually fits high-intent service businesses.",
        ],
      },
      {
        heading: "Messenger",
        body: [
          "Messenger-based campaigns are designed for conversation-first response paths. They can help when the offer benefits from lightweight back-and-forth before a prospect is ready to convert.",
        ],
      },
      {
        heading: "How to choose the right type",
        body: [
          "The correct ad type depends on the action you want next. If you want structured lead capture inside Meta and CRM handoff, use Lead Form. If you need a fuller page experience, use Landing Page. If you need immediate phone contact, use Call Now. If a messaging conversation is the best fit, use Messenger.",
        ],
      },
    ],
    relatedSlugs: ["launch-your-first-campaign", "how-crm-handoff-works", "campaign-previews-and-statuses"],
  },
  {
    slug: "campaign-previews-and-statuses",
    title: "How campaign previews, statuses, pause, and resume work",
    section: "campaign-management",
    summary: "Learn what you can expect from campaign previews and lifecycle states after launch.",
    description:
      "SideKick keeps campaign operations focused by clearly separating previewing, launch state, and performance monitoring.",
    readTime: "5 min read",
    updatedLabel: "Updated June 2026",
    blocks: [
      {
        heading: "What campaign previews show",
        body: [
          "Campaign previews help you understand what the campaign is meant to look and feel like before it goes live. They are designed to make launch decisions easier and faster, especially when working from templates.",
          "Use previews to confirm the creative direction, offer framing, CTA path, and overall fit before you publish or update a campaign.",
        ],
      },
      {
        heading: "Common campaign states",
        body: [
          "Campaigns can move through draft, in review, active, paused, archived, or other lifecycle states depending on where they are in the launch process.",
          "The state is meant to help you understand whether the campaign is still being prepared, already live, temporarily paused, or no longer active.",
        ],
        bullets: [
          "Draft: not yet published",
          "In review: still being finalized or reviewed",
          "Active: currently live",
          "Paused: intentionally stopped without removing the campaign",
          "Archived: no longer part of the active operating set",
        ],
        note: "For published campaigns, active and paused states should reflect the actual status from Meta. SideKick may also show local workflow states like draft or archived, but live campaign status should stay synced with Meta.",
      },
      {
        heading: "Pause and resume behavior",
        body: [
          "Pause is useful when you want to temporarily stop activity without losing the structure and history of the campaign.",
          "Resume brings the campaign back into the active operating flow when you are ready to continue.",
        ],
      },
    ],
    relatedSlugs: ["launch-your-first-campaign", "how-performance-reporting-works", "templates-and-categories"],
  },
  {
    slug: "how-performance-reporting-works",
    title: "How performance reporting works in SideKick",
    section: "performance",
    summary: "Understand what the Performance area shows and how to interpret campaign results.",
    description:
      "Performance reporting in SideKick is focused on campaign outcomes and delivery visibility, not full CRM lifecycle reporting.",
    readTime: "5 min read",
    updatedLabel: "Updated June 2026",
    blocks: [
      {
        heading: "What the Performance area is for",
        body: [
          "Performance is where you review campaign results without mixing those views with CRM pipeline management. That keeps the reporting clean and aligned with SideKick's role as a campaign platform.",
          "Use the Performance area to understand how campaigns are behaving, compare launch outcomes, and spot areas that may need optimization.",
        ],
      },
      {
        heading: "Metrics you will typically see",
        body: [
          "Campaign metrics can include spend, clicks, CTR, CPL, leads captured, and campaign-level delivery outcomes depending on the launch path and connected systems.",
          "For Lead Form campaigns, you may also see useful CRM handoff indicators such as delivered or failed delivery counts by provider.",
        ],
        bullets: [
          "Spend",
          "Clicks",
          "CTR",
          "CPL",
          "Lead volume",
          "CRM delivery outcomes for lead-form handoff",
        ],
      },
      {
        heading: "What Performance does not replace",
        body: [
          "Performance helps you understand marketing outcomes, but it does not replace your CRM for longer-term sales pipeline tracking.",
          "If you need to see whether a lead advanced to later sales stages, use the connected CRM where that process is managed.",
        ],
      },
    ],
    relatedSlugs: ["campaign-previews-and-statuses", "how-crm-handoff-works", "launch-your-first-campaign"],
  },
  {
    slug: "connect-meta-and-crms",
    title: "How to connect Meta, GoHighLevel, and HubSpot",
    section: "integrations",
    summary: "Set up the connected accounts SideKick needs for campaign launch and CRM handoff.",
    description:
      "Integrations are managed at the workspace level so the right business has the right connected accounts and delivery destinations.",
    readTime: "6 min read",
    updatedLabel: "Updated June 2026",
    blocks: [
      {
        heading: "Where integrations live",
        body: [
          "Integrations live inside Workspace Settings so account connection feels like workspace configuration instead of a separate operational product area.",
          "This is where you connect Meta, GoHighLevel, and HubSpot and review the current status of those connections.",
        ],
      },
      {
        heading: "Meta connection basics",
        body: [
          "Meta connection is used for campaign launch and asset selection. Once connected, you can review available ad accounts, Pages, and related assets under the Meta section.",
          "If the workspace loses permissions or account access changes, reconnecting Meta refreshes that connection.",
        ],
      },
      {
        heading: "GoHighLevel connection basics",
        body: [
          "GoHighLevel uses a connect flow that feels closer to a standard install or OAuth connection. Once connected, the workspace can deliver eligible lead submissions into that CRM destination.",
        ],
      },
      {
        heading: "HubSpot connection basics",
        body: [
          "HubSpot is also managed as a workspace-level CRM connection. Once connected, SideKick can use that account for CRM handoff on supported lead capture flows.",
        ],
      },
      {
        heading: "What to verify after connecting",
        body: [
          "After connecting an account, confirm the status shows Connected and review any available destination or sync information inside Workspace Settings.",
        ],
        bullets: [
          "Connection status is Connected",
          "Workspace is the correct one",
          "The CRM should receive eligible Meta Lead Form submissions",
          "Recent sync or delivery activity looks healthy",
        ],
      },
    ],
    relatedSlugs: ["how-crm-handoff-works", "workspace-basics", "support-and-troubleshooting"],
  },
  {
    slug: "how-crm-handoff-works",
    title: "How SideKick sends leads to your CRM",
    section: "crm-handoff",
    summary: "See how SideKick captures, normalizes, and sends Meta Lead Form submissions to your connected CRM.",
    description:
      "For Meta Lead Form campaigns, SideKick saves the lead in your workspace, connects it to the right campaign, and can also send it to connected CRMs like GoHighLevel or HubSpot.",
    readTime: "7 min read",
    updatedLabel: "Updated June 2026",
    blocks: [
      {
        heading: "What happens when a lead is submitted",
        body: [
          "When a Meta Lead Form submission is received, SideKick captures the lead, normalizes the available contact and campaign data, and associates it with the correct workspace and campaign context.",
          "That normalized lead record is then delivered to the connected CRM providers for the workspace.",
        ],
        steps: [
          "Meta lead is received by webhook or recovery sync.",
          "SideKick normalizes the lead fields and campaign context.",
          "The workspace's connected CRM providers are identified.",
          "SideKick attempts delivery to each connected provider.",
          "Delivery success or failure is logged independently per provider.",
        ],
      },
      {
        heading: "What lead data is included",
        body: [
          "The internal delivery model keeps enough context for safe delivery and troubleshooting without adding unnecessary CRM complexity to the campaign workspace.",
        ],
        bullets: [
          "Workspace ID",
          "Campaign ID",
          "Template ID when available",
          "Meta lead ID",
          "Meta form ID",
          "Meta page ID",
          "Name, email, and phone when available",
          "Custom answers",
          "Source and created time",
        ],
      },
      {
        heading: "How multi-CRM delivery works",
        body: [
          "If a workspace has multiple CRM connections, SideKick attempts delivery to all connected CRM providers instead of forcing a single default selection.",
          "A delivery failure in one CRM does not block successful delivery in another. Each provider keeps its own delivery record and retry status.",
        ],
      },
      {
        heading: "Retries, failures, and recovery",
        body: [
          "If delivery fails for a provider, SideKick logs the failure and keeps it retryable. This prevents silent lead loss and makes it easier to recover from temporary provider or auth issues.",
          "Recovery sync and recent delivery status in Workspace Settings help you monitor whether lead-form handoff is working as expected.",
        ],
      },
    ],
    relatedSlugs: ["connect-meta-and-crms", "support-and-troubleshooting", "how-performance-reporting-works"],
  },
  {
    slug: "account-and-workspace-settings",
    title: "Account settings, workspace settings, and images",
    section: "billing-account-settings",
    summary: "A practical overview of what belongs to your profile versus what belongs to the workspace.",
    description:
      "SideKick separates personal account settings from workspace settings so businesses can keep branding and operating configuration in the right place.",
    readTime: "4 min read",
    updatedLabel: "Updated June 2026",
    blocks: [
      {
        heading: "Profile settings",
        body: [
          "Profile settings are for your personal account details such as name and profile image. These appear in account-level parts of the app.",
        ],
      },
      {
        heading: "Workspace settings",
        body: [
          "Workspace settings are for business identity and workspace-level configuration such as branding, connected accounts, and CRM handoff behavior.",
          "Use workspace settings when you are updating something that should apply to the business context rather than just your personal profile.",
        ],
      },
      {
        heading: "Images and branding",
        body: [
          "A profile image helps personalize your account, while workspace images and logos help the business stay recognizable across previews and operational views.",
          "Keep these updated before major campaign activity so previews and settings reflect the current business identity.",
        ],
      },
      {
        heading: "Billing and account housekeeping",
        body: [
          "If billing or account access needs attention, keep those requests clearly separated from campaign troubleshooting when opening a support ticket. That helps the SideKick team route the request faster.",
        ],
      },
    ],
    relatedSlugs: ["workspace-basics", "support-and-troubleshooting", "sidekick-overview"],
  },
  {
    slug: "support-and-troubleshooting",
    title: "Support tickets, common issues, and troubleshooting steps",
    section: "support-troubleshooting",
    summary: "What to check first, when to reconnect, and how to get help effectively.",
    description:
      "Support inside SideKick is designed to stay simple for users while still giving the team enough workspace context to help quickly.",
    readTime: "6 min read",
    updatedLabel: "Updated June 2026",
    blocks: [
      {
        heading: "How support tickets work",
        body: [
          "You can open a ticket from the support area and continue the conversation in a threaded view. Ticket submissions include useful workspace context so the SideKick team can understand where the request came from.",
          "Support tickets are best for product issues, setup questions, CRM handoff questions, and launch-related troubleshooting.",
        ],
      },
      {
        heading: "Common issues to check first",
        body: [
          "Before opening a ticket, confirm that the correct workspace is active and that key connected accounts still show Connected inside Workspace Settings.",
        ],
        bullets: [
          "Meta connection needs reconnect",
          "CRM account shows disconnected or expired",
          "The wrong workspace is active",
          "A campaign is still draft instead of live",
          "Lead-form handoff needs a retry after a provider error",
        ],
      },
      {
        heading: "Best information to include in a ticket",
        body: [
          "A short subject, the correct category, the urgency level, and a clear description of what you expected versus what happened will usually speed up support the most.",
        ],
        steps: [
          "Say what action you were taking.",
          "Say what you expected to happen.",
          "Say what happened instead.",
          "Mention the campaign, workspace, or integration involved.",
        ],
      },
      {
        heading: "When to use email support",
        body: [
          "If you need to contact the team outside the app or want to send a quick message directly, email support is still a useful option. Tickets are better when you want a tracked thread tied to the workspace context.",
        ],
      },
    ],
    relatedSlugs: ["account-and-workspace-settings", "connect-meta-and-crms", "how-crm-handoff-works"],
  },
  {
    slug: "sidekick-faq",
    title: "SideKick FAQ",
    section: "faq",
    summary: "Short answers to common questions about workspaces, launch, CRM handoff, and support.",
    description:
      "Use this page when you need quick clarification on the most common SideKick questions without reading a full how-to article.",
    readTime: "4 min read",
    updatedLabel: "Updated June 2026",
    blocks: [
      {
        heading: "Does SideKick replace my CRM?",
        body: [
          "No. SideKick gives you simple lead management for your campaigns — capture, status tracking, and follow-up. For deeper pipeline management, connect a CRM like GoHighLevel or HubSpot and SideKick will send new leads there too.",
        ],
      },
      {
        heading: "Can one workspace send leads to more than one CRM?",
        body: [
          "Yes. For supported Meta Lead Form flows, SideKick can send eligible leads to all connected CRM providers for that workspace.",
        ],
      },
      {
        heading: "Where do I connect Meta and my CRM accounts?",
        body: [
          "Connected accounts live in Workspace Settings so setup stays tied to the correct workspace.",
        ],
      },
      {
        heading: "Which campaign types currently use CRM handoff?",
        body: [
          "The current automated CRM handoff flow is built for Meta Lead Form campaigns.",
        ],
      },
      {
        heading: "Where do I get help?",
        body: [
          "You can browse the Academy, open a support ticket, or email support directly depending on what you need.",
        ],
      },
    ],
    relatedSlugs: ["sidekick-overview", "how-crm-handoff-works", "support-and-troubleshooting"],
  },
];

export const academyArticleMap = Object.fromEntries(academyArticles.map((article) => [article.slug, article])) as Record<
  string,
  AcademyArticle
>;

export const academyArticlesBySection = academySections.map((section) => ({
  ...section,
  articles: academyArticles.filter((article) => article.section === section.key),
}));

export function getAcademyArticle(slug: string) {
  return academyArticleMap[slug] || null;
}

export function getAcademyRelatedArticles(article: AcademyArticle) {
  return article.relatedSlugs
    .map((slug) => academyArticleMap[slug])
    .filter((related): related is AcademyArticle => Boolean(related));
}
