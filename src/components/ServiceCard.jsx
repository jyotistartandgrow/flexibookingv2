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
  return (
    <div className={className} onClick={onClick}>
      {decoration}
      <div className="fx-servicepicbox">
        {!imageLoaded && <div className="fx-image-loader" />}
        {product.svc_img ? (
          <img src={product.svc_img} alt={product.service_name} onLoad={onImageLoad} onError={onImageLoad} />
        ) : (
          <span className="fx-servicepic-fallback" aria-hidden="true">
            <ImageOff size={26} />
          </span>
        )}
        {showCategory && (
          <span className="fx-servicepiccontentbox">{product.category_name}</span>
        )}
        {imageControl}
      </div>
      <div className="fx-servicecontentbox">
        <h4>{product.service_name}</h4>
        <p>{description}</p>
        {children}
      </div>
    </div>
  );
}
