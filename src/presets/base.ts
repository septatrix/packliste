import type { Item, PresetDefinition } from '../lib/schema';
import { matchesGender, perDay, perDayNote, rangeNote } from './helpers';
import { CLIMATE_VARIABLE, DESTINATION_VARIABLE, GENDER_VARIABLE, TRAVEL_VARIABLE } from './sharedVariables';

/**
 * Universelle Essentials, die unabhängig vom gewählten Aktivitäts-Preset
 * immer mit in die Liste einfließen (siehe src/presets/index.ts). `base` is
 * always active, so claiming these four here is what keeps them always
 * shown in the form, same as when they were bespoke `Params` fields.
 */
const base: PresetDefinition = {
  id: 'base',
  name: 'Basis',
  description: 'Essentials, die auf (fast) jeder Reise dabei sein sollten.',

  variables: [CLIMATE_VARIABLE, TRAVEL_VARIABLE, DESTINATION_VARIABLE, GENDER_VARIABLE],

  resolveItems(params, vars): Item[] {
    const items: Item[] = [
      // Keine `quantity` bei Dingen, von denen man ohnehin nur eines besitzt —
      // ein Zähler ergibt hier keinen Sinn.
      { id: 'base-ausweis', name: 'Personalausweis', category: 'Dokumente', importance: 'pflicht', icon: '🪪' },
      { id: 'base-geld', name: 'Geldbeutel mit Bargeld/Karten', category: 'Dokumente', importance: 'pflicht', icon: '💳' },
      { id: 'base-handy', name: 'Smartphone', category: 'Elektronik', importance: 'pflicht', icon: '📱' },
      { id: 'base-ladekabel', name: 'Ladekabel', category: 'Elektronik', importance: 'pflicht', quantity: 1, icon: '🔌' },
      { id: 'base-powerbank', name: 'Powerbank', category: 'Elektronik', importance: 'optional', quantity: 1, icon: '🔋' },
      { id: 'base-zahnbuerste', name: 'Zahnbürste', category: 'Hygiene', importance: 'pflicht', quantity: 1, icon: '🪥' },
      { id: 'base-zahnpasta', name: 'Zahnpasta (Reisegröße)', category: 'Hygiene', importance: 'pflicht', quantity: 1, icon: '🧴' },
      { id: 'base-deo', name: 'Deo', category: 'Hygiene', importance: 'pflicht', quantity: 1, icon: '🧴' },
      {
        id: 'base-unterwaesche',
        name: 'Unterwäsche',
        category: 'Kleidung',
        importance: 'pflicht',
        quantity: perDay(1, params.days),
        icon: '🩲',
        note: perDayNote(1, params.days),
      },
      {
        id: 'base-socken',
        name: 'Socken',
        category: 'Kleidung',
        importance: 'pflicht',
        quantity: perDay(1, params.days),
        icon: '🧦',
        note: perDayNote(1, params.days),
      },
      {
        id: 'base-schlafanzug',
        name: 'Schlafanzug',
        category: 'Kleidung',
        importance: 'optional',
        quantity: { min: 1, max: 2 },
        icon: '🌙',
        note: rangeNote(1, 2),
      },
    ];

    const destination = vars.destination?.[0];

    // Reisepass & Co. nur außerhalb des Heimatlands nötig. Ohne Angabe des
    // Reiseziels nehmen wir nichts davon in die Liste auf (statt zu raten).
    if (destination !== undefined && destination !== 'inland') {
      items.push(
        { id: 'base-reisepass', name: 'Reisepass', category: 'Dokumente', importance: 'pflicht', icon: '🛂' },
        {
          id: 'base-versicherung',
          name: 'Nachweis Auslandskrankenversicherung',
          category: 'Dokumente',
          importance: 'optional',
          icon: '📋',
        },
      );
    }

    // Visum, Adapter und Fremdwährung nur außerhalb der EU/Schengen-Zone.
    if (destination === 'international') {
      items.push(
        {
          id: 'base-visum',
          name: 'Visum / Einreisedokumente',
          category: 'Dokumente',
          importance: 'pflicht',
          icon: '🛃',
        },
        { id: 'base-adapter', name: 'Steckdosenadapter', category: 'Elektronik', importance: 'pflicht', quantity: 1, icon: '🔌' },
        {
          id: 'base-fremdwaehrung',
          name: 'Bargeld in Landeswährung',
          category: 'Dokumente',
          importance: 'optional',
          icon: '💵',
        },
      );
    }

    if (vars.travel?.[0] === 'flugzeug') {
      items.push({
        id: 'base-fluessigkeiten',
        name: 'Flüssigkeiten im Handgepäck (Behälter ≤ 100 ml)',
        category: 'Sonstiges',
        importance: 'optional',
        quantity: 1,
        icon: '💧',
      });
    }

    // Geteilte Item-ID: eine spezifischere Sonnencreme-Empfehlung aus einem
    // Aktivitäts-Preset (z. B. Skifahren, Segeln) überschreibt diese
    // generische, statt als zweiter Eintrag daneben zu stehen.
    if (vars.climate?.includes('warm') || vars.climate?.includes('frostig')) {
      items.push({
        id: 'shared-sonnencreme',
        name: 'Sonnencreme',
        category: 'Hygiene',
        importance: 'pflicht',
        quantity: 1,
        icon: '☀️',
      });
    }

    if (matchesGender(vars.gender, 'weiblich')) {
      items.push({
        id: 'base-hygieneartikel',
        name: 'Hygieneartikel (Periodenprodukte)',
        category: 'Hygiene',
        importance: 'optional',
        quantity: perDay(1, params.days, 20),
        icon: '🧴',
        note: perDayNote(1, params.days, 20),
      });
    }

    return items;
  },
};

export default base;
