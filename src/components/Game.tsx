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
  phase?: 'LOBBY' | 'QUESTION' | 'VOTING' | 'RESULTS';
}

interface GameProps {
  gameSession: GameSession;
  players: Player[];
  prompts: Prompt[];
  onSubmitVote: (promptId: string, targetId: string) => Promise<boolean>;
  onLeaveGame: () => void;
  loading: boolean;
  error: string | null;
  phase?: 'LOBBY' | 'QUESTION' | 'VOTING' | 'RESULTS';
  onUpdateState?: (next: { phase?: 'LOBBY'|'QUESTION'|'VOTING'|'RESULTS'; currentPromptId?: string|null; }) => Promise<void> | void;
}

export default function Game({ gameSession, players, prompts, onSubmitVote, onLeaveGame, loading, error, phase = 'LOBBY', onUpdateState }: GameProps) {
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [localPhase, setLocalPhase] = useState<'LOBBY' | 'QUESTION' | 'VOTING' | 'RESULTS'>(phase || gameSession.phase || 'LOBBY');
  
  const currentPrompt = prompts[currentPromptIndex];
  
  // Since we removed authentication, we can't filter by current user
  // Let's just show all players for voting
  const votingPlayers = players;

  const handleVote = async () => {
    if (selectedPlayer && currentPrompt) {
      const success = await onSubmitVote(currentPrompt.id, selectedPlayer.id);
      if (success) {
        setSelectedPlayer(null);
        setLocalPhase('RESULTS');
        try {
          if (onUpdateState) {
            await onUpdateState({ phase: 'RESULTS', currentPromptId: currentPrompt.id });
          }
        } catch {}
      }
    }
  };

  const skipPrompt = async () => {
    setSelectedPlayer(null);
    setLocalPhase('RESULTS');
    try {
      if (onUpdateState && currentPrompt) {
        await onUpdateState({ phase: 'RESULTS', currentPromptId: currentPrompt.id });
      }
    } catch {}
  };

  const goToVoting = async () => {
    setLocalPhase('VOTING');
    try {
      if (onUpdateState && currentPrompt) {
        await onUpdateState({ phase: 'VOTING', currentPromptId: currentPrompt.id });
      }
    } catch {}
  };

  const nextQuestion = async () => {
    const nextIndex = (currentPromptIndex + 1) % prompts.length;
    setCurrentPromptIndex(nextIndex);
    setLocalPhase('QUESTION');
    try {
      if (onUpdateState) {
        await onUpdateState({ phase: 'QUESTION', currentPromptId: prompts[nextIndex]?.id });
      }
    } catch {}
  };

  type VoteRecord = { promptId: string; targetId: string };
  const computeResults = () => {
    const currentId = currentPrompt?.id;
    const votes = (gameSession as unknown as { votes?: VoteRecord[] }).votes || [];
    const filtered = currentId ? votes.filter((v: VoteRecord) => v.promptId === currentId) : [];
    const total = filtered.length || 0;
    const counts: Record<string, number> = {};
    filtered.forEach((v: VoteRecord) => {
      counts[v.targetId] = (counts[v.targetId] || 0) + 1;
    });
    const results = players.map((p) => ({
      player: p,
      count: counts[p.id] || 0,
      pct: total ? Math.round(((counts[p.id] || 0) / total) * 100) : 0,
    }));
    results.sort((a, b) => b.count - a.count);
    return { results, total };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 flex items-center justify-center">
        <div className="text-xl">Loading game...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-6 p-4 bg-white rounded-lg shadow">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Game Code: {gameSession.code}</h2>
            <p className="text-sm text-gray-600">{players.length} players in game</p>
            {(gameSession.phase || localPhase) && (
              <p className="text-xs text-gray-700 mt-1">Phase: {gameSession.phase || localPhase}</p>
            )}
          </div>
          <button
            onClick={onLeaveGame}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            New Game
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Game Area */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              {(localPhase === 'LOBBY') && (
                <div>
                  <div className="text-center mb-8">
                    <div className="text-2xl font-semibold text-black mb-6 p-6 bg-green-50 rounded-lg border border-green-100 min-h-[120px] flex items-center justify-center">
                      Waiting for players to join...
                    </div>
                    <p className="text-sm text-gray-900">Game Code: {gameSession.code}</p>
                    <p className="text-sm text-gray-700 mt-2">{players.length} player(s) in game</p>
                  </div>
                  <div className="flex justify-center">
                    <button 
                      onClick={() => {
                        setLocalPhase('QUESTION');
                        if (onUpdateState) onUpdateState({ phase: 'QUESTION' });
                      }} 
                      className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                      disabled={prompts.length === 0}
                    >
                      {prompts.length === 0 ? 'Loading prompts...' : 'Start Game'}
                    </button>
                  </div>
                </div>
              )}

              {(localPhase === 'QUESTION') && (
                <div>
                  <div className="text-center mb-8">
                    <div className="text-2xl font-semibold text-black mb-6 p-6 bg-blue-50 rounded-lg border border-blue-100 min-h-[120px] flex items-center justify-center">
                      {currentPrompt?.text || "Loading prompts..."}
                    </div>
                    <p className="text-sm text-gray-900">Prompt {currentPromptIndex + 1} of {prompts.length}</p>
                  </div>
                  <div className="flex justify-center">
                    <button onClick={goToVoting} className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Start Voting</button>
                  </div>
                </div>
              )}

              {(localPhase === 'VOTING') && (
                <div>
                  <div className="text-center mb-8">
                    <div className="text-2xl font-semibold text-black mb-6 p-6 bg-blue-50 rounded-lg border border-blue-100 min-h-[120px] flex items-center justify-center">
                      {currentPrompt?.text || "Loading prompts..."}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {votingPlayers.map((player) => (
                      <div
                        key={player.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedPlayer?.id === player.id
                            ? 'bg-blue-100 border-blue-500 transform scale-105 shadow-md'
                            : 'bg-white border-gray-200 hover:bg-gray-50 hover:shadow-sm'
                        }`}
                        onClick={() => setSelectedPlayer(player)}
                      >
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center mr-3 text-white font-bold text-lg">
                            {player.name?.charAt(0).toUpperCase() || player.email?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-medium text-gray-800 block">{player.name || player.email}</span>
                            <span className="text-sm text-gray-600">{player.email}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={handleVote}
                      disabled={!selectedPlayer || loading}
                      className={`flex-1 py-3 rounded-md text-white font-semibold transition-colors ${
                        selectedPlayer && !loading
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'bg-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {loading ? 'Submitting...' : 'Vote'}
                    </button>
                    
                    <button
                      onClick={skipPrompt}
                      className="px-4 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Skip
                    </button>
                  </div>
                </div>
              )}

              {(localPhase === 'RESULTS') && (
                <div>
                  <div className="text-center mb-8">
                    <div className="text-2xl font-semibold mb-2">Results</div>
                    <div className="text-black mb-4">{currentPrompt?.text}</div>
                  </div>
                  {(() => {
                    const { results, total } = computeResults();
                    return (
                      <div className="space-y-3">
                        {results.map(({ player, pct, count }) => (
                          <div key={player.id} className="">
                            <div className="flex justify-between text-sm text-gray-700 mb-1">
                              <span>{player.name || player.email}</span>
                              <span>{pct}% ({count}/{total})</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded h-3 overflow-hidden">
                              <div className="bg-blue-600 h-3" style={{ width: `${pct}%` }}></div>
                            </div>
                          </div>
                        ))}
                        <div className="pt-4 flex gap-3">
                          <button onClick={nextQuestion} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Next Question</button>
                          <button onClick={async () => {
                            setLocalPhase('QUESTION');
                            try { if (onUpdateState) await onUpdateState({ phase: 'QUESTION', currentPromptId: currentPrompt?.id }); } catch {}
                          }} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">Re-Show Question</button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Players Panel */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-3">Players ({players.length})</h3>
              <div className="space-y-2">
                {players.map(player => (
                  <div key={player.id} className="flex items-center p-2 bg-gray-50 rounded">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center mr-2 text-white text-sm font-bold">
                      {player.name?.charAt(0).toUpperCase() || player.email?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-700">{player.name || player.email}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}