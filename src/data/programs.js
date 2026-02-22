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
      { id: 'nvl-sk-28c', name: 'NVL S K 28C', fullName: 'Nova Lake S K 28C', cores: '28C/28T', coreConfig: '8P + 16E + 4LPE', tdp: '125W' },
      { id: 'nvl-sk-28c-bllc', name: 'NVL S K 28C bLLC', fullName: 'Nova Lake S K 28C bLLC', cores: '28C/28T', coreConfig: '8P + 16E + 4LPE', tdp: '125W', cache: 'bLLC' },
      { id: 'nvl-sk-52c', name: 'NVL S K 52C', fullName: 'Nova Lake S K 52C', cores: '52C/52T', coreConfig: '16P + 32E + 4LPE', tdp: '150W' },
      { id: 'nvl-sk-52c-bllc', name: 'NVL S K 52C bLLC', fullName: 'Nova Lake S K 52C bLLC', cores: '52C/52T', coreConfig: '16P + 32E + 4LPE', tdp: '150W', cache: 'bLLC' }
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
