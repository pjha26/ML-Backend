/**
 * TimelineChart
 */
import { useRef, useEffect } from 'react';

export default function TimelineChart({ history = [] }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const w = rect.width;
        const h = rect.height;
        const padding = { top: 20, right: 10, bottom: 24, left: 35 };
        const chartW = w - padding.left - padding.right;
        const chartH = h - padding.top - padding.bottom;

        // Clear
        ctx.clearRect(0, 0, w, h);

        // Horizontal Grid lines only
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (chartH / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(w - padding.right, y);
            ctx.stroke();
        }

        // Y-axis labels
        ctx.fillStyle = 'var(--text-muted)';
        ctx.font = '10px var(--font-mono)';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (chartH / 4) * i;
            ctx.fillText(`${100 - i * 25}`, padding.left - 8, y + 4);
        }

        if (history.length < 2) {
            // No data
            ctx.fillStyle = 'var(--text-muted)';
            ctx.font = '12px var(--font-mono)';
            ctx.textAlign = 'center';
            ctx.fillText('WAITING_FOR_DATA', w / 2, h / 2);
            return;
        }

        const maxTime = history[history.length - 1].time;
        const minTime = history[0].time;
        const timeRange = maxTime - minTime || 1;

        const points = history.map((d) => ({
            x: padding.left + ((d.time - minTime) / timeRange) * chartW,
            y: padding.top + chartH - (d.concentration / 100) * chartH,
        }));

        // Line Only (No Fill)
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            const xc = (points[i - 1].x + points[i].x) / 2;
            const yc = (points[i - 1].y + points[i].y) / 2;
            ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
        }
        ctx.quadraticCurveTo(
            points[points.length - 1].x,
            points[points.length - 1].y,
            points[points.length - 1].x,
            points[points.length - 1].y
        );

        ctx.strokeStyle = '#4F46E5';
        ctx.lineWidth = 2;
        ctx.stroke();

        // X-axis time labels
        ctx.fillStyle = 'var(--text-muted)';
        ctx.font = '10px var(--font-mono)';
        ctx.textAlign = 'center';
        const numLabels = Math.min(6, history.length);
        for (let i = 0; i < numLabels; i++) {
            const idx = Math.floor((i / (numLabels - 1)) * (history.length - 1));
            const d = history[idx];
            const x = padding.left + ((d.time - minTime) / timeRange) * chartW;
            const mins = Math.floor(d.time / 60);
            const secs = Math.floor(d.time % 60);
            ctx.fillText(`${mins}:${String(secs).padStart(2, '0')}`, x, h - 4);
        }
    }, [history]);

    return (
        <div style={{ marginTop: '32px' }} className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>SYS.TIMELINE</div>
            </div>
            <div style={{ position: 'relative', width: '100%', height: '200px' }}>
                <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
            </div>
        </div>
    );
}
