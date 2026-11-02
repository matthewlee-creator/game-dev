/**
 * Main Application Initializer & Glue Code
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Main Game Engine (Player: GER, Normal Difficulty)
  const game = new HOI4GameEngine('GER', 'normal');
  window.gameInstance = game;

  // 2. Instantiate Subsystems
  const navalManager = new SupplyAndNavalManager(game.nations);
  const tradeEngine = new TradeEngine(game, navalManager);
  const aiEngine = new AIPersonalityEngine(game);
  const eventEngine = new HistoricalEventEngine(game, aiEngine);
  const mapRenderer = new HOI4MapRenderer('hoi4Canvas', game);

  window.eventEngineInstance = eventEngine;

  game.tradeEngine = tradeEngine;
  game.aiEngine = aiEngine;
  game.eventEngine = eventEngine;

  // 3. UI Sync Callback on Daily Tick
  game.onUIUpdate = (state) => {
    document.getElementById('ui-date').innerText = state.date;
    document.getElementById('ui-nation').innerText = state.playerTag === 'GER' ? 'German Reich' : state.playerTag;
    document.getElementById('ui-ideology').innerText = state.ideology;
    document.getElementById('ui-stability').innerText = state.stability;
    document.getElementById('ui-war-exhaustion').innerText = state.warExhaustion;
    document.getElementById('ui-civ-fac').innerText = state.civilianFactories;
    document.getElementById('ui-mil-fac').innerText = state.militaryFactories;
    document.getElementById('ui-dockyards').innerText = state.navalDockyards;

    document.getElementById('ui-steel').innerText = state.resources.steel;
    document.getElementById('ui-aluminum').innerText = state.resources.aluminum;
    document.getElementById('ui-oil').innerText = state.resources.oil;
    document.getElementById('ui-rubber').innerText = state.resources.rubber;

    mapRenderer.render();
  };

  // 4. Canvas Interactivity (Selecting Provinces & Moving Units)
  const canvas = document.getElementById('hoi4Canvas');
  canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    Object.keys(mapRenderer.provinces).forEach(key => {
      const p = mapRenderer.provinces[key];
      const dist = Math.hypot(p.x - clickX, p.y - clickY);

      if (dist <= 20) {
        if (!mapRenderer.selectedProvinceKey) {
          mapRenderer.selectedProvinceKey = key;
          console.log(`Selected province: ${p.name}`);
        } else {
          console.log(`Issued movement/attack command from ${mapRenderer.selectedProvinceKey} to ${key}`);
          mapRenderer.selectedProvinceKey = null;
        }
        mapRenderer.render();
      }
    });
  });

  // 5. Controls & Pause Toggle
  const btnPause = document.getElementById('btn-pause');
  btnPause.addEventListener('click', () => {
    game.togglePause();
    btnPause.innerText = game.isPaused ? 'Play' : 'Pause';
  });

  const btnSave = document.getElementById('btn-save');
  btnSave.addEventListener('click', () => {
    game.saveToLocalStorage();
    alert('Game state saved to localStorage!');
  });

  // Initial render
  mapRenderer.render();
});
