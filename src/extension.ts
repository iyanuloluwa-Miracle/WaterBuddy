import * as vscode from 'vscode';

let reminderInterval: ReturnType<typeof setInterval> | undefined;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );
    statusBarItem.text = "$(drop) WaterBuddy: On";
    statusBarItem.command = 'waterBuddy.toggleReminder';
    statusBarItem.tooltip = "Click to toggle water reminders";
    context.subscriptions.push(statusBarItem);
    statusBarItem.show(); // Make the status bar item visible

    // Register command to toggle reminders
    const toggleCommand = vscode.commands.registerCommand('waterBuddy.toggleReminder', () => {
        if (reminderInterval) {
            stopReminder();
        } else {
            startReminder();
        }
    });

    context.subscriptions.push(toggleCommand);

    // Automatically start reminders when the extension activates
    startReminder();
}

function startReminder() {
    const config = vscode.workspace.getConfiguration('waterBuddy');
    const intervalInMinutes = config.get<number>('intervalInMinutes') || 30;

    // Validate the interval value
    if (intervalInMinutes <= 0) {
        vscode.window.showWarningMessage(
            'Invalid interval value. Using default value of 30 minutes.'
        );
        reminderInterval = setInterval(() => {
            showReminderNotification();
        }, 30 * 60 * 1000);
    } else {
        reminderInterval = setInterval(() => {
            showReminderNotification();
        }, intervalInMinutes * 60 * 1000);
    }

    statusBarItem.text = "$(drop) Water Buddy: On";
}

function stopReminder() {
    if (reminderInterval) {
        clearInterval(reminderInterval);
        reminderInterval = undefined;
    }
    statusBarItem.text = "$(drop) Water Reminder: Off";
}

async function showReminderNotification() {
    const action = await vscode.window.showInformationMessage(
        '💧 Time for a water break! Stay hydrated for better productivity.',
        'Dismiss',
        'Snooze 15min',
        'Mark as Done'
    );

    if (action === 'Snooze 15min') {
        stopReminder();
        setTimeout(startReminder, 15 * 60 * 1000); // Snooze for 10 minutes
    } else if (action === 'Mark as Done') {
        vscode.window.showInformationMessage('🎉 Great job staying hydrated!');
    }
}

export function deactivate() {
    stopReminder();
}
