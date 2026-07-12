import type { Metadata } from 'next';
import Link from 'next/link';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://devlock.tashanto.com';

export const metadata: Metadata = {
  title: 'Documentation — DevLock SDK Setup & API',
  description:
    'DevLock documentation: install the devlock-sdk (Node/Express/Fastify/NestJS) and devlock-client (React/Next.js/Vue/Vanilla) SDKs, get your keys, wire up license validation, kill-switch, feature flags and domain locking — with fail-open safety.',
  alternates: { canonical: '/docs' },
  openGraph: {
    title: 'DevLock Documentation — SDK Setup & API',
    description:
      'Install and integrate the DevLock SDKs: license validation, kill-switch, feature flags, and domain locking with fail-open safety.',
    url: `${SITE_URL}/docs`,
    type: 'article',
  },
};

const NAV = [
  { href: '#getting-started', label: 'Getting Started' },
  { href: '#keys', label: 'Get Your Keys' },
  { href: '#frontend-sdk', label: 'Frontend SDK' },
  { href: '#backend-sdk', label: 'Backend SDK' },
  { href: '#config', label: 'Configuration' },
  { href: '#fail-open', label: 'Fail-Open Safety' },
  { href: '#resources', label: 'Resources' },
];

function Code({ children }: { children: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm leading-relaxed text-slate-200">
      <code>{children}</code>
    </pre>
  );
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <rect width="28" height="28" rx="6" className="fill-indigo-500" />
              <path d="M8 8h4v12H8V8zm8 0h4v12h-4V8z" fill="white" />
            </svg>
            DevLock
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-slate-300 transition hover:text-white">← Back to site</Link>
            <Link
              href="/register"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:px-8">
        {/* Sidebar */}
        <aside className="sticky top-24 hidden h-fit w-56 shrink-0 lg:block">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">On this page</p>
          <nav className="space-y-1" aria-label="Documentation sections">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block rounded-md px-3 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1">
          <div className="mb-2 text-sm font-medium text-indigo-400">Documentation</div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">DevLock SDK Documentation</h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-400">
            Integrate license validation, remote kill-switch, feature flags, and domain locking into any
            JavaScript / TypeScript app. Two packages, one control plane — managed from your{' '}
            <Link href="/dashboard" className="text-indigo-400 hover:text-indigo-300">dashboard</Link>.
          </p>

          {/* Getting started */}
          <section id="getting-started" className="mt-12 scroll-mt-24">
            <h2 className="text-2xl font-bold tracking-tight">Getting Started</h2>
            <p className="mt-3 text-slate-400">
              DevLock ships two SDKs. Use <strong className="text-slate-200">devlock-client</strong> in browser /
              frontend apps (safe to bundle, uses your <em>public</em> key) and{' '}
              <strong className="text-slate-200">devlock-sdk</strong> in Node.js / server apps (uses your{' '}
              <em>secret</em> key).
            </p>
            <Code>{`# Frontend (React, Next.js, Vue, Vanilla)
npm install devlock-client

# Backend (Node.js, Express, Fastify, NestJS)
npm install devlock-sdk`}</Code>
          </section>

          {/* Keys */}
          <section id="keys" className="mt-12 scroll-mt-24">
            <h2 className="text-2xl font-bold tracking-tight">Get Your Keys</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-slate-400">
              <li>Create an account and sign in to the <Link href="/dashboard" className="text-indigo-400 hover:text-indigo-300">DevLock Dashboard</Link>.</li>
              <li>Create a <strong className="text-slate-200">Project</strong> — you’ll get a <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs">pk_live_…</code> public key and a <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs">sk_live_…</code> secret key.</li>
              <li>Use the <strong className="text-slate-200">public key</strong> in the frontend SDK and the <strong className="text-slate-200">secret key</strong> in the backend SDK (keep it server-side only).</li>
              <li>(Optional) Create license keys, feature flags, and allowed domains from the project pages.</li>
            </ol>
          </section>

          {/* Frontend SDK */}
          <section id="frontend-sdk" className="mt-12 scroll-mt-24">
            <h2 className="text-2xl font-bold tracking-tight">Frontend SDK — <span className="text-indigo-400">devlock-client</span></h2>
            <p className="mt-3 text-slate-400">Vanilla TypeScript:</p>
            <Code>{`import { DevLock } from 'devlock-client';

const devlock = new DevLock({
  projectKey: 'pk_live_xxx',
  licenseKey: 'DLCK-XXXX-XXXX-XXXX-XXXX',
  on: {
    onKillSwitch: (reason) => showBlockedUI(reason),
    onMaintenanceMode: (cfg) => showMaintenance(cfg.message),
  },
});

await devlock.init();

if (devlock.isFeatureEnabled('premium')) {
  renderPremium();
}`}</Code>
            <p className="mt-4 text-slate-400">React / Next.js:</p>
            <Code>{`import { DevLockProvider, useFeatureFlag } from 'devlock-client/react';

function App() {
  return (
    <DevLockProvider config={{ projectKey: 'pk_live_xxx' }}>
      <Dashboard />
    </DevLockProvider>
  );
}

function Dashboard() {
  const isPremium = useFeatureFlag('premium');
  return <div>{isPremium && <PremiumWidget />}</div>;
}`}</Code>
          </section>

          {/* Backend SDK */}
          <section id="backend-sdk" className="mt-12 scroll-mt-24">
            <h2 className="text-2xl font-bold tracking-tight">Backend SDK — <span className="text-indigo-400">devlock-sdk</span></h2>
            <p className="mt-3 text-slate-400">Express middleware (also works with Fastify &amp; NestJS):</p>
            <Code>{`import { createMiddleware } from 'devlock-sdk/express';

app.use(createMiddleware({
  secretKey: process.env.DEVLOCK_SECRET_KEY!,
  projectId: process.env.DEVLOCK_PROJECT_ID!,
  excludePaths: ['/health', '/webhooks'],
  on: {
    onKillSwitch: (reason) => logger.error('Disabled:', reason),
  },
}));

app.get('/api/data', (req, res) => {
  const { license, isFeatureEnabled } = req.devlock!;
  if (isFeatureEnabled('advanced-export')) { /* ... */ }
  res.json({ status: license.status });
});`}</Code>
          </section>

          {/* Config */}
          <section id="config" className="mt-12 scroll-mt-24">
            <h2 className="text-2xl font-bold tracking-tight">Configuration</h2>
            <div className="mt-4 overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/60 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Option</th>
                    <th className="px-4 py-3 font-medium">Default</th>
                    <th className="px-4 py-3 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-400">
                  {[
                    ['apiUrl', 'https://dl-api.tashanto.com', 'DevLock API base URL'],
                    ['environment', 'production', 'production | staging | development'],
                    ['offlineGraceHours', '72', 'How long cached validation stays valid offline'],
                    ['failBehavior', "'open'", "'open' never breaks your app; 'closed' hard-fails on outage"],
                    ['tamperDetection', 'true', '(frontend) detect SDK manipulation'],
                  ].map(([opt, def, desc]) => (
                    <tr key={opt}>
                      <td className="px-4 py-3"><code className="text-indigo-300">{opt}</code></td>
                      <td className="px-4 py-3"><code className="text-xs">{def}</code></td>
                      <td className="px-4 py-3">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Fail-open */}
          <section id="fail-open" className="mt-12 scroll-mt-24">
            <h2 className="text-2xl font-bold tracking-tight">Fail-Open Safety</h2>
            <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <p className="text-slate-300">
                <strong className="text-emerald-300">DevLock never becomes a single point of failure.</strong> If
                DevLock’s servers are unreachable, a network error occurs, or a response is malformed, the SDK
                <strong className="text-white"> never throws and never blocks your app</strong> — it fails open.
                A lock (kill-switch / maintenance) is applied <em>only</em> when the server explicitly reports it.
              </p>
            </div>
            <Code>{`const devlock = new DevLock({
  projectKey: 'pk_live_xxx',
  failBehavior: 'open', // default — an outage never breaks your site
});`}</Code>
          </section>

          {/* Resources */}
          <section id="resources" className="mt-12 scroll-mt-24">
            <h2 className="text-2xl font-bold tracking-tight">Resources</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              <li><a href="https://www.npmjs.com/package/devlock-client" target="_blank" rel="noopener noreferrer" className="block rounded-lg border border-slate-800 bg-slate-900/50 p-4 transition hover:border-indigo-500/30"><span className="font-medium text-white">devlock-client</span><span className="mt-1 block text-sm text-slate-400">Frontend SDK on npm</span></a></li>
              <li><a href="https://www.npmjs.com/package/devlock-sdk" target="_blank" rel="noopener noreferrer" className="block rounded-lg border border-slate-800 bg-slate-900/50 p-4 transition hover:border-indigo-500/30"><span className="font-medium text-white">devlock-sdk</span><span className="mt-1 block text-sm text-slate-400">Backend SDK on npm</span></a></li>
              <li><a href="https://github.com/iamtashanto/DevLock" target="_blank" rel="noopener noreferrer" className="block rounded-lg border border-slate-800 bg-slate-900/50 p-4 transition hover:border-indigo-500/30"><span className="font-medium text-white">GitHub</span><span className="mt-1 block text-sm text-slate-400">Source code &amp; issues</span></a></li>
              <li><Link href="/dashboard" className="block rounded-lg border border-slate-800 bg-slate-900/50 p-4 transition hover:border-indigo-500/30"><span className="font-medium text-white">Dashboard</span><span className="mt-1 block text-sm text-slate-400">Manage projects &amp; licenses</span></Link></li>
            </ul>
          </section>

          {/* Footer credit */}
          <div className="mt-16 border-t border-slate-800 pt-8 text-sm text-slate-500">
            Developed with ❤️ by{' '}
            <a href="https://tashanto.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">
              tashanto.com
            </a>
          </div>
        </main>
      </div>
    </div>
  );
}
