/**
 * Royal Birthday Experience for Rou
 * Interactive Script: 3 Themes & Complete Interactive Journeys
 */

document.addEventListener('DOMContentLoaded', () => {
    // Track Page Visit
    if (window.RouTracker) {
        window.RouTracker.track('page_visit', {
            title: 'Website Opened',
            screen: `${window.innerWidth}x${window.innerHeight}`,
            referrer: document.referrer || 'Direct Link'
        });
    }

    // ===================================================================
    // 1. STATE & NAVIGATION
    // ===================================================================
    let currentTheme = 'theme-rose';
    let isMusicPlaying = false;
    let hasMusicStarted = false;
    let audioContext = null;
    let melodyInterval = null;
    let candleBlown = false;
    let hasDrawnReason = false;
    let currentReasonIndex = 0;
    let currentLang = localStorage.getItem('rou_birthday_lang') || 'ar';
    let reasonsList = (window.RouTranslations && window.RouTranslations.reasons && window.RouTranslations.reasons[currentLang]) || [];
    let isSiteLocked = false;
    let toastTimeout = null;

    const navTabs = document.querySelectorAll('.nav-tab-btn');
    const viewSections = document.querySelectorAll('.view-section');
    const audioToggleBtn = document.getElementById('musicToggleBtn');
    const bgAudioElement = document.getElementById('backgroundMusic');
    const langToggleBtn = document.getElementById('langToggleBtn');
    const langBtnText = document.getElementById('langBtnText');
    const lockToast = document.getElementById('lockToast');
    const lockToastText = document.getElementById('lockToastText');
    const lockNoticeCard = document.getElementById('lockNoticeCard');
    const unlockCelebrationBanner = document.getElementById('unlockCelebrationBanner');
    const startRoseBtn = document.getElementById('startRoseJourneyBtn');
    const startRoseBtnText = document.getElementById('startRoseBtnText');

    function showLockToast(customMsg) {
        if (!lockToast) return;
        const t = (window.RouTranslations && window.RouTranslations[currentLang]) || {};
        if (lockToastText) {
            lockToastText.innerHTML = customMsg || t.lock_toast_msg || 'This section is locked until October 6, 2026! <i class="fa-solid fa-lock fa-icon-inline" style="color:#ef4444;"></i>';
        }
        lockToast.classList.add('show');
        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            lockToast.classList.remove('show');
        }, 3200);
        if (typeof playChime === 'function') {
            playChime(220, 0.15, 'triangle');
        }
    }

    // Tab Switching
    navTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const targetView = tab.getAttribute('data-view');
            if (isSiteLocked && targetView !== 'view-cake') {
                e.preventDefault();
                e.stopPropagation();
                showLockToast();
                tab.animate([
                    { transform: 'translateX(0)' },
                    { transform: 'translateX(-4px)' },
                    { transform: 'translateX(4px)' },
                    { transform: 'translateX(0)' }
                ], { duration: 300 });
                return;
            }
            const targetTheme = tab.getAttribute('data-theme');
            switchThemeAndView(targetTheme, targetView);
        });
    });

    // Sub-switch buttons (e.g., from end of cake to scrapbook, or back)
    document.querySelectorAll('.mini-switch-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetView = btn.getAttribute('data-switch');
            const targetTheme = (targetView === 'view-scrapbook') ? 'theme-scrapbook' : ((targetView === 'view-stars') ? 'theme-stars' : 'theme-rose');
            switchThemeAndView(targetTheme, targetView);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    function switchThemeAndView(themeClass, viewId) {
        if (isSiteLocked && viewId !== 'view-cake') {
            showLockToast();
            return;
        }
        // Change body class
        document.body.className = themeClass + (isSiteLocked ? ' site-locked' : ' site-unlocked');
        currentTheme = themeClass;

        // Update nav active tab
        navTabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-view') === viewId));

        // Switch visible view section
        viewSections.forEach(v => {
            if (v.id === viewId) {
                v.classList.add('active');
            } else {
                v.classList.remove('active');
            }
        });

        if (viewId === 'view-stars') {
            drawConstellationLines();
        }
    }

    // ===================================================================
    // BILINGUAL TRANSLATION SYSTEM (English ⇄ Arabic)
    // ===================================================================
    function applyLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('rou_birthday_lang', lang);

        document.documentElement.lang = lang;
        document.documentElement.dir = (lang === 'ar' ? 'rtl' : 'ltr');

        const t = window.RouTranslations && window.RouTranslations[lang];
        if (!t) return;

        if (langBtnText) {
            langBtnText.textContent = t.lang_btn_text;
        }
        if (langToggleBtn) {
            langToggleBtn.title = t.lang_btn_title;
            langToggleBtn.setAttribute('aria-label', t.lang_btn_title);
        }

        // Update all elements with data-i18n
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (t[key] !== undefined) {
                el.innerHTML = t[key];
            }
        });

        // 1. Candle & Cake state
        const blowBtn = document.getElementById('blowCandleBtn');
        const cakeInstr = document.getElementById('cakeInstruction');
        if (candleBlown) {
            if (blowBtn) {
                blowBtn.innerHTML = `<span><svg class="svg-icon" viewBox="0 0 24 24" style="color:var(--accent-gold);"><path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"/></svg> ${t.btn_candle_blown}</span>`;
            }
            if (cakeInstr) {
                cakeInstr.innerHTML = `<strong><svg class="svg-icon" viewBox="0 0 24 24" style="color:var(--accent-gold);"><path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"/></svg> ${t.cake_instruction_done}</strong>`;
            }
        }

        // 2. Vouchers state
        document.querySelectorAll('.voucher-card').forEach(card => {
            const btn = card.querySelector('.voucher-btn');
            if (card.classList.contains('redeemed') && btn) {
                btn.innerHTML = `
                    <svg class="svg-icon stroke" viewBox="0 0 24 24" style="width:1.1em;height:1.1em;color:#2ecc71;">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>${t.btn_redeemed}</span>
                `;
            }
        });

        // 3. Reasons Jar
        if (window.RouTranslations && window.RouTranslations.reasons && window.RouTranslations.reasons[lang]) {
            reasonsList = window.RouTranslations.reasons[lang];
        }
        const qDisplay = document.getElementById('reasonQuoteDisplay');
        const rCounter = document.getElementById('reasonCounter');
        if (hasDrawnReason && qDisplay) {
            qDisplay.innerHTML = `"${reasonsList[currentReasonIndex]}" <svg class="svg-icon" viewBox="0 0 24 24" style="color:var(--accent-gold);width:1em;height:1em;vertical-align:-0.15em;"><path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"/></svg>`;
            if (rCounter) {
                rCounter.textContent = `${t.reason_drawn_label}: ${currentReasonIndex + 1} / ${reasonsList.length}`;
            }
        } else if (rCounter) {
            rCounter.textContent = `${t.reason_drawn_label}: 0 / ${reasonsList.length}`;
        }

        // 4. Constellation stars
        const starKeys = ['s1', 's2', 's3', 's4', 's5'];
        starKeys.forEach(key => {
            const node = document.querySelector(`.star-node.${key}`);
            const starData = window.RouTranslations?.stars?.[key]?.[lang];
            if (node && starData) {
                node.setAttribute('data-title', starData.title);
                node.setAttribute('data-desc', starData.desc);
            }
        });
        const activeStar = document.querySelector('.star-node.active');
        const smTitle = document.getElementById('starModalTitle');
        const smDesc = document.getElementById('starModalDesc');
        if (activeStar) {
            const title = activeStar.getAttribute('data-title');
            const desc = activeStar.getAttribute('data-desc');
            if (smTitle) {
                smTitle.innerHTML = `<svg class="svg-icon" viewBox="0 0 24 24" style="color:var(--accent-gold);width:1.2em;height:1.2em;vertical-align:-0.2em;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> ${title}`;
            }
            if (smDesc) {
                smDesc.textContent = desc;
            }
        }

        // 5. Track status in music lounge
        const tStatus = document.getElementById('trackStatus');
        if (tStatus) {
            if (isMusicPlaying) {
                tStatus.innerHTML = `${t.track_status_playing} <svg class="svg-icon stroke" viewBox="0 0 24 24" style="width:1em;height:1em;vertical-align:-0.15em;"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
            } else if (hasMusicStarted) {
                tStatus.textContent = lang === 'ar' ? 'متوقف مؤقتاً' : 'Paused';
            } else {
                tStatus.innerHTML = `${t.track_status_ready} <svg class="svg-icon stroke" viewBox="0 0 24 24" style="width:1em;height:1em;vertical-align:-0.15em;"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
            }
        }

        // 6. Update lock button text
        if (startRoseBtnText) {
            startRoseBtnText.innerHTML = isSiteLocked ? t.btn_journey_locked : t.btn_start_journey;
        }

        // 7. Countdown check if expired
        if (typeof updateCountdown === 'function') {
            updateCountdown();
        }
    }

    if (langToggleBtn) {
        langToggleBtn.addEventListener('click', () => {
            const nextLang = currentLang === 'en' ? 'ar' : 'en';
            applyLanguage(nextLang);
            if (window.RouTracker) {
                window.RouTracker.track('language_switched', {
                    lang: nextLang,
                    title: `Switched language to ${nextLang.toUpperCase()}`
                });
            }
            playSparkleTone();
        });
    }

    // ===================================================================
    // BIRTHDAY COUNTDOWN & LOCK CONTROLLER (UNTIL OCTOBER 6, 2026)
    // ===================================================================
    const targetBirthday = new Date('2026-10-06T00:00:00');
    const cdDays = document.getElementById('cdDays');
    const cdHours = document.getElementById('cdHours');
    const cdMins = document.getElementById('cdMins');
    const cdSecs = document.getElementById('cdSecs');
    const mainCountdown = document.getElementById('mainCountdown');

    function syncLockState(shouldBeLocked) {
        isSiteLocked = false;
        const t = (window.RouTranslations && window.RouTranslations[currentLang]) || {};

        document.body.classList.remove('site-locked');
        document.body.classList.add('site-unlocked');

        // Unlock all tabs
        navTabs.forEach(tab => {
            tab.classList.remove('tab-locked');
            tab.removeAttribute('aria-disabled');
            tab.removeAttribute('title');
        });

        // Unlock journey button
        if (startRoseBtn) {
            startRoseBtn.removeAttribute('aria-disabled');
        }
        if (startRoseBtnText) {
            startRoseBtnText.innerHTML = t.btn_start_journey || 'ابدأي المفاجأة <i class="fa-solid fa-sparkles fa-icon-inline fa-sparkle-themed"></i>';
        }

        if (unlockCelebrationBanner) {
            unlockCelebrationBanner.classList.remove('show');
        }
    }

    function updateCountdown() {
        const now = new Date();
        const diff = targetBirthday - now;

        // Ensure all elements and views remain permanently unlocked
        if (isSiteLocked || document.body.classList.contains('site-locked')) {
            syncLockState(false);
        }

        if (diff <= 0) {
            if (mainCountdown) {
                const t = window.RouTranslations && window.RouTranslations[currentLang];
                const expiredMsg = t ? t.cd_expired : 'Today is October 6th! Happy Birthday to you! <i class="fa-solid fa-sparkles fa-icon-inline fa-sparkle-themed"></i>';
                mainCountdown.innerHTML = `<div style="font-size: 1.25rem; font-weight: 800; color: #ffeb3b; padding: 10px; display: flex; align-items: center; justify-content: center; gap: 8px;"><svg class="svg-icon" viewBox="0 0 24 24"><path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"/></svg> ${expiredMsg} <svg class="svg-icon" viewBox="0 0 24 24"><path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"/></svg></div>`;
            }
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (cdDays) cdDays.textContent = String(days).padStart(2, '0');
        if (cdHours) cdHours.textContent = String(hours).padStart(2, '0');
        if (cdMins) cdMins.textContent = String(minutes).padStart(2, '0');
        if (cdSecs) cdSecs.textContent = String(seconds).padStart(2, '0');
    }

    // Expose testing helpers on window
    window.unlockExperience = function() {
        window.__forceUnlocked = true;
        updateCountdown();
        launchConfetti(60);
        if (typeof playCelebrationTone === 'function') {
            playCelebrationTone();
        }
        console.log('%c[UNLOCKED] Experience Unlocked for Preview / Testing!', 'color:#2ecc71; font-size:15px; font-weight:bold;');
    };

    window.lockExperience = function() {
        window.__forceUnlocked = false;
        updateCountdown();
        console.log('%c[LOCKED] Experience Locked until Countdown Reaches Zero!', 'color:#ff4b72; font-size:15px; font-weight:bold;');
    };

    syncLockState(false);
    updateCountdown();
    setInterval(updateCountdown, 1000);

    // ===================================================================
    // 2. PARTICLES & AMBIENT CANVAS (Petals, Warm Bokeh, Stars)
    // ===================================================================
    const canvas = document.getElementById('particlesCanvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationFrameId = null;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initParticles();
    }
    window.addEventListener('resize', resizeCanvas);

    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 4 + 2;
            this.speedY = Math.random() * 1 + 0.4;
            this.speedX = Math.sin(Math.random() * Math.PI) * 0.8;
            this.opacity = Math.random() * 0.6 + 0.2;
            this.rotation = Math.random() * 360;
            this.rotSpeed = (Math.random() - 0.5) * 2;
        }

        update() {
            this.y += this.speedY;
            this.x += this.speedX;
            this.rotation += this.rotSpeed;

            if (this.y > canvas.height + 20) {
                this.y = -20;
                this.x = Math.random() * canvas.width;
            }
            if (this.x > canvas.width + 20) this.x = -20;
            if (this.x < -20) this.x = canvas.width + 20;
        }

        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate((this.rotation * Math.PI) / 180);
            ctx.globalAlpha = this.opacity;

            if (currentTheme === 'theme-rose') {
                // Falling soft rose petal
                ctx.fillStyle = '#ff9ebb';
                ctx.beginPath();
                ctx.ellipse(0, 0, this.size * 1.5, this.size, 0, 0, Math.PI * 2);
                ctx.fill();
            } else if (currentTheme === 'theme-scrapbook') {
                // Warm golden fairy dust
                ctx.fillStyle = '#f5b041';
                ctx.shadowColor = '#f39c12';
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(0, 0, this.size * 0.8, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Celestial twinkling star
                ctx.fillStyle = '#e0f2fe';
                ctx.shadowColor = '#60a5fa';
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(0, 0, this.size * 0.7, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }

    function initParticles() {
        particles = [];
        const count = window.innerWidth < 768 ? 35 : 65;
        for (let i = 0; i < count; i++) {
            particles.push(new Particle());
        }
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let p of particles) {
            p.update();
            p.draw();
        }
        animationFrameId = requestAnimationFrame(animateParticles);
    }

    resizeCanvas();
    animateParticles();


    // ===================================================================
    // 3. EXPERIENCE 1: ROSE DREAM (ENVELOPE, LETTER, CAKE & CANDLE)
    // ===================================================================
    const envelope = document.getElementById('envelopeInteractive');
    const proceedToCakeBtn = document.getElementById('proceedToCakeBtn');
    const candleWrapper = document.getElementById('candleWrapper');
    const blowCandleBtn = document.getElementById('blowCandleBtn');
    const cakeInstruction = document.getElementById('cakeInstruction');
    const wishesBox = document.getElementById('celebrationWishesBox');
    const confettiContainer = document.getElementById('confettiContainer');

    function switchCakeStep(targetStepId) {
        document.querySelectorAll('#view-cake .step').forEach(step => {
            step.classList.remove('active');
        });
        const target = document.getElementById(targetStepId);
        if (target) target.classList.add('active');
    }

    // Step 1 -> Step 2
    if (startRoseBtn) {
        startRoseBtn.addEventListener('click', (e) => {
            if (isSiteLocked) {
                e.preventDefault();
                showLockToast();
                startRoseBtn.animate([
                    { transform: 'translateX(0)' },
                    { transform: 'translateX(-6px)' },
                    { transform: 'translateX(6px)' },
                    { transform: 'translateX(-4px)' },
                    { transform: 'translateX(4px)' },
                    { transform: 'translateX(0)' }
                ], { duration: 350 });
                return;
            }
            switchCakeStep('cakeStep2');
            startMusicPlayback();
        });
    }

    // Step 2 -> Step 3 (Envelope Open)
    if (envelope) {
        envelope.addEventListener('click', () => {
            if (isSiteLocked) {
                showLockToast();
                return;
            }
            if (!envelope.classList.contains('open')) {
                envelope.classList.add('open');
                setTimeout(() => {
                    switchCakeStep('cakeStep3');
                }, 900);
            }
        });
    }

    // Step 3: 3D Flippable Birthday Card Interaction (Cover -> Letter)
    const birthdayCard = document.getElementById('birthdayCardInteractive');
    const cardFlipHint = document.getElementById('cardFlipHint');
    const cardProceedContainer = document.getElementById('cardProceedContainer');
    const btnFlipBack = document.getElementById('btnFlipBack');
    let isCardFlipping = false;
    let hasLetterBeenOpened = false;

    function flipCardToLetter() {
        if (isCardFlipping) return;
        isCardFlipping = true;

        if (cardFlipHint) {
            cardFlipHint.classList.add('hint-hidden');
        }

        if (birthdayCard) {
            birthdayCard.classList.add('flipped');
            birthdayCard.setAttribute('aria-expanded', 'true');
        }

        if (typeof playSparkleTone === 'function') {
            playSparkleTone();
        }

        if (!hasLetterBeenOpened) {
            hasLetterBeenOpened = true;
            if (window.RouTracker) {
                window.RouTracker.track('letter_opened', {
                    title: 'Birthday Letter Card Flipped & Read',
                    note: 'Rou flipped the 3D card and revealed her heartfelt letter!'
                });
            }
            // After flip finishes (900ms), reveal the Proceed button!
            setTimeout(() => {
                if (cardProceedContainer) {
                    cardProceedContainer.classList.add('revealed');
                }
                if (proceedToCakeBtn) {
                    proceedToCakeBtn.removeAttribute('disabled');
                }
                isCardFlipping = false;
            }, 900);
        } else {
            setTimeout(() => {
                isCardFlipping = false;
            }, 900);
        }
    }

    function flipCardToCover() {
        if (isCardFlipping) return;
        isCardFlipping = true;

        if (birthdayCard) {
            birthdayCard.classList.remove('flipped');
            birthdayCard.setAttribute('aria-expanded', 'false');
        }

        if (cardFlipHint) {
            cardFlipHint.classList.remove('hint-hidden');
        }

        if (typeof playSparkleTone === 'function') {
            playSparkleTone();
        }

        setTimeout(() => {
            isCardFlipping = false;
        }, 900);
    }

    if (birthdayCard) {
        birthdayCard.addEventListener('click', (e) => {
            if (isSiteLocked) {
                showLockToast();
                return;
            }
            // Only flip to letter if currently on cover
            if (!birthdayCard.classList.contains('flipped')) {
                flipCardToLetter();
            }
        });

        birthdayCard.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!birthdayCard.classList.contains('flipped')) {
                    flipCardToLetter();
                }
            }
        });
    }

    if (btnFlipBack) {
        btnFlipBack.addEventListener('click', (e) => {
            e.stopPropagation();
            flipCardToCover();
        });
    }

    // Step 3 -> Step 4 (Proceed to Cake - Gated until letter is flipped)
    if (proceedToCakeBtn) {
        proceedToCakeBtn.addEventListener('click', () => {
            if (isSiteLocked) {
                showLockToast();
                return;
            }
            if (!hasLetterBeenOpened) {
                return;
            }
            switchCakeStep('cakeStep4');
        });
    }

    // Candle Extinguish Interaction
    function extinguishCandle() {
        if (isSiteLocked) {
            showLockToast();
            return;
        }
        if (candleBlown) return;
        candleBlown = true;

        candleWrapper.classList.add('extinguished');
        if (window.RouTracker) {
            window.RouTracker.track('candle_blown', {
                title: 'Candle Blown & Birthday Wish Made',
                note: 'Rou blew out the candle on her birthday cake!'
            });
        }
        blowCandleBtn.style.opacity = '0.5';
        blowCandleBtn.disabled = true;
        const t = (window.RouTranslations && window.RouTranslations[currentLang]) || {};
        blowCandleBtn.innerHTML = `<span><svg class="svg-icon" viewBox="0 0 24 24" style="color:var(--accent-gold);"><path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"/></svg> ${t.btn_candle_blown || 'Candle Blown & Wish Made!'}</span>`;

        cakeInstruction.innerHTML = `<strong><svg class="svg-icon" viewBox="0 0 24 24" style="color:var(--accent-gold);"><path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"/></svg> ${t.cake_instruction_done || 'Happy Birthday! May all your wishes come true in a blessed new year! <i class="fa-solid fa-sparkles fa-icon-inline fa-sparkle-themed"></i>'}</strong>`;

        // Play festive chime
        playCelebrationTone();

        // Launch celebratory effects
        launchConfetti(80);
        launchBalloons(14);
        setTimeout(() => launchConfetti(60), 600);
        setTimeout(() => launchConfetti(50), 1200);

        // Reveal final wishes box
        setTimeout(() => {
            wishesBox.classList.add('show');
        }, 1200);
    }

    if (candleWrapper) {
        candleWrapper.addEventListener('click', extinguishCandle);
    }
    if (blowCandleBtn) {
        blowCandleBtn.addEventListener('click', extinguishCandle);
    }

    // Confetti Cannon
    function launchConfetti(count) {
        const colors = ['#ff4b72', '#ffd700', '#ffffff', '#60a5fa', '#ff8da1', '#a855f7'];
        for (let i = 0; i < count; i++) {
            const el = document.createElement('div');
            el.className = 'confetti-item';
            el.style.position = 'fixed';
            el.style.top = '-10px';
            el.style.left = `${Math.random() * 100}vw`;
            el.style.width = `${Math.random() * 8 + 6}px`;
            el.style.height = `${Math.random() * 10 + 8}px`;
            el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
            el.style.zIndex = '9999';
            el.style.pointerEvents = 'none';

            const duration = Math.random() * 2 + 2.5;
            const horizontalSway = (Math.random() - 0.5) * 150;
            const rotation = Math.random() * 720;

            el.animate([
                { transform: `translate(0, 0) rotate(0deg)`, opacity: 1 },
                { transform: `translate(${horizontalSway}px, 105vh) rotate(${rotation}deg)`, opacity: 0 }
            ], {
                duration: duration * 1000,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            });

            document.body.appendChild(el);
            setTimeout(() => el.remove(), duration * 1000);
        }
    }

    // Floating Celebration Icons (Replacing raw emojis with glowing SVGs)
    function launchBalloons(count) {
        const svgIcons = [
            '<svg class="svg-icon" viewBox="0 0 24 24" style="color:#ff3366;"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
            '<svg class="svg-icon" viewBox="0 0 24 24" style="color:#ffd700;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
            '<svg class="svg-icon" viewBox="0 0 24 24" style="color:#ff80ab;"><path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"/></svg>',
            '<svg class="svg-icon stroke" viewBox="0 0 24 24" style="color:#64ffda;"><path d="M12 7.5a4.5 4.5 0 1 1 4.5 4.5M12 7.5A4.5 4.5 0 1 0 7.5 12M12 7.5V12m4.5 0a4.5 4.5 0 1 1-4.5 4.5m4.5-4.5H12m-4.5 0a4.5 4.5 0 1 0 4.5 4.5m-4.5-4.5H12m0 4.5V21"/><circle cx="12" cy="12" r="2"/></svg>',
            '<svg class="svg-icon stroke" viewBox="0 0 24 24" style="color:#b388ff;"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>'
        ];
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const b = document.createElement('div');
                b.innerHTML = svgIcons[Math.floor(Math.random() * svgIcons.length)];
                b.style.position = 'fixed';
                b.style.bottom = '-50px';
                b.style.left = `${Math.random() * 85 + 5}vw`;
                b.style.width = `${Math.random() * 16 + 28}px`;
                b.style.height = b.style.width;
                b.style.zIndex = '9998';
                b.style.pointerEvents = 'none';

                const svg = b.querySelector('svg');
                if (svg) {
                    svg.style.width = '100%';
                    svg.style.height = '100%';
                    svg.style.filter = 'drop-shadow(0 0 8px currentColor)';
                }

                const duration = Math.random() * 3 + 4;
                b.animate([
                    { transform: 'translate(0, 0) scale(0.8)', opacity: 0.9 },
                    { transform: `translate(${(Math.random() - 0.5) * 100}px, -110vh) scale(1.1)`, opacity: 0 }
                ], {
                    duration: duration * 1000,
                    easing: 'ease-out'
                });

                document.body.appendChild(b);
                setTimeout(() => b.remove(), duration * 1000);
            }, i * 250);
        }
    }


    // ===================================================================
    // 4. EXPERIENCE 2: SCRAPBOOK, 3D GIFT BOX & FLIP SECRET CARDS
    // ===================================================================
    const giftbox = document.getElementById('giftboxInteractive');
    const giftRevealedCard = document.getElementById('giftRevealedCard');
    const recloseGiftBtn = document.getElementById('recloseGiftBtn');
    const flipCards = document.querySelectorAll('.flip-card-wrapper');
    const voucherCards = document.querySelectorAll('.voucher-card');

    // Golden Birthday Vouchers Activation
    voucherCards.forEach(card => {
        const btn = card.querySelector('.voucher-btn');
        const activateVoucher = () => {
            if (isSiteLocked) {
                showLockToast();
                return;
            }
            if (!card.classList.contains('redeemed')) {
                card.classList.add('redeemed');
                const serial = card.querySelector('.voucher-serial')?.textContent?.trim() || 'PASS';
                const title = card.querySelector('.voucher-title')?.textContent?.trim() || '';
                const badge = card.querySelector('.voucher-badge')?.textContent?.trim() || '';
                const desc = card.querySelector('.voucher-desc')?.textContent?.trim() || '';
                if (window.RouTracker) {
                    window.RouTracker.track('voucher_redeemed', {
                        serial,
                        title,
                        badge,
                        desc
                    });
                }
                if (btn) {
                    const t = (window.RouTranslations && window.RouTranslations[currentLang]) || {};
                    btn.innerHTML = `
                        <svg class="svg-icon stroke" viewBox="0 0 24 24" style="width:1.1em;height:1.1em;color:#2ecc71;">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        <span>${t.btn_redeemed || 'Voucher Redeemed Successfully!'}</span>
                    `;
                }
                playSparkleTone();
                launchConfetti(40);
            }
        };

        if (btn) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                activateVoucher();
            });
        }

        card.addEventListener('click', () => {
            activateVoucher();
        });
    });

    // 3D Gift Box Unboxing
    if (giftbox) {
        giftbox.addEventListener('click', () => {
            if (isSiteLocked) {
                showLockToast();
                return;
            }
            if (!giftbox.classList.contains('opened')) {
                giftbox.classList.add('opened');
                if (window.RouTracker) {
                    window.RouTracker.track('giftbox_opened', {
                        title: 'Gift Box Opened',
                        note: 'Rou unboxed the 3D gift box and read the October 10th teaser!'
                    });
                }
                playCelebrationTone();
                launchConfetti(45);
                setTimeout(() => {
                    if (giftRevealedCard) giftRevealedCard.classList.add('show');
                }, 400);
            }
        });
    }

    if (recloseGiftBtn) {
        recloseGiftBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (giftRevealedCard) giftRevealedCard.classList.remove('show');
            setTimeout(() => {
                if (giftbox) giftbox.classList.remove('opened');
            }, 300);
        });
    }

    // 3D Flip Secret Cards
    flipCards.forEach(card => {
        card.addEventListener('click', () => {
            if (isSiteLocked) {
                showLockToast();
                return;
            }
            card.classList.toggle('flipped');
            playSparkleTone();
        });
    });

    // Reasons Jar Logic
    const drawReasonBtn = document.getElementById('drawReasonBtn');
    const quoteDisplay = document.getElementById('reasonQuoteDisplay');
    const reasonCounter = document.getElementById('reasonCounter');
    const jarGraphic = document.getElementById('jarGraphic');

    if (drawReasonBtn) {
        drawReasonBtn.addEventListener('click', () => {
            if (isSiteLocked) {
                showLockToast();
                return;
            }
            if (window.RouTranslations && window.RouTranslations.reasons && window.RouTranslations.reasons[currentLang]) {
                reasonsList = window.RouTranslations.reasons[currentLang];
            }
            if (!reasonsList || reasonsList.length === 0) {
                return;
            }
            hasDrawnReason = true;
            currentReasonIndex = (currentReasonIndex + 1) % reasonsList.length;
            const currentQuote = reasonsList[currentReasonIndex];

            // Animate Jar
            if (jarGraphic) {
                jarGraphic.animate([
                    { transform: 'scale(1) rotate(0deg)' },
                    { transform: 'scale(1.1) rotate(4deg)' },
                    { transform: 'scale(1.1) rotate(-4deg)' },
                    { transform: 'scale(1) rotate(0deg)' }
                ], { duration: 400 });
            }

            // Animate quote transition
            quoteDisplay.style.opacity = '0';
            quoteDisplay.style.transform = 'translateY(10px)';
            setTimeout(() => {
                quoteDisplay.innerHTML = `"${currentQuote}" <svg class="svg-icon" viewBox="0 0 24 24" style="color:var(--accent-gold);width:1em;height:1em;vertical-align:-0.15em;"><path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"/></svg>`;
                quoteDisplay.style.opacity = '1';
                quoteDisplay.style.transform = 'translateY(0)';
                const t = (window.RouTranslations && window.RouTranslations[currentLang]) || {};
                const drawnLabel = t.reason_drawn_label || 'Drawn';
                reasonCounter.textContent = `${drawnLabel}: ${currentReasonIndex + 1} / ${reasonsList.length}`;
                if (window.RouTracker) {
                    window.RouTracker.track('jar_drawn', {
                        title: `Thought #${currentReasonIndex + 1} Drawn`,
                        quote: currentQuote,
                        count: `${currentReasonIndex + 1} / ${reasonsList.length}`
                    });
                }
                playSparkleTone();
            }, 250);
        });
    }


    // ===================================================================
    // 5. EXPERIENCE 3: CONSTELLATIONS & MUSIC LOUNGE
    // ===================================================================
    const starNodes = document.querySelectorAll('.star-node');
    const starModalTitle = document.getElementById('starModalTitle');
    const starModalDesc = document.getElementById('starModalDesc');

    starNodes.forEach(node => {
        node.addEventListener('click', () => {
            if (isSiteLocked) {
                showLockToast();
                return;
            }
            starNodes.forEach(s => s.classList.remove('active'));
            node.classList.add('active');

            const title = node.getAttribute('data-title');
            const desc = node.getAttribute('data-desc');

            starModalTitle.innerHTML = `<svg class="svg-icon" viewBox="0 0 24 24" style="color:var(--accent-gold);width:1.2em;height:1.2em;vertical-align:-0.2em;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> ${title}`;
            starModalDesc.textContent = desc;

            if (window.RouTracker) {
                window.RouTracker.track('star_explored', {
                    title: `Star: ${title}`,
                    desc: desc
                });
            }

            playSparkleTone();
        });
    });

    function drawConstellationLines() {
        const svg = document.getElementById('constellationSvg');
        if (!svg) return;
        // SVG lines could connect node coordinates
        svg.innerHTML = `
            <line x1="18%" y1="25%" x2="48%" y2="15%" stroke="rgba(147, 197, 253, 0.4)" stroke-width="2" stroke-dasharray="4" />
            <line x1="48%" y1="15%" x2="78%" y2="35%" stroke="rgba(147, 197, 253, 0.4)" stroke-width="2" stroke-dasharray="4" />
            <line x1="18%" y1="25%" x2="32%" y2="70%" stroke="rgba(147, 197, 253, 0.4)" stroke-width="2" stroke-dasharray="4" />
            <line x1="32%" y1="70%" x2="66%" y2="68%" stroke="rgba(147, 197, 253, 0.4)" stroke-width="2" stroke-dasharray="4" />
            <line x1="78%" y1="35%" x2="66%" y2="68%" stroke="rgba(147, 197, 253, 0.4)" stroke-width="2" stroke-dasharray="4" />
        `;
    }

    // Music Lounge Player Controls
    const mainPlayBtn = document.getElementById('mainPlayBtn');
    const mainPlayIcon = document.getElementById('mainPlayIcon');
    const cassette = document.querySelector('.cassette-tape');
    const equalizer = document.getElementById('equalizerBars');
    const trackStatus = document.getElementById('trackStatus');

    const rewindBtn = document.getElementById('rewindBtn');
    const forwardBtn = document.getElementById('forwardBtn');

    if (rewindBtn) {
        rewindBtn.addEventListener('click', () => {
            if (isSiteLocked) {
                showLockToast();
                return;
            }
            if (bgAudioElement) {
                bgAudioElement.currentTime = 0;
            }
            if (!isMusicPlaying) startMusicPlayback();
        });
    }

    if (forwardBtn) {
        forwardBtn.addEventListener('click', () => {
            if (isSiteLocked) {
                showLockToast();
                return;
            }
            if (bgAudioElement) {
                bgAudioElement.currentTime = Math.min((bgAudioElement.duration || 1000) - 1, bgAudioElement.currentTime + 10);
            }
            if (!isMusicPlaying) startMusicPlayback();
        });
    }

    if (mainPlayBtn) {
        mainPlayBtn.addEventListener('click', toggleMusic);
    }
    if (audioToggleBtn) {
        audioToggleBtn.addEventListener('click', toggleMusic);
    }

    function toggleMusic() {
        if (isSiteLocked) {
            showLockToast();
            return;
        }
        if (isMusicPlaying) {
            stopMusicPlayback();
        } else {
            startMusicPlayback();
        }
    }

    function startMusicPlayback() {
        isMusicPlaying = true;
        hasMusicStarted = true;
        if (audioToggleBtn) audioToggleBtn.classList.add('playing');
        if (cassette) cassette.classList.add('playing');
        if (equalizer) equalizer.classList.add('active');
        if (mainPlayIcon) {
            mainPlayIcon.innerHTML = '<svg class="svg-icon" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
        }
        const t = (window.RouTranslations && window.RouTranslations[currentLang]) || {};
        if (trackStatus) {
            trackStatus.innerHTML = `${t.track_status_playing || 'Now Playing for You'} <svg class="svg-icon stroke" viewBox="0 0 24 24" style="width:1em;height:1em;vertical-align:-0.15em;"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
        }

        stopSynthesizedMelody();

        // Attempt native audio play if file exists
        if (bgAudioElement) {
            bgAudioElement.play().then(() => {
                stopSynthesizedMelody();
            }).catch(() => {
                // If mp3 fails or doesn't exist, synthesize melody via Web Audio API!
                startSynthesizedMelody();
            });
        } else {
            startSynthesizedMelody();
        }
    }

    function stopMusicPlayback() {
        isMusicPlaying = false;
        if (audioToggleBtn) audioToggleBtn.classList.remove('playing');
        if (cassette) cassette.classList.remove('playing');
        if (equalizer) equalizer.classList.remove('active');
        if (mainPlayIcon) {
            mainPlayIcon.innerHTML = '<svg class="svg-icon" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
        }
        if (trackStatus) {
            trackStatus.textContent = currentLang === 'ar' ? 'متوقف مؤقتاً' : 'Paused';
        }

        if (bgAudioElement) {
            bgAudioElement.pause();
        }
        stopSynthesizedMelody();
    }


    // ===================================================================
    // 6. WEB AUDIO API SYNTHESIZER (Always Works Offline & Instantly)
    // ===================================================================
    function getAudioCtx() {
        if (!audioContext) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            audioContext = new AudioCtx();
        }
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        return audioContext;
    }

    // Sweet Chime note generator
    function playChime(freq, duration = 0.8, type = 'sine') {
        try {
            const ctx = getAudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);

            gain.gain.setValueAtTime(0.18, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) {
            // Ignore audio context errors if blocked
        }
    }

    function playSparkleTone() {
        playChime(523.25, 0.4); // C5
        setTimeout(() => playChime(659.25, 0.4), 100); // E5
        setTimeout(() => playChime(783.99, 0.5), 200); // G5
        setTimeout(() => playChime(1046.50, 0.7), 300); // C6
    }

    function playCelebrationTone() {
        playChime(440, 0.4);
        setTimeout(() => playChime(554.37, 0.4), 120);
        setTimeout(() => playChime(659.25, 0.4), 240);
        setTimeout(() => playChime(880, 0.8), 360);
    }

    // "Happy Birthday" gentle music box melody notes
    const birthdayNotes = [
        { f: 261.63, d: 0.35 }, // C4
        { f: 261.63, d: 0.35 }, // C4
        { f: 293.66, d: 0.7 },  // D4
        { f: 261.63, d: 0.7 },  // C4
        { f: 349.23, d: 0.7 },  // F4
        { f: 329.63, d: 1.2 },  // E4

        { f: 261.63, d: 0.35 }, // C4
        { f: 261.63, d: 0.35 }, // C4
        { f: 293.66, d: 0.7 },  // D4
        { f: 261.63, d: 0.7 },  // C4
        { f: 392.00, d: 0.7 },  // G4
        { f: 349.23, d: 1.2 },  // F4

        { f: 261.63, d: 0.35 }, // C4
        { f: 261.63, d: 0.35 }, // C4
        { f: 523.25, d: 0.7 },  // C5
        { f: 440.00, d: 0.7 },  // A4
        { f: 349.23, d: 0.7 },  // F4
        { f: 329.63, d: 0.7 },  // E4
        { f: 293.66, d: 1.2 }   // D4
    ];

    let noteIdx = 0;
    function startSynthesizedMelody() {
        stopSynthesizedMelody();
        noteIdx = 0;
        playNextNote();
    }

    function playNextNote() {
        if (!isMusicPlaying) return;
        const n = birthdayNotes[noteIdx];
        playChime(n.f, n.d + 0.3, 'triangle');
        noteIdx = (noteIdx + 1) % birthdayNotes.length;
        melodyInterval = setTimeout(playNextNote, (n.d + 0.15) * 1000);
    }

    function stopSynthesizedMelody() {
        if (melodyInterval) {
            clearTimeout(melodyInterval);
            melodyInterval = null;
        }
    }

    // Initialize Language
    applyLanguage(currentLang);

});
