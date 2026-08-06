import type { Item, PresetDefinition } from '../lib/schema';
import { perDay, perDayNote, rangeNote } from './helpers';

const skifahren: PresetDefinition = {
  id: 'skifahren',
  name: 'Skifahren',
  description: 'Ausrüstung und Kleidung für einen Skiurlaub.',

  resolveItems(params): Item[] {
    const items: Item[] = [
      { id: 'ski-jacke', name: 'Skijacke', category: 'Kleidung', importance: 'pflicht', quantity: 1, icon: '🧥' },
      { id: 'ski-hose', name: 'Skihose', category: 'Kleidung', importance: 'pflicht', quantity: 1, icon: '👖' },
      {
        id: 'ski-handschuhe',
        name: 'Skihandschuhe',
        category: 'Kleidung',
        importance: 'pflicht',
        quantity: { min: 1, max: 2 },
        icon: '🧤',
        note: rangeNote(1, 2),
      },
      {
        id: 'ski-muetze',
        name: 'Warme Mütze',
        category: 'Kleidung',
        importance: 'pflicht',
        quantity: { min: 1, max: 2 },
        icon: '🧢',
        note: rangeNote(1, 2),
      },
      { id: 'ski-schal', name: 'Schal / Buff', category: 'Kleidung', importance: 'optional', quantity: 1, icon: '🧣' },
      {
        id: 'ski-skibrille',
        name: 'Skibrille / Sonnenbrille',
        category: 'Ausrüstung',
        importance: 'pflicht',
        quantity: 1,
        icon: '🕶️',
      },
      {
        id: 'ski-sonnencreme-lsf',
        name: 'Sonnencreme mit hohem LSF',
        category: 'Hygiene',
        importance: 'pflicht',
        quantity: 1,
        icon: '☀️',
      },
      { id: 'ski-lippenpflege', name: 'Lippenpflege mit LSF', category: 'Hygiene', importance: 'optional', quantity: 1, icon: '🧴' },
      {
        id: 'ski-thermounterwaesche',
        name: 'Thermo-Unterwäsche',
        category: 'Kleidung',
        importance: 'pflicht',
        quantity: { min: 1, max: 2 },
        icon: '🩲',
        note: rangeNote(1, 2),
      },
      {
        id: 'ski-skisocken',
        name: 'Skisocken',
        category: 'Kleidung',
        importance: 'pflicht',
        quantity: perDay(1, params.days),
        icon: '🧦',
        note: perDayNote(1, params.days),
      },
      { id: 'ski-ski-ausruestung', name: 'Ski/Snowboard + Stöcke', category: 'Ausrüstung', importance: 'optional', quantity: 1, icon: '🎿' },
      { id: 'ski-helm', name: 'Skihelm', category: 'Ausrüstung', importance: 'optional', quantity: 1, icon: '🪖' },
      { id: 'ski-skischuhe', name: 'Skischuhe', category: 'Ausrüstung', importance: 'optional', quantity: 1, icon: '🥾' },
    ];

    if (params.days >= 3) {
      items.push({
        id: 'ski-skipass-hinweis',
        name: 'Skipass / Liftticket (vor Ort besorgen)',
        category: 'Sonstiges',
        importance: 'optional',
        quantity: 1,
        icon: '🎫',
      });
    }

    if (params.climate.includes('frostig')) {
      items.push({
        id: 'ski-handwaermer',
        name: 'Handwärmer (Einweg)',
        category: 'Ausrüstung',
        importance: 'optional',
        quantity: perDay(1, params.days, 10),
        icon: '🔥',
        note: perDayNote(1, params.days, 10),
      });
    }

    return items;
  },
};

export default skifahren;
