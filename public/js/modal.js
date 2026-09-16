/**
 * Ensoria Principles Explorer - Principle Detail Modal Component (i18n Enabled)
 */

class PrincipleModal {
  constructor(backdropEl) {
    this.backdrop = backdropEl;
    this.card = this.backdrop.querySelector('.modal-card');
    this.closeBtn = this.backdrop.querySelector('.btn-close');
    this.isOpen = false;
    this.currentPrinciple = null;
    this.uiStrings = {
      modalAxiom: "ASSIOMA FONDAMENTALE",
      modalBehaviors: "Comportamenti Operativi",
      flawedLabel: "❌ FLAWED / ANTI-PATTERN (Comportamento Convenzionale / Degenerativo)",
      ensoriaLabel: "🟢 Ensoria (Comportamento Sovrano / Risolutivo)",
      modalDomain: "Dominio Ontologico"
    };

    this.init();
  }

  setI18n(uiStrings) {
    if (uiStrings) {
      this.uiStrings = { ...this.uiStrings, ...uiStrings };
      if (this.isOpen && this.currentPrinciple) {
        this.open(this.currentPrinciple);
      }
    }
  }

  init() {
    // Close button
    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }

    // Click outside modal card to close
    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop) {
        this.close();
      }
    });

    // ESC key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  open(principle) {
    if (!principle) return;
    this.currentPrinciple = principle;
    this.isOpen = true;

    // Set domain accent color & localized name
    const posNames = this.uiStrings.somaticPositions || {};
    let domainColor = '#38bdf8';
    let domainClass = 'badge-brain';
    let domainName = posNames.brain || 'Brain (Centro Cranico)';
    let domainSymbol = '🧠';

    if (principle.domain === 'soul') {
      domainColor = '#c084fc';
      domainClass = 'badge-soul';
      domainName = posNames.soul || 'Soul (Centro Cardiaco)';
      domainSymbol = '💜';
    } else if (principle.domain === 'body') {
      domainColor = '#34d399';
      domainClass = 'badge-body';
      domainName = posNames.body || 'Body (Spina Dorsale)';
      domainSymbol = '⚡';
    }

    this.card.style.borderColor = domainColor;
    this.card.style.boxShadow = `0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px ${domainColor}26`;

    let badgeTypeText = principle.type ? principle.type.toUpperCase() : 'PRINCIPLE';
    if (principle.type === 'core' && this.uiStrings.badgeCore) badgeTypeText = `PRINCIPLE ${this.uiStrings.badgeCore}`;
    if (principle.type === 'operative' && this.uiStrings.badgeOperative) badgeTypeText = `PRINCIPLE ${this.uiStrings.badgeOperative}`;
    if (principle.type === 'guiding' && this.uiStrings.badgeGuiding) badgeTypeText = `PRINCIPLE ${this.uiStrings.badgeGuiding}`;

    // Render Header
    const tagsEl = this.card.querySelector('.modal-tags');
    tagsEl.innerHTML = `
      <span class="modal-badge ${domainClass}">${domainSymbol} ${domainName}</span>
      <span class="modal-badge badge-type">${badgeTypeText}</span>
    `;

    const titleEl = this.card.querySelector('.modal-title');
    titleEl.textContent = principle.title;

    const tagSlugEl = this.card.querySelector('.modal-tag-slug');
    tagSlugEl.textContent = principle.tag || `ensoria ${principle.type} principle [${principle.slug}]`;

    // Render Body
    const bodyEl = this.card.querySelector('.modal-body');
    let html = '';

    // 1. Axiom Card (Assioma Fondamentale)
    if (principle.axiom) {
      const axiomLabel = this.uiStrings.modalAxiom || "Assioma Fondamentale";
      html += `
        <div class="axiom-card" style="border-left-color: ${domainColor};">
          <div class="axiom-label" style="color: ${domainColor};">
            <span>✨</span> ${axiomLabel.toUpperCase()}
          </div>
          <div class="axiom-quote">
            "${principle.axiom}"
          </div>
        </div>
      `;
    }

    // 2. Behaviors (Comportamenti & Contrastive Examples)
    if (principle.behaviors && principle.behaviors.length > 0) {
      const behaviorsLabel = this.uiStrings.modalBehaviors || "Comportamenti Operativi";
      html += `
        <div>
          <div class="section-title">
            <span>🧭</span> ${behaviorsLabel.toUpperCase()} (${principle.behaviors.length})
          </div>
      `;

      principle.behaviors.forEach((beh, idx) => {
        const behTitle = beh.name || beh.title || `Comportamento ${idx + 1}`;
        const behDesc = beh.description || beh.rule || '';

        html += `
          <div class="behavior-block">
            <div class="behavior-header">
              <span style="color:${domainColor}">#${idx + 1}</span> ${behTitle}
            </div>
            ${behDesc ? `<div class="behavior-rule">${behDesc}</div>` : ''}
        `;

        if (beh.examples && beh.examples.length > 0) {
          beh.examples.forEach(ex => {
            const exTitle = ex.context || ex.title || 'Scenario';
            const flawedLabel = this.uiStrings.flawedLabel || "❌ FLAWED / ANTI-PATTERN";
            const ensoriaLabel = this.uiStrings.ensoriaLabel || "🟢 ENSORIA / SOVEREIGN";

            html += `
              <div class="example-item">
                <div class="example-title">📌 ${exTitle}</div>
                <div class="contrast-grid">
                  <div class="contrast-box flawed">
                    <div class="contrast-label">
                      ${flawedLabel}
                    </div>
                    <div>${ex.flawed || 'Non conforme.'}</div>
                  </div>
                  <div class="contrast-box ensoria">
                    <div class="contrast-label">
                      ${ensoriaLabel}
                    </div>
                    <div>${ex.ensoria || 'Conforme.'}</div>
                  </div>
                </div>
              </div>
            `;
          });
        }

        html += `</div>`;
      });

      html += `</div>`;
    }

    // 3. Description / Architecture Specification
    if (principle.description) {
      const formattedDesc = this.formatDescription(principle.description);
      const contextLabel = this.uiStrings.modalContext || "CONTESTO E MOTIVAZIONE";
      html += `
        <div>
          <div class="section-title">
            <span>📄</span> ${contextLabel}
          </div>
          <div class="description-text">${formattedDesc}</div>
        </div>
      `;
    }

    bodyEl.innerHTML = html;

    // Open Backdrop
    this.backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  formatDescription(text) {
    if (!text) return '';
    return text
      .replace(/^### .*$/gm, '')
      .replace(/^## .*$/gm, '')
      .replace(/---/g, '')
      .trim();
  }

  close() {
    this.isOpen = false;
    this.backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }
}

if (typeof window !== 'undefined') {
  window.PrincipleModal = PrincipleModal;
}
