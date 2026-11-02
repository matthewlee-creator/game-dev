/**
 * HOI4 Web Grand Strategy Engine - Trade & Resource Economy
 */

class TradeEngine {
  constructor(gameEngine, navalManager) {
    this.game = gameEngine;
    this.navalManager = navalManager;
    
    this.RESOURCE_TYPES = ['steel', 'aluminum', 'oil', 'rubber'];
    this.UNITS_PER_CIV_FACTORY = 8;
    
    this.activeTradeDeals = [];
  }

  getNationResourceBalance(tag) {
    const nation = this.game.nations[tag];
    if (!nation) return null;

    const balance = {
      steel: nation.resources.steel || 0,
      aluminum: nation.resources.aluminum || 0,
      oil: nation.resources.oil || 0,
      rubber: nation.resources.rubber || 0,
      civFactoriesAllocatedToTrade: 0
    };

    this.activeTradeDeals.forEach(deal => {
      if (deal.status !== 'ACTIVE') return;

      if (deal.importer === tag) {
        if (deal.isBlockaded) return;
        balance[deal.resourceType] += deal.amount;
        balance.civFactoriesAllocatedToTrade += deal.civFactoriesCost;
      }

      if (deal.exporter === tag) {
        balance[deal.resourceType] -= deal.amount;
      }
    });

    return balance;
  }

  getAvailableCivilianFactories(tag) {
    const nation = this.game.nations[tag];
    const resourceBalance = this.getNationResourceBalance(tag);
    return Math.max(0, nation.civilianFactories - resourceBalance.civFactoriesAllocatedToTrade);
  }

  createTradeDeal(importerTag, exporterTag, resourceType, requestedAmount, requiredSeaZone = null) {
    const importer = this.game.nations[importerTag];
    const exporter = this.game.nations[exporterTag];

    if (!importer || !exporter) return { success: false, reason: "Invalid nation tag." };
    if (!this.RESOURCE_TYPES.includes(resourceType)) return { success: false, reason: "Invalid resource type." };

    const civFactoriesNeeded = Math.ceil(requestedAmount / this.UNITS_PER_CIV_FACTORY);
    const availableCivs = this.getAvailableCivilianFactories(importerTag);

    if (availableCivs < civFactoriesNeeded) {
      return { success: false, reason: "Insufficient free civilian factories." };
    }

    const exporterBalance = this.getNationResourceBalance(exporterTag);
    if (exporterBalance[resourceType] < requestedAmount) {
      return { success: false, reason: "Exporter has insufficient resource surplus." };
    }

    const deal = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      importer: importerTag,
      exporter: exporterTag,
      resourceType: resourceType,
      amount: requestedAmount,
      civFactoriesCost: civFactoriesNeeded,
      requiredSeaZone: requiredSeaZone,
      isBlockaded: false,
      status: 'ACTIVE'
    };

    if (requiredSeaZone && this.navalManager) {
      const isSafe = this.navalManager.checkTradeRouteSafety(importerTag, exporterTag, requiredSeaZone);
      deal.isBlockaded = !isSafe;
    }

    this.activeTradeDeals.push(deal);
    return { success: true, deal: deal };
  }

  cancelTradeDeal(dealId) {
    const index = this.activeTradeDeals.findIndex(d => d.id === dealId);
    if (index !== -1) {
      this.activeTradeDeals[index].status = 'CANCELLED';
      this.activeTradeDeals.splice(index, 1);
      return true;
    }
    return false;
  }

  processDailyTradeTick() {
    this.activeTradeDeals.forEach(deal => {
      if (deal.requiredSeaZone && deal.status === 'ACTIVE' && this.navalManager) {
        const isSafe = this.navalManager.checkTradeRouteSafety(deal.importer, deal.exporter, deal.requiredSeaZone);
        deal.isBlockaded = !isSafe;
      }
    });

    Object.keys(this.game.nations).forEach(tag => {
      const nation = this.game.nations[tag];
      const currentResources = this.getNationResourceBalance(tag);
      
      const resourceDemand = { steel: 0, aluminum: 0, oil: 0, rubber: 0 };
      
      nation.productionLines.forEach(line => {
        const lineReqs = this.getProductionResourceRequirements(line.item, line.allocatedFactories);
        resourceDemand.steel += lineReqs.steel || 0;
        resourceDemand.aluminum += lineReqs.aluminum || 0;
        resourceDemand.oil += lineReqs.oil || 0;
        resourceDemand.rubber += lineReqs.rubber || 0;
      });

      nation.productionLines.forEach(line => {
        const reqs = this.getProductionResourceRequirements(line.item, line.allocatedFactories);
        let lineEfficiency = 1.0;

        this.RESOURCE_TYPES.forEach(res => {
          if (reqs[res] > 0) {
            const ratio = currentResources[res] / Math.max(1, resourceDemand[res]);
            if (ratio < 1.0) {
              lineEfficiency *= Math.max(0.1, ratio);
            }
          }
        });

        line.currentResourceEfficiency = lineEfficiency;
      });
    });
  }

  getProductionResourceRequirements(itemType, factoryCount) {
    const baseRequirements = {
      'infantry_equipment': { steel: 2, aluminum: 0, oil: 0, rubber: 0 },
      'support_equipment': { steel: 1, aluminum: 1, oil: 0, rubber: 0 },
      'light_tank':         { steel: 3, aluminum: 0, oil: 1, rubber: 1 },
      'medium_tank':        { steel: 4, aluminum: 0, oil: 2, rubber: 1 },
      'fighter_aircraft':   { steel: 1, aluminum: 3, oil: 1, rubber: 1 }
    };

    const base = baseRequirements[itemType] || { steel: 1, aluminum: 0, oil: 0, rubber: 0 };
    return {
      steel: base.steel * factoryCount,
      aluminum: base.aluminum * factoryCount,
      oil: base.oil * factoryCount,
      rubber: base.rubber * factoryCount
    };
  }
}
