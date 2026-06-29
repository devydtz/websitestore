type StarfieldProps = {
  variant?: "default" | "admin";
};

export function Starfield({ variant = "default" }: StarfieldProps) {
  const isAdmin = variant === "admin";

  return (
    <div className={`starfield fixed inset-0 z-0 ${isAdmin ? "starfield-admin" : ""}`}>
      <div className="nebula-glow glow-one" />
      <div className="nebula-glow glow-two" />
      <div className="nebula-glow glow-three" />
      <div className="stars-layer" />
      <div className="stars-layer layer-2" />
      <div className="stars-layer layer-3" />
      {isAdmin && <div className="stars-layer layer-4" />}
      <div className="shooting-star" style={{ top: "8%", left: "-10%", animationDelay: "0s" }} />
      <div className="shooting-star" style={{ top: "22%", left: "-10%", animationDelay: "2.4s" }} />
      <div className="shooting-star" style={{ top: "45%", left: "-10%", animationDelay: "4.8s" }} />
      <div className="shooting-star" style={{ top: "65%", left: "-10%", animationDelay: "1.2s" }} />
      <div className="shooting-star" style={{ top: "80%", left: "-10%", animationDelay: "3.6s" }} />
      {isAdmin && (
        <>
          <div className="shooting-star meteor-bright" style={{ top: "14%", left: "-12%", animationDelay: "1.1s" }} />
          <div className="shooting-star meteor-bright meteor-slow" style={{ top: "38%", left: "-12%", animationDelay: "3.2s" }} />
          <div className="shooting-star meteor-bright meteor-wide" style={{ top: "72%", left: "-12%", animationDelay: "5.1s" }} />
          <div className="admin-orb orb-one" />
          <div className="admin-orb orb-two" />
        </>
      )}
    </div>
  );
}
