/**
 * Lightweight Canvas Map Renderer
 */

class HOI4MapRenderer {
  constructor(canvasId, gameEngine) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.engine = gameEngine;

    this.nationColors = {
      GER: '#4A4A4A',
      FRA: '#3B5998',
      SOV: '#A93226',
      GBR: '#D4AC0D',
      ITA: '#229954'
    };

    this.provinces = {
      'BER': { name: 'Berlin', x: 420, y: 220, owner: 'GER', terrain: 'plains', infrastructure: 5 },
      'RHR': { name: 'Rhineland', x: 360, y: 250, owner: 'GER', terrain: 'plains', infrastructure: 4 },
      'PAR': { name: 'Paris', x: 280, y: 280, owner: 'FRA', terrain: 'plains', infrastructure: 4 },
      'ALS': { name: 'Alsace', x: 320, y: 300, owner: 'FRA', terrain: 'forest', infrastructure: 3 },
      'MOS': { name: 'Moscow', x: 680, y: 180, owner: 'SOV', terrain: 'plains', infrastructure: 3 },
      'LON': { name: 'London', x: 240, y: 220, owner: 'GBR', terrain: 'plains', infrastructure: 5 }
    };

    this.provinceAdjacency = [
      ['RHR', 'ALS'],
      ['BER', 'RHR'],
      ['PAR', 'ALS'],
      ['LON', 'PAR']
    ];

    this.selectedProvinceKey = null;
  }

  render() {
    this.ctx.fillStyle = '#090d12';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Draw Adjacency Front Line Connections
    this.ctx.strokeStyle = '#2d3748';
    this.ctx.lineWidth = 3;
    this.provinceAdjacency.forEach(([fromKey, toKey]) => {
      const p1 = this.provinces[fromKey];
      const p2 = this.provinces[toKey];
      if (!p1 || !p2) return;

      this.ctx.beginPath();
      this.ctx.moveTo(p1.x, p1.y);
      this.ctx.lineTo(p2.x, p2.y);
      this.ctx.stroke();

      if (p1.owner !== p2.owner) {
        this.drawFrontLineMarker(p1, p2);
      }
    });

    // 2. Draw Province Nodes
    Object.keys(this.provinces).forEach(key => {
      const p = this.provinces[key];
      
      const isSelected = (this.selectedProvinceKey === key);

      this.ctx.fillStyle = this.nationColors[p.owner] || '#7F8C8D';
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, isSelected ? 20 : 16, 0, 2 * Math.PI);
      this.ctx.fill();

      this.ctx.strokeStyle = isSelected ? '#F1C40F' : '#FFFFFF';
      this.ctx.lineWidth = isSelected ? 3 : 2;
      this.ctx.stroke();

      this.ctx.fillStyle = '#EAEAEA';
      this.ctx.font = '12px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(p.name, p.x, p.y + 32);
    });
  }

  drawFrontLineMarker(p1, p2) {
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;

    this.ctx.strokeStyle = '#E74C3C';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([4, 4]);
    this.ctx.beginPath();
    this.ctx.arc(midX, midY, 8, 0, 2 * Math.PI);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }
}
