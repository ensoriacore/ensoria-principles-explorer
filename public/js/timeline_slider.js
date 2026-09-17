/**
 * Ensoria Principles Explorer - Timeline Slider & Growth Engine
 * Objective: OBJ-CORE-FEAT-002 / SUB-OBJ-002.3
 */

(function () {
    class TimelineSlider {
        constructor() {
            this.container = document.getElementById('timeline-container');
            this.epochs = [];
            this.activeEpochId = 'all';
            this.init();
        }

        async init() {
            if (!this.container) {
                console.warn('TimelineSlider: #timeline-container not found');
                return;
            }

            try {
                let basePath = window.location.pathname;
                if (!basePath.endsWith('/')) basePath += '/';
                const response = await fetch(basePath + 'api/timeline');
                const data = await response.json();
                if (data.success && Array.isArray(data.epochs)) {
                    this.epochs = data.epochs;
                    this.render();
                }
            } catch (err) {
                console.error('Failed to load timeline epochs:', err);
            }
        }

        render() {
            this.container.innerHTML = `
                <div class="timeline-slider-card">
                    <div class="timeline-header">
                        <span class="timeline-label">⏳ TIMELINE & GROWTH ENGINE</span>
                        <span id="active-epoch-tag" class="epoch-tag">TUTTE LE EPOCHE</span>
                    </div>
                    <div class="timeline-track">
                        <button class="epoch-btn active" data-epoch="all" title="Visualizza tutti i principi ontologici">
                            <span class="epoch-dot"></span>
                            <span class="epoch-title">Tutte</span>
                            <span class="epoch-year">Origine → Mitosi</span>
                        </button>
                        ${this.epochs.map(epoch => `
                            <button class="epoch-btn" data-epoch="${epoch.id}" title="${epoch.description}">
                                <span class="epoch-dot"></span>
                                <span class="epoch-title">${epoch.name}</span>
                                <span class="epoch-year">${epoch.period}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;

            this.attachEvents();
        }

        attachEvents() {
            const buttons = this.container.querySelectorAll('.epoch-btn');
            const tag = this.container.querySelector('#active-epoch-tag');

            buttons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const epochId = btn.getAttribute('data-epoch');
                    buttons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.activeEpochId = epochId;

                    let selectedEpoch = null;
                    if (epochId === 'all') {
                        if (tag) tag.textContent = 'TUTTE LE EPOCHE';
                    } else {
                        selectedEpoch = this.epochs.find(e => e.id === epochId);
                        if (tag && selectedEpoch) {
                            tag.textContent = `${selectedEpoch.name.toUpperCase()} (${selectedEpoch.period})`;
                        }
                    }

                    // Dispatch global event for Avatar3D & App UI
                    window.dispatchEvent(new CustomEvent('ensoria:epochChanged', {
                        detail: {
                            epochId,
                            epoch: selectedEpoch,
                            principles: selectedEpoch ? selectedEpoch.principles : null
                        }
                    }));
                });
            });
        }
    }

    // Auto-mount on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.ensoriaTimeline = new TimelineSlider();
        });
    } else {
        window.ensoriaTimeline = new TimelineSlider();
    }
})();
