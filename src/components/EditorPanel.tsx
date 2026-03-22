import { useState } from "react";
import { usePostDraft } from "../app/postDraftContext";
import {
  deleteTempImage,
  downloadTempImageAsFile
} from "../services/tempImages";
import uploadPostService from "../services/uploadPost";
import "../assets/css/EditorPanel.css";

type SaveModalState = "closed" | "asking_password" | "submitting" | "result";

export default function EditorPanel() {
  const { draft, setContentMarkdown } = usePostDraft();
  const [saveModalState, setSaveModalState] = useState<SaveModalState>("closed");
  const [password, setPassword] = useState("");
  const [saveResultMessage, setSaveResultMessage] = useState("");
  const [saveSucceeded, setSaveSucceeded] = useState(false);

  function openSaveModal() {
    setPassword("");
    setSaveResultMessage("");
    setSaveSucceeded(false);
    setSaveModalState("asking_password");
  }

  function closeSaveModal() {
    setSaveModalState("closed");
  }

  async function handleConfirmSave() {
    if (!draft.banner) {
      setSaveSucceeded(false);
      setSaveResultMessage("Selecione a imagem do card antes de salvar.");
      setSaveModalState("result");
      return;
    }

    if (!password.trim()) {
      setSaveSucceeded(false);
      setSaveResultMessage("Informe a senha para salvar.");
      setSaveModalState("result");
      return;
    }

    setSaveModalState("submitting");

    try {
      const validTempImages = draft.tempImages.filter(
        (item) => item.storagePath && !item.isBusy
      );

      const downloadedImages = await Promise.all(
        validTempImages.map(async (item) => {
          const storagePath = item.storagePath as string;
          const file = await downloadTempImageAsFile(storagePath, item.pendingName || item.name);

          return {
            file,
            name: file.name
          };
        })
      );

      const result = await uploadPostService({
        category: draft.category.toUpperCase(),
        title: draft.title,
        preview: draft.preview,
        content_markdown: draft.content_markdown,
        banner: draft.banner,
        images: downloadedImages,
        password: password.trim()
      });

      if (result.status >= 200 && result.status < 300) {
        const cleanupTargets = validTempImages
          .map((item) => item.storagePath)
          .filter((path): path is string => Boolean(path));

        await Promise.allSettled(cleanupTargets.map((path) => deleteTempImage(path)));

        setSaveSucceeded(true);
        setSaveResultMessage("Post salvo com sucesso.");
        setSaveModalState("result");
        return;
      }

      setSaveSucceeded(false);
      setSaveResultMessage(`Falha ao salvar (status ${result.status}).`);
      setSaveModalState("result");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro inesperado ao salvar.";
      setSaveSucceeded(false);
      setSaveResultMessage(message);
      setSaveModalState("result");
    }
  }

  function handleResultOk() {
    if (saveSucceeded) {
      window.location.reload();
      return;
    }

    closeSaveModal();
  }

  return (
    <div className="editor-panel">
      <textarea
        className="editor-panel-area"
        value={draft.content_markdown}
        onChange={(event) => setContentMarkdown(event.target.value)}
      ></textarea>

      <div className="editor-panel-buttons">
        <button className="editor-panel-button" onClick={openSaveModal}>Salvar</button>
        <button className="editor-panel-button">Preview</button>
      </div>

      {saveModalState !== "closed" ? (
        <div className="editor-panel-modal-backdrop">
          <div className="editor-panel-modal" role="dialog" aria-modal="true">
            {saveModalState === "asking_password" ? (
              <>
                <h3 className="editor-panel-modal-title">Confirmar salvamento</h3>
                <p className="editor-panel-modal-text">Digite a senha para criar o post.</p>
                <input
                  type="password"
                  className="editor-panel-modal-input"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoFocus
                />
                <div className="editor-panel-modal-buttons">
                  <button className="editor-panel-button" onClick={closeSaveModal}>Cancelar</button>
                  <button className="editor-panel-button" onClick={handleConfirmSave}>Ok</button>
                </div>
              </>
            ) : null}

            {saveModalState === "submitting" ? (
              <>
                <h3 className="editor-panel-modal-title">Salvando</h3>
                <p className="editor-panel-modal-text">Enviando post, aguarde...</p>
              </>
            ) : null}

            {saveModalState === "result" ? (
              <>
                <h3 className="editor-panel-modal-title">
                  {saveSucceeded ? "Sucesso" : "Falha ao salvar"}
                </h3>
                <p className="editor-panel-modal-text">{saveResultMessage}</p>
                <div className="editor-panel-modal-buttons">
                  <button className="editor-panel-button" onClick={handleResultOk}>Ok</button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
