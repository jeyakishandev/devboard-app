export default function Banner({ kind = "info", children }: { kind?: "info" | "error" | "success"; children: React.ReactNode }) {
  const base = "rounded-lg p-3 text-sm";
  const styles =
    kind === "error" ? "bg-red-50 text-red-700 border border-red-200" :
    kind === "success" ? "bg-green-50 text-green-700 border border-green-200" :
    "bg-indigo-50 text-indigo-700 border border-indigo-200";
  return <div className={`${base} ${styles}`}>{children}</div>;
}
