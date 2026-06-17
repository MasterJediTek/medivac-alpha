
/**
 * Python Hitch Automation Service
 * 
 * Provides automated task scheduling and execution for MediVac One.
 * Named after the Python programming language's flexibility and the
 * concept of "hitching" tasks together for seamless automation.
 * 
 * Features:
 * - Scheduled task execution
 * - Event-driven triggers
 * - Data synchronization automation
 * - Report generation
 * - Alert management
 */

// Task Types
export type HitchTaskType = 
  | "sync"           // Data synchronization
  | "backup"         // Cloud backup
  | "report"         // Report generation
  | "alert"          // Alert monitoring
  | "cleanup"        // Cache cleanup
  | "validate"       // Data validation
  | "export"         // Data export
  | "import"         // Data import
  | "notify"         // Push notifications
  | "custom";        // Custom tasks

// Task Status
export type HitchTaskStatus = 
  | "idle"           // Not running
  | "scheduled"      // Waiting for trigger
  | "running"        // Currently executing
  | "completed"      // Successfully completed
  | "failed"         // Execution failed
  | "cancelled";     // Cancelled by user

// Task Priority
export type HitchPriority = "low" | "normal" | "high" | "critical";

// Trigger Types
export type HitchTrigger = 
  | { type: "interval"; interval: number }           // Repeat every N milliseconds
  | { type: "cron"; expression: string }             // Cron expression
  | { type: "event"; event: string }                 // Event-driven
  | { type: "manual" }                               // Manual trigger only
  | { type: "startup" }                              // Run on app startup
  | { type: "condition"; condition: () => boolean }; // Conditional trigger