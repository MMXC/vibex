/**
 * scripts/test/notify.js — Test notification entry point
 * Re-exports from scripts/test-notify.js (E3 deliverable)
 * 
 * Usage:
 *   node scripts/test/notify.js --status passed --duration 120s --tests 100
 *   node scripts/test/notify.js --status failed --duration 120s --errors 3 --tests 100
 */

module.exports = require('../test-notify.js');
