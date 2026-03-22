import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import loadCardsService from "../services/loadCards";
import PostDropdownItem from "./PostDropdownItem";
import "../assets/css/PostPreviewPanel.css";

type DropdownPost = {
  id: string;
  title: string;
  bannerUrl: string;
};

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractRequestErrorMessage(data: unknown, status: number): string {
  if (isObjectRecord(data) && typeof data.error === "string" && data.error) {
    return data.error;
  }

  return `Falha ao carregar cards (status ${status}).`;
}

function mapResponseDataToDropdownPosts(data: unknown): DropdownPost[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.flatMap((item) => {
    if (!isObjectRecord(item)) {
      return [];
    }

    const id = item.id;
    const title = item.title;
    const bannerUrl = item.banner_url;

    if (typeof id !== "string" || typeof title !== "string" || typeof bannerUrl !== "string") {
      return [];
    }

    return [{
      id,
      title,
      bannerUrl
    }];
  });
}

export default function PostPreviewPanel() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [hasLoadedCards, setHasLoadedCards] = useState(false);
  const [cardsError, setCardsError] = useState<string | null>(null);
  const [dropdownPosts, setDropdownPosts] = useState<DropdownPost[]>([]);

  function handleToggleDropdown() {
    setIsDropdownOpen((prev) => !prev);
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

        if (result.status !== 200 || !isObjectRecord(result.data)) {
          setCardsError(extractRequestErrorMessage(result.data, result.status));
          return;
        }

        const mappedPosts = mapResponseDataToDropdownPosts(result.data.data);

        if (mappedPosts.length === 0 && Array.isArray(result.data.data) && result.data.data.length > 0) {
          setCardsError("Resposta invalida ao carregar cards.");
          return;
        }

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

  return (
    <div className="post-preview-panel">
      <button
        type="button"
        className="post-preview-panel-cards cards_dropdown"
        aria-expanded={isDropdownOpen}
        onClick={handleToggleDropdown}
      >
        <span>Novo post</span>
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
              {dropdownPosts.map((post) => (
                <PostDropdownItem
                  key={post.id}
                  id={post.id}
                  title={post.title}
                  bannerUrl={post.bannerUrl}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="post-preview-panel-content post_preview">
        <div>Preview</div>
      </div>
    </div>
  );
}
