// Hob — demo data. Shaped after the kernel's Focus / Phase / Suggestion / Timer patterns.

const RECIPES = [
  {
    id: "bolognese",
    title: "Spaghetti bolognese",
    tier: "moderate", // zombie | moderate | project
    servings: 4,
    timeRelaxed: 75,
    timeOptimized: 62,
    phases: [
      { label: "Prep",   steps: 4, time: 15, product: null },
      { label: "Cook",   steps: 3, time: 12, product: null },
      { label: "Simmer", steps: 2, time: 35, product: "Bolognese sauce" },
      { label: "Finish", steps: 3, time: 13, product: "Cooked pasta" },
    ],
    phasesOptimized: [
      { label: "Kick-off",    steps: 2, time: 8,  product: "Onion + garlic cooking" },
      { label: "Brown & prep",steps: 3, time: 14, product: null },
      { label: "Simmer + pasta",steps: 4, time: 35, product: "Bolognese sauce" },
      { label: "Finish",      steps: 3, time: 5,  product: "Cooked pasta" },
    ],
    steps: [
      {
        phase: "Prep",
        action: "Dice the onion and finely mince the garlic.",
        heat: null,
        equipment: "Chef's knife, board",
        ingredients: [
          { qty: "1 medium", name: "yellow onion" },
          { qty: "3 cloves", name: "garlic" },
        ],
        detail: "Smaller dice melts into the sauce. Aim for roughly the size of a lentil.",
      },
      {
        phase: "Prep",
        action: "Finely dice the carrot and celery.",
        heat: null,
        equipment: "Chef's knife, board",
        ingredients: [
          { qty: "1 medium", name: "carrot" },
          { qty: "2 ribs",   name: "celery" },
        ],
        detail: null,
      },
      {
        phase: "Cook",
        action: "Warm olive oil in a heavy pot over medium heat.",
        heat: "Medium",
        equipment: "Heavy-bottomed pot, 5L+",
        ingredients: [
          { qty: "3 tbsp", name: "olive oil" },
        ],
        detail: null,
      },
      {
        phase: "Cook",
        action: "Soften the soffritto — onion, carrot, celery, garlic — until translucent.",
        heat: "Medium",
        equipment: "Pot, wooden spoon",
        ingredients: [
          { qty: "all",     name: "diced vegetables" },
          { qty: "½ tsp",   name: "salt" },
        ],
        detail: "No colour yet — you're softening, not browning. 6–8 minutes.",
        timer: { label: "Soften soffritto", seconds: 7 * 60 },
      },
      {
        phase: "Cook",
        action: "Add the beef mince and brown, breaking it up as it cooks.",
        heat: "Medium-high",
        equipment: "Pot, wooden spoon",
        ingredients: [
          { qty: "500 g", name: "beef mince, 15% fat" },
        ],
        detail: "Push the mince to the sides of the pot so the centre stays dry — that's where browning happens.",
      },
      {
        phase: "Simmer",
        action: "Deglaze with red wine and let it reduce by half.",
        heat: "Medium",
        equipment: "Pot",
        ingredients: [
          { qty: "200 ml", name: "dry red wine" },
        ],
        detail: null,
        timer: { label: "Reduce wine", seconds: 4 * 60 },
      },
      {
        phase: "Simmer",
        action: "Stir in tomatoes and stock, then simmer gently.",
        heat: "Low",
        equipment: "Pot",
        ingredients: [
          { qty: "800 g",  name: "tinned tomatoes" },
          { qty: "250 ml", name: "beef stock" },
          { qty: "1 tsp",  name: "oregano" },
          { qty: "1",      name: "bay leaf" },
        ],
        detail: "Barely a bubble. Stir every 10 minutes or so.",
        timer: { label: "Simmer sauce", seconds: 30 * 60 },
      },
      {
        phase: "Finish",
        action: "Bring a large pot of water to a rolling boil, then salt generously.",
        heat: "High",
        equipment: "Large pot, 4L+",
        ingredients: [
          { qty: "4 L",      name: "water" },
          { qty: "2 tbsp",   name: "salt" },
        ],
        detail: "The water should taste like the sea.",
        timer: { label: "Boil pasta water", seconds: 6 * 60 },
      },
      {
        phase: "Finish",
        action: "Cook the spaghetti until 1 minute shy of al dente.",
        heat: "High",
        equipment: "Large pot, tongs",
        ingredients: [
          { qty: "400 g", name: "spaghetti" },
        ],
        detail: "Reserve a mug of pasta water before draining.",
        timer: { label: "Boil pasta", seconds: 9 * 60 },
      },
      {
        phase: "Finish",
        action: "Toss the drained pasta through the sauce with a splash of pasta water.",
        heat: "Medium",
        equipment: "Pot, tongs",
        ingredients: [
          { qty: "200 ml", name: "reserved pasta water, as needed" },
        ],
        detail: "The starchy water binds the sauce to the pasta. Toss for a full minute.",
      },
      {
        phase: "Finish",
        action: "Plate and top with parmesan.",
        heat: null,
        equipment: "Plates, grater",
        ingredients: [
          { qty: "60 g", name: "parmesan, grated" },
          { qty: "to taste", name: "black pepper" },
        ],
        detail: null,
      },
    ],
  },

  // Catalog filler (no full steps — for browsing)
  { id: "eggs-toast", title: "Scrambled eggs on toast", tier: "zombie",   servings: 1, timeRelaxed: 10,  phases: [], steps: [] },
  { id: "miso-soup",  title: "Miso soup with tofu",     tier: "zombie",   servings: 2, timeRelaxed: 15,  phases: [], steps: [] },
  { id: "salmon-rice",title: "Salmon + rice bowl",      tier: "moderate", servings: 2, timeRelaxed: 30,  phases: [], steps: [] },
  { id: "tray-roast", title: "Tray-roast chicken thighs", tier: "moderate", servings: 4, timeRelaxed: 45, phases: [], steps: [] },
  { id: "dal",        title: "Red lentil dal",          tier: "moderate", servings: 4, timeRelaxed: 35,  phases: [], steps: [] },
  { id: "ragu",       title: "Sunday short-rib ragu",   tier: "project",  servings: 6, timeRelaxed: 180, phases: [], steps: [] },
  { id: "lasagne",    title: "Lasagne al forno",        tier: "project",  servings: 6, timeRelaxed: 140, phases: [], steps: [] },
];

// Palette presets for tweaks
const PALETTES = {
  paper: {
    name: "Paper",
    light: { "--bg":"#F4EFE6","--bg-2":"#EFE8DC","--surface":"#FBF7F0","--surface-2":"#ECE4D4","--ink":"#2A2521","--ink-2":"#5A524A","--ink-3":"#8B8275","--line":"#DDD3BF","--line-2":"#CFC2A8","--accent":"#C96F3E","--accent-soft":"#E6B897","--sage":"#7A8867","--oat":"#D9CEB4","--clay":"#C96F3E" },
    dark:  { "--bg":"#1A1714","--bg-2":"#211D19","--surface":"#24201B","--surface-2":"#2D2822","--ink":"#F0E8DA","--ink-2":"#BDB3A1","--ink-3":"#857D6F","--line":"#352F28","--line-2":"#463E35","--accent":"#E0915F","--accent-soft":"#7A4C32","--sage":"#95A17F","--oat":"#463E35","--clay":"#E0915F" },
  },
  clay: {
    name: "Clay",
    light: { "--bg":"#EFE4D8","--bg-2":"#E8DBC9","--surface":"#F7EEDF","--surface-2":"#DFCFB7","--ink":"#3A1E12","--ink-2":"#6A4A38","--ink-3":"#947760","--line":"#D4BFA4","--line-2":"#B9A083","--accent":"#A63F2A","--accent-soft":"#D99177","--sage":"#7A8867","--oat":"#D4BFA4","--clay":"#A63F2A" },
    dark:  { "--bg":"#1E1411","--bg-2":"#261B16","--surface":"#2B1F19","--surface-2":"#372721","--ink":"#ECD9BF","--ink-2":"#BBA184","--ink-3":"#887159","--line":"#3E2C25","--line-2":"#4E3A31","--accent":"#E08261","--accent-soft":"#6B3425","--sage":"#95A17F","--oat":"#3E2C25","--clay":"#E08261" },
  },
  oat: {
    name: "Oat",
    light: { "--bg":"#F3EEDE","--bg-2":"#EAE3CD","--surface":"#FAF5E7","--surface-2":"#E3D9BC","--ink":"#29261E","--ink-2":"#5F594A","--ink-3":"#8E8773","--line":"#D8CDAE","--line-2":"#C9BC97","--accent":"#B5904D","--accent-soft":"#E0C891","--sage":"#8C9973","--oat":"#C9BC97","--clay":"#B5904D" },
    dark:  { "--bg":"#191712","--bg-2":"#1F1C17","--surface":"#232018","--surface-2":"#2C2820","--ink":"#EEE5CE","--ink-2":"#BAB196","--ink-3":"#857D6A","--line":"#342F22","--line-2":"#433D2D","--accent":"#D4A866","--accent-soft":"#6A5530","--sage":"#A0AD84","--oat":"#433D2D","--clay":"#D4A866" },
  },
  sage: {
    name: "Sage",
    light: { "--bg":"#EBEDE2","--bg-2":"#E2E5D4","--surface":"#F3F4EB","--surface-2":"#D8DCC6","--ink":"#1E2419","--ink-2":"#4A5240","--ink-3":"#798070","--line":"#CDD3BD","--line-2":"#B9C0A6","--accent":"#5E7349","--accent-soft":"#A6B28F","--sage":"#5E7349","--oat":"#D8DCC6","--clay":"#C96F3E" },
    dark:  { "--bg":"#14170F","--bg-2":"#191D14","--surface":"#1D2117","--surface-2":"#252A1E","--ink":"#E2E8D3","--ink-2":"#AEB79B","--ink-3":"#7C8469","--line":"#2E3424","--line-2":"#3B4330","--accent":"#9BB27C","--accent-soft":"#4B5A3A","--sage":"#9BB27C","--oat":"#3B4330","--clay":"#E0915F" },
  },
};

// Type pairings
const TYPE_PAIRS = {
  "single-grotesk": { "--font-sans": "'Inter', system-ui, sans-serif", "--font-serif": "'Inter', system-ui, sans-serif" },
  "serif-grotesk":  { "--font-sans": "'Inter', system-ui, sans-serif", "--font-serif": "'Fraunces', Georgia, serif" },
  "serif-only":     { "--font-sans": "'Fraunces', Georgia, serif",     "--font-serif": "'Fraunces', Georgia, serif" },
};

// Alternate copy (kernel vs normal recipe app voice)
const COPY = {
  kernel: {
    hubGreeting: "What sounds good tonight?",
    hubSub: "Three options. No scrolling.",
    notThese: "Not these",
    notTonight: "Not tonight",
    allCatalog: "Full catalog",
    startCooking: "Start cooking",
    completeTitle: "Spaghetti bolognese done.",
    completeSub: "Lasagne next?",
    emptyCatalog: "Nothing matches right now.",
    phaseHeader: "Phases",
    relaxedLabel: "Relaxed",
    optimizedLabel: "Optimized",
  },
  normal: {
    hubGreeting: "Discover your next meal!",
    hubSub: "Trending picks just for you ✨",
    notThese: "Show me more",
    notTonight: "I give up",
    allCatalog: "Browse 1,200+ recipes",
    startCooking: "Let's cook! 🍝",
    completeTitle: "You did it! Great job!",
    completeSub: "Streak: 3 days 🔥 — don't break it!",
    emptyCatalog: "Oops! No results found.",
    phaseHeader: "What you'll do",
    relaxedLabel: "Easy",
    optimizedLabel: "Pro",
  },
};

window.RECIPES = RECIPES;
window.PALETTES = PALETTES;
window.TYPE_PAIRS = TYPE_PAIRS;
window.COPY = COPY;
