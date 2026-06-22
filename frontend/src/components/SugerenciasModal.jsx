import { useCallback, useEffect, useState } from "react";
import Modal from "./Modal.jsx";
import DataTable from "./DataTable.jsx";
import StatusBadge from "./StatusBadge.jsx";
import Icon from "./Icon.jsx";
import { Select } from "./Field.jsx";
import { endpoints, prediccionApi, parseApiError } from "../services/api.js";
import { useToast } from "../context/ToastContext.jsx";
import { PERIODO } from "../config/choices.js";

/** Modal con la lista MASIVA de sugerencias de compra (todos los productos). */
export default function SugerenciasModal({ open, onClose, staff, admin }) {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [periodo, setPeriodo] = useState("semanal");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await endpoints.sugerencias.list({ estado: "pendiente", page_size: 200 });
      setRows(data.results || (Array.isArray(data) ? data : []));
    } catch (err) {
      toast.error("No se pudo cargar", parseApiError(err));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (open) fetchData(); }, [open, fetchData]);

  const generar = async () => {
    setBusy(true);
    try {
      await prediccionApi.generarSugerencias(periodo);
      toast.success("Sugerencias generadas", "");
      fetchData();
    } catch (err) {
      toast.error("No se pudo generar", parseApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const descartar = async (row) => {
    try {
      await endpoints.sugerencias.patch(row.id_sugerencia, { estado: "descartada" });
      fetchData();
    } catch (err) {
      toast.error("No se pudo actualizar", parseApiError(err));
    }
  };

  const columns = [
    { key: "producto_nombre", header: "Producto", render: (r) => <span className="cell-strong">{r.producto_nombre}</span> },
    {
      key: "stock", header: "Stock / mín.", align: "center",
      render: (r) => r.stock_actual == null ? "—" :
        <span style={{ color: r.stock_minimo != null && r.stock_actual <= r.stock_minimo ? "var(--danger-600)" : "var(--slate-700)" }}>
          {r.stock_actual}{r.stock_minimo != null ? ` / ${r.stock_minimo}` : ""}
        </span>,
    },
    { key: "motivo", header: "Motivo", render: (r) => <StatusBadge value={r.motivo} /> },
    { key: "cantidad_sugerida", header: "Comprar", align: "right", render: (r) => <span className="badge badge--blue">{r.cantidad_sugerida} u.</span> },
    ...(staff ? [{
      key: "__acc", header: "", align: "right",
      render: (r) => (
        <button className="row-action" title="Descartar" onClick={() => descartar(r)}>
          <Icon name="x" size={15} />
        </button>
      ),
    }] : []),
  ];

  return (
    <Modal open={open} onClose={onClose} size="lg" title="Sugerencias generales de compra"
      subtitle="Recomendaciones de reabastecimiento para todos los productos."
      footer={<button className="btn btn--primary" onClick={onClose}>Cerrar</button>}>
      {staff && (
        <div className="u-flex u-gap-8" style={{ marginBottom: 12, alignItems: "center" }}>
          <div style={{ width: 160 }}>
            <Select value={periodo} onChange={(e) => setPeriodo(e.target.value)} options={PERIODO} disabled={busy} />
          </div>
          <button className="btn btn--soft btn--sm" onClick={generar} disabled={busy}>
            <Icon name="refresh" size={15} /> {busy ? "Generando…" : "Generar sugerencias"}
          </button>
        </div>
      )}
      <div className="table-wrap">
        <DataTable columns={columns} rows={rows} loading={loading} rowKey="id_sugerencia" />
      </div>
    </Modal>
  );
}
