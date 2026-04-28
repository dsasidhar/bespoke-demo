import { Link } from 'react-router-dom';
import { ArrowLeft, Search, Bell, ChevronDown } from 'lucide-react';

export default function TopBar({ snapshotDate }: { snapshotDate: string }) {
  return (
    <header className="sticky top-0 z-30 bg-ink-900 text-white border-b border-ink-700">
      <div className="h-14 px-5 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 text-white/80 hover:text-white text-sm">
          <ArrowLeft className="size-4" /> Directions
        </Link>
        <span className="h-5 w-px bg-white/15" />
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-accent grid place-items-center">
            <span className="text-ink-900 font-bold text-sm">B</span>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Bespoke</div>
            <div className="text-[10px] text-white/50">Pipeline Control Tower</div>
          </div>
        </div>

        <div className="flex-1 max-w-xl mx-6 hidden md:block">
          <div className="flex items-center gap-2 px-3 h-9 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70">
            <Search className="size-4" />
            <span>Search SKU, DC, PO, vessel…</span>
            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-white/10">⌘K</span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button className="hidden md:flex items-center gap-2 text-sm text-white/80 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/25">
            Snapshot · {snapshotDate}
            <ChevronDown className="size-4" />
          </button>
          <button className="size-9 rounded-lg grid place-items-center hover:bg-white/10 relative">
            <Bell className="size-4" />
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-rose-400 ring-2 ring-ink-900" />
          </button>
          <div className="size-8 rounded-full bg-cocoa-500 grid place-items-center text-xs font-semibold">JM</div>
        </div>
      </div>
    </header>
  );
}
