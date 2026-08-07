import type { Item, PresetDefinition } from '../lib/schema';
import { perDay, perDayNote, rangeNote } from './helpers';
import { CLIMATE_VARIABLE } from './sharedVariables';

const wandern: PresetDefinition = {
  id: 'wandern',
  name: 'Wandern',
  description: 'Ausrüstung für Tages- und Mehrtageswanderungen.',

  variables: [CLIMATE_VARIABLE],

  resolveItems(params, vars): Item[] {
    const items: Item[] = [
      { id: 'wandern-schuhe', name: 'Wanderschuhe', category: 'Ausrüstung', importance: 'pflicht', quantity: 1, icon: '🥾' },
      // Geteilte Item-IDs (shared-*): dieselbe Ausrüstung wird auch von
      // anderen Presets vorgeschlagen (Sommerlager, Camping, Segeln) — eine
      // Reise mit mehreren dieser Aktivitäten braucht trotzdem nur einen
      // Rucksack, eine Trinkflasche usw., nicht mehrere nebeneinander.
      { id: 'shared-rucksack', name: 'Wanderrucksack', category: 'Ausrüstung', importance: 'pflicht', quantity: 1, icon: '🎒' },
      { id: 'shared-trinkflasche', name: 'Trinkflasche / Trinksystem', category: 'Ausrüstung', importance: 'pflicht', quantity: 1, icon: '💧' },
      {
        id: 'wandern-wanderhose',
        name: 'Wanderhose',
        category: 'Kleidung',
        importance: 'pflicht',
        quantity: { min: 1, max: 2 },
        icon: '👖',
        note: rangeNote(1, 2),
      },
      {
        id: 'wandern-funktionsshirt',
        name: 'Funktionsshirt',
        category: 'Kleidung',
        importance: 'pflicht',
        quantity: perDay(1, params.days, 5),
        icon: '👕',
        note: perDayNote(1, params.days, 5),
      },
      {
        id: 'wandern-wandersocken',
        name: 'Wandersocken',
        category: 'Kleidung',
        importance: 'pflicht',
        quantity: perDay(1, params.days),
        icon: '🧦',
        note: perDayNote(1, params.days),
      },
      { id: 'shared-erste-hilfe-set', name: 'Erste-Hilfe-Set', category: 'Ausrüstung', importance: 'pflicht', quantity: 1, icon: '🩹' },
      { id: 'wandern-karte', name: 'Wanderkarte / GPS-Gerät', category: 'Ausrüstung', importance: 'optional', quantity: 1, icon: '🗺️' },
      { id: 'shared-taschenlampe', name: 'Stirnlampe', category: 'Ausrüstung', importance: 'optional', quantity: 1, icon: '🔦' },
      { id: 'wandern-wanderstoecke', name: 'Wanderstöcke', category: 'Ausrüstung', importance: 'optional', quantity: 1, icon: '🦯' },
    ];

    if (vars.climate?.includes('warm')) {
      items.push(
        { id: 'wandern-sonnenhut', name: 'Sonnenhut / Cap', category: 'Kleidung', importance: 'pflicht', quantity: 1, icon: '🧢' },
        { id: 'shared-insektenschutz', name: 'Insektenschutz', category: 'Hygiene', importance: 'optional', quantity: 1, icon: '🦟' },
      );
    }

    if (vars.climate?.includes('kalt') || vars.climate?.includes('frostig')) {
      items.push(
        { id: 'wandern-regenjacke', name: 'Wind- und Regenjacke', category: 'Kleidung', importance: 'pflicht', quantity: 1, icon: '🧥' },
        { id: 'wandern-handschuhe', name: 'Handschuhe', category: 'Kleidung', importance: 'optional', quantity: 1, icon: '🧤' },
      );
    }

    // Mehrtageswanderung: Übernachtungsausrüstung wird relevant.
    if (params.days >= 2) {
      items.push(
        { id: 'shared-zelt', name: 'Zelt / Biwaksack', category: 'Ausrüstung', importance: 'optional', quantity: 1, icon: '⛺' },
        { id: 'shared-schlafsack', name: 'Schlafsack', category: 'Ausrüstung', importance: 'optional', quantity: 1, icon: '🛌' },
        { id: 'shared-isomatte', name: 'Isomatte', category: 'Ausrüstung', importance: 'optional', quantity: 1, icon: '🏕️' },
        { id: 'shared-kocher', name: 'Kocher + Gaskartusche', category: 'Ausrüstung', importance: 'optional', quantity: 1, icon: '🍳' },
      );
    }

    return items;
  },
};

export default wandern;
