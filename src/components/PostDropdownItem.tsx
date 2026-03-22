import "../assets/css/PostDropdownItem.css";

type PostDropdownItemProps = {
  id: string;
  title: string;
  bannerUrl: string;
};

export default function PostDropdownItem({ id, title, bannerUrl }: PostDropdownItemProps) {
  return (
    <div className="post-dropdown-item" data-post-id={id}>
      <div className="post-dropdown-item-image-frame">
        {bannerUrl ? (
          <img className="post-dropdown-item-image" src={bannerUrl} alt={title} loading="lazy" />
        ) : null}
      </div>

      <span className="post-dropdown-item-title">{title}</span>

      <div className="post-dropdown-item-actions">
        <button type="button" className="post-dropdown-item-action-button">
          apagar
        </button>
        <button type="button" className="post-dropdown-item-action-button">
          editar
        </button>
      </div>
    </div>
  );
}
