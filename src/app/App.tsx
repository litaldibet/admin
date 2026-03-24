import EditorPanel from "../components/EditorPanel";
import FormPanel from "../components/FormPanel";
import PostPreviewPanel from "../components/PostPreviewPanel";
import { PostDraftProvider } from "./postDraftStore";
import "../assets/css/App.css";

function App() {
  return (
    <div className="app">
      <PostDraftProvider>
        <div className="app-container">
          <EditorPanel />
          <FormPanel />
          <PostPreviewPanel />
        </div>
        <div id="app-modal-root"></div>
      </PostDraftProvider>
    </div>
  );
}

export default App;
