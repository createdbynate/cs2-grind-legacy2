import { GameProvider, useGame } from '@/contexts/GameContext';
import CharacterCreation from '@/components/CharacterCreation';
import StatsPanel from '@/components/StatsPanel';
import ActionPanel from '@/components/ActionPanel';
import EventModal from '@/components/EventModal';
import WeekLog from '@/components/WeekLog';
import GameOver from '@/components/GameOver';

function GameContent() {
  const { state } = useGame();

  if (!state) return <CharacterCreation />;
  if (state.gameOver) return <GameOver />;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Stats */}
        <div className="lg:col-span-4 space-y-4">
          <StatsPanel state={state} />
        </div>

        {/* Center: Actions */}
        <div className="lg:col-span-4 space-y-4">
          <ActionPanel />
        </div>

        {/* Right: Log */}
        <div className="lg:col-span-4 space-y-4">
          <WeekLog />
        </div>
      </div>
      <EventModal />
    </div>
  );
}

const Index = () => (
  <GameProvider>
    <GameContent />
  </GameProvider>
);

export default Index;
