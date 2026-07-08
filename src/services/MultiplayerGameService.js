/**
 * Multiplayer Games Service - Real-time game state management
 * Synchronizes game state, handles player actions, manages leaderboards
 */
import { StorageService } from './StorageService';
import { GamificationService } from './GamificationService';
import { NotificationBellService } from './NotificationBellService';

const MULTIPLAYER_GAME_KEY = 'makenna_multiplayer_games';

export class MultiplayerGameService {
  /**
   * Create a new game session
   */
  static createGame(gameId, hostPlayerId, initialGameState) {
    const games = StorageService.get(MULTIPLAYER_GAME_KEY, {});
    const newGame = {
      id: `${gameId}_${Date.now()}`,
      gameId: gameId,
      host: hostPlayerId,
      players: [{ id: hostPlayerId, score: 0, status: 'connected' }],
      state: initialGameState,
      status: 'waiting',
      createdAt: new Date().toISOString()
    };
    games[newGame.id] = newGame;
    StorageService.set(MULTIPLAYER_GAME_KEY, games);
    NotificationBellService.addNotification(hostPlayerId, {
      type: 'game',
      title: 'Game Created!',
      message: `Your game session for ${gameId} is ready.`,
      icon: '🎮'
    });
    return newGame;
  }

  /**
   * Join an existing game session
   */
  static joinGame(gameSessionId, playerId) {
    const games = StorageService.get(MULTIPLAYER_GAME_KEY, {});
    const game = games[gameSessionId];

    if (game && !game.players.some(p => p.id === playerId)) {
      game.players.push({ id: playerId, score: 0, status: 'connected' });
      game.status = game.players.length > 1 ? 'ready' : game.status; // Set to ready if more than one player
      StorageService.set(MULTIPLAYER_GAME_KEY, games);
      NotificationBellService.addNotification(playerId, {
        type: 'game',
        title: 'Joined Game!',
        message: `You joined a game session for ${game.gameId}.`,
        icon: '🎮'
      });
      return game;
    }
    return null;
  }

  /**
   * Leave a game session
   */
  static leaveGame(gameSessionId, playerId) {
    const games = StorageService.get(MULTIPLAYER_GAME_KEY, {});
    const game = games[gameSessionId];

    if (game) {
      game.players = game.players.filter(p => p.id !== playerId);
      if (game.players.length === 0) {
        delete games[gameSessionId]; // End game if no players left
      } else if (game.host === playerId && game.players.length > 0) {
        game.host = game.players[0].id; // Assign new host if old host left
      }
      game.status = game.players.length < 2 ? 'waiting' : game.status; // Back to waiting if only one player
      StorageService.set(MULTIPLAYER_GAME_KEY, games);
      return true;
    }
    return false;
  }

  /**
   * Get game session details
   */
  static getGameSession(gameSessionId) {
    const games = StorageService.get(MULTIPLAYER_GAME_KEY, {});
    return games[gameSessionId] || null;
  }

  /**
   * Update game state
   */
  static updateGameState(gameSessionId, newState) {
    const games = StorageService.get(MULTIPLAYER_GAME_KEY, {});
    if (games[gameSessionId]) {
      games[gameSessionId].state = { ...games[gameSessionId].state, ...newState };
      StorageService.set(MULTIPLAYER_GAME_KEY, games);
      return games[gameSessionId].state;
    }
    return null;
  }

  /**
   * Record player score
   */
  static recordPlayerScore(gameSessionId, playerId, score) {
    const games = StorageService.get(MULTIPLAYER_GAME_KEY, {});
    const game = games[gameSessionId];

    if (game) {
      const playerIndex = game.players.findIndex(p => p.id === playerId);
      if (playerIndex >= 0) {
        game.players[playerIndex].score = score;
        StorageService.set(MULTIPLAYER_GAME_KEY, games);
        // Award gamification points
        GamificationService.addPoints(playerId, score);
        return game.players[playerIndex];
      }
    }
    return null;
  }

  /**
   * Get active game sessions
   */
  static getActiveGames() {
    const games = StorageService.get(MULTIPLAYER_GAME_KEY, {});
    return Object.values(games);
  }

  /**
   * End a game session
   */
  static endGame(gameSessionId) {
    const games = StorageService.get(MULTIPLAYER_GAME_KEY, {});
    if (games[gameSessionId]) {
      // Process results, update leaderboards, give rewards
      const game = games[gameSessionId];
      game.players.forEach(player => {
        GamificationService.addPoints(player.id, player.score);
        // Add more rewards as needed
      });
      delete games[gameSessionId];
      StorageService.set(MULTIPLAYER_GAME_KEY, games);
      return true;
    }
    return false;
  }

}