import "../assets/css/PostPreviewPanel.css";

export default function PostPreviewPanel() {
  return (
    <div className="post-preview-panel">
      <button className="post-preview-panel-cards cards_dropdown">Novo post</button>
      <div className="post-preview-panel-content post_preview">
        <div>Preview</div>
      </div>
    </div>
  );
}
