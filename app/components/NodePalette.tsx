'use client';

import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import {
  nodeCatalog,
  groupMeta,
  groupColors,
  categoryColors,
  allGroups,
  searchNodes,
} from '../lib/nodeDefinitions';
import type { NodeDefinition } from '../lib/nodeDefinitions';
import BrandIcon, { getBrandColor, hasBrandIcon } from './BrandIcon';

// ─── Dynamic Lucide Icon ──────────────────────────────────────────────────────
function DynamicIcon({ name, className }: { name: string; className?: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as unknown as Record<string, React.FC<{ className?: string }> | undefined>)[name];
  if (!Icon) return <span className={`text-xs ${className ?? ''}`}>•</span>;
  return <Icon className={className} />;
}

// ─── Smart Node Icon ──────────────────────────────────────────────────────────
function SmartNodeIcon({ nodeType, lucideIcon, className, size = 14 }: {
  nodeType: string;
  lucideIcon: string;
  className?: string;
  size?: number;
}) {
  if (hasBrandIcon(nodeType)) {
    return <BrandIcon name={nodeType} className={className} size={size} />;
  }
  return <DynamicIcon name={lucideIcon} className={className} />;
}

// ─── Category Badge ───────────────────────────────────────────────────────────
function CategoryBadge({ category }: { category: NodeDefinition['category'] }) {
  const c = categoryColors[category];
  return (
    <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${c.bg} ${c.text} shrink-0`}>
      {c.label}
    </span>
  );
}

// ─── Single Draggable Node ────────────────────────────────────────────────────
function PaletteNode({ node }: { node: NodeDefinition }) {
  const gColors = groupColors[node.group] ?? groupColors.core;
  const brandColor = getBrandColor(node.type);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/flowcraft-node', node.type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="group flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-grab active:cursor-grabbing
                 hover:bg-gray-50 transition-all border border-transparent hover:border-gray-200"
      title={node.description}
    >
      {/* Icon with brand color */}
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 relative"
        style={{
          background: brandColor ? `${brandColor}15` : undefined,
          border: brandColor ? `1px solid ${brandColor}20` : undefined,
        }}
      >
        {!brandColor && <div className={`absolute inset-0 rounded-lg ${gColors.light}`} />}
        <div className="relative z-10" style={{ color: brandColor || undefined }}>
          <SmartNodeIcon
            nodeType={node.type}
            lucideIcon={node.icon}
            className={brandColor ? '' : `w-3.5 h-3.5 ${gColors.text}`}
            size={14}
          />
        </div>
      </div>

      {/* Label + description */}
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-medium text-gray-800 leading-tight truncate">
          {node.label}
        </div>
        <div className="text-[10px] text-gray-400 truncate group-hover:text-gray-500 transition-colors">
          {node.description}
        </div>
      </div>

      {/* Category badge */}
      <CategoryBadge category={node.category} />
    </div>
  );
}

// ─── Group Section ────────────────────────────────────────────────────────────
function GroupSection({
  group,
  nodes,
  isExpanded,
  onToggle,
}: {
  group: string;
  nodes: NodeDefinition[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const meta = groupMeta[group];
  const gColors = groupColors[group] ?? groupColors.core;

  return (
    <div className="mb-1">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 transition-colors text-left"
      >
        <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${gColors.light}`}>
          <DynamicIcon name={meta.icon} className={`w-3 h-3 ${gColors.text}`} />
        </div>
        <span className="flex-1 text-[11px] font-semibold text-gray-700">{meta.label}</span>
        <span className="text-[9px] text-gray-400 mr-1">{nodes.length}</span>
        {isExpanded
          ? <ChevronDown className="w-3 h-3 text-gray-400" />
          : <ChevronRight className="w-3 h-3 text-gray-400" />}
      </button>

      {isExpanded && (
        <div className="mt-0.5 space-y-0.5">
          {nodes.map(node => (
            <PaletteNode key={node.type} node={node} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main NodePalette ─────────────────────────────────────────────────────────
export default function NodePalette({ className = '' }: { className?: string }) {
  const [query, setQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(['core', 'communication'])
  );

  // Filtered results when searching
  const filtered = useMemo(() => {
    if (!query.trim()) return null;
    return searchNodes(query);
  }, [query]);

  // Full grouped catalog
  const grouped = useMemo(() => {
    const map: Record<string, NodeDefinition[]> = {};
    allGroups.forEach(g => {
      const nodes = nodeCatalog.filter(n => n.group === g);
      if (nodes.length > 0) map[g] = nodes;
    });
    return map;
  }, []);

  // Grouped version of filtered results
  const filteredGrouped = useMemo(() => {
    if (!filtered) return null;
    const map: Record<string, NodeDefinition[]> = {};
    filtered.forEach(n => {
      if (!map[n.group]) map[n.group] = [];
      map[n.group].push(n);
    });
    return map;
  }, [filtered]);

  const displayGrouped = filteredGrouped ?? grouped;
  // When searching expand all; otherwise use manual expand state
  const effectiveExpanded = filtered ? new Set(allGroups) : expandedGroups;

  const toggleGroup = (group: string) => {
    if (filtered) return;
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  return (
    <aside
      className={`flex flex-col h-full bg-white border-r border-[var(--border)] select-none ${className}`}
      style={{ width: 220 }}
    >
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-[var(--border)]">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Nodes</p>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search nodes…"
            className="w-full pl-7 pr-2 py-1.5 text-[11px] bg-gray-50 border border-gray-200 rounded-md text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:bg-emerald-50/30 transition-all"
          />
        </div>
      </div>

      {/* Node list */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 scrollbar-thin">
        {filtered && filtered.length === 0 ? (
          <p className="text-[11px] text-gray-400 text-center pt-6">
            No nodes match &quot;{query}&quot;
          </p>
        ) : (
          allGroups
            .filter(g => displayGrouped[g] && displayGrouped[g].length > 0)
            .map(group => (
              <GroupSection
                key={group}
                group={group}
                nodes={displayGrouped[group]}
                isExpanded={effectiveExpanded.has(group)}
                onToggle={() => toggleGroup(group)}
              />
            ))
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-[var(--border)]">
        <p className="text-[9px] text-gray-400 text-center">Drag nodes onto the canvas</p>
      </div>
    </aside>
  );
}
