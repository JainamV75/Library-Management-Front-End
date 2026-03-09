function ConfirmModal({
  open,
  title = "Confirm",
  message = "Are you sure?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button className="btn-outline" onClick={onCancel} type="button">
            {cancelText}
          </button>
          <button className="btn-danger" onClick={onConfirm} type="button">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
