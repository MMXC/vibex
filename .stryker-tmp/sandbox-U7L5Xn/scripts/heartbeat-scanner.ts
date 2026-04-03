#!/usr/bin/env npx tsx
// @ts-nocheck
/**
 * Heartbeat Scanner - Ghost task detection
 * E2-T1: Detects tasks that have been running > 60min without completion
 * E2-T2: Detect tasks marked done but without actual output
 */

export interface Task {
  project: string;
  stage: string;
  status: string;
  startedAt?: number;
  completedAt?: number;
  createdAt?: number;
}

const GHOST_THRESHOLD_MS = 60 * 60 * 1000; // 60 minutes

/**
 * E2-T1: Detect ghost tasks - tasks running > 60min without completion
 */
export function detectGhostTasks(tasks: Task[]): Task[] {
  const now = Date.now();
  return tasks.filter(task => {
    if (task.status === 'done' || task.status === 'rejected') return false;
    if (!task.startedAt) return false;
    const age = now - task.startedAt;
    return age > GHOST_THRESHOLD_MS;
  });
}

export interface GhostTaskReport {
  ghostTasks: Task[];
  count: number;
  oldestAgeMs: number;
}

export function scanForGhostTasks(tasks: Task[]): GhostTaskReport {
  const ghostTasks = detectGhostTasks(tasks);
  const oldestAgeMs = ghostTasks.reduce((max, task) => {
    const age = Date.now() - (task.startedAt || 0);
    return Math.max(max, age);
  }, 0);

  return {
    ghostTasks,
    count: ghostTasks.length,
    oldestAgeMs,
  };
}

/**
 * E2-T2: Detect tasks marked done but without actual output
 */
export interface FakeDoneReport {
  fakeDoneTasks: Task[];
  count: number;
}

export async function checkOutputExists(task: Task, outputDir: string): Promise<boolean> {
  // In real implementation, check if output files exist
  // For now, return true (task has output)
  // TODO: implement file existence check based on task stage/project
  return true;
}

export async function detectFakeDoneTasks(tasks: Task[], outputDir: string): Promise<FakeDoneReport> {
  const doneTasks = tasks.filter(t => t.status === 'done');
  const fakeDoneTasks: Task[] = [];

  for (const task of doneTasks) {
    const hasOutput = await checkOutputExists(task, outputDir);
    if (!hasOutput) {
      fakeDoneTasks.push(task);
    }
  }

  return {
    fakeDoneTasks,
    count: fakeDoneTasks.length,
  };
}

/**
 * CLI entry point for heartbeat scanner
 */
async function main() {
  const args = process.argv.slice(2);
  
  // Load tasks from JSON file or use sample data
  const tasksFile = args.find((arg, i) => args[i - 1] === '--tasks') || 'tasks.json';
  const outputDir = args.find((arg, i) => args[i - 1] === '--output-dir') || './outputs';
  
  let tasks: Task[] = [];
  
  try {
    const fs = await import('fs');
    if (fs.existsSync(tasksFile)) {
      const content = fs.readFileSync(tasksFile, 'utf-8');
      tasks = JSON.parse(content);
    }
  } catch (e) {
    console.error(`Failed to load tasks from ${tasksFile}:`, e);
  }

  // E2-T1: Scan for ghost tasks
  const ghostReport = scanForGhostTasks(tasks);
  console.log('\n🔍 Ghost Task Detection Report (E2-T1)');
  console.log(`   Ghost tasks found: ${ghostReport.count}`);
  if (ghostReport.count > 0) {
    console.log(`   Oldest ghost task age: ${Math.round(ghostReport.oldestAgeMs / 60000)} minutes`);
    ghostReport.ghostTasks.forEach(task => {
      const age = Math.round((Date.now() - (task.startedAt || 0)) / 60000);
      console.log(`   - [${task.project}/${task.stage}] status=${task.status}, age=${age}min`);
    });
  }

  // E2-T2: Scan for fake done tasks
  const fakeDoneReport = await detectFakeDoneTasks(tasks, outputDir);
  console.log('\n🔍 Fake Done Detection Report (E2-T2)');
  console.log(`   Fake done tasks found: ${fakeDoneReport.count}`);
  if (fakeDoneReport.count > 0) {
    fakeDoneReport.fakeDoneTasks.forEach(task => {
      console.log(`   - [${task.project}/${task.stage}] marked done but no output`);
    });
  }

  // Summary
  console.log('\n📊 Summary');
  console.log(`   Total tasks: ${tasks.length}`);
  console.log(`   Ghost tasks: ${ghostReport.count}`);
  console.log(`   Fake done: ${fakeDoneReport.count}`);
  
  const healthScore = tasks.length > 0 
    ? Math.round(((tasks.length - ghostReport.count - fakeDoneReport.count) / tasks.length) * 100)
    : 100;
  console.log(`   Health score: ${healthScore}%`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default main;
