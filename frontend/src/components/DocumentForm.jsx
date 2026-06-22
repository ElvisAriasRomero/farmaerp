import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Icon from "./Icon.jsx";
import ProductQuickCreate from "./ProductQuickCreate.jsx";
import { Field, Select } from "./Field.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { parseApiError } from "../services/api.js";
import { currency } from "../utils/format.js";

const emptyLine = () => ({ producto: "", presentacion: "unidad", cantidad: 1, precio_unitario: "" });

/** Página de crear / editar documento (Ventas / Compras). */
export default function DocumentForm({
  title,            // "venta" | "compra" (en minúscula, singular)
  api,
  idKey,
  basePath,         // "/panel/ventas"
  headerFields,
  productOptions,
  buildPayload,     // (header, detalles) => payload (para crear)
  withPresentacion = false, // muestra selector Paquete/Unidad por linea
}) {
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();
  const toast = useToast();

  const initialHeader = useMemo(() => {
    const h = {};
    headerFields.forEach((f) => (h[f.name] = f.defaultValue ?? ""));
    return h;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [header, setHeader] = useState(initialHeader);
  const [lines, setLines] = useState([emptyLine()]);
  const [readonlyLines, setReadonlyLines] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(editing);
  const [quickOpen, setQuickOpen] = useState(false);
  const [extraProducts, setExtraProducts] = useState([]);
  const options = [...productOptions, ...extraProducts];

  const onProductCreated = (p) => {
    const opt = { value: p.id_producto, label: p.nombre, price: Number(p.precio_venta), factor: Number(p.unidades_por_empaque || 1) };
    setExtraProducts((arr) => [...arr, opt]);
    setQuickOpen(false);
    // coloca el nuevo producto en la primera línea vacía
    setLines((ls) => {
      const i = ls.findIndex((l) => !l.producto);
      if (i === -1) return [...ls, { producto: String(p.id_producto), presentacion: "unidad", cantidad: 1, precio_unitario: "" }];
      return ls.map((l, idx) => (idx === i ? { ...l, producto: String(p.id_producto) } : l));
    });
  };

  useEffect(() => {
    if (!editing) return;
    api
      .retrieve(id)
      .then(({ data }) => {
        const h = {};
        headerFields.forEach((f) => {
          const v = data[f.name];
          h[f.name] = v === null || v === undefined ? "" : v;
        });
        setHeader(h);
        setReadonlyLines(data.detalles || []);
      })
      .catch((err) => toast.error("No se pudo cargar", parseApiError(err)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const setHeaderField = (name, value) => {
    setHeader((h) => ({ ...h, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const setLine = (idx, key, value) => {
    setLines((ls) =>
      ls.map((l, i) => {
        if (i !== idx) return l;
        const next = { ...l, [key]: value };
        if (key === "producto") {
          const opt = options.find((o) => String(o.value) === String(value));
          if (opt && opt.price != null && !l.precio_unitario) next.precio_unitario = opt.price;
        }
        return next;
      })
    );
  };
  const addLine = () => setLines((ls) => [...ls, emptyLine()]);
  const removeLine = (idx) =>
    setLines((ls) => (ls.length === 1 ? ls : ls.filter((_, i) => i !== idx)));

  const total = (editing ? readonlyLines : lines).reduce(
    (sum, l) => sum + (Number(l.cantidad) || 0) * (Number(l.precio_unitario) || 0),
    0
  );

  const coerce = (v) => {
    if (v === "" || v === null || v === undefined) return null;
    if (typeof v === "string" && /^\d+$/.test(v)) return Number(v);
    return v;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    headerFields.forEach((f) => {
      if (f.required && !header[f.name]) errs[f.name] = "Requerido";
    });

    if (!editing) {
      const validLines = lines.filter((l) => l.producto && Number(l.cantidad) > 0);
      if (!validLines.length) errs.__lines = "Agrega al menos un producto con cantidad válida.";
      setErrors(errs);
      if (Object.keys(errs).length) return;

      setSaving(true);
      try {
        const detalles = validLines.map((l) => ({
          producto: Number(l.producto),
          presentacion: l.presentacion || "unidad",
          cantidad: Number(l.cantidad),
          precio_unitario: Number(l.precio_unitario) || 0,
        }));
        await api.create(buildPayload(header, detalles));
        toast.success("Registrado", `La ${title} fue creada correctamente.`);
        navigate(basePath);
      } catch (err) {
        toast.error("No se pudo guardar", parseApiError(err));
      } finally {
        setSaving(false);
      }
    } else {
      setErrors(errs);
      if (Object.keys(errs).length) return;
      setSaving(true);
      try {
        const payload = {};
        headerFields.forEach((f) => (payload[f.name] = coerce(header[f.name])));
        await api.patch(id, payload);
        toast.success("Actualizado", `La ${title} fue actualizada.`);
        navigate(basePath);
      } catch (err) {
        toast.error("No se pudo actualizar", parseApiError(err));
      } finally {
        setSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="page page--tight">
        <div className="loading-block"><div className="spinner" /><span>Cargando…</span></div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page__head page__head--slim">
        <div className="head-actions">
          <button className="btn btn--ghost" onClick={() => navigate(basePath)} disabled={saving}>
            <Icon name="chevronLeft" size={15} /> Volver
          </button>
        </div>
      </div>

      <form onSubmit={submit}>
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <div className="form-grid">
            {headerFields.map((f) => (
              <Field key={f.name} label={f.label} required={f.required} error={errors[f.name]} span={f.span}>
                {f.type === "select" ? (
                  <Select
                    value={header[f.name] ?? ""}
                    onChange={(e) => setHeaderField(f.name, e.target.value)}
                    placeholder={f.placeholder ?? "Seleccionar…"}
                    options={typeof f.options === "function" ? f.options() : f.options}
                    error={errors[f.name]}
                  />
                ) : (
                  <input
                    className={`input ${errors[f.name] ? "has-error" : ""}`}
                    type={f.type || "text"}
                    value={header[f.name] ?? ""}
                    onChange={(e) => setHeaderField(f.name, e.target.value)}
                  />
                )}
              </Field>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h4 style={{ fontSize: 14.5, fontWeight: 650, color: "var(--slate-800)" }}>Detalle de productos</h4>
            {!editing && (
              <div className="u-flex u-gap-8">
                {withPresentacion && (
                  <button type="button" className="btn btn--soft btn--sm" onClick={() => setQuickOpen(true)}>
                    <Icon name="plus" size={14} /> Nuevo producto
                  </button>
                )}
                <button type="button" className="btn btn--soft btn--sm" onClick={addLine}>
                  <Icon name="plus" size={14} /> Agregar línea
                </button>
              </div>
            )}
          </div>
          {errors.__lines && <div className="field__error" style={{ marginBottom: 8 }}>{errors.__lines}</div>}

          {editing ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Producto</th><th className="text-right">Cant.</th><th className="text-right">P. Unit.</th><th className="text-right">Subtotal</th></tr>
                </thead>
                <tbody>
                  {readonlyLines.map((d, i) => (
                    <tr key={i}>
                      <td className="cell-strong">{d.producto_nombre}</td>
                      <td className="text-right cell-mono">{d.cantidad}</td>
                      <td className="text-right cell-mono">{currency(d.precio_unitario)}</td>
                      <td className="text-right cell-mono">{currency(d.subtotal)}</td>
                    </tr>
                  ))}
                  {!readonlyLines.length && (
                    <tr><td colSpan={4} className="text-soft" style={{ textAlign: "center" }}>Sin líneas.</td></tr>
                  )}
                </tbody>
              </table>
              <p className="text-soft" style={{ fontSize: 12, marginTop: 8 }}>
                Las líneas no se editan después de creado el documento (afectan el inventario).
              </p>
            </div>
          ) : (
            <div className="doc-lines">
              <div className={`doc-line doc-line--head ${withPresentacion ? "doc-line--pres" : ""}`}>
                <span>Producto</span>
                {withPresentacion && <span>Presentación</span>}
                <span>Cantidad</span>
                <span>Precio (Bs)</span>
                <span className="text-right">Subtotal</span>
                <span />
              </div>
              {lines.map((l, idx) => (
                <div className={`doc-line ${withPresentacion ? "doc-line--pres" : ""}`} key={idx}>
                  <Select
                    value={l.producto}
                    onChange={(e) => setLine(idx, "producto", e.target.value)}
                    placeholder="Seleccionar producto…"
                    options={options}
                  />
                  {withPresentacion && (
                    <Select
                      value={l.presentacion}
                      onChange={(e) => setLine(idx, "presentacion", e.target.value)}
                      options={[{ value: "unidad", label: "Unidad" }, { value: "paquete", label: "Paquete" }]}
                    />
                  )}
                  <input className="input" type="number" min="1" value={l.cantidad}
                    onChange={(e) => setLine(idx, "cantidad", e.target.value)} />
                  <input className="input" type="number" min="0" step="0.01" value={l.precio_unitario}
                    onChange={(e) => setLine(idx, "precio_unitario", e.target.value)} placeholder="0.00" />
                  <span className="doc-line__sub">
                    {currency((Number(l.cantidad) || 0) * (Number(l.precio_unitario) || 0))}
                  </span>
                  <button type="button" className="row-action danger" onClick={() => removeLine(idx)} title="Quitar">
                    <Icon name="x" size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="doc-total">
            <span>Total del documento</span>
            <b>{currency(total)}</b>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
            <button type="button" className="btn btn--ghost" onClick={() => navigate(basePath)} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? "Guardando…" : editing ? "Guardar cambios" : "Registrar"}
            </button>
          </div>
        </div>
      </form>

      <ProductQuickCreate
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
        onCreated={onProductCreated}
      />
    </div>
  );
}
