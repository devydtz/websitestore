export function Starfield() {
  return (
    <div className="starfield fixed inset-0 z-0">
      <div className="stars-layer" />
      <div className="stars-layer layer-2" />
      <div className="stars-layer layer-3" />
      <div className="shooting-star" style={{ top: "8%", left: "-10%", animationDelay: "0s" }} />
      <div className="shooting-star" style={{ top: "22%", left: "-10%", animationDelay: "2.4s" }} />
      <div className="shooting-star" style={{ top: "45%", left: "-10%", animationDelay: "4.8s" }} />
      <div className="shooting-star" style={{ top: "65%", left: "-10%", animationDelay: "1.2s" }} />
      <div className="shooting-star" style={{ top: "80%", left: "-10%", animationDelay: "3.6s" }} />
    </div>
  );
}