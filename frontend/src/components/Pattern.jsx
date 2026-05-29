const COLS = 26;
const ROWS = 100;

export default function Pattern() {
    return (
        <div className="pattern-bg">
            {Array.from({ length: ROWS }).map((_, row) => (
                <div key={row} className={`pattern-row${row % 2 === 1 ? ' offset' : ''}`}>
                    {Array.from({ length: COLS }).map((_, col) => (
                        <img key={col} src="/minezonelogo.png" className="tile" alt="" />
                    ))}
                </div>
            ))}
        </div>
    );
}
