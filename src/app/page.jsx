import React from 'react';
import Link from "next/link";

/**
 * SendFlow Landing Page
 * A premium, minimal cold outreach SaaS component built with Next.js & Tailwind CSS.
 */

const Navbar = () => (
  <nav className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
    <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-black flex items-center justify-center">
          <div className="h-4 w-4 rounded-sm border-2 border-white"></div>
        </div>
        <span className="text-xl font-bold tracking-tight text-black">sendflow</span>
      </div>
      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
        <a href="#" className="hover:text-black transition-colors">Features</a>
        <a href="#" className="hover:text-black transition-colors">Pricing</a>
        <a href="#" className="hover:text-black transition-colors">Resources</a>
      </div>
      <div className="flex items-center gap-4">
        <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-black transition-colors">
          Sign in
        </Link>
        <Link href="/signup" className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-all">
          Start Free
        </Link>
      </div>
    </div>
  </nav>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-black selection:bg-gray-100">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pt-24 pb-20 lg:pt-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium uppercase tracking-wider text-gray-500">
                New: AI Sequence Generator 2.0
              </div>
              <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-black lg:text-7xl leading-[1.1]">
                Scale Cold Email Outreach <span className="text-gray-400">Without Complexity</span>
              </h1>
              <p className="mb-10 text-xl leading-relaxed text-gray-600">
                The all-in-one platform for founders and agencies to find leads, 
                automate follow-ups, and land in the primary inbox every time.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="rounded-full bg-black px-8 py-4 text-lg font-bold text-white shadow-xl shadow-black/10 hover:bg-gray-800 transition-all active:scale-95">
                  Start Free
                </button>
                <button className="rounded-full border border-gray-200 bg-white px-8 py-4 text-lg font-bold text-black hover:bg-gray-50 transition-all active:scale-95">
                  Book Demo
                </button>
              </div>
            </div>

            {/* Dashboard Preview Placeholder */}
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-4 shadow-2xl">
                <div className="h-full w-full rounded-xl border border-gray-200 bg-white p-4 overflow-hidden">
                  <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                    <div className="flex gap-2">
                      <div className="h-3 w-3 rounded-full bg-gray-200" />
                      <div className="h-3 w-3 rounded-full bg-gray-200" />
                    </div>
                    <div className="h-4 w-32 rounded bg-gray-100" />
                  </div>
                  <div className="mt-6 space-y-4">
                    <div className="h-8 w-2/3 rounded bg-gray-50" />
                    <div className="grid grid-cols-3 gap-4">
                      <div className="h-20 rounded-lg bg-gray-50/50 border border-gray-100" />
                      <div className="h-20 rounded-lg bg-gray-50/50 border border-gray-100" />
                      <div className="h-20 rounded-lg bg-gray-50/50 border border-gray-100" />
                    </div>
                    <div className="h-32 rounded-lg bg-gray-50/50 border border-dashed border-gray-200" />
                  </div>
                </div>
              </div>
              {/* Floating Badge */}
              <div className="absolute -bottom-6 -left-6 rounded-xl border border-gray-200 bg-white p-4 shadow-lg hidden md:block">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">↑</div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase font-bold tracking-tight">Open Rate</div>
                    <div className="text-lg font-black text-black">84.2%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-y border-gray-100 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-center text-sm font-bold uppercase tracking-[0.2em] text-gray-400">
            Trusted by the best Founders · Agencies · SDR Teams
          </p>
        </div>
      </section>

      {/* Product Preview Section */}
      <section className="bg-gray-50/50 py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Unified Outreach Command Center</h2>
          </div>
          <div className="grid grid-cols-12 gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:h-[600px]">
            {/* Sidebar UI */}
            <div className="col-span-3 hidden flex-col gap-4 border-r border-gray-100 p-4 lg:flex">
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={`h-8 rounded-md ${i === 0 ? 'bg-black' : 'bg-gray-50'}`} />
                ))}
              </div>
            </div>
            {/* Main Campaign Workspace */}
            <div className="col-span-12 lg:col-span-6 p-4">
              <div className="flex items-center justify-between mb-8">
                <div className="h-6 w-32 rounded bg-gray-100" />
                <div className="h-8 w-24 rounded-full bg-black" />
              </div>
              <div className="space-y-6">
                <div className="rounded-xl border border-gray-200 p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-blue-100 text-[10px] flex items-center justify-center font-bold">1</div>
                    <span className="text-sm font-bold">Step 1: Initial Email</span>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-full rounded bg-gray-100" />
                    <div className="h-4 w-5/6 rounded bg-gray-100" />
                    <div className="h-4 w-4/6 rounded bg-gray-100" />
                  </div>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-6">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-gray-200 text-[10px] flex items-center justify-center font-bold">2</div>
                    <span className="text-sm font-bold text-gray-400">Step 2: Follow-up after 2 days</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Analytics Sidebar */}
            <div className="col-span-3 hidden flex-col border-l border-gray-100 p-4 lg:flex">
              <div className="h-4 w-20 rounded bg-gray-100 mb-6" />
              <div className="space-y-8">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 w-24 rounded bg-gray-50" />
                    <div className="h-2 w-full rounded bg-gray-100" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "Build Sequences Faster", desc: "Drag-and-drop builder with pre-vetted AI templates for high conversion." },
              { title: "Automate Followups", desc: "Smart triggers ensure you never miss a lead while maintaining a human touch." },
              { title: "Manage Prospects", desc: "Built-in CRM to categorize, filter, and prioritize your warmest opportunities." },
              { title: "Close More Conversations", desc: "Unified inbox to manage all replies across every single campaign." }
            ].map((feature, i) => (
              <div key={i} className="group rounded-2xl border border-gray-100 bg-white p-8 transition-all hover:border-gray-200 hover:shadow-lg">
                <div className="mb-6 h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                  <div className="h-5 w-5 border-2 border-current rounded-sm" />
                </div>
                <h3 className="mb-3 text-xl font-bold">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-bold">Start sending in minutes</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-0" />
            {[
              { step: "01", title: "Create Campaign", desc: "Connect your email accounts and set your sending schedule." },
              { step: "02", title: "Add Prospects", desc: "Upload CSVs or use our built-in lead finder to target your ICP." },
              { step: "03", title: "Launch Sequence", desc: "Hit go and watch the meetings roll in while we handle the rest." }
            ].map((step, i) => (
              <div key={i} className="relative z-10 bg-gray-50 flex flex-col items-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-black text-xl font-black text-white">
                  {step.step}
                </div>
                <h3 className="mb-4 text-2xl font-bold">{step.title}</h3>
                <p className="text-gray-600 max-w-xs">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Alex Rivera", role: "Founder @ ScaleUp", quote: "SendFlow tripled our outbound meeting rate in just 30 days. The deliverability is unmatched." },
              { name: "Sarah Chen", role: "Head of Sales @ Velocity", quote: "We've tried every tool. SendFlow is the first one that feels intuitive enough for our whole team." },
              { name: "Marcus Thorne", role: "Agency Director", quote: "Managing 50+ clients was a nightmare before SendFlow. Now it's our primary growth engine." }
            ].map((t, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 p-8 flex flex-col justify-between">
                <p className="mb-8 text-lg text-gray-600 italic">"{t.quote}"</p>
                <div>
                  <div className="font-bold text-black">{t.name}</div>
                  <div className="text-sm text-gray-500">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6">
        <div className="mx-auto max-w-5xl rounded-[32px] bg-black px-8 py-20 text-center text-white">
          <h2 className="mb-8 text-4xl font-extrabold sm:text-6xl">Ready to fill your calendar?</h2>
          <p className="mb-12 text-xl text-gray-400">Join 2,000+ companies growing with SendFlow.</p>
          <button className="rounded-full bg-white px-10 py-5 text-xl font-black text-black hover:bg-gray-100 transition-all active:scale-95">
            Start Free Today
          </button>
          <p className="mt-8 text-sm text-gray-500 italic">No credit card required. 14-day free trial.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12 px-6">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-black"></div>
            <span className="font-bold tracking-tight">sendflow</span>
          </div>
          <div className="flex gap-8 text-sm font-medium text-gray-500">
            <a href="#" className="hover:text-black transition-colors">Twitter</a>
            <a href="#" className="hover:text-black transition-colors">Privacy</a>
            <a href="#" className="hover:text-black transition-colors">Terms</a>
          </div>
          <p className="text-sm text-gray-400">© 2026 SendFlow Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}