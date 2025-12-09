export const programs = [
  {
    id: 'arrow-lake',
    name: 'Arrow Lake',
    codename: 'ARL',
    icon: '🏹',
    color: '#a855f7',
    skus: [
      { id: 'arl-s', name: 'ARL S', fullName: 'Arrow Lake S Desktop', cores: '24C/24T', tdp: '125W' },
      { id: 'arl-hx', name: 'ARL HX', fullName: 'Arrow Lake HX Mobile', cores: '24C/24T', tdp: '55W' },
      { id: 'arl-h', name: 'ARL H', fullName: 'Arrow Lake H Mobile', cores: '16C/16T', tdp: '45W' }
    ]
  },
  {
    id: 'nova-lake',
    name: 'Nova Lake',
    codename: 'NVL',
    icon: '✨',
    color: '#22d3ee',
    skus: [
      { id: 'nvl-s', name: 'NVL S', fullName: 'Nova Lake S Desktop', cores: '32C/40T', tdp: '150W' },
      { id: 'nvl-s-bllc', name: 'NVL S BLLC', fullName: 'Nova Lake S BLLC', cores: '24C/32T', tdp: '125W' }
    ]
  },
  {
    id: 'panther-lake',
    name: 'Panther Lake',
    codename: 'PTL',
    icon: '🐆',
    color: '#f472b6',
    skus: [
      { id: 'ptl-u', name: 'PTL U', fullName: 'Panther Lake U Ultra-Mobile', cores: '12C/16T', tdp: '15W' },
      { id: 'ptl-h', name: 'PTL H', fullName: 'Panther Lake H Mobile', cores: '20C/24T', tdp: '45W' }
    ]
  }
];
