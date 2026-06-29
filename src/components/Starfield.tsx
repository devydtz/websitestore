type StarfieldProps = {
  variant?: "default" | "admin";
};

export function Starfield({ variant = "default" }: StarfieldProps) {
  const isAdmin = variant === "admin";

  return (
    <div className={`starfield fixed inset-0 z-0 ${isAdmin ? "starfield-admin" : ""}`} aria-hidden="true">
      <div className="space-depth depth-one" />
      <div className="space-depth depth-two" />
      <div className="pixel-moon" />
      <div className="pixel-sparkle sparkle-main" />
      <div className="pixel-sparkle sparkle-left" />
      <div className="pixel-sparkle sparkle-right" />
      <div className="nebula-glow glow-one" />
      <div className="nebula-glow glow-two" />
      <div className="nebula-glow glow-three" />
      <div className="stars-layer" />
      <div className="stars-layer layer-2" />
      <div className="stars-layer layer-3" />
      {isAdmin && <div className="stars-layer layer-4" />}
      <div className="pixel-horizon horizon-far" />
      <div className="pixel-horizon horizon-near" />
      <div className="shooting-star" style={{ top: "8%", left: "-12%", animationDelay: "0s" }} />
      <div className="shooting-star" style={{ top: "22%", left: "-12%", animationDelay: "2.4s" }} />
      <div className="shooting-star" style={{ top: "45%", left: "-12%", animationDelay: "4.8s" }} />
      <div className="shooting-star" style={{ top: "65%", left: "-12%", animationDelay: "1.2s" }} />
      <div className="shooting-star" style={{ top: "80%", left: "-12%", animationDelay: "3.6s" }} />
      <div className="shooting-star meteor-soft" style={{ top: "32%", left: "-12%", animationDelay: "6.2s" }} />
      <div className="shooting-star meteor-soft meteor-slow" style={{ top: "58%", left: "-12%", animationDelay: "7.4s" }} />
      <div className="shooting-star meteor-small" style={{ top: "14%", left: "-12%", animationDelay: "8.8s" }} />
      <div className="shooting-star meteor-small meteor-slow" style={{ top: "72%", left: "-12%", animationDelay: "10.2s" }} />
      {isAdmin && (
        <>
          <div className="shooting-star meteor-bright" style={{ top: "14%", left: "-12%", animationDelay: "1.1s" }} />
          <div className="shooting-star meteor-bright meteor-slow" style={{ top: "38%", left: "-12%", animationDelay: "3.2s" }} />
          <div className="shooting-star meteor-bright meteor-wide" style={{ top: "72%", left: "-12%", animationDelay: "5.1s" }} />
          <div className="shooting-star meteor-bright meteor-fast" style={{ top: "6%", left: "-12%", animationDelay: "6.6s" }} />
          <div className="shooting-star meteor-bright meteor-fast meteor-wide" style={{ top: "28%", left: "-12%", animationDelay: "8.4s" }} />
          <div className="shooting-star meteor-bright meteor-slow" style={{ top: "52%", left: "-12%", animationDelay: "9.5s" }} />
          <div className="shooting-star meteor-bright meteor-wide" style={{ top: "86%", left: "-12%", animationDelay: "10.7s" }} />
          <div className="admin-orb orb-one" />
          <div className="admin-orb orb-two" />
        </>
      )}
    </div>
  );
}
