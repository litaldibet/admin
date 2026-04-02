import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { isLoadCardsSuccessResponse, type PostCard } from "@shared/contracts/loadCards";
import { isLoadPostSuccessResponse, type PostDetails } from "@shared/contracts/loadPost";
import { isObjectRecord } from "@shared/utils/objectGuards";
import loadCardsService from "../services/loadCards";
import deletePostService from "../services/deletePost";
import loadPostService from "../services/loadPost";
import PostDropdownItem from "./PostDropdownItem";
import { usePostDraft } from "../app/postDraftContext";
import { MarkdownRenderer } from "./markdown";
import AppModal from "./AppModal";
import { clearTempImages, importPostImageToTemp } from "../services/tempImages";
import "../assets/css/PostPreviewPanel.css";

type DropdownPost = {
  id: string;
  title: string;
  bannerUrl: string;
  preview?: string;
  postType?: string;
};

type DeleteModalState = "closed" | "asking_password" | "submitting" | "result";

function extractRequestErrorMessage(data: unknown, status: number): string {
  if (isObjectRecord(data) && typeof data.error === "string" && data.error) {
    return data.error;
  }

  return `Falha ao carregar cards (status ${status}).`;
}


function humanizeErrorMessage(error: string): string {
  const normalized = error.replace(/_/g, " ").trim().toLowerCase();

  if (!normalized) {
    return "";
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function extractBackendError(data: unknown): string | null {
  if (isObjectRecord(data) && typeof data.error === "string" && data.error) {
    return data.error;
  }

  return null;
}

function stripExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex <= 0) {
    return fileName;
  }

  return fileName.slice(0, dotIndex);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getFileNameFromPath(path: string): string {
  return path.split("/").filter(Boolean).pop() ?? "";
}

function reverseMarkdownImagePaths(markdown: string, imagePaths: string[]): string {
  let result = markdown;

  for (const path of imagePaths) {
    const fileName = getFileNameFromPath(path);
    const shortName = stripExtension(fileName);

    if (!shortName) {
      continue;
    }

    const escapedPath = escapeRegExp(path);
    const regex = new RegExp(`\\(${escapedPath}\\)`, "g");
    result = result.replace(regex, `(${shortName})`);
  }

  return result;
}

function extractRelativeImagePathsFromMarkdown(markdown: string): string[] {
  const paths = new Set<string>();
  const regex = /!\[[^\]]*\]\(([^)]+)\)/g;

  for (const match of markdown.matchAll(regex)) {
    const rawTarget = (match[1] ?? "").trim();
    const target = rawTarget.split(/\s+/)[0] ?? "";

    if (!target) {
      continue;
    }

    // Keep only relative storage-like paths (e.g. <id>/imagem.jpg).
    if (/^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(target) || target.startsWith("data:") || target.startsWith("blob:")) {
      continue;
    }

    if (target.includes("/")) {
      paths.add(target);
    }
  }

  return Array.from(paths);
}

function mapCardsToDropdownPosts(cards: PostCard[]): DropdownPost[] {
  return cards.map((card) => ({
    id: card.id,
    title: card.title,
    bannerUrl: card.banner_url,
    preview: card.preview,
    postType: card.post_type,
  }));
}

export default function PostPreviewPanel() {
  const {
    previewMarkdown,
    editSession,
    setPreviewMarkdown,
    setDraftValues,
    startEditSession,
    requestTempReload
  } = usePostDraft();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [hasLoadedCards, setHasLoadedCards] = useState(false);
  const [cardsError, setCardsError] = useState<string | null>(null);
  const [dropdownPosts, setDropdownPosts] = useState<DropdownPost[]>([]);
  const [deleteModalState, setDeleteModalState] = useState<DeleteModalState>("closed");
  const [deleteTargetPostId, setDeleteTargetPostId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteResultTitle, setDeleteResultTitle] = useState("");
  const [deleteResultMessage, setDeleteResultMessage] = useState("");
  const [deleteResultDetails, setDeleteResultDetails] = useState<string | null>(null);
  const [deleteSucceeded, setDeleteSucceeded] = useState(false);
  const [editTargetPost, setEditTargetPost] = useState<DropdownPost | null>(null);
  const [isPreparingEdit, setIsPreparingEdit] = useState(false);
  const [editErrorMessage, setEditErrorMessage] = useState<string | null>(null);

  function handleToggleDropdown() {
    setIsDropdownOpen((prev) => !prev);
  }

  function openEditConfirm(postId: string) {
    const target = dropdownPosts.find((post) => post.id === postId) ?? null;
    setEditTargetPost(target);
    setEditErrorMessage(null);
  }

  function closeEditConfirm() {
    if (isPreparingEdit) {
      return;
    }

    setEditTargetPost(null);
    setEditErrorMessage(null);
  }

  async function handleConfirmEdit() {
    if (!editTargetPost) {
      return;
    }

    setIsPreparingEdit(true);
    setEditErrorMessage(null);

    try {
      await clearTempImages();

      const postResult = await loadPostService(editTargetPost.id);

      if (postResult.status !== 200 || !isLoadPostSuccessResponse(postResult.data)) {
        const backendError = extractBackendError(postResult.data);
        throw new Error(backendError ? humanizeErrorMessage(backendError) : `Falha ao carregar post (status ${postResult.status}).`);
      }

      const postData: PostDetails = {
        ...postResult.data.data,
        image_paths: postResult.data.data.image_paths.length > 0
          ? postResult.data.data.image_paths
          : extractRelativeImagePathsFromMarkdown(postResult.data.data.content_markdown),
      };

      await Promise.all(postData.image_paths.map((path) => importPostImageToTemp(path)));

      const editableMarkdown = reverseMarkdownImagePaths(postData.content_markdown, postData.image_paths);

      setDraftValues({
        category: postData.post_type,
        title: postData.title,
        preview: postData.preview,
        content_markdown: editableMarkdown,
        active: postData.active,
        banner: null
      });

      setPreviewMarkdown("");
      startEditSession(postData.id, postData.title);
      requestTempReload();

      setIsDropdownOpen(false);
      setEditTargetPost(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Falha inesperada ao preparar edição.";
      setEditErrorMessage(message);
    } finally {
      setIsPreparingEdit(false);
    }
  }

  useEffect(() => {
    if (!isDropdownOpen || hasLoadedCards) {
      return;
    }

    async function loadCards() {
      setIsLoadingCards(true);
      setCardsError(null);

      try {
        const result = await loadCardsService();

        if (result.status !== 200 || !isLoadCardsSuccessResponse(result.data)) {
          setCardsError(extractRequestErrorMessage(result.data, result.status));
          return;
        }

        const mappedPosts = mapCardsToDropdownPosts(result.data.data);

        setDropdownPosts(mappedPosts);
        setHasLoadedCards(true);
      } catch {
        setCardsError("Falha inesperada ao carregar cards.");
      } finally {
        setIsLoadingCards(false);
      }
    }

    void loadCards();
  }, [hasLoadedCards, isDropdownOpen]);

  function openDeleteModal(postId: string) {
    setDeleteTargetPostId(postId);
    setDeletePassword("");
    setDeleteResultTitle("");
    setDeleteResultMessage("");
    setDeleteResultDetails(null);
    setDeleteSucceeded(false);
    setDeleteModalState("asking_password");
  }

  function closeDeleteModal() {
    setDeleteModalState("closed");
  }

  async function handleConfirmDelete() {
    if (!deleteTargetPostId) {
      setDeleteSucceeded(false);
      setDeleteResultTitle("Erro ao apagar o post");
      setDeleteResultMessage("Post alvo não encontrado.");
      setDeleteResultDetails(null);
      setDeleteModalState("result");
      return;
    }

    if (!deletePassword.trim()) {
      setDeleteSucceeded(false);
      setDeleteResultTitle("Erro ao apagar o post");
      setDeleteResultMessage("Informe a senha para apagar o post.");
      setDeleteResultDetails(null);
      setDeleteModalState("result");
      return;
    }

    setDeleteModalState("submitting");

    try {
      const result = await deletePostService(deleteTargetPostId, deletePassword.trim());

      if (result.status >= 200 && result.status < 300) {
        setDeleteSucceeded(true);
        setDeleteResultTitle("Sucesso");
        setDeleteResultMessage("Post apagado com sucesso.");
        setDeleteResultDetails(null);
        setDeleteModalState("result");
        return;
      }

      setDeleteSucceeded(false);
      setDeleteResultTitle("Erro ao apagar o post");
      setDeleteResultMessage(`Falha ao apagar (status ${result.status}).`);
      const backendError = extractBackendError(result.data);
      setDeleteResultDetails(backendError ? humanizeErrorMessage(backendError) : null);
      setDeleteModalState("result");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro inesperado ao apagar.";
      setDeleteSucceeded(false);
      setDeleteResultTitle("Erro ao apagar o post");
      setDeleteResultMessage(message);
      setDeleteResultDetails(null);
      setDeleteModalState("result");
    }
  }

  function handleDeleteResultOk() {
    if (deleteSucceeded && deleteTargetPostId) {
      setDropdownPosts((prev) => prev.filter((post) => post.id !== deleteTargetPostId));
    }

    closeDeleteModal();
  }

  const visibleDropdownPosts = dropdownPosts.filter((post) => post.id !== editSession?.postId);
  const isActionsDisabled = deleteModalState === "submitting" || isPreparingEdit;

  return (
    <div className={`post-preview-panel${isDropdownOpen ? " is-dropdown-open" : ""}`}>
      <button
        type="button"
        className="post-preview-panel-cards cards_dropdown"
        aria-expanded={isDropdownOpen}
        onClick={handleToggleDropdown}
      >
        <span>Ver posts</span>
        <ChevronDown className={`post-preview-panel-dropdown-icon${isDropdownOpen ? " is-open" : ""}`} size={34} />
      </button>

      {isDropdownOpen ? (
        <div className="post-preview-panel-dropdown">
          {isLoadingCards ? (
            <div className="post-preview-panel-dropdown-message">carregando...</div>
          ) : null}

          {!isLoadingCards && cardsError ? (
            <div className="post-preview-panel-dropdown-message">{cardsError}</div>
          ) : null}

          {!isLoadingCards && !cardsError ? (
            <div className="post-preview-panel-dropdown-list">
              {visibleDropdownPosts.map((post) => (
                <PostDropdownItem
                  key={post.id}
                  id={post.id}
                  title={post.title}
                  bannerUrl={post.bannerUrl}
                  isActionsDisabled={isActionsDisabled}
                  onDelete={openDeleteModal}
                  onEdit={openEditConfirm}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {!isDropdownOpen ? (
        <div className="post-preview-panel-content post_preview">
          {previewMarkdown.trim() ? (
            <MarkdownRenderer markdown={previewMarkdown} className="post-preview-panel-markdown" />
          ) : (
            <div>Preview</div>
          )}
        </div>
      ) : null}

      {editTargetPost ? (
        <AppModal>
          <div className="post-preview-panel-modal" role="dialog" aria-modal="true">
            {!isPreparingEdit ? (
              <>
                <h3 className="post-preview-panel-modal-title">Confirmar edição</h3>
                <p className="post-preview-panel-modal-text">
                  Deseja editar esse post? Se houver alterações não salvas no formulário atual, elas serão descartadas.
                </p>
                {editErrorMessage ? (
                  <p className="post-preview-panel-modal-text">{editErrorMessage}</p>
                ) : null}
                <div className="post-preview-panel-modal-buttons">
                  <button className="post-dropdown-item-action-button" onClick={closeEditConfirm}>Não</button>
                  <button className="post-dropdown-item-action-button" onClick={() => void handleConfirmEdit()}>Sim</button>
                </div>
              </>
            ) : (
              <>
                <h3 className="post-preview-panel-modal-title">Preparando edição</h3>
                <p className="post-preview-panel-modal-text">carregando...</p>
              </>
            )}
          </div>
        </AppModal>
      ) : null}

      {deleteModalState !== "closed" ? (
        <AppModal>
          <div className="post-preview-panel-modal" role="dialog" aria-modal="true">
            {deleteModalState === "asking_password" ? (
              <>
                <h3 className="post-preview-panel-modal-title">Confirmar exclusão</h3>
                <p className="post-preview-panel-modal-text">Digite a senha para apagar o post.</p>
                <input
                  type="password"
                  className="post-preview-panel-modal-input"
                  value={deletePassword}
                  onChange={(event) => setDeletePassword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleConfirmDelete();
                    }
                  }}
                  autoFocus
                />
                <div className="post-preview-panel-modal-buttons">
                  <button className="post-dropdown-item-action-button" onClick={closeDeleteModal}>Cancelar</button>
                  <button className="post-dropdown-item-action-button" onClick={handleConfirmDelete}>Ok</button>
                </div>
              </>
            ) : null}

            {deleteModalState === "submitting" ? (
              <>
                <h3 className="post-preview-panel-modal-title">Apagando</h3>
                <p className="post-preview-panel-modal-text">carregando...</p>
              </>
            ) : null}

            {deleteModalState === "result" ? (
              <>
                <h3 className="post-preview-panel-modal-title">{deleteResultTitle || "Erro ao apagar o post"}</h3>
                {deleteResultMessage ? (
                  <p className="post-preview-panel-modal-text">{deleteResultMessage}</p>
                ) : null}
                {deleteResultDetails ? (
                  <p className="post-preview-panel-modal-text">{deleteResultDetails}</p>
                ) : null}
                <div className="post-preview-panel-modal-buttons">
                  <button className="post-dropdown-item-action-button" onClick={handleDeleteResultOk}>Ok</button>
                </div>
              </>
            ) : null}
          </div>
        </AppModal>
      ) : null}
    </div>
  );
}
