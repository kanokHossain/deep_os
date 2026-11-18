import { useEffect, useState } from "react";

interface ToastMsg {
  id: number;
  text: string;
  undo?: () => void;
}

let push: (t: Omit<ToastMsg, "id">) => void = () => {};

export function toast(text: string, undo?: () => void) {
  push({ text, undo });
}

export function Toaster() {
  const [msg, setMsg] = useState<ToastMsg | null>(null);

  useEffect(() => {
    push = (t) => setMsg({ ...t, id: Date.now() });
    return () => {
      push = () => {};
    };
  }, []);

  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(null), msg.undo ? 6000 : 2500);
    return () => clearTimeout(id);
  }, [msg]);

  return (
    <div className="toast-region" role="status" aria-live="polite">
      {msg && (
        <div className="toast" key={msg.id}>
          <span>{msg.text}</span>
          {msg.undo && (
            <button
              type="button"
              onClick={() => {
                msg.undo?.();
                setMsg(null);
              }}
            >
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
