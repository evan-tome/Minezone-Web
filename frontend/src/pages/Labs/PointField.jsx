import { useRef, useEffect } from 'react';

export function PointField() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const target = { x: -9999, y: -9999 };
        let points = [];
        let animId;

        function sqDist(a, b) {
            return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
        }

        function easeInOutCirc(t) {
            return t < 0.5
                ? (1 - Math.sqrt(1 - (2 * t) ** 2)) / 2
                : (Math.sqrt(1 - (-2 * t + 2) ** 2) + 1) / 2;
        }

        function shiftPoint(p) {
            p.startX = p.x;
            p.startY = p.y;
            p.targetX = p.originX - 50 + Math.random() * 100;
            p.targetY = p.originY - 50 + Math.random() * 100;
            p.duration = (1 + Math.random()) * 1000;
            p.elapsed = 0;
        }

        function init() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            const W = canvas.width;
            const H = canvas.height;
            points = [];

            for (let x = 0; x < W; x += W / 20) {
                for (let y = 0; y < H; y += H / 20) {
                    const px = x + Math.random() * (W / 20);
                    const py = y + Math.random() * (H / 20);
                    points.push({
                        x: px, y: py,
                        originX: px, originY: py,
                        startX: px, startY: py,
                        targetX: px, targetY: py,
                        duration: (1 + Math.random()) * 1000,
                        elapsed: Math.random() * 1000,
                        active: 0, circleActive: 0,
                        radius: 2 + Math.random() * 2,
                        closest: [],
                    });
                }
            }

            for (const p1 of points) {
                p1.closest = [...points]
                    .filter(p => p !== p1)
                    .sort((a, b) => sqDist(p1, a) - sqDist(p1, b))
                    .slice(0, 5);
            }
        }

        let lastTs = 0;
        function tick(ts) {
            const dt = Math.min(ts - lastTs, 50);
            lastTs = ts;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (const p of points) {
                p.elapsed += dt;
                const t = Math.min(p.elapsed / p.duration, 1);
                const e = easeInOutCirc(t);
                p.x = p.startX + (p.targetX - p.startX) * e;
                p.y = p.startY + (p.targetY - p.startY) * e;
                if (t >= 1) shiftPoint(p);

                const d = sqDist(target, p);
                if (d < 4000)       { p.active = 0.3;  p.circleActive = 0.6; }
                else if (d < 20000) { p.active = 0.1;  p.circleActive = 0.3; }
                else if (d < 40000) { p.active = 0.02; p.circleActive = 0.1; }
                else                { p.active = 0;    p.circleActive = 0;   }

                if (p.active > 0) {
                    for (const q of p.closest) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(q.x, q.y);
                        ctx.strokeStyle = `rgba(245,159,11,${p.active})`;
                        ctx.stroke();
                    }
                }
                if (p.circleActive > 0) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(245,159,11,${p.circleActive})`;
                    ctx.fill();
                }
            }

            animId = requestAnimationFrame(tick);
        }

        init();
        animId = requestAnimationFrame(tick);

        const onMove = e => { target.x = e.clientX; target.y = e.clientY; };
        const onResize = () => { cancelAnimationFrame(animId); init(); animId = requestAnimationFrame(tick); };

        globalThis.addEventListener('mousemove', onMove);
        globalThis.addEventListener('resize', onResize);
        return () => {
            cancelAnimationFrame(animId);
            globalThis.removeEventListener('mousemove', onMove);
            globalThis.removeEventListener('resize', onResize);
        };
    }, []);

    return <canvas ref={canvasRef} className="labs-point-field" />;
}
