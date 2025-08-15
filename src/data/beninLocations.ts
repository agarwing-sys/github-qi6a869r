// Départements et villes du Bénin
export const beninLocations = {
  "Alibori": [
    "Banikoara",
    "Gogounou", 
    "Kandi",
    "Karimama",
    "Malanville",
    "Ségbana"
  ],
  "Atacora": [
    "Boukoumbé",
    "Cobly",
    "Kérou",
    "Kouandé",
    "Matéri",
    "Natitingou",
    "Pehunco",
    "Tanguiéta",
    "Toucountouna"
  ],
  "Atlantique": [
    "Abomey-Calavi",
    "Allada",
    "Kpomassè",
    "Ouidah",
    "Sô-Ava",
    "Toffo",
    "Tori-Bossito",
    "Zè"
  ],
  "Borgou": [
    "Bembèrèkè",
    "Kalalé",
    "N'Dali",
    "Nikki",
    "Parakou",
    "Pèrèrè",
    "Sinendé",
    "Tchaourou"
  ],
  "Collines": [
    "Bantè",
    "Dassa-Zoumè",
    "Glazoué",
    "Ouèssè",
    "Savalou",
    "Savè"
  ],
  "Couffo": [
    "Aplahoué",
    "Djakotomey",
    "Dogbo",
    "Klouékanmè",
    "Lalo",
    "Toviklin"
  ],
  "Donga": [
    "Bassila",
    "Copargo",
    "Djougou",
    "Ouaké"
  ],
  "Littoral": [
    "Cotonou"
  ],
  "Mono": [
    "Athiémé",
    "Bopa",
    "Comè",
    "Grand-Popo",
    "Houéyogbé",
    "Lokossa"
  ],
  "Ouémé": [
    "Adjarra",
    "Adjohoun",
    "Aguégués",
    "Akpro-Missérété",
    "Avrankou",
    "Bonou",
    "Dangbo",
    "Porto-Novo",
    "Sèmè-Kpodji"
  ],
  "Plateau": [
    "Adja-Ouèrè",
    "Ifangni",
    "Kétou",
    "Pobè",
    "Sakété"
  ],
  "Zou": [
    "Abomey",
    "Agbangnizoun",
    "Bohicon",
    "Cové",
    "Djidja",
    "Ouinhi",
    "Za-Kpota",
    "Zangnanado",
    "Zogbodomey"
  ]
};

export const departments = Object.keys(beninLocations);

export const getCitiesByDepartment = (department: string): string[] => {
  return beninLocations[department as keyof typeof beninLocations] || [];
};