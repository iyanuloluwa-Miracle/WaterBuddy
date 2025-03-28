// extension.ts
import * as vscode from "vscode";

interface WaterBuddyState {
  isActive: boolean;
  reminderInterval?: ReturnType<typeof setInterval>;
  snoozeTimeout?: NodeJS.Timeout;
  statusBarItem: vscode.StatusBarItem;
  lastReminderTime?: number;
  transitionInProgress: boolean;
}

const state: WaterBuddyState = {
  isActive: false,
  statusBarItem: vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  ),
  transitionInProgress: false
};

// Configuration validation
function validateConfiguration(): { intervalInMinutes: number, isValid: boolean } {
  const config = vscode.workspace.getConfiguration("waterBuddy");
  let intervalInMinutes = config.get<number>("intervalInMinutes") || 30;

  // Ensure interval is within valid range (1 minute to 24 hours)
  if (intervalInMinutes < 1 || intervalInMinutes > 1440) {
    vscode.window.showWarningMessage(
      `Invalid interval value (${intervalInMinutes}). Using default value of 30 minutes.`
    );
    intervalInMinutes = 30;
    return { intervalInMinutes, isValid: false };
  }

  return { intervalInMinutes, isValid: true };
}

export function activate(context: vscode.ExtensionContext) {
  // Initialize status bar item
  state.statusBarItem.text = "$(drop) WaterBuddy: Off";
  state.statusBarItem.command = "waterBuddy.toggleReminder";
  state.statusBarItem.tooltip = "Click to toggle water reminders";
  context.subscriptions.push(state.statusBarItem);
  state.statusBarItem.show();

  // Register toggle command
  const toggleCommand = vscode.commands.registerCommand(
    "waterBuddy.toggleReminder",
    async () => {
      if (state.transitionInProgress) {
        vscode.window.showInformationMessage("Please wait, transition in progress...");
        return;
      }

      try {
        state.transitionInProgress = true;
        
        if (state.isActive) {
          const stopped = await stopReminder();
          if (stopped) {
            await vscode.window.showInformationMessage(
              "Water reminder turned off"
            );
          }
        } else {
          const { isValid } = validateConfiguration();
          if (isValid) {
            await startReminder();
            await vscode.window.showInformationMessage(
              "Water reminder turned on"
            );
          }
        }
      } catch (error) {
        console.error("Failed to toggle reminder:", error);
        vscode.window.showErrorMessage(
          `Failed to toggle water reminder: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      } finally {
        state.transitionInProgress = false;
      }
    }
  );

  context.subscriptions.push(toggleCommand);

  // Register configuration change listener
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(async (e) => {
      if (
        e.affectsConfiguration("waterBuddy.intervalInMinutes") &&
        state.isActive
      ) {
        const { isValid } = validateConfiguration();
        if (isValid) {
          await stopReminder();
          await startReminder();
          vscode.window.showInformationMessage("Reminder interval updated successfully");
        }
      }
    })
  );

  // Auto-start if previously active
  const wasActive = context.globalState.get<boolean>(
    "waterBuddy.wasActive",
    false
  );
  if (wasActive) {
    startReminder().catch(error => {
      console.error("Failed to auto-start reminder:", error);
    });
  }
}

async function startReminder(): Promise<void> {
  try {
    if (state.isActive) {
      await stopReminder(); // Clean up existing reminder if any
    }

    const { intervalInMinutes, isValid } = validateConfiguration();
    if (!isValid) {
      throw new Error("Invalid configuration");
    }

    state.reminderInterval = setInterval(
      showReminderNotification,
      intervalInMinutes * 60 * 1000
    );

    state.isActive = true;
    state.lastReminderTime = Date.now();
    state.statusBarItem.text = "$(drop) WaterBuddy: On";
    updateStatusBarTooltip();
  } catch (error) {
    console.error("Failed to start reminder:", error);
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
    state.lastReminderTime = undefined;
    state.statusBarItem.text = "$(drop) WaterBuddy: Off";
    updateStatusBarTooltip();
    return true;
  } catch (error) {
    console.error("Failed to stop reminder:", error);
    return false;
  }
}

function updateStatusBarTooltip(): void {
  const baseTooltip = "Click to toggle water reminders";
  if (state.isActive && state.lastReminderTime) {
    const timeSinceLastReminder = Math.floor((Date.now() - state.lastReminderTime) / 1000 / 60);
    state.statusBarItem.tooltip = `${baseTooltip}\nLast reminder: ${timeSinceLastReminder} minutes ago`;
  } else {
    state.statusBarItem.tooltip = baseTooltip;
  }
}

async function handleSnooze(): Promise<void> {
  if (state.transitionInProgress) {
    return;
  }

  try {
    state.transitionInProgress = true;

    if (state.snoozeTimeout) {
      clearTimeout(state.snoozeTimeout);
    }

    await stopReminder();
    state.statusBarItem.text = "$(drop) WaterBuddy: Snoozing...";
    updateStatusBarTooltip();

    state.snoozeTimeout = setTimeout(async () => {
      try {
        state.snoozeTimeout = undefined;
        await showReminderNotification();
        await startReminder();
      } catch (error) {
        console.error("Error in snooze timeout handler:", error);
        await startReminder(); // Attempt to restore normal operation
      }
    }, 15 * 60 * 1000); // 15 minutes

    await vscode.window.showInformationMessage(
      "Reminder snoozed for 15 minutes"
    );
  } catch (error) {
    console.error("Failed to snooze:", error);
    await startReminder(); // Restart the reminder if snooze fails
  } finally {
    state.transitionInProgress = false;
  }
}

async function showReminderNotification(): Promise<void> {
  try {
    state.lastReminderTime = Date.now();
    updateStatusBarTooltip();

    const action = await vscode.window.showInformationMessage(
      " Time for a water break! Stay hydrated for better productivity.",
      "Dismiss",
      "Snooze 15min",
      "Mark as Done"
    );

    if (action === "Snooze 15min") {
      await handleSnooze();
    } else if (action === "Mark as Done") {
      await vscode.window.showInformationMessage(
        " Great job staying hydrated!"
      );
    }
  } catch (error) {
    console.error("Failed to show notification:", error);
    // Don't rethrow - we want to keep the reminder running even if notification fails
  }
}

export function deactivate(context: vscode.ExtensionContext) {
  try {
    // Save state for next session
    context.globalState.update("waterBuddy.wasActive", state.isActive);

    // Clean up
    stopReminder();
    state.statusBarItem.dispose();
  } catch (error) {
    console.error("Error during deactivation:", error);
  }
}
