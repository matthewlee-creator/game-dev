/**
 * HOI4 Web Grand Strategy Engine - AI Decision & Personality Engine
 */

class AIPersonalityEngine {
  constructor(gameEngine) {
    this.game = gameEngine;

    this.difficultyModifiers = {
      easy:   { aggressiveThreshold: 0.8, productionSpeed: 0.8, militaryFocusWeight: 0.4 },
      normal: { aggressiveThreshold: 0.5, productionSpeed: 1.0, militaryFocusWeight: 0.6 },
      hard:   { aggressiveThreshold: 0.3, productionSpeed: 1.3, militaryFocusWeight: 0.8 }
    };

    this.personalities = {
      GER: { ruler: "Adolf Hitler", stance: "EXPANSIONIST", riskTolerance: 0.9, targetIdeology: "fascism" },
      FRA: { ruler: "Albert Lebrun", stance: "DEFENSIVE", riskTolerance: 0.2, targetIdeology: "democratic" },
      SOV: { ruler: "Joseph Stalin", stance: "IDEOLOGICAL", riskTolerance: 0.6, targetIdeology: "communism" },
      GBR: { ruler: "Winston Churchill", stance: "DEFENSIVE", riskTolerance: 0.4, targetIdeology: "democratic" },
      ITA: { ruler: "Benito Mussolini", stance: "OPPORTUNISTIC", riskTolerance: 0.7, targetIdeology: "fascism" }
    };
  }

  processDailyAITick() {
    const diff = this.difficultyModifiers[this.game.difficulty] || this.difficultyModifiers.normal;

    Object.keys(this.game.nations).forEach(tag => {
      if (tag === this.game.playerCountry) return;

      const nation = this.game.nations[tag];
      const personality = this.personalities[tag] || { stance: "NEUTRAL", riskTolerance: 0.3 };

      this.manageAIProduction(tag, nation, diff, personality);
      this.evaluateStabilityAndIdeology(tag, nation);
    });
  }

  manageAIProduction(tag, nation, diff, personality) {
    const assignedFactories = nation.productionLines.reduce((sum, line) => sum + line.allocatedFactories, 0);
    const unassigned = nation.militaryFactories - assignedFactories;

    if (unassigned > 0) {
      let targetLine = nation.productionLines.find(l => l.item === 'infantry_equipment');
      if (!targetLine) {
        targetLine = { item: 'infantry_equipment', allocatedFactories: 0, progress: 0, outputRate: 12 };
        nation.productionLines.push(targetLine);
      }
      targetLine.allocatedFactories += unassigned;
    }

    if (personality.stance === 'EXPANSIONIST' && Math.random() < diff.militaryFocusWeight * 0.05) {
      if (nation.civilianFactories > 15) {
        nation.civilianFactories -= 1;
        nation.militaryFactories += 1;
      }
    }
  }

  evaluateEventChoice(event, optionList, countryTag) {
    const personality = this.personalities[countryTag] || { stance: "NEUTRAL", riskTolerance: 0.5 };

    if (personality.stance === 'EXPANSIONIST') {
      const aggressiveOption = optionList.find(opt => opt.isAggressive || opt.isHistorical);
      if (aggressiveOption && Math.random() > (1 - personality.riskTolerance)) {
        return aggressiveOption.id;
      }
    }

    const defaultOpt = optionList.find(opt => opt.isHistorical) || optionList[0];
    return defaultOpt.id;
  }

  evaluateStabilityAndIdeology(tag, nation) {
    if (nation.stability < 0.25 && Math.random() < 0.02) {
      nation.stability = 0.40;
    }
  }
}
