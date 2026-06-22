import { useEffect, useState } from "react";

/**
 * Carga todas las páginas de un recurso y las mapea a opciones {value,label}.
 * map(item) -> { value, label }
 */
export default function useOptions(api, map, deps = []) {
  const [options, setOptions] = useState([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const all = [];
        let page = 1;
        let keepGoing = true;
        while (keepGoing && page <= 30) {
          const { data } = await api.list({ page, page_size: 100 });
          const items = Array.isArray(data) ? data : data.results || [];
          all.push(...items);
          if (Array.isArray(data) || !data.next) keepGoing = false;
          else page += 1;
        }
        if (active) setOptions(all.map(map));
      } catch {
        if (active) setOptions([]);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return options;
}
