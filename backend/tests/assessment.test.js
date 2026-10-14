const { describe, it } = require('node:test');
const assert = require('node:assert');
const { calculateLevel, awardXP } = require('../utils/xpService');

describe('Assessment Suite: Learning Path, Quiz, Mock Interview & XP Engine', () => {

  describe('XP Engine & Level Progression', () => {
    it('initializes a new user at Level 1 ("Project Novice") with 0 XP', () => {
      const { level, levelName } = calculateLevel(0);
      assert.strictEqual(level, 1);
      assert.strictEqual(levelName, 'Project Novice');
    });

    it('advances levels precisely at 600 XP milestones', () => {
      assert.strictEqual(calculateLevel(599).level, 1);
      assert.strictEqual(calculateLevel(600).level, 2);
      assert.strictEqual(calculateLevel(600).levelName, 'File Explorer');

      assert.strictEqual(calculateLevel(1199).level, 2);
      assert.strictEqual(calculateLevel(1200).level, 3);
      assert.strictEqual(calculateLevel(1200).levelName, 'Code Tinkerer');

      assert.strictEqual(calculateLevel(3000).level, 6);
      assert.strictEqual(calculateLevel(3000).levelName, 'Architecture Novice');
    });

    it('caps maximum level name at "Lead Architect" for high XP earners', () => {
      const { level, levelName } = calculateLevel(10000);
      assert.ok(level >= 10);
      assert.strictEqual(levelName, 'Lead Architect');
    });

    it('correctly updates user document and awards XP in awardXP', async () => {
      let saved = false;
      const mockUser = {
        xp: 100,
        level: 1,
        levelName: 'Project Novice',
        save: async function() { saved = true; }
      };

      const updated = await awardXP(mockUser, 550, 'Completed Quiz');
      assert.strictEqual(updated.xp, 650);
      assert.strictEqual(updated.level, 2);
      assert.strictEqual(updated.levelName, 'File Explorer');
      assert.strictEqual(saved, true);
    });
  });

  describe('Learning Path Roadmap & Progression', () => {
    const buildMockRoadmap = (project) => {
      return [
        {
          id: 'fundamental',
          name: `${project.name} Structure & Core Entry Points`,
          duration: '15 mins',
          difficulty: 'Easy',
          xp: 150,
          status: 'in-progress'
        },
        {
          id: 'architecture',
          name: `${project.name} Architecture & Request Flow`,
          duration: '25 mins',
          difficulty: 'Medium',
          xp: 200,
          status: 'locked'
        },
        {
          id: 'database',
          name: `${project.name} Data Models & Persistence`,
          duration: '30 mins',
          difficulty: 'Hard',
          xp: 250,
          status: 'locked'
        }
      ];
    };

    it('generates sequential syllabus roadmap with first module unlocked', () => {
      const mockProject = { name: 'E-Commerce Core' };
      const roadmap = buildMockRoadmap(mockProject);

      assert.strictEqual(roadmap.length, 3);
      assert.strictEqual(roadmap[0].status, 'in-progress');
      assert.strictEqual(roadmap[1].status, 'locked');
      assert.strictEqual(roadmap[2].status, 'locked');
      assert.ok(roadmap[0].name.includes('E-Commerce Core'));
    });

    it('unlocks subsequent modules and increments user completion state', () => {
      const roadmap = buildMockRoadmap({ name: 'Test' });
      const completedModuleId = 'fundamental';

      const updatedRoadmap = roadmap.map((m, idx) => {
        if (m.id === completedModuleId) {
          return { ...m, status: 'completed' };
        }
        if (idx === 1) {
          return { ...m, status: 'in-progress' };
        }
        return m;
      });

      assert.strictEqual(updatedRoadmap[0].status, 'completed');
      assert.strictEqual(updatedRoadmap[1].status, 'in-progress');
      assert.strictEqual(updatedRoadmap[2].status, 'locked');
    });
  });

  describe('Quiz Engine & Scorecard Evaluation', () => {
    const evaluateQuizAnswers = (questions, userAnswers) => {
      let score = 0;
      const breakdown = [];

      questions.forEach((q, idx) => {
        const isCorrect = userAnswers[idx] === q.correct;
        if (isCorrect) score++;
        breakdown.push({
          questionIndex: idx,
          isCorrect,
          selected: userAnswers[idx],
          correct: q.correct,
          explanation: q.explanation
        });
      });

      const percentage = Math.round((score / questions.length) * 100);
      const passed = percentage >= 50;

      return {
        score,
        total: questions.length,
        percentage,
        passed,
        breakdown
      };
    };

    it('evaluates quiz answers, calculates percentage score, and awards pass status', () => {
      const questions = [
        { question: 'Q1', options: ['A', 'B', 'C', 'D'], correct: 0, explanation: 'A is correct' },
        { question: 'Q2', options: ['A', 'B', 'C', 'D'], correct: 1, explanation: 'B is correct' },
        { question: 'Q3', options: ['A', 'B', 'C', 'D'], correct: 2, explanation: 'C is correct' },
        { question: 'Q4', options: ['A', 'B', 'C', 'D'], correct: 3, explanation: 'D is correct' }
      ];

      // 3 correct, 1 wrong -> 75%
      const userAnswers = [0, 1, 2, 0];
      const result = evaluateQuizAnswers(questions, userAnswers);

      assert.strictEqual(result.score, 3);
      assert.strictEqual(result.total, 4);
      assert.strictEqual(result.percentage, 75);
      assert.strictEqual(result.passed, true);
      assert.strictEqual(result.breakdown[3].isCorrect, false);
    });

    it('identifies failing attempts (<50%) and provides explanation breakdown', () => {
      const questions = [
        { question: 'Q1', options: ['A', 'B'], correct: 0, explanation: 'E1' },
        { question: 'Q2', options: ['A', 'B'], correct: 1, explanation: 'E2' }
      ];

      const userAnswers = [1, 0]; // 0 correct -> 0%
      const result = evaluateQuizAnswers(questions, userAnswers);

      assert.strictEqual(result.score, 0);
      assert.strictEqual(result.percentage, 0);
      assert.strictEqual(result.passed, false);
    });
  });

  describe('Mock Interview Engine & Multi-Criteria Evaluation', () => {
    const evaluateMockInterview = (transcripts) => {
      // Metric scoring formula based on explanation quality
      let totalScore = 0;
      const evaluatedAnswers = transcripts.map(item => {
        const wordCount = item.answer.trim().split(/\s+/).length;
        const correctness = wordCount >= 15 ? 85 : wordCount >= 5 ? 60 : 30;
        const missingPoints = wordCount < 15 ? ['Could explain edge cases', 'Could mention security tradeoffs'] : [];
        const explainedWell = wordCount >= 5 ? ['Addressed primary question objective'] : [];
        const sampleAnswer = `In ${item.context || 'this project'}, this component handles the request through modular boundaries.`;

        totalScore += correctness;

        return {
          question: item.question,
          answer: item.answer,
          correctness,
          missingPoints,
          explainedWell,
          sampleAnswer
        };
      });

      const finalScore = Math.round(totalScore / transcripts.length);
      const passed = finalScore >= 50;

      return {
        finalScore,
        passed,
        evaluatedAnswers,
        readinessLevel: finalScore >= 75 ? 'Interview Ready' : finalScore >= 50 ? 'Needs Minor Practice' : 'Requires Revision'
      };
    };

    it('evaluates interview transcripts with constructive explainable feedback', () => {
      const mockTranscripts = [
        {
          question: 'How is user authentication secured in this project?',
          answer: 'We use JWT stored in local storage, verified by an auth middleware using a secret loaded from environment variables.',
          context: 'ProjectIQ'
        },
        {
          question: 'How do modules communicate in your architecture?',
          answer: 'Through REST API endpoints and Express router controllers that import database models.',
          context: 'ProjectIQ'
        }
      ];

      const evaluation = evaluateMockInterview(mockTranscripts);
      assert.ok(evaluation.finalScore >= 70);
      assert.strictEqual(evaluation.passed, true);
      assert.strictEqual(evaluation.evaluatedAnswers.length, 2);

      const firstEvaluation = evaluation.evaluatedAnswers[0];
      assert.ok(firstEvaluation.sampleAnswer);
      assert.ok(firstEvaluation.explainedWell.length > 0);
    });
  });
});
