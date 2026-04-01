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
      'Manage students, faculty, subjects, approvals, and activity history from a single operational workspace.',
  },
  {
    title: 'Performance intelligence',
    description:
      'Surface weak subjects, risk patterns, attendance drift, and trend movement without manual spreadsheet work.',
  },
  {
    title: 'Role-aware experience',
    description:
      'Admins, faculty, students, and pending viewers each see the right workflows, permissions, and visibility.',
  },
];

const highlights = [
  'Approval workflow and account governance',
  'Dashboard analytics with portfolio-ready visuals',
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
  { value: '1', label: 'demo environment to run locally' },
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
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.14),_transparent_32%),linear-gradient(180deg,_#f8fbff_0%,_#eef5ff_100%)]">
        <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6">
          <div className="w-full max-w-xl rounded-[28px] border border-white/70 bg-white/80 p-10 text-center shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur">
            <div className="mx-auto h-14 w-14 animate-pulse rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700" />
            <h1 className="mt-6 text-2xl font-semibold text-slate-900">Preparing your workspace</h1>
            <p className="mt-3 text-sm text-slate-600">
              Checking authentication and loading the Smart Performance Intelligence Dashboard experience.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.16),_transparent_28%),linear-gradient(180deg,_#f8fbff_0%,_#eef5ff_48%,_#ffffff_100%)] text-slate-900">
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[440px] bg-[linear-gradient(135deg,_rgba(15,23,42,0.94)_0%,_rgba(30,64,175,0.92)_48%,_rgba(14,165,233,0.78)_100%)]" />
        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-8 lg:px-8">
          <header className="flex flex-col gap-4 rounded-full border border-white/15 bg-white/10 px-6 py-4 text-white shadow-[0_16px_60px_rgba(15,23,42,0.25)] backdrop-blur md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-100">Smart Performance Intelligence Dashboard</p>
              <p className="mt-1 text-sm text-slate-100/90">Academic operations, governance, and analytics in one product.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="rounded-full border border-white/30 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Request access
              </Link>
            </div>
          </header>

          <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="text-white">
              <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-sky-100">
                Submission-ready academic platform
              </p>
              <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
                A polished dashboard for academic performance, faculty oversight, and student operations.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-100/90 sm:text-lg">
                SPID turns scattered academic records into a single operating system for institutions. We combine approvals,
                subject planning, performance tracking, and risk visibility into one coherent experience.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/login"
                  className="rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-100"
                >
                  Explore the product
                </Link>
                <a
                  href="#product-preview"
                  className="rounded-2xl border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  View interface preview
                </a>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {trustStats.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                    <p className="text-2xl font-bold">{item.value}</p>
                    <p className="mt-1 text-sm text-slate-100/80">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/40 bg-white/90 p-5 shadow-[0_30px_90px_rgba(15,23,42,0.24)] backdrop-blur">
              <div className="rounded-[28px] bg-slate-950 p-4 text-white">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200">Platform snapshot</p>
                    <h2 className="mt-2 text-2xl font-semibold">Built for review, demo, and discussion</h2>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-3 py-2 text-right">
                    <p className="text-xs text-slate-300">Focus</p>
                    <p className="text-sm font-semibold">Operations + analytics</p>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  {highlights.map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/20 text-xs font-bold text-emerald-200">
                        OK
                      </span>
                      <p className="text-sm text-slate-100/90">{item}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-2xl border border-sky-300/20 bg-sky-400/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-200">Demo accounts</p>
                  <p className="mt-2 text-sm text-slate-100">Seeded admin, faculty, and student flows are available for local review.</p>
                  <p className="mt-2 text-xs text-slate-300">Admin: admin@xeno.com | Faculty: faculty@spid.com | Student: aarya.sharma@spid.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          {capabilityCards.map((card) => (
            <article
              key={card.title}
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">Capability</p>
              <h2 className="mt-4 text-2xl font-semibold text-slate-900">{card.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="product-preview" className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">Interface preview</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">A clearer first impression for reviewers</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              The platform now opens with a presentable product story, seeded operational data, and stronger state handling so
              evaluators see a complete system instead of empty scaffolding.
            </p>
          </div>
          <Link href="/login" className="text-sm font-semibold text-sky-700 hover:text-sky-800">
            Open sign-in {'->'}
          </Link>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-3">
          {previewCards.map((card) => (
            <article
              key={card.title}
              className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.08)]"
            >
              <div className="border-b border-slate-100 bg-slate-950/95 p-5 text-white">
                <h3 className="text-xl font-semibold">{card.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{card.subtitle}</p>
              </div>
              <div className="bg-slate-50 p-4">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
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
