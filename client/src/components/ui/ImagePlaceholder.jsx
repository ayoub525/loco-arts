export default function ImagePlaceholder({ className = '', aspectRatio = '3/4', text = '📷 Photo' }) {
  return (
    <div
      className={`bg-gray-100 flex items-center justify-center text-gray-400 text-sm ${className}`}
      style={{ aspectRatio }}
    >
      {/* PLACEHOLDER: Remplacez par votre image produit */}
      <span className="text-center px-4">{text}</span>
    </div>
  );
}
