import InputLabel from "./inputLabel";

const styles = {
  panel: {
    backgroundColor: "#e5e7eb",
    border: "2px solid #1e293b",
    padding: "10px",
    boxSizing: "border-box" as const,
    minHeight: "calc(100vh - 24px)",
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "space-between",
    gap: "12px",
  },
  topSection: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
  },
  bottomSection: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
  },
  imageList: {
    minHeight: "130px",
    border: "2px solid #1e293b",
    backgroundColor: "#f3f4f6",
  },
  select: {
    border: "2px solid #1e293b",
    height: "38px",
    backgroundColor: "#f3f4f6",
    color: "#0f172a",
    padding: "0 8px",
    fontSize: "16px",
  },
  inputText: {
    border: "2px solid #1e293b",
    height: "38px",
    backgroundColor: "#f3f4f6",
    color: "#0f172a",
    padding: "0 8px",
    fontSize: "16px",
    boxSizing: "border-box" as const,
  },
  inputFile: {
    border: "2px solid #1e293b",
    backgroundColor: "#f3f4f6",
    color: "#0f172a",
    padding: "6px",
    fontSize: "14px",
  },
  previewTextArea: {
    minHeight: "130px",
    resize: "none" as const,
    border: "2px solid #1e293b",
    backgroundColor: "#f3f4f6",
    padding: "8px",
    fontSize: "15px",
    color: "#0f172a",
  },
  actionButton: {
    border: "2px solid #1e293b",
    backgroundColor: "#334155",
    color: "#f8fafc",
    fontWeight: 700,
    padding: "4px 14px",
    fontSize: "16px",
    cursor: "pointer",
    alignSelf: "flex-start" as const,
  },
} as const;

export default function FormPanel() {
  return (
    <div style={styles.panel}>
      <section style={styles.topSection}>
        <section className="images_list" style={styles.imageList}></section>
        <button className="add_images" style={styles.actionButton}>Adicionar imagens</button>
      </section>

      <section style={styles.bottomSection}>
        <InputLabel value="Tipo" />
        <select name="type" id="type" multiple={false} style={styles.select}>
          <option value="POST">Post</option>
          <option value="PROMOTION">Promocao</option>
        </select>

        <InputLabel value="Titulo" />
        <input type="text" style={styles.inputText}></input>

        <InputLabel value="Imagem do card" />
        <input type="file" style={styles.inputFile}></input>

        <InputLabel value="Previa" />
        <textarea style={styles.previewTextArea}></textarea>
      </section>
    </div>
  );
}
