import React, { useEffect } from "react";
import "../style/notification.css";

function Notification({ toasts, remove }) {
  useEffect(() => {
    if (toasts.length === 0) return;
  }, [toasts]);

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{t.msg}</span>

          <button
            className="toast-close-btn"
            onClick={() => remove(t.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

export default Notification;