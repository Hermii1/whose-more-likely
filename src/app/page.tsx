"use client";

import { useState, useEffect } from 'react';
import Game from '../components/Game';
import GameLobby from '../components/GameLobby';
import { useGame } from '../../hooks/useGame';

export default function Home() {
  const { 
    currentGame, 
    players, 
    prompts, 
    loading, 
    error,
    createGame, 
    joinGame,
    submitVote,
    getPrompts,
    refreshGame,
    phase,
    updateGameState,
    setError
  } = useGame();

  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    const poll = setInterval(() => {
      if (currentGame) refreshGame();
    }, 1500);
    return () => clearInterval(poll);
  }, [currentGame]);

  const handleLeaveGame = () => {
    window.location.reload();
  };

  // Do not block initial render with a global spinner; show Lobby immediately

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600 mb-4">Error</div>
          <div className="text-gray-700 mb-6">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (currentGame) {
    return (
      <Game 
        gameSession={currentGame} 
        players={players} 
        prompts={prompts} 
        onSubmitVote={submitVote}
        onLeaveGame={handleLeaveGame}
        loading={loading}
        error={error}
        phase={phase}
        onUpdateState={async (next) => {
          await updateGameState(currentGame.code, next);
        }}
      />
    );
  }

  return (
    <GameLobby 
      onCreateGame={async (name) => {
        const game = await createGame(name);
        if (game) await getPrompts();
      }}
      onJoinGame={async (code, name) => {
        const game = await joinGame(code, name);
        if (game) await getPrompts();
      }}
      loading={loading}
      error={error}
      onClearError={() => setError(null)}
    />
  );
}