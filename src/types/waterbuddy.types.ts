
import * as vscode from 'vscode';

export interface WaterBuddyState {
    isActive: boolean;
    reminderInterval?: ReturnType<typeof setInterval>;
    snoozeTimeout?: NodeJS.Timeout;
    statusBarItem: vscode.StatusBarItem;
}

export interface WaterBuddyConfig {
    intervalInMinutes: number;
}

export type NotificationAction = 'Dismiss' | 'Snooze 15min' | 'Mark as Done';