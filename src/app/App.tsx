import EditorPanel from "../components/EditorPanel";
import FormPanel from "../components/FormPanel";
import PostPreviewPanel from "../components/PostPreviewPanel";
import "../assets/css/App.css";

function App() {
  return (
    <div className="app">
      <div className="app-container">
        <EditorPanel />
        <FormPanel />
        <PostPreviewPanel />
      </div>
    </div>
  );
}

export default App;
