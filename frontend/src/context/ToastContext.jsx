import { createContext, useCallback, useContext, useState } from "react";
import Icon from "../components/Icon.jsx";

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

let idSeq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (type, title, message) => {
      const id = ++idSeq;
      setToasts((t) => [...t, { id, type, title, message }]);
      setTimeout(() => dismiss(id), 4200);
    },
    [dismiss]
  );

  const toast = {
    success: (title, message) => push("success", title, message),
    error: (title, message) => push("error", title, message),
    info: (title, message) => push("info", title, message),
  };

  const iconFor = { success: "check", error: "alert", info: "info" };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`} onClick={() => dismiss(t.id)}>
            <span className="toast__icon">
              <Icon name={iconFor[t.type]} size={18} />
            </span>
            <div className="toast__body">
              <b>{t.title}</b>
              {t.message && <span>{t.message}</span>}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
