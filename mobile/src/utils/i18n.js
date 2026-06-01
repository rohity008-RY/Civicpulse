import { LANGUAGES, useLanguageStore } from '../store/languageStore';

const en = {
  home: 'Home',
  escalated: 'Escalated',
  create: 'Create',
  trending: 'Trending',
  profile: 'Profile',
  language: 'Language',
  continueEmail: 'Continue with Email',
  continueWithGoogle: 'Continue with Google',
  quickDemo: 'Quick Demo — Explore App',
  createAccount: 'Create Account',
  signIn: 'Sign In',
  signOut: 'Sign out',
  back: 'Back',
  fullName: 'Full name',
  email: 'Email address',
  password: 'Password',
  pleaseWait: 'Please wait…',
  alreadyHaveAccount: 'Already have an account? Sign in',
  newHere: 'New here? Create account',
  googleNeedsSetup: 'Google sign-in needs setup',
  googleNeedsSetupCopy: 'Add Google OAuth client IDs before using Google sign-in.',
  googleUnavailable: 'Google sign-in is unavailable right now',
  googleTokenMissing: 'Google did not return a secure sign-in token.',
  googleSignInFailed: 'Google sign-in failed',
  forgotPassword: 'Forgot password',
  forgotPasswordQuestion: 'Forgot password?',
  forgotPasswordCopy: 'Enter your email and CivicPulse will send a secure reset link.',
  sendResetLink: 'Send reset link',
  resetLinkSent: 'Reset request received',
  resetEmailConfigured: 'Check your email for the reset link.',
  resetEmailNotConfigured: 'Email delivery is not configured yet. Use the demo reset link.',
  resetIfAccountExists: 'If that account exists, a reset link will work after email delivery is configured.',
  openResetLink: 'Open reset link',
  resetRequestFailed: 'Reset request failed',
  emailRequired: 'Email is required',
  cancel: 'Cancel',
  welcomeTagline: 'Raise issues. Track resolutions.\nHold your representative accountable.',
  issuesRaised: 'Issues Raised',
  resolved: 'Resolved',
  wardReps: 'Ward Reps',
  yourWardFeed: 'Your Ward Feed',
  searchWard: 'Search issues in your ward…',
  all: 'All',
  noWardIssues: 'No issues found for your home ward yet.',
  noIssues: 'No issues found. Set your home ward in Profile or raise the first issue!',
  issueDetail: 'Issue Detail',
  refresh: 'Refresh',
  loadingIssue: 'Loading issue…',
  issueNotFound: 'Issue not found',
  noDescription: 'No description added.',
  mappedReps: 'Mapped representatives',
  timeline: 'Timeline',
  noTimeline: 'No timeline activity yet.',
  corporator: 'Corporator',
  active: 'Active',
  share: 'Share',
  raiseIssue: 'Raise an Issue',
  reviewIssue: 'Review Issue',
  voice: 'Voice',
  category: 'Category *',
  issueTitle: 'Issue Title *',
  description: 'Description',
  location: 'Location *',
  wardMapping: 'Ward Mapping',
  photosVideo: 'Photos / Video',
  submitAnonymous: 'Submit anonymously',
  submitIssue: 'Submit Issue',
  submitting: 'Submitting…',
  saveProfile: 'Save profile',
  homeWard: 'Home ward',
  name: 'Name',
  phone: 'Phone',
  changePhoto: 'Change photo',
  remove: 'Remove',
  loadingWards: 'Loading wards…',
  noWards: 'No wards found. Admin can import more state-city-ward data from web admin.',
  error: 'Error',
  saved: 'Saved',
  profileUpdated: 'Profile updated successfully.',
  profileUpdateFailed: 'Profile update failed',
  pothole: 'Pothole',
  garbage: 'Garbage',
  water: 'Water',
  streetlight: 'Streetlight',
  safety: 'Safety',
  tree: 'Tree',
  other: 'Other',
  open: 'Open',
  assigned: 'Assigned',
  inProgress: 'In Progress',
  escalatedMla: 'Escalated to MLA',
  escalatedMp: 'Escalated to MP',
};

const dictionaries = {
  en,
  hi: {
    home: 'होम', escalated: 'एस्केलेटेड', create: 'बनाएं', trending: 'ट्रेंडिंग', profile: 'प्रोफ़ाइल', language: 'भाषा', continueEmail: 'ईमेल से जारी रखें', quickDemo: 'क्विक डेमो — ऐप देखें', createAccount: 'खाता बनाएं', signIn: 'साइन इन', signOut: 'साइन आउट', fullName: 'पूरा नाम', email: 'ईमेल पता', password: 'पासवर्ड', pleaseWait: 'कृपया प्रतीक्षा करें…',
    welcomeTagline: 'समस्याएं उठाएं. समाधान ट्रैक करें.\nअपने प्रतिनिधि को जवाबदेह रखें.', issuesRaised: 'समस्याएं उठीं', resolved: 'हल हुईं', wardReps: 'वार्ड प्रतिनिधि', yourWardFeed: 'आपका वार्ड फ़ीड', searchWard: 'अपने वार्ड में समस्याएं खोजें…', all: 'सभी', noWardIssues: 'आपके होम वार्ड में अभी कोई समस्या नहीं.', noIssues: 'कोई समस्या नहीं. प्रोफ़ाइल में होम वार्ड सेट करें या पहली समस्या उठाएं!',
    issueDetail: 'समस्या विवरण', refresh: 'रीफ़्रेश', loadingIssue: 'समस्या लोड हो रही है…', issueNotFound: 'समस्या नहीं मिली', noDescription: 'विवरण नहीं जोड़ा गया.', mappedReps: 'मैप किए गए प्रतिनिधि', timeline: 'टाइमलाइन', noTimeline: 'अभी कोई गतिविधि नहीं.', corporator: 'कॉरपोरेटर', active: 'सक्रिय', share: 'शेयर',
    raiseIssue: 'समस्या उठाएं', reviewIssue: 'समस्या की समीक्षा', voice: 'वॉइस', category: 'श्रेणी *', issueTitle: 'समस्या शीर्षक *', description: 'विवरण', location: 'स्थान *', wardMapping: 'वार्ड मैपिंग', photosVideo: 'फोटो / वीडियो', submitAnonymous: 'गुमनाम जमा करें', submitIssue: 'समस्या जमा करें', submitting: 'जमा हो रहा है…',
    saveProfile: 'प्रोफ़ाइल सेव करें', homeWard: 'होम वार्ड', name: 'नाम', phone: 'फ़ोन', changePhoto: 'फोटो बदलें', remove: 'हटाएं', loadingWards: 'वार्ड लोड हो रहे हैं…', noWards: 'कोई वार्ड नहीं मिला. एडमिन वेब से अधिक डेटा आयात कर सकता है.', error: 'त्रुटि', saved: 'सेव हुआ', profileUpdated: 'प्रोफ़ाइल अपडेट हुई.', profileUpdateFailed: 'प्रोफ़ाइल अपडेट विफल',
    pothole: 'गड्ढा', garbage: 'कचरा', water: 'पानी', streetlight: 'स्ट्रीटलाइट', safety: 'सुरक्षा', tree: 'पेड़', other: 'अन्य', open: 'खुला', assigned: 'असाइन', inProgress: 'प्रगति में', escalatedMla: 'MLA को भेजा', escalatedMp: 'MP को भेजा',
  },
  mr: {
    home: 'होम', escalated: 'एस्कलेटेड', create: 'तक्रार', trending: 'ट्रेंडिंग', profile: 'प्रोफाइल', language: 'भाषा', continueEmail: 'ईमेलने पुढे जा', quickDemo: 'क्विक डेमो — अॅप पाहा', createAccount: 'खाते तयार करा', signIn: 'साइन इन', signOut: 'साइन आउट', fullName: 'पूर्ण नाव', email: 'ईमेल', password: 'पासवर्ड', pleaseWait: 'कृपया थांबा…',
    yourWardFeed: 'तुमचा वार्ड फीड', searchWard: 'तुमच्या वार्डातील समस्या शोधा…', all: 'सर्व', issueDetail: 'समस्या तपशील', refresh: 'रीफ्रेश', mappedReps: 'मॅप केलेले प्रतिनिधी', timeline: 'टाइमलाइन', corporator: 'कॉरपोरेटर', share: 'शेअर', raiseIssue: 'तक्रार नोंदवा', reviewIssue: 'तक्रार तपासा', voice: 'वॉइस', category: 'श्रेणी *', issueTitle: 'समस्या शीर्षक *', description: 'वर्णन', location: 'ठिकाण *', wardMapping: 'वार्ड मॅपिंग', submitIssue: 'तक्रार सबमिट करा', saveProfile: 'प्रोफाइल सेव्ह करा', homeWard: 'होम वार्ड', name: 'नाव', phone: 'फोन',
    pothole: 'खड्डा', garbage: 'कचरा', water: 'पाणी', streetlight: 'स्ट्रीटलाइट', safety: 'सुरक्षा', tree: 'झाड', other: 'इतर',
  },
  gu: { home: 'હોમ', escalated: 'એસ્કેલેટેડ', create: 'નોંધાવો', trending: 'ટ્રેન્ડિંગ', profile: 'પ્રોફાઇલ', language: 'ભાષા', signIn: 'સાઇન ઇન', signOut: 'સાઇન આઉટ', createAccount: 'ખાતું બનાવો', continueEmail: 'ઇમેઇલથી આગળ વધો', yourWardFeed: 'તમારો વોર્ડ ફીડ', raiseIssue: 'સમસ્યા નોંધાવો', issueDetail: 'સમસ્યા વિગત', category: 'કેટેગરી *', issueTitle: 'સમસ્યા શીર્ષક *', description: 'વર્ણન', location: 'સ્થાન *', wardMapping: 'વોર્ડ મેપિંગ', submitIssue: 'સબમિટ કરો', saveProfile: 'પ્રોફાઇલ સેવ કરો', homeWard: 'હોમ વોર્ડ', name: 'નામ', phone: 'ફોન', share: 'શેર', pothole: 'ખાડો', garbage: 'કચરો', water: 'પાણી', streetlight: 'સ્ટ્રીટલાઇટ', safety: 'સુરક્ષા', tree: 'વૃક્ષ', other: 'અન્ય' },
  bn: { home: 'হোম', escalated: 'এস্কেলেটেড', create: 'জানান', trending: 'ট্রেন্ডিং', profile: 'প্রোফাইল', language: 'ভাষা', signIn: 'সাইন ইন', signOut: 'সাইন আউট', createAccount: 'অ্যাকাউন্ট তৈরি করুন', continueEmail: 'ইমেল দিয়ে চালিয়ে যান', yourWardFeed: 'আপনার ওয়ার্ড ফিড', raiseIssue: 'সমস্যা জানান', issueDetail: 'সমস্যার বিবরণ', category: 'বিভাগ *', issueTitle: 'সমস্যার শিরোনাম *', description: 'বিবরণ', location: 'স্থান *', wardMapping: 'ওয়ার্ড ম্যাপিং', submitIssue: 'জমা দিন', saveProfile: 'প্রোফাইল সেভ করুন', homeWard: 'হোম ওয়ার্ড', name: 'নাম', phone: 'ফোন', share: 'শেয়ার', pothole: 'গর্ত', garbage: 'আবর্জনা', water: 'জল', streetlight: 'স্ট্রিটলাইট', safety: 'নিরাপত্তা', tree: 'গাছ', other: 'অন্যান্য' },
  ta: { home: 'முகப்பு', escalated: 'மேலேற்றம்', create: 'உருவாக்கு', trending: 'டிரெண்டிங்', profile: 'சுயவிவரம்', language: 'மொழி', signIn: 'உள்நுழை', signOut: 'வெளியேறு', createAccount: 'கணக்கு உருவாக்கு', continueEmail: 'மின்னஞ்சலுடன் தொடர்க', yourWardFeed: 'உங்கள் வார்டு ஊட்டம்', raiseIssue: 'புகார் எழுப்பு', issueDetail: 'புகார் விவரம்', category: 'பிரிவு *', issueTitle: 'தலைப்பு *', description: 'விளக்கம்', location: 'இடம் *', wardMapping: 'வார்டு மேப்பிங்', submitIssue: 'சமர்ப்பி', saveProfile: 'சேமி', homeWard: 'வீட்டு வார்டு', name: 'பெயர்', phone: 'தொலைபேசி', share: 'பகிர்', pothole: 'குழி', garbage: 'குப்பை', water: 'நீர்', streetlight: 'தெருவிளக்கு', safety: 'பாதுகாப்பு', tree: 'மரம்', other: 'மற்றவை' },
  te: { home: 'హోమ్', escalated: 'ఎస్కలేట్', create: 'నమోదు', trending: 'ట్రెండింగ్', profile: 'ప్రొఫైల్', language: 'భాష', signIn: 'సైన్ ఇన్', signOut: 'సైన్ అవుట్', createAccount: 'ఖాతా సృష్టించు', continueEmail: 'ఇమెయిల్‌తో కొనసాగు', yourWardFeed: 'మీ వార్డు ఫీడ్', raiseIssue: 'సమస్య నమోదు', issueDetail: 'సమస్య వివరాలు', category: 'వర్గం *', issueTitle: 'శీర్షిక *', description: 'వివరణ', location: 'స్థలం *', wardMapping: 'వార్డు మ్యాపింగ్', submitIssue: 'సమర్పించు', saveProfile: 'సేవ్ చేయి', homeWard: 'హోమ్ వార్డు', name: 'పేరు', phone: 'ఫోన్', share: 'షేర్', pothole: 'గుంత', garbage: 'చెత్త', water: 'నీరు', streetlight: 'స్ట్రీట్‌లైట్', safety: 'భద్రత', tree: 'చెట్టు', other: 'ఇతర' },
  kn: { home: 'ಹೋಮ್', escalated: 'ಎಸ್ಕಲೇಟ್', create: 'ದಾಖಲಿ', trending: 'ಟ್ರೆಂಡಿಂಗ್', profile: 'ಪ್ರೊಫೈಲ್', language: 'ಭಾಷೆ', signIn: 'ಸೈನ್ ಇನ್', signOut: 'ಸೈನ್ ಔಟ್', createAccount: 'ಖಾತೆ ರಚಿಸಿ', continueEmail: 'ಇಮೇಲ್ ಮೂಲಕ ಮುಂದುವರಿಸಿ', yourWardFeed: 'ನಿಮ್ಮ ವಾರ್ಡ್ ಫೀಡ್', raiseIssue: 'ಸಮಸ್ಯೆ ದಾಖಲಿಸಿ', issueDetail: 'ಸಮಸ್ಯೆ ವಿವರ', category: 'ವರ್ಗ *', issueTitle: 'ಶೀರ್ಷಿಕೆ *', description: 'ವಿವರಣೆ', location: 'ಸ್ಥಳ *', wardMapping: 'ವಾರ್ಡ್ ಮ್ಯಾಪಿಂಗ್', submitIssue: 'ಸಲ್ಲಿಸಿ', saveProfile: 'ಉಳಿಸಿ', homeWard: 'ಹೋಮ್ ವಾರ್ಡ್', name: 'ಹೆಸರು', phone: 'ಫೋನ್', share: 'ಹಂಚಿ', pothole: 'ಗುಂಡಿ', garbage: 'ಕಸ', water: 'ನೀರು', streetlight: 'ಬೀದಿ ದೀಪ', safety: 'ಸುರಕ್ಷತೆ', tree: 'ಮರ', other: 'ಇತರೆ' },
  ml: { home: 'ഹോം', escalated: 'എസ്കലേറ്റഡ്', create: 'റിപ്പോർട്ട്', trending: 'ട്രെൻഡിംഗ്', profile: 'പ്രൊഫൈൽ', language: 'ഭാഷ', signIn: 'സൈൻ ഇൻ', signOut: 'സൈൻ ഔട്ട്', createAccount: 'അക്കൗണ്ട് സൃഷ്ടിക്കുക', continueEmail: 'ഇമെയിലിൽ തുടരുക', yourWardFeed: 'നിങ്ങളുടെ വാർഡ് ഫീഡ്', raiseIssue: 'പ്രശ്നം റിപ്പോർട്ട് ചെയ്യുക', issueDetail: 'പ്രശ്ന വിശദാംശം', category: 'വിഭാഗം *', issueTitle: 'തലക്കെട്ട് *', description: 'വിവരണം', location: 'സ്ഥലം *', wardMapping: 'വാർഡ് മാപ്പിംഗ്', submitIssue: 'സമർപ്പിക്കുക', saveProfile: 'സേവ് ചെയ്യുക', homeWard: 'ഹോം വാർഡ്', name: 'പേര്', phone: 'ഫോൺ', share: 'ഷെയർ', pothole: 'കുഴി', garbage: 'മാലിന്യം', water: 'വെള്ളം', streetlight: 'തെരുവ് ലൈറ്റ്', safety: 'സുരക്ഷ', tree: 'മരം', other: 'മറ്റ്' },
  pa: { home: 'ਹੋਮ', escalated: 'ਐਸਕਲੇਟਡ', create: 'ਦਰਜ ਕਰੋ', trending: 'ਟ੍ਰੈਂਡਿੰਗ', profile: 'ਪ੍ਰੋਫਾਈਲ', language: 'ਭਾਸ਼ਾ', signIn: 'ਸਾਈਨ ਇਨ', signOut: 'ਸਾਈਨ ਆਉਟ', createAccount: 'ਖਾਤਾ ਬਣਾਓ', continueEmail: 'ਈਮੇਲ ਨਾਲ ਜਾਰੀ ਰੱਖੋ', yourWardFeed: 'ਤੁਹਾਡਾ ਵਾਰਡ ਫੀਡ', raiseIssue: 'ਸਮੱਸਿਆ ਦਰਜ ਕਰੋ', issueDetail: 'ਸਮੱਸਿਆ ਵੇਰਵਾ', category: 'ਸ਼੍ਰੇਣੀ *', issueTitle: 'ਸਿਰਲੇਖ *', description: 'ਵੇਰਵਾ', location: 'ਸਥਾਨ *', wardMapping: 'ਵਾਰਡ ਮੈਪਿੰਗ', submitIssue: 'ਜਮ੍ਹਾਂ ਕਰੋ', saveProfile: 'ਸੇਵ ਕਰੋ', homeWard: 'ਹੋਮ ਵਾਰਡ', name: 'ਨਾਮ', phone: 'ਫੋਨ', share: 'ਸ਼ੇਅਰ', pothole: 'ਖੱਡਾ', garbage: 'ਕੂੜਾ', water: 'ਪਾਣੀ', streetlight: 'ਸਟ੍ਰੀਟਲਾਈਟ', safety: 'ਸੁਰੱਖਿਆ', tree: 'ਰੁੱਖ', other: 'ਹੋਰ' },
};

Object.assign(dictionaries.hi, {
  continueWithGoogle: 'Google से जारी रखें', back: 'वापस', alreadyHaveAccount: 'पहले से खाता है? साइन इन', newHere: 'नए हैं? खाता बनाएं',
  googleNeedsSetup: 'Google साइन-इन सेटअप चाहिए', googleNeedsSetupCopy: 'Google साइन-इन के लिए OAuth client IDs जोड़ें.', googleUnavailable: 'Google साइन-इन अभी उपलब्ध नहीं', googleTokenMissing: 'Google ने सुरक्षित टोकन नहीं भेजा.', googleSignInFailed: 'Google साइन-इन विफल',
  forgotPassword: 'पासवर्ड भूल गए', forgotPasswordQuestion: 'पासवर्ड भूल गए?', forgotPasswordCopy: 'ईमेल डालें, CivicPulse सुरक्षित रीसेट लिंक भेजेगा.', sendResetLink: 'रीसेट लिंक भेजें', resetLinkSent: 'रीसेट अनुरोध मिला', resetEmailConfigured: 'रीसेट लिंक के लिए ईमेल देखें.', resetEmailNotConfigured: 'ईमेल डिलीवरी सेट नहीं है. demo reset link उपयोग करें.', resetIfAccountExists: 'अगर यह खाता मौजूद है, ईमेल डिलीवरी सेट होने के बाद रीसेट लिंक काम करेगा.', openResetLink: 'रीसेट लिंक खोलें', resetRequestFailed: 'रीसेट अनुरोध विफल', emailRequired: 'ईमेल जरूरी है', cancel: 'रद्द करें',
});

Object.assign(dictionaries.mr, {
  continueWithGoogle: 'Google ने पुढे जा', back: 'मागे', alreadyHaveAccount: 'खाते आहे? साइन इन', newHere: 'नवीन आहात? खाते तयार करा',
  googleNeedsSetup: 'Google साइन-इन सेटअप हवा', googleNeedsSetupCopy: 'Google साइन-इनसाठी OAuth client IDs जोडा.', googleUnavailable: 'Google साइन-इन उपलब्ध नाही', googleTokenMissing: 'Google ने सुरक्षित टोकन दिले नाही.', googleSignInFailed: 'Google साइन-इन अयशस्वी',
  forgotPassword: 'पासवर्ड विसरलात', forgotPasswordQuestion: 'पासवर्ड विसरलात?', forgotPasswordCopy: 'ईमेल टाका, CivicPulse सुरक्षित reset link पाठवेल.', sendResetLink: 'रीसेट लिंक पाठवा', resetLinkSent: 'रीसेट विनंती मिळाली', resetEmailConfigured: 'रीसेट लिंकसाठी ईमेल तपासा.', resetEmailNotConfigured: 'ईमेल डिलिव्हरी सेट नाही. demo reset link वापरा.', resetIfAccountExists: 'हे खाते असल्यास, ईमेल डिलिव्हरी सेट झाल्यावर रीसेट लिंक काम करेल.', openResetLink: 'रीसेट लिंक उघडा', resetRequestFailed: 'रीसेट विनंती अयशस्वी', emailRequired: 'ईमेल आवश्यक आहे', cancel: 'रद्द',
});

export function t(language, key) {
  return dictionaries[language]?.[key] || en[key] || key;
}

export function useT() {
  const language = useLanguageStore((state) => state.language);
  return { language, languages: LANGUAGES, t: (key) => t(language, key) };
}

export function categoryLabel(language, category) {
  return t(language, String(category || 'OTHER').toLowerCase());
}

export function statusLabel(language, status) {
  const map = {
    OPEN: 'open',
    ASSIGNED: 'assigned',
    IN_PROGRESS: 'inProgress',
    ESCALATED_TO_MLA: 'escalatedMla',
    ESCALATED_TO_MP: 'escalatedMp',
    RESOLVED: 'resolved',
  };
  return t(language, map[status] || 'open');
}
