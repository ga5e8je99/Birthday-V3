/**
 * Rou's Birthday Experience - Real-Time Event Tracker & Dispatcher
 * Tracks vouchers, candle blowing, gift unboxing, stars, and visits.
 * Dispatches to:
 * 1. Email via Web3Forms API
 * 2. Cross-device Cloud Sync (KVdb.io & ntfy.sh)
 * 3. Local Server API (/api/track)
 * 4. LocalStorage for offline/instant dashboard view
 */

const RouTracker = (function () {
    const STORAGE_KEY = 'rou_birthday_events';
    const CONFIG_KEY = 'rou_web3forms_key';

    // Get active Web3Forms key
    function getAccessKey() {
        const stored = localStorage.getItem(CONFIG_KEY);
        if (stored && stored.trim() !== '') return stored.trim();
        if (window.ROU_CONFIG && window.ROU_CONFIG.web3FormsKey && window.ROU_CONFIG.web3FormsKey !== 'YOUR_WEB3FORMS_ACCESS_KEY') {
            return window.ROU_CONFIG.web3FormsKey.trim();
        }
        return '';
    }

    // Save key
    function setAccessKey(key) {
        localStorage.setItem(CONFIG_KEY, (key || '').trim());
    }

    // Read stored events
    function getLocalEvents() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    // Save event locally
    function saveLocalEvent(event) {
        try {
            const events = getLocalEvents();
            events.unshift(event); // newest first
            localStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(0, 100)));
        } catch (e) {
            console.warn('Storage save error:', e);
        }
    }

    // Format human readable date & time
    function getFormattedTimestamp() {
        const now = new Date();
        return {
            iso: now.toISOString(),
            formatted: now.toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short'
            }),
            timeOnly: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
    }

    // Send Email via Web3Forms
    async function sendEmailNotification(subject, detailsHtml, rawText) {
        const key = getAccessKey();
        if (!key) {
            return { success: false, reason: 'no_key' };
        }

        try {
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    access_key: key,
                    subject: subject,
                    from_name: "Rou's Birthday Experience 🎂",
                    message: rawText,
                    html: detailsHtml
                })
            });
            const result = await response.json();
            return result;
        } catch (err) {
            console.warn('Email dispatch failed silently:', err);
            return { success: false, error: err };
        }
    }

    // Send to local Python/Node server if running
    async function sendToLocalServer(event) {
        try {
            await fetch('/api/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(event)
            });
        } catch (e) {
            // Local server not running or static host, ignore
        }
    }

    // Cross-device cloud sync via KVdb.io
    async function syncToCloud(event) {
        const syncKey = (window.ROU_CONFIG && window.ROU_CONFIG.cloudSyncKey) || 'rou_bday_oct6_2026';
        try {
            // Read existing events from cloud
            const readRes = await fetch(`https://kvdb.io/4yKqPqM1WjV7mB9L2qfH9A/${syncKey}`);
            let list = [];
            if (readRes.ok) {
                try {
                    list = await readRes.json();
                    if (!Array.isArray(list)) list = [];
                } catch (e) {}
            }
            list.unshift(event);
            if (list.length > 50) list = list.slice(0, 50);

            // Write back to cloud
            await fetch(`https://kvdb.io/4yKqPqM1WjV7mB9L2qfH9A/${syncKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(list)
            });
        } catch (e) {
            // Silent fail
        }
    }

    // Fetch cloud events for Dashboard
    async function fetchCloudEvents() {
        const syncKey = (window.ROU_CONFIG && window.ROU_CONFIG.cloudSyncKey) || 'rou_bday_oct6_2026';
        try {
            const res = await fetch(`https://kvdb.io/4yKqPqM1WjV7mB9L2qfH9A/${syncKey}?t=${Date.now()}`);
            if (res.ok) {
                const cloudList = await res.json();
                if (Array.isArray(cloudList)) {
                    // Merge with local storage
                    const localList = getLocalEvents();
                    const combinedMap = new Map();
                    [...cloudList, ...localList].forEach(ev => {
                        if (ev && ev.id) combinedMap.set(ev.id, ev);
                    });
                    const merged = Array.from(combinedMap.values()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
                    return merged;
                }
            }
        } catch (e) {}
        return getLocalEvents();
    }

    // Main tracking method
    async function track(type, data = {}) {
        const timeInfo = getFormattedTimestamp();
        const eventId = 'ev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

        const event = {
            id: eventId,
            type: type,
            data: data,
            timestamp: timeInfo.iso,
            formattedTime: timeInfo.formatted,
            timeOnly: timeInfo.timeOnly
        };

        // 1. Save locally
        saveLocalEvent(event);

        // 2. Sync to local backend if running
        sendToLocalServer(event);

        // 3. Sync to cross-device cloud
        syncToCloud(event);

        // 4. Trigger Email Notification based on event type
        if (type === 'voucher_redeemed') {
            const subject = `🎉 Rou Redeemed: ${data.serial} - ${data.title}!`;
            const text = `Exciting News! Rou just redeemed a voucher on her birthday website!\n\n` +
                         `Voucher: ${data.serial} • ${data.title}\n` +
                         `Badge: ${data.badge}\n` +
                         `Time: ${timeInfo.formatted}\n\n` +
                         `Description: "${data.desc}"\n`;
            const html = `
                <div style="font-family:sans-serif;max-width:550px;margin:auto;padding:24px;border:2px solid #f8d070;border-radius:14px;background:#1a081a;color:#fff;">
                    <h2 style="color:#ffd700;margin-top:0;">🎉 Rou Redeemed a Birthday Pass!</h2>
                    <div style="background:rgba(255,255,255,0.08);padding:18px;border-radius:10px;border-left:4px solid #ff4b72;margin:16px 0;">
                        <span style="color:#ff8da1;font-size:0.85rem;font-weight:bold;letter-spacing:1px;">${data.serial}</span>
                        <h3 style="color:#fff;margin:6px 0 10px;">${data.title}</h3>
                        <p style="color:#ddd;font-size:0.95rem;line-height:1.6;">${data.desc || ''}</p>
                        <span style="display:inline-block;background:#ffd700;color:#1a081a;padding:4px 10px;border-radius:20px;font-size:0.8rem;font-weight:bold;">${data.badge || 'Redeemed'}</span>
                    </div>
                    <p style="color:#bbb;font-size:0.85rem;margin-bottom:0;">🕒 Redeemed on: <strong>${timeInfo.formatted}</strong></p>
                </div>
            `;
            sendEmailNotification(subject, html, text);
        } else if (type === 'candle_blown') {
            const subject = `🎂 Rou Blew Out the Candle and Made a Wish!`;
            const text = `Rou just blew out the candle on her 3D Birthday Cake at ${timeInfo.formatted}!`;
            const html = `
                <div style="font-family:sans-serif;max-width:550px;margin:auto;padding:24px;border:2px solid #ff4b72;border-radius:14px;background:#1a081a;color:#fff;">
                    <h2 style="color:#ff4b72;margin-top:0;">🎂 Candle Blown!</h2>
                    <p style="color:#eee;font-size:1.05rem;">Rou just made her birthday wish and blew out the candle on the cake!</p>
                    <p style="color:#bbb;font-size:0.85rem;">🕒 Time: <strong>${timeInfo.formatted}</strong></p>
                </div>
            `;
            sendEmailNotification(subject, html, text);
        } else if (type === 'giftbox_opened') {
            const subject = `🎁 Rou Opened the Morning Surprise Box!`;
            const text = `Rou opened the 3D gift box and saw the morning surprise message at ${timeInfo.formatted}!`;
            const html = `
                <div style="font-family:sans-serif;max-width:550px;margin:auto;padding:24px;border:2px solid #ffd700;border-radius:14px;background:#1a081a;color:#fff;">
                    <h2 style="color:#ffd700;margin-top:0;">🎁 Morning Gift Box Opened!</h2>
                    <p style="color:#eee;font-size:1.05rem;">Rou just opened the 3D mystery box to reveal the October 6th morning gift teaser!</p>
                    <p style="color:#bbb;font-size:0.85rem;">🕒 Time: <strong>${timeInfo.formatted}</strong></p>
                </div>
            `;
            sendEmailNotification(subject, html, text);
        }

        return event;
    }

    // Send a test email from dashboard
    async function sendTestEmail(testKey) {
        const key = testKey || getAccessKey();
        if (!key) {
            return { success: false, message: 'Please enter a valid Web3Forms Access Key first!' };
        }

        try {
            const res = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    access_key: key,
                    subject: '✅ Test Alert from Rou Birthday Dashboard',
                    from_name: "Rou Birthday Tracker 🎂",
                    message: `Congratulations! Your email notification is connected and working perfectly!\nYou will receive instant alerts here whenever Rou interacts with her birthday website.\nSent at: ${new Date().toLocaleString()}`
                })
            });
            const data = await res.json();
            return data;
        } catch (e) {
            return { success: false, message: e.message };
        }
    }

    // Clear history
    function clearEvents() {
        localStorage.removeItem(STORAGE_KEY);
    }

    return {
        track,
        getEvents: getLocalEvents,
        fetchCloudEvents,
        getAccessKey,
        setAccessKey,
        sendTestEmail,
        clearEvents
    };
})();

// Attach globally
if (typeof window !== 'undefined') {
    window.RouTracker = RouTracker;
}
