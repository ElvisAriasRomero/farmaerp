import { useEffect } from "react";
import Icon from "./Icon.jsx";

/**
 * Modal profesional.
 * REGLA: solo se cierra al pulsar la X o el botón Cancelar.
 * No se cierra al hacer clic fuera (overlay), ni con doble clic, ni con Escape.
 */
export default function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  size = "md", // sm | md | lg
}) {
  // Bloquea el scroll del body mientras está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  if (!open) return null;

  // Importante: NO cerramos al clicar el overlay. Solo evitamos burbujeo.
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`modal modal--${size}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <div className="modal__head-text">
            <h3>{title}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Cerrar"
            title="Cerrar"
          >
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__foot">{footer}</div>}
      </div>
    </div>
  );
}

/** Modal de confirmación (eliminar, etc.) */
export function ConfirmModal({
  open,
  title = "Confirmar acción",
  message,
  confirmLabel = "Eliminar",
  tone = "danger", // "danger" | "primary"
  icon = "alert",
  loading,
  onCancel,
  onConfirm,
}) {
  const isDanger = tone === "danger";
  const accent = isDanger ? "#ef4444" : "var(--brand-500)";
  const accentBg = isDanger ? "var(--danger-50)" : "var(--brand-50)";
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      size="sm"
      footer={
        <>
          <button className="btn btn--ghost" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
          <button className="btn btn--primary" onClick={onConfirm} disabled={loading}
            style={{ background: accent }}>
            {loading ? "Procesando…" : confirmLabel}
          </button>
        </>
      }
    >
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 11,
            display: "grid",
            placeItems: "center",
            background: accentBg,
            color: accent,
            flexShrink: 0,
          }}
        >
          <Icon name={icon} size={22} />
        </div>
        <p style={{ color: "var(--slate-600)", fontSize: 14, lineHeight: 1.55 }}>
          {message}
        </p>
      </div>
    </Modal>
  );
}
