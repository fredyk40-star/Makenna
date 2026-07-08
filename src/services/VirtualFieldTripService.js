/**
 * Virtual Field Trip Service - Immersive learning experiences
 * Provides 360 virtual tours, interactive guides, educational content
 */
// NOTE: In a real application, this would integrate with external VR/360 photo APIs or hosted content.
// For this example, we'll simulate trips with static data and placeholder images.

import { StorageService } from './StorageService';

const VIRTUAL_TRIP_KEY = 'makenna_virtual_trips';

const VIRTUAL_TRIPS = [
  {
    id: 'amazon-rainforest',
    name: 'Amazon Rainforest Adventure',
    description: 'Explore the vibrant ecosystem of the Amazon!',
    imageUrl: 'https://via.placeholder.com/400/228B22/FFFFFF?text=Rainforest',
    duration: '30 min',
    difficulty: 'easy',
    ageGroup: '5-8',
    scenes: [
      { id: 'entry', title: 'Forest Edge', description: 'Hear the sounds of the jungle.', fact: 'The Amazon is the largest rainforest in the world.', interactivePoints: [] },
      { id: 'river', title: 'Amazon River Journey', description: 'Paddle down the mighty Amazon.', fact: 'Many unique species live only here.', interactivePoints: [] },
      { id: 'wildlife', title: 'Wildlife Spotting', description: 'Look for colorful birds and monkeys.', fact: 'Home to over 3 million insect species.', interactivePoints: [] }
    ],
    quiz: [
      { question: 'What is the Amazon Rainforest known for?', options: ['Big cities', 'Deserts', 'Biodiversity'], answer: 'Biodiversity' },
      { question: 'What animals might you see?', options: ['Penguins', 'Monkeys', 'Polar Bears'], answer: 'Monkeys' }
    ]
  },
  {
    id: 'ancient-egypt',
    name: 'Secrets of Ancient Egypt',
    description: 'Travel back in time to the land of Pharaohs and Pyramids!',
    imageUrl: 'https://via.placeholder.com/400/DAA520/000000?text=Egypt',
    duration: '45 min',
    difficulty: 'medium',
    ageGroup: '8-12',
    scenes: [
      { id: 'pyramids', title: 'Giza Pyramids', description: 'Marvel at the ancient wonders.', fact: 'The Great Pyramid was the tallest man-made structure for over 3,800 years.', interactivePoints: [] },
      { id: 'nile', title: 'Life on the Nile', description: 'Discover how the river sustained a civilization.', fact: 'The Nile is the longest river in the world.', interactivePoints: [] },
      { id: 'tombs', title: 'Valley of the Kings', description: 'Explore the burial sites of pharaohs.', fact: 'Many pharaohs were buried with their treasures.', interactivePoints: [] }
    ],
    quiz: [
      { question: 'What structures are Ancient Egypt famous for?', options: ['Skyscrapers', 'Pyramids', 'Castles'], answer: 'Pyramids' },
      { question: 'What river was central to Ancient Egyptian life?', options: ['Mississippi', 'Yangtze', 'Nile'], answer: 'Nile' }
    ]
  }
];

export class VirtualFieldTripService {
  /**
   * Get all available virtual field trips
   */
  static getAllTrips() {
    return VIRTUAL_TRIPS;
  }

  /**
   * Get a specific trip by ID
   */
  static getTripById(tripId) {
    return VIRTUAL_TRIPS.find(trip => trip.id === tripId);
  }

  /**
   * Get a child's progress for a specific trip
   */
  static getTripProgress(childId, tripId) {
    const progressData = StorageService.get(`${VIRTUAL_TRIP_KEY}_${childId}`, {});
    return progressData[tripId] || { currentScene: 0, completedScenes: [], quizScores: [] };
  }

  /**
   * Update a child's progress for a trip
   */
  static updateTripProgress(childId, tripId, newProgress) {
    const allProgress = StorageService.get(`${VIRTUAL_TRIP_KEY}_${childId}`, {});
    allProgress[tripId] = { ...allProgress[tripId], ...newProgress };
    StorageService.set(`${VIRTUAL_TRIP_KEY}_${childId}`, allProgress);
    return allProgress[tripId];
  }

  /**
   * Mark a scene as completed
   */
  static completeScene(childId, tripId, sceneId) {
    const trip = this.getTripById(tripId);
    if (!trip) return null;

    const progress = this.getTripProgress(childId, tripId);
    if (!progress.completedScenes.includes(sceneId)) {
      progress.completedScenes.push(sceneId);
      progress.currentScene = trip.scenes.findIndex(s => s.id === sceneId) + 1; // Move to next scene index
      this.updateTripProgress(childId, tripId, progress);
    }
    return progress;
  }

  /**
   * Record quiz score for a trip
   */
  static recordQuizScore(childId, tripId, score) {
    const progress = this.getTripProgress(childId, tripId);
    progress.quizScores.push({ score, timestamp: new Date().toISOString() });
    this.updateTripProgress(childId, tripId, progress);
    return progress;
  }

  /**
   * Check if trip is completed
   */
  static isTripCompleted(childId, tripId) {
    const trip = this.getTripById(tripId);
    const progress = this.getTripProgress(childId, tripId);

    if (!trip || !progress) return false;
    return progress.completedScenes.length === trip.scenes.length && progress.quizScores.length > 0;
  }

  /**
   * Get next scene for a trip
   */
  static getNextScene(childId, tripId) {
    const trip = this.getTripById(tripId);
    const progress = this.getTripProgress(childId, tripId);
    if (!trip || !progress) return null;

    const nextSceneIndex = progress.currentScene;
    return trip.scenes[nextSceneIndex] || null;
  }

  /**
   * Reset trip progress for a child
   */
  static resetTripProgress(childId, tripId) {
    const allProgress = StorageService.get(`${VIRTUAL_TRIP_KEY}_${childId}`, {});
    delete allProgress[tripId];
    StorageService.set(`${VIRTUAL_TRIP_KEY}_${childId}`, allProgress);
  }

}