import "../assets/css/PostDropdownItem.css";

type PostDropdownItemProps = {
  id: string;
  title: string;
  bannerUrl: string;
  isActionsDisabled?: boolean;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
};

export default function PostDropdownItem({
  id,
  title,
  bannerUrl,
  isActionsDisabled = false,
  onDelete,
  onEdit
}: PostDropdownItemProps) {
  return (
    <div className="post-dropdown-item" data-post-id={id}>
      <div className="post-dropdown-item-image-frame">
        {bannerUrl ? (
          <img className="post-dropdown-item-image" src={bannerUrl} alt={title} loading="lazy" />
        ) : null}
      </div>

      <span className="post-dropdown-item-title">{title}</span>

      <div className="post-dropdown-item-actions">
        <button
          type="button"
          className="post-dropdown-item-action-button"
          onClick={() => onDelete(id)}
          disabled={isActionsDisabled}
        >
          apagar
        </button>
        <button
          type="button"
          className="post-dropdown-item-action-button"
          disabled={isActionsDisabled}
          onClick={() => onEdit(id)}
        >
          editar
        </button>
      </div>
    </div>
  );
}
