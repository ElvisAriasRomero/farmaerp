import { useEffect, useState } from "react";
import Modal from "./Modal.jsx";
import { Field, Select } from "./Field.jsx";
import { endpoints, parseApiError } from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";

/** Alta rápida de producto (solo identidad) desde la compra.
 *  Costo, venta y unidades por paquete se definen en la línea de compra. */
export default function ProductQuickCreate({ open, onClose, onCreated }) {
  const toast = useToast();
  const [cats, setCats] = useState([]);
  const [f, setF] = useState({ nombre: "", id_categoria: "", codigo_barras: "", fecha_vencimiento: "" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    setErr("");
    endpoints.categorias
      .list()
      .then(({ data }) => {
        const arr = Array.isArray(data) ? data : data.results || [];
        setCats(arr.map((c) => ({ value: c.id_categoria, label: c.nombre })));
      })
      .catch(() => {});
  }, [open]);

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!f.nombre || !f.id_categoria) {
      setErr("Nombre y categoría son obligatorios.");
      return;
    }
    setSaving(true);
    try {
      const { data } = await endpoints.productos.create({
        nombre: f.nombre,
        id_categoria: Number(f.id_categoria),
        codigo_barras: f.codigo_barras || null,
        fecha_vencimiento: f.fecha_vencimiento || null,
      });
      toast.success("Producto creado", `${data.nombre} se agregó al catálogo.`);
      onCreated(data);
      setF({ nombre: "", id_categoria: "", codigo_barras: "", fecha_vencimiento: "" });
    } catch (e2) {
      setErr(parseApiError(e2));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      size="md"
      title="Nuevo producto"
      subtitle="Solo datos de identidad. El costo y precio de venta se definen en esta compra."
      onClose={() => !saving && onClose()}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose} disabled={saving}>Cancelar</button>
          <button type="submit" form="quick-prod" className="btn btn--primary" disabled={saving}>
            {saving ? "Creando…" : "Crear y usar"}
          </button>
        </>
      }
    >
      <form id="quick-prod" onSubmit={submit}>
        {err && <div className="auth__error" style={{ marginBottom: 12 }}>{err}</div>}
        <div className="form-grid">
          <Field label="Nombre del producto" required span>
            <input className="input" value={f.nombre} onChange={set("nombre")} placeholder="Ej. Paracetamol 500mg" />
          </Field>
          <Field label="Categoría" required>
            <Select value={f.id_categoria} onChange={set("id_categoria")} placeholder="Seleccionar…" options={cats} />
          </Field>
          <Field label="Código de barras">
            <input className="input" value={f.codigo_barras} onChange={set("codigo_barras")} placeholder="7790000000000" />
          </Field>
          <Field label="Fecha de vencimiento" span>
            <input className="input" type="date" value={f.fecha_vencimiento} onChange={set("fecha_vencimiento")} />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
