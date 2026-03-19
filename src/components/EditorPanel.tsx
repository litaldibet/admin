const styles = {
  panel: {
    backgroundColor: "#e5e7eb",
    border: "2px solid #1e293b",
    padding: "10px",
    boxSizing: "border-box" as const,
    minHeight: "640px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
  },
  editorArea: {
    flex: 1,
    resize: "none" as const,
    border: "2px solid #1e293b",
    backgroundColor: "#f3f4f6",
    padding: "12px",
    fontSize: "16px",
    lineHeight: 1.4,
    color: "#0f172a",
  },
  editorButtons: {
    marginTop: "auto",
    display: "flex",
    justifyContent: "space-between",
    gap: "8px",
  },
  actionButton: {
    border: "2px solid #1e293b",
    backgroundColor: "#334155",
    color: "#f8fafc",
    fontWeight: 700,
    padding: "4px 14px",
    fontSize: "16px",
    cursor: "pointer",
  },
} as const;

export default function EditorPanel() {
  return (
    <div style={styles.panel}>
      <textarea style={styles.editorArea}></textarea>

      <div style={styles.editorButtons}>
        <button style={styles.actionButton}>Salvar</button>
        <button style={styles.actionButton}>Preview</button>
      </div>
    </div>
  );
}
