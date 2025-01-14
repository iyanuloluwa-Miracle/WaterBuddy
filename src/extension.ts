// src/extension.ts
import * as vscode from 'vscode';

let reminderInterval: NodeJS.Timer | undefined;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );
    statusBarItem.text = "$(drop) Stay Hydrated!";
    statusBarItem.command = 'water-reminder.toggleReminder';
    context.subscriptions.push(statusBarItem);

    // Register command to toggle reminder
    let toggleCommand = vscode.commands.registerCommand('water-reminder.toggleReminder', () => {
        if (reminderInterval) {
            stopReminder();
        } else {
            startReminder();
        }
    });

    context.subscriptions.push(toggleCommand);
    
    // Start reminder by default
    startReminder();
}

function startReminder() {
    const config = vscode.workspace.getConfiguration('waterReminder');
    const intervalInMinutes = config.get<number>('intervalInMinutes') || 30;
    
    reminderInterval = setInterval(() => {
        showReminderNotification();
    }, intervalInMinutes * 60 * 1000);
    
    statusBarItem.text = "$(drop) Water Reminder: On";
    statusBarItem.show();
}

function stopReminder() {
    if (reminderInterval) {
        clearInterval(reminderInterval as NodeJS.Timeout);
        reminderInterval = undefined;
    }
    statusBarItem.text = "$(drop) Water Reminder: Off";
}

async function showReminderNotification() {
    const action = await vscode.window.showInformationMessage(
        '💧 Time for a water break! Stay hydrated for better productivity.',
        'Dismiss',
        'Snooze 15min'
    );

    if (action === 'Snooze 15min') {
        stopReminder();
        setTimeout(startReminder, 15 * 60 * 1000);
    }
}

export function deactivate() {
    stopReminder();
}