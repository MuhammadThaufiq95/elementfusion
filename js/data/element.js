// Format: simbol nama simbol nama ... (urut nomor atom 1..118)
const RAW = `
H Hidrogen He Helium Li Litium Be Berilium B Boron C Karbon N Nitrogen O Oksigen F Fluorin Ne Neon
Na Natrium Mg Magnesium Al Aluminium Si Silikon P Fosfor S Belerang Cl Klorin Ar Argon
K Kalium Ca Kalsium Sc Skandium Ti Titanium V Vanadium Cr Kromium Mn Mangan Fe Besi Co Kobalt Ni Nikel Cu Tembaga Zn Seng
Ga Galium Ge Germanium As Arsenik Se Selenium Br Bromin Kr Kripton
Rb Rubidium Sr Stronsium Y Itrium Zr Zirkonium Nb Niobium Mo Molibdenum Tc Teknesium Ru Rutenium Rh Rodium Pd Paladium Ag Perak Cd Kadmium
In Indium Sn Timah Sb Antimon Te Telurium I Iodin Xe Xenon
Cs Sesium Ba Barium La Lantanum Ce Serium Pr Praseodimium Nd Neodimium Pm Prometium Sm Samarium Eu Europium Gd Gadolinium Tb Terbium Dy Disprosium Ho Holmium Er Erbium Tm Tulium Yb Iterbium Lu Lutesium
Hf Hafnium Ta Tantalum W Tungsten Re Renium Os Osmium Ir Iridium Pt Platina Au Emas Hg Raksa
Tl Talium Pb Timbal Bi Bismut Po Polonium At Astatin Rn Radon
Fr Fransium Ra Radium Ac Aktinium Th Torium Pa Protaktinium U Uranium Np Neptunium Pu Plutonium Am Amerisium Cm Kurium Bk Berkelium Cf Kalifornium Es Einsteinium Fm Fermium Md Mendelevium No Nobelium Lr Lawrensium
Rf Rutherfordium Db Dubnium Sg Seaborgium Bh Bohrium Hs Hasium Mt Meitnerium Ds Darmstadtium Rg Roentgenium Cn Kopernikium
Nh Nihonium Fl Flerovium Mc Moskovium Lv Livermorium Ts Tenesin Og Oganeson
`;

const NOBLE = new Set([2, 10, 18, 36, 54, 86, 118]);
const HALOGEN = new Set([9, 17, 35, 53, 85, 117]);
const ALKALI = new Set([3, 11, 19, 37, 55, 87]);
const ALKALINE = new Set([4, 12, 20, 38, 56, 88]);
const METALLOID = new Set([5, 14, 32, 33, 51, 52]);
const NONMETAL = new Set([1, 6, 7, 8, 15, 16, 34]);
const POST = new Set([13, 31, 49, 50, 81, 82, 83, 84, 113, 114, 115, 116]);

function categoryOf(z) {
    if (NOBLE.has(z)) return 'noble';
    if (HALOGEN.has(z)) return 'halogen';
    if (ALKALI.has(z)) return 'alkali';
    if (ALKALINE.has(z)) return 'alkaline';
    if (METALLOID.has(z)) return 'metalloid';
    if (NONMETAL.has(z)) return 'nonmetal';
    if (POST.has(z)) return 'post';
    if (z >= 57 && z <= 71) return 'lanthanide';
    if (z >= 89 && z <= 103) return 'actinide';
    return 'transition';
}

export const CATEGORY_COLORS = {
    nonmetal: { base: '#3fbf7f', light: '#9af2c4' },
    noble: { base: '#9b6bff', light: '#d2bcff' },
    alkali: { base: '#ff6b5e', light: '#ffb7ae' },
    alkaline: { base: '#ff9f43', light: '#ffd7a3' },
    transition: { base: '#4da3ff', light: '#b3d8ff' },
    post: { base: '#38c9c0', light: '#a5f0ea' },
    metalloid: { base: '#c8d94a', light: '#eef59f' },
    halogen: { base: '#ff5fa8', light: '#ffb8d9' },
    lanthanide: { base: '#d9b86a', light: '#f5e3b0' },
    actinide: { base: '#c0806f', light: '#e9c2b8' },
};

const tokens = RAW.trim().split(/\s+/);

export const ELEMENTS = [null];
for (let i = 0; i < tokens.length; i += 2) {
    const z = ELEMENTS.length;
    ELEMENTS.push({ z, symbol: tokens[i], name: tokens[i + 1], category: categoryOf(z) });
}

export function getElement(z) {
    return ELEMENTS[z] || ELEMENTS[1];
}

export const TOTAL_ELEMENTS = ELEMENTS.length - 1; // 118