// The Boutique's catalogue: the Projects and the pure rules derived from them (no DOM).
// Price in cups of coffee measures the effort (~12 per week of work); rarity follows from price.

export const CUPS_PER_WEEK = 12;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export const price = ({ weeks, complexity = 1 }) => Math.round(weeks * CUPS_PER_WEEK * clamp(complexity, 0.8, 1.2));

/** common < 15 ☕ ≤ rare ≤ 40 ☕ < epic */
export function rarity(project) {
  const p = price(project);
  return p < 15 ? 'common' : p <= 40 ? 'rare' : 'epic';
}

// Aisles in display order.
export const AISLES = ['web', 'markets', 'ml'];

/** Projects grouped by aisle (fixed order, empty aisles left out), most recent first. */
export function byAisle(projects) {
  return AISLES.map((aisle) => ({
    aisle,
    projects: projects.filter((p) => p.aisle === aisle).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)),
  })).filter((g) => g.projects.length);
}

/** What the card's button does: buy (open the link) or "on request" (opens the Profile). */
export const action = (project) => (project.link ? { kind: 'buy', href: project.link } : { kind: 'ask' });

// ------------------------------------------------------------------ the Projects
// Texts are provisional (ticket 04 writes the real ones from the repos and the report).
// item = the pixel Object that stands for the Project.
export const PROJECTS = [
  {
    id: 'courtier',
    item: 'plug',
    aisle: 'web',
    date: '2026-11',
    weeks: 2.5,
    title: { fr: 'courtier-mcp', en: 'courtier-mcp' },
    blurb: {
      fr: 'Un serveur MCP qui transforme un agent IA en courtier en énergie neutre.',
      en: 'An MCP server that turns an AI agent into a neutral energy broker.',
    },
    methods: { fr: ['MCP', 'Agents IA', 'Python'], en: ['MCP', 'AI agents', 'Python'] },
  },
  {
    id: 'pureoptics',
    item: 'globe',
    aisle: 'web',
    date: '2026-11',
    weeks: 1,
    title: { fr: 'Site PureOptics', en: 'PureOptics website' },
    blurb: {
      fr: 'Des maquettes de page d’accueil pour un opticien, proposées comme pistes de travail.',
      en: 'Homepage mock-ups for an optician, offered as design directions.',
    },
    methods: { fr: ['HTML', 'CSS', 'Design web'], en: ['HTML', 'CSS', 'Web design'] },
    link: 'https://phimabri.github.io/pureoptics-maquettes/',
    preview: 'https://phimabri.github.io/pureoptics-maquettes/',
  },
  {
    id: 'polymarket',
    item: 'orderbook',
    aisle: 'markets',
    date: '2026-11',
    weeks: 2.5,
    title: { fr: 'Market making sur Polymarket', en: 'Market making on Polymarket' },
    blurb: {
      fr: 'Une étude de market making et de latence sur un marché de prédiction.',
      en: 'A study of market making and latency on a prediction market.',
    },
    methods: { fr: ['Carnet d’ordres', 'Latence', 'Backtests'], en: ['Order book', 'Latency', 'Backtests'] },
    link: 'projects/rapport_latence_polymarket.pdf' // relative: the site is served from any base,
  },
  {
    id: 'timeseries',
    item: 'chart',
    aisle: 'ml',
    date: '2024-08',
    weeks: 1,
    title: { fr: 'Analyse de série temporelle', en: 'Time series analysis' },
    blurb: {
      fr: 'Étude et prévision de la production d’outils en France sur plus de dix ans.',
      en: 'Studying and forecasting tool manufacturing in France over more than ten years.',
    },
    methods: { fr: ['ARIMA', 'Stationnarité', 'Prévision'], en: ['ARIMA', 'Stationarity', 'Forecasting'] },
    link: 'https://github.com/Phimabri/time-series-analysis',
  },
  {
    id: 'gan',
    item: 'neurons',
    aisle: 'ml',
    date: '2023-10',
    weeks: 1,
    title: { fr: 'Introduction aux GAN', en: 'Introduction to GANs' },
    blurb: {
      fr: 'Un GAN simple qui apprend à dessiner des chiffres comme ceux de MNIST.',
      en: 'A simple GAN that learns to draw digits like the MNIST ones.',
    },
    methods: { fr: ['GAN', 'Réseaux de neurones', 'MNIST'], en: ['GAN', 'Neural networks', 'MNIST'] },
    link: 'https://github.com/Phimabri/introduction_to_GAN',
  },
];
