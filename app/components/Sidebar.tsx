'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Zap, LayoutDashboard, GitBranch, Plus, Activity,
  Sparkles, Settings, ChevronRight, LayoutTemplate, BookOpen,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/workflows', label: 'Workflows', icon: GitBranch },
  { href: '/templates', label: 'Templates', icon: LayoutTemplate },
  { href: '/builder', label: 'New Workflow', icon: Plus },
  { href: '/monitor', label: 'Executions', icon: Activity },
  { href: '/docs', label: 'Documentation', icon: BookOpen },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[240px] shrink-0 h-screen flex flex-col bg-white border-r border-[var(--border)]">
      {/* Logo */}
      <div className="px-5 py-5">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
            <Zap className="w-4 h-4 text-white" fill="currentColor" />
          </div>
          <div>
            <span className="text-sm font-bold text-gray-900 tracking-tight">FlowCraft</span>
            <span className="block text-[9px] text-gray-400 font-mono tracking-wider uppercase -mt-0.5">automation</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">
          Menu
        </div>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group
                ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50 border border-transparent'
                }
              `}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-gray-400 group-hover:text-gray-600'} transition-colors`} />
              <span>{label}</span>
              {isActive && <ChevronRight className="w-3 h-3 ml-auto text-emerald-400" />}
            </Link>
          );
        })}
      </nav>

      {/* AI CTA Banner */}
      <div className="px-3 pb-3">
        <Link
          href="/builder"
          className="block p-3 rounded-xl bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border border-emerald-200
                     hover:border-emerald-300 transition-all group"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span className="text-[11px] font-semibold text-gray-800">AI Builder</span>
          </div>
          <p className="text-[10px] text-gray-500 leading-relaxed">
            Describe your automation in plain English & let AI build it.
          </p>
        </Link>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[var(--border)] flex items-center justify-between">
        <span className="text-[9px] text-gray-400 font-mono">v2.0.0</span>
        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
