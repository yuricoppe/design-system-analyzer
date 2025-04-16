import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const PRD_PATH = path.join(__dirname, 'PRD.txt');
const TASKS_PATH = path.join(__dirname, '../tasks/tasks.json');

// Validation rules
const REQUIRED_TASK_FIELDS = ['id', 'title', 'description', 'status', 'priority', 'details', 'testStrategy'];
const REQUIRED_SUBTASK_FIELDS = ['id', 'title', 'description', 'status', 'details', 'testStrategy'];
const VALID_PRIORITIES = ['high', 'medium', 'low'];
const VALID_STATUSES = ['pending', 'in-progress', 'done', 'review', 'blocked'];

function validateTasks() {
    // Read files
    const prdContent = fs.readFileSync(PRD_PATH, 'utf8');
    const tasksJson = JSON.parse(fs.readFileSync(TASKS_PATH, 'utf8'));
    const errors = [];
    const warnings = [];

    // Validate tasks.json structure
    if (!tasksJson.tasks || !Array.isArray(tasksJson.tasks)) {
        errors.push('Invalid tasks.json structure: missing or invalid tasks array');
        return { errors, warnings };
    }

    // Track used IDs for uniqueness check
    const usedIds = new Set();

    // Validate each task
    tasksJson.tasks.forEach(task => {
        // Check required fields
        REQUIRED_TASK_FIELDS.forEach(field => {
            if (!task[field]) {
                errors.push(`Task ${task.id}: Missing required field "${field}"`);
            }
        });

        // Validate ID uniqueness
        if (usedIds.has(task.id)) {
            errors.push(`Duplicate task ID found: ${task.id}`);
        }
        usedIds.add(task.id);

        // Validate priority
        if (!VALID_PRIORITIES.includes(task.priority)) {
            errors.push(`Task ${task.id}: Invalid priority "${task.priority}"`);
        }

        // Validate status
        if (!VALID_STATUSES.includes(task.status)) {
            errors.push(`Task ${task.id}: Invalid status "${task.status}"`);
        }

        // Validate dependencies
        if (task.dependencies) {
            task.dependencies.forEach(depId => {
                if (!tasksJson.tasks.some(t => t.id === depId)) {
                    errors.push(`Task ${task.id}: Invalid dependency "${depId}"`);
                }
            });
        }

        // Validate subtasks if present
        if (task.subtasks) {
            if (!Array.isArray(task.subtasks)) {
                errors.push(`Task ${task.id}: subtasks must be an array`);
            } else {
                task.subtasks.forEach(subtask => {
                    // Check required fields
                    REQUIRED_SUBTASK_FIELDS.forEach(field => {
                        if (!subtask[field]) {
                            errors.push(`Subtask ${subtask.id}: Missing required field "${field}"`);
                        }
                    });

                    // Validate subtask ID format
                    const expectedPrefix = `${task.id}.`;
                    if (!subtask.id.startsWith(expectedPrefix)) {
                        errors.push(`Subtask ${subtask.id}: Invalid ID format. Should start with "${expectedPrefix}"`);
                    }

                    // Track subtask ID
                    if (usedIds.has(subtask.id)) {
                        errors.push(`Duplicate subtask ID found: ${subtask.id}`);
                    }
                    usedIds.add(subtask.id);
                });
            }
        }
    });

    // Cross-reference with PRD
    tasksJson.tasks.forEach(task => {
        // Check if task title exists in PRD
        if (!prdContent.includes(task.title)) {
            warnings.push(`Task "${task.title}" not found in PRD`);
        }

        // Check if implementation details match
        const taskDetails = task.details.split('\n').map(d => d.trim()).filter(d => d);
        taskDetails.forEach(detail => {
            if (!prdContent.includes(detail)) {
                warnings.push(`Task ${task.id}: Implementation detail "${detail}" not found in PRD`);
            }
        });
    });

    return { errors, warnings };
}

// Replace the CommonJS main check with ES modules version
if (import.meta.url === `file://${process.argv[1]}`) {
    const { errors, warnings } = validateTasks();
    
    if (errors.length > 0) {
        console.error('\nValidation Errors:');
        errors.forEach(error => console.error(`❌ ${error}`));
    }
    
    if (warnings.length > 0) {
        console.warn('\nValidation Warnings:');
        warnings.forEach(warning => console.warn(`⚠️  ${warning}`));
    }
    
    if (errors.length === 0 && warnings.length === 0) {
        console.log('✅ All validations passed successfully!');
    }
    
    process.exit(errors.length > 0 ? 1 : 0);
}

export { validateTasks }; 