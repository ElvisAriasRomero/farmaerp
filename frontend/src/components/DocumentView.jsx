import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "./Icon.jsx";
import DataTable from "./DataTable.jsx";
import { ConfirmModal } from "./Modal.jsx";
import Modal from "./Modal.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { parseApiError } from "../services/api.js";
import { currency } from "../utils/format.js";

/**
 * LISTA de documentos (Ventas / Compras).
 * Crear y editar abren PÁGINAS dedicadas (no modales). Aquí solo:
 *  - tabla con paginación
 *  - ver detalle (modal de solo lectura)
 *  - editar -> navega a la página de edición
 *  - eliminar (confirmación)
 */
export default function DocumentView({
  title,
  subtitle,
  api,
  idKey,
  columns,
  basePath,            // p.ej. "/panel/ventas"
  createLabel = "Nuevo documento",
  receiveApi = null,   // si se pasa: muestra "Recepcionar" en compras pendientes
  write = ["administrador", "empleado"],
  del = ["administrador"],
}) {
  const toast = useToast();
  const navigate = useNavigate();
  const { actor } = useAuth();
  const canWrite = write.includes(actor);
  const canDelete = del.includes(actor);

  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [detail, setDetail] = useState(null);
  const [target, setTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.list({ page });
      setRows(data.results || (Array.isArray(data) ? data : []));
      setCount(data.count ?? (data.results || data || []).length);
    } catch (err) {
      toast.error("No se pudo cargar", parseApiError(err));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const doReceive = async (row) => {
    try {
      await receiveApi(row[idKey]);
      toast.success("Compra recepcionada", "Se sumó el stock y se actualizó el costo del producto.");
      fetchData();
    } catch (err) {
      toast.error("No se pudo recepcionar", parseApiError(err));
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.remove(target[idKey]);
      toast.success("Eliminado", "El documento fue eliminado.");
      setTarget(null);
      fetchData();
    } catch (err) {
      toast.error("No se pudo eliminar", parseApiError(err));
    } finally {
      setDeleting(false);
    }
  };

  const allColumns = [
    ...columns,
    {
      key: "__actions",
      header: "",
      align: "right",
      render: (row) => (
        <>
          <button className="row-action info" title="Ver detalle" onClick={() => setDetail(row)}>
            <Icon name="eye" size={15} />
          </button>
          {receiveApi && canWrite && row.estado === "pendiente" && (
            <button className="row-action ok" title="Recepcionar (sumar al stock)"
              onClick={() => doReceive(row)}>
              <Icon name="truck" size={15} />
            </button>
          )}
          {canWrite && (
            <button className="row-action" title="Editar"
              onClick={() => navigate(`${basePath}/${row[idKey]}/editar`)}>
              <Icon name="edit" size={15} />
            </button>
          )}
          {canDelete && (
            <button className="row-action danger" title="Eliminar" onClick={() => setTarget(row)}>
              <Icon name="trash" size={15} />
            </button>
          )}
        </>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="page__head">
        <div className="head-actions">
          {canWrite && (
            <button className="btn btn--primary" onClick={() => navigate(`${basePath}/nueva`)}>
              <Icon name="plus" size={16} /> {createLabel}
            </button>
          )}
        </div>
      </div>

      <div className="card card--fill">
        <DataTable columns={allColumns} rows={rows} loading={loading} rowKey={idKey} />
        {totalPages > 1 && (
          <div className="pagination">
            <span className="pagination__info">Página {page} de {totalPages}</span>
            <div className="pagination__btns">
              <button className="page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <Icon name="chevronLeft" size={15} />
              </button>
              <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                <Icon name="chevronRight" size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ver detalle (solo lectura) */}
      <Modal
        open={!!detail}
        size="lg"
        title={`Detalle ${title.slice(0, -1).toLowerCase()} #${detail?.[idKey] ?? ""}`}
        subtitle={detail?.cliente_nombre || detail?.proveedor_nombre || ""}
        onClose={() => setDetail(null)}
        footer={<button className="btn btn--primary" onClick={() => setDetail(null)}>Cerrar</button>}
      >
        {detail && (
          <>
            <div className="table-wrap">
              {basePath && basePath.includes("compras") ? (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Unid. x paquete</th>
                      <th>Cantidad</th>
                      <th>Costo x paquete</th>
                      <th>Venta x unidad</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detail.detalles || []).map((d, i) => (
                      <tr key={i}>
                        <td className="cell-strong">{d.producto_nombre}</td>
                        <td className="cell-mono">{d.unidades_por_paquete}</td>
                        <td className="cell-mono">{d.cantidad}</td>
                        <td className="cell-mono">{currency(d.precio_unitario)}</td>
                        <td className="cell-mono">{d.precio_venta == null ? "—" : currency(d.precio_venta)}</td>
                        <td className="cell-mono">{currency(d.subtotal)}</td>
                      </tr>
                    ))}
                    {!(detail.detalles || []).length && (
                      <tr><td colSpan={6} className="text-soft">Sin líneas de detalle.</td></tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Presentación</th>
                      <th>Cantidad</th>
                      <th>P. Unit.</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detail.detalles || []).map((d, i) => (
                      <tr key={i}>
                        <td className="cell-strong">{d.producto_nombre}</td>
                        <td>{d.presentacion === "paquete" ? "Paquete" : "Unidad"}</td>
                        <td className="cell-mono">{d.cantidad}</td>
                        <td className="cell-mono">{currency(d.precio_unitario)}</td>
                        <td className="cell-mono">{currency(d.subtotal)}</td>
                      </tr>
                    ))}
                    {!(detail.detalles || []).length && (
                      <tr><td colSpan={5} className="text-soft">Sin líneas de detalle.</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
            <div className="doc-total"><span>Total</span><b>{currency(detail.total)}</b></div>
          </>
        )}
      </Modal>

      <ConfirmModal
        open={!!target}
        message="¿Seguro que deseas eliminar este documento? Esta acción no se puede deshacer."
        loading={deleting}
        onCancel={() => setTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
