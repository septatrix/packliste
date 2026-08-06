import type { Item, PresetDefinition } from '../lib/schema';
import { perDay, perDayNote, rangeNote } from './helpers';

const camping: PresetDefinition = {
  id: 'camping',
  name: 'Camping',
  description: 'Ausrüstung für einen Campingurlaub mit Zelt.',

  resolveItems(params): Item[] {
    const items: Item[] = [
      { id: 'camping-zelt', name: 'Zelt', category: 'Ausrüstung', importance: 'pflicht', quantity: 1, icon: '⛺' },
      { id: 'camping-heringe', name: 'Ersatzheringe und -schnüre', category: 'Ausrüstung', importance: 'optional', quantity: 1, icon: '🪝' },
      { id: 'camping-isomatte', name: 'Isomatte / Luftmatratze', category: 'Ausrüstung', importance: 'pflicht', quantity: 1, icon: '🛏️' },
      { id: 'camping-schlafsack', name: 'Schlafsack', category: 'Ausrüstung', importance: 'pflicht', quantity: 1, icon: '🛌' },
      { id: 'camping-kopfkissen', name: 'Reisekissen', category: 'Ausrüstung', importance: 'optional', quantity: 1, icon: '🛏️' },
      {
        id: 'camping-stuhl',
        name: 'Campingstuhl',
        category: 'Ausrüstung',
        importance: 'optional',
        quantity: { min: 1, max: 2 },
        icon: '🪑',
        note: rangeNote(1, 2),
      },
      { id: 'camping-tisch', name: 'Campingtisch', category: 'Ausrüstung', importance: 'optional', quantity: 1, icon: '🪑' },
      { id: 'camping-kuehlbox', name: 'Kühlbox mit Kühlakkus', category: 'Ausrüstung', importance: 'optional', quantity: 1, icon: '🧊' },
      { id: 'camping-kocher', name: 'Gaskocher + Gaskartuschen', category: 'Ausrüstung', importance: 'pflicht', quantity: 1, icon: '🍳' },
      {
        id: 'camping-geschirr',
        name: 'Campinggeschirr (Teller, Becher, Besteck)',
        category: 'Ausrüstung',
        importance: 'pflicht',
        quantity: 1,
        icon: '🍽️',
      },
      { id: 'camping-spuelmittel', name: 'Spülmittel & Schwamm', category: 'Sonstiges', importance: 'optional', quantity: 1, icon: '🧽' },
      { id: 'camping-wasserkanister', name: 'Wasserkanister', category: 'Ausrüstung', importance: 'pflicht', quantity: 1, icon: '💧' },
      { id: 'camping-laterne', name: 'Laterne / Campingleuchte', category: 'Ausrüstung', importance: 'pflicht', quantity: 1, icon: '🏮' },
      { id: 'camping-stirnlampe', name: 'Stirnlampe', category: 'Ausrüstung', importance: 'pflicht', quantity: 1, icon: '🔦' },
      { id: 'camping-multitool', name: 'Multitool / Taschenmesser', category: 'Ausrüstung', importance: 'optional', quantity: 1, icon: '🔪' },
      { id: 'camping-feuerzeug', name: 'Feuerzeug / Streichhölzer', category: 'Sonstiges', importance: 'pflicht', quantity: 1, icon: '🔥' },
      {
        id: 'camping-muellbeutel',
        name: 'Müllbeutel',
        category: 'Sonstiges',
        importance: 'optional',
        quantity: { min: 2, max: 5 },
        icon: '🗑️',
        note: rangeNote(2, 5),
      },
      { id: 'camping-waescheleine', name: 'Wäscheleine & Klammern', category: 'Sonstiges', importance: 'optional', quantity: 1, icon: '🧺' },
      { id: 'camping-reparaturset', name: 'Reparaturset für Zelt (Klebeband, Nadel & Faden)', category: 'Ausrüstung', importance: 'optional', quantity: 1, icon: '🧵' },
      {
        id: 'camping-toilettenpapier',
        name: 'Toilettenpapier',
        category: 'Hygiene',
        importance: 'pflicht',
        quantity: perDay(1, params.days, 6),
        icon: '🧻',
        note: perDayNote(1, params.days, 6),
      },
    ];

    if (params.climate.includes('warm')) {
      items.push(
        { id: 'camping-mueckenschutz', name: 'Mückenschutz', category: 'Hygiene', importance: 'optional', quantity: 1, icon: '🦟' },
        { id: 'camping-sonnensegel', name: 'Sonnensegel / Zeltvordach-Beschattung', category: 'Ausrüstung', importance: 'optional', quantity: 1, icon: '⛱️' },
      );
    }

    if (params.climate.includes('kalt') || params.climate.includes('frostig')) {
      items.push(
        { id: 'camping-inlett', name: 'Schlafsack-Inlett (zusätzliche Wärme)', category: 'Ausrüstung', importance: 'optional', quantity: 1, icon: '🌙' },
        { id: 'camping-warme-decke', name: 'Zusätzliche warme Decke', category: 'Ausrüstung', importance: 'optional', quantity: 1, icon: '🛏️' },
      );
    }

    // Bei längeren Aufenthalten lohnt sich mehr Brennholz/Anzünder für das Lagerfeuer.
    if (params.days >= 3) {
      items.push({
        id: 'camping-brennholz',
        name: 'Feueranzünder (für längere Aufenthalte)',
        category: 'Sonstiges',
        importance: 'optional',
        quantity: 1,
        icon: '🪵',
      });
    }

    return items;
  },
};

export default camping;
