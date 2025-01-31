// src/services/statusBar.service.ts
import * as vscode from 'vscode';
import { CONSTANTS } from '../constants';

export class StatusBarService {
    private statusBarItem: vscode.StatusBarItem;

    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            CONSTANTS.STATUS_BAR.PRIORITY
        );
        this.statusBarItem.command = 'waterBuddy.toggleReminder';
        this.statusBarItem.tooltip = CONSTANTS.STATUS_BAR.TOOLTIP;
    }

    public show(): void {
        this.statusBarItem.show();
    }

    public setOn(): void {
        this.statusBarItem.text = CONSTANTS.STATUS_BAR.ON_TEXT;
    }

    public setOff(): void {
        this.statusBarItem.text = CONSTANTS.STATUS_BAR.OFF_TEXT;
    }

    public setSnoozing(): void {
        this.statusBarItem.text = CONSTANTS.STATUS_BAR.SNOOZE_TEXT;
    }

    public dispose(): void {-
        this.statusBarItem.dispose();
    }
}
