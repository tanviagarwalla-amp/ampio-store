import { useStore } from '../store/StoreContext';

export default function Toasts() {
  const { toasts, dismissToast } = useStore();
  if (!toasts.length) return null;
  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.tone}`}>
          <span style={{ flex: 1 }}>{t.message}</span>
          <button type="button" aria-label="Dismiss" onClick={() => dismissToast(t.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
