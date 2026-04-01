'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const capabilityCards = [
  {
    title: 'Operations in one place',
    description:
      'Manage students, faculty, subjects, approvals, and activity history from one operational workspace.',
    accent: 'from-sky-500/15 to-cyan-400/10',
  },
  {
    title: 'Performance intelligence',
    description:
      'Spot weak subjects, risk patterns, attendance drift, and trend movement without manual spreadsheet work.',
    accent: 'from-violet-500/15 to-indigo-400/10',
  },
  {
    title: 'Role-aware experience',
    description:
      'Admins, faculty, students, and pending viewers each see the right workflows, permissions, and visibility.',
    accent: 'from-emerald-500/15 to-teal-400/10',
  },
];

const highlights = [
  'Approval workflow and account governance',
  'Dashboard analytics with reviewer-friendly visuals',
  'Faculty and subject ownership mapping',
  'Student profiles with academic context',
];

const previewCards = [
  {
    title: 'Executive dashboard',
    subtitle: 'KPI summary, weak segments, and intervention signals',
    image: '/docs/preview-dashboard.svg',
  },
  {
    title: 'Student operations',
    subtitle: 'Searchable records with academic and demographic context',
    image: '/docs/preview-students.svg',
  },
  {
    title: 'Performance workspace',
    subtitle: 'Semester records, grades, attendance, and analytics',
    image: '/docs/preview-performance.svg',
  },
];

const storySteps = [
  {
    eyebrow: 'Signal intake',
    title: 'Capture governance and academic movement in one feed',
    description:
      'Approvals, student changes, faculty ownership, subject planning, and risk signals move through one operational stream instead of disconnected screens.',
    metric: '12 live signals',
    detail: 'Approvals, imports, health, performance drift',
  },
  {
    eyebrow: 'Context layering',
    title: 'Surface the next action with spatial context',
    description:
      'Each layer adds operational meaning: who owns the issue, what changed, which student groups are affected, and where the team should intervene next.',
    metric: '3 context layers',
    detail: 'Operations, analytics, intervention',
  },
  {
    eyebrow: 'Collaborative review',
    title: 'Make cross-team decisions feel coordinated',
    description:
      'Admins, faculty, and reviewers align around the same signals with motion that suggests handoff, validation, and shared visibility rather than decorative effects.',
    metric: '4 role lanes',
    detail: 'Admin, faculty, student, reviewer',
  },
];

const trustStats = [
  { value: '4', label: 'role types supported' },
  { value: '10+', label: 'academic workflows covered' },
  { value: '1', label: 'ready local demo environment' },
];

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeStoryStep, setActiveStoryStep] = useState(0);
  const [heroOffset, setHeroOffset] = useState(0);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [loading, router, user]);

  useEffect(() => {
    const handleScroll = () => {
      setHeroOffset(Math.min(window.scrollY * 0.08, 28));
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const steps = Array.from(document.querySelectorAll<HTMLElement>('[data-story-step]'));
    if (!steps.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;

        const target = visible.target as HTMLElement;
        const nextStep = Number(target.dataset.storyStep || 0);
        setActiveStoryStep(nextStep);
      },
      {
        threshold: [0.35, 0.55, 0.75],
        rootMargin: '-15% 0px -20% 0px',
      }
    );

    steps.forEach((step) => observer.observe(step));
    return () => observer.disconnect();
  }, []);

  if (loading) {
    return (
      <div className="brand-app-surface min-h-screen">
        <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-12 sm:px-6">
          <div className="w-full max-w-xl rounded-[28px] border border-white/80 bg-white/90 p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur sm:p-10">
            <div className="mx-auto h-14 w-14 animate-pulse rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700" />
            <h1 className="mt-6 text-2xl font-semibold text-slate-900 sm:text-[1.75rem]">Preparing your workspace</h1>
            <p className="mt-3 text-sm text-slate-600">
              Checking authentication and loading the Smart Performance Intelligence Dashboard experience.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="brand-app-surface min-h-screen text-slate-900">
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[1120px] bg-[linear-gradient(180deg,_rgba(8,18,38,0.98)_0%,_rgba(15,35,84,0.97)_72%,_rgba(15,35,84,0.94)_88%,_rgba(15,35,84,0.82)_100%)] sm:h-[1060px] lg:h-[980px] xl:h-[900px]" />
        <div
          className="absolute inset-0 will-change-transform"
          style={{ transform: `translateY(${heroOffset}px)` }}
        >
          <div className="absolute left-[-10%] top-[-8%] h-72 w-72 rounded-full bg-sky-400/25 blur-3xl" />
          <div className="absolute right-[-6%] top-[8%] h-80 w-80 rounded-full bg-blue-500/25 blur-3xl" />
          <div className="absolute bottom-[-16%] left-[28%] h-72 w-72 rounded-full bg-violet-400/15 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 sm:pb-24 sm:pt-8 lg:px-8 lg:pb-28">
          <header className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/6 px-4 py-4 text-white shadow-[0_18px_60px_rgba(2,6,23,0.22)] backdrop-blur sm:rounded-[28px] sm:px-5 sm:py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="max-w-[16rem] text-[11px] font-semibold uppercase leading-5 tracking-[0.28em] text-sky-100 sm:max-w-none sm:text-xs sm:tracking-[0.38em]">
                Smart Performance Intelligence Dashboard
              </p>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-200/90 sm:text-[1.05rem]">
                Academic operations, governance, and analytics in one product.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/login"
                className="rounded-full border border-white/20 bg-white/5 px-5 py-3 text-center text-sm font-medium text-white transition hover:bg-white/10 sm:px-6 sm:py-2.5"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-white px-5 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-slate-100 sm:px-6 sm:py-2.5"
              >
                Request access
              </Link>
            </div>
          </header>

          <div className="mt-10 grid gap-8 xl:grid-cols-[1.02fr_0.98fr] xl:items-start">
            <div className="text-white">
              <p className="inline-flex max-w-full rounded-full border border-sky-200/15 bg-white/8 px-4 py-2 text-[11px] font-semibold uppercase leading-5 tracking-[0.22em] text-sky-100 sm:text-xs sm:tracking-[0.26em]">
                Submission-ready academic platform
              </p>
              <h1 className="mt-6 max-w-4xl text-[2.45rem] font-bold leading-[0.98] tracking-[-0.05em] text-white drop-shadow-[0_12px_24px_rgba(2,6,23,0.28)] sm:text-5xl lg:text-6xl xl:text-[4.5rem]">
                Academic performance, faculty oversight, and student operations in one polished system.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-100/95 drop-shadow-[0_8px_18px_rgba(2,6,23,0.18)] sm:text-lg sm:leading-8">
                SPID turns scattered academic records into a clear operating layer for institutions. It combines approvals,
                subject planning, performance tracking, and risk visibility into one experience that feels cohesive in a demo.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                <Link
                  href="/login"
                  className="rounded-2xl bg-white px-6 py-3 text-center text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(255,255,255,0.15)] transition hover:-translate-y-0.5 hover:bg-slate-100 sm:min-w-[12rem]"
                >
                  Explore the product
                </Link>
                <a
                  href="#product-preview"
                  className="rounded-2xl border border-white/20 bg-slate-900/30 px-6 py-3 text-center text-sm font-semibold text-white shadow-[0_18px_40px_rgba(2,6,23,0.18)] transition hover:bg-slate-900/40 sm:min-w-[12rem]"
                >
                  View interface preview
                </a>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {trustStats.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-3xl border border-white/12 bg-slate-950/38 p-5 shadow-[0_12px_40px_rgba(2,6,23,0.18)] backdrop-blur"
                  >
                    <p className="text-3xl font-bold text-white">{item.value}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-100">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/12 bg-slate-950/55 p-3 shadow-[0_30px_100px_rgba(2,6,23,0.35)] backdrop-blur sm:rounded-[32px] sm:p-4 xl:mt-6 xl:sticky xl:top-10">
              <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,_rgba(10,15,35,0.98)_0%,_rgba(10,19,43,0.96)_100%)] p-4 text-white sm:rounded-[28px] sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-200 sm:text-xs sm:tracking-[0.32em]">Platform snapshot</p>
                    <h2 className="mt-3 text-2xl font-semibold leading-tight sm:text-3xl">Built for review, demo, and discussion</h2>
                  </div>
                  <div className="w-fit rounded-2xl border border-white/8 bg-white/8 px-4 py-3 text-left sm:text-right">
                    <p className="text-xs text-slate-300">Focus</p>
                    <p className="mt-1 text-base font-semibold">Operations + analytics</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  {highlights.map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-400/18 text-xs font-bold text-emerald-200">
                        OK
                      </span>
                      <p className="text-sm leading-6 text-slate-100/92">{item}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-3xl border border-sky-300/16 bg-[linear-gradient(135deg,_rgba(8,35,68,0.95)_0%,_rgba(6,25,49,0.98)_100%)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">Demo accounts</p>
                  <p className="mt-3 text-sm leading-7 text-white">Seeded admin, faculty, and student flows are available for local review.</p>
                  <p className="mt-2 text-sm text-slate-300">Admin: admin@xeno.com | Faculty: faculty@spid.com | Student: aarya.sharma@spid.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700 sm:text-xs sm:tracking-[0.3em]">Core capabilities</p>
            <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-slate-950 sm:text-4xl">What makes the product feel complete</h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-slate-600">
            The landing page now leads with product value, then backs it up with clear workflows, seeded data, and interface evidence.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {capabilityCards.map((card) => (
            <article
              key={card.title}
              className={`rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)] p-7 shadow-[0_18px_50px_rgba(15,23,42,0.07)] transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)]`}
            >
              <div className={`inline-flex rounded-full bg-gradient-to-r ${card.accent} px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-800`}>
                Capability
              </div>
              <h3 className="mt-6 text-3xl font-semibold tracking-[-0.03em] text-slate-950">{card.title}</h3>
              <p className="mt-4 text-base leading-8 text-slate-600">{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
        <div className="rounded-[28px] border border-slate-200/90 bg-[linear-gradient(180deg,_rgba(255,255,255,0.92)_0%,_rgba(240,247,255,0.95)_100%)] p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700 sm:text-xs sm:tracking-[0.3em]">
                Scrollytelling system
              </p>
              <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-slate-950 sm:text-4xl">
                A narrative layer that feels like enterprise software
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
                This section uses motion as product communication: progressive context, spatial layering, and collaborative signals that
                make the platform feel sophisticated without feeling theatrical.
              </p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-white/90 px-4 py-3 text-sm text-slate-600 shadow-sm">
              Motion style: restrained, data-first, reviewer-safe
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div className="lg:sticky lg:top-8">
              <div className="story-visual-shell rounded-[30px] border border-slate-900/10 bg-[linear-gradient(180deg,_#071124_0%,_#0c1b3b_54%,_#14295b_100%)] p-5 text-white shadow-[0_28px_80px_rgba(15,23,42,0.24)] sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-sky-200">Interactive scene</p>
                    <h3 className="mt-3 text-2xl font-semibold leading-tight sm:text-3xl">
                      {storySteps[activeStoryStep].title}
                    </h3>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-right">
                    <p className="text-xs text-slate-300">Active metric</p>
                    <p className="mt-1 text-base font-semibold text-white">{storySteps[activeStoryStep].metric}</p>
                  </div>
                </div>

                <div className="story-visual-stage mt-8 rounded-[26px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_34%),linear-gradient(180deg,_rgba(255,255,255,0.04)_0%,_rgba(255,255,255,0.02)_100%)] p-4 sm:p-5">
                  <div className="story-grid">
                    <div className={`story-node ${activeStoryStep === 0 ? 'story-node-active' : ''}`}>
                      <span>Signals</span>
                    </div>
                    <div className={`story-node ${activeStoryStep === 1 ? 'story-node-active' : ''}`}>
                      <span>Context</span>
                    </div>
                    <div className={`story-node ${activeStoryStep === 2 ? 'story-node-active' : ''}`}>
                      <span>Review</span>
                    </div>
                    <div className="story-node story-node-secondary">
                      <span>Faculty</span>
                    </div>
                    <div className="story-node story-node-secondary">
                      <span>Ops</span>
                    </div>
                    <div className="story-node story-node-secondary">
                      <span>Risk</span>
                    </div>
                  </div>

                  <div className="story-beam story-beam-one" />
                  <div className="story-beam story-beam-two" />
                  <div className="story-beam story-beam-three" />

                  <div className="story-holo mt-6 rounded-[24px] border border-sky-200/10 bg-slate-950/35 p-4 backdrop-blur sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.26em] text-sky-200">{storySteps[activeStoryStep].eyebrow}</p>
                        <p className="mt-2 text-lg font-semibold text-white">{storySteps[activeStoryStep].detail}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="story-pill">Admin lane</span>
                        <span className="story-pill">Faculty lane</span>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Latency</p>
                        <p className="mt-2 text-2xl font-semibold text-white">Live</p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Coordination</p>
                        <p className="mt-2 text-2xl font-semibold text-white">Shared</p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-white/6 p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Motion</p>
                        <p className="mt-2 text-2xl font-semibold text-white">Spatial</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {storySteps.map((step, index) => (
                <article
                  key={step.title}
                  data-story-step={index}
                  className={`rounded-[28px] border p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition duration-300 sm:p-7 ${
                    activeStoryStep === index
                      ? 'border-sky-200 bg-white shadow-[0_22px_60px_rgba(37,99,235,0.10)]'
                      : 'border-slate-200 bg-white/85'
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700 sm:text-xs sm:tracking-[0.3em]">
                        {step.eyebrow}
                      </p>
                      <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{step.title}</h3>
                      <p className="mt-4 text-base leading-8 text-slate-600">{step.description}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                      {step.metric}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="product-preview" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-700 sm:text-xs sm:tracking-[0.3em]">Interface preview</p>
            <h2 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-slate-950 sm:text-4xl">A stronger first impression for reviewers</h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">
              Reviewers should immediately see a presentable product story, seeded operational data, and screens that look ready for discussion.
            </p>
          </div>
          <Link href="/login" className="text-base font-semibold text-sky-700 hover:text-sky-800">
            Open sign-in {'->'}
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          {previewCards.map((card) => (
            <article
              key={card.title}
              className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
            >
              <div className="border-b border-slate-200 bg-slate-950 px-6 py-6 text-white">
                <h3 className="text-2xl font-semibold tracking-[-0.03em]">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{card.subtitle}</p>
              </div>
              <div className="bg-[linear-gradient(180deg,_#eef4fb_0%,_#f8fbff_100%)] p-5">
                <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-inner">
                  <Image
                    src={card.image}
                    alt={card.title}
                    width={1280}
                    height={720}
                    className="h-auto w-full"
                    priority={card.title === 'Executive dashboard'}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
