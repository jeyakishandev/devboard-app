import { useEffect, useRef } from "react";

type Pointer = { x: number; y: number }; // coords normalisées [0..1]

export default function CallPointerOverlay({
  active,
  pointer,
}: {
  active: boolean;
  pointer: Pointer | null;
}) {
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dotRef.current || !pointer) return;
    const el = dotRef.current;
    el.style.left = `${pointer.x * 100}%`;
    el.style.top = `${pointer.y * 100}%`;
  }, [pointer]);

  return (
    <div className="relative w-full h-full">
      {/* point rouge */}
      {active && pointer && (
        <div
          ref={dotRef}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
          style={{ width: 16, height: 16, borderRadius: 9999, background: "red", boxShadow: "0 0 12px rgba(255,0,0,0.7)" }}
        />
      )}
    </div>
  );
}
