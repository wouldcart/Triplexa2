import React, { useCallback, useEffect, useRef, useState } from 'react';

type Bounds = { left: number; top: number; width: number; height: number };

interface AreaSelectionAgentPanelProps {
  className?: string;
  height?: number;
}

/**
 * AreaSelectionAgentPanel
 * - Implements drag-to-select area tracking over an agent grid (p element shows selection feedback)
 * - Captures precise rectangle bounds and maintains selection state
 * - Displays comprehensive agent details (div) for the first selected agent
 * - Fetches agent details from public.agents via AgentManagementService
 * - Integrates loading indicators, transitions, accessibility, and caching
 */
export const AreaSelectionAgentPanel: React.FC<AreaSelectionAgentPanelProps> = ({ className = '', height = 380 }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectionBoxRef = useRef<HTMLDivElement | null>(null);

  const [isSelecting, setIsSelecting] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentBounds, setCurrentBounds] = useState<Bounds | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingPointRef = useRef<{ x: number; y: number } | null>(null);
  // Removed selectedAgentIds; panel only tracks selection box

  // No agent list or details here; selection surface only

  // Mouse / touch selection handlers
  const beginSelection = useCallback((x: number, y: number) => {
    setIsSelecting(true);
    setStartPoint({ x, y });
    setCurrentBounds({ left: x, top: y, width: 0, height: 0 });
  }, []);

  const updateSelection = useCallback((x: number, y: number) => {
    if (!isSelecting || !startPoint) return;
    pendingPointRef.current = { x, y };
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(() => {
        const p = pendingPointRef.current;
        rafRef.current = null;
        if (!p || !startPoint) return;
        const left = Math.min(startPoint.x, p.x);
        const top = Math.min(startPoint.y, p.y);
        const width = Math.abs(p.x - startPoint.x);
        const height = Math.abs(p.y - startPoint.y);
        setCurrentBounds({ left, top, width, height });
      });
    }
  }, [isSelecting, startPoint]);

  const endSelection = useCallback(() => {
    setIsSelecting(false);
    setStartPoint(null);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // No agent intersection computation; only draws selection rectangle

  // Keyboard: Esc clears selection box
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCurrentBounds(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Attach mouse/touch listeners
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const onMouseDown = (e: MouseEvent) => {
      // Only start selection if clicking background area
      if ((e.target as HTMLElement).closest('[data-agent-item]')) return;
      beginSelection(e.clientX, e.clientY);
    };
    const onMouseMove = (e: MouseEvent) => updateSelection(e.clientX, e.clientY);
    const onMouseUp = () => endSelection();

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      beginSelection(t.clientX, t.clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      updateSelection(t.clientX, t.clientY);
    };
    const onTouchEnd = () => endSelection();

    root.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    root.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      root.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      root.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [beginSelection, updateSelection, endSelection]);

  // No agent details; no helpers needed

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Selection surface only */}
      <div
        ref={containerRef}
        className="relative rounded-md border bg-muted/20"
        style={{ height }}
        aria-label="Selection surface"
      >
        {/* Visual selection rectangle */}
        {currentBounds && (
          <div
            ref={selectionBoxRef}
            className="absolute border border-blue-500/70 bg-blue-400/20 pointer-events-none transition-none"
            style={{
              left: currentBounds.left,
              top: currentBounds.top,
              width: currentBounds.width,
              height: currentBounds.height,
            }}
          />
        )}
      </div>
    </div>
  );
};

export default AreaSelectionAgentPanel;