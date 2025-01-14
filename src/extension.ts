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
    statusBarItem.command = 'WaterBuddy.toggleReminder';
    context.subscriptions.push(statusBarItem);

    // Register command to toggle reminder
    let toggleCommand = vscode.commands.registerCommand('WaterBuddy.toggleReminder', () => {
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
    const config = vscode.workspace.getConfiguration('waterBuddy');
    const intervalInMinutes = config.get<number>('intervalInMinutes') || 30;
    
    reminderInterval = setInterval(() => {
        showReminderNotification();
    }, intervalInMinutes * 60 * 1000);
    
    statusBarItem.text = "$(drop) Water Buddy: On";
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
        'Snooze 10min',
        'Mark as Done'

    );

    if (action === 'Snooze 10min') {
        stopReminder();
        setTimeout(startReminder, 10 * 60 * 1000); // Snooze for 10 minutes
    } else if (action === 'Mark as Done') {
        vscode.window.showInformationMessage('🎉 Great job staying active!');
    }
}

export function deactivate() {
    stopReminder();
}