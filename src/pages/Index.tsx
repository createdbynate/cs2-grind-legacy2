import { GameProvider, useGame } from '@/contexts/GameContext';
import CharacterCreation from '@/components/CharacterCreation';
import StatsPanel from '@/components/StatsPanel';
import ActionPanel from '@/components/ActionPanel';
import EventModal from '@/components/EventModal';
import WeekLog from '@/components/WeekLog';
import GameOver from '@/components/GameOver';

function Header() {
  const { state } = useGame();
  if (!state) return null;
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <span className="text-primary font-display font-bold text-sm tracking-tight">CS2 CAREER</span>
        <span className="w-px h-4 bg-border" />
        <span className="text-xs font-mono text-muted-foreground">{state.playerName}</span>
        <span className="text-xs font-mono text-primary">{state.stage}</span>
      </div>
      <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
        {state.team && <span className="text-foreground">{state.team.name}</span>}
        <span>Wk {state.weeks}</span>
        <span>Age {state.age}</span>
        <span className="text-cs2-gold font-bold">${state.money.toLocaleString()}</span>
      </div>
    </div>
  );
}

function GameContent() {
  const { state } = useGame();

  if (!state) return <CharacterCreation />;
  if (state.gameOver) return <GameOver />;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 p-3">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Left: Stats */}
          <div className="lg:col-span-4 space-y-3">
            <StatsPanel state={state} />
          </div>

          {/* Center: Actions */}
          <div className="lg:col-span-4 space-y-3">
            <ActionPanel />
          </div>

          {/* Right: Log */}
          <div className="lg:col-span-4 space-y-3">
            <WeekLog />
          </div>
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
