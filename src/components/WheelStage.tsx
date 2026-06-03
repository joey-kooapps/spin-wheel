import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Filter, Play, RotateCcw, Sparkles, X } from 'lucide-react';
import type { WheelItem, WinnerResult } from '../types';
import { getVisibleItems, plural, sanitizeWeight } from '../utils/data';
import { normalizeAngle, pickWinnerByAngle, segmentColor } from '../utils/wheel';

const TWO_PI = Math.PI * 2;
const DECAY_PER_SECOND = 0.55;
const MIN_VELOCITY_RAD_S = 0.05;
const BUTTON_START_VELOCITY = 8.4;
const VELOCITY_WINDOW_MS = 120;
const MOVE_EPS = 0.01;
const HOLD_TO_CANCEL_MS = 120;

interface WheelStageProps {
  allItems: WheelItem[];
  visibleItems: WheelItem[];
  filterTags: string[];
  filterInput: string;
  winner: WinnerResult | null;
  onFilterInputChange: (value: string) => void;
  onApplyFilter: () => void;
  onClearFilter: () => void;
  onWinner: (winner: WinnerResult) => void;
  onClearWinner: () => void;
}

interface VelocitySample {
  t: number;
  dAngle: number;
}

function truncateCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const label = text || 'Untitled item';
  if (ctx.measureText(label).width <= maxWidth) return label;

  let truncated = label;
  while (truncated.length > 1 && ctx.measureText(`${truncated}...`).width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated.trim()}...`;
}

function getPointerAngle(event: React.PointerEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  return Math.atan2(y - rect.height / 2, x - rect.width / 2);
}

function normAngleDelta(delta: number) {
  let next = delta;
  while (next > Math.PI) next -= TWO_PI;
  while (next < -Math.PI) next += TWO_PI;
  return next;
}

export function WheelStage({
  allItems,
  visibleItems,
  filterTags,
  filterInput,
  winner,
  onFilterInputChange,
  onApplyFilter,
  onClearFilter,
  onWinner,
  onClearWinner,
}: WheelStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wheelRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastAnimTimeRef = useRef<number | null>(null);
  const spinVelocityRef = useRef(0);
  const rotationRef = useRef(0);
  const spinningRef = useRef(false);
  const visibleRef = useRef(visibleItems);
  const filterRef = useRef(filterTags);
  const onWinnerRef = useRef(onWinner);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [grabbing, setGrabbing] = useState(false);
  const dragRef = useRef({
    isDragging: false,
    lastAngle: 0,
    lastSignificantMoveTs: 0,
    samples: [] as VelocitySample[],
    wasSpinning: false,
  });

  useEffect(() => {
    visibleRef.current = visibleItems;
    filterRef.current = filterTags;
    onWinnerRef.current = onWinner;
  }, [filterTags, onWinner, visibleItems]);

  const summary = useMemo(() => {
    if (!allItems.length) return 'Add items to build your wheel.';
    if (filterTags.length) {
      return `Showing ${visibleItems.length} of ${plural(allItems.length, 'item')} matching ${filterTags.join(', ')}`;
    }
    return `${plural(allItems.length, 'item')} in the wheel`;
  }, [allItems.length, filterTags, visibleItems.length]);

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    const container = wheelRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const cssWidth = Math.max(1, rect.width || 420);
    const cssHeight = Math.max(1, rect.height || 420);
    const dpr = window.devicePixelRatio || 1;
    const pixelWidth = Math.round(cssWidth * dpr);
    const pixelHeight = Math.round(cssHeight * dpr);

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssWidth, cssHeight);

    const cx = cssWidth / 2;
    const cy = cssHeight / 2;
    const radius = Math.max(1, Math.min(cssWidth, cssHeight) / 2 - 8);
    const items = visibleItems;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 3, 0, TWO_PI);
    const rim = ctx.createLinearGradient(0, 0, cssWidth, cssHeight);
    rim.addColorStop(0, '#41d1ff');
    rim.addColorStop(0.35, '#bd34fe');
    rim.addColorStop(0.7, '#ffea83');
    rim.addColorStop(1, '#35f2cf');
    ctx.strokeStyle = rim;
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.restore();

    if (!items.length) {
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, TWO_PI);
      ctx.fillStyle = '#11182f';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#f8fbff';
      ctx.font = '800 22px Inter, system-ui, sans-serif';
      ctx.fillText(allItems.length ? 'No matches' : 'No items yet', cx, cy - 10);
      ctx.fillStyle = '#a8b3d8';
      ctx.font = '600 14px Inter, system-ui, sans-serif';
      ctx.fillText(allItems.length ? 'Clear the active filter' : 'Add items in the inspector', cx, cy + 20);
      return;
    }

    const weights = items.map((item) => sanitizeWeight(item.weight, 1));
    const totalWeight = weights.reduce((total, weight) => total + weight, 0);
    let start = rotationAngle;

    items.forEach((item, index) => {
      const span = TWO_PI * (weights[index] / totalWeight);
      const startAngle = start;
      const endAngle = start + span;
      const color = segmentColor(index, items.length);

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = 'rgba(5, 8, 18, 0.76)';
      ctx.stroke();

      const mid = (startAngle + endAngle) / 2;
      if (span > 0.08 && radius > 110) {
        const labelAngle = normalizeAngle(mid);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(mid);
        ctx.shadowColor = 'rgba(0,0,0,0.36)';
        ctx.shadowBlur = 4;
        ctx.fillStyle = '#081020';
        ctx.font = '900 13px Inter, system-ui, sans-serif';
        ctx.textBaseline = 'middle';
        const maxWidth = Math.max(54, radius * 0.46);

        if (labelAngle > Math.PI / 2 && labelAngle < (3 * Math.PI) / 2) {
          ctx.rotate(Math.PI);
          ctx.textAlign = 'left';
          ctx.fillText(truncateCanvasText(ctx, item.name, maxWidth), -radius + 24, 0);
        } else {
          ctx.textAlign = 'right';
          ctx.fillText(truncateCanvasText(ctx, item.name, maxWidth), radius - 24, 0);
        }
        ctx.restore();
      }

      start += span;
    });

    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(24, radius * 0.09), 0, TWO_PI);
    ctx.fillStyle = '#080b16';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255,255,255,0.72)';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(8, radius * 0.03), 0, TWO_PI);
    ctx.fillStyle = '#ffea83';
    ctx.fill();
  }, [allItems.length, rotationAngle, visibleItems]);

  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

  useEffect(() => {
    const redraw = () => drawWheel();
    const container = wheelRef.current;
    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(redraw) : null;
    if (container) resizeObserver?.observe(container);
    window.addEventListener('resize', redraw);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', redraw);
    };
  }, [drawWheel]);

  const stopSpin = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    lastAnimTimeRef.current = null;
    spinVelocityRef.current = 0;
    spinningRef.current = false;
    setSpinning(false);
  }, []);

  const finishSpin = useCallback(() => {
    stopSpin();
    const result = pickWinnerByAngle(visibleRef.current, rotationRef.current, filterRef.current);
    if (result) onWinnerRef.current(result);
  }, [stopSpin]);

  const startInertia = useCallback(
    (velocity: number) => {
      if (!visibleRef.current.length) return;
      spinVelocityRef.current = velocity;
      lastAnimTimeRef.current = null;
      spinningRef.current = true;
      setSpinning(true);

      const animate = (timestamp: number) => {
        if (!spinningRef.current) return;
        if (lastAnimTimeRef.current == null) {
          lastAnimTimeRef.current = timestamp;
          rafRef.current = requestAnimationFrame(animate);
          return;
        }

        const delta = Math.max(0, (timestamp - lastAnimTimeRef.current) / 1000);
        lastAnimTimeRef.current = timestamp;
        const nextAngle = normalizeAngle(rotationRef.current + spinVelocityRef.current * delta);
        rotationRef.current = nextAngle;
        setRotationAngle(nextAngle);

        spinVelocityRef.current *= Math.pow(DECAY_PER_SECOND, delta);
        if (Math.abs(spinVelocityRef.current) > MIN_VELOCITY_RAD_S) {
          rafRef.current = requestAnimationFrame(animate);
        } else {
          rafRef.current = null;
          finishSpin();
        }
      };

      rafRef.current = requestAnimationFrame(animate);
    },
    [finishSpin],
  );

  const startButtonSpin = () => {
    if (!visibleItems.length || spinning) return;
    stopSpin();
    onClearWinner();
    const startAngle = Math.random() * TWO_PI;
    rotationRef.current = startAngle;
    setRotationAngle(startAngle);
    startInertia(BUTTON_START_VELOCITY);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!visibleItems.length) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const wasSpinning = spinningRef.current;
    stopSpin();
    onClearWinner();
    dragRef.current = {
      isDragging: true,
      lastAngle: getPointerAngle(event, canvas),
      lastSignificantMoveTs: performance.now(),
      samples: [],
      wasSpinning,
    };
    setGrabbing(true);
    canvas.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const drag = dragRef.current;
    if (!canvas || !drag.isDragging) return;
    event.preventDefault();

    const angle = getPointerAngle(event, canvas);
    const delta = normAngleDelta(angle - drag.lastAngle);
    const nextAngle = normalizeAngle(rotationRef.current + delta);
    rotationRef.current = nextAngle;
    setRotationAngle(nextAngle);

    const now = performance.now();
    if (Math.abs(delta) >= MOVE_EPS) drag.lastSignificantMoveTs = now;
    drag.samples.push({ t: now, dAngle: delta });
    const cutoff = now - VELOCITY_WINDOW_MS;
    drag.samples = drag.samples.filter((sample) => sample.t >= cutoff);
    drag.lastAngle = angle;
  };

  const endDrag = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag.isDragging) return;
    event.preventDefault();
    drag.isDragging = false;
    setGrabbing(false);

    const now = performance.now();
    const heldLongEnough = now - drag.lastSignificantMoveTs >= HOLD_TO_CANCEL_MS;
    if (!drag.samples.length) {
      if (drag.wasSpinning) finishSpin();
      return;
    }

    const first = drag.samples[0];
    const last = drag.samples[drag.samples.length - 1];
    const totalMs = Math.max(1, last.t - first.t);
    const netAngle = drag.samples.reduce((sum, sample) => sum + sample.dAngle, 0);
    const vWindow = (netAngle / totalMs) * 1000;
    const previous = drag.samples[drag.samples.length - 2];
    const vInstant = previous ? (last.dAngle / Math.max(1, last.t - previous.t)) * 1000 : vWindow;

    if (heldLongEnough && Math.abs(vInstant) < 0.25) {
      if (drag.wasSpinning) finishSpin();
      return;
    }

    if (Math.abs(vInstant) >= 0.5 && Math.abs(vWindow) >= 0.5) {
      startInertia(vWindow);
      return;
    }

    if (drag.wasSpinning) finishSpin();
  };

  useEffect(() => () => stopSpin(), [stopSpin]);

  return (
    <section className="wheel-stage" aria-label="Spin wheel">
      <div className="stage-toolbar">
        <div>
          <p className="eyebrow">Spin control</p>
          <h1>Spin Wheel</h1>
        </div>
        <div className="stage-metrics" aria-label="Wheel metrics">
          <span className="metric-chip">
            <Sparkles size={15} aria-hidden="true" />
            {visibleItems.length} visible
          </span>
          <span className="metric-chip accent">
            {allItems.reduce((total, item) => total + sanitizeWeight(item.weight, 1), 0).toFixed(2)} weight
          </span>
        </div>
      </div>

      <div className={`wheel-frame ${grabbing ? 'is-grabbing' : ''}`} ref={wheelRef}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={
            filterTags.length
              ? `Spin wheel with ${visibleItems.length} of ${allItems.length} items after filtering`
              : `Spin wheel with ${visibleItems.length} items`
          }
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerLeave={(event) => {
            if (dragRef.current.isDragging && !canvasRef.current?.hasPointerCapture?.(event.pointerId)) {
              endDrag(event);
            }
          }}
        />
        <div className="wheel-pointer" aria-hidden="true" />
      </div>

      <div className="spin-panel">
        <button className="spin-button" type="button" disabled={!visibleItems.length || spinning} onClick={startButtonSpin}>
          <Play size={20} fill="currentColor" aria-hidden="true" />
          {spinning ? 'Spinning' : 'Spin'}
        </button>

        <form
          className="filter-control"
          onSubmit={(event) => {
            event.preventDefault();
            onApplyFilter();
          }}
        >
          <label className="sr-only" htmlFor="filterTags">
            Filter tags
          </label>
          <div className="input-with-icon">
            <Filter size={16} aria-hidden="true" />
            <input
              id="filterTags"
              value={filterInput}
              onChange={(event) => onFilterInputChange(event.target.value)}
              placeholder="Filter tags"
            />
          </div>
          <button className="icon-button" type="submit" aria-label="Apply tag filter">
            <Filter size={17} aria-hidden="true" />
          </button>
          <button className="icon-button ghost" type="button" onClick={onClearFilter} aria-label="Clear tag filter">
            <X size={18} aria-hidden="true" />
          </button>
        </form>
      </div>

      <div className="status-strip" role="status" aria-live="polite">
        {winner ? (
          <strong>Winner: {winner.item.name}</strong>
        ) : (
          <span>{visibleItems.length ? summary : allItems.length ? 'No items match the active filter.' : summary}</span>
        )}
      </div>

      {filterTags.length > 0 && (
        <button className="button quiet compact" type="button" onClick={onClearFilter}>
          <RotateCcw size={15} aria-hidden="true" />
          Clear {filterTags.join(', ')}
        </button>
      )}
    </section>
  );
}
