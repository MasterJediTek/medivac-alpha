    return {
      total: this.tasks.length,
      byPriority,
      byStatus,
      byCategory,
      overdue,
      dueToday,
      completedThisWeek,
    };
  }

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'subtasks' | 'attachments' | 'comments'>): Promise<Task> {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...task,
      id: `task_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      subtasks: [],
      attachments: [],
      comments: [],
    };
    
    this.tasks.unshift(newTask);
    await this.save();
    return newTask;
  }

  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<boolean> {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return false;
    
    task.status = status;
    task.updatedAt = new Date().toISOString();
    if (status === 'done') {
      task.completedAt = new Date().toISOString();
    }
    
    await this.save();
    return true;
  }

  async toggleSubtask(taskId: string, subtaskId: string): Promise<boolean> {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) return false;
    
    const subtask = task.subtasks.find(s => s.id === subtaskId);
    if (!subtask) return false;
    
    subtask.completed = !subtask.completed;
    task.updatedAt = new Date().toISOString();
    
    await this.save();
    return true;
  }
}

export const tasksTodoService = new TasksTodoService();
