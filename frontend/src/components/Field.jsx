// Campos de formulario reutilizables
import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import Icon from "./Icon.jsx";

export function Field({ label, required, error, hint, children, span, third }) {
  return (
    <div className={`field ${span ? "span-2" : ""} ${third ? "field--third" : ""}`}>
      {label && (
        <label className="field__label">
          {label}
          {required && <span className="req">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <span className="field__error">{error}</span>
      ) : hint ? (
        <span className="field__hint">{hint}</span>
      ) : null}
    </div>
  );
}

export function TextInput({ error, ...props }) {
  return <input className={`input ${error ? "has-error" : ""}`} {...props} />;
}

export function TextArea({ error, ...props }) {
  return <textarea className={`textarea ${error ? "has-error" : ""}`} {...props} />;
}

/**
 * Dropdown personalizado (reemplaza al <select> nativo).
 * Mantiene la API del select: value, onChange(e.target.value), options, placeholder.
 * El menú se renderiza en un portal con posición fija para no recortarse dentro
 * de modales o contenedores con scroll.
 */
export function Select({ error, options = [], placeholder, value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const ctrlRef = useRef(null);
  const menuRef = useRef(null);

  const place = () => {
    const el = ctrlRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.left, width: r.width });
  };

  useLayoutEffect(() => { if (open) place(); }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (ctrlRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const close = () => setOpen(false);
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selected = options.find((o) => String(o.value) === String(value));
  const pick = (v) => { onChange?.({ target: { value: v } }); setOpen(false); };

  return (
    <div className={`dd ${error ? "has-error" : ""} ${disabled ? "is-disabled" : ""}`}>
      <button type="button" ref={ctrlRef} className="dd__control"
        onClick={() => !disabled && setOpen((o) => !o)} disabled={disabled} aria-haspopup="listbox" aria-expanded={open}>
        <span className={selected ? "dd__val" : "dd__ph"}>
          {selected ? selected.label : (placeholder || "Seleccionar…")}
        </span>
        <Icon name="chevronDown" size={16} />
      </button>
      {open && pos && createPortal(
        <div className="dd__menu" ref={menuRef} role="listbox"
          style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width }}>
          {placeholder !== undefined && (
            <button type="button" className={`dd__opt ${!value ? "is-sel" : ""}`} onClick={() => pick("")}>
              <span className="text-soft">{placeholder}</span>
            </button>
          )}
          {options.map((o) => {
            const sel = String(o.value) === String(value);
            return (
              <button type="button" key={o.value} className={`dd__opt ${sel ? "is-sel" : ""}`} onClick={() => pick(o.value)}>
                <span className="dd__opt-label">{o.label}</span>
                {sel && <Icon name="check" size={15} />}
              </button>
            );
          })}
          {!options.length && <div className="dd__empty">Sin opciones</div>}
        </div>,
        document.body
      )}
    </div>
  );
}
