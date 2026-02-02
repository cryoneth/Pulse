export function UsdcBadge({ amount }: { amount: number }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-sm font-semibold border border-blue-100">
      <span>$</span>
      {amount.toFixed(2)}
    </span>
  );
}