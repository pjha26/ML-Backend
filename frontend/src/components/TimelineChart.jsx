/**
 * TimelineChart — canvas-based concentration timeline chart
 * Shows concentration score over time with gradient fill area.
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
        const padding = { top: 10, right: 10, bottom: 24, left: 35 };
        const chartW = w - padding.left - padding.right;
        const chartH = h - padding.top - padding.bottom;

        // Clear
        ctx.clearRect(0, 0, w, h);

        // Background grid lines
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
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '10px Space Grotesk, sans-serif';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (chartH / 4) * i;
            ctx.fillText(`${100 - i * 25}`, padding.left - 6, y + 3);
        }

        if (history.length < 2) {
            // No data state
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.font = '13px Space Grotesk, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Waiting for data...', w / 2, h / 2);
            return;
        }

        // Plot data
        const maxTime = history[history.length - 1].time;
        const minTime = history[0].time;
        const timeRange = maxTime - minTime || 1;

        const points = history.map((d) => ({
            x: padding.left + ((d.time - minTime) / timeRange) * chartW,
            y: padding.top + chartH - (d.concentration / 100) * chartH,
        }));

        // Gradient fill
        const gradient = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
        gradient.addColorStop(0, 'rgba(0, 212, 255, 0.25)');
        gradient.addColorStop(0.5, 'rgba(124, 58, 237, 0.1)');
        gradient.addColorStop(1, 'rgba(124, 58, 237, 0)');

        // Area fill
        ctx.beginPath();
        ctx.moveTo(points[0].x, h - padding.bottom);
        points.forEach((p) => ctx.lineTo(p.x, p.y));
        ctx.lineTo(points[points.length - 1].x, h - padding.bottom);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Line
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            // Smooth curve
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

        const lineGradient = ctx.createLinearGradient(0, 0, w, 0);
        lineGradient.addColorStop(0, '#00d4ff');
        lineGradient.addColorStop(1, '#7c3aed');
        ctx.strokeStyle = lineGradient;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Latest point dot
        const lastPt = points[points.length - 1];
        ctx.beginPath();
        ctx.arc(lastPt.x, lastPt.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#00d4ff';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(lastPt.x, lastPt.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 212, 255, 0.2)';
        ctx.fill();

        // X-axis time labels
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '10px Space Grotesk, sans-serif';
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
        <div className="chart-section">
            <div className="chart-card glass-card fade-in" id="timeline-chart">
                <div className="chart-header">
                    <h3>📊 Session Timeline</h3>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {history.length} samples
                    </span>
                </div>
                <div className="chart-canvas-wrapper">
                    <canvas ref={canvasRef} className="chart-canvas" />
                </div>
            </div>
        </div>
    );
}
