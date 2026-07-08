/**
 * Ghana Educational Data - Comprehensive curriculum content for Ghana Learning
 * Aligned with GES Standards-Based Curriculum (KG1-KG2, Basic 1-2)
 */

// Regions of Ghana
export const GHANA_REGIONS_DATA = {
  'ashanti': {
    name: 'Ashanti Region',
    capital: 'Kumasi',
    fact: 'The Ashanti Region is famous for the powerful Ashanti Kingdom and its beautiful Kente cloth.',
    icon: '👑',
  },
  'greater-accra': {
    name: 'Greater Accra Region',
    capital: 'Accra',
    fact: "Accra is the capital city of Ghana! It's a busy city with lots of markets and beautiful beaches.",
    icon: '🏙️',
  },
  'eastern': {
    name: 'Eastern Region',
    capital: 'Koforidua',
    fact: 'This region has the big Akosombo Dam, which makes electricity for the whole country.',
    icon: '💡',
  },
  'western': {
    name: 'Western Region',
    capital: 'Sekondi-Takoradi',
    fact: "The Western Region has many castles from olden times and is where much of Ghana's cocoa comes from.",
    icon: '🍫',
  },
  'volta': {
    name: 'Volta Region',
    capital: 'Ho',
    fact: 'The Volta Region is home to Mount Afadja, the highest mountain in Ghana, and many beautiful waterfalls.',
    icon: '⛰️',
  },
  'central': {
    name: 'Central Region',
    capital: 'Cape Coast',
    fact: "This region has famous castles like Cape Coast Castle and Elmina Castle where you can learn about Ghana's history.",
    icon: '🏰',
  },
  'northern': {
    name: 'Northern Region',
    capital: 'Tamale',
    fact: 'The Northern Region is home to Mole National Park, where you can see elephants!',
    icon: '🐘',
  },
  'upper-west': {
    name: 'Upper West Region',
    capital: 'Wa',
    fact: 'People in the Upper West Region are known for their special music and dance, like the Bawa dance.',
    icon: '💃',
  },
  'upper-east': {
    name: 'Upper East Region',
    capital: 'Bolgatanga',
    fact: 'This region is famous for its colorful, hand-woven baskets.',
    icon: '🧺',
  },
   'bono': {
    name: 'Bono Region',
    capital: 'Sunyani',
    fact: 'The Bono Region is known for its beautiful forests and the a monkey sanctuary where monkeys are sacred.',
    icon: '🐒',
  },
   'bono-east': {
    name: 'Bono East Region',
    capital: 'Techiman',
    fact: 'This region is a major market center, and has the beautiful Fuller Falls.',
    icon: '🌊',
  },
   'ahafo': {
    name: 'Ahafo Region',
    capital: 'Goaso',
    fact: 'The Ahafo Region is a new region and is known for farming and having a lot of gold.',
    icon: '💰',
  },
   'western-north': {
    name: 'Western North Region',
    capital: 'Sefwi Wiawso',
    fact: 'This region is covered in green rainforests and has many cocoa farms.',
    icon: '🌳',
  },
  'oti': {
    name: 'Oti Region',
    capital: 'Dambai',
    fact: 'The Oti Region has part of the huge Volta Lake, the largest man-made lake in the world.',
    icon: '🛶',
  },
  'savannah': {
    name: 'Savannah Region',
    capital: 'Damongo',
    fact: 'The Savannah Region is home to the mysterious Larabanga Mosque, one of the oldest mosques in Ghana.',
    icon: '🕌',
  },
  'north-east': {
    name: 'North East Region',
    capital: 'Nalerigu',
    fact: 'This region has a long history of powerful kingdoms and is known for its unique culture.',
    icon: '🛡️',
  },
};

// Ghanaian Foods
export const GHANAIAN_FOODS = [
  { id: '1', name: 'Fufu', description: 'Made from cassava and plantain, pounded into soft dough', region: 'nationwide', image: '🍠' },
  { id: '2', name: 'Banku', description: 'Soft corn meal dish, served with soup', region: 'ga', image: '🥣' },
  { id: '3', name: 'Kenkey', description: 'Fermented corn dough, wrapped in plantain leaves', region: 'ga', image: '🫓' },
  { id: '4', name: 'Kelewele', description: 'Spicy fried plantain cubes', region: 'ashanti', image: '🍌' },
  { id: '5', name: 'Waakye', description: 'Rice and beans with gari and vegetables', region: 'nationwide', image: '🍚' },
  { id: '6', name: 'Jollof Rice', description: 'One-pot rice dish with tomatoes and spices', region: 'nationwide', image: '🍚' },
  { id: '7', name: 'Ampesi', description: 'Boiled yam or cassava served with kontomire stew', region: 'ashanti', image: '🍠' },
  { id: '8', name: 'Tuo Zaafi', description: 'Millet or corn dough with soup, popular in the north', region: 'northern', image: '🥣' },
  { id: '9', name: 'Red Red', description: 'Beans stew with fried plantain', region: 'nationwide', image: '🍛' },
  { id: '10', name: 'Groundnut Soup', description: 'Rich peanut soup served with rice or fufu', region: 'nationwide', image: '🥜' },
];

// Ghanaian Festivals
export const GHANAIAN_FESTIVALS = [
  { id: '1', name: 'Homowo', people: 'Ga', month: 'August', description: 'Festival of harvest, meaning "hooting at hunger"', image: '🎉' },
  { id: '2', name: 'Akwasidae', people: 'Ashanti', month: 'Every 6 weeks', description: 'Sacred day to remember ancestors', image: '👑' },
  { id: '3', name: 'Hogbetsotso', people: 'Ewe', month: 'November', description: 'Migration celebration with colorful processions', image: '🎊' },
  { id: '4', name: 'Aboakyer', people: 'Fante', month: 'December', description: 'Deer hunting festival', image: '🦌' },
  { id: '5', name: 'Damba', people: 'Dagomba', month: 'July', description: 'Celebrates the birth and naming of Prophet Muhammad', image: '🕌' },
  { id: '6', name: 'Panafest', people: 'All', month: 'July/August', description: 'Cultural festival celebrating African heritage', image: '🎭' },
  { id: '7', name: 'Hemaa', people: 'Ashanti', month: 'December', description: 'Queen mothers festival', image: '👸' },
  { id: '8', name: 'Nzema Yam Festival', people: 'Nzema', month: 'July', description: 'Thanksgiving for yam harvest', image: '🍠' },
];

// Ghanaian Currencies - Cedi and Pesewas
export const GHANAIAN_CURRENCY = {
  cedi: {
    name: 'Ghana Cedi',
    symbol: '₵',
    description: 'The Ghanaian Cedi is the currency of Ghana. 1 Cedi = 100 Pesewas.',
    coins: ['₵0.01', '₵0.05', '₵0.10', '₵0.25', '₵1'],
    notes: ['₵1', '₵2', '₵5', '₵10', '₵20', '₵50', '₵100'],
  },
  pesewa: {
    name: 'Pesewa',
    symbol: '₵',
    description: 'Smaller unit of Ghanaian currency. 100 Pesewas = 1 Cedi.',
    denominations: ['1p', '2p', '5p', '10p', '25p', '50p'],
  },
};

// Ghanaian Traditional Cloths - Kente & Adinkra
export const GHANAIAN_CLOTHS = {
  kente: {
    name: 'Kente Cloth',
    origin: 'Ashanti',
    description: 'Handwoven silk and cotton cloth with bright colors and geometric patterns',
    patterns: ['Sika Futuro (Gold Dust)', 'Eban (Safety)', 'Fathia Fata Nkrumah', 'Sankofa'],
    colors: ['Red (blood)', 'Gold (wealth)', 'Green (growth)', 'Black (maturity)'],
  },
  adinkra: {
    name: 'Adinkra Cloth',
    origin: 'Ashanti',
    description: 'Stamped cloth with symbolic patterns representing proverbs and concepts',
    symbols: ['Gye Nyame (Supremacy of God)', 'Sankofa (Return and fetch it)', 'Nyansapo (Wisdom knot)'],
  },
};

// Ghanaian Animals
export const GHANAIAN_ANIMALS = [
  { id: '1', name: 'Lion', localName: 'Akyede (Twi)', habitat: 'Mole National Park', fact: 'Lions are symbols of bravery in Ghanaian culture' },
  { id: '2', name: 'Elephant', localName: 'Ekyerɛn (Twi)', habitat: 'Mole National Park', fact: 'Elephants are the largest animals in Ghana' },
  { id: '3', name: 'Parrot', localName: 'Apreɛ (Twi)', habitat: 'Forests', fact: 'Parrots can talk and have colorful feathers' },
  { id: '4', name: 'Hippo', localName: 'Bɔso (Twi)', habitat: 'Volta River', fact: 'Hippos spend most of their day in water' },
  { id: '5', name: 'Crocodile', localName: 'Dede (Twi)', habitat: 'Northern rivers', fact: 'Sacred crocodiles live at Paga in Upper East' },
];

// Ghanaian Markets
export const GHANAIAN_MARKETS = [
  { id: '1', name: 'Makola Market', location: 'Accra', knownFor: 'Everything! Clothes, food, electronics' },
  { id: '2', name: 'Kejetia Market', location: 'Kumasi', knownFor: 'Largest open-air market in West Africa' },
  { id: '3', name: 'Techiman Market', location: 'Bono East', knownFor: 'Fresh produce and livestock' },
  { id: '4', name: 'Salaga Market', location: 'Savannah', knownFor: 'Cattle and grain trading' },
];

// Ghanaian Proverbs for Kids
export const GHANAIAN_PROVERBS = [
  { id: '1', proverb: 'Mmire nnaa, mpanyimfo mu', meaning: 'When the cock crows, the family wakes up', usage: 'Early morning productivity' },
  { id: '2', proverb: 'Sankofa', meaning: 'Return and fetch it - learn from the past', usage: 'Wisdom and knowledge' },
  { id: '3', proverb: 'Ɛwɔ te sɛn? It has not happened before', meaning: 'It has not happened before', usage: 'Unique things' },
  { id: '4', proverb: 'Akoma', meaning: 'The linked hearts - patience and endurance', usage: 'Patience' },
  { id: '5', proverb: 'Gye Nyame', meaning: 'Except for God - supremacy of God', usage: 'Faith' },
];

// Ghanaian National Symbols
export const GHANAIAN_SYMBOLS = [
  { id: '1', name: 'National Flag', description: 'Red, Yellow, Green with black star', meaning: 'Red = blood, Yellow = mineral wealth, Green = forests, Black Star = African independence' },
  { id: '2', name: 'Coat of Arms', description: 'Eagle, cocoa tree, gold mine', meaning: 'National unity and prosperity' },
  { id: '3', name: 'National Anthem', description: 'God bless our homeland Ghana', meaning: 'Prayer for the nation' },
  { id: '4', name: 'National Flower', description: 'Calabash', meaning: 'Our heritage and culture' },
];