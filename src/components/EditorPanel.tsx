import { useEffect, useRef, useState } from "react";
import { Globe } from "lucide-react";
import broomIcon from "../assets/img/broom.png";
import { usePostDraft, type PostDraftState } from "../app/postDraftContext";
import { MAIN_WEBSITE_URL } from "../config/externalLinks";
import AppModal from "./AppModal";
import {
  clearTempImages,
  deleteTempImage,
  downloadTempImageAsFile
} from "../services/tempImages";
import uploadPostService from "../services/uploadPost";
import updatePostService from "../services/updatePost";
import "../assets/css/EditorPanel.css";

type SaveModalState = "closed" | "asking_password" | "submitting" | "result";
const IMAGE_NAME_ALLOWED = /^[A-Za-z0-9]+$/;
const MARKDOWN_HELP_TEMPLATE = `# Tutorial básico de como formatar o texto

_Pra começar, clique no botão **preview** para ver como o texto fica com a formatação aplicada!_

**Texto em negrito**\\
Usar barra invertida: \\ para forçar quebra de linha

Dar 1 linha vazia de distância entre duas linhas de texto também quebra linha.

# Exemplo de título grande

## Exemplo de título menor

### Título pequeno

<div align="center">
Para centralizar texto e imagens, use isso.

Também funciona pra centralizar imagens
</div>

Esses 3 hífens abaixo criam uma "divisão" no texto:

---

Para usar imagens:

![img](nomeDaImagem)

Dentro do parênteses, insira o nome da imagem da mesma forma  que está no container.

Para fazer lista:

- Elemento um
- Elemento dois
- Elemento três

Para fazer lista enumerada:

1. Elemento um
2. Elemento dois
3. Elemento três

Para saber  mais de markdown, clique [aqui](https://www.markdownguide.org/basic-syntax/)`;

type MarkdownImageRef = {
  raw: string;
  normalized: string;
  normalizedNoExt: string;
};

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function humanizeBackendError(error: string): string {
  const normalized = error.replace(/_/g, " ").trim().toLowerCase();

  if (!normalized) {
    return "";
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function extractBackendError(data: unknown): string | null {
  if (isObjectRecord(data) && typeof data.error === "string") {
    return data.error;
  }

  return null;
}

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

function validateDraftBeforeSave(draft: PostDraftState, isEditing: boolean): string[] {
  const errors = new Set<string>();

  if (!draft.content_markdown.trim()) {
    errors.add("Campo markdown_content não está preenchido");
  }

  if (!draft.title.trim()) {
    errors.add("Campo título não está preenchido");
  }

  if (!isEditing && !draft.banner) {
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

function hasPendingDraftChanges(draft: PostDraftState, isEditing: boolean): boolean {
  if (isEditing) {
    return true;
  }

  if (draft.category !== "BLOG") {
    return true;
  }

  if (draft.title.trim() || draft.preview.trim() || draft.content_markdown.trim()) {
    return true;
  }

  if (draft.banner) {
    return true;
  }

  return draft.tempImages.some((item) => Boolean(item.storagePath));
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
  const {
    draft,
    editSession,
    setContentMarkdown,
    setPreviewMarkdown,
    setDraftValues,
    requestTempReload
  } = usePostDraft();
  const [saveModalState, setSaveModalState] = useState<SaveModalState>("closed");
  const [password, setPassword] = useState("");
  const [saveResultTitle, setSaveResultTitle] = useState("");
  const [saveResultMessage, setSaveResultMessage] = useState("");
  const [saveErrorList, setSaveErrorList] = useState<string[]>([]);
  const [saveSucceeded, setSaveSucceeded] = useState(false);
  const [isHelpConfirmOpen, setIsHelpConfirmOpen] = useState(false);
  const [isClearingForm, setIsClearingForm] = useState(false);
  const skipUnloadWarningRef = useRef(false);

  useEffect(() => {
    const shouldWarn = hasPendingDraftChanges(draft, Boolean(editSession));

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (skipUnloadWarningRef.current) {
        return;
      }

      if (!shouldWarn) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    const handlePageHide = () => {
      if (skipUnloadWarningRef.current) {
        return;
      }

      if (!shouldWarn) {
        return;
      }

      // Best effort cleanup when user really leaves/reloads the page.
      void clearTempImages();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [draft, editSession]);

  function openSaveModal() {
    const validationErrors = validateDraftBeforeSave(draft, Boolean(editSession));

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
    if (!editSession && !draft.banner) {
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

      const basePayload = {
        category: draft.category.toUpperCase(),
        title: draft.title,
        preview: draft.preview,
        content_markdown: draft.content_markdown,
        banner: draft.banner,
        images: downloadedImages,
        password: password.trim()
      };

      const result = editSession
        ? await updatePostService({ id: editSession.postId, ...basePayload })
        : await uploadPostService(basePayload);

      if (result.status >= 200 && result.status < 300) {
        const cleanupTargets = validTempImages
          .map((item) => item.storagePath)
          .filter((path): path is string => Boolean(path));

        await Promise.allSettled(cleanupTargets.map((path) => deleteTempImage(path)));
        await clearTempImages();

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
      const backendError = extractBackendError(result.data);
      setSaveErrorList(backendError ? [humanizeBackendError(backendError)] : []);
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
      skipUnloadWarningRef.current = true;
      window.location.reload();
      return;
    }

    closeSaveModal();
  }

  function handlePreview() {
    const generated = buildPreviewMarkdown(draft.content_markdown, draft.tempImages);
    setPreviewMarkdown(generated);
  }

  async function handleCancelEdit() {
    try {
      await clearTempImages();
    } finally {
      window.location.reload();
    }
  }

  function applyMarkdownHelpTemplate() {
    setContentMarkdown(MARKDOWN_HELP_TEMPLATE);
    setPreviewMarkdown("");
  }

  function handleHelpClick() {
    if (draft.content_markdown.trim()) {
      setIsHelpConfirmOpen(true);
      return;
    }

    applyMarkdownHelpTemplate();
  }

  function handleHelpConfirmContinue() {
    applyMarkdownHelpTemplate();
    setIsHelpConfirmOpen(false);
  }

  function handleHelpConfirmCancel() {
    setIsHelpConfirmOpen(false);
  }

  async function handleClearAll() {
    setIsClearingForm(true);

    try {
      await clearTempImages();

      setDraftValues({
        category: "BLOG",
        title: "",
        preview: "",
        content_markdown: "",
        banner: null,
        tempImages: []
      });

      setPreviewMarkdown("");
      requestTempReload();
    } finally {
      setIsClearingForm(false);
    }
  }

  function handleOpenWebsite() {
    window.open(MAIN_WEBSITE_URL, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="editor-panel">
      <div className="editor-panel-header">
        {editSession ? `Editando: ${editSession.postTitle}` : "Novo post"}
      </div>

      <textarea
        className="editor-panel-area"
        value={draft.content_markdown}
        onChange={(event) => setContentMarkdown(event.target.value)}
      ></textarea>

      <div className="editor-panel-buttons">
        <div className="editor-panel-buttons-left">
          <button className="editor-panel-button" onClick={openSaveModal}>Salvar</button>
          {editSession ? (
            <button className="editor-panel-button" onClick={handleCancelEdit}>Cancelar</button>
          ) : null}
          <button className="editor-panel-button" onClick={handlePreview}>Preview</button>
        </div>

        <div className="editor-panel-buttons-right">
          <button
            type="button"
            className="editor-panel-button editor-panel-icon-button"
            aria-label="Ajuda markdown"
            onClick={handleHelpClick}
          >
            ?
          </button>
          <button
            type="button"
            className="editor-panel-button editor-panel-icon-button"
            aria-label="Limpar"
            onClick={() => void handleClearAll()}
          >
            <img src={broomIcon} alt="Limpar" className="editor-panel-icon-image" />
          </button>
          <button
            type="button"
            className="editor-panel-button editor-panel-icon-button"
            aria-label="Website"
            onClick={handleOpenWebsite}
          >
            <Globe size={16} />
          </button>
        </div>
      </div>

      {isHelpConfirmOpen ? (
        <AppModal>
          <div className="editor-panel-modal" role="dialog" aria-modal="true">
            <h3 className="editor-panel-modal-title">Substituir conteúdo?</h3>
            <p className="editor-panel-modal-text">
              Fazer isso vai substituir todo o conteúdo atual do container de texto.
            </p>
            <div className="editor-panel-modal-buttons">
              <button className="editor-panel-button" onClick={handleHelpConfirmCancel}>Cancelar</button>
              <button className="editor-panel-button" onClick={handleHelpConfirmContinue}>Continuar</button>
            </div>
          </div>
        </AppModal>
      ) : null}

      {isClearingForm ? (
        <AppModal>
          <div className="editor-panel-modal" role="dialog" aria-modal="true">
            <h3 className="editor-panel-modal-title">Limpando formulário</h3>
            <p className="editor-panel-modal-text">Limpando formulário...</p>
          </div>
        </AppModal>
      ) : null}

      {saveModalState !== "closed" ? (
        <AppModal>
          <div className="editor-panel-modal" role="dialog" aria-modal="true">
            {saveModalState === "asking_password" ? (
              <>
                <h3 className="editor-panel-modal-title">Confirmar salvamento</h3>
                <p className="editor-panel-modal-text">
                  {editSession ? "Digite a senha para editar o post." : "Digite a senha para criar o post."}
                </p>
                <input
                  type="password"
                  className="editor-panel-modal-input"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleConfirmSave();
                    }
                  }}
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
                {saveResultMessage ? (
                  <p className="editor-panel-modal-text">{saveResultMessage}</p>
                ) : null}
                {saveErrorList.length > 0 ? (
                  <ul className="editor-panel-modal-error-list">
                    {saveErrorList.map((error) => (
                      <li key={error} className="editor-panel-modal-text">{error}</li>
                    ))}
                  </ul>
                ) : null}
                <div className="editor-panel-modal-buttons">
                  <button className="editor-panel-button" onClick={handleResultOk}>Ok</button>
                </div>
              </>
            ) : null}
          </div>
        </AppModal>
      ) : null}
    </div>
  );
}
