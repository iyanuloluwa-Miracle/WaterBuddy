
export const CONSTANTS = {
    DEFAULT_INTERVAL: 30,
    MIN_INTERVAL: 1,
    MAX_INTERVAL: 240,
    SNOOZE_TIME: 15,
    STATUS_BAR: {
        PRIORITY: 100,
        ON_TEXT: "$(drop) WaterBuddy: On",
        OFF_TEXT: "$(drop) WaterBuddy: Off",
        SNOOZE_TEXT: "$(drop) WaterBuddy: Snoozing...",
        TOOLTIP: "Click to toggle water reminders"
    },
    MESSAGES: {
        HYDRATION_REMINDER: '💧 Time for a water break! Stay hydrated for better productivity.',
        COMPLETION: '🎉 Great job staying hydrated!',
        TOGGLE_ON: 'Water reminder turned on',
        TOGGLE_OFF: 'Water reminder turned off',
        SNOOZE: 'Reminder snoozed for 15 minutes',
        INVALID_INTERVAL: 'Invalid interval value. Using default value of 30 minutes.',
        TOGGLE_ERROR: 'Failed to toggle water reminder'
    },
    STORAGE_KEYS: {
        WAS_ACTIVE: 'waterBuddy.wasActive'
    }
};
