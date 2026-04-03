"""
Tests for Task Scheduler
"""

import unittest
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Mock the required environment variables
os.environ["TEAM_TASKS_DIR"] = "/tmp/team-tasks"
os.environ["LOCK_DIR"] = "/tmp/task-lock"

from task_scheduler import (
    TaskScheduler, TaskStatus, Task, TaskType, TaskPriority,
    get_task_type_from_agent, get_priority_from_stage, DAGParser
)


class TestTaskScheduler(unittest.TestCase):
    """Test TaskScheduler basic operations"""
    
    def setUp(self):
        self.scheduler = TaskScheduler()
        
    def test_scheduler_creation(self):
        """TaskScheduler should be created successfully"""
        self.assertIsNotNone(self.scheduler)
        self.assertTrue(hasattr(self.scheduler, 'lock_dir'))


class TestTaskStatus(unittest.TestCase):
    """Test TaskStatus enum"""
    
    def test_status_values(self):
        """TaskStatus should have correct values"""
        self.assertEqual(TaskStatus.PENDING.value, "pending")
        self.assertEqual(TaskStatus.IN_PROGRESS.value, "in-progress")
        self.assertEqual(TaskStatus.DONE.value, "done")
        self.assertEqual(TaskStatus.FAILED.value, "failed")


class TestTask(unittest.TestCase):
    """Test Task dataclass"""
    
    def test_task_creation(self):
        """Task should be created with correct fields"""
        task = Task(project="test-project", stage="dev", agent="dev")
        self.assertEqual(task.project, "test-project")
        self.assertEqual(task.stage, "dev")
        self.assertEqual(task.agent, "dev")
        self.assertEqual(task.status, TaskStatus.PENDING)
        
    def test_task_with_dependencies(self):
        """Task with depends_on"""
        task = Task(project="test", stage="dev", agent="dev", depends_on=["task-1"])
        self.assertEqual(len(task.depends_on), 1)
        self.assertEqual(task.depends_on[0], "task-1")


class TestTaskType(unittest.TestCase):
    """Test TaskType enum"""
    
    def test_task_type_values(self):
        """TaskType should have correct values"""
        self.assertEqual(TaskType.ANALYSIS.value, "analysis")
        self.assertEqual(TaskType.PRD.value, "prd")
        self.assertEqual(TaskType.DEVELOPMENT.value, "dev")
        self.assertEqual(TaskType.BUILD.value, "build")
        self.assertEqual(TaskType.TEST.value, "test")


class TestHelperFunctions(unittest.TestCase):
    """Test helper functions"""
    
    def test_get_task_type_from_agent(self):
        """Test agent to task type mapping"""
        self.assertEqual(get_task_type_from_agent("dev"), TaskType.DEVELOPMENT)
        self.assertEqual(get_task_type_from_agent("analyst"), TaskType.ANALYSIS)
        
    def test_get_priority_from_stage(self):
        """Test stage to priority mapping"""
        priority = get_priority_from_stage("in-progress")
        self.assertIsNotNone(priority)
        self.assertIsInstance(priority, TaskPriority)


class TestDAGParser(unittest.TestCase):
    """Test DAGParser"""
    
    def test_dag_parser_class_exists(self):
        """DAGParser class should exist"""
        self.assertIsNotNone(DAGParser)


if __name__ == "__main__":
    unittest.main()
