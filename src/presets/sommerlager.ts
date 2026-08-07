import type { Item, PresetDefinition } from '../lib/schema';
import { matchesGender, perDay, perDayNote, rangeNote } from './helpers';

/**
 * Modeled on a real two-week "Kofferliste" for a Catholic youth-group
 * summer camp (Sommerlager), including its "Nachtzeug Jungen"/"Nachtzeug
 * Mädchen" split — sleeping gear differs by which quarters campers are
 * assigned to (tents vs. an indoor dorm), which the source list gates by
 * gender. A shared core (Schlafsack, Kopfkissen, warme Decke,
 * Spannbettlaken) is always included; `divers` gets just that shared core
 * without assuming either assignment.
 */
const ROLLE_KIND = 'kind';
const ROLLE_LEITER = 'leiter';

const sommerlager: PresetDefinition = {
  id: 'sommerlager',
  name: 'Sommerlager',
  description: 'Packliste für ein mehrtägiges Sommer-/Zeltlager.',

  variables: [
    {
      id: 'rolle',
      label: 'Rolle',
      options: [
        { value: ROLLE_KIND, label: 'Kind / Teilnehmer:in' },
        { value: ROLLE_LEITER, label: 'Leiter:in' },
      ],
      default: ROLLE_KIND,
    },
  ],

  resolveItems(params, vars): Item[] {
    const items: Item[] = [
      // Kleidung
      { id: 'lager-lange-hosen', name: 'Lange Hosen', category: 'Kleidung', importance: 'pflicht', quantity: { min: 1, max: 2 }, icon: '👖', note: rangeNote(1, 2) },
      { id: 'lager-kurze-hosen', name: 'Kurze Hosen', category: 'Kleidung', importance: 'pflicht', quantity: { min: 2, max: 4 }, icon: '🩳', note: rangeNote(2, 4) },
      { id: 'lager-jacke', name: 'Jacke', category: 'Kleidung', importance: 'pflicht', quantity: 1, icon: '🧥' },
      { id: 'lager-pullover', name: 'Pullover', category: 'Kleidung', importance: 'pflicht', quantity: { min: 1, max: 2 }, icon: '🧥', note: rangeNote(1, 2) },
      {
        id: 'lager-tshirts',
        name: 'T-Shirts',
        category: 'Kleidung',
        importance: 'pflicht',
        quantity: perDay(1, params.days, 8),
        icon: '👕',
        note: perDayNote(1, params.days, 8),
      },
      { id: 'lager-sportzeug', name: 'Sportzeug (für Programm/Sport)', category: 'Kleidung', importance: 'pflicht', quantity: 1, icon: '🎽' },
      {
        id: 'lager-badesachen',
        name: 'Badesachen (doppelt)',
        category: 'Kleidung',
        importance: 'pflicht',
        quantity: 2,
        icon: '🩱',
        note: 'Laut Vorlage doppelt (2), unabhängig von der Reisedauer',
      },
      { id: 'lager-wanderschuhe', name: 'Feste, bequeme Schuhe (zum Wandern)', category: 'Kleidung', importance: 'pflicht', quantity: 1, icon: '🥾' },
      { id: 'lager-leichte-schuhe', name: 'Leichte Schuhe', category: 'Kleidung', importance: 'optional', quantity: 1, icon: '👟' },
      { id: 'lager-turnschuhe', name: 'Turnschuhe', category: 'Kleidung', importance: 'pflicht', quantity: 1, icon: '👟' },
      { id: 'lager-gummistiefel', name: 'Gummistiefel', category: 'Kleidung', importance: 'pflicht', quantity: 1, icon: '👢' },
      { id: 'lager-regenkleidung', name: 'Regencape und -hose', category: 'Kleidung', importance: 'pflicht', quantity: 1, icon: '☔' },
      { id: 'lager-sonnenhut', name: 'Sonnenhut / Cappy', category: 'Kleidung', importance: 'pflicht', quantity: 1, icon: '🧢' },
      { id: 'lager-flipflops', name: 'Badelatschen', category: 'Kleidung', importance: 'optional', quantity: 1, icon: '🩴' },
      {
        id: 'lager-nachtwache-kleidung',
        name: 'Dunkle, alte Kleidung (für Nachtwache)',
        category: 'Kleidung',
        importance: 'optional',
        quantity: 1,
        icon: '🌒',
      },
      {
        id: 'lager-schuetzenfest-kleidung',
        name: 'Blaue Jeans und weißes Oberteil (für Schützenfest)',
        category: 'Kleidung',
        importance: 'optional',
        quantity: 1,
        icon: '🎯',
      },
      {
        id: 'lager-festliche-kleidung',
        name: 'Schicke Kleidung (für Bergfest/Casinoabend)',
        category: 'Kleidung',
        importance: 'optional',
        quantity: 1,
        icon: '🎉',
      },

      // Waschzeug (Hygiene)
      {
        id: 'lager-handtuecher',
        name: 'Handtücher (klein & groß)',
        category: 'Hygiene',
        importance: 'pflicht',
        quantity: 2,
        icon: '🛁',
        note: 'Ein kleines und ein großes Handtuch',
      },
      { id: 'lager-duschzeug', name: 'Duschgel & Shampoo', category: 'Hygiene', importance: 'pflicht', quantity: 1, icon: '🧴' },
      { id: 'lager-kamm', name: 'Kamm / Bürste', category: 'Hygiene', importance: 'pflicht', quantity: 1, icon: '💇' },
      { id: 'shared-insektenschutz', name: 'Insektenschutz', category: 'Hygiene', importance: 'optional', quantity: 1, icon: '🦟' },
      { id: 'lager-foehn', name: 'Föhn', category: 'Hygiene', importance: 'optional', quantity: 1, icon: '💨' },
      { id: 'lager-zahnspange', name: 'Zubehör für Zahnspange', category: 'Hygiene', importance: 'optional', quantity: 1, icon: '🦷' },

      // Geschirr (Ausrüstung)
      { id: 'shared-trinkflasche', name: 'Trinkflasche (auf Dichtigkeit prüfen)', category: 'Ausrüstung', importance: 'pflicht', quantity: 1, icon: '💧' },
      { id: 'lager-besteck', name: 'Besteck', category: 'Ausrüstung', importance: 'pflicht', quantity: 1, icon: '🍴' },
      { id: 'lager-brotdose', name: 'Brotdose', category: 'Ausrüstung', importance: 'pflicht', quantity: 1, icon: '🥪' },
      { id: 'lager-becher', name: 'Tasse / Becher (Plastik)', category: 'Ausrüstung', importance: 'pflicht', quantity: 1, icon: '🥤' },
      { id: 'lager-trockentuch', name: 'Trockentuch', category: 'Ausrüstung', importance: 'pflicht', quantity: 1, icon: '🧻' },

      // Sonstiges / weitere Ausrüstung
      { id: 'shared-rucksack', name: 'Rucksack', category: 'Ausrüstung', importance: 'pflicht', quantity: 1, icon: '🎒' },
      { id: 'shared-taschenlampe', name: 'Taschenlampe mit Ersatzbatterien', category: 'Ausrüstung', importance: 'pflicht', quantity: 1, icon: '🔦' },
      { id: 'shared-sonnenbrille', name: 'Sonnenbrille', category: 'Ausrüstung', importance: 'optional', quantity: 1, icon: '🕶️' },
      { id: 'lager-ersatzbrille', name: 'Ersatzbrille', category: 'Sonstiges', importance: 'optional', quantity: 1, icon: '👓' },
      // Kein `quantity`: ein Brustbeutel ist wie eine Geldbörse, man hat nur einen.
      { id: 'lager-brustbeutel', name: 'Brustbeutel für das Taschengeld', category: 'Sonstiges', importance: 'optional', icon: '💰' },
      {
        id: 'lager-schreibzeug',
        name: 'Schreibzeug / Briefmarken / Postkarten',
        category: 'Sonstiges',
        importance: 'optional',
        quantity: { min: 1, max: 3 },
        icon: '✏️',
        note: rangeNote(1, 3),
      },

      // Nachtzeug – gemeinsamer Kern (unabhängig vom Geschlecht)
      { id: 'shared-schlafsack', name: 'Schlafsack (warm; kein Sommerschlafsack)', category: 'Ausrüstung', importance: 'pflicht', quantity: 1, icon: '🛌' },
      { id: 'lager-warme-decke', name: 'Warme Decke', category: 'Ausrüstung', importance: 'pflicht', quantity: 1, icon: '🛏️' },
      { id: 'lager-kopfkissen', name: 'Kopfkissen', category: 'Ausrüstung', importance: 'pflicht', quantity: 1, icon: '🛏️' },
      { id: 'lager-spannbettlaken', name: 'Spannbettlaken', category: 'Ausrüstung', importance: 'pflicht', quantity: 1, icon: '🛏️' },
    ];

    // Nachtzeug Jungen: Zeltlager mit Isomatte/Luftmatratze statt festem Bett.
    // Ohne Geschlechtsangabe zeigen wir beide Varianten (Jungen + Mädchen),
    // damit nichts Relevantes fehlt — bei "divers" hingegen bewusst keine
    // der beiden zusätzlichen Varianten.
    if (matchesGender(params.gender, 'maennlich')) {
      items.push(
        { id: 'shared-isomatte', name: 'Isomatte', category: 'Ausrüstung', importance: 'pflicht', quantity: 1, icon: '🏕️' },
        { id: 'lager-luftmatratze', name: 'Luftmatratze mit Pumpe', category: 'Ausrüstung', importance: 'optional', quantity: 1, icon: '🏕️' },
        { id: 'lager-trainingsanzug', name: 'Trainingsanzug (als Schlafanzug)', category: 'Kleidung', importance: 'optional', quantity: 1, icon: '🌙' },
      );
    }

    // Nachtzeug Mädchen: feste Betten, daher Bettwäsche statt Isomatte.
    if (matchesGender(params.gender, 'weiblich')) {
      items.push(
        { id: 'lager-bettwaesche', name: 'Bettwäsche (falls kein Schlafsack)', category: 'Ausrüstung', importance: 'optional', quantity: 1, icon: '🛏️' },
        { id: 'lager-hausschuhe', name: 'Hausschuhe', category: 'Kleidung', importance: 'pflicht', quantity: 1, icon: '🥿' },
      );
    }

    // Extra warme Schicht bei kaltem/frostigem Wetter, zusätzlich zum Standard-Pullover.
    if (params.climate.includes('kalt') || params.climate.includes('frostig')) {
      items.push({
        id: 'lager-extra-pulli',
        name: 'Zusätzlicher warmer Pullover',
        category: 'Kleidung',
        importance: 'optional',
        quantity: 1,
        icon: '🧥',
      });
    }

    // Bei längeren Lagern lohnt sich ein eigener Wäschesack für Schmutzwäsche.
    if (params.days >= 5) {
      items.push({
        id: 'lager-waeschebeutel',
        name: 'Beutel für schmutzige Wäsche',
        category: 'Sonstiges',
        importance: 'optional',
        quantity: 1,
        icon: '🧺',
      });
    }

    // Leiter:innen essen aus der Gemeinschaftsküche und bringen kein eigenes
    // Geschirr mit — nur Teilnehmer:innen brauchen ihren eigenen Teller.
    if (vars.rolle !== ROLLE_LEITER) {
      items.push({
        id: 'lager-teller',
        name: 'Teller (tief & flach, Plastik)',
        category: 'Ausrüstung',
        importance: 'pflicht',
        quantity: 2,
        icon: '🍽️',
        note: 'Ein tiefer und ein flacher Teller',
      });
    }

    return items;
  },

  // Kinder/Teilnehmer:innen sollen laut Lagerordnung kein eigenes Smartphone
  // dabeihaben — entfernt das Basis-Preset-Item unabhängig davon, dass es
  // dort (immer) hinzugefügt wird.
  excludeItemIds(_params, vars): string[] {
    return vars.rolle === ROLLE_KIND ? ['base-handy'] : [];
  },
};

export default sommerlager;
