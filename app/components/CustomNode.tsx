'use client';

import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import * as LucideIcons from 'lucide-react';
import { getNodeDefinition, groupColors, categoryColors } from '../lib/nodeDefinitions';
import BrandIcon, { getBrandColor, hasBrandIcon } from './BrandIcon';

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (LucideIcons as unknown as Record<string, React.FC<{ className?: string }> | undefined>)[name];
  if (!Icon) return <span className={`text-xs ${className ?? ''}`}>•</span>;
  return <Icon className={className} />;
}

/**
 * Smart icon: brand SVG when available, otherwise Lucide fallback.
 */
function NodeIcon({ nodeType, lucideIcon, className, size = 16 }: { nodeType: string; lucideIcon: string; className?: string; size?: number }) {
  if (hasBrandIcon(nodeType)) {
    return <BrandIcon name={nodeType} className={className} size={size} />;
  }
  return <DynamicIcon name={lucideIcon} className={className} />;
}

/* ────────────────────────────────────────
   n8n-style Node – square icon card with
   label below and handles on sides
   ──────────────────────────────────────── */
function CustomNodeInner({ data, selected }: NodeProps) {
  const nodeType = data?.nodeType as string;
  const def = getNodeDefinition(nodeType);
  const label = (data?.label as string) || def?.label || nodeType;
  const config = data?.config as Record<string, string> | undefined;
  const description = def?.description || '';
  const executionStatus = data?.executionStatus as 'completed' | 'failed' | undefined;

  const category = def?.category || 'action';
  const group = def?.group || 'core';
  const gColors = groupColors[group] || groupColors.core;
  const iconName = def?.icon || 'Zap';
  const brandColor = getBrandColor(nodeType);
  const accentColor = brandColor || '#059669';

  // Execution status border colors
  const borderColor = executionStatus === 'completed'
    ? '#22c55e'
    : executionStatus === 'failed'
      ? '#ef4444'
      : selected
        ? accentColor
        : '#e5e7eb';
  const glowColor = executionStatus === 'completed'
    ? '#22c55e'
    : executionStatus === 'failed'
      ? '#ef4444'
      : accentColor;

  const showTargetHandle = category !== 'trigger';
  const showSourceHandle = category !== 'output';

  const configCount = config ? Object.values(config).filter(Boolean).length : 0;

  return (
    <div className="flex flex-col items-center" style={{ width: 160 }}>
      {/* ── Square icon card ── */}
      <div
        className={`relative flex items-center justify-center rounded-2xl transition-all duration-200
          ${selected
            ? 'ring-2 ring-offset-2 ring-offset-white'
            : 'hover:shadow-lg'
          }
        `}
        style={{
          width: 64,
          height: 64,
          background: '#ffffff',
          border: `2px solid ${borderColor}`,
          boxShadow: selected || executionStatus
            ? `0 0 16px ${glowColor}25, 0 4px 16px rgba(0,0,0,0.08)`
            : '0 2px 8px rgba(0,0,0,0.06)',
          // @ts-expect-error CSS custom property
          '--tw-ring-color': selected ? accentColor : 'transparent',
        }}
      >
        {/* Icon */}
        <div className="relative z-10" style={{ color: brandColor || undefined }}>
          <NodeIcon
            nodeType={nodeType}
            lucideIcon={iconName}
            className={brandColor ? '' : `w-7 h-7 ${gColors.text}`}
            size={28}
          />
        </div>

        {/* Subtle brand-colored inner glow */}
        <div
          className="absolute inset-0 rounded-2xl opacity-30 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${accentColor}10 0%, transparent 70%)`,
          }}
        />

        {/* Configured indicator dot */}
        {configCount > 0 && (
          <div
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white"
            style={{ background: '#22c55e' }}
          />
        )}

        {/* ── Handles ── */}
        {showTargetHandle && (
          <Handle
            type="target"
            position={Position.Left}
            className="!w-[10px] !h-[10px] !border-[2px] !rounded-full !-left-[6px]"
            style={{
              borderColor: accentColor,
              background: '#ffffff',
              transition: 'all 0.15s ease',
            }}
          />
        )}
        {showSourceHandle && category !== 'condition' && (
          <Handle
            type="source"
            position={Position.Right}
            className="!w-[10px] !h-[10px] !border-[2px] !rounded-full !-right-[6px]"
            style={{
              borderColor: accentColor,
              background: '#ffffff',
              transition: 'all 0.15s ease',
            }}
          />
        )}
        {category === 'condition' && (
          <>
            <Handle
              type="source"
              position={Position.Right}
              id="true"
              className="!w-[10px] !h-[10px] !border-[2px] !rounded-full !-right-[6px]"
              style={{
                borderColor: '#22c55e',
                background: '#ffffff',
                top: '30%',
              }}
            />
            <Handle
              type="source"
              position={Position.Right}
              id="false"
              className="!w-[10px] !h-[10px] !border-[2px] !rounded-full !-right-[6px]"
              style={{
                borderColor: '#ef4444',
                background: '#ffffff',
                top: '70%',
              }}
            />
          </>
        )}

        {/* Category badge */}
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
          <span
            className={`text-[7px] px-1.5 py-[2px] rounded font-bold uppercase tracking-wider whitespace-nowrap
              ${categoryColors[category]?.bg || 'bg-gray-100'} ${categoryColors[category]?.text || 'text-gray-400'}
            `}
          >
            {category === 'trigger' ? 'TRG' : category === 'condition' ? 'CND' : category === 'output' ? 'OUT' : 'ACT'}
          </span>
        </div>
      </div>

      {/* ── Label below the card ── */}
      <div className="mt-2 text-center max-w-[160px]">
        <p className="text-[11px] font-semibold text-gray-800 truncate leading-tight">
          {label}
        </p>
        {description && (
          <p className="text-[9px] text-gray-400 truncate leading-tight mt-0.5">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

const CustomNode = memo(CustomNodeInner);
export default CustomNode;
export { NodeIcon, DynamicIcon };
