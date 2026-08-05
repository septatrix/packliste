import type { Item, PresetDefinition } from '../lib/schema';
import { perDay } from './helpers';

/**
 * Universelle Essentials, die unabhängig vom gewählten Aktivitäts-Preset
 * immer mit in die Liste einfließen (siehe src/presets/index.ts).
 */
const base: PresetDefinition = {
  id: 'base',
  name: 'Basis',
  description: 'Essentials, die auf (fast) jeder Reise dabei sein sollten.',

  resolveItems(params): Item[] {
    const items: Item[] = [
      { id: 'base-ausweis', name: 'Personalausweis', category: 'Dokumente', importance: 'pflicht', quantity: 1 },
      { id: 'base-geld', name: 'Geldbeutel mit Bargeld/Karten', category: 'Dokumente', importance: 'pflicht', quantity: 1 },
      { id: 'base-handy', name: 'Smartphone', category: 'Elektronik', importance: 'pflicht', quantity: 1 },
      { id: 'base-ladekabel', name: 'Ladekabel', category: 'Elektronik', importance: 'pflicht', quantity: 1 },
      { id: 'base-powerbank', name: 'Powerbank', category: 'Elektronik', importance: 'optional', quantity: 1 },
      { id: 'base-zahnbuerste', name: 'Zahnbürste', category: 'Hygiene', importance: 'pflicht', quantity: 1 },
      { id: 'base-zahnpasta', name: 'Zahnpasta (Reisegröße)', category: 'Hygiene', importance: 'pflicht', quantity: 1 },
      { id: 'base-deo', name: 'Deo', category: 'Hygiene', importance: 'pflicht', quantity: 1 },
      {
        id: 'base-unterwaesche',
        name: 'Unterwäsche',
        category: 'Kleidung',
        importance: 'pflicht',
        quantity: perDay(1, params.days),
      },
      {
        id: 'base-socken',
        name: 'Socken',
        category: 'Kleidung',
        importance: 'pflicht',
        quantity: perDay(1, params.days),
      },
      {
        id: 'base-schlafanzug',
        name: 'Schlafanzug',
        category: 'Kleidung',
        importance: 'optional',
        quantity: { min: 1, max: 2 },
      },
    ];

    // Reisepass & Co. nur außerhalb des Heimatlands nötig.
    if (params.destination !== 'inland') {
      items.push(
        { id: 'base-reisepass', name: 'Reisepass', category: 'Dokumente', importance: 'pflicht', quantity: 1 },
        {
          id: 'base-versicherung',
          name: 'Nachweis Auslandskrankenversicherung',
          category: 'Dokumente',
          importance: 'optional',
          quantity: 1,
        },
      );
    }

    // Visum, Adapter und Fremdwährung nur außerhalb der EU/Schengen-Zone.
    if (params.destination === 'international') {
      items.push(
        {
          id: 'base-visum',
          name: 'Visum / Einreisedokumente',
          category: 'Dokumente',
          importance: 'pflicht',
          quantity: 1,
        },
        { id: 'base-adapter', name: 'Steckdosenadapter', category: 'Elektronik', importance: 'pflicht', quantity: 1 },
        {
          id: 'base-fremdwaehrung',
          name: 'Bargeld in Landeswährung',
          category: 'Dokumente',
          importance: 'optional',
          quantity: 1,
        },
      );
    }

    if (params.travel === 'flugzeug') {
      items.push({
        id: 'base-fluessigkeiten',
        name: 'Flüssigkeiten im Handgepäck (Behälter ≤ 100 ml)',
        category: 'Sonstiges',
        importance: 'optional',
        quantity: 1,
      });
    }

    if (params.climate === 'warm' || params.climate === 'frostig') {
      items.push({
        id: 'base-sonnencreme',
        name: 'Sonnencreme',
        category: 'Hygiene',
        importance: 'pflicht',
        quantity: 1,
      });
    }

    if (params.gender === 'weiblich') {
      items.push({
        id: 'base-hygieneartikel',
        name: 'Hygieneartikel (Periodenprodukte)',
        category: 'Hygiene',
        importance: 'optional',
        quantity: perDay(1, params.days, 20),
      });
    }

    return items;
  },
};

export default base;
