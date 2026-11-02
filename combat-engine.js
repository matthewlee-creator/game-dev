/**
 * HOI4 Web Grand Strategy Engine - Combat & Supply System
 */

class Division {
  constructor(id, name, ownerTag, templateType = 'infantry') {
    this.id = id;
    this.name = name;
    this.ownerTag = ownerTag;
    this.templateType = templateType;

    const baseStats = this.getTemplateStats(templateType);
    
    this.maxOrganization = baseStats.maxOrganization;
    this.currentOrganization = baseStats.maxOrganization;
    this.maxHp = baseStats.maxHp;
    this.currentHp = baseStats.maxHp;
    
    this.softAttack = baseStats.softAttack;
    this.hardAttack = baseStats.hardAttack;
    this.defense = baseStats.defense;
    this.breakthrough = baseStats.breakthrough;
    this.combatWidth = baseStats.combatWidth;
    this.supplyConsumption = baseStats.supplyConsumption;
    
    this.digInLevel = 0;
    this.isRetreating = false;
  }

  getTemplateStats(type) {
    switch (type) {
      case 'armored':
        return { maxOrganization: 40, maxHp: 100, softAttack: 28, hardAttack: 18, defense: 15, breakthrough: 36, combatWidth: 30, supplyConsumption: 1.8 };
      case 'motorized':
        return { maxOrganization: 55, maxHp: 120, softAttack: 16, hardAttack: 5, defense: 22, breakthrough: 18, combatWidth: 20, supplyConsumption: 1.2 };
      case 'infantry':
      default:
        return { maxOrganization: 60, maxHp: 150, softAttack: 12, hardAttack: 3, defense: 28, breakthrough: 8, combatWidth: 20, supplyConsumption: 0.8 };
    }
  }
}

class ActiveBattle {
  constructor(battleId, provinceId, attackers, defenders, terrain = 'plains') {
    this.battleId = battleId;
    this.provinceId = provinceId;
    this.attackers = attackers;
    this.defenders = defenders;
    this.terrain = terrain;
    
    this.baseCombatWidth = 80;
    this.airSupremacyFactor = 0.0;
    this.isResolved = false;
    this.winner = null;
  }

  getTerrainModifier() {
    switch (this.terrain) {
      case 'mountains': return { attackPenalty: 0.40, combatWidthMult: 0.66 };
      case 'forest':    return { attackPenalty: 0.20, combatWidthMult: 0.80 };
      case 'urban':     return { attackPenalty: 0.30, combatWidthMult: 0.90 };
      case 'plains':
      default:          return { attackPenalty: 0.00, combatWidthMult: 1.00 };
    }
  }

  resolveDailyTick() {
    if (this.isResolved) return;

    const terrainMod = this.getTerrainModifier();
    const activeWidthLimit = this.baseCombatWidth * terrainMod.combatWidthMult;

    const activeAttackers = this.selectUnitsForFrontage(this.attackers, activeWidthLimit);
    const activeDefenders = this.selectUnitsForFrontage(this.defenders, activeWidthLimit);

    if (activeAttackers.length === 0) {
      this.isResolved = true;
      this.winner = 'defender';
      return;
    }
    if (activeDefenders.length === 0) {
      this.isResolved = true;
      this.winner = 'attacker';
      return;
    }

    const attackerAirBonus = Math.max(0, this.airSupremacyFactor * 0.25);
    const defenderAirBonus = Math.max(0, -this.airSupremacyFactor * 0.25);

    let totalAttackerSoftDamage = 0;
    activeAttackers.forEach(unit => {
      let unitDamage = unit.softAttack * (1 - terrainMod.attackPenalty) * (1 + attackerAirBonus);
      totalAttackerSoftDamage += unitDamage;
    });

    let totalDefenderSoftDamage = 0;
    activeDefenders.forEach(unit => {
      let entrenchmentBonus = 1 + (unit.digInLevel * 0.05);
      let unitDamage = unit.softAttack * entrenchmentBonus * (1 + defenderAirBonus);
      totalDefenderSoftDamage += unitDamage;
    });

    const defenderDamagePerUnit = totalAttackerSoftDamage / activeDefenders.length;
    activeDefenders.forEach(defender => {
      defender.currentOrganization -= (defenderDamagePerUnit * 0.15);
      defender.currentHp -= (defenderDamagePerUnit * 0.05);
    });

    const attackerDamagePerUnit = totalDefenderSoftDamage / activeAttackers.length;
    activeAttackers.forEach(attacker => {
      attacker.currentOrganization -= (attackerDamagePerUnit * 0.12);
      attacker.currentHp -= (attackerDamagePerUnit * 0.04);
    });

    this.cleanUpRetreatedUnits();
  }

  selectUnitsForFrontage(units, maxFrontage) {
    let currentWidth = 0;
    const selected = [];
    for (const unit of units) {
      if (unit.currentOrganization > 0 && (currentWidth + unit.combatWidth <= maxFrontage)) {
        selected.push(unit);
        currentWidth += unit.combatWidth;
      }
    }
    return selected;
  }

  cleanUpRetreatedUnits() {
    const remainingAttackers = this.attackers.filter(u => u.currentOrganization > 0);
    const remainingDefenders = this.defenders.filter(u => u.currentOrganization > 0);

    if (remainingAttackers.length === 0) {
      this.isResolved = true;
      this.winner = 'defender';
    } else if (remainingDefenders.length === 0) {
      this.isResolved = true;
      this.winner = 'attacker';
    }
  }
}

class SupplyAndNavalManager {
  constructor(nations) {
    this.nations = nations;
    this.seaZones = {
      'English_Channel': { controller: null, attackerSupremacy: 0, defenderSupremacy: 0 },
      'North_Sea': { controller: null, attackerSupremacy: 0, defenderSupremacy: 0 },
      'Mediterranean': { controller: null, attackerSupremacy: 0, defenderSupremacy: 0 }
    };
  }

  resolveNavalPresence(zoneId, nationTag, fleetStrength) {
    const zone = this.seaZones[zoneId];
    if (!zone) return;

    if (fleetStrength > 50) {
      zone.controller = nationTag;
    }
  }

  checkTradeRouteSafety(originTag, destinationTag, requiredSeaZone) {
    const zone = this.seaZones[requiredSeaZone];
    if (!zone || !zone.controller) return true;

    if (zone.controller !== originTag && zone.controller !== destinationTag) {
      return false;
    }
    return true;
  }

  calculateProvinceSupply(province, divisionsInProvince) {
    const totalSupplyCapacity = (province.infrastructureLevel || 3) * 10 + (province.hasSupplyHub ? 35 : 0);
    const totalDemand = divisionsInProvince.reduce((sum, unit) => sum + unit.supplyConsumption, 0);

    const supplyRatio = Math.min(1.0, totalSupplyCapacity / Math.max(1, totalDemand));

    if (supplyRatio < 1.0) {
      divisionsInProvince.forEach(unit => {
        unit.currentOrganization = Math.max(0, unit.currentOrganization - (1.0 - supplyRatio) * 2.0);
      });
    }

    return { supplyCapacity: totalSupplyCapacity, demand: totalDemand, ratio: supplyRatio };
  }
}
