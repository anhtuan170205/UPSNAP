import { useEffect, useRef } from "react";

export function ConfirmDialog({ title, children, confirmLabel, onCancel, onConfirm }: {
  title: string; children: React.ReactNode; confirmLabel: string; onCancel: () => void; onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    return () => { dialog?.close(); previous?.focus(); };
  }, []);
  return <dialog ref={ref} className="confirm-dialog" aria-labelledby="confirm-title" onCancel={(event) => { event.preventDefault(); onCancel(); }}>
    <p className="eyebrow">A fresh start?</p><h2 id="confirm-title">{title}</h2><p>{children}</p>
    <div className="action-row"><button autoFocus onClick={onCancel}>Keep photos</button><button className="primary" onClick={onConfirm}>{confirmLabel}</button></div>
  </dialog>;
}
