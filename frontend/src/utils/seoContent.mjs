export const BRAND_NAME = 'CivicsPulse';
export const SITE_URL = 'https://civicspulse.in';
export const DEFAULT_IMAGE = '/civic-hero.png';

export const SEO_LANGUAGES = [
  { code: 'en', label: 'English', locale: 'en-IN' },
  { code: 'hi', label: 'Hindi', locale: 'hi-IN' },
  { code: 'mr', label: 'Marathi', locale: 'mr-IN' },
  { code: 'gu', label: 'Gujarati', locale: 'gu-IN' },
  { code: 'bn', label: 'Bengali', locale: 'bn-IN' },
  { code: 'ta', label: 'Tamil', locale: 'ta-IN' },
  { code: 'te', label: 'Telugu', locale: 'te-IN' },
  { code: 'kn', label: 'Kannada', locale: 'kn-IN' },
  { code: 'ml', label: 'Malayalam', locale: 'ml-IN' },
  { code: 'pa', label: 'Punjabi', locale: 'pa-IN' },
];

const SEO_COPY = {
  en: {
    eyebrow: 'Mumbai civic reporting',
    primaryCta: 'Raise an issue',
    secondaryCta: 'View live reports',
    trustTitle: 'Why citizens use CivicsPulse',
    trustItems: [
      'Reports are mapped to ward, city, corporator, and MLA data.',
      'Public tracking IDs make every civic issue easier to follow.',
      'Photo, voice, category, and location details help teams act faster.',
    ],
    faqTitle: 'Common civic reporting questions',
    searchIntent: 'Search-friendly civic pages',
  },
  hi: {
    eyebrow: 'मुंबई नागरिक रिपोर्टिंग',
    primaryCta: 'समस्या उठाएं',
    secondaryCta: 'लाइव रिपोर्ट देखें',
    trustTitle: 'नागरिक CivicsPulse क्यों उपयोग करते हैं',
    trustItems: [
      'रिपोर्ट वार्ड, शहर, कॉरपोरेटर और MLA डेटा से मैप होती हैं.',
      'पब्लिक ट्रैकिंग ID से हर civic issue फॉलो करना आसान होता है.',
      'फोटो, वॉइस, कैटेगरी और लोकेशन टीमों को जल्दी कार्रवाई में मदद करते हैं.',
    ],
    faqTitle: 'नागरिक रिपोर्टिंग सवाल',
    searchIntent: 'सर्च के लिए civic pages',
  },
  mr: {
    eyebrow: 'मुंबई नागरी रिपोर्टिंग',
    primaryCta: 'तक्रार नोंदवा',
    secondaryCta: 'लाइव्ह रिपोर्ट पहा',
    trustTitle: 'नागरिक CivicsPulse का वापर करतात',
    trustItems: [
      'रिपोर्ट वार्ड, शहर, कॉरपोरेटर आणि MLA डेटाशी मॅप होतात.',
      'Public tracking ID मुळे प्रत्येक तक्रार फॉलो करणे सोपे होते.',
      'फोटो, आवाज, श्रेणी आणि लोकेशन टीमला जलद कारवाईत मदत करतात.',
    ],
    faqTitle: 'नागरी रिपोर्टिंग प्रश्न',
    searchIntent: 'सर्चसाठी नागरी पाने',
  },
};

const getCopy = (language = 'en') => SEO_COPY[language] || SEO_COPY.en;

export const CATEGORY_SEO_PAGES = [
  {
    key: 'pothole',
    path: '/report-pothole-mumbai',
    category: 'Pothole',
    title: 'Report potholes in Mumbai wards',
    description: 'Report potholes in Mumbai with photo evidence, GPS location, ward mapping, and public tracking through CivicsPulse.',
    keywords: ['report pothole Mumbai', 'Mumbai road complaint', 'BMC pothole ward'],
  },
  {
    key: 'garbage',
    path: '/report-garbage-mumbai',
    category: 'Garbage',
    title: 'Report garbage complaints in Mumbai',
    description: 'Raise garbage, dumping, and sanitation reports in Mumbai with ward-level tracking and representative mapping.',
    keywords: ['garbage complaint Mumbai', 'report dumping Mumbai', 'Mumbai sanitation complaint'],
  },
  {
    key: 'water',
    path: '/report-water-leakage-mumbai',
    category: 'Water leakage',
    title: 'Report water leakage and drainage issues in Mumbai',
    description: 'Track water leakage, drainage, and waterlogging complaints by ward with photos, location, and public timelines.',
    keywords: ['water leakage complaint Mumbai', 'Mumbai waterlogging report', 'drainage complaint Mumbai'],
  },
  {
    key: 'streetlight',
    path: '/report-streetlight-mumbai',
    category: 'Streetlight',
    title: 'Report streetlight issues in Mumbai',
    description: 'Report broken or unsafe streetlights in Mumbai and map them to the right ward and representative dashboard.',
    keywords: ['streetlight complaint Mumbai', 'report street light Mumbai', 'ward streetlight issue'],
  },
  {
    key: 'tree',
    path: '/report-tree-hazard-mumbai',
    category: 'Tree hazard',
    title: 'Report tree hazards in Mumbai',
    description: 'Raise unsafe tree branch, fallen tree, and footpath hazard reports with location and ward mapping.',
    keywords: ['tree hazard Mumbai', 'fallen tree complaint Mumbai', 'report tree branch Mumbai'],
  },
  {
    key: 'safety',
    path: '/report-safety-issue-mumbai',
    category: 'Safety issue',
    title: 'Report civic safety issues in Mumbai',
    description: 'Report civic safety hazards in Mumbai with evidence, ward routing, public timeline, and escalation tracking.',
    keywords: ['civic safety complaint Mumbai', 'report unsafe road Mumbai', 'public safety ward report'],
  },
];

export const WARD_SEO_PAGES = [
  { slug: 'colaba', name: 'Colaba', wardNumber: 'A', zone: 'A', description: 'Track potholes, garbage, water, safety, tree, and streetlight reports in Colaba ward.' },
  { slug: 'fort-ballard-estate', name: 'Fort and Ballard Estate', wardNumber: 'A', zone: 'A', description: 'Follow public civic reports and ward-level issue timelines for Fort and Ballard Estate.' },
  { slug: 'dadar', name: 'Dadar', wardNumber: 'G-North', zone: 'G-North', description: 'Raise and track Dadar civic complaints with ward and representative mapping.' },
  { slug: 'bandra-west', name: 'Bandra West', wardNumber: 'H-West', zone: 'H-West', description: 'Report Bandra West issues and follow public updates by ward and category.' },
  { slug: 'pali-village-old-khar', name: 'Pali Village and Old Khar', wardNumber: '100', zone: 'H-West', description: 'Track Pali Village and Old Khar civic issues with public IDs and local ward context.' },
  { slug: 'bandra-talao-bandstand', name: 'Bandra Talao and Bandstand', wardNumber: '101', zone: 'H-West', description: 'View Bandra Talao and Bandstand ward reports, escalations, and resolved civic issues.' },
  { slug: 'andheri-west', name: 'Andheri West', wardNumber: 'K-West', zone: 'K-West', description: 'Raise Andheri West reports and route them to ward-level civic representatives.' },
  { slug: 'govind-nagar', name: 'Govind Nagar', wardNumber: '10', zone: 'Mumbai', description: 'Report Govind Nagar civic issues with location, ward, and public tracking details.' },
  { slug: 'kandarpada-ic-colony', name: 'Kandarpada - IC Colony', wardNumber: '1', zone: 'Mumbai', description: 'Track Kandarpada and IC Colony civic reports with local ward mapping.' },
  { slug: 'borivali', name: 'Borivali', wardNumber: 'R-Central', zone: 'R-Central', description: 'Follow Borivali ward reports across roads, water, sanitation, lights, and safety.' },
];

export const CORE_SEO_PAGES = [
  {
    key: 'home',
    path: '/',
    title: 'CivicsPulse - Mumbai civic reporting and issue tracker',
    description: 'Raise civic issues, track public timelines, and map Mumbai ward reports to corporators and MLAs through CivicsPulse.',
    priority: '1.0',
    changefreq: 'daily',
    keywords: ['CivicsPulse', 'Mumbai civic reporting', 'ward issue tracker'],
  },
  {
    key: 'mumbai',
    path: '/mumbai',
    title: 'Mumbai civic issue reporting by ward',
    description: 'Find Mumbai ward-level civic reporting tools for potholes, garbage, water leakage, streetlights, safety, and representative tracking.',
    priority: '0.95',
    changefreq: 'daily',
    keywords: ['Mumbai civic issues', 'Mumbai ward complaint', 'BMC ward tracker'],
  },
  {
    key: 'public-issues',
    path: '/public-issues',
    title: 'Public civic issue tracker for Mumbai',
    description: 'Browse public CivicsPulse reports, ward timelines, representative mapping, status changes, and upvoted Mumbai civic issues.',
    priority: '0.9',
    changefreq: 'daily',
    keywords: ['public issue tracker Mumbai', 'civic complaint status', 'ward report timeline'],
  },
  {
    key: 'civic-news',
    path: '/civic-news',
    title: 'Mumbai civic awareness news and reporting tips',
    description: 'Read Mumbai civic awareness updates, reporting tips, daily alerts, and ward-level guidance for better public issue reports.',
    priority: '0.85',
    changefreq: 'daily',
    keywords: ['Mumbai civic news', 'civic awareness Mumbai', 'ward alerts'],
  },
  {
    key: 'daily-civic-puzzle',
    path: '/daily-civic-puzzle',
    title: 'Daily civic puzzle for smarter reporting',
    description: 'Play the daily CivicsPulse civic puzzle and learn how to create clearer reports for potholes, water, garbage, trees, lights, and safety.',
    priority: '0.8',
    changefreq: 'daily',
    keywords: ['daily civic puzzle', 'civic awareness game', 'reporting tips Mumbai'],
  },
  {
    key: 'corporator-list',
    path: '/corporator-list-mumbai',
    title: 'Mumbai corporator list by ward',
    description: 'Find Mumbai corporator mapping by state, city, ward, and zone. Admins can upload updated representative data in CivicsPulse.',
    priority: '0.9',
    changefreq: 'weekly',
    keywords: ['Mumbai corporator list', 'corporator by ward Mumbai', 'BMC ward corporator'],
  },
  {
    key: 'mla-list',
    path: '/mla-list-mumbai',
    title: 'Mumbai MLA list by zone and constituency',
    description: 'Find Mumbai MLA mapping by zone, constituency, city, and ward context for tagged civic reports in CivicsPulse.',
    priority: '0.9',
    changefreq: 'weekly',
    keywords: ['Mumbai MLA list', 'MLA by constituency Mumbai', 'ward zone MLA mapping'],
  },
  {
    key: 'raise',
    path: '/raise',
    title: 'Raise a civic issue in Mumbai',
    description: 'Submit a Mumbai civic report with title, category, ward, GPS location, photo evidence, voice assist, and public status tracking.',
    priority: '0.9',
    changefreq: 'daily',
    keywords: ['raise civic issue Mumbai', 'submit civic complaint', 'report ward issue'],
  },
  {
    key: 'headlines',
    path: '/headlines',
    title: 'Mumbai civic headlines and trending reports',
    description: 'Scan latest, trending, escalated, and resolved Mumbai civic reports from one public CivicsPulse headlines board.',
    priority: '0.85',
    changefreq: 'daily',
    keywords: ['Mumbai civic headlines', 'trending civic reports', 'escalated ward issues'],
  },
];

export const STATIC_SEO_ROUTES = [
  '/mumbai',
  '/public-issues',
  '/civic-news',
  '/daily-civic-puzzle',
  '/corporator-list-mumbai',
  '/mla-list-mumbai',
  ...CATEGORY_SEO_PAGES.map((page) => page.path),
  ...WARD_SEO_PAGES.map((ward) => `/mumbai/wards/${ward.slug}`),
];

export const SEO_PAGES = [
  ...CORE_SEO_PAGES,
  ...CATEGORY_SEO_PAGES.map((page) => ({
    ...page,
    priority: '0.9',
    changefreq: 'weekly',
  })),
  ...WARD_SEO_PAGES.map((ward) => ({
    key: `ward-${ward.slug}`,
    path: `/mumbai/wards/${ward.slug}`,
    title: `${ward.name} civic issue tracker`,
    description: ward.description,
    priority: '0.85',
    changefreq: 'weekly',
    keywords: [`${ward.name} civic issues`, `${ward.name} ward complaint`, `${ward.name} CivicsPulse`],
  })),
];

export function cleanPath(path = '/') {
  if (!path || path === '/') return '/';
  const value = path.startsWith('/') ? path : `/${path}`;
  return value.length > 1 ? value.replace(/\/+$/, '') : value;
}

export function absoluteUrl(path = '/') {
  const normalized = cleanPath(path);
  return `${SITE_URL}${normalized === '/' ? '/' : normalized}`;
}

export function getLocalizedPath(path = '/', language = 'en') {
  const normalized = cleanPath(path);
  if (language === 'en') return normalized;
  return `/${language}${normalized === '/' ? '' : normalized}`;
}

export function getLocalizedUrl(path = '/', language = 'en') {
  return absoluteUrl(getLocalizedPath(path, language));
}

export function getAlternates(path = '/') {
  return [
    ...SEO_LANGUAGES.map((language) => ({
      hreflang: language.locale,
      href: getLocalizedUrl(path, language.code),
    })),
    { hreflang: 'x-default', href: getLocalizedUrl(path, 'en') },
  ];
}

export function getSeoPageByPath(path = '/') {
  const normalized = cleanPath(path);
  return SEO_PAGES.find((page) => cleanPath(page.path) === normalized) || null;
}

export function getWardBySlug(slug) {
  return WARD_SEO_PAGES.find((ward) => ward.slug === slug) || null;
}

export function getCategoryByPath(path) {
  const normalized = cleanPath(path);
  return CATEGORY_SEO_PAGES.find((page) => cleanPath(page.path) === normalized) || null;
}

export function getLocalizedSeoCopy(language = 'en') {
  return getCopy(language);
}
