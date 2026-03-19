import EditorPanel from "../components/EditorPanel";
import FormPanel from "../components/FormPanel";
import PostPreviewPanel from "../components/PostPreviewPanel";

const styles = {
  app: {
    minHeight: "100vh",
    width: "100%",
    backgroundColor: "#d1d5db",
    padding: "24px",
    boxSizing: "border-box" as const,
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: "#0f172a",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "12px",
    alignItems: "stretch",
  },
} as const;

function App() {
  return (
    <div style={styles.app}>
      <div style={styles.container}>
        <EditorPanel />
        <FormPanel />
        <PostPreviewPanel />
      </div>
    </div>
  );
}

export default App;
