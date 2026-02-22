import { formatPct } from "@/lib/utils";

export function RiskGauge({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value));
  const r = 44;
  const c = 2 * Math.PI * r;
  const dash = c * pct;

  return (
    <div className="flex items-center gap-5">
      <svg width="120" height="120" viewBox="0 0 120 120" className="shrink-0">
        <circle cx="60" cy="60" r={r} stroke="rgb(226 232 240)" strokeWidth="10" fill="none" />
        <circle
          cx="60"
          cy="60"
          r={r}
          stroke="rgb(15 23 42)"
          strokeWidth="10"
          fill="none"
          strokeDasharray={`${dash} ${c - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
        />
        <text x="60" y="64" textAnchor="middle" className="fill-slate-900" fontSize="18" fontWeight="700">
          {formatPct(pct)}
        </text>
        <text x="60" y="82" textAnchor="middle" className="fill-slate-500" fontSize="10">
          risk score
        </text>
      </svg>

      <div>
        <div className="text-sm text-slate-600">Confidence-ready UI</div>
        <div className="text-base font-semibold mt-1">Explainable output (SHAP later)</div>
      </div>
    </div>
  );
}
