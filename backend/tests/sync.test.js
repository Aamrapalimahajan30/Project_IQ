const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');

describe('Sync Suite: State, Roadmap Progression & XP Idempotency', () => {

  describe('Learning Path Module Completion Idempotency', () => {
    // In-memory simulation of LearningProgress and User database state
    let mockUser;
    let mockProgressRecords;
    const moduleSequence = ['fundamental', 'architecture', 'backend', 'database', 'quality'];

    beforeEach(() => {
      mockUser = {
        _id: 'user_123',
        name: 'Alex Dev',
        xp: 0,
        level: 1,
        levelName: 'Project Novice',
        streak: 1
      };
      mockProgressRecords = [];
    });

    const completeModuleHandler = (moduleId, xpAmount = 150) => {
      let progress = mockProgressRecords.find(p => p.moduleId === moduleId);
      const isAlreadyCompleted = progress && progress.completionStatus === 'completed';

      if (!progress) {
        progress = { moduleId, completionStatus: 'completed', progress: 100 };
        mockProgressRecords.push(progress);
      } else {
        progress.completionStatus = 'completed';
        progress.progress = 100;
      }

      let xpAwarded = 0;
      if (!isAlreadyCompleted) {
        xpAwarded = xpAmount;
        mockUser.xp += xpAwarded;
        mockUser.level = Math.floor(mockUser.xp / 600) + 1;
      }

      // Unlock next module in order
      const currentIdx = moduleSequence.indexOf(moduleId);
      if (currentIdx !== -1 && currentIdx + 1 < moduleSequence.length) {
        const nextId = moduleSequence[currentIdx + 1];
        let nextProg = mockProgressRecords.find(p => p.moduleId === nextId);
        if (!nextProg) {
          mockProgressRecords.push({ moduleId: nextId, completionStatus: 'in-progress', progress: 30 });
        } else if (nextProg.completionStatus === 'locked') {
          nextProg.completionStatus = 'in-progress';
        }
      }

      return {
        user: { ...mockUser },
        xpAwarded,
        alreadyCompleted: Boolean(isAlreadyCompleted),
        progressList: [...mockProgressRecords]
      };
    };

    it('awards XP on initial module completion and unlocks the next module', () => {
      const res1 = completeModuleHandler('fundamental', 150);

      assert.strictEqual(res1.alreadyCompleted, false);
      assert.strictEqual(res1.xpAwarded, 150);
      assert.strictEqual(res1.user.xp, 150);

      // Check module statuses
      const fundamental = res1.progressList.find(p => p.moduleId === 'fundamental');
      const architecture = res1.progressList.find(p => p.moduleId === 'architecture');
      assert.strictEqual(fundamental.completionStatus, 'completed');
      assert.strictEqual(architecture.completionStatus, 'in-progress');
    });

    it('prevents duplicate XP when the same module is completed multiple times or re-clicked', () => {
      // First attempt
      const res1 = completeModuleHandler('fundamental', 150);
      assert.strictEqual(res1.xpAwarded, 150);
      assert.strictEqual(res1.user.xp, 150);

      // Second attempt (duplicate click / refresh)
      const res2 = completeModuleHandler('fundamental', 150);
      assert.strictEqual(res2.alreadyCompleted, true);
      assert.strictEqual(res2.xpAwarded, 0, 'No XP must be awarded for duplicate completion');
      assert.strictEqual(res2.user.xp, 150, 'User XP must remain identical without duplicate increments');

      // Third attempt
      const res3 = completeModuleHandler('fundamental', 150);
      assert.strictEqual(res3.alreadyCompleted, true);
      assert.strictEqual(res3.xpAwarded, 0);
      assert.strictEqual(res3.user.xp, 150);
    });

    it('advances through multiple sequential modules and accurately accumulates XP', () => {
      completeModuleHandler('fundamental', 150);
      completeModuleHandler('architecture', 200);
      const res3 = completeModuleHandler('backend', 300);

      assert.strictEqual(res3.user.xp, 650);
      assert.strictEqual(res3.user.level, 2); // 650 XP -> Level 2

      // Check database progress records
      const backend = res3.progressList.find(p => p.moduleId === 'backend');
      const database = res3.progressList.find(p => p.moduleId === 'database');
      assert.strictEqual(backend.completionStatus, 'completed');
      assert.strictEqual(database.completionStatus, 'in-progress');
    });
  });

  describe('Active Project State & Refresh Synchronization', () => {
    it('restores previously selected active project using stored ID', () => {
      const mockProjects = [
        { _id: 'proj_1', name: 'Alpha Project' },
        { _id: 'proj_2', name: 'Beta Project' },
        { _id: 'proj_3', name: 'Gamma Project' }
      ];

      const resolveActiveProject = (savedId, projectList) => {
        if (!projectList || projectList.length === 0) return null;
        if (savedId) {
          const found = projectList.find(p => p._id === savedId);
          if (found) return found;
        }
        return projectList[0];
      };

      // Case 1: Saved ID exists for proj_2
      const active1 = resolveActiveProject('proj_2', mockProjects);
      assert.strictEqual(active1._id, 'proj_2');
      assert.strictEqual(active1.name, 'Beta Project');

      // Case 2: No saved ID -> defaults to first project
      const active2 = resolveActiveProject(null, mockProjects);
      assert.strictEqual(active2._id, 'proj_1');

      // Case 3: Stale saved ID (project deleted) -> falls back to first project
      const active3 = resolveActiveProject('deleted_id', mockProjects);
      assert.strictEqual(active3._id, 'proj_1');
    });

    it('clears all session and project states on logout', () => {
      let localStorageMock = {
        projectiq_token: 'valid_jwt_token',
        projectiq_active_project_id: 'proj_1',
        projectiq_theme: 'dark'
      };

      const logoutHandler = () => {
        delete localStorageMock.projectiq_token;
        delete localStorageMock.projectiq_active_project_id;
        return {
          isAuthenticated: false,
          user: { name: 'Developer Profile', email: '', xp: 0, level: 1 },
          projects: [],
          activeProject: null,
          roadmap: []
        };
      };

      const cleanState = logoutHandler();
      assert.strictEqual(localStorageMock.projectiq_token, undefined);
      assert.strictEqual(localStorageMock.projectiq_active_project_id, undefined);
      assert.strictEqual(localStorageMock.projectiq_theme, 'dark'); // Theme preserved
      assert.strictEqual(cleanState.isAuthenticated, false);
      assert.strictEqual(cleanState.activeProject, null);
      assert.strictEqual(cleanState.projects.length, 0);
      assert.strictEqual(cleanState.roadmap.length, 0);
    });
  });
});
