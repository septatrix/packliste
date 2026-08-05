import type { Item, PresetDefinition } from '../lib/schema';
import { perDay } from './helpers';

const sommerlager: PresetDefinition = {
  id: 'sommerlager',
  name: 'Sommerlager',
  description: 'Packliste für ein mehrtägiges Sommer-/Zeltlager.',

  resolveItems(params): Item[] {
    const items: Item[] = [
      { id: 'lager-schlafsack', name: 'Schlafsack', category: 'Ausrüstung', importance: 'pflicht', quantity: 1 },
      { id: 'lager-isomatte', name: 'Isomatte', category: 'Ausrüstung', importance: 'pflicht', quantity: 1 },
      { id: 'lager-taschenlampe', name: 'Taschenlampe', category: 'Ausrüstung', importance: 'pflicht', quantity: 1 },
      {
        id: 'lager-badesachen',
        name: 'Badesachen',
        category: 'Kleidung',
        importance: 'optional',
        quantity: { min: 1, max: 2 },
      },
      {
        id: 'lager-handtuch',
        name: 'Handtuch',
        category: 'Hygiene',
        importance: 'pflicht',
        quantity: { min: 1, max: 2 },
      },
      {
        id: 'lager-tshirts',
        name: 'T-Shirts',
        category: 'Kleidung',
        importance: 'pflicht',
        quantity: perDay(1, params.days, 8),
      },
      {
        id: 'lager-kurze-hosen',
        name: 'Kurze Hosen',
        category: 'Kleidung',
        importance: 'pflicht',
        quantity: { min: 2, max: 4 },
      },
      { id: 'lager-flipflops', name: 'Badelatschen', category: 'Kleidung', importance: 'optional', quantity: 1 },
      { id: 'lager-mueckenspray', name: 'Mückenspray', category: 'Hygiene', importance: 'optional', quantity: 1 },
      { id: 'lager-sonnencreme', name: 'Sonnencreme', category: 'Hygiene', importance: 'pflicht', quantity: 1 },
      {
        id: 'lager-brief-postkarte',
        name: 'Briefpapier / Postkarten für zuhause',
        category: 'Sonstiges',
        importance: 'optional',
        quantity: { min: 1, max: 3 },
      },
    ];

    if (params.climate === 'kalt' || params.climate === 'frostig') {
      items.push({
        id: 'lager-pulli',
        name: 'Warmer Pullover',
        category: 'Kleidung',
        importance: 'pflicht',
        quantity: { min: 1, max: 2 },
      });
    }

    if (params.days >= 5) {
      items.push({
        id: 'lager-waeschebeutel',
        name: 'Wäschesack für Schmutzwäsche',
        category: 'Sonstiges',
        importance: 'optional',
        quantity: 1,
      });
    }

    return items;
  },
};

export default sommerlager;
