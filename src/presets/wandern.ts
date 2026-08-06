import type { Item, PresetDefinition } from '../lib/schema';
import { perDay } from './helpers';

const wandern: PresetDefinition = {
  id: 'wandern',
  name: 'Wandern',
  description: 'Ausrüstung für Tages- und Mehrtageswanderungen.',

  resolveItems(params): Item[] {
    const items: Item[] = [
      { id: 'wandern-schuhe', name: 'Wanderschuhe', category: 'Ausrüstung', importance: 'pflicht', quantity: 1, icon: '🥾' },
      { id: 'wandern-rucksack', name: 'Wanderrucksack', category: 'Ausrüstung', importance: 'pflicht', quantity: 1, icon: '🎒' },
      {
        id: 'wandern-trinkflasche',
        name: 'Trinkflasche / Trinksystem',
        category: 'Ausrüstung',
        importance: 'pflicht',
        quantity: 1,
        icon: '💧',
      },
      {
        id: 'wandern-wanderhose',
        name: 'Wanderhose',
        category: 'Kleidung',
        importance: 'pflicht',
        quantity: { min: 1, max: 2 },
        icon: '👖',
      },
      {
        id: 'wandern-funktionsshirt',
        name: 'Funktionsshirt',
        category: 'Kleidung',
        importance: 'pflicht',
        quantity: perDay(1, params.days, 5),
        icon: '👕',
      },
      {
        id: 'wandern-wandersocken',
        name: 'Wandersocken',
        category: 'Kleidung',
        importance: 'pflicht',
        quantity: perDay(1, params.days),
        icon: '🧦',
      },
      { id: 'wandern-erste-hilfe', name: 'Erste-Hilfe-Set', category: 'Ausrüstung', importance: 'pflicht', quantity: 1, icon: '🩹' },
      { id: 'wandern-karte', name: 'Wanderkarte / GPS-Gerät', category: 'Ausrüstung', importance: 'optional', quantity: 1, icon: '🗺️' },
      { id: 'wandern-stirnlampe', name: 'Stirnlampe', category: 'Ausrüstung', importance: 'optional', quantity: 1, icon: '🔦' },
      { id: 'wandern-wanderstoecke', name: 'Wanderstöcke', category: 'Ausrüstung', importance: 'optional', quantity: 1, icon: '🦯' },
    ];

    if (params.climate.includes('warm')) {
      items.push(
        { id: 'wandern-sonnenhut', name: 'Sonnenhut / Cap', category: 'Kleidung', importance: 'pflicht', quantity: 1, icon: '🧢' },
        { id: 'wandern-insektenschutz', name: 'Insektenschutz', category: 'Hygiene', importance: 'optional', quantity: 1, icon: '🦟' },
      );
    }

    if (params.climate.includes('kalt') || params.climate.includes('frostig')) {
      items.push(
        { id: 'wandern-regenjacke', name: 'Wind- und Regenjacke', category: 'Kleidung', importance: 'pflicht', quantity: 1, icon: '🧥' },
        { id: 'wandern-handschuhe', name: 'Handschuhe', category: 'Kleidung', importance: 'optional', quantity: 1, icon: '🧤' },
      );
    }

    // Mehrtageswanderung: Übernachtungsausrüstung wird relevant.
    if (params.days >= 2) {
      items.push(
        { id: 'wandern-zelt', name: 'Zelt / Biwaksack', category: 'Ausrüstung', importance: 'optional', quantity: 1, icon: '⛺' },
        { id: 'wandern-schlafsack', name: 'Schlafsack', category: 'Ausrüstung', importance: 'optional', quantity: 1, icon: '🛌' },
        { id: 'wandern-isomatte', name: 'Isomatte', category: 'Ausrüstung', importance: 'optional', quantity: 1, icon: '🏕️' },
        { id: 'wandern-kocher', name: 'Kocher + Gaskartusche', category: 'Ausrüstung', importance: 'optional', quantity: 1, icon: '🍳' },
      );
    }

    return items;
  },
};

export default wandern;
