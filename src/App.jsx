import React from 'react';
import { useGame } from './application/context/GameContext';
import LandingPage from './presentation/pages/LandingPage';
import Login from './presentation/pages/Login';
import Tutorial from './presentation/pages/Tutorial';
import Dashboard from './presentation/pages/Dashboard';
import TransitionPhase from './presentation/components/TransitionPhase';
import PrePhaselTransition from './presentation/components/PrePhase1Transition';
import Phase1Instructions from './presentation/pages/Phase1Instructions';
import PrePhase2Transition from './presentation/components/PrePhase2Transition';

/**
 * App component acts as a high-level router and layout manager.
 */
function App() {
  const {
    phase, setPhase,
    theme, toggleTheme,
    shopName, userName, userAvatar, setUserAvatar,
    backendStatus,
    setSimulationComplete,
    hasRestartedSimulation,
    setGameJoinDetails,
    restartSimulation,
    exitToLogin
  } = useGame();

  const [scale, setScale] = React.useState(1);
  const [dimensions, setDimensions] = React.useState({ width: 1820, height: 940 });

  React.useEffect(() => {
    const handleResize = () => {
      const designWidth = 1820;
      const designHeight = 940;
      
      const scaleX = window.innerWidth / designWidth;
      const scaleY = window.innerHeight / designHeight;
      
      // We use the limiting dimension to ensure the core design fits
      const newScale = Math.min(scaleX, scaleY);
      setScale(newScale);

      // Calculate dynamic dimensions to fill the entire screen at this scale
      // This removes the "bars" on the sides or top/bottom
      setDimensions({
        width: window.innerWidth / newScale,
        height: window.innerHeight / newScale
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden', 
      position: 'fixed', 
      top: 0, 
      left: 0,
      background: theme === 'theme-black-coffee' ? '#1e1915' : '#fdf8f5',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div 
        className={`App ${theme}`} 
        style={{ 
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          flexShrink: 0,
          position: 'relative'
        }}
      >
      {phase === 'login' && (
        <Login 
          onJoin={setGameJoinDetails} 
          theme={theme} 
          toggleTheme={toggleTheme} 
          shopName={shopName} 
          userName={userName} 
        />
      )}
      
      {phase === 'landing' && (
        <LandingPage 
          onComplete={(avatar) => { 
            setUserAvatar(avatar || 'Leo'); 
            setPhase('pre-tutorial'); 
          }} 
          theme={theme} 
          toggleTheme={toggleTheme} 
        />
      )}
      
      {phase === 'pre-tutorial' && (
        <PrePhaselTransition 
          onComplete={() => setPhase('orientation-instructions')} 
          onBackToStory={() => setPhase('landing')} 
          theme={theme} 
        />
      )}
      
      {phase === 'orientation-instructions' && (
        <Phase1Instructions 
          onComplete={() => setPhase('tutorial')} 
          theme={theme} 
          toggleTheme={toggleTheme} 
        />
      )}
      
      {phase === 'tutorial' && (
        <Tutorial
          onComplete={() => setPhase('pre-simulation')}
          theme={theme}
          toggleTheme={toggleTheme}
          shopName={shopName}
          userName={userName}
          userAvatar={userAvatar}
          backendStatus={backendStatus}
        />
      )}
      
      {phase === 'pre-simulation' && (
        <PrePhase2Transition
          onComplete={() => setPhase('transition')}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      )}
      
      {phase === 'transition' && (
        <TransitionPhase
          onComplete={() => setPhase('simulation')}
          theme={theme}
        />
      )}
      
      {phase === 'simulation' && (
        <Dashboard
          theme={theme}
          toggleTheme={toggleTheme}
          shopName={shopName}
          userName={userName}
          userAvatar={userAvatar}
          onRestart={restartSimulation}
          hasRestartedSimulation={hasRestartedSimulation}
          onExitToLogin={exitToLogin}
          backendStatus={backendStatus}
          onSimulationComplete={() => setSimulationComplete(true)}
        />
      )}
      </div>
    </div>
  );
}

export default App;
