import { test } from 'node:test';
import assert from 'node:assert/strict';
import { price, rarity, byAisle, action, PROJECTS, AISLES } from '../src/shop/catalog.js';

test('un Projet coûte environ 12 tasses de café par semaine de travail', () => {
  assert.equal(price({ weeks: 1 }), 12);
  assert.equal(price({ weeks: 2.5 }), 30);
});

test('la complexité ajuste le prix, bornée entre ×0,8 et ×1,2', () => {
  assert.equal(price({ weeks: 1, complexity: 1.1 }), 13);
  assert.equal(price({ weeks: 2, complexity: 3 }), 29); // 24 × 1,2 = 28,8
  assert.equal(price({ weeks: 2, complexity: 0.1 }), 19); // 24 × 0,8 = 19,2
});

test('la Rareté se déduit du prix : commun sous 15, rare de 15 à 40, épique au-delà', () => {
  assert.equal(rarity({ weeks: 1 }), 'common'); // 12
  assert.equal(rarity({ weeks: 1.25 }), 'rare'); // 15
  assert.equal(rarity({ weeks: 2.5 }), 'rare'); // 30
  assert.equal(rarity({ weeks: 10 / 3 }), 'rare'); // 40
  assert.equal(rarity({ weeks: 4 }), 'epic'); // 48
});

test('les Projets sont groupés par Rayon, dans l’ordre fixe des Rayons, du plus récent au plus ancien', () => {
  const projects = [
    { id: 'a', aisle: 'ml', date: '2023-05' },
    { id: 'b', aisle: 'web', date: '2026-02' },
    { id: 'c', aisle: 'ml', date: '2024-03' },
    { id: 'd', aisle: 'web', date: '2026-10' },
  ];
  const groups = byAisle(projects);
  assert.deepEqual(groups.map((g) => g.aisle), ['web', 'ml']); // pas de Rayon « markets » : il est absent
  assert.deepEqual(groups[0].projects.map((p) => p.id), ['d', 'b']);
  assert.deepEqual(groups[1].projects.map((p) => p.id), ['c', 'a']);
});

test('avec un lien on achète, sans lien c’est « Sur demande »', () => {
  assert.deepEqual(action({ link: 'https://github.com/x/y' }), { kind: 'buy', href: 'https://github.com/x/y' });
  assert.deepEqual(action({}), { kind: 'ask' });
});

test('garde-fou : chaque Projet du vrai catalogue a ses textes en FR et en EN', () => {
  for (const p of PROJECTS) {
    for (const lang of ['fr', 'en']) {
      assert.ok(p.title[lang], `${p.id} : titre ${lang}`);
      assert.ok(p.blurb[lang], `${p.id} : explication ${lang}`);
      assert.ok(p.methods[lang]?.length, `${p.id} : méthodes ${lang}`);
    }
    assert.ok(AISLES.includes(p.aisle), `${p.id} : Rayon connu`);
  }
});
