import { ImageOff } from "lucide-react";

export default function ServiceCard({
  product,
  className = "fx-servicebox fx-bundle-content",
  onClick,
  showCategory = true,
  imageLoaded = true,
  onImageLoad,
  decoration,
  imageControl,
  description = product.svc_short_desc,
  children,
}) {
  // service_name comes back cut to 20 characters by the API; service_title is the full name.
  const fullName = product.service_title || product.service_name;
  return (
    <div className={className} onClick={onClick}>
      {decoration}
      <div className="fx-servicepicbox">
        {!imageLoaded && <div className="fx-image-loader" />}
        {product.svc_img ? (
          <img
            src={product.svc_img}
            alt={fullName}
            onLoad={onImageLoad}
            onError={onImageLoad}
          />
        ) : (
          <span className="fx-servicepic-fallback" aria-hidden="true">
            <ImageOff size={26} />
          </span>
        )}
        {showCategory && (
          <span className="fx-servicepiccontentbox">
            {product.category_name}
          </span>
        )}
        {imageControl}
      </div>
      <div className="fx-servicecontentbox">
        <h4 title={fullName}>{fullName}</h4>
        <p>{description}</p>
        {children}
      </div>
    </div>
  );
}
