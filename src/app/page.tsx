'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

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

const trustStats = [
  { value: '4', label: 'role types supported' },
  { value: '10+', label: 'academic workflows covered' },
  { value: '1', label: 'ready local demo environment' },
];

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [loading, router, user]);

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
        <div className="absolute inset-x-0 top-0 h-[980px] bg-[linear-gradient(180deg,_rgba(8,18,38,0.98)_0%,_rgba(15,35,84,0.97)_76%,_rgba(15,35,84,0.90)_88%,_rgba(15,35,84,0)_100%)] sm:h-[940px] lg:h-[900px] xl:h-[860px]" />
        <div className="absolute inset-0">
          <div className="absolute left-[-10%] top-[-8%] h-72 w-72 rounded-full bg-sky-400/25 blur-3xl" />
          <div className="absolute right-[-6%] top-[8%] h-80 w-80 rounded-full bg-blue-500/25 blur-3xl" />
          <div className="absolute bottom-[-16%] left-[28%] h-72 w-72 rounded-full bg-violet-400/15 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-8 lg:px-8 lg:pb-28">
          <header className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/6 px-5 py-5 text-white shadow-[0_18px_60px_rgba(2,6,23,0.22)] backdrop-blur md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.38em] text-sky-100">Smart Performance Intelligence Dashboard</p>
              <p className="mt-2 text-sm text-slate-200/90">Academic operations, governance, and analytics in one product.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                Request access
              </Link>
            </div>
          </header>

          <div className="mt-10 grid gap-8 xl:grid-cols-[1.02fr_0.98fr] xl:items-center">
            <div className="text-white">
              <p className="inline-flex rounded-full border border-sky-200/15 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-sky-100">
                Submission-ready academic platform
              </p>
              <h1 className="mt-6 max-w-4xl text-4xl font-bold leading-[1.02] tracking-[-0.04em] text-white drop-shadow-[0_12px_24px_rgba(2,6,23,0.28)] sm:text-5xl lg:text-6xl xl:text-[4.5rem]">
                Academic performance, faculty oversight, and student operations in one polished system.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-100/95 drop-shadow-[0_8px_18px_rgba(2,6,23,0.18)] sm:text-lg">
                SPID turns scattered academic records into a clear operating layer for institutions. It combines approvals,
                subject planning, performance tracking, and risk visibility into one experience that feels cohesive in a demo.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/login"
                  className="rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(255,255,255,0.15)] transition hover:-translate-y-0.5 hover:bg-slate-100"
                >
                  Explore the product
                </Link>
                <a
                  href="#product-preview"
                  className="rounded-2xl border border-white/18 bg-white/6 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  View interface preview
                </a>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {trustStats.map((item) => (
                  <div key={item.label} className="rounded-3xl border border-white/10 bg-white/7 p-5 shadow-[0_10px_40px_rgba(2,6,23,0.14)] backdrop-blur">
                    <p className="text-3xl font-bold text-white">{item.value}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-100/92">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/12 bg-slate-950/55 p-4 shadow-[0_30px_100px_rgba(2,6,23,0.35)] backdrop-blur xl:mt-6">
              <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,_rgba(10,15,35,0.98)_0%,_rgba(10,19,43,0.96)_100%)] p-5 text-white">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-200">Platform snapshot</p>
                    <h2 className="mt-3 text-3xl font-semibold leading-tight">Built for review, demo, and discussion</h2>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/8 px-4 py-3 text-right">
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

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">Core capabilities</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-slate-950 sm:text-4xl">What makes the product feel complete</h2>
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

      <section id="product-preview" className="mx-auto max-w-7xl px-6 pb-20 lg:px-8 lg:pb-24">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">Interface preview</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-slate-950 sm:text-4xl">A stronger first impression for reviewers</h2>
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
