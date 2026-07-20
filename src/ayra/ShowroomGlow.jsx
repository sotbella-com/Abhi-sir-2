/**
 * AYRA Showroom ambient presence — the "conscious" glow flashing in every corner
 * of the screen while showroom mode is active. Non-interactive; drives no layout.
 * `state` (idle|listening|thinking|speaking) brightens the glow when AYRA speaks.
 */
import "./showroomGlow.css";

export default function ShowroomGlow({ state = "idle" }) {
  return (
    <div className="ayra-glow" data-state={state} aria-hidden="true">
      <span className="ayra-glow-corner tl" />
      <span className="ayra-glow-corner tr" />
      <span className="ayra-glow-corner br" />
      <span className="ayra-glow-corner bl" />
      <span className="ayra-glow-edge" />
    </div>
  );
}
