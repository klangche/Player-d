import { useState } from "react";
import type { ReactNode } from "react";

export function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const [open] = useState(true);
  if (!open) return null;
  return (
    <div className="dialog-backdrop" role="dialog" aria-label={title}>
      <div className="dialog">{children}</div>
    </div>
  );
}
