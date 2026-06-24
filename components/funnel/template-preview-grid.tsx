import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { FUNNEL_TEMPLATES_HREF } from "@/components/funnel/funnel-links";

type ImageTemplateCard = {
  category: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
};

type BeforeAfterTemplateCard = {
  category: string;
  title: string;
  description: string;
  beforeImage: string;
  afterImage: string;
};

type TemplateCard = ImageTemplateCard | BeforeAfterTemplateCard;

const TEMPLATES: TemplateCard[] = [
  {
    category: "Car detailing",
    title: "Premium Exterior Detail",
    description: "A polished exterior-detail offer designed to stop the scroll and turn local interest into booked jobs.",
    image: "/template-creatives/car-detailing/because-clean-turns-heads.png",
    imageAlt: "Car detailing campaign creative preview",
  },
  {
    category: "Car detailing",
    title: "Interior Reset Special",
    description: "A before-and-after style campaign for stains, odors, and interior cleanup offers that need clear visual proof.",
    beforeImage: "/demo/before-1.svg",
    afterImage: "/demo/after-1.svg",
  },
  {
    category: "Car detailing",
    title: "Ceramic Coating Push",
    description: "A premium coating offer with clean contrast, premium positioning, and a stronger book-now feel.",
    beforeImage: "/demo/before-2.svg",
    afterImage: "/demo/after-2.svg",
  },
];

export function TemplatePreviewGrid() {
  return (
    <section className="px-5 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="site-h2">Start from templates built for real small-business offers.</h2>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((template, index) => (
            <Reveal key={template.title} delay={Math.min(index % 3, 2) * 0.08} amount={0.15}>
              <div className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-[rgba(15,17,22,0.1)] bg-white shadow-[0_1px_2px_rgba(15,17,22,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_56px_-22px_rgba(21,16,31,0.2)]">
                <div className="relative aspect-[16/10] overflow-hidden">
                  {isImageTemplateCard(template) ? (
                    <>
                      <Image
                        src={template.image}
                        alt={template.imageAlt}
                        fill
                        sizes="(max-width: 1024px) 100vw, 33vw"
                        className="object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,10,9,0.04)_0%,rgba(12,10,9,0.12)_38%,rgba(12,10,9,0.72)_100%)]" />
                    </>
                  ) : (
                    <div className="grid h-full grid-cols-2 bg-[linear-gradient(160deg,#f8fafc_0%,#eef2ff_50%,#ffffff_100%)]">
                      <div className="relative overflow-hidden border-r border-white/60">
                        <Image
                          src={template.beforeImage}
                          alt={`${template.title} before preview`}
                          fill
                          sizes="(max-width: 1024px) 50vw, 16vw"
                          className="object-cover"
                        />
                      </div>
                      <div className="relative overflow-hidden">
                        <Image
                          src={template.afterImage}
                          alt={`${template.title} after preview`}
                          fill
                          sizes="(max-width: 1024px) 50vw, 16vw"
                          className="object-cover"
                        />
                      </div>
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(15,17,22,0.08)_100%)]" />
                    </div>
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/90">
                    {template.category}
                  </span>
                  <p className="absolute inset-x-4 bottom-4 font-heading text-[15px] font-semibold leading-tight text-white">
                    {template.title}
                  </p>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="site-body line-clamp-2">{template.description}</p>
                  <Link
                    href={FUNNEL_TEMPLATES_HREF}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--public-accent)] transition-colors hover:text-[var(--public-accent-strong)]"
                  >
                    Preview template
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function isImageTemplateCard(template: TemplateCard): template is ImageTemplateCard {
  return "image" in template;
}
