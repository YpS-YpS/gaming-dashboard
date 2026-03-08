export const programs = [
  {
    id: 'arrow-lake',
    name: 'Arrow Lake',
    codename: 'ARL',
    icon: '\u{1F3F9}',
    color: '#a855f7',
    skus: [
      { id: 'arl-s', name: 'ARL S', fullName: 'Arrow Lake S Desktop', cores: '24C/24T', tdp: '125W', graphics: 'dGFX', gpu: 'RTX 5090' },
      { id: 'arl-hx', name: 'ARL HX', fullName: 'Arrow Lake HX Mobile', cores: '24C/24T', tdp: '55W', graphics: 'dGFX', gpu: 'RTX 5090' },
      { id: 'arl-h', name: 'ARL H', fullName: 'Arrow Lake H Mobile', cores: '16C/16T', tdp: '45W', graphics: 'iGFX' }
    ]
  },
  {
    id: 'arrow-lake-refresh',
    name: 'Arrow Lake Refresh',
    codename: 'ARL-R',
    icon: '\u{1F3F9}',
    color: '#c084fc',
    skus: [
      { id: 'arl-r-s', name: 'ARL-R S', fullName: 'Arrow Lake Refresh S Desktop', cores: '24C/24T', tdp: '125W', graphics: 'dGFX', gpu: 'RTX 5090' }
    ]
  },
  {
    id: 'nova-lake',
    name: 'Nova Lake',
    codename: 'NVL',
    icon: '\u2728',
    color: '#22d3ee',
    skus: [
      { id: 'nvl-sk-28c', name: 'NVL S K 28C', fullName: 'Nova Lake S K 28C', cores: '28C/28T', coreConfig: '8P + 16E + 4LPE', tdp: '125W', graphics: 'dGFX', gpu: 'RTX 5090' },
      { id: 'nvl-sk-28c-bllc', name: 'NVL S K 28C bLLC', fullName: 'Nova Lake S K 28C bLLC', cores: '28C/28T', coreConfig: '8P + 16E + 4LPE', tdp: '125W', cache: 'bLLC', graphics: 'dGFX', gpu: 'RTX 5090' },
      { id: 'nvl-sk-52c', name: 'NVL S K 52C', fullName: 'Nova Lake S K 52C', cores: '52C/52T', coreConfig: '16P + 32E + 4LPE', tdp: '150W', graphics: 'dGFX', gpu: 'RTX 5090' },
      { id: 'nvl-sk-52c-bllc', name: 'NVL S K 52C bLLC', fullName: 'Nova Lake S K 52C bLLC', cores: '52C/52T', coreConfig: '16P + 32E + 4LPE', tdp: '150W', cache: 'bLLC', graphics: 'dGFX', gpu: 'RTX 5090' }
    ]
  },
  {
    id: 'panther-lake',
    name: 'Panther Lake',
    codename: 'PTL',
    icon: '\u{1F43E}',
    color: '#f472b6',
    skus: [
      { id: 'ptl-u', name: 'PTL U', fullName: 'Panther Lake U Ultra-Mobile', cores: '12C/16T', tdp: '15W', graphics: 'iGFX' },
      { id: 'ptl-h', name: 'PTL H', fullName: 'Panther Lake H Mobile', cores: '20C/24T', tdp: '45W', graphics: 'iGFX' }
    ]
  },
  {
    id: 'raptor-lake',
    name: 'Raptor Lake',
    codename: 'RPL',
    icon: '\u{1F985}',
    color: '#fb923c',
    skus: [
      { id: 'rpl-s', name: 'RPL S', fullName: 'Raptor Lake S Desktop', cores: '24C/32T', tdp: '125W', graphics: 'dGFX', gpu: 'RTX 4090' },
      { id: 'rpl-hx', name: 'RPL HX', fullName: 'Raptor Lake HX Mobile', cores: '24C/32T', tdp: '55W', graphics: 'dGFX', gpu: 'RTX 4090' }
    ]
  },
  {
    id: 'raptor-lake-refresh',
    name: 'Raptor Lake Refresh',
    codename: 'RPL-R',
    icon: '\u{1F985}',
    color: '#fdba74',
    skus: [
      { id: 'rpl-r-s', name: 'RPL-R S', fullName: 'Raptor Lake Refresh S Desktop', cores: '24C/32T', tdp: '125W', graphics: 'dGFX', gpu: 'RTX 4090' }
    ]
  }
];
