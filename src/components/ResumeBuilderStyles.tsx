export default function ResumeBuilderStyles() {
  return (
    <style jsx global>{`
.job-card-action-button {
  min-height: 2.5rem;
  padding: 0.65rem 1rem;
  font-size: 0.92rem;
}

.resume-builder-page {
  display: grid;
  gap: 0.85rem;
}

.resume-builder-hero {
  position: relative;
  overflow: hidden;
  border-color: rgba(45, 212, 191, 0.28);
  background:
    radial-gradient(circle at top right, rgba(45, 212, 191, 0.14), transparent 34%),
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.985) 0%,
      rgba(247, 250, 252, 0.97) 58%,
      rgba(240, 253, 250, 0.95) 100%
    );
  box-shadow:
    0 22px 46px -34px rgba(15, 23, 42, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.92);
}

.resume-builder-hero::after {
  content: "";
  position: absolute;
  inset: auto auto -4rem -3rem;
  width: 9rem;
  height: 9rem;
  border-radius: 9999px;
  background: rgba(45, 212, 191, 0.14);
  filter: blur(36px);
  pointer-events: none;
}

.resume-builder-hero-grid {
  position: relative;
  display: grid;
  gap: 0.75rem;
}

.resume-builder-hero-copy {
  max-width: 38rem;
}

.resume-builder-hero-title {
  margin-top: 0.5rem;
  font-family: var(--font-serif);
  font-size: clamp(1.72rem, 2.55vw, 2.3rem);
  line-height: 1.02;
  letter-spacing: -0.05em;
  color: #0f172a;
  text-wrap: balance;
}

.resume-builder-hero-text {
  margin-top: 0.52rem;
  max-width: 32rem;
  color: #526171;
  font-size: 0.92rem;
  line-height: 1.58;
}

.resume-builder-hero-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-top: 1rem;
}

.resume-builder-hero-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-self: start;
}

.resume-builder-shell {
  display: grid;
  gap: 1rem;
  align-items: start;
}

.resume-builder-editor {
  min-width: 0;
  display: grid;
  gap: 1rem;
}

.resume-builder-preview-column {
  min-width: 0;
  overflow-anchor: none;
}

.resume-builder-sticky {
  display: grid;
  gap: 1rem;
}

.resume-builder-hero-compact {
  padding-block: 0.82rem;
}

.resume-builder-hero-grid-compact {
  grid-template-columns: minmax(0, 1fr);
  align-items: center;
}

.resume-builder-hero-button {
  justify-self: start;
  width: fit-content;
  min-height: 2.5rem;
  padding: 0.62rem 1rem;
  font-size: 0.9rem;
  white-space: nowrap;
}

.resume-accordion-list {
  display: grid;
  gap: 0.8rem;
}

.resume-accordion-section {
  overflow: hidden;
  border-radius: 1.35rem;
}

.resume-accordion-section-open {
  border-color: rgba(45, 212, 191, 0.32);
  box-shadow:
    0 20px 34px -28px rgba(15, 23, 42, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.88);
}

.resume-accordion-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.1rem;
  background: transparent;
  text-align: left;
}

.resume-accordion-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.55rem;
  min-width: 0;
}

.resume-accordion-title {
  color: #0f172a;
  font-size: 0.98rem;
  font-weight: 700;
  line-height: 1.2;
}

.resume-accordion-optional {
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  border: 1px solid rgba(203, 213, 225, 0.88);
  padding: 0.24rem 0.48rem;
  color: #64748b;
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.resume-accordion-icon {
  flex: 0 0 auto;
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: 1px solid rgba(226, 232, 240, 0.92);
  background: rgba(255, 255, 255, 0.76);
  color: #0f766e;
  font-size: 1.12rem;
  font-weight: 700;
  line-height: 1;
}

.resume-accordion-body {
  padding: 0 1.1rem 1.1rem;
  border-top: 1px solid rgba(226, 232, 240, 0.82);
}

.resume-section-actions {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 0.8rem;
}

.resume-template-grid-compact {
  margin-bottom: 0;
}

.resume-template-switch-wrap {
  display: grid;
  gap: 0.72rem;
}

.resume-template-panel {
  display: grid;
  gap: 0.72rem;
  padding: 0.85rem 0.9rem 0.9rem;
  border: 1px solid rgba(186, 230, 253, 0.62);
  border-radius: 1.05rem;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.88) 0%, rgba(255, 255, 255, 0.94) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.94),
    0 12px 22px -28px rgba(15, 23, 42, 0.18);
}

.resume-template-panel-head {
  display: grid;
  gap: 0.24rem;
}

.resume-template-panel-title {
  margin: 0.16rem 0 0;
  color: #0f172a;
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.3;
}

.resume-template-panel-copy {
  margin: 0;
  color: #526171;
  font-size: 0.8rem;
  line-height: 1.5;
}

.resume-template-switch-head {
  display: grid;
  gap: 0.55rem;
}

.resume-template-switch-title {
  margin-top: 0.35rem;
}

.resume-template-switch-note {
  margin: 0;
  max-width: 42rem;
}

.resume-template-switch-label {
  margin: 0;
  color: #334155;
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.resume-template-switch {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
}

.resume-template-switch-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-width: 0;
  min-height: 2.15rem;
  padding: 0.48rem 0.88rem;
  border: 1px solid rgba(191, 219, 254, 0.82);
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.82);
  color: #475569;
  font-size: 0.8rem;
  font-weight: 700;
  line-height: 1;
  transition:
    border-color 180ms ease,
    background 180ms ease,
    color 180ms ease,
    transform 180ms ease;
}

.resume-template-switch-button:hover {
  transform: translateY(-1px);
  border-color: rgba(45, 212, 191, 0.34);
  background: rgba(240, 253, 250, 0.82);
  color: #0f172a;
}

.resume-template-switch-button-active {
  border-color: rgba(20, 184, 166, 0.52);
  background: rgba(240, 253, 250, 0.98);
  color: #0f766e;
  box-shadow: 0 12px 20px -20px rgba(20, 184, 166, 0.24);
}

.resume-optional-toggle-row {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 0.85rem;
}

.resume-optional-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  color: #526171;
  font-size: 0.82rem;
  font-weight: 600;
}

.resume-optional-toggle input {
  width: 1rem;
  height: 1rem;
  accent-color: #14b8a6;
}

.resume-help-note {
  margin: 0 0 0.9rem;
  border: 1px dashed rgba(45, 212, 191, 0.3);
  border-radius: 1rem;
  background: rgba(240, 253, 250, 0.7);
  padding: 0.8rem 0.9rem;
  color: #0f766e;
  font-size: 0.84rem;
  line-height: 1.55;
}

.resume-builder-footer-actions {
  border-radius: 1.35rem;
  padding: 1rem;
  overflow-anchor: none;
}

.resume-builder-footer-actions-row {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: flex-start;
}

.resume-keyword-panel {
  border-radius: 1.35rem;
  padding: 1rem;
}

.resume-keyword-panel-head {
  margin-bottom: 0.2rem;
}

.resume-preview-modal {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 1rem;
  height: 100dvh;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: rgba(2, 6, 23, 0.76);
  backdrop-filter: blur(10px);
}

.resume-preview-modal-shell {
  width: min(100%, 64rem);
  min-height: 0;
  margin: auto 0;
  display: grid;
  gap: 0.85rem;
}

.resume-preview-modal-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.resume-preview-modal-close {
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 9999px;
  background: rgba(15, 23, 42, 0.84);
  padding: 0.62rem 0.95rem;
  color: #e2e8f0;
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1;
}

.resume-preview-modal-card {
  overflow: visible;
  -webkit-overflow-scrolling: touch;
}

.resume-builder-panel {
  position: relative;
  overflow: hidden;
}

.resume-builder-panel-head {
  margin-bottom: 0.8rem;
}

.resume-builder-panel-title {
  margin: 0;
  font-size: 1.02rem;
  font-weight: 700;
  line-height: 1.2;
  color: #0f172a;
}

.resume-builder-panel-copy {
  margin-top: 0.42rem;
  color: #526171;
  font-size: 0.9rem;
  line-height: 1.65;
}

.resume-builder-form-grid {
  display: grid;
  gap: 0.9rem;
}

.resume-builder-field {
  display: grid;
  gap: 0.42rem;
}

.resume-builder-label {
  color: #334155;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.resume-builder-hint {
  color: #64748b;
  font-size: 0.78rem;
  line-height: 1.55;
}

.resume-builder-control {
  min-height: 2.8rem;
  font-size: 0.94rem;
}

.resume-builder-textarea {
  min-height: 7.4rem;
  resize: vertical;
}

.resume-summary-textarea {
  min-height: 11rem;
}

.resume-builder-textarea-compact {
  min-height: 5.35rem;
}

.resume-builder-textarea-lg {
  min-height: 9rem;
}

.resume-template-grid {
  display: grid;
  gap: 0.8rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.resume-template-button {
  position: relative;
  display: grid;
  align-content: start;
  gap: 0.7rem;
  min-height: 8rem;
  padding: 0.9rem;
  border: 1px solid rgba(203, 213, 225, 0.92);
  border-radius: 1.05rem;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.96) 0%,
    rgba(248, 250, 252, 0.92) 100%
  );
  cursor: pointer;
  text-align: left;
  box-shadow:
    0 18px 26px -30px rgba(15, 23, 42, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.88);
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease,
    background 180ms ease,
    color 180ms ease;
}

.resume-template-button:focus-visible {
  outline: 2px solid rgba(20, 184, 166, 0.28);
  outline-offset: 3px;
}

.resume-template-button:hover {
  transform: translateY(-1px);
  border-color: rgba(45, 212, 191, 0.36);
  box-shadow:
    0 22px 30px -28px rgba(15, 23, 42, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.resume-template-button-active {
  border-color: rgba(20, 184, 166, 0.5);
  background:
    linear-gradient(180deg, rgba(240, 253, 250, 0.96) 0%, rgba(236, 253, 245, 0.92) 100%);
  box-shadow:
    0 20px 30px -28px rgba(20, 184, 166, 0.26),
    inset 0 1px 0 rgba(255, 255, 255, 0.92);
}

.resume-template-button-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 0.7rem;
}

.resume-template-tag {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  border-radius: 9999px;
  border: 1px solid rgba(45, 212, 191, 0.24);
  padding: 0.28rem 0.55rem;
  color: #0f766e;
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.resume-template-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 3.2rem;
  padding: 0.32rem 0.58rem;
  border: 1px solid rgba(203, 213, 225, 0.94);
  border-radius: 9999px;
  background: rgba(248, 250, 252, 0.94);
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.resume-template-status-active {
  border-color: rgba(20, 184, 166, 0.26);
  background: rgba(236, 253, 245, 0.96);
  color: #0f766e;
}

.resume-template-button-body {
  display: grid;
  gap: 0.38rem;
}

.resume-template-title {
  color: #0f172a;
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.28;
}

.resume-template-copy {
  color: #526171;
  font-size: 0.8rem;
  line-height: 1.5;
}

.resume-template-meta {
  margin-top: auto;
  padding-top: 0.15rem;
  color: #334155;
  font-size: 0.79rem;
  font-weight: 600;
  line-height: 1.45;
}

.resume-template-button-active .resume-template-meta {
  color: #0f766e;
}

.resume-template-button-active .resume-template-tag {
  border-color: rgba(20, 184, 166, 0.28);
  background: rgba(240, 253, 250, 0.96);
}

.resume-entry-card {
  border: 1px solid rgba(203, 213, 225, 0.82);
  border-radius: 1.2rem;
  background: rgba(248, 250, 252, 0.72);
  padding: 0.95rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82);
}

.resume-entry-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  margin-bottom: 0.8rem;
}

.resume-entry-title {
  margin: 0;
  color: #0f172a;
  font-size: 0.94rem;
  font-weight: 700;
}

.resume-entry-remove {
  border: 1px solid rgba(226, 232, 240, 0.96);
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.82);
  padding: 0.38rem 0.75rem;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1;
  transition:
    color 180ms ease,
    border-color 180ms ease,
    background 180ms ease;
}

.resume-entry-remove:hover {
  border-color: rgba(248, 113, 113, 0.44);
  background: rgba(254, 242, 242, 0.94);
  color: #b91c1c;
}

.resume-builder-score-panel {
  padding-bottom: 1.15rem;
}

.resume-score-meter {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.95rem;
  padding: 1rem;
  border-radius: 1.25rem;
  border: 1px solid rgba(203, 213, 225, 0.82);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(248, 250, 252, 0.82) 100%
  );
}

.resume-score-meter-strong {
  border-color: rgba(16, 185, 129, 0.28);
  background: linear-gradient(180deg, rgba(236, 253, 245, 0.95), rgba(240, 253, 250, 0.88));
}

.resume-score-meter-good {
  border-color: rgba(45, 212, 191, 0.26);
  background: linear-gradient(180deg, rgba(240, 253, 250, 0.95), rgba(241, 245, 249, 0.88));
}

.resume-score-meter-average {
  border-color: rgba(251, 191, 36, 0.3);
  background: linear-gradient(180deg, rgba(255, 251, 235, 0.95), rgba(248, 250, 252, 0.88));
}

.resume-score-meter-needs-work {
  border-color: rgba(248, 113, 113, 0.28);
  background: linear-gradient(180deg, rgba(254, 242, 242, 0.95), rgba(248, 250, 252, 0.88));
}

.resume-score-value {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 4.3rem;
  height: 4.3rem;
  border-radius: 1.25rem;
  background: #0f172a;
  color: #f8fafc;
  font-size: 1.4rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.05em;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.resume-score-copy {
  min-width: 0;
}

.resume-score-label {
  margin: 0;
  color: #0f172a;
  font-size: 0.76rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.resume-score-subtitle {
  margin: 0.35rem 0 0;
  color: #526171;
  font-size: 0.89rem;
  line-height: 1.55;
}

.resume-checklist {
  display: grid;
  gap: 0.58rem;
  margin-top: 1rem;
}

.resume-checklist-item {
  display: flex;
  align-items: start;
  gap: 0.65rem;
  padding: 0.72rem 0.8rem;
  border: 1px solid rgba(226, 232, 240, 0.88);
  border-radius: 1rem;
  background: rgba(248, 250, 252, 0.72);
  color: #526171;
  font-size: 0.84rem;
  line-height: 1.55;
}

.resume-checklist-item-pass {
  border-color: rgba(45, 212, 191, 0.26);
  background: rgba(240, 253, 250, 0.74);
  color: #0f172a;
}

.resume-checklist-dot {
  flex: 0 0 auto;
  width: 0.65rem;
  height: 0.65rem;
  margin-top: 0.36rem;
  border-radius: 9999px;
  background: #f59e0b;
  box-shadow: 0 0 0 0.2rem rgba(245, 158, 11, 0.12);
}

.resume-checklist-item-pass .resume-checklist-dot {
  background: #14b8a6;
  box-shadow: 0 0 0 0.2rem rgba(20, 184, 166, 0.12);
}

.resume-keyword-grid {
  display: grid;
  gap: 0.9rem;
  margin-top: 1rem;
}

.resume-keyword-title {
  margin: 0 0 0.45rem;
  color: #334155;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.resume-keyword-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.resume-keyword-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  padding: 0.38rem 0.68rem;
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1;
}

.resume-keyword-chip-match {
  border: 1px solid rgba(45, 212, 191, 0.28);
  background: rgba(240, 253, 250, 0.92);
  color: #0f766e;
}

.resume-keyword-chip-miss {
  border: 1px solid rgba(251, 191, 36, 0.3);
  background: rgba(255, 251, 235, 0.92);
  color: #b45309;
}

.resume-keyword-empty {
  color: #64748b;
  font-size: 0.84rem;
  line-height: 1.6;
}

.resume-preview-card {
  overflow: hidden;
  border: 1px solid rgba(203, 213, 225, 0.82);
  border-radius: 1.5rem;
  background: linear-gradient(
    180deg,
    rgba(15, 23, 42, 0.98) 0%,
    rgba(17, 24, 39, 0.98) 100%
  );
  box-shadow:
    0 24px 42px -34px rgba(15, 23, 42, 0.26),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.resume-print-root {
  display: none;
}

.resume-preview-classic {
  border-color: rgba(51, 65, 85, 0.82);
}

.resume-preview-modern {
  border-color: rgba(45, 212, 191, 0.22);
}

.resume-preview-focus {
  border-color: rgba(251, 191, 36, 0.18);
}

.resume-preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
}

.resume-preview-toolbar-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  border: 1px solid rgba(45, 212, 191, 0.26);
  background: rgba(15, 23, 42, 0.52);
  padding: 0.3rem 0.62rem;
  color: #99f6e4;
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.resume-preview-toolbar-note {
  color: #94a3b8;
  font-size: 0.8rem;
  font-weight: 600;
}

.resume-preview-empty-hero {
  display: grid;
  gap: 0.2rem;
}

.resume-preview-empty-title {
  margin: 0;
  color: #0f172a;
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.15;
}

.resume-preview-empty-copy {
  margin: 0;
  color: #64748b;
  font-size: 0.82rem;
  line-height: 1.5;
}

.resume-preview-brandline {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.45rem;
  margin-bottom: 0.8rem;
  color: #64748b;
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.resume-preview-brandline-label {
  opacity: 0.86;
}

.resume-preview-brandline-url {
  color: #0f766e;
}

.resume-preview-brandline-structured {
  justify-content: space-between;
  margin-bottom: 0.72rem;
  padding-bottom: 0.45rem;
  border-bottom: 1px solid rgba(203, 213, 225, 0.88);
}

.resume-preview-sheet {
  margin: 1rem;
  border-radius: 1.2rem;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  padding: 1.25rem;
  color: #0f172a;
  box-shadow:
    0 18px 32px -28px rgba(15, 23, 42, 0.22),
    0 2px 8px -6px rgba(15, 23, 42, 0.12);
}

.resume-preview-modern .resume-preview-sheet {
  border-top: 3px solid #14b8a6;
}

.resume-preview-focus .resume-preview-sheet {
  border-top: 3px solid #0f766e;
}

.resume-preview-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.8rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(203, 213, 225, 0.88);
}

.resume-preview-name {
  margin: 0;
  font-size: 1.8rem;
  line-height: 0.98;
  font-weight: 800;
  letter-spacing: -0.05em;
}

.resume-preview-headline {
  margin: 0.3rem 0 0;
  color: #0f766e;
  font-size: 0.98rem;
  font-weight: 700;
  line-height: 1.35;
}

.resume-preview-contact {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem 0.75rem;
  width: 100%;
  color: #526171;
  font-size: 0.82rem;
  line-height: 1.5;
}

.resume-preview-contact span {
  white-space: nowrap;
}

.resume-preview-contact-placeholder {
  color: #94a3b8;
}

.resume-preview-header-structured {
  align-items: center;
  text-align: center;
  padding-bottom: 0.8rem;
}

.resume-preview-header-structured .resume-preview-contact {
  justify-content: center;
}

.resume-preview-header-structured .resume-preview-contact span:not(:last-child)::after {
  content: "|";
  margin-left: 0.7rem;
  color: #94a3b8;
}

.resume-preview-body {
  display: grid;
  gap: 0.9rem;
  margin-top: 1rem;
}

.resume-preview-empty-body {
  border: 1px dashed rgba(203, 213, 225, 0.96);
  border-radius: 1rem;
  padding: 0.9rem 1rem;
  color: #64748b;
  font-size: 0.84rem;
  line-height: 1.55;
  text-align: center;
  background: rgba(248, 250, 252, 0.74);
}

.resume-preview-body-structured {
  gap: 0.78rem;
  margin-top: 0.82rem;
}

.resume-preview-section {
  display: grid;
  gap: 0.55rem;
}

.resume-preview-section-title {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin: 0;
  color: #0f172a;
  font-size: 0.76rem;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.resume-preview-section-title::after {
  content: "";
  flex: 1 1 auto;
  height: 1px;
  background: rgba(203, 213, 225, 0.92);
}

.resume-preview-copy {
  margin: 0;
  color: #334155;
  font-size: 0.88rem;
  line-height: 1.7;
}

.resume-preview-copy-structured {
  font-size: 0.78rem;
  line-height: 1.55;
}

.resume-preview-stack {
  display: grid;
  gap: 0.72rem;
}

.resume-preview-stack-structured {
  gap: 0.55rem;
}

.resume-preview-entry {
  display: grid;
  gap: 0.45rem;
}

.resume-preview-entry-structured {
  border: 1px solid rgba(203, 213, 225, 0.92);
  background: #ffffff;
  padding: 0.42rem 0.52rem 0.5rem;
}

.resume-preview-entry-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 0.75rem;
}

.resume-preview-entry-structured .resume-preview-entry-head {
  padding-bottom: 0.2rem;
  border-bottom: 1px solid rgba(203, 213, 225, 0.88);
}

.resume-preview-entry-title {
  margin: 0;
  color: #0f172a;
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.35;
}

.resume-preview-entry-subtitle {
  margin: 0.18rem 0 0;
  color: #526171;
  font-size: 0.81rem;
  line-height: 1.55;
}

.resume-preview-entry-meta {
  flex: 0 0 auto;
  color: #64748b;
  font-size: 0.79rem;
  font-weight: 600;
  line-height: 1.4;
  text-align: right;
}

.resume-preview-list {
  margin: 0;
  padding-left: 1rem;
  color: #334155;
  font-size: 0.84rem;
  line-height: 1.65;
}

.resume-preview-list li + li {
  margin-top: 0.24rem;
}

.resume-preview-structured-table {
  border: 1px solid rgba(203, 213, 225, 0.92);
  background: #ffffff;
}

.resume-preview-structured-row {
  display: grid;
  grid-template-columns: minmax(4.2rem, 0.22fr) minmax(0, 1fr);
  gap: 0.6rem;
  padding: 0.42rem 0.52rem;
}

.resume-preview-structured-label {
  color: #334155;
  font-size: 0.76rem;
  font-weight: 700;
  line-height: 1.35;
}

.resume-preview-structured-value {
  color: #0f172a;
  font-size: 0.78rem;
  line-height: 1.55;
}

.resume-preview-skill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.resume-preview-skill-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  background: rgba(15, 118, 110, 0.08);
  padding: 0.34rem 0.6rem;
  color: #0f766e;
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1;
}

.resume-preview-skill-pill-classic {
  display: inline;
  border-radius: 0;
  background: none;
  padding: 0;
  color: #334155;
  font-size: 0.82rem;
  font-weight: 500;
  line-height: 1.7;
}

.resume-preview-skill-pill-classic:not(:last-child)::after {
  content: " • ";
  color: #64748b;
}

.resume-preview-classic .resume-preview-sheet {
  border: 1px solid rgba(226, 232, 240, 0.94);
}

.resume-preview-classic .resume-preview-name {
  font-size: 1.72rem;
  letter-spacing: -0.035em;
}

.resume-preview-classic .resume-preview-headline {
  margin-top: 0.22rem;
  color: #334155;
  font-size: 0.92rem;
}

.resume-preview-classic .resume-preview-contact {
  gap: 0.2rem 0.62rem;
  font-size: 0.78rem;
}

.resume-preview-classic .resume-preview-contact span:not(:last-child)::after {
  content: "|";
  margin-left: 0.62rem;
  color: #94a3b8;
}

.resume-preview-classic .resume-preview-body {
  gap: 0.8rem;
}

.resume-preview-classic .resume-preview-section {
  gap: 0.45rem;
}

.resume-preview-classic .resume-preview-entry {
  gap: 0.36rem;
  padding-bottom: 0.58rem;
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
}

.resume-preview-classic .resume-preview-entry:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.resume-preview-classic .resume-preview-section-skills .resume-preview-skill-row,
.resume-preview-classic .resume-preview-section-hobbies .resume-preview-skill-row {
  display: block;
}

.resume-preview-modern .resume-preview-sheet {
  border-right: 1px solid rgba(226, 232, 240, 0.94);
  border-bottom: 1px solid rgba(226, 232, 240, 0.94);
  border-left: 1px solid rgba(226, 232, 240, 0.94);
}

.resume-preview-modern .resume-preview-section-title::after {
  background: linear-gradient(90deg, rgba(20, 184, 166, 0.22), rgba(203, 213, 225, 0.9));
}

.resume-preview-modern .resume-preview-skill-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.45rem 0.55rem;
}

.resume-preview-modern .resume-preview-skill-pill {
  justify-content: flex-start;
  border: 1px solid rgba(20, 184, 166, 0.18);
  border-radius: 0.72rem;
  background: rgba(240, 253, 250, 0.82);
  padding: 0.45rem 0.58rem;
  color: #0f172a;
  font-size: 0.76rem;
}

.resume-preview-modern .resume-preview-entry {
  padding: 0.72rem 0.78rem;
  border: 1px solid rgba(226, 232, 240, 0.94);
  border-radius: 0.95rem;
  background: rgba(255, 255, 255, 0.9);
}

.resume-preview-modern .resume-preview-entry-title {
  font-size: 0.9rem;
}

.resume-preview-focus .resume-preview-sheet {
  border-right: 1px solid rgba(226, 232, 240, 0.94);
  border-bottom: 1px solid rgba(226, 232, 240, 0.94);
  border-left: 1px solid rgba(226, 232, 240, 0.94);
}

.resume-preview-focus .resume-preview-section-title::after {
  background: linear-gradient(90deg, rgba(15, 118, 110, 0.24), rgba(203, 213, 225, 0.9));
}

.resume-preview-focus .resume-preview-section-projects,
.resume-preview-focus .resume-preview-section-skills {
  padding: 0.82rem 0.92rem;
  border: 1px solid rgba(15, 118, 110, 0.14);
  border-radius: 1rem;
  background: linear-gradient(180deg, rgba(240, 253, 250, 0.92) 0%, rgba(255, 255, 255, 0.98) 100%);
}

.resume-preview-focus .resume-preview-section-projects .resume-preview-section-title,
.resume-preview-focus .resume-preview-section-skills .resume-preview-section-title {
  color: #0f766e;
}

.resume-preview-focus .resume-preview-skill-row {
  gap: 0.42rem;
}

.resume-preview-focus .resume-preview-skill-pill {
  border: 1px solid rgba(15, 118, 110, 0.14);
  border-radius: 0.72rem;
  background: rgba(255, 255, 255, 0.92);
  color: #0f766e;
}

.resume-preview-focus .resume-preview-section-projects .resume-preview-entry {
  gap: 0.36rem;
  padding-bottom: 0.62rem;
  border-bottom: 1px solid rgba(203, 213, 225, 0.82);
}

.resume-preview-focus .resume-preview-section-projects .resume-preview-entry:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.resume-preview-focus .resume-preview-section-education .resume-preview-entry,
.resume-preview-focus .resume-preview-section-experience .resume-preview-entry,
.resume-preview-focus .resume-preview-section-certifications .resume-preview-entry {
  padding-left: 0.75rem;
  border-left: 2px solid rgba(15, 118, 110, 0.18);
}

.resume-preview-structured .resume-preview-sheet {
  border-radius: 0.35rem;
  background: #ffffff;
}

.resume-preview-structured .resume-preview-name {
  color: #5b8e24;
  font-size: 1.72rem;
  text-transform: uppercase;
}

.resume-preview-structured .resume-preview-headline {
  margin-top: 0.22rem;
  color: #0f172a;
  font-size: 0.94rem;
  font-weight: 700;
}

.resume-preview-structured .resume-preview-contact {
  color: #334155;
  font-size: 0.76rem;
  line-height: 1.45;
}

.resume-preview-structured .resume-preview-section-title {
  display: block;
  color: #5b8e24;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
}

.resume-preview-structured .resume-preview-section-title::after {
  display: none;
}

.resume-preview-structured .resume-preview-entry-title {
  font-size: 0.84rem;
}

.resume-preview-structured .resume-preview-entry-subtitle {
  margin-top: 0.14rem;
  color: #475569;
  font-size: 0.76rem;
  line-height: 1.45;
}

.resume-preview-structured .resume-preview-entry-meta {
  color: #334155;
  font-size: 0.76rem;
  font-weight: 700;
}

.resume-preview-structured .resume-preview-list {
html[data-theme="dark"] .resume-builder-hero {
  border-color: rgba(45, 212, 191, 0.22);
  background:
    radial-gradient(circle at top right, rgba(45, 212, 191, 0.16), transparent 34%),
    linear-gradient(
      180deg,
      rgba(15, 23, 42, 0.96) 0%,
      rgba(15, 23, 42, 0.93) 58%,
      rgba(17, 24, 39, 0.95) 100%
    );
  box-shadow:
    0 28px 48px -34px rgba(2, 6, 23, 0.86),
    inset 0 1px 0 rgba(148, 163, 184, 0.08);
}

html[data-theme="dark"] .resume-builder-hero-title,
html[data-theme="dark"] .resume-builder-panel-title,
html[data-theme="dark"] .resume-template-title,
html[data-theme="dark"] .resume-entry-title,
html[data-theme="dark"] .resume-score-label {
  color: #f8fafc;
}

html[data-theme="dark"] .resume-builder-hero-text,
html[data-theme="dark"] .resume-builder-panel-copy,
html[data-theme="dark"] .resume-template-copy,
html[data-theme="dark"] .resume-score-subtitle,
html[data-theme="dark"] .resume-keyword-empty,
html[data-theme="dark"] .resume-preview-empty-copy,
html[data-theme="dark"] .resume-preview-empty-body {
  color: #9aa9bd;
}

html[data-theme="dark"] .resume-builder-label,
html[data-theme="dark"] .resume-keyword-title,
html[data-theme="dark"] .resume-preview-empty-title {
  color: #cbd5e1;
}

html[data-theme="dark"] .resume-accordion-title {
  color: #f8fafc;
}

html[data-theme="dark"] .resume-template-switch-label {
  color: #cbd5e1;
}

html[data-theme="dark"] .resume-template-panel {
  border-color: rgba(45, 212, 191, 0.18);
  background: linear-gradient(
    180deg,
    rgba(15, 23, 42, 0.76) 0%,
    rgba(17, 24, 39, 0.86) 100%
  );
  box-shadow:
    inset 0 1px 0 rgba(148, 163, 184, 0.06),
    0 16px 28px -30px rgba(2, 6, 23, 0.7);
}

html[data-theme="dark"] .resume-template-panel-title {
  color: #f8fafc;
}

html[data-theme="dark"] .resume-template-panel-copy {
  color: #94a3b8;
}

html[data-theme="dark"] .resume-builder-hint {
  color: #7f8ea3;
}

html[data-theme="dark"] .resume-accordion-section {
  border-color: rgba(51, 65, 85, 0.88);
  background: rgba(15, 23, 42, 0.78);
  box-shadow:
    0 18px 32px -28px rgba(2, 6, 23, 0.76),
    inset 0 1px 0 rgba(148, 163, 184, 0.06);
}

html[data-theme="dark"] .resume-accordion-section-open {
  border-color: rgba(45, 212, 191, 0.36);
}

html[data-theme="dark"] .resume-accordion-body {
  border-color: rgba(51, 65, 85, 0.82);
}

html[data-theme="dark"] .resume-accordion-optional {
  border-color: rgba(71, 85, 105, 0.88);
  background: rgba(15, 23, 42, 0.72);
  color: #94a3b8;
}

html[data-theme="dark"] .resume-accordion-icon {
  border-color: rgba(71, 85, 105, 0.9);
  background: rgba(2, 6, 23, 0.52);
  color: #99f6e4;
}

html[data-theme="dark"] .resume-template-switch-button {
  border-color: rgba(71, 85, 105, 0.88);
  background: rgba(15, 23, 42, 0.74);
  color: #cbd5e1;
}

html[data-theme="dark"] .resume-template-switch-button:hover {
  border-color: rgba(45, 212, 191, 0.42);
  color: #f8fafc;
}

html[data-theme="dark"] .resume-template-switch-button-active {
  border-color: rgba(45, 212, 191, 0.5);
  background: rgba(17, 94, 89, 0.24);
  color: #99f6e4;
}

html[data-theme="dark"] .resume-template-button {
  border-color: rgba(51, 65, 85, 0.9);
  background: linear-gradient(
    180deg,
    rgba(15, 23, 42, 0.82) 0%,
    rgba(17, 24, 39, 0.88) 100%
  );
  box-shadow:
    0 18px 26px -30px rgba(2, 6, 23, 0.72),
    inset 0 1px 0 rgba(148, 163, 184, 0.06);
}

html[data-theme="dark"] .resume-template-button:hover {
  border-color: rgba(45, 212, 191, 0.42);
}

html[data-theme="dark"] .resume-template-button-active {
  border-color: rgba(45, 212, 191, 0.52);
  background: linear-gradient(
    180deg,
    rgba(15, 118, 110, 0.18) 0%,
    rgba(15, 23, 42, 0.92) 100%
  );
  box-shadow:
    0 20px 30px -28px rgba(20, 184, 166, 0.26),
    inset 0 1px 0 rgba(148, 163, 184, 0.08);
}

html[data-theme="dark"] .resume-template-button:focus-visible {
  outline-color: rgba(45, 212, 191, 0.4);
}

html[data-theme="dark"] .resume-template-tag {
  border-color: rgba(45, 212, 191, 0.34);
  background: rgba(17, 94, 89, 0.22);
  color: #99f6e4;
}

html[data-theme="dark"] .resume-template-button-active .resume-template-tag {
  border-color: rgba(45, 212, 191, 0.42);
  background: rgba(15, 118, 110, 0.28);
}

html[data-theme="dark"] .resume-template-status {
  border-color: rgba(71, 85, 105, 0.92);
  background: rgba(15, 23, 42, 0.84);
  color: #cbd5e1;
}

html[data-theme="dark"] .resume-template-status-active {
  border-color: rgba(45, 212, 191, 0.34);
  background: rgba(17, 94, 89, 0.22);
  color: #99f6e4;
}

html[data-theme="dark"] .resume-template-meta {
  color: #94a3b8;
}

html[data-theme="dark"] .resume-template-button-active .resume-template-meta {
  color: #99f6e4;
}

html[data-theme="dark"] .resume-entry-card,
html[data-theme="dark"] .resume-checklist-item {
  border-color: rgba(51, 65, 85, 0.88);
  background: rgba(15, 23, 42, 0.66);
  box-shadow: inset 0 1px 0 rgba(148, 163, 184, 0.06);
}

html[data-theme="dark"] .resume-entry-remove {
  border-color: rgba(71, 85, 105, 0.92);
  background: rgba(15, 23, 42, 0.82);
  color: #cbd5e1;
}

html[data-theme="dark"] .resume-entry-remove:hover {
  border-color: rgba(248, 113, 113, 0.42);
  background: rgba(127, 29, 29, 0.22);
  color: #fecaca;
}

html[data-theme="dark"] .resume-optional-toggle {
  color: #cbd5e1;
}

html[data-theme="dark"] .resume-help-note {
  border-color: rgba(45, 212, 191, 0.32);
  background: rgba(17, 94, 89, 0.16);
  color: #99f6e4;
}

html[data-theme="dark"] .resume-score-meter {
  border-color: rgba(51, 65, 85, 0.92);
  background: linear-gradient(
    180deg,
    rgba(15, 23, 42, 0.82) 0%,
    rgba(17, 24, 39, 0.86) 100%
  );
}

html[data-theme="dark"] .resume-score-meter-strong {
  border-color: rgba(45, 212, 191, 0.34);
  background: linear-gradient(180deg, rgba(17, 94, 89, 0.26), rgba(15, 23, 42, 0.9));
}

html[data-theme="dark"] .resume-score-meter-good {
  border-color: rgba(94, 234, 212, 0.3);
  background: linear-gradient(180deg, rgba(13, 148, 136, 0.18), rgba(15, 23, 42, 0.88));
}

html[data-theme="dark"] .resume-score-meter-average {
  border-color: rgba(251, 191, 36, 0.34);
  background: linear-gradient(180deg, rgba(146, 64, 14, 0.2), rgba(15, 23, 42, 0.88));
}

html[data-theme="dark"] .resume-score-meter-needs-work {
  border-color: rgba(248, 113, 113, 0.32);
  background: linear-gradient(180deg, rgba(127, 29, 29, 0.2), rgba(15, 23, 42, 0.88));
}

html[data-theme="dark"] .resume-score-value {
  background: linear-gradient(180deg, rgba(15, 118, 110, 0.98), rgba(15, 23, 42, 0.98));
}

html[data-theme="dark"] .resume-checklist-item {
  color: #9aa9bd;
}

html[data-theme="dark"] .resume-checklist-item-pass {
  border-color: rgba(45, 212, 191, 0.34);
  background: rgba(15, 118, 110, 0.16);
  color: #e2e8f0;
}

html[data-theme="dark"] .resume-keyword-chip-match {
  border-color: rgba(45, 212, 191, 0.34);
  background: rgba(17, 94, 89, 0.24);
  color: #99f6e4;
}

html[data-theme="dark"] .resume-keyword-chip-miss {
  border-color: rgba(251, 191, 36, 0.36);
  background: rgba(120, 53, 15, 0.28);
  color: #fcd34d;
}

html[data-theme="dark"] .resume-preview-card {
  border-color: rgba(51, 65, 85, 0.92);
  box-shadow:
    0 30px 52px -34px rgba(2, 6, 23, 0.9),
    inset 0 1px 0 rgba(148, 163, 184, 0.08);
}

html[data-theme="dark"] .resume-preview-toolbar {
  border-color: rgba(148, 163, 184, 0.08);
}

html[data-theme="dark"] .resume-preview-toolbar-note {
  color: #cbd5e1;
}

html[data-theme="dark"] .resume-preview-empty-body {
  border-color: rgba(71, 85, 105, 0.88);
  background: rgba(15, 23, 42, 0.54);
}

html[data-theme="dark"] .resume-builder-footer-actions,
html[data-theme="dark"] .resume-keyword-panel {
  border-color: rgba(51, 65, 85, 0.88);
  background: rgba(15, 23, 42, 0.78);
  box-shadow:
    0 18px 32px -28px rgba(2, 6, 23, 0.78),
    inset 0 1px 0 rgba(148, 163, 184, 0.06);
}

html[data-theme="dark"] .resume-preview-modal-close {
  border-color: rgba(71, 85, 105, 0.88);
  background: rgba(15, 23, 42, 0.92);
  color: #e2e8f0;
}
@media (min-width: 640px) {
  .resume-builder-form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .resume-keyword-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .resume-template-switch-head {
    grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
    align-items: end;
    gap: 1rem;
  }

  .resume-template-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .resume-builder-footer-actions-row {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .resume-builder-hero-grid-compact {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .resume-builder-hero-button {
    justify-self: end;
  }

  .resume-builder-hero-actions {
    flex-direction: row;
    flex-wrap: wrap;
  }
}

@media (min-width: 640px) and (max-width: 979px) {
  .resume-builder-shell {
    gap: 1.15rem;
  }

  .resume-builder-preview-column {
    width: 100%;
    max-width: 46rem;
    margin-inline: auto;
  }

  .resume-preview-card,
  .resume-keyword-panel {
    width: 100%;
  }
}

@media (min-width: 980px) {
  .resume-builder-hero-grid {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
    gap: 1.4rem;
  }

  .resume-builder-shell {
    grid-template-columns: minmax(0, 0.95fr) minmax(25rem, 1.05fr);
    gap: 1rem;
  }

  .resume-builder-sticky {
    position: sticky;
    top: 5.9rem;
  }
}

@media (max-width: 639px) {
  .resume-builder-page {
    gap: 0.85rem;
  }

  .resume-builder-shell {
    gap: 0.9rem;
  }

  .resume-builder-hero-title {
    font-size: 1.65rem;
  }

  .resume-builder-hero-text {
    font-size: 0.9rem;
  }

  .resume-accordion-toggle {
    padding: 0.92rem 0.95rem;
  }

  .resume-accordion-body {
    padding: 0 0.95rem 0.95rem;
  }

  .resume-builder-panel-head {
    margin-bottom: 0.85rem;
  }

  .resume-summary-textarea {
    min-height: 11.5rem;
  }

  .resume-template-panel {
    padding: 0.8rem 0.82rem 0.85rem;
  }

  .resume-template-switch {
    grid-template-columns: 1fr;
    gap: 0.45rem;
  }

  .resume-template-switch-button {
    justify-content: flex-start;
    padding-inline: 0.85rem;
    text-align: left;
  }

  .resume-preview-sheet {
    margin: 0.85rem;
    padding: 1rem;
  }

  .resume-preview-name {
    font-size: 1.48rem;
  }

  .resume-preview-contact span::after {
    display: none;
  }

  .resume-preview-toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .resume-preview-header {
    gap: 0.62rem;
    padding-bottom: 0.85rem;
  }

  .resume-preview-entry-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.3rem;
  }

  .resume-preview-entry-meta {
    text-align: left;
  }

  .resume-preview-modal {
    padding: 0.75rem;
  }

  .resume-preview-modal-actions {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 420px) {
  .resume-builder-hero {
    padding-inline: 0.95rem;
  }

  .resume-template-panel {
    padding: 0.76rem 0.76rem 0.8rem;
  }

  .resume-preview-sheet {
    margin: 0.72rem;
    padding: 0.88rem;
  }

  .resume-preview-name {
    font-size: 1.34rem;
  }

  .resume-preview-copy,
  .resume-preview-list {
    font-size: 0.8rem;
  }
}

@page {
  margin: 0.45in;
}

@media print {
  html,
  body {
    background: #ffffff !important;
    color: #0f172a !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .site-grid > header,
  .site-grid > footer,
  .site-glow,
  .route-progress-indicator,
  .resume-builder-hero,
  .resume-builder-editor,
  .resume-builder-score-panel,
  .resume-keyword-panel,
  .resume-preview-modal,
  .resume-preview-toolbar {
    display: none !important;
  }

  .site-grid,
  main,
  .resume-builder-page,
  .resume-builder-shell,
  .resume-builder-preview-column,
  .resume-builder-sticky {
    display: block !important;
    max-width: none !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  .resume-builder-page > *:not(.resume-print-root) {
    display: none !important;
  }

  .resume-print-root {
    display: block !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: visible !important;
  }

  .resume-preview-print-card,
  .resume-print-root .resume-preview-sheet {
    border: 0 !important;
    border-radius: 0 !important;
    background: #ffffff !important;
    box-shadow: none !important;
    margin: 0 !important;
    overflow: visible !important;
  }

  .resume-preview-print-card {
    display: block !important;
    padding: 0 !important;
  }

  .resume-print-root .resume-preview-sheet {
    display: block !important;
    width: 100% !important;
    max-width: none !important;
    min-height: 0 !important;
    padding: 0.2in !important;
  }

  .resume-preview-body,
  .resume-preview-stack,
  .resume-preview-section,
  .resume-preview-entry {
    display: block !important;
  }

  .resume-preview-section + .resume-preview-section {
    margin-top: 0.78rem !important;
  }

  .resume-preview-entry + .resume-preview-entry {
    margin-top: 0.62rem !important;
  }

  .resume-preview-body,
  .resume-preview-section {
    break-inside: auto !important;
    page-break-inside: auto !important;
  }

  .resume-preview-entry,
  .resume-preview-structured-table,
  .resume-preview-structured-row,
  .resume-preview-list,
  .resume-preview-skill-row {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }

  .resume-preview-section-title {
    break-after: avoid !important;
    page-break-after: avoid !important;
  }

  .resume-preview-copy,
  .resume-preview-list,
  .resume-preview-entry-subtitle,
  .resume-preview-entry-meta,
  .resume-preview-contact {
    color: #334155 !important;
  }

  .resume-preview-entry,
  .resume-preview-skill-pill,
  .resume-preview-section-projects,
  .resume-preview-section-skills {
    background: transparent !important;
    box-shadow: none !important;
  }

  .resume-preview-section-projects,
  .resume-preview-section-skills,
  .resume-preview-entry,
  .resume-preview-skill-pill {
    border-color: rgba(203, 213, 225, 0.96) !important;
  }

  .resume-preview-contact {
    display: block !important;
  }

  .resume-preview-contact span {
    display: inline !important;
    white-space: normal !important;
  }

  .resume-preview-contact span:not(:last-child)::after {
    content: " • ";
    color: #94a3b8;
  }
}
`}</style>
  );
}
