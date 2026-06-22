import Icon from "./Icon.jsx";

/**
 * Tabla de datos con estados de carga / vacío.
 * columns: [{ key, header, render?(row), align?, width? }]
 */
export default function DataTable({
  columns,
  rows,
  loading,
  emptyTitle = "Sin registros",
  emptyText = "Aún no hay datos para mostrar.",
  rowKey = "id",
}) {
  if (loading) {
    return (
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} style={{ textAlign: c.align }}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}>
                {columns.map((c) => (
                  <td key={c.key}>
                    <div className="skeleton" style={{ height: 14, width: `${50 + ((i * 7 + c.key.length * 5) % 45)}%` }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="empty">
        <div className="empty__icon">
          <Icon name="package" size={28} />
        </div>
        <h4>{emptyTitle}</h4>
        <p>{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ textAlign: c.align, width: c.width }}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row[rowKey] ?? idx}>
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={c.align === "right" ? "cell-actions cell-mono" : c.className}
                  style={{ textAlign: c.align }}
                >
                  {c.render ? c.render(row) : row[c.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
