/**
 * Rou's Birthday Experience - Tracker & Notification Configuration
 * 
 * You can configure your email notifications and dashboard settings here.
 * You can also change these settings directly inside dashboard.html!
 */

const ROU_CONFIG = {
    // Web3Forms Access Key for instant email notifications
    web3FormsKey: "83199fed-f688-4cba-b0b4-b8ff887a4bd9",

    // Secret PIN to access dashboard.html (default: 2026)
    dashboardPin: "2026",

    // Cloud Sync Key for real-time dashboard updates across devices (phone & laptop)
    cloudSyncKey: "rou_bday_oct6_2026",

    // Enable/disable notifications
    notifyOnVoucher: true,
    notifyOnCandle: true,
    notifyOnGiftBox: true,
    notifyOnVisit: false
};

// Export for browser
if (typeof window !== 'undefined') {
    window.ROU_CONFIG = ROU_CONFIG;
}
