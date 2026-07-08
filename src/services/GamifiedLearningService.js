/**
 * Gamified Learning Paths Service - Structured learning journeys with rewards
 * Defines paths, tracks progress, unlocks new content, awards unique items
 */
import { StorageService } from './StorageService';
import { AchievementService } from './AchievementService';
import { RewardsStore } from './RewardsStore';
import { NotificationBellService } from './NotificationBellService';

const LEARNING_PATH_KEY = 'makenna_learning_paths';

const LEARNING_PATHS = [
  {
    id: 'alphabet-explorer',
    name: 'Alphabet Explorer',
    description: 'Master all letters from A to Z!',
    icon: '🔤',
    stages: [
      { id: 'stage-a-e', name: 'Letters A-E', type: 'alphabet-mastery', target: 5, reward: { type: 'coins', amount: 10 } },
      { id: 'stage-f-j', name: 'Letters F-J', type: 'alphabet-mastery', target: 5, reward: { type: 'badge', badgeId: 'alphabet-rookie' } },
      { id: 'stage-k-o', name: 'Letters K-O', type: 'alphabet-mastery', target: 5, reward: { type: 'avatar', itemId: 'alphabet-avatar-1' } },
      { id: 'stage-p-t', name: 'Letters P-T', type: 'alphabet-mastery', target: 5, reward: { type: 'coins', amount: 20 } },
      { id: 'stage-u-z', name: 'Letters U-Z', type: 'alphabet-mastery', target: 6, reward: { type: 'badge', badgeId: 'alphabet-master' } },
    ],
    completionReward: { type: 'certificate', itemId: 'alphabet-certificate' }
  },
  {
    id: 'number-ninja',
    name: 'Number Ninja',
    description: 'Conquer numbers and basic math concepts!',
    icon: '🔢',
    stages: [
      { id: 'stage-1-5', name: 'Numbers 1-5', type: 'number-mastery', target: 5, reward: { type: 'coins', amount: 10 } },
      { id: 'stage-6-10', name: 'Numbers 6-10', type: 'number-mastery', target: 5, reward: { type: 'badge', badgeId: 'number-novice' } },
      { id: 'stage-add-sub', name: 'Addition & Subtraction', type: 'math-mastery', target: 10, reward: { type: 'avatar', itemId: 'number-avatar-1' } },
    ],
    completionReward: { type: 'certificate', itemId: 'number-certificate' }
  }
];

export class GamifiedLearningService {
  /**
   * Get all defined learning paths
   */
  static getAllLearningPaths() {
    return LEARNING_PATHS;
  }

  /**
   * Get a specific learning path by ID
   */
  static getLearningPath(pathId) {
    return LEARNING_PATHS.find(path => path.id === pathId);
  }

  /**
   * Get child's progress on all learning paths
   */
  static getChildLearningPathsProgress(childId) {
    const progressData = StorageService.get(`${LEARNING_PATH_KEY}_${childId}`, {});
    return LEARNING_PATHS.map(path => {
      const childPathProgress = progressData[path.id] || { currentStage: 0, completedStages: [], isCompleted: false };
      return {
        ...path,
        currentStage: childPathProgress.currentStage,
        completedStages: childPathProgress.completedStages,
        isCompleted: childPathProgress.isCompleted,
        progressPercentage: this.calculatePathProgress(path, childPathProgress)
      };
    });
  }

  /**
   * Calculate overall progress percentage for a learning path
   */
  static calculatePathProgress(path, childPathProgress) {
    if (childPathProgress.isCompleted) return 100;
    if (path.stages.length === 0) return 0;
    
    return Math.round((childPathProgress.completedStages.length / path.stages.length) * 100);
  }

  /**
   * Update progress for a specific stage in a learning path
   * This method would be called by other services (e.g., AlphabetService, NumbersService)
   * when a child completes a relevant learning objective.
   */
  static updateStageProgress(childId, pathId, stageId, currentProgressValue) {
    const allPathsProgress = StorageService.get(`${LEARNING_PATH_KEY}_${childId}`, {});
    const path = this.getLearningPath(pathId);
    if (!path) return null;

    let childPathProgress = allPathsProgress[pathId] || { currentStage: 0, completedStages: [], isCompleted: false };
    const stageIndex = path.stages.findIndex(s => s.id === stageId);
    if (stageIndex === -1) return null; // Stage not found

    const currentStageDef = path.stages[stageIndex];

    // Only update if the stage is not already completed and criteria is met
    if (!childPathProgress.completedStages.includes(stageId) && currentProgressValue >= currentStageDef.target) {
      childPathProgress.completedStages.push(stageId);
      
      // Award reward
      this.awardReward(childId, currentStageDef.reward);
      NotificationBellService.addNotification(childId, {
        type: 'gamification',
        title: 'Stage Completed!',
        message: `You completed the stage \'${currentStageDef.name}\' in ${path.name}!`, 
        icon: path.icon
      });

      // Move to next stage if applicable
      if (stageIndex === childPathProgress.currentStage && stageIndex < path.stages.length - 1) {
        childPathProgress.currentStage = stageIndex + 1;
      }

      // Check for path completion
      if (childPathProgress.completedStages.length === path.stages.length) {
        childPathProgress.isCompleted = true;
        this.awardReward(childId, path.completionReward);
        NotificationBellService.addNotification(childId, {
          type: 'gamification',
          title: 'Path Completed!',
          message: `Congratulations! You completed the \'${path.name}\' learning path!`, 
          icon: '🏆'
        });
      }

      allPathsProgress[pathId] = childPathProgress;
      StorageService.set(`${LEARNING_PATH_KEY}_${childId}`, allPathsProgress);
    }

    return childPathProgress;
  }

  /**
   * Award a reward to the child
   */
  static awardReward(childId, reward) {
    if (!reward) return;
    switch (reward.type) {
      case 'coins':
        RewardsStore.addCoins(childId, reward.amount);
        break;
      case 'badge':
        AchievementService.awardBadge(childId, reward.badgeId);
        break;
      case 'avatar':
        RewardsStore.unlockAvatar(childId, reward.itemId);
        break;
      case 'certificate':
        // Logic to generate/store certificate (beyond scope of this service)
        console.log(`Child ${childId} earned certificate: ${reward.itemId}`);
        break;
      case 'theme':
        RewardsStore.unlockTheme(childId, reward.itemId);
        break;
      default:
        console.warn(`Unknown reward type: ${reward.type}`);
    }
  }

  /**
   * Reset a child's progress on a specific learning path
   */
  static resetPathProgress(childId, pathId) {
    const allPathsProgress = StorageService.get(`${LEARNING_PATH_KEY}_${childId}`, {});
    delete allPathsProgress[pathId];
    StorageService.set(`${LEARNING_PATH_KEY}_${childId}`, allPathsProgress);
  }
}