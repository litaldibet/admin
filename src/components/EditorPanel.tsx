import { useState } from "react";
import { usePostDraft, type PostDraftState } from "../app/postDraftContext";
import {
  deleteTempImage,
  downloadTempImageAsFile
} from "../services/tempImages";
import uploadPostService from "../services/uploadPost";
import "../assets/css/EditorPanel.css";

type SaveModalState = "closed" | "asking_password" | "submitting" | "result";
const IMAGE_NAME_ALLOWED = /^[A-Za-z0-9]+$/;

type MarkdownImageRef = {
  raw: string;
  normalized: string;
  normalizedNoExt: string;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getFileNameFromPath(path: string): string {
  return path.split("/").filter(Boolean).pop() ?? "";
}

function stripExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex <= 0) {
    return fileName;
  }

  return fileName.slice(0, dotIndex);
}

function normalizeRefName(raw: string): string {
  const trimmed = raw.trim().replace(/^['"]|['"]$/g, "");
  const withoutHash = trimmed.split("#")[0] ?? "";
  const withoutQuery = withoutHash.split("?")[0] ?? "";
  const lastSegment = withoutQuery.split("/").filter(Boolean).pop() ?? withoutQuery;

  return lastSegment.trim();
}

function isAbsoluteOrSpecialUrl(url: string): boolean {
  return /^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(url) ||
    url.startsWith("data:") ||
    url.startsWith("blob:") ||
    url.startsWith("mailto:") ||
    url.startsWith("tel:") ||
    url.startsWith("#");
}

function getMarkdownImageReferences(markdown: string): MarkdownImageRef[] {
  const refs: MarkdownImageRef[] = [];
  const regex = /!\[[^\]]*\]\(([^)]+)\)/g;

  for (const match of markdown.matchAll(regex)) {
    const rawTarget = (match[1] ?? "").trim();
    const mainTarget = rawTarget.split(/\s+/)[0] ?? "";

    if (!mainTarget || isAbsoluteOrSpecialUrl(mainTarget)) {
      continue;
    }

    const normalized = normalizeRefName(mainTarget);
    if (!normalized) {
      continue;
    }

    refs.push({
      raw: normalized,
      normalized,
      normalizedNoExt: stripExtension(normalized)
    });
  }

  return refs;
}

function getImageAliases(item: PostDraftState["tempImages"][number]): string[] {
  const names = [item.pendingName, item.name]
    .map((value) => value.trim())
    .filter(Boolean);

  if (item.storagePath) {
    const fileName = getFileNameFromPath(item.storagePath).trim();
    if (fileName) {
      names.push(fileName, stripExtension(fileName));
    }
  }

  return Array.from(new Set(names));
}

function validateDraftBeforeSave(draft: PostDraftState): string[] {
  const errors = new Set<string>();

  if (!draft.content_markdown.trim()) {
    errors.add("Campo markdown_content não está preenchido");
  }

  if (!draft.title.trim()) {
    errors.add("Campo título não está preenchido");
  }

  if (!draft.banner) {
    errors.add("Campo imagem do card não está preenchido");
  }

  if (!draft.preview.trim()) {
    errors.add("Campo prévia não está preenchido");
  }

  const markdownImageRefs = getMarkdownImageReferences(draft.content_markdown);
  const markdownRefsSet = new Set(markdownImageRefs.map((ref) => ref.normalized));
  const markdownRefsNoExtSet = new Set(markdownImageRefs.map((ref) => ref.normalizedNoExt));
  const activeImages = draft.tempImages.filter((item) => Boolean(item.storagePath));

  const imageAliasSet = new Set<string>();
  const imageAliasNoExtSet = new Set<string>();

  for (const item of activeImages) {
    const aliases = getImageAliases(item);
    const displayName = (item.pendingName || item.name).trim();

    if (displayName && !IMAGE_NAME_ALLOWED.test(displayName)) {
      errors.add(`Imagem ${displayName} contém caracteres impróprios`);
    }

    for (const alias of aliases) {
      imageAliasSet.add(alias);
      imageAliasNoExtSet.add(stripExtension(alias));
    }

    const used = aliases.some((alias) => markdownRefsSet.has(alias) || markdownRefsNoExtSet.has(stripExtension(alias)));

    if (!used) {
      errors.add(`Imagem ${displayName || aliases[0] || "sem_nome"} no container de imagens não está sendo usada`);
    }
  }

  for (const ref of markdownImageRefs) {
    if (!IMAGE_NAME_ALLOWED.test(ref.normalizedNoExt)) {
      errors.add(`Imagem ${ref.raw} contém caracteres impróprios`);
    }

    const exists = imageAliasSet.has(ref.normalized) || imageAliasNoExtSet.has(ref.normalizedNoExt);

    if (!exists) {
      errors.add(`Imagem ${ref.raw} no texto do post não existe`);
    }
  }

  return Array.from(errors);
}

function buildPreviewMarkdown(
  contentMarkdown: string,
  tempImages: Array<{
    name: string;
    pendingName: string;
    storagePath: string | null;
    publicUrl: string | null;
  }>
): string {
  let result = contentMarkdown;

  for (const item of tempImages) {
    if (!item.storagePath || !item.publicUrl) {
      continue;
    }

    const fullFileName = getFileNameFromPath(item.storagePath);
    const aliases = [item.name, item.pendingName, fullFileName]
      .map((value) => value.trim())
      .filter(Boolean);

    for (const alias of aliases) {
      const safeAlias = escapeRegExp(alias);
      const regex = new RegExp(`\\(${safeAlias}\\)`, "g");
      result = result.replace(regex, `(${item.publicUrl})`);
    }
  }

  return result;
}

export default function EditorPanel() {
  const { draft, setContentMarkdown, setPreviewMarkdown } = usePostDraft();
  const [saveModalState, setSaveModalState] = useState<SaveModalState>("closed");
  const [password, setPassword] = useState("");
  const [saveResultTitle, setSaveResultTitle] = useState("");
  const [saveResultMessage, setSaveResultMessage] = useState("");
  const [saveErrorList, setSaveErrorList] = useState<string[]>([]);
  const [saveSucceeded, setSaveSucceeded] = useState(false);

  function openSaveModal() {
    const validationErrors = validateDraftBeforeSave(draft);

    if (validationErrors.length > 0) {
      setSaveSucceeded(false);
      setSaveResultTitle("Erro ao salvar o post");
      setSaveResultMessage("");
      setSaveErrorList(validationErrors);
      setSaveModalState("result");
      return;
    }

    setPassword("");
    setSaveResultTitle("");
    setSaveResultMessage("");
    setSaveErrorList([]);
    setSaveSucceeded(false);
    setSaveModalState("asking_password");
  }

  function closeSaveModal() {
    setSaveModalState("closed");
  }

  async function handleConfirmSave() {
    if (!draft.banner) {
      setSaveSucceeded(false);
      setSaveResultTitle("Erro ao salvar o post");
      setSaveResultMessage("Selecione a imagem do card antes de salvar.");
      setSaveErrorList([]);
      setSaveModalState("result");
      return;
    }

    if (!password.trim()) {
      setSaveSucceeded(false);
      setSaveResultTitle("Erro ao salvar o post");
      setSaveResultMessage("Informe a senha para salvar.");
      setSaveErrorList([]);
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
        setSaveResultTitle("Sucesso");
        setSaveResultMessage("Post salvo com sucesso.");
        setSaveErrorList([]);
        setSaveModalState("result");
        return;
      }

      setSaveSucceeded(false);
      setSaveResultTitle("Erro ao salvar o post");
      setSaveResultMessage(`Falha ao salvar (status ${result.status}).`);
      setSaveErrorList([]);
      setSaveModalState("result");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro inesperado ao salvar.";
      setSaveSucceeded(false);
      setSaveResultTitle("Erro ao salvar o post");
      setSaveResultMessage(message);
      setSaveErrorList([]);
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

  function handlePreview() {
    const generated = buildPreviewMarkdown(draft.content_markdown, draft.tempImages);
    setPreviewMarkdown(generated);
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
        <button className="editor-panel-button" onClick={handlePreview}>Preview</button>
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
                  {saveResultTitle || (saveSucceeded ? "Sucesso" : "Erro ao salvar o post")}
                </h3>
                {saveErrorList.length > 0 ? (
                  <ul className="editor-panel-modal-error-list">
                    {saveErrorList.map((error) => (
                      <li key={error} className="editor-panel-modal-text">{error}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="editor-panel-modal-text">{saveResultMessage}</p>
                )}
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
