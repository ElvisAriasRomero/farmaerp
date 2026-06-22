import { useState } from "react";
import CrudView from "../components/CrudView.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Icon from "../components/Icon.jsx";
import Modal from "../components/Modal.jsx";
import { Field } from "../components/Field.jsx";
import { endpoints, cajaApi, parseApiError } from "../services/api.js";
import useOptions from "../hooks/useOptions.js";
import { useToast } from "../context/ToastContext.jsx";
import { currency, dateTime } from "../utils/format.js";

export default function Caja() {
  const toast = useToast();
  const [version, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);

  // modal de salida de efectivo
  const [salidaRow, setSalidaRow] = useState(null);
  const [monto, setMonto] = useState("");
  const [motivo, setMotivo] = useState("");
  const [saving, setSaving] = useState(false);

  const empleados = useOptions(endpoints.empleados, (e) => ({
    value: e.id_empleado,
    label: e.nombre,
  }));

  const cerrar = async (row) => {
    if (row.estado !== "abierta") return;
    try {
      await cajaApi.cerrar(row.id_caja);
      toast.success("Caja cerrada", "Se calculó el saldo final esperado.");
      refresh();
    } catch (err) {
      toast.error("No se pudo cerrar", parseApiError(err));
    }
  };

  const abrirSalida = (row) => {
    setSalidaRow(row);
    setMonto("");
    setMotivo("");
  };

  const guardarSalida = async (e) => {
    e.preventDefault();
    const m = Number(monto);
    if (!(m > 0)) {
      toast.error("Monto inválido", "Ingresa un número mayor a cero.");
      return;
    }
    setSaving(true);
    try {
      await cajaApi.salida(salidaRow.id_caja, { monto: m, observacion: motivo });
      toast.success("Salida registrada", `Bs ${m} restados del efectivo de la caja.`);
      setSalidaRow(null);
      refresh();
    } catch (err) {
      toast.error("No se pudo registrar", parseApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: "id_caja", header: "#", render: (r) => <span className="cell-strong">#{r.id_caja}</span> },
    { key: "empleado_nombre", header: "Responsable", render: (r) => r.empleado_nombre || "—" },
    { key: "fecha_apertura", header: "Apertura", render: (r) => dateTime(r.fecha_apertura) },
    { key: "fecha_cierre", header: "Cierre", render: (r) => (r.fecha_cierre ? dateTime(r.fecha_cierre) : <span className="text-soft">—</span>) },
    { key: "saldo_inicial", header: "Inicial", align: "right", render: (r) => currency(r.saldo_inicial) },
    { key: "total_entradas", header: "Entradas", align: "right", render: (r) => currency(r.total_entradas) },
    { key: "total_salidas", header: "Salidas", align: "right", render: (r) => currency(r.total_salidas) },
    { key: "saldo_final", header: "Saldo final", align: "right", render: (r) => (r.saldo_final == null ? <span className="text-soft">—</span> : <span className="cell-strong">{currency(r.saldo_final)}</span>) },
    { key: "estado", header: "Estado", render: (r) => <StatusBadge value={r.estado} /> },
  ];

  // Abrir caja: solo responsable + saldo inicial. Lo demás es automático.
  const fields = [
    { name: "empleado", label: "Responsable", type: "select", required: true, options: () => empleados },
    { name: "saldo_inicial", label: "Saldo inicial (Bs)", type: "number", step: "0.01", min: "0", required: true, defaultValue: 0 },
    { name: "observaciones", label: "Observaciones", type: "textarea", span: true, omitIfEmpty: true },
  ];

  return (
    <>
      <CrudView
        key={version}
        title="Caja"
        subtitle="Apertura, entradas automáticas por ventas en efectivo y cierre."
        api={endpoints.caja}
        idKey="id_caja"
        columns={columns}
        fields={fields}
        createLabel="Abrir caja"
        del={["administrador"]}
        searchPlaceholder="Buscar por responsable…"
        rowActionsExtra={(row) =>
          row.estado === "abierta" ? (
            <>
              <button className="row-action" title="Registrar salida de efectivo" onClick={() => abrirSalida(row)}>
                <Icon name="logout" size={15} />
              </button>
              <button className="row-action ok" title="Cerrar caja" onClick={() => cerrar(row)}>
                <Icon name="check" size={15} />
              </button>
            </>
          ) : null
        }
      />

      <Modal
        open={!!salidaRow}
        size="sm"
        title="Registrar salida de efectivo"
        subtitle="Dinero que sale del cajón (no es una venta): retiro, pago a proveedor, gasto…"
        onClose={() => !saving && setSalidaRow(null)}
        footer={
          <>
            <button className="btn btn--ghost" onClick={() => setSalidaRow(null)} disabled={saving}>Cancelar</button>
            <button type="submit" form="salida-form" className="btn btn--primary" disabled={saving}>
              {saving ? "Guardando…" : "Registrar salida"}
            </button>
          </>
        }
      >
        <form id="salida-form" onSubmit={guardarSalida}>
          <div className="form-grid">
            <Field label="Monto (Bs)" required span>
              <input className="input" type="number" min="0" step="0.01" value={monto}
                onChange={(e) => setMonto(e.target.value)} placeholder="0.00" autoFocus />
            </Field>
            <Field label="Motivo" span>
              <input className="input" value={motivo} onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej. retiro al banco, pago proveedor, gasto…" />
            </Field>
          </div>
        </form>
      </Modal>
    </>
  );
}
