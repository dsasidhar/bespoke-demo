import { useEffect, useState } from 'react';
import { Activity, Calendar, Map, Sparkles, Boxes, FileBarChart, Settings, LineChart } from 'lucide-react';
import { cn } from '../../lib/utils';

const ITEMS = [
  { id: 'kpi',       label: 'Network overview', icon: <Activity className="size-4" /> },
  { id: 'pipeline',  label: 'Pipeline flow',    icon: <Map className="size-4" /> },
  { id: 'trajectory',label: 'Inventory trajectory', icon: <LineChart className="size-4" /> },
  { id: 'planning',  label: 'Weekly planning',  icon: <Calendar className="size-4" /> },
  { id: 'network',   label: 'Network heatmap',  icon: <Boxes className="size-4" /> },
  { id: 'insights',  label: 'AI insights',      icon: <Sparkles className="size-4" /> },
];

const SECONDARY = [
  { label: 'Reports', icon: <FileBarChart className="size-4" /> },
  { label: 'Forecasting', icon: <LineChart className="size-4" /> },
  { label: 'Settings', icon: <Settings className="size-4" /> },
];

export default function SideNav() {
  const [active, setActive] = useState<string>('kpi');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry that's most visible.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-15% 0px -55% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    );
    for (const it of ITEMS) {
      const el = document.getElementById(it.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      // Account for sticky TopBar (h-14 = 56px) + a touch of breathing room.
      const top = el.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top, behavior: 'smooth' });
      setActive(id);
    }
  };

  return (
    <aside className="hidden lg:flex w-56 flex-col border-r border-ink-100 bg-white sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
      <div className="px-4 pt-5 pb-2 text-[10px] font-semibold text-ink-400 uppercase tracking-wider">
        This view
      </div>
      <nav className="px-2 flex flex-col gap-0.5">
        {ITEMS.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => scrollTo(it.id)}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition text-left w-full',
              active === it.id
                ? 'bg-ink-900 text-white'
                : 'text-ink-700 hover:bg-ink-50',
            )}
          >
            {it.icon} {it.label}
          </button>
        ))}
      </nav>
      <div className="px-4 pt-6 pb-2 text-[10px] font-semibold text-ink-400 uppercase tracking-wider">
        Workspace
      </div>
      <nav className="px-2 flex flex-col gap-0.5">
        {SECONDARY.map((it) => (
          <button
            key={it.label}
            type="button"
            disabled
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-ink-400 hover:bg-ink-50 cursor-not-allowed text-left"
            title="Coming up"
          >
            {it.icon} {it.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
