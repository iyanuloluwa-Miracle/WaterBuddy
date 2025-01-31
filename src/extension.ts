// extension.ts
import * as vscode from 'vscode';

interface WaterBuddyState {
    isActive: boolean;
    reminderInterval?: ReturnType<typeof setInterval>;
    snoozeTimeout?: NodeJS.Timeout;
    statusBarItem: vscode.StatusBarItem;
}

const state: WaterBuddyState = {
    isActive: false,
    statusBarItem: vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    )
};

export function activate(context: vscode.ExtensionContext) {
    // Initialize status bar item
    state.statusBarItem.text = "$(drop) WaterBuddy: Off";
    state.statusBarItem.command = 'waterBuddy.toggleReminder';
    state.statusBarItem.tooltip = "Click to toggle water reminders";
    context.subscriptions.push(state.statusBarItem);
    state.statusBarItem.show();

    // Register toggle command
    const toggleCommand = vscode.commands.registerCommand('waterBuddy.toggleReminder', async () => {
        try {
            if (state.isActive) {
                const stopped = await stopReminder();
                if (stopped) {
                    await vscode.window.showInformationMessage('Water reminder turned off');
                }
            } else {
                await startReminder();
                await vscode.window.showInformationMessage('Water reminder turned on');
            }
        } catch (error) {
            console.error('Failed to toggle reminder:', error);
            vscode.window.showErrorMessage('Failed to toggle water reminder');
        }
    });

    context.subscriptions.push(toggleCommand);

    // Register configuration change listener
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(async (e) => {
            if (e.affectsConfiguration('waterBuddy.intervalInMinutes') && state.isActive) {
                await stopReminder();
                await startReminder();
            }
        })
    );

    // Auto-start if previously active
    const wasActive = context.globalState.get<boolean>('waterBuddy.wasActive', false);
    if (wasActive) {
        startReminder();
    }
}

async function startReminder(): Promise<void> {
    try {
        if (state.isActive) {
            await stopReminder(); // Clean up existing reminder if any
        }

        const config = vscode.workspace.getConfiguration('waterBuddy');
        let intervalInMinutes = config.get<number>('intervalInMinutes') || 30;

        // Validate interval
        if (intervalInMinutes < 1) {
            intervalInMinutes = 30;
            await vscode.window.showWarningMessage(
                'Invalid interval value. Using default value of 30 minutes.'
            );
        }

        state.reminderInterval = setInterval(
            showReminderNotification,
            intervalInMinutes * 60 * 1000
        );

        state.isActive = true;
        state.statusBarItem.text = "$(drop) WaterBuddy: On";
    } catch (error) {
        console.error('Failed to start reminder:', error);
        throw error;
    }
}

async function stopReminder(): Promise<boolean> {
    try {
        if (state.reminderInterval) {
            clearInterval(state.reminderInterval);
            state.reminderInterval = undefined;
        }

        if (state.snoozeTimeout) {
            clearTimeout(state.snoozeTimeout);
            state.snoozeTimeout = undefined;
        }

        state.isActive = false;
        state.statusBarItem.text = "$(drop) WaterBuddy: Off";
        return true;
    } catch (error) {
        console.error('Failed to stop reminder:', error);
        return false;
    }
}

async function handleSnooze(): Promise<void> {
    try {
        if (state.snoozeTimeout) {
            clearTimeout(state.snoozeTimeout);
        }

        await stopReminder();
        state.statusBarItem.text = "$(drop) WaterBuddy: Snoozing...";

        state.snoozeTimeout = setTimeout(async () => {
            state.snoozeTimeout = undefined;
            await startReminder();
        }, 15 * 60 * 1000); // 15 minutes

        await vscode.window.showInformationMessage('Reminder snoozed for 15 minutes');
    } catch (error) {
        console.error('Failed to snooze:', error);
        await startReminder(); // Restart the reminder if snooze fails
    }
}

async function showReminderNotification(): Promise<void> {
    try {
        const action = await vscode.window.showInformationMessage(
            '💧 Time for a water break! Stay hydrated for better productivity.',
            'Dismiss',
            'Snooze 15min',
            'Mark as Done'
        );

        if (action === 'Snooze 15min') {
            await handleSnooze();
        } else if (action === 'Mark as Done') {
            await vscode.window.showInformationMessage('🎉 Great job staying hydrated!');
        }
    } catch (error) {
        console.error('Failed to show notification:', error);
    }
}

export function deactivate(context: vscode.ExtensionContext) {
    // Save state for next session
    context.globalState.update('waterBuddy.wasActive', state.isActive);
    
    // Clean up
    stopReminder();
    state.statusBarItem.dispose();
}