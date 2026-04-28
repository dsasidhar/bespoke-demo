import { Link } from 'react-router-dom';
import { ArrowRight, Activity, MapPin } from 'lucide-react';

interface Exploration {
  slug: string;
  title: string;
  blurb: string;
  icon: React.ReactNode;
}

const PRIMARY = {
  slug: '/d/walmart-pilot',
  title: 'Walmart Pilot — v0',
  subtitle: 'The build for Clint',
  blurb:
    'One console for the full path: Greek factory → Rotterdam → Newark → 3PL → 27 McLane DCs → 4,000 Walmart stores. Pipeline ribbon with disruption notes, weekly planning grid, region/DC heatmap, and a what-if simulator.',
  bullets: [
    'Pipeline ribbon with per-node disruption notes',
    'Weekly planning grid · forecast vs arrivals',
    'Region / DC heatmap toggle',
    'What-if simulator (McLane override, expedite, demand spike)',
  ],
};

const EXPLORATIONS: Exploration[] = [
  {
    slug: '/d/control-tower',
    title: 'Pipeline Control Tower',
    blurb: 'Earlier single-pane operations console. DNA folded into the pilot.',
    icon: <Activity className="size-4" />,
  },
  {
    slug: '/d/dc-pulse',
    title: 'DC Pulse',
    blurb: 'SKU-first take with status cards and a demand-event readiness timeline.',
    icon: <MapPin className="size-4" />,
  },
];

export default function IndexPage() {
  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-6xl px-6 py-10 lg:py-14">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-ink-900 grid place-items-center">
              <span className="text-accent font-bold text-lg">B</span>
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight text-ink-900">Bespoke</div>
              <div className="text-xs text-ink-400">Better Goods × Walmart · Supply Chain Visibility</div>
            </div>
          </div>
          <span className="pill bg-amber-50 text-amber-800 border border-amber-200">
            v0 · fake data
          </span>
        </header>

        <section className="mb-10 max-w-3xl">
          <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight text-ink-900 mb-4 leading-[1.05]">
            From Greek factory to Walmart shelf —<br />
            <span className="text-ink-400">one console.</span>
          </h1>
          <p className="text-base lg:text-lg text-ink-500 leading-relaxed">
            8 Better Goods SKUs · Eon &amp; Lavdas in Greece · 3PL near Newark · 27 McLane DCs ·
            4,000 Walmart stores. Built for the May 18 review with Clint.
          </p>
        </section>

        <section className="mb-16">
          <Link
            to={PRIMARY.slug}
            className="group block relative rounded-2xl bg-ink-900 text-white p-8 lg:p-10 shadow-soft ring-1 ring-amber-400/20 hover:ring-amber-400/50 transition"
          >
            <div className="flex items-start justify-between gap-6 mb-6">
              <div>
                <div className="text-xs uppercase tracking-wider text-amber-300 font-semibold mb-2">
                  {PRIMARY.subtitle}
                </div>
                <h2 className="text-3xl lg:text-4xl font-semibold tracking-tight">{PRIMARY.title}</h2>
              </div>
              <span className="pill bg-amber-400 text-ink-900 font-semibold whitespace-nowrap">
                Open demo
              </span>
            </div>
            <p className="text-base text-white/75 leading-relaxed max-w-3xl mb-6">
              {PRIMARY.blurb}
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 mb-6">
              {PRIMARY.bullets.map((b) => (
                <li key={b} className="text-sm text-white/85 flex items-start gap-2">
                  <span className="mt-1.5 size-1 rounded-full bg-accent shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-300 group-hover:text-amber-200">
              Open the build
              <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        </section>

        <section className="mb-16">
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="text-xs font-semibold text-ink-500 uppercase tracking-wider">
              Other directions explored
            </h3>
            <span className="text-xs text-ink-400">for reference</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {EXPLORATIONS.map((e) => (
              <Link
                key={e.slug}
                to={e.slug}
                className="group card p-5 hover:border-ink-300 hover:-translate-y-0.5 transition"
              >
                <div className="flex items-center gap-2 mb-2 text-ink-500">
                  <span className="size-7 rounded-md bg-ink-50 grid place-items-center text-ink-700">
                    {e.icon}
                  </span>
                  <span className="text-sm font-semibold text-ink-900">{e.title}</span>
                </div>
                <p className="text-xs text-ink-500 leading-relaxed mb-3">{e.blurb}</p>
                <div className="text-xs font-medium text-ink-700 inline-flex items-center gap-1 group-hover:text-ink-900">
                  Open <ArrowRight className="size-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-16">
          <Stat label="McLane DCs" value="27" sub="12 representative shown" />
          <Stat label="Walmart stores" value="4,000" sub="downstream of McLane" />
          <Stat label="Better Goods SKUs" value="8" sub="6 chocolate · 2 gummy" />
          <Stat label="PO lead time" value="10 wks" sub="Greek/Swiss supplier" />
        </section>

        <footer className="pt-6 border-t border-ink-100 flex flex-wrap items-center justify-between gap-4 text-xs text-ink-400">
          <div>Bespoke × Walmart · Private prototype · v0</div>
          <div className="flex items-center gap-3">
            <span>Snapshot: Apr 27, 2026</span>
            <span>·</span>
            <span>Demo only — not connected to NetSuite or McLane</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card p-4">
      <div className="text-[10px] text-ink-400 uppercase tracking-wider font-medium">{label}</div>
      <div className="mt-1 text-2xl font-semibold num text-ink-900">{value}</div>
      <div className="text-xs text-ink-500 mt-0.5">{sub}</div>
    </div>
  );
}
