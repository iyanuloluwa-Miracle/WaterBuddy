
import * as vscode from 'vscode';
import { WaterBuddyState, NotificationAction } from '../types/waterbuddy.types';
import { CONSTANTS } from '../constants';
import { StatusBarService } from './statusBar.service';

export class ReminderService {
    private state: WaterBuddyState;
    private statusBarService: StatusBarService;

    constructor(statusBarService: StatusBarService) {
        this.statusBarService = statusBarService;
        this.state = {
            isActive: false,
            statusBarItem: statusBarService['statusBarItem']
        };
    }

    public async start(): Promise<void> {
        try {
            if (this.state.isActive) {
                await this.stop();
            }

            const intervalInMinutes = this.getValidatedInterval();
            
            this.state.reminderInterval = setInterval(
                () => this.showNotification(),
                intervalInMinutes * 60 * 1000
            );

            this.state.isActive = true;
            this.statusBarService.setOn();
            await vscode.window.showInformationMessage(CONSTANTS.MESSAGES.TOGGLE_ON);
        } catch (error) {
            console.error('Failed to start reminder:', error);
            throw error;
        }
    }

    public async stop(): Promise<boolean> {
        try {
            if (this.state.reminderInterval) {
                clearInterval(this.state.reminderInterval);
                this.state.reminderInterval = undefined;
            }

            if (this.state.snoozeTimeout) {
                clearTimeout(this.state.snoozeTimeout);
                this.state.snoozeTimeout = undefined;
            }

            this.state.isActive = false;
            this.statusBarService.setOff();
            return true;
        } catch (error) {
            console.error('Failed to stop reminder:', error);
            return false;
        }
    }

    private getValidatedInterval(): number {
        const config = vscode.workspace.getConfiguration('waterBuddy');
        let intervalInMinutes = config.get<number>('intervalInMinutes') || CONSTANTS.DEFAULT_INTERVAL;

        if (intervalInMinutes < CONSTANTS.MIN_INTERVAL || intervalInMinutes > CONSTANTS.MAX_INTERVAL) {
            vscode.window.showWarningMessage(CONSTANTS.MESSAGES.INVALID_INTERVAL);
            return CONSTANTS.DEFAULT_INTERVAL;
        }

        return intervalInMinutes;
    }

    private async handleSnooze(): Promise<void> {
        try {
            if (this.state.snoozeTimeout) {
                clearTimeout(this.state.snoozeTimeout);
                this.state.snoozeTimeout = undefined;
            }
    
            await this.stop();
            this.statusBarService.setSnoozing();
    
            this.state.snoozeTimeout = setTimeout(async () => {
                this.state.snoozeTimeout = undefined;
                await this.start();
            }, CONSTANTS.SNOOZE_TIME * 60 * 1000);
    
            await vscode.window.showInformationMessage(CONSTANTS.MESSAGES.SNOOZE);
        } catch (error) {
            console.error('Failed to snooze:', error);
            await this.start();
        }
    }

    private async showNotification(): Promise<void> {
        try {
            const action = await vscode.window.showInformationMessage(
                CONSTANTS.MESSAGES.HYDRATION_REMINDER,
                'Dismiss',
                'Snooze 15min',
                'Mark as Done'
            ) as NotificationAction;
    
            if (action === 'Snooze 15min') {
                await this.handleSnooze();
            } else if (action === 'Mark as Done') {
                await vscode.window.showInformationMessage(CONSTANTS.MESSAGES.COMPLETION);
            }
        } catch (error) {
            console.error('Failed to show notification:', error);
        }
    }

    public isActive(): boolean {
        return this.state.isActive;
    }
}
