const styles = {
  panel: {
    backgroundColor: "#e5e7eb",
    border: "2px solid #1e293b",
    minHeight: "calc(100vh - 24px)",
    display: "flex",
    flexDirection: "column" as const,
    padding: 0,
    overflow: "hidden",
  },
  cardsDropdown: {
    border: "none",
    borderBottom: "2px solid #1e293b",
    backgroundColor: "#cbd5e1",
    color: "#0f172a",
    fontSize: "36px",
    fontWeight: 700,
    lineHeight: 1,
    padding: "10px 14px",
    textAlign: "left" as const,
    cursor: "default",
  },
  postPreview: {
    flex: 1,
    padding: "16px",
    backgroundColor: "#f3f4f6",
  },
} as const;

export default function PostPreviewPanel() {
  return (
    <div style={styles.panel}>
      <button className="cards_dropdown" style={styles.cardsDropdown}>Cards</button>
      <div className="post_preview" style={styles.postPreview}>
        <div>Preview</div>
      </div>
    </div>
  );
}
