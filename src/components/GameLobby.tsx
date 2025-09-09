"use client";

import { useState } from 'react';

interface GameLobbyProps {
  onCreateGame: (name: string) => void;
  onJoinGame: (code: string, name: string) => void;
  loading: boolean;
  error: string | null;
  onClearError: () => void;
}

export default function GameLobby({ onCreateGame, onJoinGame, loading, error, onClearError }: GameLobbyProps) {
  const [gameCode, setGameCode] = useState('');
  const [name, setName] = useState('');

  const handleJoinClick = () => {
    if (!gameCode || !name) {
      onClearError();
      return;
    }
    onJoinGame(gameCode, name);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Who's Most Likely To?</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <div className="mb-4">
          <label className="block text-sm text-gray-700 mb-1">Your name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full py-2 px-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
          />
        </div>

        <button
          onClick={() => name && onCreateGame(name)}
          disabled={loading || !name}
          className="w-full py-3 px-4 mb-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          {loading ? 'Creating...' : 'Create New Game'}
        </button>
        
        <div className="flex items-center my-4">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-4 text-gray-500">or</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>
        
        <div className="flex mb-4">
          <input
            type="text"
            value={gameCode}
            onChange={(e) => setGameCode(e.target.value.toUpperCase())}
            placeholder="Enter game code"
            className="flex-grow py-2 px-4 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ textTransform: 'uppercase' }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && gameCode && name) {
                handleJoinClick();
              }
            }}
          />
          <button
            onClick={handleJoinClick}
            disabled={!gameCode || !name || loading}
            className="py-2 px-4 bg-green-600 text-white rounded-r-md hover:bg-green-700 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
          >
            {loading ? 'Joining...' : 'Join'}
          </button>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">How to play:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Create a game or join with a code</li>
            <li>• Enter your name to play</li>
            <li>• Vote on who is most likely to do each prompt</li>
            <li>• See results in real-time</li>
          </ul>
        </div>
      </div>
    </div>
  );
}