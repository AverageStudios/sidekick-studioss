"use client";

import { Database, Download, Mail } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

const destinations = [
  {
    icon: Mail,
    title: "Email alert",
    detail: "The moment a lead lands, you and your team know.",
  },
  {
    icon: Download,
    title: "CSV export",
    detail: "Your full lead list, downloadable any time.",
  },
  {
    icon: Database,
    title: "Your CRM",
    detail: "Keep working leads in the system you already run.",
  },
];

function FlowDiagram() {
  return (
    <svg
      viewBox="0 0 760 300"
      className="hidden w-full sm:block"
      role="img"
      aria-label="Diagram: Meta lead forms feed SideKick, which hands leads to email alerts, CSV export, and your CRM"
    >
      <g aria-hidden="true">
        {/* connector paths */}
        <path d="M196 150 H 290" className="site-flow-line" stroke="rgba(101,88,246,0.55)" strokeWidth="1.5" fill="none" />
        <path d="M480 150 C 530 150 528 60 578 60" className="site-flow-line" stroke="rgba(101,88,246,0.55)" strokeWidth="1.5" fill="none" />
        <path d="M480 150 H 578" className="site-flow-line" stroke="rgba(101,88,246,0.55)" strokeWidth="1.5" fill="none" />
        <path d="M480 150 C 530 150 528 240 578 240" className="site-flow-line" stroke="rgba(101,88,246,0.55)" strokeWidth="1.5" fill="none" />

        {/* Meta lead form node */}
        <rect x="26" y="112" width="170" height="76" rx="14" fill="#ffffff" stroke="rgba(15,17,22,0.12)" />
        <circle cx="52" cy="140" r="10" fill="#1877f2" />
        <text x="48.2" y="144.5" fontSize="13" fontWeight="700" fill="#ffffff">f</text>
        <text x="70" y="145" fontSize="14" fontWeight="600" fill="#0f1116">Meta lead form</text>
        <text x="70" y="166" fontSize="11.5" fill="rgba(15,17,22,0.55)">Facebook · Instagram</text>

        {/* SideKick node */}
        <rect x="290" y="96" width="190" height="108" rx="16" fill="#ffffff" stroke="rgba(101,88,246,0.55)" strokeWidth="1.5" />
        <rect x="290" y="96" width="190" height="108" rx="16" fill="rgba(101,88,246,0.04)" />
        <rect x="314" y="120" width="24" height="24" rx="7" fill="#1f1337" />
        <text x="322" y="137" fontSize="12" fontWeight="700" fill="#ffffff">S</text>
        <text x="348" y="138" fontSize="15" fontWeight="600" fill="#0f1116">SideKick</text>
        <text x="314" y="168" fontSize="11.5" fill="rgba(15,17,22,0.6)">Campaign runs here.</text>
        <text x="314" y="185" fontSize="11.5" fill="rgba(15,17,22,0.6)">Every lead captured and tracked.</text>

        {/* destination nodes */}
        {[
          { y: 28, title: "Email alert", detail: "Instant, on every lead" },
          { y: 118, title: "CSV export", detail: "Your data, any time" },
          { y: 208, title: "Your CRM", detail: "Keep your workflow" },
        ].map((node) => (
          <g key={node.title}>
            <rect x="578" y={node.y} width="156" height="64" rx="13" fill="#ffffff" stroke="rgba(15,17,22,0.12)" />
            <text x="598" y={node.y + 28} fontSize="13.5" fontWeight="600" fill="#0f1116">
              {node.title}
            </text>
            <text x="598" y={node.y + 47} fontSize="11" fill="rgba(15,17,22,0.55)">
              {node.detail}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

function FlowDiagramMobile() {
  return (
    <div className="sm:hidden" aria-hidden="true">
      <div className="rounded-2xl border border-[rgba(15,17,22,0.1)] bg-white p-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1877f2] text-xs font-bold text-white">f</span>
          <div>
            <p className="text-sm font-semibold text-[#0f1116]">Meta lead form</p>
            <p className="text-xs text-[rgba(15,17,22,0.55)]">Facebook · Instagram</p>
          </div>
        </div>
      </div>
      <div className="mx-auto h-6 w-px border-l border-dashed border-[rgba(101,88,246,0.5)]" />
      <div className="rounded-2xl border border-[rgba(101,88,246,0.5)] bg-[rgba(101,88,246,0.04)] p-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1f1337] text-xs font-bold text-white">S</span>
          <div>
            <p className="text-sm font-semibold text-[#0f1116]">SideKick</p>
            <p className="text-xs text-[rgba(15,17,22,0.55)]">Campaign runs here. Every lead captured.</p>
          </div>
        </div>
      </div>
      <div className="mx-auto h-6 w-px border-l border-dashed border-[rgba(101,88,246,0.5)]" />
      <div className="grid gap-2.5">
        {destinations.map((destination) => (
          <div key={destination.title} className="rounded-2xl border border-[rgba(15,17,22,0.1)] bg-white px-4 py-3">
            <p className="text-sm font-semibold text-[#0f1116]">{destination.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HomeCrmFlow() {
  return (
    <section className="border-y border-[rgba(15,17,22,0.07)] bg-[rgba(255,255,255,0.55)]">
      <div className="site-container py-20 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.46fr_0.54fr] lg:items-center lg:gap-16">
          <div>
            <Reveal>
              <h2 className="site-h2">Leads land in the tools you already use</h2>
              <p className="site-lead mt-4">
                SideKick is not another CRM to migrate to. Campaigns run here, and
                every lead stays yours: alerted to your inbox, exportable as CSV,
                and ready to hand off to the system your business already runs on.
              </p>
            </Reveal>

            <div className="mt-8 space-y-5">
              {destinations.map((destination, index) => {
                const Icon = destination.icon;

                return (
                  <Reveal key={destination.title} delay={0.12 + index * 0.1}>
                    <div className="flex items-start gap-3.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-[rgba(15,17,22,0.1)] bg-white text-[var(--public-accent)] shadow-[0_1px_2px_rgba(15,17,22,0.05)]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-[15px] font-semibold text-[var(--public-text)]">
                          {destination.title}
                        </p>
                        <p className="site-body mt-0.5 max-w-[40ch]">{destination.detail}</p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>

          <Reveal delay={0.15} amount={0.35}>
            <FlowDiagram />
            <FlowDiagramMobile />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
