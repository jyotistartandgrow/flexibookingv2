// Shown by the single-service shortcodes when no valid data-service-id was
// set, instead of silently loading some other service.
export default function MissingServiceId() {
  return (
    <div className="fx-shortcode-error" role="alert">
      <i className="pi pi-exclamation-triangle" aria-hidden="true"></i>
      <div>
        <strong>Service not configured</strong>
        <p>
          This booking form needs a service ID. Add a valid{" "}
          <code>service_id</code> to the shortcode.
        </p>
      </div>
    </div>
  );
}
