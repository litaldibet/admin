import "../assets/css/EditorPanel.css";

export default function EditorPanel() {
  return (
    <div className="editor-panel">
      <textarea className="editor-panel-area"></textarea>

      <div className="editor-panel-buttons">
        <button className="editor-panel-button">Salvar</button>
        <button className="editor-panel-button">Preview</button>
      </div>
    </div>
  );
}
