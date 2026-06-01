import { useEffect, useRef } from 'react';

const SEED = 0x4D494E45;
const BLOCK = 16;
const ROWS = 5;
const ORANGE = 'rgba(224, 147, 4, 0.88)';

function hash(x, y) {
    let h = (SEED ^ (Math.imul(x, 0x9e3779b9) + Math.imul(y, 0x517cc1b7))) | 0;
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function draw(canvas) {
    const w = canvas.offsetWidth;
    if (!w) return;
    canvas.width = w;
    canvas.height = ROWS * BLOCK;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cols = Math.ceil(w / BLOCK) + 1;

    for (let row = 0; row < ROWS; row++) {
        // linear probability: 1.0 at top row, 0.0 at bottom row
        const prob = 1 - row / (ROWS - 1);
        for (let col = 0; col < cols; col++) {
            if (hash(col, row) < prob) {
                ctx.fillStyle = ORANGE;
                ctx.fillRect(col * BLOCK, row * BLOCK, BLOCK, BLOCK);
            }
        }
    }
}

export default function HeroTransition() {
    const ref = useRef(null);

    useEffect(() => {
        const canvas = ref.current;
        draw(canvas);
        const ro = new ResizeObserver(() => draw(canvas));
        ro.observe(canvas);
        return () => ro.disconnect();
    }, []);

    return (
        <canvas
            ref={ref}
            style={{
                display: 'block',
                width: '100%',
                height: `${ROWS * BLOCK}px`,
                marginTop: `-${Math.floor(ROWS * BLOCK * 0.6)}px`,
                pointerEvents: 'none',
                position: 'relative',
                zIndex: 1,
                flexShrink: 0,
            }}
        />
    );
}
