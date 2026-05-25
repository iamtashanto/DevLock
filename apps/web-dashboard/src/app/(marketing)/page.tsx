export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* ─── NAVBAR ─── */}
      <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
          <a href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <rect width="28" height="28" rx="6" className="fill-indigo-500" />
              <path d="M8 8h4v12H8V8zm8 0h4v12h-4V8z" fill="white" />
            </svg>
            DevLock
          </a>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-slate-300 transition hover:text-white">Features</a>
            <a href="#pricing" className="text-sm text-slate-300 transition hover:text-white">Pricing</a>
            <a href="#faq" className="text-sm text-slate-300 transition hover:text-white">FAQ</a>
            <a
              href="https://github.com/mdtanvirahamedshanto/DevLock"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-300 transition hover:text-white"
            >
              GitHub
            </a>
          </div>
          <div className="flex items-center gap-3">
            <a href="/login" className="hidden text-sm text-slate-300 transition hover:text-white sm:inline-block">
              Sign In
            </a>
            <a
              href="/register"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
            >
              Get Started
            </a>
          </div>
        </nav>
      </header>

      <main>
        {/* ─── HERO ─── */}
        <section id="hero" className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
          {/* Background gradient */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent blur-3xl" />
            <div className="absolute top-40 right-0 h-[400px] w-[400px] rounded-full bg-blue-600/10 blur-3xl" />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                Open Source Software Protection Platform
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                Protect &amp; Control Your{' '}
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Software Remotely
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 sm:text-xl">
                License management, kill-switch, maintenance mode, domain locking, feature flags, and real-time
                remote control — all from one powerful dashboard. Protect your distributed apps with a simple SDK.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <a
                  href="/register"
                  className="w-full rounded-lg bg-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 sm:w-auto"
                >
                  Get Started Free
                </a>
                <a
                  href="https://github.com/mdtanvirahamedshanto/DevLock"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-8 py-3.5 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-800 sm:w-auto"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  View on GitHub
                </a>
              </div>
            </div>

            {/* Code snippet */}
            <div className="mx-auto mt-16 max-w-3xl">
              <div className="overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/80 shadow-2xl shadow-indigo-500/5">
                <div className="flex items-center gap-2 border-b border-slate-700/50 px-4 py-3">
                  <span className="h-3 w-3 rounded-full bg-red-500/80" />
                  <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <span className="h-3 w-3 rounded-full bg-green-500/80" />
                  <span className="ml-3 text-xs text-slate-500">app.ts</span>
                </div>
                <pre className="overflow-x-auto p-6 text-sm leading-relaxed">
                  <code>
                    <span className="text-purple-400">import</span>{' '}
                    <span className="text-slate-200">{'{ DevLock }'}</span>{' '}
                    <span className="text-purple-400">from</span>{' '}
                    <span className="text-green-400">{`'devlock-sdk'`}</span>
                    {'\n\n'}
                    <span className="text-purple-400">const</span>{' '}
                    <span className="text-blue-300">devlock</span>{' '}
                    <span className="text-slate-400">=</span>{' '}
                    <span className="text-purple-400">new</span>{' '}
                    <span className="text-yellow-300">DevLock</span>
                    {'({\n'}
                    {'  '}
                    <span className="text-slate-200">apiKey</span>
                    <span className="text-slate-400">:</span>{' '}
                    <span className="text-green-400">process.env.DEVLOCK_API_KEY</span>
                    {',\n'}
                    {'  '}
                    <span className="text-slate-200">projectId</span>
                    <span className="text-slate-400">:</span>{' '}
                    <span className="text-green-400">{`'your-project-id'`}</span>
                    {'\n})\n\n'}
                    <span className="text-slate-500">{'// Check license & app status in one call'}</span>
                    {'\n'}
                    <span className="text-purple-400">const</span>{' '}
                    <span className="text-blue-300">status</span>{' '}
                    <span className="text-slate-400">=</span>{' '}
                    <span className="text-purple-400">await</span>{' '}
                    <span className="text-blue-300">devlock</span>
                    <span className="text-slate-400">.</span>
                    <span className="text-yellow-300">verify</span>
                    {'('}
                    <span className="text-green-400">{`'LICENSE-KEY'`}</span>
                    {')\n'}
                    <span className="text-purple-400">if</span>{' '}
                    {'('}
                    <span className="text-slate-400">!</span>
                    <span className="text-blue-300">status</span>
                    <span className="text-slate-400">.</span>
                    <span className="text-slate-200">valid</span>
                    {') '}
                    <span className="text-purple-400">throw</span>{' '}
                    <span className="text-purple-400">new</span>{' '}
                    <span className="text-yellow-300">Error</span>
                    {'('}
                    <span className="text-green-400">{`'License invalid'`}</span>
                    {')'}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SOCIAL PROOF ─── */}
        <section className="border-y border-slate-800 bg-slate-900/50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="mb-10 text-center text-sm font-medium uppercase tracking-wider text-slate-500">
              Trusted by developers worldwide
            </p>
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-white">1,200+</p>
                <p className="mt-1 text-sm text-slate-400">Developers</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">50K+</p>
                <p className="mt-1 text-sm text-slate-400">Licenses Managed</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">99.9%</p>
                <p className="mt-1 text-sm text-slate-400">Uptime SLA</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-white">12ms</p>
                <p className="mt-1 text-sm text-slate-400">Avg Response</p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── FEATURES GRID ─── */}
        <section id="features" className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need to{' '}
                <span className="text-indigo-400">protect &amp; manage</span> your software
              </h2>
              <p className="mt-4 text-lg text-slate-400">
                A comprehensive toolkit for licensing, remote control, and application security — built for modern developers.
              </p>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[
                { icon: '🔑', title: 'License Management', desc: 'Generate, validate, and revoke license keys with flexible plans and expiration rules.' },
                { icon: '🛑', title: 'Kill Switch', desc: 'Instantly disable any application remotely. Emergency shutdown at your fingertips.' },
                { icon: '🔧', title: 'Maintenance Mode', desc: 'Put apps into maintenance with custom messages. No redeployment needed.' },
                { icon: '🌐', title: 'Domain Locking', desc: 'Restrict software to authorized domains. Prevent unauthorized redistribution.' },
                { icon: '🚩', title: 'Feature Flags', desc: 'Toggle features remotely per license tier. A/B test without deployments.' },
                { icon: '🛡️', title: 'Tamper Detection', desc: 'Detect code modifications and unauthorized changes in real-time.' },
                { icon: '📡', title: 'Offline Support', desc: 'Graceful degradation when connectivity is lost. Cached license validation.' },
                { icon: '⚡', title: 'Real-Time Updates', desc: 'WebSocket-powered instant propagation. Changes reflect in milliseconds.' },
                { icon: '💻', title: 'Device Tracking', desc: 'Monitor active installations and hardware fingerprints per license.' },
                { icon: '📊', title: 'Analytics Dashboard', desc: 'Usage metrics, activation trends, and geographic distribution at a glance.' },
                { icon: '🔗', title: 'Webhook System', desc: 'Get notified on license events, activations, and security alerts.' },
                { icon: '🏢', title: 'Multi-Tenant', desc: 'Manage multiple projects and organizations from a single account.' },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-xl border border-slate-800 bg-slate-900/50 p-6 transition hover:border-indigo-500/30 hover:bg-slate-900"
                >
                  <div className="mb-4 text-3xl">{feature.icon}</div>
                  <h3 className="text-base font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section id="how-it-works" className="border-t border-slate-800 bg-slate-900/30 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Up and running in <span className="text-indigo-400">3 minutes</span>
              </h2>
              <p className="mt-4 text-lg text-slate-400">
                Integrate DevLock into your application with just a few lines of code.
              </p>
            </div>

            <div className="mt-16 grid gap-8 lg:grid-cols-3">
              {/* Step 1 */}
              <div className="relative rounded-xl border border-slate-800 bg-slate-900/50 p-8">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold">
                  1
                </div>
                <h3 className="text-lg font-semibold text-white">Install the SDK</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Add DevLock to your project with a single command.
                </p>
                <div className="mt-4 overflow-hidden rounded-lg bg-slate-950 p-4">
                  <code className="text-sm text-green-400">npm install devlock-sdk</code>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative rounded-xl border border-slate-800 bg-slate-900/50 p-8">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold">
                  2
                </div>
                <h3 className="text-lg font-semibold text-white">Configure Your Dashboard</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Set up your project, define license tiers, and configure protection rules.
                </p>
                <div className="mt-4 overflow-hidden rounded-lg bg-slate-950 p-4">
                  <code className="text-sm text-slate-300">
                    <span className="text-slate-500">{'// dashboard → projects → new'}</span>
                    {'\n'}Create project → Add rules
                  </code>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative rounded-xl border border-slate-800 bg-slate-900/50 p-8">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold">
                  3
                </div>
                <h3 className="text-lg font-semibold text-white">Control Remotely</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Manage licenses, toggle features, and monitor your apps in real-time.
                </p>
                <div className="mt-4 overflow-hidden rounded-lg bg-slate-950 p-4">
                  <code className="text-sm text-slate-300">
                    <span className="text-yellow-300">devlock</span>
                    <span className="text-slate-400">.</span>
                    <span className="text-blue-300">killSwitch</span>
                    {'('}
                    <span className="text-green-400">{`'project-id'`}</span>
                    {')'}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SDK SHOWCASE ─── */}
        <section id="sdk" className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                SDKs for <span className="text-indigo-400">frontend &amp; backend</span>
              </h2>
              <p className="mt-4 text-lg text-slate-400">
                Two packages, one unified protection layer. Works with any JavaScript/TypeScript stack.
              </p>
            </div>

            <div className="mt-16 grid gap-8 lg:grid-cols-2">
              {/* Frontend SDK */}
              <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
                <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-400">
                      Frontend
                    </span>
                    <span className="text-sm font-medium text-white">devlock-client</span>
                  </div>
                  <code className="text-xs text-slate-500">npm i devlock-client</code>
                </div>
                <pre className="overflow-x-auto p-6 text-sm leading-relaxed">
                  <code>
                    <span className="text-purple-400">import</span>{' '}
                    <span className="text-slate-200">{'{ DevLockClient }'}</span>{' '}
                    <span className="text-purple-400">from</span>{' '}
                    <span className="text-green-400">{`'devlock-client'`}</span>
                    {'\n\n'}
                    <span className="text-purple-400">const</span>{' '}
                    <span className="text-blue-300">client</span>{' '}
                    <span className="text-slate-400">=</span>{' '}
                    <span className="text-purple-400">new</span>{' '}
                    <span className="text-yellow-300">DevLockClient</span>
                    {'({\n'}
                    {'  '}
                    <span className="text-slate-200">projectId</span>
                    <span className="text-slate-400">:</span>{' '}
                    <span className="text-green-400">{`'your-project-id'`}</span>
                    {',\n'}
                    {'  '}
                    <span className="text-slate-200">publicKey</span>
                    <span className="text-slate-400">:</span>{' '}
                    <span className="text-green-400">{`'pk_live_...'`}</span>
                    {'\n})\n\n'}
                    <span className="text-slate-500">{'// Check if app is active'}</span>
                    {'\n'}
                    <span className="text-purple-400">const</span>{' '}
                    <span className="text-blue-300">{'{ active, features }'}</span>{' '}
                    <span className="text-slate-400">=</span>{' '}
                    <span className="text-purple-400">await</span>{' '}
                    <span className="text-blue-300">client</span>
                    <span className="text-slate-400">.</span>
                    <span className="text-yellow-300">check</span>
                    {'()\n\n'}
                    <span className="text-purple-400">if</span>{' '}
                    {'('}
                    <span className="text-blue-300">features</span>
                    <span className="text-slate-400">.</span>
                    <span className="text-slate-200">darkMode</span>
                    {') {\n'}
                    {'  '}
                    <span className="text-slate-500">{'// Feature flag enabled remotely'}</span>
                    {'\n}'}
                  </code>
                </pre>
              </div>

              {/* Backend SDK */}
              <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
                <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                      Backend
                    </span>
                    <span className="text-sm font-medium text-white">devlock-sdk</span>
                  </div>
                  <code className="text-xs text-slate-500">npm i devlock-sdk</code>
                </div>
                <pre className="overflow-x-auto p-6 text-sm leading-relaxed">
                  <code>
                    <span className="text-purple-400">import</span>{' '}
                    <span className="text-slate-200">{'{ DevLock }'}</span>{' '}
                    <span className="text-purple-400">from</span>{' '}
                    <span className="text-green-400">{`'devlock-sdk'`}</span>
                    {'\n\n'}
                    <span className="text-purple-400">const</span>{' '}
                    <span className="text-blue-300">devlock</span>{' '}
                    <span className="text-slate-400">=</span>{' '}
                    <span className="text-purple-400">new</span>{' '}
                    <span className="text-yellow-300">DevLock</span>
                    {'({\n'}
                    {'  '}
                    <span className="text-slate-200">apiKey</span>
                    <span className="text-slate-400">:</span>{' '}
                    <span className="text-green-400">process.env.DEVLOCK_API_KEY</span>
                    {',\n'}
                    {'  '}
                    <span className="text-slate-200">projectId</span>
                    <span className="text-slate-400">:</span>{' '}
                    <span className="text-green-400">{`'your-project-id'`}</span>
                    {'\n})\n\n'}
                    <span className="text-slate-500">{'// Middleware: validate license on every request'}</span>
                    {'\n'}
                    <span className="text-purple-400">app</span>
                    <span className="text-slate-400">.</span>
                    <span className="text-yellow-300">use</span>
                    {'('}
                    <span className="text-purple-400">async</span>
                    {' (req, res, next) => {\n'}
                    {'  '}
                    <span className="text-purple-400">const</span>{' '}
                    <span className="text-blue-300">result</span>{' '}
                    <span className="text-slate-400">=</span>{' '}
                    <span className="text-purple-400">await</span>{' '}
                    <span className="text-blue-300">devlock</span>
                    <span className="text-slate-400">.</span>
                    <span className="text-yellow-300">verify</span>
                    {'(req.headers.license)\n'}
                    {'  '}
                    <span className="text-purple-400">if</span>
                    {' (!result.valid) '}
                    <span className="text-purple-400">return</span>
                    {' res.status('}
                    <span className="text-orange-300">403</span>
                    {').json(result)\n'}
                    {'  next()\n})\n'}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* ─── DASHBOARD PREVIEW ─── */}
        <section className="border-t border-slate-800 bg-slate-900/30 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  A <span className="text-indigo-400">powerful dashboard</span> for complete control
                </h2>
                <p className="mt-4 text-lg text-slate-400">
                  Monitor, manage, and control all your applications from a single, intuitive interface.
                </p>
                <ul className="mt-8 space-y-4">
                  {[
                    'Real-time license activation monitoring',
                    'One-click kill-switch and maintenance mode',
                    'Feature flag management with instant propagation',
                    'Device fingerprint tracking and analytics',
                    'Webhook configuration and event logs',
                    'Team collaboration with role-based access',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <svg className="mt-0.5 h-5 w-5 shrink-0 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-slate-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900 shadow-2xl">
                  <div className="flex items-center gap-2 border-b border-slate-700/50 px-4 py-3">
                    <span className="h-3 w-3 rounded-full bg-red-500/80" />
                    <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                    <span className="h-3 w-3 rounded-full bg-green-500/80" />
                    <span className="ml-3 text-xs text-slate-500">DevLock Dashboard</span>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="rounded-lg bg-slate-800 p-4">
                        <p className="text-xs text-slate-500">Active Licenses</p>
                        <p className="mt-1 text-2xl font-bold text-white">2,847</p>
                        <p className="mt-1 text-xs text-green-400">↑ 12% this week</p>
                      </div>
                      <div className="rounded-lg bg-slate-800 p-4">
                        <p className="text-xs text-slate-500">Kill Switch</p>
                        <p className="mt-1 text-2xl font-bold text-green-400">OFF</p>
                        <p className="mt-1 text-xs text-slate-500">All systems go</p>
                      </div>
                      <div className="rounded-lg bg-slate-800 p-4">
                        <p className="text-xs text-slate-500">Requests / hr</p>
                        <p className="mt-1 text-2xl font-bold text-white">14.2K</p>
                        <p className="mt-1 text-xs text-slate-500">Avg 8ms latency</p>
                      </div>
                    </div>
                    <div className="mt-4 rounded-lg bg-slate-800 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-slate-400">Recent Activity</p>
                        <p className="text-xs text-slate-600">Live</p>
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                          <span className="text-slate-400">License activated — user_8f2a</span>
                          <span className="ml-auto text-slate-600">2s ago</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                          <span className="text-slate-400">Feature flag toggled — darkMode</span>
                          <span className="ml-auto text-slate-600">15s ago</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                          <span className="text-slate-400">Domain check failed — pirated.site</span>
                          <span className="ml-auto text-slate-600">1m ago</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Glow effect */}
                <div className="pointer-events-none absolute -inset-4 -z-10 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 blur-2xl" />
              </div>
            </div>
          </div>
        </section>

        {/* ─── PRICING ─── */}
        <section id="pricing" className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Simple, transparent <span className="text-indigo-400">pricing</span>
              </h2>
              <p className="mt-4 text-lg text-slate-400">
                Start free. Scale as you grow. No hidden fees.
              </p>
            </div>

            <div className="mt-16 grid gap-8 lg:grid-cols-3">
              {/* Free Tier */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8">
                <h3 className="text-lg font-semibold text-white">Free</h3>
                <p className="mt-2 text-sm text-slate-400">Perfect for side projects and testing.</p>
                <div className="mt-6">
                  <span className="text-4xl font-bold text-white">$0</span>
                  <span className="text-slate-500">/month</span>
                </div>
                <ul className="mt-8 space-y-3">
                  {[
                    '2 projects',
                    '50 licenses per project',
                    'Basic license validation',
                    'Domain locking',
                    'Community support',
                    '1K API requests/day',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-slate-300">
                      <svg className="h-4 w-4 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href="/register"
                  className="mt-8 block w-full rounded-lg border border-slate-700 bg-slate-800 py-3 text-center text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  Get Started Free
                </a>
              </div>

              {/* Pro Tier */}
              <div className="relative rounded-2xl border border-indigo-500/50 bg-slate-900/80 p-8 shadow-lg shadow-indigo-500/10">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-medium text-white">
                  Most Popular
                </div>
                <h3 className="text-lg font-semibold text-white">Pro</h3>
                <p className="mt-2 text-sm text-slate-400">For professional developers and small teams.</p>
                <div className="mt-6">
                  <span className="text-4xl font-bold text-white">$29</span>
                  <span className="text-slate-500">/month</span>
                </div>
                <ul className="mt-8 space-y-3">
                  {[
                    '10 projects',
                    '1,000 licenses per project',
                    'Kill-switch & maintenance mode',
                    'Feature flags',
                    'Real-time WebSocket updates',
                    'Tamper detection',
                    'Webhook notifications',
                    'Priority email support',
                    '100K API requests/day',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-slate-300">
                      <svg className="h-4 w-4 shrink-0 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href="/register"
                  className="mt-8 block w-full rounded-lg bg-indigo-600 py-3 text-center text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500"
                >
                  Start Pro Trial
                </a>
              </div>

              {/* Enterprise Tier */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8">
                <h3 className="text-lg font-semibold text-white">Enterprise</h3>
                <p className="mt-2 text-sm text-slate-400">For organizations with advanced needs.</p>
                <div className="mt-6">
                  <span className="text-4xl font-bold text-white">Custom</span>
                </div>
                <ul className="mt-8 space-y-3">
                  {[
                    'Unlimited projects',
                    'Unlimited licenses',
                    'SSO / SAML integration',
                    'Custom SLA (99.99%)',
                    'Dedicated account manager',
                    'On-premise deployment option',
                    'Audit logs & compliance',
                    'Custom integrations',
                    'Unlimited API requests',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-slate-300">
                      <svg className="h-4 w-4 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href="mailto:enterprise@devlock.io"
                  className="mt-8 block w-full rounded-lg border border-slate-700 bg-slate-800 py-3 text-center text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  Contact Sales
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ─── TESTIMONIALS ─── */}
        <section className="border-t border-slate-800 bg-slate-900/30 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Loved by <span className="text-indigo-400">developers</span>
              </h2>
              <p className="mt-4 text-lg text-slate-400">
                See what developers are saying about DevLock.
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {[
                {
                  quote: 'DevLock saved us from a nightmare scenario. A client leaked our source code, and we killed the unauthorized copies instantly with the kill-switch. Worth every penny.',
                  name: 'Sarah Chen',
                  role: 'CTO',
                  company: 'NovaSoft',
                },
                {
                  quote: 'The feature flags alone replaced three other tools we were paying for. Being able to toggle features per license tier without redeploying is a game-changer.',
                  name: 'Marcus Rodriguez',
                  role: 'Lead Developer',
                  company: 'PixelForge',
                },
                {
                  quote: 'We integrated DevLock in under an hour. The SDK is clean, the docs are solid, and the real-time WebSocket updates mean our dashboard always shows the truth.',
                  name: 'Aisha Patel',
                  role: 'Full-Stack Engineer',
                  company: 'CloudBridge',
                },
              ].map((testimonial) => (
                <div
                  key={testimonial.name}
                  className="rounded-xl border border-slate-800 bg-slate-900/50 p-8"
                >
                  <div className="flex gap-1 text-indigo-400" aria-label="5 star rating">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="h-4 w-4 fill-current" viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <blockquote className="mt-4 text-sm leading-relaxed text-slate-300">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{testimonial.name}</p>
                      <p className="text-xs text-slate-500">
                        {testimonial.role} at {testimonial.company}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section id="faq" className="py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Frequently asked <span className="text-indigo-400">questions</span>
              </h2>
              <p className="mt-4 text-lg text-slate-400">
                Everything you need to know about DevLock.
              </p>
            </div>

            <div className="mt-12 space-y-4">
              <details className="group rounded-xl border border-slate-800 bg-slate-900/50 px-6 py-5">
                <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-white">
                  What happens if my app loses internet connectivity?
                  <svg className="h-5 w-5 shrink-0 text-slate-500 transition group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-slate-400">
                  DevLock includes built-in offline support. License validations are cached locally with configurable TTL. Your app continues to work normally during connectivity issues, and syncs back when the connection is restored.
                </p>
              </details>

              <details className="group rounded-xl border border-slate-800 bg-slate-900/50 px-6 py-5">
                <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-white">
                  Can I use DevLock with any programming language?
                  <svg className="h-5 w-5 shrink-0 text-slate-500 transition group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-slate-400">
                  Currently, DevLock provides official SDKs for JavaScript/TypeScript (Node.js, React, Vue, Angular). The REST API can be used with any language. Python, Go, and PHP SDKs are on our roadmap.
                </p>
              </details>

              <details className="group rounded-xl border border-slate-800 bg-slate-900/50 px-6 py-5">
                <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-white">
                  How does the kill-switch work?
                  <svg className="h-5 w-5 shrink-0 text-slate-500 transition group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-slate-400">
                  When you activate the kill-switch from the dashboard, a WebSocket event is broadcast to all connected instances immediately. Apps using the SDK will receive the signal and can gracefully shut down or display a custom message. It typically propagates within 50ms globally.
                </p>
              </details>

              <details className="group rounded-xl border border-slate-800 bg-slate-900/50 px-6 py-5">
                <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-white">
                  Is DevLock open source?
                  <svg className="h-5 w-5 shrink-0 text-slate-500 transition group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-slate-400">
                  Yes! DevLock is fully open source. You can self-host the entire platform or use our managed cloud service. The SDKs, dashboard, and API gateway are all available on GitHub under a permissive license.
                </p>
              </details>

              <details className="group rounded-xl border border-slate-800 bg-slate-900/50 px-6 py-5">
                <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-white">
                  How does domain locking prevent piracy?
                  <svg className="h-5 w-5 shrink-0 text-slate-500 transition group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-slate-400">
                  Domain locking ties a license to specific domains. The SDK checks the current hostname against the allowed list on every validation. If someone copies your code to an unauthorized domain, the license check fails and the app won&apos;t function.
                </p>
              </details>

              <details className="group rounded-xl border border-slate-800 bg-slate-900/50 px-6 py-5">
                <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-white">
                  What&apos;s the difference between devlock-client and devlock-sdk?
                  <svg className="h-5 w-5 shrink-0 text-slate-500 transition group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-4 text-sm leading-relaxed text-slate-400">
                  <strong className="text-slate-200">devlock-client</strong> is for frontend/browser apps — it uses public keys and is safe to bundle. <strong className="text-slate-200">devlock-sdk</strong> is for backend/server apps — it uses secret API keys and provides full management capabilities including license creation and revocation.
                </p>
              </details>
            </div>
          </div>
        </section>

        {/* ─── CTA SECTION ─── */}
        <section className="border-t border-slate-800 bg-gradient-to-b from-slate-900/50 to-slate-950 py-24">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to <span className="text-indigo-400">protect</span> your software?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-slate-400">
              Join 1,200+ developers who trust DevLock to secure and manage their applications. Get started in minutes.
            </p>
            <div className="mx-auto mt-10 flex max-w-md flex-col gap-3 sm:flex-row">
              <label htmlFor="cta-email" className="sr-only">Email address</label>
              <input
                id="cta-email"
                type="email"
                placeholder="you@company.com"
                className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
              <a
                href="/register"
                className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500"
              >
                Get Started Free
              </a>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Free forever for small projects. No credit card required.
            </p>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-slate-800 bg-slate-950 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {/* Brand */}
            <div className="lg:col-span-2">
              <a href="/" className="flex items-center gap-2 text-lg font-bold text-white">
                <svg width="24" height="24" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                  <rect width="28" height="28" rx="6" className="fill-indigo-500" />
                  <path d="M8 8h4v12H8V8zm8 0h4v12h-4V8z" fill="white" />
                </svg>
                DevLock
              </a>
              <p className="mt-4 max-w-xs text-sm text-slate-400">
                Open source software licensing, remote management, and developer protection platform.
              </p>
              <div className="mt-6 flex gap-4">
                <a
                  href="https://github.com/mdtanvirahamedshanto/DevLock"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 transition hover:text-white"
                  aria-label="GitHub"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a href="#" className="text-slate-500 transition hover:text-white" aria-label="Twitter">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a href="#" className="text-slate-500 transition hover:text-white" aria-label="Discord">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold text-white">Product</h4>
              <ul className="mt-4 space-y-3">
                <li><a href="#features" className="text-sm text-slate-400 transition hover:text-white">Features</a></li>
                <li><a href="#pricing" className="text-sm text-slate-400 transition hover:text-white">Pricing</a></li>
                <li><a href="#sdk" className="text-sm text-slate-400 transition hover:text-white">SDKs</a></li>
                <li><a href="/login" className="text-sm text-slate-400 transition hover:text-white">Dashboard</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-sm font-semibold text-white">Resources</h4>
              <ul className="mt-4 space-y-3">
                <li><a href="https://github.com/mdtanvirahamedshanto/DevLock" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 transition hover:text-white">Documentation</a></li>
                <li><a href="https://github.com/mdtanvirahamedshanto/DevLock" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 transition hover:text-white">API Reference</a></li>
                <li><a href="#faq" className="text-sm text-slate-400 transition hover:text-white">FAQ</a></li>
                <li><a href="https://github.com/mdtanvirahamedshanto/DevLock/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-400 transition hover:text-white">Contributing</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-semibold text-white">Legal</h4>
              <ul className="mt-4 space-y-3">
                <li><a href="#" className="text-sm text-slate-400 transition hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="text-sm text-slate-400 transition hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="text-sm text-slate-400 transition hover:text-white">License (MIT)</a></li>
                <li><a href="mailto:support@devlock.io" className="text-sm text-slate-400 transition hover:text-white">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-slate-800 pt-8">
            <p className="text-center text-sm text-slate-500">
              &copy; {new Date().getFullYear()} DevLock. Open source under MIT License.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
