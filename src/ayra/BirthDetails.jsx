/**
 * AYRA Cosmic-intelligence capture — a quiet, luxe card that appears when AYRA
 * offers to "read exactly what you'll love." She offers it by VOICE; this panel
 * captures the birth details precisely (voice mishears dates/cities). Two tiers:
 *   birthday → date only          (a light refine)
 *   full     → date + time + place (the full archetype read)
 * On submit it hands {dob,tob,place} to AYRA's Satya read (de-astrologised at the
 * broker) — the shopper never sees or hears anything astrological.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import "./birthDetails.css";

export default function BirthDetails({ tier = "full", onSubmit, onClose }) {
  const full = tier === "full";
  const [date, setDate] = useState("");   // yyyy-mm-dd
  const [time, setTime] = useState("");   // hh:mm
  const [place, setPlace] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!date || busy) return;
    setBusy(true);
    try {
      await onSubmit?.({ dob: date, tob: full ? time : "", place: full ? place.trim() : "" });
    } finally { setBusy(false); }
  };

  return (
    <motion.div className="ayra-birth-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <motion.div className="ayra-birth" onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
        <button className="ayra-birth-x" onClick={onClose} aria-label="Close"><X size={16} /></button>

        <div className="ayra-birth-eyebrow">AYRA · reads what's truly you</div>
        <h3 className="ayra-birth-title">{full ? "Let me read you completely" : "When's your birthday?"}</h3>
        <p className="ayra-birth-sub">
          {full
            ? "Your date, time and place of birth — so I style you accurately, without you saying a word."
            : "Just your date — so everything I pull feels made for you."}
        </p>

        <label className="ayra-birth-field">
          <span>Date of birth</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>

        {full && (
          <div className="ayra-birth-row">
            <label className="ayra-birth-field">
              <span>Time of birth <em>(if you know it)</em></span>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </label>
            <label className="ayra-birth-field">
              <span>Place of birth</span>
              <input type="text" placeholder="City" value={place} onChange={(e) => setPlace(e.target.value)} />
            </label>
          </div>
        )}

        <button className="ayra-birth-go" onClick={submit} disabled={!date || busy}>
          {busy ? "Reading you…" : "Read me"}
        </button>
        <button className="ayra-birth-skip" onClick={onClose}>Maybe later — just style me</button>
      </motion.div>
    </motion.div>
  );
}
