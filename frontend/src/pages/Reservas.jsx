import { useCallback, useEffect, useState } from "react";
import Icon from "../components/Icon.jsx";
import DataTable from "../components/DataTable.jsx";
import Modal, { ConfirmModal } from "../components/Modal.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { endpoints, ventasApi, parseApiError } from "../services/api.js";
import { currency, dateTime } from "../utils/format.js";

export default function Reservas() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const [detail, setDetail] = useState(null);
  const [cobrar, setCobrar] = useState(null);   // reserva a cobrar
  const [metodo, setMetodo] = useState("efectivo");
  const [recibido, setRecibido] = useState("");
  const [busy, setBusy] = useState(false);

  const [entregar, setEntregar] = useState(null); // reserva a entregar
  const [cancelar, setCancelar] = useState(null); // reserva a cancelar

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await endpoints.ventas.list({ origen: "tienda", page_size: 100 });
      setRows(data.results || (Array.isArray(data) ? data : []));
    } catch (err) {
      toast.error("No se pudo cargar", parseApiError(err));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const doCobrar = async () => {
    setBusy(true);
    try {
      await ventasApi.cobrar(cobrar.id_venta, { metodo_pago: metodo, monto: cobrar.total });
      toast.success("Pago registrado", metodo === "efectivo" ? "Entró a caja." : "Pago QR registrado.");
      setCobrar(null);
      fetchData();
    } catch (err) {
      toast.error("No se pudo cobrar", parseApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const doEntregar = async () => {
    setBusy(true);
    try {
      await ventasApi.entregar(entregar.id_venta);
      toast.success("Reserva entregada", "El cliente retiró sus productos.");
      setEntregar(null);
      fetchData();
    } catch (err) {
      toast.error("No se pudo entregar", parseApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const doCancelar = async () => {
    setBusy(true);
    try {
      await ventasApi.cancelar(cancelar.id_venta);
      toast.success("Reserva cancelada", "Se devolvió el stock.");
      setCancelar(null);
      fetchData();
    } catch (err) {
      toast.error("No se pudo cancelar", parseApiError(err));
    } finally {
      setBusy(false);
    }
  };

  const filtered = rows.filter((r) => {
    if (!q.trim()) return true;
    const t = q.trim().toLowerCase();
    return String(r.id_venta).includes(t) || (r.cliente_nombre || "").toLowerCase().includes(t);
  });

  const columns = [
    {
      key: "id_venta", header: "Código",
      render: (r) => (
        <div>
          <div className="cell-strong">Reserva #{r.id_venta}</div>
          {r.pago?.metodo_pago === "qr" && r.pago?.referencia && (
            <div className="text-soft" style={{ fontSize: 12 }}>QR · {r.pago.referencia}</div>
          )}
        </div>
      ),
    },
    { key: "cliente_nombre", header: "Cliente", render: (r) => r.cliente_nombre || "—" },
    { key: "fecha_venta", header: "Fecha", render: (r) => dateTime(r.fecha_venta) },
    { key: "total", header: "Total", align: "right", render: (r) => currency(r.total) },
    { key: "estado", header: "Estado", render: (r) => <StatusBadge value={r.estado} /> },
    {
      key: "__actions", header: "", align: "right",
      render: (r) => (
        <>
          <button className="row-action info" title="Ver detalle" onClick={() => setDetail(r)}>
            <Icon name="eye" size={15} />
          </button>
          {r.estado === "reservada" && (
            <button className="row-action ok" title="Cobrar" onClick={() => { setMetodo("efectivo"); setRecibido(""); setCobrar(r); }}>
              <Icon name="wallet" size={15} />
            </button>
          )}
          {r.estado === "pagada" && (
            <button className="row-action ok" title="Entregar" onClick={() => setEntregar(r)}>
              <Icon name="check" size={15} />
            </button>
          )}
          {(r.estado === "reservada" || r.estado === "pagada") && (
            <button className="row-action danger" title="Cancelar" onClick={() => setCancelar(r)}>
              <Icon name="x" size={15} />
            </button>
          )}
        </>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="page__head">
        <div className="head-actions" style={{ marginLeft: "auto" }}>
          <div className="search-inline">
            <Icon name="search" size={15} />
            <input className="input" placeholder="Buscar por código o cliente…"
              value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <button className="btn btn--soft" onClick={fetchData}><Icon name="refresh" size={15} /> Actualizar</button>
        </div>
      </div>

      <div className="card card--fill">
        <DataTable columns={columns} rows={filtered} loading={loading} rowKey="id_venta" />
      </div>

      {/* Detalle */}
      <Modal open={!!detail} size="lg" title={`Reserva #${detail?.id_venta ?? ""}`}
        subtitle={detail?.cliente_nombre || "Consumidor final"} onClose={() => setDetail(null)}
        footer={<button className="btn btn--primary" onClick={() => setDetail(null)}>Cerrar</button>}>
        {detail && (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Producto</th><th>Cantidad</th><th>P. Unit.</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {(detail.detalles || []).map((d, i) => (
                    <tr key={i}>
                      <td className="cell-strong">{d.producto_nombre}</td>
                      <td className="cell-mono">{d.cantidad}</td>
                      <td className="cell-mono">{currency(d.precio_unitario)}</td>
                      <td className="cell-mono">{currency(d.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="doc-total"><span>Total</span><b>{currency(detail.total)}</b></div>

            {detail.pago ? (
              <div className="pago-box">
                <div className="pago-box__row">
                  <span>Método de pago</span>
                  <b>{detail.pago.metodo_pago === "qr" ? "QR (en línea)"
                    : detail.pago.metodo_pago === "efectivo" ? "Efectivo" : detail.pago.metodo_pago}</b>
                </div>
                {detail.pago.referencia && (
                  <div className="pago-box__row">
                    <span>Comprobante</span>
                    <b className="cell-mono">{detail.pago.referencia}</b>
                  </div>
                )}
                {detail.pago.metodo_pago === "qr" && (
                  <div className="pago-box__alert">
                    <Icon name="info" size={15} />
                    <span>Pago en línea. Pide al cliente que muestre su comprobante de pago
                      y verifica que la referencia <b>{detail.pago.referencia}</b> coincida antes de entregar.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="pago-box pago-box--pendiente">
                <Icon name="alert" size={15} />
                <span>Sin pago registrado. Cobra la reserva antes de entregar.</span>
              </div>
            )}
          </>
        )}
      </Modal>

      {/* Cobrar */}
      <Modal open={!!cobrar} size="sm" title={`Cobrar reserva #${cobrar?.id_venta ?? ""}`}
        subtitle="Registra el pago del cliente al retirar." onClose={() => setCobrar(null)}
        footer={
          <>
            <button className="btn btn--ghost" onClick={() => setCobrar(null)} disabled={busy}>Cancelar</button>
            <button className="btn btn--primary" onClick={doCobrar}
              disabled={busy || (metodo === "efectivo" && recibido !== "" && Number(recibido) < (cobrar?.total || 0))}>
              {busy ? "Procesando…" : "Cobrar"}
            </button>
          </>
        }>
        <div className="pos-amount" style={{ marginBottom: 14 }}>
          <span>Monto a cobrar</span>
          <b>{currency(cobrar?.total || 0)}</b>
        </div>
        <div className="pos-toggle">
          <button type="button" className={`pos-toggle__btn ${metodo === "efectivo" ? "active" : ""}`}
            onClick={() => setMetodo("efectivo")}><Icon name="wallet" size={15} /> Efectivo</button>
          <button type="button" className={`pos-toggle__btn ${metodo === "qr" ? "active" : ""}`}
            onClick={() => setMetodo("qr")}><Icon name="card" size={15} /> QR</button>
        </div>
        {metodo === "efectivo" && (
          <div className="pos-cash" style={{ marginTop: 14 }}>
            <label className="field__label">Efectivo recibido (Bs)</label>
            <input className="input" type="number" min="0" step="0.01" value={recibido}
              onChange={(e) => setRecibido(e.target.value)} placeholder="0.00" />
            {recibido !== "" && (
              Number(recibido) >= (cobrar?.total || 0) ? (
                <div className="pos-cash__change">
                  {Number(recibido) === (cobrar?.total || 0)
                    ? "Pago justo"
                    : <>Cambio: <b>{currency(Number(recibido) - (cobrar?.total || 0))}</b></>}
                </div>
              ) : (
                <div className="pos-cash__change pos-cash__change--falta">
                  Falta: {currency((cobrar?.total || 0) - Number(recibido))}
                </div>
              )
            )}
          </div>
        )}
        <p className="text-soft" style={{ fontSize: 12, marginTop: 10 }}>
          El efectivo entra a la caja; el QR va al banco.
        </p>
      </Modal>

      <ConfirmModal open={!!entregar} title="Entregar reserva"
        confirmLabel="Entregar" tone="primary" icon="check"
        message={`¿Confirmas la entrega de la reserva #${entregar?.id_venta ?? ""}? El cliente ya pagó.`}
        loading={busy} onCancel={() => setEntregar(null)} onConfirm={doEntregar} />

      <ConfirmModal open={!!cancelar} title="Cancelar reserva"
        confirmLabel="Sí, cancelar reserva"
        message={`¿Seguro que deseas cancelar la reserva #${cancelar?.id_venta ?? ""}? Se devolverá el stock.`}
        loading={busy} onCancel={() => setCancelar(null)} onConfirm={doCancelar} />
    </div>
  );
}
