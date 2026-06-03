import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  tone?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  tone = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const Icon = tone === 'danger' ? Trash2 : AlertTriangle;

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onCancel}>
      <section
        aria-modal="true"
        className={`dialog dialog-${tone}`}
        role="dialog"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="icon-button ghost dialog-close" type="button" onClick={onCancel} aria-label="Close dialog">
          <X aria-hidden="true" size={18} />
        </button>
        <div className="dialog-icon" aria-hidden="true">
          <Icon size={22} />
        </div>
        <h2 id="confirm-title">{title}</h2>
        <p id="confirm-message">{message}</p>
        <div className="dialog-actions">
          <button className="button secondary" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className={`button ${tone}`} type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
