import React, { useEffect, useState, useRef } from "react";

// Enhanced Roguelike with better visuals, animations, and new features
const TILE = {
  WALL: 0,
  FLOOR: 1,
  PLAYER: 2,
  ENEMY: 3,
  GOLD: 4,
  POTION: 5,
  TRAP: 6,
};

const ENEMY_TYPES = {
  GOBLIN: { symbol: 'G', hp: 3, damage: 1, color: 'bg-red-500', name: 'Goblin' },
  ORC: { symbol: 'O', hp: 5, damage: 2, color: 'bg-red-700', name: 'Orc' },
};

const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function makeMap(width, height, carveSteps = 1800) {
  const map = Array.from({ length: height }, () => Array(width).fill(TILE.WALL));
  let x = Math.floor(width / 2);
  let y = Math.floor(height / 2);
  map[y][x] = TILE.FLOOR;

  for (let i = 0; i < carveSteps; i++) {
    const r = Math.random();
    if (r < 0.25) x += 1;
    else if (r < 0.5) x -= 1;
    else if (r < 0.75) y += 1;
    else y -= 1;
    x = Math.max(1, Math.min(width - 2, x));
    y = Math.max(1, Math.min(height - 2, y));
    map[y][x] = TILE.FLOOR;
  }

  // Add gold
  for (let i = 0; i < 25; i++) {
    const rx = Math.floor(Math.random() * width);
    const ry = Math.floor(Math.random() * height);
    if (map[ry][rx] === TILE.FLOOR) map[ry][rx] = TILE.GOLD;
  }

  // Add potions (new feature)
  for (let i = 0; i < 8; i++) {
    const rx = Math.floor(Math.random() * width);
    const ry = Math.floor(Math.random() * height);
    if (map[ry][rx] === TILE.FLOOR) map[ry][rx] = TILE.POTION;
  }

  // Add traps (new feature)
  for (let i = 0; i < 12; i++) {
    const rx = Math.floor(Math.random() * width);
    const ry = Math.floor(Math.random() * height);
    if (map[ry][rx] === TILE.FLOOR) map[ry][rx] = TILE.TRAP;
  }

  return map;
}

function findRandomFloor(map) {
  const h = map.length;
  const w = map[0].length;
  while (true) {
    const x = Math.floor(Math.random() * w);
    const y = Math.floor(Math.random() * h);
    if (map[y][x] === TILE.FLOOR) return { x, y };
  }
}

export default function Roguelike() {
  const [mapW] = useState(33);
  const [mapH] = useState(33);
  const [map, setMap] = useState(() => makeMap(33, 33));
  const [player, setPlayer] = useState(() => findRandomFloor(makeMap(33, 33)));
  const [enemies, setEnemies] = useState([]);
  const [gold, setGold] = useState(0);
  const [hp, setHp] = useState(10);
  const [maxHp, setMaxHp] = useState(10);
  const [turn, setTurn] = useState(0);
  const [message, setMessage] = useState('Welcome! Use arrows or the on-screen D-pad.');
  const [isAttacking, setIsAttacking] = useState(false);
  const [attackDirection, setAttackDirection] = useState(null);
  const [playerBounce, setPlayerBounce] = useState(false);
  const [revealedTraps, setRevealedTraps] = useState(new Set());
  const containerRef = useRef(null);

  // Initialize map and entities
  useEffect(() => {
    const newMap = makeMap(mapW, mapH, 1600);
    const start = findRandomFloor(newMap);
    const e = [];
    for (let i = 0; i < 8; i++) {
      const p = findRandomFloor(newMap);
      const type = Math.random() < 0.6 ? ENEMY_TYPES.GOBLIN : ENEMY_TYPES.ORC;
      e.push({ 
        x: p.x, 
        y: p.y, 
        hp: type.hp, 
        maxHp: type.hp,
        type,
        takingDamage: false 
      });
    }
    setMap(newMap);
    setPlayer(start);
    setEnemies(e);
    setGold(0);
    setHp(10);
    setMaxHp(10);
    setTurn(0);
    setRevealedTraps(new Set());
    setMessage('New dungeon — good luck!');
  }, []);

  function isPassable(x, y) {
    if (x < 0 || y < 0 || x >= mapW || y >= mapH) return false;
    return map[y][x] !== TILE.WALL;
  }

  function enemyAt(x, y) {
    return enemies.find((en) => en.x === x && en.y === y);
  }

  function triggerAttackAnimation(direction) {
    setAttackDirection(direction);
    setIsAttacking(true);
    setTimeout(() => {
      setIsAttacking(false);
      setAttackDirection(null);
    }, 300);
  }

  function triggerPlayerBounce() {
    setPlayerBounce(true);
    setTimeout(() => setPlayerBounce(false), 200);
  }

  function movePlayer(dx, dy) {
    const nx = player.x + dx;
    const ny = player.y + dy;
    
    if (!isPassable(nx, ny)) {
      setMessage('Bumped into a wall.');
      triggerPlayerBounce();
      return;
    }

    const e = enemyAt(nx, ny);
    if (e) {
      // Attack animation
      let direction = 'right';
      if (dx < 0) direction = 'left';
      else if (dy < 0) direction = 'up';
      else if (dy > 0) direction = 'down';
      
      triggerAttackAnimation(direction);
      
      const damage = Math.floor(Math.random() * 3) + 2; // 2-4 damage
      e.hp -= damage;
      e.takingDamage = true;
      setTimeout(() => {
        setEnemies(prev => prev.map(enemy => 
          enemy === e ? { ...enemy, takingDamage: false } : enemy
        ));
      }, 300);
      
      setMessage(`You strike the ${e.type.name} for ${damage} damage!`);
      
      if (e.hp <= 0) {
        setTimeout(() => {
          setEnemies((prev) => prev.filter((p) => p !== e));
          setGold((g) => g + Math.floor(Math.random() * 3) + 1);
        }, 150);
        setMessage(`${e.type.name} slain! +${Math.floor(Math.random() * 3) + 1} gold`);
      } else {
        setTimeout(() => {
          setHp((h) => Math.max(0, h - e.type.damage));
          setMessage(`${e.type.name} counterattacks for ${e.type.damage} damage!`);
        }, 200);
      }
      setTurn((t) => t + 1);
      setTimeout(() => enemyTurn(), 400);
      return;
    }

    // Move into tile
    setPlayer({ x: nx, y: ny });

    // Handle tile effects
    const tile = map[ny][nx];
    if (tile === TILE.GOLD) {
      const goldFound = Math.floor(Math.random() * 3) + 1;
      setGold((g) => g + goldFound);
      setMap((m) => {
        const mm = m.map((r) => r.slice());
        mm[ny][nx] = TILE.FLOOR;
        return mm;
      });
      setMessage(`Found ${goldFound} gold!`);
    } else if (tile === TILE.POTION) {
      const healAmount = Math.floor(Math.random() * 4) + 3; // 3-6 heal
      setHp((h) => Math.min(maxHp, h + healAmount));
      setMap((m) => {
        const mm = m.map((r) => r.slice());
        mm[ny][nx] = TILE.FLOOR;
        return mm;
      });
      setMessage(`Healing potion restored ${healAmount} HP!`);
    } else if (tile === TILE.TRAP && !revealedTraps.has(`${nx}-${ny}`)) {
      const damage = Math.floor(Math.random() * 3) + 1; // 1-3 damage
      setHp((h) => Math.max(0, h - damage));
      setRevealedTraps(prev => new Set(prev).add(`${nx}-${ny}`));
      triggerPlayerBounce();
      setMessage(`Trap triggered! Lost ${damage} HP!`);
    } else {
      setMessage('Step.');
    }

    setTurn((t) => t + 1);
    enemyTurn();
  }

  function enemyTurn() {
    setEnemies((prev) => {
      return prev.map((en) => {
        if (en.takingDamage) return en;
        
        const dx = Math.sign(player.x - en.x);
        const dy = Math.sign(player.y - en.y);
        let nx = en.x;
        let ny = en.y;
        
        if (Math.random() < 0.7) { // 70% chance to move toward player
          if (Math.random() < 0.5) {
            if (isPassable(en.x + dx, en.y)) nx += dx;
          } else {
            if (isPassable(en.x, en.y + dy)) ny += dy;
          }
        }
        
        if (enemyAt(nx, ny) && !(nx === en.x && ny === en.y)) {
          nx = en.x;
          ny = en.y;
        }
        
        if (nx === player.x && ny === player.y) {
          setHp((h) => Math.max(0, h - en.type.damage));
          setMessage(`${en.type.name} hits you for ${en.type.damage} damage!`);
        }
        
        return { ...en, x: nx, y: ny };
      });
    });
  }

  useEffect(() => {
    function onKey(e) {
      if (hp <= 0) return;
      if (e.key === 'ArrowUp') movePlayer(0, -1);
      else if (e.key === 'ArrowDown') movePlayer(0, 1);
      else if (e.key === 'ArrowLeft') movePlayer(-1, 0);
      else if (e.key === 'ArrowRight') movePlayer(1, 0);
      else if (e.key === 'r') {
        const newMap = makeMap(mapW, mapH, 1600);
        const start = findRandomFloor(newMap);
        const e = [];
        for (let i = 0; i < 8; i++) {
          const p = findRandomFloor(newMap);
          const type = Math.random() < 0.6 ? ENEMY_TYPES.GOBLIN : ENEMY_TYPES.ORC;
          e.push({ 
            x: p.x, 
            y: p.y, 
            hp: type.hp, 
            maxHp: type.hp,
            type,
            takingDamage: false 
          });
        }
        setMap(newMap);
        setPlayer(start);
        setEnemies(e);
        setGold(0);
        setHp(10);
        setMaxHp(10);
        setRevealedTraps(new Set());
        setMessage('New dungeon generated!');
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [player, enemies, hp]);

  function viewport() {
    const radius = 8;
    const cells = [];
    for (let y = player.y - radius; y <= player.y + radius; y++) {
      const row = [];
      for (let x = player.x - radius; x <= player.x + radius; x++) {
        let tile = TILE.WALL;
        if (y >= 0 && x >= 0 && y < mapH && x < mapW) tile = map[y][x];
        const en = enemies.find((ee) => ee.x === x && ee.y === y);
        if (player.x === x && player.y === y) {
          row.push({ t: TILE.PLAYER, x, y });
        } else if (en) {
          row.push({ t: TILE.ENEMY, x, y, enemy: en });
        } else {
          row.push({ t: tile, x, y });
        }
      }
      cells.push(row);
    }
    return cells;
  }

  const cells = viewport();

  // Sword component: static when idle, animated swing when attacking
  const Sword = ({ direction, isAttacking }) => {
    const getStaticTransform = () => 'translate(40%, -20%) rotate(30deg)';
    const getSwingTransform = () => {
      switch (direction) {
        case 'up': return 'translate(-50%, -150%) rotate(-45deg)';
        case 'down': return 'translate(-50%, 50%) rotate(135deg)';
        case 'left': return 'translate(-150%, -50%) rotate(-135deg)';
        case 'right': return 'translate(50%, -50%) rotate(45deg)';
        default: return 'translate(50%, -50%) rotate(45deg)';
      }
    };

    if (!isAttacking) {
      return (
        <div 
          className="absolute inset-0 pointer-events-none z-[15]"
          style={{ transform: getStaticTransform() }}
        >
          <div className="w-5 h-1 bg-gradient-to-r from-gray-300 to-gray-500 rounded shadow-lg"></div>
        </div>
      );
    }

    const swingTransform = getSwingTransform();
    const staticTransform = getStaticTransform();

    return (
      <div 
        className="absolute inset-0 pointer-events-none z-20"
        style={{
          transform: swingTransform,
          animation: 'swordSwing 0.3s ease-out'
        }}
      >
        <div className="w-8 h-1 bg-gradient-to-r from-gray-300 to-gray-500 rounded shadow-2xl"></div>
        <style jsx>{`
          @keyframes swordSwing {
            0% { 
              opacity: 0.7; 
              transform: scale(0.8) ${staticTransform}; 
              filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
            }
            50% { 
              opacity: 1; 
              transform: scale(1.2) ${swingTransform}; 
              filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));
            }
            100% { 
              opacity: 0.7; 
              transform: scale(1) ${staticTransform}; 
              filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
            }
          }
        `}</style>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-slate-900 via-purple-900 to-slate-800 p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 shadow-2xl backdrop-blur-lg border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              ⚔️ Dungeon Crawler
            </h1>
            <div className="text-sm opacity-80 bg-white/10 px-3 py-1 rounded-full">Turn {turn}</div>
          </div>

          <div className="w-full overflow-hidden rounded-2xl border-2 border-white/20 shadow-inner bg-gradient-to-br from-slate-800 to-slate-900">
            <div
              ref={containerRef}
              className="grid relative"
              style={{
                gridTemplateColumns: `repeat(${cells[0].length}, minmax(0,1fr))`,
                gridAutoRows: 'minmax(0,1fr)',
                aspectRatio: `${cells[0].length}/${cells.length}`,
              }}
            >
              {cells.flat().map((c, i) => {
                const key = `${c.x}-${c.y}`;
                const base = 'w-full h-full flex items-center justify-center text-xs select-none relative transition-all duration-200';
                
                if (c.t === TILE.WALL) {
                  return (
                    <div key={key} className={`${base} bg-gradient-to-br from-stone-700 to-stone-800 shadow-inner border border-stone-600/30`}>
                      <div className="w-2 h-2 bg-stone-500/40 rounded-sm"></div>
                    </div>
                  );
                }
                if (c.t === TILE.FLOOR) {
                  return (
                    <div key={key} className={`${base} bg-gradient-to-br from-slate-600/20 to-slate-700/20 hover:bg-slate-500/30`}></div>
                  );
                }
                if (c.t === TILE.GOLD) {
                  return (
                    <div key={key} className={`${base} bg-gradient-to-br from-amber-400/70 to-yellow-500/70 rounded-lg shadow-lg animate-pulse`}>
                      <span className="text-amber-100 font-bold text-lg">💰</span>
                    </div>
                  );
                }
                if (c.t === TILE.POTION) {
                  return (
                    <div key={key} className={`${base} bg-gradient-to-br from-green-400/70 to-emerald-500/70 rounded-lg shadow-lg`}>
                      <span className="text-green-100 font-bold">🧪</span>
                    </div>
                  );
                }
                if (c.t === TILE.TRAP) {
                  const isRevealed = revealedTraps.has(`${c.x}-${c.y}`);
                  return (
                    <div key={key} className={`${base} ${isRevealed ? 'bg-gradient-to-br from-red-600/70 to-red-700/70' : 'bg-gradient-to-br from-slate-600/20 to-slate-700/20'} ${isRevealed ? 'animate-pulse' : ''}`}>
                      {isRevealed && <span className="text-red-100 font-bold">⚠️</span>}
                    </div>
                  );
                }
                if (c.t === TILE.PLAYER) {
                  return (
                    <div key={key} className={`${base} bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg shadow-xl transform ${playerBounce ? 'animate-bounce' : ''} ${isAttacking ? 'scale-110' : ''} transition-transform duration-200 relative overflow-hidden`}>
                      <span className="font-bold text-blue-100 text-lg relative z-10">@</span>
                      <Sword direction={attackDirection} isAttacking={isAttacking} />
                    </div>
                  );
                }
                if (c.t === TILE.ENEMY) {
                  const enemy = c.enemy;
                  const healthPercent = (enemy.hp / enemy.maxHp) * 100;
                  return (
                    <div key={key} className={`${base} ${enemy.type.color} rounded-lg shadow-xl transform ${enemy.takingDamage ? 'animate-pulse scale-110' : ''} transition-all duration-200`}>
                      <div className="relative w-full h-full flex items-center justify-center">
                        <span className="font-bold text-white">{enemy.type.symbol}</span>
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-red-900 rounded-b">
                          <div 
                            className="h-full bg-green-500 rounded-b transition-all duration-300" 
                            style={{ width: `${healthPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                }
                return <div key={key} className={base}></div>;
              })}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between bg-white/5 rounded-xl p-3">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-red-400">❤️</span>
                <div className="w-24 h-3 bg-red-900/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-500"
                    style={{ width: `${(hp / maxHp) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{hp}/{maxHp}</span>
              </div>
              <div className="text-sm text-amber-400 font-medium">💰 {gold}</div>
            </div>
            <div className="text-xs opacity-60">Use arrows or touch controls</div>
          </div>

          <div className="mt-3 text-sm p-3 rounded-xl bg-gradient-to-r from-white/5 to-white/10 border border-white/10">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span>{message}</span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-gradient-to-br from-white/8 to-white/4 shadow-2xl backdrop-blur-lg border border-white/10 flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <div className="text-lg font-semibold text-amber-400">⚡ Actions</div>
            <div className="grid grid-cols-3 gap-3">
              <button
                className="p-3 rounded-xl shadow-lg bg-gradient-to-br from-white/15 to-white/10 hover:from-white/20 hover:to-white/15 border border-white/20 font-bold text-white transition-all duration-200 hover:scale-105 active:scale-95"
                onClick={() => hp > 0 && movePlayer(0, -1)}
                disabled={hp <= 0}
              >
                ↑
              </button>
              <button
                className="p-3 rounded-xl shadow-lg bg-gradient-to-br from-purple-500/30 to-purple-600/30 hover:from-purple-500/40 hover:to-purple-600/40 border border-purple-400/30 text-white transition-all duration-200 hover:scale-105 active:scale-95"
                onClick={() => setTurn(t => t + 1)}
              >
                ⏳ Wait
              </button>
              <button
                className="p-3 rounded-xl shadow-lg bg-gradient-to-br from-white/15 to-white/10 hover:from-white/20 hover:to-white/15 border border-white/20 font-bold text-white transition-all duration-200 hover:scale-105 active:scale-95"
                onClick={() => hp > 0 && movePlayer(1, 0)}
                disabled={hp <= 0}
              >
                →
              </button>

              <button
                className="p-3 rounded-xl shadow-lg bg-gradient-to-br from-white/15 to-white/10 hover:from-white/20 hover:to-white/15 border border-white/20 font-bold text-white transition-all duration-200 hover:scale-105 active:scale-95"
                onClick={() => hp > 0 && movePlayer(-1, 0)}
                disabled={hp <= 0}
              >
                ←
              </button>
              <button
                className="p-3 rounded-xl shadow-lg bg-gradient-to-br from-green-500/30 to-green-600/30 hover:from-green-500/40 hover:to-green-600/40 border border-green-400/30 text-white transition-all duration-200 hover:scale-105 active:scale-95"
                onClick={() => {
                  const newMap = makeMap(mapW, mapH, 1600);
                  const start = findRandomFloor(newMap);
                  const e = [];
                  for (let i = 0; i < 8; i++) {
                    const p = findRandomFloor(newMap);
                    const type = Math.random() < 0.6 ? ENEMY_TYPES.GOBLIN : ENEMY_TYPES.ORC;
                    e.push({ 
                      x: p.x, 
                      y: p.y, 
                      hp: type.hp, 
                      maxHp: type.hp,
                      type,
                      takingDamage: false 
                    });
                  }
                  setMap(newMap);
                  setPlayer(start);
                  setEnemies(e);
                  setGold(0);
                  setHp(10);
                  setMaxHp(10);
                  setRevealedTraps(new Set());
                  setMessage('New dungeon generated!');
                }}
              >
                🗺️ New
              </button>
              <button
                className="p-3 rounded-xl shadow-lg bg-gradient-to-br from-white/15 to-white/10 hover:from-white/20 hover:to-white/15 border border-white/20 font-bold text-white transition-all duration-200 hover:scale-105 active:scale-95"
                onClick={() => hp > 0 && movePlayer(0, 1)}
                disabled={hp <= 0}
              >
                ↓
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="text-lg font-semibold text-amber-400 mb-3">📱 Touch Controls</div>
            <div className="grid grid-cols-3 gap-3 flex-1">
              <div></div>
              <button
                className="p-4 rounded-2xl shadow-lg bg-gradient-to-br from-blue-500/30 to-blue-600/30 hover:from-blue-500/40 hover:to-blue-600/40 border border-blue-400/30 font-bold text-white text-xl transition-all duration-200 hover:scale-105 active:scale-95"
                onClick={() => hp > 0 && movePlayer(0, -1)}
                disabled={hp <= 0}
              >
                ↑
              </button>
              <div></div>

              <button
                className="p-4 rounded-2xl shadow-lg bg-gradient-to-br from-blue-500/30 to-blue-600/30 hover:from-blue-500/40 hover:to-blue-600/40 border border-blue-400/30 font-bold text-white text-xl transition-all duration-200 hover:scale-105 active:scale-95"
                onClick={() => hp > 0 && movePlayer(-1, 0)}
                disabled={hp <= 0}
              >
                ←
              </button>
              <button
                className="p-4 rounded-2xl shadow-lg bg-gradient-to-br from-blue-500/30 to-blue-600/30 hover:from-blue-500/40 hover:to-blue-600/40 border border-blue-400/30 font-bold text-white text-xl transition-all duration-200 hover:scale-105 active:scale-95"
                onClick={() => hp > 0 && movePlayer(0, 1)}
                disabled={hp <= 0}
              >
                ↓
              </button>
              <button
                className="p-4 rounded-2xl shadow-lg bg-gradient-to-br from-blue-500/30 to-blue-600/30 hover:from-blue-500/40 hover:to-blue-600/40 border border-blue-400/30 font-bold text-white text-xl transition-all duration-200 hover:scale-105 active:scale-95"
                onClick={() => hp > 0 && movePlayer(1, 0)}
                disabled={hp <= 0}
              >
                →
              </button>
            </div>
          </div>

          <div className="text-xs opacity-70 mt-4 p-3 bg-white/5 rounded-xl">
            <div className="space-y-1">
              <div><strong>🎮 Controls:</strong> Arrow keys or touch buttons</div>
              <div><strong>⚔️ Combat:</strong> Walk into enemies to attack</div>
              <div><strong>🏃 Features:</strong> Healing potions 🧪 and hidden traps ⚠️</div>
              <div><strong>🔄 Reset:</strong> Press 'R' or use New button</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}.
