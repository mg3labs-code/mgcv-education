interface DayCompleteModalProps {
  day: number;
  dayName: string;
  dayBlurb: string;
  xp: number;
  nextDayName?: string;
  onContinue: () => void;
  onClose: () => void;
}

const DayCompleteModal = ({
  day,
  dayName,
  dayBlurb,
  xp,
  nextDayName,
  onContinue,
  onClose,
}: DayCompleteModalProps) => (
  <div className="ios-modal-overlay" role="dialog" aria-modal="true">
    <div className="ios-modal">
      <div className="ios-emoji-hero">🎉</div>
      <h2 style={{ fontSize: 26, marginBottom: 8, textAlign: "center" }}>Day {day} complete!</h2>
      <p style={{ textAlign: "center", fontWeight: 700, color: "var(--ios-muted)", marginBottom: 4 }}>
        {dayName}
      </p>
      <p style={{ textAlign: "center", color: "var(--ios-muted)", fontSize: 14, marginBottom: 16 }}>
        {dayBlurb}
      </p>

      <div className="ios-stat-pills" style={{ justifyContent: "center", marginBottom: 16 }}>
        <div className="ios-pill xp">⭐ {xp} XP</div>
        <div className="ios-pill streak">✅ Session saved</div>
      </div>

      {nextDayName ? (
        <div className="ios-cliff" style={{ marginBottom: 16 }}>🔓 Unlocked: {nextDayName}</div>
      ) : (
        <div className="ios-showoff" style={{ marginBottom: 16 }}>
          🏆 You finished the whole journey. Go perform it on someone.
        </div>
      )}

      {nextDayName && (
        <button type="button" className="ios-btn success" onClick={onContinue}>
          Continue to {nextDayName} →
        </button>
      )}
      <button type="button" className="ios-btn ghost" onClick={onClose}>
        Close
      </button>
    </div>
  </div>
);

export default DayCompleteModal;
