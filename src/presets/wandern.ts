import type { Item, PresetDefinition } from '../lib/schema';
import { perDay } from './helpers';

const wandern: PresetDefinition = {
  id: 'wandern',
  name: 'Wandern',
  description: 'Ausrüstung für Tages- und Mehrtageswanderungen.',

  resolveItems(params): Item[] {
    const items: Item[] = [
      { id: 'wandern-schuhe', name: 'Wanderschuhe', category: 'Ausrüstung', importance: 'pflicht', quantity: 1 },
      { id: 'wandern-rucksack', name: 'Wanderrucksack', category: 'Ausrüstung', importance: 'pflicht', quantity: 1 },
      {
        id: 'wandern-trinkflasche',
        name: 'Trinkflasche / Trinksystem',
        category: 'Ausrüstung',
        importance: 'pflicht',
        quantity: 1,
      },
      {
        id: 'wandern-wanderhose',
        name: 'Wanderhose',
        category: 'Kleidung',
        importance: 'pflicht',
        quantity: { min: 1, max: 2 },
      },
      {
        id: 'wandern-funktionsshirt',
        name: 'Funktionsshirt',
        category: 'Kleidung',
        importance: 'pflicht',
        quantity: perDay(1, params.days, 5),
      },
      {
        id: 'wandern-wandersocken',
        name: 'Wandersocken',
        category: 'Kleidung',
        importance: 'pflicht',
        quantity: perDay(1, params.days),
      },
      { id: 'wandern-erste-hilfe', name: 'Erste-Hilfe-Set', category: 'Ausrüstung', importance: 'pflicht', quantity: 1 },
      { id: 'wandern-karte', name: 'Wanderkarte / GPS-Gerät', category: 'Ausrüstung', importance: 'optional', quantity: 1 },
      { id: 'wandern-stirnlampe', name: 'Stirnlampe', category: 'Ausrüstung', importance: 'optional', quantity: 1 },
      { id: 'wandern-wanderstoecke', name: 'Wanderstöcke', category: 'Ausrüstung', importance: 'optional', quantity: 1 },
    ];

    if (params.climate === 'warm') {
      items.push(
        { id: 'wandern-sonnenhut', name: 'Sonnenhut / Cap', category: 'Kleidung', importance: 'pflicht', quantity: 1 },
        { id: 'wandern-insektenschutz', name: 'Insektenschutz', category: 'Hygiene', importance: 'optional', quantity: 1 },
      );
    }

    if (params.climate === 'kalt' || params.climate === 'frostig') {
      items.push(
        { id: 'wandern-regenjacke', name: 'Wind- und Regenjacke', category: 'Kleidung', importance: 'pflicht', quantity: 1 },
        { id: 'wandern-handschuhe', name: 'Handschuhe', category: 'Kleidung', importance: 'optional', quantity: 1 },
      );
    }

    // Mehrtageswanderung: Übernachtungsausrüstung wird relevant.
    if (params.days >= 2) {
      items.push(
        { id: 'wandern-zelt', name: 'Zelt / Biwaksack', category: 'Ausrüstung', importance: 'optional', quantity: 1 },
        { id: 'wandern-schlafsack', name: 'Schlafsack', category: 'Ausrüstung', importance: 'optional', quantity: 1 },
        { id: 'wandern-isomatte', name: 'Isomatte', category: 'Ausrüstung', importance: 'optional', quantity: 1 },
        { id: 'wandern-kocher', name: 'Kocher + Gaskartusche', category: 'Ausrüstung', importance: 'optional', quantity: 1 },
      );
    }

    return items;
  },
};

export default wandern;
