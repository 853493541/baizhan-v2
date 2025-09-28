"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentWeek = getCurrentWeek;
function getCurrentWeek() {
    const now = new Date();
    // Convert to China Standard Time (UTC+8)
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const cst = new Date(utc + 8 * 60 * 60 * 1000);
    // Shift back by 7 hours so reset is at Monday 07:00 CST
    const shifted = new Date(cst.getTime() - 7 * 60 * 60 * 1000);
    // Get ISO week number in CST (weeks start Monday)
    const jan4 = new Date(shifted.getFullYear(), 0, 4);
    const jan4Day = (jan4.getDay() + 6) % 7; // Monday=0
    const week1 = new Date(jan4);
    week1.setDate(jan4.getDate() - jan4Day);
    const diff = shifted.getTime() - week1.getTime();
    const weekNo = 1 + Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
    return `${shifted.getFullYear()}-W${weekNo}`;
}
