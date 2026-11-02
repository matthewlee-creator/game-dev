/**
 * HOI4 Web Grand Strategy Engine
 * Scope: Europe (1936 - 1955)
 */

class HOI4GameEngine {
  constructor(playerCountryCode = 'GER', difficulty = 'normal') {
    this.difficulty = difficulty; 
    this.isPaused = true;
    this.gameSpeed = 1; // 1 (slow) to 5 (fast)
    this.tickInterval = null;
    this.tickRateMs = 1000;

    // Time Tracking (1936 - 1955 hard-stop)
    this.currentDate = new Date(1936, 0, 1);
    this.endDate = new Date(1955, 11, 31);

    this.playerCountry = playerCountryCode;

    this.nations = {};
    this.factions = {};
    
    this.initDefaultNations();
  }

  initDefaultNations() {
    this.nations = {
      GER: {
        name: "German Reich",
        ideology: "fascism",
        stability: 0.85,
        warExhaustion: 0.0,
        resources: { steel: 120, aluminum: 40, oil: 10, rubber: 5 },
        civilianFactories: 35,
        militaryFactories: 28,
        navalDockyards: 10,
        productionLines: [
          { item: 'infantry_equipment', allocatedFactories: 10, progress: 0, outputRate: 15 },
          { item: 'light_tank', allocatedFactories: 5, progress: 0, outputRate: 4 }
        ],
        intel: {},
        isOccupied: false
      },
      FRA: {
        name: "French Republic",
        ideology: "democratic",
        stability: 0.50,
        warExhaustion: 0.0,
        resources: { steel: 80, aluminum: 60, oil: 5, rubber: 0 },
        civilianFactories: 25,
        militaryFactories: 15,
        navalDockyards: 8,
        productionLines: [
          { item: 'infantry_equipment', allocatedFactories: 8, progress: 0, outputRate: 10 }
        ],
        intel: {},
        isOccupied: false
      },
      SOV: {
        name: "Soviet Union",
        ideology: "communism",
        stability: 0.70,
        warExhaustion: 0.0,
        resources: { steel: 150, aluminum: 50, oil: 90, rubber: 0 },
        civilianFactories: 40,
        militaryFactories: 30,
        navalDockyards: 5,
        productionLines: [
          { item: 'infantry_equipment', allocatedFactories: 12, progress: 0, outputRate: 18 }
        ],
        intel: {},
        isOccupied: false
      },
      GBR: {
        name: "United Kingdom",
        ideology: "democratic",
        stability: 0.80,
        warExhaustion: 0.0,
        resources: { steel: 90, aluminum: 30, oil: 40, rubber: 20 },
        civilianFactories: 30,
        militaryFactories: 20,
        navalDockyards: 18,
        productionLines: [
          { item: 'infantry_equipment', allocatedFactories: 10, progress: 0, outputRate: 12 }
        ],
        intel: {},
        isOccupied: false
      }
    };
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      if (this.tickInterval) {
        clearInterval(this.tickInterval);
        this.tickInterval = null;
      }
    } else {
      this.startLoop();
    }
  }

  setSpeed(speedLevel) {
    this.gameSpeed = Math.max(1, Math.min(5, speedLevel));
    this.tickRateMs = 1200 / (this.gameSpeed * 1.5);
    if (!this.isPaused) {
      clearInterval(this.tickInterval);
      this.startLoop();
    }
  }

  startLoop() {
    this.tickInterval = setInterval(() => {
      this.onDailyTick();
    }, this.tickRateMs);
  }

  onDailyTick() {
    this.currentDate.setDate(this.currentDate.getDate() + 1);

    // 1. Process Economy & Trade
    this.processEconomy();

    // 2. Process AI Decisions
    if (this.aiEngine) {
      this.aiEngine.processDailyAITick();
    }

    // 3. Process Historical Events
    if (this.eventEngine) {
      this.eventEngine.processDailyEventTick();
    }

    // 4. Process Politics & Stability
    this.processInternalPolitics();

    // 5. Check Victory / Sandbox Limits
    this.checkGameConditions();

    // 6. Autosave on 1st of month
    if (this.currentDate.getDate() === 1) {
      this.saveToLocalStorage();
    }

    if (typeof this.onUIUpdate === 'function') {
      this.onUIUpdate(this.getStateSummary());
    }
  }

  processEconomy() {
    if (this.tradeEngine) {
      this.tradeEngine.processDailyTradeTick();
    }

    Object.keys(this.nations).forEach(tag => {
      const nation = this.nations[tag];
      nation.productionLines.forEach(line => {
        const resourceEfficiency = line.currentResourceEfficiency || 1.0;
        const dailyProgress = line.allocatedFactories * line.outputRate * resourceEfficiency * 0.1;
        line.progress += dailyProgress;

        if (line.progress >= 100) {
          line.progress -= 100;
        }
      });
    });
  }

  processInternalPolitics() {
    Object.keys(this.nations).forEach(tag => {
      const nation = this.nations[tag];
      if (nation.warExhaustion > 0.5) {
        nation.stability -= 0.001;
      }
      if (nation.stability < 0.20 && !nation.inCivilWar) {
        this.triggerCivilWar(tag);
      }
    });
  }

  triggerCivilWar(countryTag) {
    if (countryTag === this.playerCountry) {
      console.warn("CRITICAL: Civil war broken out in player's nation!");
    }
  }

  checkGameConditions() {
    if (this.nations[this.playerCountry] && this.nations[this.playerCountry].isOccupied) {
      this.togglePause();
      alert("Your nation has been fully occupied. Game Over!");
      return;
    }

    if (this.currentDate >= this.endDate) {
      this.togglePause();
      alert("Reached December 31, 1955. Sandbox playthrough complete!");
    }
  }

  saveToLocalStorage() {
    const saveData = {
      currentDate: this.currentDate.toISOString(),
      playerCountry: this.playerCountry,
      difficulty: this.difficulty,
      nations: this.nations
    };
    localStorage.setItem('hoi4_web_savegame', JSON.stringify(saveData));
  }

  loadFromLocalStorage() {
    const raw = localStorage.getItem('hoi4_web_savegame');
    if (!raw) return false;
    
    const saveData = JSON.parse(raw);
    this.currentDate = new Date(saveData.currentDate);
    this.playerCountry = saveData.playerCountry;
    this.difficulty = saveData.difficulty;
    this.nations = saveData.nations;
    return true;
  }

  getStateSummary() {
    const player = this.nations[this.playerCountry] || {};
    return {
      date: this.currentDate.toISOString().split('T')[0],
      playerTag: this.playerCountry,
      ideology: player.ideology ? player.ideology.toUpperCase() : 'N/A',
      stability: (player.stability * 100).toFixed(1) + '%',
      warExhaustion: ((player.warExhaustion || 0) * 100).toFixed(1) + '%',
      civilianFactories: player.civilianFactories || 0,
      militaryFactories: player.militaryFactories || 0,
      navalDockyards: player.navalDockyards || 0,
      resources: player.resources || { steel: 0, aluminum: 0, oil: 0, rubber: 0 }
    };
  }
}
