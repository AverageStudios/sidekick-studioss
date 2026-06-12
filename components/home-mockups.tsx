import {
  ChevronDown,
  Download,
  Gauge,
  LayoutDashboard,
  Layers3,
  Mail,
  Megaphone,
  Phone,
  Search,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Static recreations of SideKick app screens, used as product imagery on the
 * marketing site. They render as decorated figures (role="img"), never as
 * interactive UI.
 */

const ink = "text-[#0f1116]";
const mutedText = "text-[rgba(15,17,22,0.55)]";
const hairline = "border-[rgba(15,17,22,0.08)]";

function StatusPill({ tone, children }: { tone: "violet" | "amber" | "emerald"; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
        tone === "violet" && "bg-[rgba(101,88,246,0.1)] text-[#5646ec]",
        tone === "amber" && "bg-amber-100 text-amber-700",
        tone === "emerald" && "bg-emerald-100 text-emerald-700",
      )}
    >
      {children}
    </span>
  );
}

export function AdPreviewCard({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border bg-white", hairline, className)}>
      <div className="flex items-center gap-2.5 px-3.5 py-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1f1337] text-[10px] font-bold text-white">
          PA
        </span>
        <div>
          <p className={cn("text-[12px] font-semibold leading-tight", ink)}>Prestige Auto Spa</p>
          <p className={cn("text-[10px]", mutedText)}>Sponsored</p>
        </div>
      </div>
      <p className={cn("px-3.5 pb-2.5 text-[11px] leading-snug", ink)}>
        Your car deserves better than a drive-through wash. This month only: $40 off a full interior
        and exterior detail.
      </p>
      <div className="relative flex aspect-[1.91/1] flex-col items-start justify-end bg-[linear-gradient(135deg,#241a3d_0%,#3b2a66_55%,#5646ec_130%)] p-4">
        <p className="font-heading text-[17px] font-semibold leading-tight tracking-[-0.02em] text-white">
          Spring Detail Special
        </p>
        <p className="mt-0.5 text-[11px] font-medium text-white/75">$40 off through June 30</p>
      </div>
      <div className="flex items-center justify-between gap-3 bg-[#f3f4f7] px-3.5 py-2.5">
        <div className="min-w-0">
          <p className={cn("text-[9px] font-medium uppercase tracking-wide", mutedText)}>
            prestigeautospa.com
          </p>
          <p className={cn("truncate text-[12px] font-semibold", ink)}>Book your detail this week</p>
        </div>
        <span className="shrink-0 rounded-md bg-[#e3e6eb] px-2.5 py-1.5 text-[11px] font-semibold text-[#0f1116]">
          Book Now
        </span>
      </div>
    </div>
  );
}

export function LaunchMockup() {
  return (
    <div
      role="img"
      aria-label="SideKick campaign launch screen: budget and service area settings beside a live Facebook ad preview"
      className="select-none [&_*]:pointer-events-none"
    >
      <div aria-hidden="true">
        <div className={cn("flex items-center justify-between border-b px-4 py-2.5 sm:px-5", hairline)}>
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#1f1337] text-[8px] font-bold text-white">
              S
            </span>
            <span className={cn("text-[12px] font-semibold", ink)}>Launch campaign</span>
            <span className={cn("hidden text-[12px] sm:inline", mutedText)}>· Spring Detail Special</span>
          </div>
          <div className="flex items-center gap-1.5">
            {["Template", "Budget & area", "Review"].map((step, index) => (
              <span
                key={step}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                  index === 1
                    ? "bg-[rgba(101,88,246,0.1)] text-[#5646ec]"
                    : index === 0
                      ? "text-emerald-600"
                      : mutedText,
                  index !== 1 && "hidden sm:inline",
                )}
              >
                {index === 0 ? "✓ " : ""}
                {step}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1.05fr_0.8fr] lg:gap-5">
          <div className="space-y-3.5">
            <div className={cn("rounded-xl border p-4", hairline)}>
              <div className="flex items-baseline justify-between">
                <p className={cn("text-[12px] font-semibold", ink)}>Daily budget</p>
                <p className={cn("text-[15px] font-bold tracking-tight", ink)}>
                  $25<span className={cn("text-[11px] font-medium", mutedText)}>/day</span>
                </p>
              </div>
              <div className="relative mt-3.5 h-1.5 rounded-full bg-[rgba(15,17,22,0.08)]">
                <div className="absolute inset-y-0 left-0 w-[46%] rounded-full bg-[#6558f6]" />
                <span className="absolute left-[46%] top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[2.5px] border-[#6558f6] bg-white shadow-sm" />
              </div>
              <div className="mt-3 flex gap-1.5">
                {["$15", "$25", "$40"].map((preset, index) => (
                  <span
                    key={preset}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[10px] font-semibold",
                      index === 1
                        ? "border-[#6558f6] bg-[#6558f6] text-white"
                        : cn("bg-white", hairline, mutedText),
                    )}
                  >
                    {preset}
                  </span>
                ))}
              </div>
            </div>

            <div className={cn("rounded-xl border p-4", hairline)}>
              <div className="flex items-center justify-between">
                <p className={cn("text-[12px] font-semibold", ink)}>Service area</p>
                <p className={cn("text-[11px] font-medium", mutedText)}>Mesa, AZ · 15 mi</p>
              </div>
              <div className="relative mt-3 h-[88px] overflow-hidden rounded-lg bg-[linear-gradient(rgba(15,17,22,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(15,17,22,0.05)_1px,transparent_1px),linear-gradient(180deg,#eef0f6,#f6f7fb)] bg-[size:22px_22px,22px_22px,100%_100%]">
                <span className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(101,88,246,0.35)] bg-[rgba(101,88,246,0.12)]" />
                <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#5646ec] shadow" />
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <p className={cn("mb-2 text-[11px] font-semibold uppercase tracking-wide", mutedText)}>
              Ad preview
            </p>
            <AdPreviewCard />
          </div>
        </div>

        <div className={cn("flex items-center justify-between border-t px-4 py-3 sm:px-5", hairline)}>
          <p className={cn("text-[11px]", mutedText)}>
            <span className="sm:hidden">Reach: 6,200–9,800 people</span>
            <span className="hidden sm:inline">Estimated weekly reach: 6,200–9,800 people</span>
          </p>
          <span className="whitespace-nowrap rounded-[10px] bg-[#6558f6] px-3.5 py-2 text-[12px] font-semibold text-white shadow-[0_4px_12px_rgba(101,88,246,0.35)]">
            Continue to review
          </span>
        </div>
      </div>
    </div>
  );
}

function AppSidebar({ active }: { active: "leads" | "dashboard" | "campaigns" | "templates" }) {
  const items = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "campaigns", label: "Campaigns", icon: Megaphone },
    { id: "templates", label: "Templates", icon: Layers3 },
    { id: "leads", label: "Leads", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className={cn("hidden w-[164px] shrink-0 border-r bg-[#fbfafd] p-3 sm:block", hairline)}>
      <div className="flex items-center gap-2 px-1.5 pb-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#1f1337] text-[9px] font-bold text-white">
          S
        </span>
        <div className="min-w-0">
          <p className={cn("truncate text-[11px] font-semibold leading-tight", ink)}>Prestige Auto Spa</p>
          <p className={cn("text-[9px]", mutedText)}>Workspace</p>
        </div>
      </div>
      <div className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === active;
          return (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-medium",
                isActive ? cn("bg-white shadow-sm", ink, "font-semibold") : mutedText,
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", isActive ? "text-[#6558f6]" : "")} />
              {item.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LeadsMockup() {
  const leads = [
    { name: "Alex Morgan", campaign: "Spring Detail Special", time: "2m ago", status: "New", tone: "violet" as const },
    { name: "Jordan Lee", campaign: "Spring Detail Special", time: "1h ago", status: "Contacted", tone: "amber" as const },
    { name: "Priya Patel", campaign: "Interior Cleanup Push", time: "3h ago", status: "Booked", tone: "emerald" as const },
    { name: "Taylor West", campaign: "Spring Detail Special", time: "Yesterday", status: "Booked", tone: "emerald" as const },
    { name: "Sam Carter", campaign: "Interior Cleanup Push", time: "Yesterday", status: "Contacted", tone: "amber" as const },
  ];

  return (
    <div
      role="img"
      aria-label="SideKick leads screen: a table of incoming leads with campaign source and status for each"
      className="select-none [&_*]:pointer-events-none"
    >
      <div aria-hidden="true" className="flex">
        <AppSidebar active="leads" />
        <div className="min-w-0 flex-1 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className={cn("font-heading text-[15px] font-semibold tracking-tight", ink)}>
                Leads
              </p>
              <p className={cn("text-[11px]", mutedText)}>24 leads this month</p>
            </div>
            <span className={cn("flex items-center gap-1.5 rounded-[10px] border bg-white px-3 py-1.5 text-[11px] font-semibold", hairline, ink)}>
              <Download className="h-3 w-3" />
              Export CSV
            </span>
          </div>

          <div className="mt-3.5 flex gap-1.5">
            {[
              { label: "All", count: 24, active: true },
              { label: "New", count: 6 },
              { label: "Contacted", count: 11 },
              { label: "Booked", count: 7 },
            ].map((chip) => (
              <span
                key={chip.label}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                  chip.active ? "bg-[#0f1116] text-white" : cn("border bg-white", hairline, mutedText),
                )}
              >
                {chip.label} {chip.count}
              </span>
            ))}
          </div>

          <div className={cn("mt-3.5 overflow-hidden rounded-xl border", hairline)}>
            <div className={cn("grid grid-cols-[1.2fr_1.3fr_0.7fr_0.7fr] gap-2 border-b bg-[#fbfafd] px-3.5 py-2 text-[10px] font-semibold uppercase tracking-wide", hairline, mutedText)}>
              <span>Name</span>
              <span className="hidden sm:block">Campaign</span>
              <span className="sm:hidden">Source</span>
              <span>Received</span>
              <span>Status</span>
            </div>
            {leads.map((lead, index) => (
              <div
                key={lead.name}
                className={cn(
                  "grid grid-cols-[1.2fr_1.3fr_0.7fr_0.7fr] items-center gap-2 px-3.5 py-2.5",
                  index !== leads.length - 1 && cn("border-b", hairline),
                )}
              >
                <span className={cn("truncate text-[12px] font-semibold", ink)}>{lead.name}</span>
                <span className={cn("truncate text-[11px]", mutedText)}>{lead.campaign}</span>
                <span className={cn("text-[11px]", mutedText)}>{lead.time}</span>
                <span>
                  <StatusPill tone={lead.tone}>{lead.status}</StatusPill>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function FollowUpMockup() {
  const timeline = [
    { title: "Lead captured", detail: "Meta lead form · 2m ago", done: true },
    { title: "Confirmation email sent", detail: "Automatic · just now", done: true },
    { title: "Reminder scheduled", detail: "Tomorrow, 9:00 AM", done: false },
  ];

  return (
    <div
      role="img"
      aria-label="SideKick follow-up screen: a lead's contact details next to an automatic follow-up timeline"
      className="select-none [&_*]:pointer-events-none"
    >
      <div aria-hidden="true" className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_0.95fr] lg:gap-5">
        <div className={cn("rounded-xl border p-4", hairline)}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(101,88,246,0.12)] text-[11px] font-bold text-[#5646ec]">
                AM
              </span>
              <div>
                <p className={cn("text-[13px] font-semibold", ink)}>Alex Morgan</p>
                <p className={cn("text-[10px]", mutedText)}>Spring Detail Special</p>
              </div>
            </div>
            <StatusPill tone="violet">New</StatusPill>
          </div>

          <div className="mt-3.5 space-y-2">
            <p className={cn("flex items-center gap-2 text-[11px] font-medium", ink)}>
              <Phone className="h-3 w-3 text-[#6558f6]" /> (480) 555-0118
            </p>
            <p className={cn("flex items-center gap-2 text-[11px] font-medium", ink)}>
              <Mail className="h-3 w-3 text-[#6558f6]" /> alex.morgan@gmail.com
            </p>
          </div>

          <p className={cn("mt-3.5 rounded-lg bg-[rgba(15,17,22,0.035)] px-3 py-2.5 text-[11px] leading-relaxed", mutedText)}>
            &ldquo;Interested in the interior detail. Could you fit me in this Saturday?&rdquo;
          </p>

          <div className="mt-3.5 flex gap-2">
            <span className="rounded-[10px] bg-[#6558f6] px-3 py-1.5 text-[11px] font-semibold text-white">
              Send reply
            </span>
            <span className={cn("flex items-center gap-1 rounded-[10px] border bg-white px-3 py-1.5 text-[11px] font-semibold", hairline, ink)}>
              Mark contacted
              <ChevronDown className="h-3 w-3" />
            </span>
          </div>
        </div>

        <div className={cn("rounded-xl border p-4", hairline)}>
          <div className="flex items-center justify-between">
            <p className={cn("text-[12px] font-semibold", ink)}>Follow-up</p>
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600">
              <span className="relative flex h-4 w-7 items-center rounded-full bg-emerald-500 px-0.5">
                <span className="ml-auto h-3 w-3 rounded-full bg-white" />
              </span>
              Auto
            </span>
          </div>
          <div className="mt-4 space-y-0">
            {timeline.map((item, index) => (
              <div key={item.title} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full",
                      item.done ? "bg-[#6558f6]" : "border-2 border-[rgba(15,17,22,0.2)] bg-white",
                    )}
                  />
                  {index < timeline.length - 1 ? (
                    <span className="w-px flex-1 bg-[rgba(15,17,22,0.1)]" />
                  ) : null}
                </div>
                <div className="pb-4">
                  <p className={cn("text-[12px] font-semibold leading-tight", ink)}>{item.title}</p>
                  <p className={cn("mt-0.5 text-[10px]", mutedText)}>{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
          <div className={cn("rounded-lg border border-dashed px-3 py-2 text-[10px]", hairline, mutedText)}>
            Replies land here and in your inbox. Nothing waits in a queue you have to remember.
          </div>
        </div>
      </div>
    </div>
  );
}

export function TemplatesMockup() {
  const templates = [
    { name: "Spring Detail Special", meta: "Offer-led · Lead form", offer: "$40 off full detail", featured: true },
    { name: "Interior Cleanup Push", meta: "Seasonal · Lead form", offer: "Interior reset from $129" },
    { name: "Ceramic Coating Intro", meta: "Premium · Lead form", offer: "Free paint assessment" },
  ];

  return (
    <div
      role="img"
      aria-label="SideKick template library: industry filters above ready-to-launch campaign templates"
      className="select-none [&_*]:pointer-events-none"
    >
      <div aria-hidden="true" className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className={cn("font-heading text-[15px] font-semibold tracking-tight", ink)}>
              Template library
            </p>
            <p className={cn("text-[11px]", mutedText)}>Campaigns written for your industry</p>
          </div>
          <span className={cn("flex items-center gap-1.5 rounded-[10px] border bg-white px-3 py-1.5 text-[11px]", hairline, mutedText)}>
            <Search className="h-3 w-3" />
            Search templates
          </span>
        </div>

        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {["Auto detailing", "Cleaning", "Landscaping", "Beauty", "Home services"].map((chip, index) => (
            <span
              key={chip}
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                index === 0 ? "bg-[#0f1116] text-white" : cn("border bg-white", hairline, mutedText),
              )}
            >
              {chip}
            </span>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {templates.map((template) => (
            <div key={template.name} className={cn("overflow-hidden rounded-xl border bg-white", hairline)}>
              <div className="relative flex aspect-[4/3] flex-col justify-end bg-[linear-gradient(150deg,#241a3d_0%,#37265c_60%,#5646ec_140%)] p-3">
                <span className="absolute left-2.5 top-2.5 rounded-full bg-white/14 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-white/85">
                  Ready
                </span>
                <p className="font-heading text-[12px] font-semibold leading-tight text-white">
                  {template.offer}
                </p>
              </div>
              <div className="p-3">
                <p className={cn("text-[12px] font-semibold leading-tight", ink)}>{template.name}</p>
                <p className={cn("mt-0.5 text-[10px]", mutedText)}>{template.meta}</p>
                {template.featured ? (
                  <span className="mt-2.5 block rounded-[10px] bg-[#6558f6] py-1.5 text-center text-[11px] font-semibold text-white">
                    Use this template
                  </span>
                ) : (
                  <span className={cn("mt-2.5 block rounded-[10px] border py-1.5 text-center text-[11px] font-semibold", hairline, ink)}>
                    Preview
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className={cn("mt-4 flex items-center gap-2 rounded-lg bg-[rgba(101,88,246,0.06)] px-3 py-2 text-[10px] font-medium text-[#5646ec]")}>
          <Gauge className="h-3 w-3" />
          Objective, placements, and lead form come preconfigured with every template.
        </div>
      </div>
    </div>
  );
}
