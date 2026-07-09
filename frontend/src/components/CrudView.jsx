import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Icon from "./Icon.jsx";
import DataTable from "./DataTable.jsx";
import Modal, { ConfirmModal } from "./Modal.jsx";
import { Field, TextInput, TextArea, Select } from "./Field.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { parseApiError } from "../services/api.js";

/**
 * Vista CRUD reutilizable y dirigida por configuración.
 *
 * Props clave:
 *  - api: objeto resource() de services/api.js
 *  - idKey: nombre del PK (ej. "id_producto")
 *  - columns: columnas de la tabla [{ key, header, render, align, width }]
 *  - fields: campos del formulario para crear/editar
 *  - toRow(row) -> valores iniciales del form al editar (opcional)
 *  - transform(values) -> payload final hacia el backend (opcional)
 *  - write: actores que pueden crear/editar  (default admin+empleado)
 *  - del:   actores que pueden eliminar       (default admin)
 */
export default function CrudView({
  title,
  subtitle,
  api,
  idKey,
  columns,
  fields = [],
  toRow,
  transform,
  searchParam = "search",
  searchPlaceholder = "Buscar…",
  modalSize = "md",
  createLabel = "Nuevo registro",
  write = ["administrador", "empleado"],
  del = ["administrador"],
  filters = null, // nodo react extra para la toolbar
  extraParams = {},
  rowActionsExtra, // (row) => node
  computeFields = null, // (values, changedName) => patch (campos calculados)
}) {
  const toast = useToast();
  const { actor } = useAuth();
  const canWrite = write.includes(actor);
  const canDelete = del.includes(actor);

  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  // true cuando el backend ya devolvió una página ({count, results});
  // false cuando devolvió el array completo y hay que paginar en el cliente.
  const [serverPaginated, setServerPaginated] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef(null);

  const toggleSearch = () => {
    setSearchOpen((open) => {
      const next = !open;
      if (next) {
        setTimeout(() => searchInputRef.current?.focus(), 60);
      } else {
        setSearch("");
      }
      return next;
    });
  };

  // modal de formulario
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // confirmación de borrado
  const [target, setTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  // Si el backend no paginó (array completo), recortamos la página en el cliente.
  const displayRows = serverPaginated
    ? rows
    : rows.slice((page - 1) * pageSize, page * pageSize);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, ...extraParams };
      if (query) params[searchParam] = query;
      const { data } = await api.list(params);
      if (Array.isArray(data)) {
        setRows(data);
        setCount(data.length);
        setServerPaginated(false);
      } else {
        setRows(data.results || []);
        setCount(data.count ?? (data.results || []).length);
        setServerPaginated(true);
      }
    } catch (err) {
      toast.error("No se pudo cargar", parseApiError(err));
      setRows([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, query]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // búsqueda con debounce
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const defaultsFromFields = useMemo(() => {
    const o = {};
    fields.forEach((f) => {
      o[f.name] = f.defaultValue ?? "";
    });
    return o;
  }, [fields]);

  const openCreate = () => {
    setEditing(null);
    setValues({ ...defaultsFromFields });
    setErrors({});
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    const base = toRow ? toRow(row) : row;
    const v = {};
    fields.forEach((f) => {
      const raw = base[f.name];
      v[f.name] = raw === null || raw === undefined ? "" : raw;
    });
    setValues(v);
    setErrors({});
    setOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setOpen(false);
  };

  const setField = (name, value) => {
    setValues((v) => {
      let next = { ...v, [name]: value };
      if (computeFields) next = { ...next, ...computeFields(next, name) };
      return next;
    });
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const validate = () => {
    const e = {};
    fields.forEach((f) => {
      if (f.hidden && f.hidden(editing)) return;
      const val = values[f.name];
      if (f.required && (val === "" || val === null || val === undefined)) {
        e[f.name] = "Este campo es obligatorio.";
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      // construye payload limpio
      let payload = {};
      fields.forEach((f) => {
        if (f.formOnly || f.readonly) return;
        if (f.hidden && f.hidden(editing)) return;
        let val = values[f.name];
        if (f.type === "number" && val !== "" && val !== null) val = Number(val);
        if (f.omitIfEmpty && (val === "" || val === null)) return;
        payload[f.name] = val === "" ? null : val;
      });
      if (transform) payload = transform(payload, { editing, values });

      if (editing) {
        await api.patch(editing[idKey], payload);
        toast.success("Actualizado", `${title} actualizado correctamente.`);
      } else {
        await api.create(payload);
        toast.success("Creado", `${title} creado correctamente.`);
      }
      setOpen(false);
      fetchData();
    } catch (err) {
      const data = err?.response?.data;
      if (data && typeof data === "object" && !Array.isArray(data)) {
        const fieldErrors = {};
        Object.entries(data).forEach(([k, v]) => {
          fieldErrors[k] = Array.isArray(v) ? v.join(" ") : String(v);
        });
        setErrors((e) => ({ ...e, ...fieldErrors }));
      }
      toast.error("No se pudo guardar", parseApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.remove(target[idKey]);
      toast.success("Eliminado", "El registro fue eliminado.");
      setTarget(null);
      // si borramos el último de la página, retrocede
      if (displayRows.length === 1 && page > 1) setPage((p) => p - 1);
      else fetchData();
    } catch (err) {
      toast.error("No se pudo eliminar", parseApiError(err));
    } finally {
      setDeleting(false);
    }
  };

  // columnas + acciones
  const allColumns = [
    ...columns,
    {
      key: "__actions",
      header: "",
      align: "right",
      width: 1,
      render: (row) => (
        <>
          {rowActionsExtra?.(row)}
          {canWrite && (
            <button className="row-action" title="Editar" onClick={() => openEdit(row)}>
              <Icon name="edit" size={15} />
            </button>
          )}
          {canDelete && (
            <button
              className="row-action danger"
              title="Eliminar"
              onClick={() => setTarget(row)}
            >
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
          <span className="record-count">
            {count} registro{count === 1 ? "" : "s"}
          </span>

          <div className={`search-pop ${searchOpen ? "open" : ""}`}>
            <input
              ref={searchInputRef}
              className="search-pop__input"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && toggleSearch()}
            />
            <button
              type="button"
              className="icon-btn icon-btn--search"
              title="Buscar"
              aria-label="Buscar"
              aria-expanded={searchOpen}
              onClick={toggleSearch}
            >
              <Icon name="search" size={17} />
            </button>
          </div>

          {filters}

          {canWrite && (
            <button className="btn btn--primary" onClick={openCreate}>
              <Icon name="plus" size={16} />
              {createLabel}
            </button>
          )}
        </div>
      </div>

      <div className="card card--fill">
        <DataTable columns={allColumns} rows={displayRows} loading={loading} rowKey={idKey} />

        {totalPages > 1 && (
          <div className="pagination">
            <span className="pagination__info">
              Página {page} de {totalPages}
            </span>
            <div className="pagination__btns">
              <button
                className="page-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <Icon name="chevronLeft" size={15} />
              </button>
              {pageNumbers(page, totalPages).map((n, i) =>
                n === "…" ? (
                  <span key={i} className="page-btn" style={{ border: "none", background: "none" }}>
                    …
                  </span>
                ) : (
                  <button
                    key={i}
                    className={`page-btn ${n === page ? "active" : ""}`}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                )
              )}
              <button
                className="page-btn"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <Icon name="chevronRight" size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de formulario */}
      <Modal
        open={open}
        size={modalSize}
        title={editing ? `Editar ${title.toLowerCase()}` : createLabel}
        subtitle={
          editing
            ? "Modifica los campos y guarda los cambios."
            : "Completa la información para registrar."
        }
        onClose={closeModal}
        footer={
          <>
            <button type="button" className="btn btn--ghost" onClick={closeModal} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" form="crud-form" className="btn btn--primary" disabled={saving}>
              {saving ? "Guardando…" : editing ? "Guardar cambios" : "Crear"}
            </button>
          </>
        }
      >
        <form id="crud-form" onSubmit={submit}>
          <div className="form-grid">
            {fields.map((f) => {
              if (f.hidden && f.hidden(editing)) return null;
              return (
                <Field
                  key={f.name}
                  label={f.label}
                  required={f.required}
                  error={errors[f.name]}
                  hint={f.hint}
                  span={f.span}
                  third={f.third}
                >
                  {renderInput(f, values[f.name], (val) => setField(f.name, val), errors[f.name], editing)}
                </Field>
              );
            })}
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!target}
        message={
          <>
            ¿Seguro que deseas eliminar este registro
            {target?.[fields[0]?.name] ? <> (<b>{String(target[fields[0].name])}</b>)</> : ""}? Esta
            acción no se puede deshacer.
          </>
        }
        loading={deleting}
        onCancel={() => setTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function renderInput(f, value, onChange, error, editing) {
  if (f.readonly) {
    return (
      <input
        className="input"
        value={value === "" || value == null ? "—" : value}
        disabled
        readOnly
      />
    );
  }
  const common = { error, value: value ?? "", onChange: (e) => onChange(e.target.value) };
  if (f.type === "select") {
    return (
      <Select
        {...common}
        placeholder={f.placeholder ?? "Seleccionar…"}
        options={typeof f.options === "function" ? f.options() : f.options}
      />
    );
  }
  if (f.type === "textarea") {
    return <TextArea {...common} placeholder={f.placeholder} rows={f.rows || 3} />;
  }
  return (
    <TextInput
      {...common}
      type={f.type || "text"}
      step={f.step}
      min={f.min}
      placeholder={
        f.placeholder ?? (f.type === "password" && editing ? "Dejar en blanco para no cambiar" : "")
      }
      autoComplete={f.type === "password" ? "new-password" : "off"}
    />
  );
}

function pageNumbers(current, total) {
  const out = [];
  const add = (n) => out.push(n);
  if (total <= 7) {
    for (let i = 1; i <= total; i++) add(i);
    return out;
  }
  add(1);
  if (current > 3) add("…");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) add(i);
  if (current < total - 2) add("…");
  add(total);
  return out;
}
