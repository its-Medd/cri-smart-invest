// data/cri.js
export const CRI_LIST = [
  { id: 1, region: 'Tanger-Tétouan-Al Hoceima', ville: 'Tanger',
    tel: '05 39 34 23 03', email: 'info@investangier.com', site: 'www.investangier.com',
    adresse: 'Av. Omar Ibn Al Khattab, Tanger 90060' },
  { id: 2, region: 'Oriental', ville: 'Oujda',
    tel: '05 36 69 09 69', email: 'spoc@orientalinvest.ma', site: 'www.orientalinvest.ma',
    adresse: 'Bd. Prince Héritier Moulay El Hassan, Oujda' },
  { id: 3, region: 'Fès-Meknès', ville: 'Fès',
    tel: '05 35 65 20 57', email: 'info@fesmeknesinvest.ma', site: 'www.fesmeknesinvest.ma',
    adresse: '45, Avenue Taha Houcine, 30000 Fès' },
  { id: 4, region: 'Rabat-Salé-Kénitra', ville: 'Rabat',
    tel: '05 37 77 64 00', email: 'info@rabatinvest.ma', site: 'www.rabatinvest.ma',
    adresse: '23, avenue de la Victoire, Rabat 10090' },
  { id: 5, region: 'Béni Mellal-Khénifra', ville: 'Béni Mellal',
    tel: '05 23 48 20 72', email: 'contact@soeurdumaroc.ma', site: 'www.coeurdumaroc.ma',
    adresse: 'Bd. Bayrout, Béni Mellal 23000' },
  { id: 6, region: 'Casablanca-Settat', ville: 'Casablanca',
    tel: '05 22 49 42 00', email: 'Info@casainvest.ma', site: 'www.casainvest.ma',
    adresse: 'Angle Bd. GHANDI et Rue Laarbi Doghmi, Casa 20000' },
  { id: 7, region: 'Marrakech-Safi', ville: 'Marrakech',
    tel: '05 24 42 04 93', email: 'contact@marrakechinvest.ma', site: 'www.marrakechinvest.ma',
    adresse: 'Jnane Iharti, Avenue John Kennedy, Marrakech 40000' },
  { id: 8, region: 'Drâa-Tafilalet', ville: 'Errachidia',
    tel: '05 35 57 38 01', email: 'contact@cridt.ma', site: 'www.cridraatafilalet.ma',
    adresse: 'Avenue Hassan II, Route de Meknès, Errachidia' },
  { id: 9, region: 'Souss-Massa', ville: 'Agadir',
    tel: '05 28 23 08 77', email: 'contact@agadirinvest.com', site: 'www.agadirinvest.com',
    adresse: 'Souss Massa Cité Founty, B.P 31.333, Agadir 80000' },
  { id: 10, region: 'Guelmim-Oued Noun', ville: 'Guelmim',
    tel: '05 28 77 15 55', email: 'direction@guelmiminvest.ma', site: 'www.guelmiminvest.ma',
    adresse: 'N° 202, Siège CRI, Quartier Administratif, Guelmim 81000' },
  { id: 11, region: 'Laâyoune-Sakia El Hamra', ville: 'Laâyoune',
    tel: '05 28 89 11 89', email: 'contact@laayouneinvest.ma', site: 'www.laayouneinvest.ma',
    adresse: 'Av. Mohamed VI, BP 2266, Laâyoune 70000' },
  { id: 12, region: 'Dakhla-Oued Ed-Dahab', ville: 'Dakhla',
    tel: '05 35 89 85 28', email: 'contact@dakhlainvest.com', site: 'www.dakhlainvest.com',
    adresse: 'Av. Ahmed Ben Chekroun, Massira II, B.P.01 Dakhla' },
];

// data/documents.js
export const DOCUMENTS_REQUIS = [
  { id: 'statuts',    label: 'Extrait des statuts de l’entreprise + dernier PV de l\'organe délibérant',         desc: '',            required: true },
  { id: 'rc',         label: 'Certificat RC (Modèle J)',    desc: 'Délivré depuis moins de 6 mois',                  required: true },
  { id: 'fiscale',    label: 'Attestation fiscale',         desc: 'Situation fiscale régulière — moins de 6 mois',   required: true },
  { id: 'cnss',       label: 'Attestation CNSS',            desc: 'Situation régulière — moins de 6 mois',           required: true },
  { id: 'financiers', label: 'Copie des  états financiers',            desc: '3 derniers exercices (ou depuis création)',        required: true },
  { id: 'declaration',label: 'Déclaration du projet',       desc: 'Télécharger le modèle de présentation', fileUrl: "/docs/presentation-projet.docx",               required: true },
  { id: 'immobilier', label: 'Contrat immobilier',          desc: 'Acquisition, location ou promesse de bail',       required: true },
  { id: 'cni',        label: 'pièces justificatives du représentant légal',   desc: 'Pièce d\'identité officielle en cours de validité', required: true },
];

export const documents = [
  {
    title: "Déclaration du projet",
    description: "Télécharger le modèle de présentation",
    fileUrl: "/docs/presentation-projet.docx"
  }
];


// data/primes.js — Règles métier
export const CALCUL_PRIME = {
  PLAFOND_PRIMABLE: 50_000_000,
  EMPLOI: [
    { min: 2,  max: 5,        pct: 5  },
    { min: 5,  max: 10,       pct: 7, exclusive: true },
    { min: 10, max: Infinity, pct: 10 },
  ],
  TERRITORIAL: { A: 10, B: 15, AUCUNE: 0 },
  PRIORITAIRE: 10,
  MAX_TOTAL: 30,
  SEUIL_ELIGIBILITE: { general: 1.5, tourisme: 1.0 },
};

export const REGIONS = [
  'Tanger-Tétouan-Al Hoceima', 'Oriental', 'Fès-Meknès',
  'Rabat-Salé-Kénitra', 'Béni Mellal-Khénifra', 'Casablanca-Settat',
  'Marrakech-Safi', 'Drâa-Tafilalet', 'Souss-Massa',
  'Guelmim-Oued Noun', 'Laâyoune-Sakia El Hamra', 'Dakhla-Oued Ed-Dahab',
];

export const SECTEURS = [
  'Industrie manufacturière', 'Agriculture, sylviculture et pêche',
  'Hébergement et restauration', 'Tourisme', 'Information et communication',
  'Artisanat', 'Énergies renouvelables', 'Industries extractives',
  'Transports et entreposage', 'Enseignement', 'Santé humaine', 'Autre',
];