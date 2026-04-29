export default function Loader({ message = 'Analyzing IPO data...' }) {
  return (
    <div className="loader-overlay">
      <div className="loader-spinner" />
      <p className="loader-text">{message}</p>
    </div>
  );
}
