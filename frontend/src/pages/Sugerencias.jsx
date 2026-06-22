import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../components/DataTable.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Icon from "../components/Icon.jsx";
import { endpoints, prediccionApi, parseApiError } from "../services/api.js";
import { dateShort } from "../utils/format.js";
import { useToast } from "../context/ToastContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { PERIODO } from "../config/choices.js";

export default function Sugerencias() {
  const toast = useToast();
  const navigate = useNavigate();
  const { actor } = useAuth();
  const staff = ["administrador", "empleado"].includes(actor);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [periodo, setPeriodo] = useState("semanal");
  const [verAtendidas, setVerAtendidas] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await endpoints.sugerencias.list({ page_size: 200 });
      setRows(data.results || (Array.isArray(data) ? data : []));
    } catch (err) {
      toast.error("No se pudo cargar", parseApiError(err));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const generar = async () => {
    setBusy(true);
    try {
      await prediccionApi.generarSugerencias(periodo);
      toast.success("Sugerencias generadas", "Se recalcularon las recomendaciones de compra.");
      fetchData();
    } catch (err) {
      toast.error("No se pudo generar", parseApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const marcar = async (row, estado) => {
    try {
      await endpoints.sugerencias.patch(row.id_sugerencia, { estado });
      toast.success(estado === "descartada" ? "Sugerencia descartada" : "Actualizada", "");
      fetchData();
    } catch (err) {
      toast.error("No se pudo actualizar", parseApiError(err));
    }
  };

  const crearCompra = (row) => {
    navigate("/panel/compras/nueva", {
      state: { fromSugerencia: { id_sugerencia: row.id_sugerencia, producto: row.producto, cantidad: row.cantidad_sugerida } },
    });
  };

  const eliminar = async (row) => {
    try {
      await endpoints.sugerencias.remove(row.id_sugerencia);
      fetchData();
    } catch (err) {
      toast.error("No se pudo eliminar", parseApiError(err));
    }
  };

  const visibles = rows.filter((r) => verAtendidas || r.estado === "pendiente");

  const columns = [
    { key: "producto_nombre", header: "Producto", render: (r) => <span className="cell-strong">{r.producto_nombre}</span> },
    {
      key: "stock", header: "Stock actual / mínimo", align: "center",
      render: (r) => {
        const s = r.stock_actual, m = r.stock_minimo;
        if (s == null) return <span className="text-soft">—</span>;
        const bajo = m != null && s <= m;
        return <span style={{ color: bajo ? "var(--danger-600)" : "var(--slate-700)" }}>{s}{m != null ? ` / ${m}` : ""}</span>;
      },
    },
    { key: "motivo", header: "Por qué", render: (r) => <StatusBadge value={r.motivo} /> },
    { key: "cantidad_sugerida", header: "Comprar", align: "right", render: (r) => <span className="badge badge--blue">{r.cantidad_sugerida} u.</span> },
    { key: "estado", header: "Estado", render: (r) => <StatusBadge value={r.estado} /> },
    { key: "fecha_creacion", header: "Generada", render: (r) => dateShort(r.fecha_creacion) },
    {
      key: "__acc", header: "", align: "right",
      render: (r) =>
        r.estado === "pendiente" ? (
          <div className="u-flex u-gap-8" style={{ justifyContent: "flex-end" }}>
            {staff && (
              <button className="btn btn--soft btn--sm" onClick={() => crearCompra(r)} title="Crear orden de compra con esta cantidad">
                <Icon name="truck" size={14} /> Crear compra
              </button>
            )}
            {staff && (
              <button className="row-action" title="Descartar" onClick={() => marcar(r, "descartada")}>
                <Icon name="x" size={15} />
              </button>
            )}
          </div>
        ) : (
          actor === "administrador" && (
            <button className="row-action danger" title="Eliminar" onClick={() => eliminar(r)}>
              <Icon name="trash" size={15} />
            </button>
          )
        ),
    },
  ];

  return (
    <div className="page">
      <div className="page__head">
        <div className="info-banner">
          <Icon name="info" size={16} />
          <span>
            El sistema recomienda <b>qué reabastecer</b> según el stock y la demanda prevista.
            Pulsa <b>Crear compra</b> para generar la orden con la cantidad sugerida (la sugerencia se marca <b>Atendida</b>),
            o <b>Descártala</b> si no la necesitas.
          </span>
        </div>
        <div className="head-actions" style={{ marginLeft: "auto" }}>
          <label className="u-flex u-items-center u-gap-8" style={{ fontSize: 13, color: "var(--text-soft)" }}>
            <input type="checkbox" checked={verAtendidas} onChange={(e) => setVerAtendidas(e.target.checked)} />
            Ver atendidas/descartadas
          </label>
          {staff && (
            <>
              <select className="input" value={periodo} onChange={(e) => setPeriodo(e.target.value)} style={{ width: "auto" }} disabled={busy}>
                {PERIODO.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <button className="btn btn--soft" onClick={generar} disabled={busy}>
                <Icon name="refresh" size={15} /> {busy ? "Generando…" : "Generar sugerencias"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="card card--fill">
        <DataTable columns={columns} rows={visibles} loading={loading} rowKey="id_sugerencia" />
      </div>
    </div>
  );
}
