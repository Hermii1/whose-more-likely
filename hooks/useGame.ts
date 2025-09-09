"use client";

import { useState } from 'react';

interface Player {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface Prompt {
  id: string;
  text: string;
  category: string;
}

interface GameSession {
  id: string;
  code: string;
  createdAt: string;
  isActive: boolean;
  players: Array<{ user: Player }>;
  phase?: 'LOBBY' | 'QUESTION' | 'VOTING' | 'RESULTS';
  currentPromptId?: string | null;
}

export const useGame = () => {
  const [currentGame, setCurrentGame] = useState<GameSession | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null); // Track current player
  const [phase, setPhase] = useState<'LOBBY' | 'QUESTION' | 'VOTING' | 'RESULTS'>('LOBBY');

  const createGame = async (playerName: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerName }), // Send player name when creating game
      });
      
      if (!response.ok) {
        throw new Error('Failed to create game');
      }
      
      const { game, userId } = await response.json();
      setCurrentGame(game);
      setPlayers(game.players.map((p: any) => p.user));
      setCurrentPlayerId(userId);
      setPhase(game.phase);
      
      return game;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create game');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const joinGame = async (code: string, playerName: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/game/${code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName })
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to join game');
      }
      const { game, userId } = await response.json();
      setCurrentGame(game);
      setPlayers(game.players.map((p: any) => p.user));
      setCurrentPlayerId(userId);
      setPhase(game.phase);
      return game;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to join game');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateGameState = async (code: string, next: { phase?: 'LOBBY'|'QUESTION'|'VOTING'|'RESULTS'; currentPromptId?: string|null; }) => {
    try {
      const response = await fetch(`/api/game/${code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next)
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update game');
      }
      const updated = await response.json();
      setCurrentGame(updated);
      setPlayers(updated.players.map((p: any) => p.user));
      setPhase(updated.phase);
      return updated;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update game');
      return null;
    }
  };

  const refreshGame = async () => {
    if (!currentGame) return null;
    try {
      const response = await fetch(`/api/game/${currentGame.code}`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch game');
      }
      const game = await response.json();
      setCurrentGame(game);
      setPlayers(game.players.map((p: any) => p.user));
      if (game.phase) setPhase(game.phase);
      return game;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch game');
      return null;
    }
  };
  const submitVote = async (promptId: string, targetId: string): Promise<boolean> => {
    if (!currentGame || !currentPlayerId) {
      setError('You must be in a game to vote');
      return false;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameSessionId: currentGame.id,
          promptId,
          voterId: currentPlayerId, // Add the voterId
          targetId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit vote');
      }
      
      await response.json();
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to submit vote');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getPrompts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/prompts');
      
      if (!response.ok) {
        throw new Error('Failed to fetch prompts');
      }
      
      const promptsData = await response.json();
      setPrompts(promptsData);
      return promptsData;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch prompts');
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    currentGame,
    players,
    prompts,
    loading,
    error,
    currentPlayerId,
    phase,
    createGame,
    joinGame,
    submitVote,
    getPrompts,
    updateGameState,
    refreshGame,
    setError,
  };
};