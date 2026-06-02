import { LANGUAGES, useLanguageStore } from '../store/languageStore';

const en = {
  feed: 'Feed',
  raiseIssue: 'Raise issue',
  profile: 'Profile',
  admin: 'Admin',
  signIn: 'Sign in',
  signOut: 'Sign out',
  register: 'Register',
  language: 'Language',
  citizenPortal: 'Citizen portal',
  heroTitle: 'Raise civic issues and keep your ward moving',
  heroCopy: 'Report potholes, leaks, garbage, safety hazards, and streetlight problems from one public dashboard.',
  dailyPuzzle: 'Daily puzzle',
  statsTotal: 'Total issues',
  statsResolved: 'Resolved',
  statsRate: 'Resolution rate',
  statsReps: 'Active reps',
  citizenStreak: 'Citizen streak',
  habitTitle: 'Make civic action a habit',
  habitCopy: 'Try the daily puzzle, upvote useful reports, and raise clear issues when you spot them.',
  liveFeed: 'Live civic feed',
  browseReports: 'Browse recent reports',
  searchPlaceholder: 'Search by issue, ward, or location',
  allCategories: 'All categories',
  newest: 'Newest',
  trending: 'Trending',
  mostUpvoted: 'Most upvoted',
  escalated: 'Escalated',
  open: 'Open',
  assigned: 'Assigned',
  inProgress: 'In progress',
  escalatedMla: 'Escalated to MLA',
  escalatedMp: 'Escalated to MP',
  closed: 'Closed',
  view: 'View',
  upvotes: 'upvotes',
  noDescription: 'No description added yet.',
  emptyTitle: 'No issues match this view',
  emptyCopy: 'Raise the first report for your area or clear the filters.',
  authEyebrow: 'Citizen access',
  authTitle: 'Create an account to raise and track issues',
  authCopy: 'Your reports are connected to a real backend and can be followed from the feed after submission.',
  fullName: 'Full name',
  email: 'Email',
  password: 'Password',
  createAccount: 'Create account',
  accountCreated: 'Account created',
  signedIn: 'Signed in',
  authFailed: 'Authentication failed',
  continueWithGoogle: 'Continue with Google',
  googleNeedsSetup: 'Google sign-in needs setup',
  googleSigningIn: 'Signing in with Google…',
  googleUnavailable: 'Google sign-in is unavailable right now',
  googleSignInFailed: 'Google sign-in failed',
  forgotPassword: 'Forgot password',
  forgotPasswordQuestion: 'Forgot password?',
  forgotPasswordCopy: 'Enter your account email and CivicsPulse will send a secure reset link.',
  sendResetLink: 'Send reset link',
  resetLinkSent: 'Reset request received',
  resetRequestFailed: 'Reset request failed',
  resetRequestReceived: 'Reset request received',
  resetEmailConfigured: 'Check your email for the reset link.',
  resetEmailNotConfigured: 'Email delivery is not configured yet. Use the demo reset link below.',
  resetIfAccountExists: 'If that account exists, a reset link will be available after email delivery is configured.',
  openResetLink: 'Open reset link',
  backToSignIn: 'Back to sign in',
  or: 'or',
  passwordReset: 'Password reset',
  chooseNewPassword: 'Choose a new password',
  resetPasswordCopy: 'Use the secure link from your email to set a new password.',
  resetTokenMissing: 'Reset token is missing. Please request a new reset link.',
  confirmPassword: 'Confirm password',
  resetPasswordButton: 'Reset password',
  passwordMismatch: 'Passwords do not match',
  passwordResetDone: 'Password reset complete',
  passwordResetFailed: 'Password reset failed',
  newReport: 'New civic report',
  raiseWeb: 'Raise an issue from the web',
  signInBeforeSubmit: 'Sign in or create an account before submitting.',
  voiceAssist: 'Voice assist',
  speakOrType: 'Speak or type your report',
  listeningNow: 'Listening now',
  processingAudio: 'Processing audio',
  voiceCopy: 'Voice can fill the form, and it falls back to typing if transcription is unavailable.',
  stop: 'Stop',
  voice: 'Voice',
  category: 'Category',
  issueTitle: 'Issue title',
  description: 'Description',
  locationLabel: 'Location label',
  useCurrent: 'Use current',
  wardMapping: 'Ward mapping',
  photosVideo: 'Photos / video',
  submitAnon: 'Submit anonymously in public feed',
  submitIssue: 'Submit issue',
  readySubmit: 'Ready to submit',
  readyCopy: 'Your report will be stored in Supabase and appear in the public feed.',
  back: 'Back',
  backToFeed: 'Back to feed',
  mappedReps: 'Mapped representatives',
  corporator: 'Corporator',
  mla: 'MLA',
  mp: 'MP',
  timeline: 'Timeline',
  notMapped: 'Not mapped yet',
  adminCanImport: 'Admin can import or update representative data.',
  citizenProfile: 'Citizen profile',
  profileTitle: 'Profile and home ward',
  accountDetails: 'Account details',
  name: 'Name',
  phone: 'Phone',
  homeWard: 'Home ward',
  saveProfile: 'Save profile',
  profileSaved: 'Profile saved',
  adminAccess: 'Admin access',
  adminTitle: 'Upload corporator and MLA mapping',
  adminCopy: 'Store data as state → city → ward, assign corporators per ward, and attach MLAs to zones for feed mapping.',
  manualImport: 'Manual import',
  downloadSample: 'Download sample CSV',
  loadSample: 'Load sample rows',
  importData: 'Import and map data',
  currentMapping: 'Current mapping',
  recentImports: 'Recent imports',
  pothole: 'Pothole',
  garbage: 'Garbage',
  water: 'Water',
  streetlight: 'Streetlight',
  safety: 'Safety',
  tree: 'Tree',
  other: 'Other',
};

const dictionaries = {
  en,
  hi: {
    feed: 'फ़ीड', raiseIssue: 'समस्या उठाएं', profile: 'प्रोफ़ाइल', admin: 'एडमिन', signIn: 'साइन इन', signOut: 'साइन आउट', register: 'रजिस्टर', language: 'भाषा',
    citizenPortal: 'नागरिक पोर्टल', heroTitle: 'नागरिक समस्याएं उठाएं और अपने वार्ड को आगे बढ़ाएं', heroCopy: 'गड्ढे, लीकेज, कचरा, सुरक्षा खतरे और स्ट्रीटलाइट समस्याएं एक सार्वजनिक डैशबोर्ड से रिपोर्ट करें.', dailyPuzzle: 'दैनिक पहेली',
    statsTotal: 'कुल समस्याएं', statsResolved: 'हल हुईं', statsRate: 'समाधान दर', statsReps: 'सक्रिय प्रतिनिधि', citizenStreak: 'नागरिक स्ट्रीक', habitTitle: 'नागरिक कार्रवाई को आदत बनाएं', habitCopy: 'दैनिक पहेली खेलें, उपयोगी रिपोर्ट को अपवोट करें और स्पष्ट समस्या उठाएं.',
    liveFeed: 'लाइव नागरिक फ़ीड', browseReports: 'हाल की रिपोर्ट देखें', searchPlaceholder: 'समस्या, वार्ड या स्थान खोजें', allCategories: 'सभी श्रेणियां', newest: 'नवीनतम', trending: 'ट्रेंडिंग', mostUpvoted: 'सबसे अधिक अपवोट', escalated: 'एस्केलेटेड',
    open: 'खुला', assigned: 'असाइन', inProgress: 'प्रगति में', escalatedMla: 'MLA को भेजा गया', escalatedMp: 'MP को भेजा गया', closed: 'बंद', view: 'देखें', upvotes: 'अपवोट', noDescription: 'अभी विवरण नहीं जोड़ा गया.', emptyTitle: 'इस दृश्य में कोई समस्या नहीं', emptyCopy: 'अपने क्षेत्र की पहली रिपोर्ट उठाएं या फ़िल्टर हटाएं.',
    authEyebrow: 'नागरिक प्रवेश', authTitle: 'समस्याएं उठाने और ट्रैक करने के लिए खाता बनाएं', authCopy: 'आपकी रिपोर्ट वास्तविक बैकेंड से जुड़ती है और जमा होने के बाद फ़ीड में दिखती है.', fullName: 'पूरा नाम', email: 'ईमेल', password: 'पासवर्ड', createAccount: 'खाता बनाएं', accountCreated: 'खाता बन गया', signedIn: 'साइन इन हो गया', authFailed: 'प्रमाणीकरण विफल',
    newReport: 'नई नागरिक रिपोर्ट', raiseWeb: 'वेब से समस्या उठाएं', signInBeforeSubmit: 'जमा करने से पहले साइन इन या खाता बनाएं.', voiceAssist: 'वॉइस सहायता', speakOrType: 'रिपोर्ट बोलें या टाइप करें', listeningNow: 'सुन रहा है', processingAudio: 'ऑडियो प्रोसेस हो रहा है', voiceCopy: 'वॉइस फॉर्म भर सकती है, और ट्रांसक्रिप्शन न हो तो टाइपिंग पर वापस आती है.', stop: 'रोकें', voice: 'वॉइस',
    category: 'श्रेणी', issueTitle: 'समस्या शीर्षक', description: 'विवरण', locationLabel: 'स्थान लेबल', useCurrent: 'वर्तमान उपयोग करें', wardMapping: 'वार्ड मैपिंग', photosVideo: 'फोटो / वीडियो', submitAnon: 'सार्वजनिक फ़ीड में गुमनाम जमा करें', submitIssue: 'समस्या जमा करें', readySubmit: 'जमा करने के लिए तैयार', readyCopy: 'आपकी रिपोर्ट Supabase में सेव होगी और सार्वजनिक फ़ीड में दिखेगी.',
    back: 'वापस', backToFeed: 'फ़ीड पर वापस', mappedReps: 'मैप किए गए प्रतिनिधि', corporator: 'कॉरपोरेटर', mla: 'MLA', mp: 'MP', timeline: 'टाइमलाइन', notMapped: 'अभी मैप नहीं', adminCanImport: 'एडमिन प्रतिनिधि डेटा आयात या अपडेट कर सकता है.',
    citizenProfile: 'नागरिक प्रोफ़ाइल', profileTitle: 'प्रोफ़ाइल और होम वार्ड', accountDetails: 'खाता विवरण', name: 'नाम', phone: 'फ़ोन', homeWard: 'होम वार्ड', saveProfile: 'प्रोफ़ाइल सेव करें', profileSaved: 'प्रोफ़ाइल सेव हुई',
    adminAccess: 'एडमिन प्रवेश', adminTitle: 'कॉरपोरेटर और MLA मैपिंग अपलोड करें', adminCopy: 'डेटा राज्य → शहर → वार्ड में रखें, कॉरपोरेटर को वार्ड से और MLA को ज़ोन से जोड़ें.', manualImport: 'मैनुअल आयात', downloadSample: 'सैंपल CSV डाउनलोड करें', loadSample: 'सैंपल पंक्तियां लोड करें', importData: 'डेटा आयात और मैप करें', currentMapping: 'वर्तमान मैपिंग', recentImports: 'हाल के आयात',
    pothole: 'गड्ढा', garbage: 'कचरा', water: 'पानी', streetlight: 'स्ट्रीटलाइट', safety: 'सुरक्षा', tree: 'पेड़', other: 'अन्य',
  },
  mr: {
    feed: 'फीड', raiseIssue: 'तक्रार नोंदवा', profile: 'प्रोफाइल', admin: 'अॅडमिन', signIn: 'साइन इन', signOut: 'साइन आउट', register: 'नोंदणी', language: 'भाषा',
    citizenPortal: 'नागरिक पोर्टल', heroTitle: 'नागरिक समस्या नोंदवा आणि तुमचा वार्ड चालू ठेवा', heroCopy: 'खड्डे, गळती, कचरा, सुरक्षा धोके आणि स्ट्रीटलाइट समस्या एका सार्वजनिक डॅशबोर्डवरून नोंदवा.', dailyPuzzle: 'दैनिक कोडे',
    liveFeed: 'लाइव्ह नागरिक फीड', browseReports: 'अलीकडील रिपोर्ट पहा', searchPlaceholder: 'समस्या, वार्ड किंवा ठिकाण शोधा', allCategories: 'सर्व श्रेणी', newest: 'नवीनतम', trending: 'ट्रेंडिंग', escalated: 'एस्कलेटेड', mostUpvoted: 'सर्वाधिक मतं',
    open: 'उघडे', assigned: 'नेमलेले', inProgress: 'प्रगतीत', escalatedMla: 'MLA कडे पाठवले', escalatedMp: 'MP कडे पाठवले', closed: 'बंद', view: 'पहा', upvotes: 'अपवोट', noDescription: 'अजून वर्णन नाही.', emptyTitle: 'या दृश्यात समस्या नाहीत', emptyCopy: 'तुमच्या भागातील पहिली तक्रार नोंदवा किंवा फिल्टर काढा.',
    authEyebrow: 'नागरिक प्रवेश', authTitle: 'तक्रारी नोंदवण्यासाठी आणि ट्रॅक करण्यासाठी खाते तयार करा', fullName: 'पूर्ण नाव', email: 'ईमेल', password: 'पासवर्ड', createAccount: 'खाते तयार करा',
    category: 'श्रेणी', issueTitle: 'समस्या शीर्षक', description: 'वर्णन', locationLabel: 'ठिकाण', wardMapping: 'वार्ड मॅपिंग', submitIssue: 'तक्रार सबमिट करा', saveProfile: 'प्रोफाइल सेव्ह करा',
    back: 'मागे', backToFeed: 'फीडकडे परत', mappedReps: 'मॅप केलेले प्रतिनिधी', corporator: 'कॉरपोरेटर', mla: 'MLA', mp: 'MP', timeline: 'टाइमलाइन', notMapped: 'अजून मॅप नाही', adminCanImport: 'अॅडमिन प्रतिनिधी डेटा आयात किंवा अपडेट करू शकतो.',
    citizenProfile: 'नागरिक प्रोफाइल', profileTitle: 'प्रोफाइल आणि होम वार्ड', accountDetails: 'खाते तपशील', name: 'नाव', phone: 'फोन', homeWard: 'होम वार्ड',
    adminTitle: 'कॉरपोरेटर आणि MLA मॅपिंग अपलोड करा', manualImport: 'मॅन्युअल आयात', downloadSample: 'सॅम्पल CSV डाउनलोड करा', loadSample: 'सॅम्पल पंक्ती लोड करा', importData: 'डेटा आयात आणि मॅप करा',
    pothole: 'खड्डा', garbage: 'कचरा', water: 'पाणी', streetlight: 'स्ट्रीटलाइट', safety: 'सुरक्षा', tree: 'झाड', other: 'इतर',
  },
  gu: {
    feed: 'ફીડ', raiseIssue: 'સમસ્યા નોંધાવો', profile: 'પ્રોફાઇલ', admin: 'એડમિન', signIn: 'સાઇન ઇન', signOut: 'સાઇન આઉટ', register: 'રજિસ્ટર', language: 'ભાષા',
    citizenPortal: 'નાગરિક પોર્ટલ', heroTitle: 'નાગરિક સમસ્યાઓ નોંધાવો અને તમારો વોર્ડ સક્રિય રાખો', heroCopy: 'ખાડા, લીકેજ, કચરો, સુરક્ષા જોખમ અને સ્ટ્રીટલાઇટ સમસ્યાઓ એક જ ડેશબોર્ડથી નોંધાવો.', dailyPuzzle: 'દૈનિક પઝલ',
    liveFeed: 'લાઇવ નાગરિક ફીડ', browseReports: 'તાજેતરના રિપોર્ટ જુઓ', searchPlaceholder: 'સમસ્યા, વોર્ડ અથવા સ્થાન શોધો', allCategories: 'બધી કેટેગરી', newest: 'નવાં', trending: 'ટ્રેન્ડિંગ', escalated: 'એસ્કેલેટેડ', mostUpvoted: 'સૌથી વધુ અપવોટ',
    open: 'ખુલ્લું', assigned: 'સોંપાયેલું', inProgress: 'પ્રગતિમાં', escalatedMla: 'MLA ને મોકલ્યું', escalatedMp: 'MP ને મોકલ્યું', closed: 'બંધ', view: 'જુઓ', upvotes: 'અપવોટ', noDescription: 'હજુ વર્ણન ઉમેરાયું નથી.',
    fullName: 'પૂર્ણ નામ', email: 'ઇમેઇલ', password: 'પાસવર્ડ', createAccount: 'ખાતું બનાવો', category: 'કેટેગરી', issueTitle: 'સમસ્યાનું શીર્ષક', description: 'વર્ણન', locationLabel: 'સ્થાન', wardMapping: 'વોર્ડ મેપિંગ', submitIssue: 'સમસ્યા સબમિટ કરો', saveProfile: 'પ્રોફાઇલ સેવ કરો',
    back: 'પાછા', mappedReps: 'મેપ કરેલા પ્રતિનિધિઓ', corporator: 'કોર્પોરેટર', mla: 'MLA', mp: 'MP', timeline: 'ટાઇમલાઇન', citizenProfile: 'નાગરિક પ્રોફાઇલ', name: 'નામ', phone: 'ફોન', homeWard: 'હોમ વોર્ડ',
    pothole: 'ખાડો', garbage: 'કચરો', water: 'પાણી', streetlight: 'સ્ટ્રીટલાઇટ', safety: 'સુરક્ષા', tree: 'વૃક્ષ', other: 'અન્ય',
  },
  bn: {
    feed: 'ফিড', raiseIssue: 'সমস্যা জানান', profile: 'প্রোফাইল', admin: 'অ্যাডমিন', signIn: 'সাইন ইন', signOut: 'সাইন আউট', register: 'রেজিস্টার', language: 'ভাষা',
    citizenPortal: 'নাগরিক পোর্টাল', heroTitle: 'নাগরিক সমস্যা জানান এবং আপনার ওয়ার্ড সচল রাখুন', heroCopy: 'গর্ত, লিক, আবর্জনা, নিরাপত্তা ঝুঁকি ও স্ট্রিটলাইট সমস্যা এক ড্যাশবোর্ড থেকে রিপোর্ট করুন.', dailyPuzzle: 'দৈনিক ধাঁধা',
    liveFeed: 'লাইভ নাগরিক ফিড', browseReports: 'সাম্প্রতিক রিপোর্ট দেখুন', searchPlaceholder: 'সমস্যা, ওয়ার্ড বা স্থান খুঁজুন', allCategories: 'সব বিভাগ', newest: 'নতুন', trending: 'ট্রেন্ডিং', escalated: 'এস্কেলেটেড', mostUpvoted: 'সবচেয়ে বেশি আপভোট',
    view: 'দেখুন', upvotes: 'আপভোট', noDescription: 'এখনও বিবরণ নেই.', fullName: 'পুরো নাম', email: 'ইমেল', password: 'পাসওয়ার্ড', createAccount: 'অ্যাকাউন্ট তৈরি করুন', category: 'বিভাগ', issueTitle: 'সমস্যার শিরোনাম', description: 'বিবরণ', locationLabel: 'স্থান', wardMapping: 'ওয়ার্ড ম্যাপিং', submitIssue: 'সমস্যা জমা দিন', saveProfile: 'প্রোফাইল সংরক্ষণ করুন',
    back: 'ফিরে যান', mappedReps: 'ম্যাপ করা প্রতিনিধি', corporator: 'কর্পোরেটর', mla: 'MLA', mp: 'MP', timeline: 'টাইমলাইন', citizenProfile: 'নাগরিক প্রোফাইল', name: 'নাম', phone: 'ফোন', homeWard: 'হোম ওয়ার্ড',
    pothole: 'গর্ত', garbage: 'আবর্জনা', water: 'জল', streetlight: 'স্ট্রিটলাইট', safety: 'নিরাপত্তা', tree: 'গাছ', other: 'অন্যান্য',
  },
  ta: {
    feed: 'ஊட்டம்', raiseIssue: 'புகார் எழுப்பு', profile: 'சுயவிவரம்', admin: 'நிர்வாகம்', signIn: 'உள்நுழை', signOut: 'வெளியேறு', register: 'பதிவு', language: 'மொழி',
    citizenPortal: 'குடிமக்கள் தளம்', heroTitle: 'நகராட்சி பிரச்சினைகளை பதிவு செய்து உங்கள் வார்டை முன்னேற்றுங்கள்', heroCopy: 'குழிகள், கசிவுகள், குப்பை, பாதுகாப்பு அபாயங்கள், தெருவிளக்கு பிரச்சினைகளை ஒரே பொது டாஷ்போர்டில் பதிவு செய்யுங்கள்.', dailyPuzzle: 'தினசரி புதிர்',
    liveFeed: 'நேரடி குடிமக்கள் ஊட்டம்', browseReports: 'சமீபத்திய புகார்கள்', searchPlaceholder: 'பிரச்சினை, வார்டு அல்லது இடம் தேடு', allCategories: 'அனைத்து பிரிவுகள்', newest: 'புதியவை', trending: 'டிரெண்டிங்', escalated: 'மேலேற்றப்பட்டது', mostUpvoted: 'அதிக ஆதரவு',
    view: 'பார்', upvotes: 'ஆதரவு', noDescription: 'விளக்கம் இன்னும் இல்லை.', fullName: 'முழு பெயர்', email: 'மின்னஞ்சல்', password: 'கடவுச்சொல்', createAccount: 'கணக்கு உருவாக்கு', category: 'பிரிவு', issueTitle: 'பிரச்சினை தலைப்பு', description: 'விளக்கம்', locationLabel: 'இடம்', wardMapping: 'வார்டு மேப்பிங்', submitIssue: 'புகார் சமர்ப்பி', saveProfile: 'சுயவிவரம் சேமி',
    back: 'பின்', mappedReps: 'மேப் செய்யப்பட்ட பிரதிநிதிகள்', corporator: 'கார்ப்பரேட்டர்', mla: 'MLA', mp: 'MP', timeline: 'காலவரிசை', citizenProfile: 'குடிமக்கள் சுயவிவரம்', name: 'பெயர்', phone: 'தொலைபேசி', homeWard: 'வீட்டு வார்டு',
    pothole: 'குழி', garbage: 'குப்பை', water: 'நீர்', streetlight: 'தெருவிளக்கு', safety: 'பாதுகாப்பு', tree: 'மரம்', other: 'மற்றவை',
  },
  te: {
    feed: 'ఫీడ్', raiseIssue: 'సమస్య నమోదు', profile: 'ప్రొఫైల్', admin: 'అడ్మిన్', signIn: 'సైన్ ఇన్', signOut: 'సైన్ అవుట్', register: 'రిజిస్టర్', language: 'భాష',
    citizenPortal: 'పౌర పోర్టల్', heroTitle: 'పౌర సమస్యలను నమోదు చేసి మీ వార్డును ముందుకు నడిపించండి', heroCopy: 'గుంతలు, లీకులు, చెత్త, భద్రతా ప్రమాదాలు, స్ట్రీట్‌లైట్ సమస్యలను ఒకే డ్యాష్‌బోర్డ్‌లో నమోదు చేయండి.', dailyPuzzle: 'రోజువారీ పజిల్',
    liveFeed: 'లైవ్ పౌర ఫీడ్', browseReports: 'తాజా రిపోర్టులు చూడండి', searchPlaceholder: 'సమస్య, వార్డు లేదా స్థలం వెతకండి', allCategories: 'అన్ని వర్గాలు', newest: 'కొత్తవి', trending: 'ట్రెండింగ్', escalated: 'ఎస్కలేట్', mostUpvoted: 'అత్యధిక మద్దతు',
    view: 'చూడండి', upvotes: 'అప్వోట్లు', fullName: 'పూర్తి పేరు', email: 'ఇమెయిల్', password: 'పాస్వర్డ్', createAccount: 'ఖాతా సృష్టించు', category: 'వర్గం', issueTitle: 'సమస్య శీర్షిక', description: 'వివరణ', locationLabel: 'స్థలం', wardMapping: 'వార్డు మ్యాపింగ్', submitIssue: 'సమస్య సమర్పించు', saveProfile: 'ప్రొఫైల్ సేవ్ చేయి',
    back: 'వెనుకకు', mappedReps: 'మ్యాప్ చేసిన ప్రతినిధులు', corporator: 'కార్పొరేటర్', mla: 'MLA', mp: 'MP', timeline: 'టైమ్‌లైన్', citizenProfile: 'పౌర ప్రొఫైల్', name: 'పేరు', phone: 'ఫోన్', homeWard: 'హోమ్ వార్డు',
    pothole: 'గుంత', garbage: 'చెత్త', water: 'నీరు', streetlight: 'స్ట్రీట్‌లైట్', safety: 'భద్రత', tree: 'చెట్టు', other: 'ఇతర',
  },
  kn: {
    feed: 'ಫೀಡ್', raiseIssue: 'ಸಮಸ್ಯೆ ದಾಖಲಿಸಿ', profile: 'ಪ್ರೊಫೈಲ್', admin: 'ಅಡ್ಮಿನ್', signIn: 'ಸೈನ್ ಇನ್', signOut: 'ಸೈನ್ ಔಟ್', register: 'ನೋಂದಣಿ', language: 'ಭಾಷೆ',
    citizenPortal: 'ನಾಗರಿಕ ಪೋರ್ಟಲ್', heroTitle: 'ನಾಗರಿಕ ಸಮಸ್ಯೆಗಳನ್ನು ದಾಖಲಿಸಿ ನಿಮ್ಮ ವಾರ್ಡನ್ನು ಚುರುಕಾಗಿಡಿ', heroCopy: 'ಗುಂಡಿಗಳು, ಲೀಕ್‌ಗಳು, ಕಸ, ಸುರಕ್ಷತಾ ಅಪಾಯಗಳು ಮತ್ತು ಬೀದಿ ದೀಪ ಸಮಸ್ಯೆಗಳನ್ನು ಒಂದು ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಿಂದ ವರದಿ ಮಾಡಿ.', dailyPuzzle: 'ದೈನಂದಿನ ಪಜಲ್',
    liveFeed: 'ಲೈವ್ ನಾಗರಿಕ ಫೀಡ್', browseReports: 'ಇತ್ತೀಚಿನ ವರದಿಗಳು', searchPlaceholder: 'ಸಮಸ್ಯೆ, ವಾರ್ಡ್ ಅಥವಾ ಸ್ಥಳ ಹುಡುಕಿ', allCategories: 'ಎಲ್ಲಾ ವರ್ಗಗಳು', newest: 'ಹೊಸದು', trending: 'ಟ್ರೆಂಡಿಂಗ್', escalated: 'ಎಸ್ಕಲೇಟ್', mostUpvoted: 'ಹೆಚ್ಚು ಬೆಂಬಲ',
    view: 'ನೋಡಿ', upvotes: 'ಅಪ್‌ವೋಟ್', fullName: 'ಪೂರ್ಣ ಹೆಸರು', email: 'ಇಮೇಲ್', password: 'ಪಾಸ್ವರ್ಡ್', createAccount: 'ಖಾತೆ ರಚಿಸಿ', category: 'ವರ್ಗ', issueTitle: 'ಸಮಸ್ಯೆ ಶೀರ್ಷಿಕೆ', description: 'ವಿವರಣೆ', locationLabel: 'ಸ್ಥಳ', wardMapping: 'ವಾರ್ಡ್ ಮ್ಯಾಪಿಂಗ್', submitIssue: 'ಸಮಸ್ಯೆ ಸಲ್ಲಿಸಿ', saveProfile: 'ಪ್ರೊಫೈಲ್ ಉಳಿಸಿ',
    back: 'ಹಿಂದೆ', mappedReps: 'ಮ್ಯಾಪ್ ಮಾಡಿದ ಪ್ರತಿನಿಧಿಗಳು', corporator: 'ಕಾರ್ಪೊರೇಟರ್', mla: 'MLA', mp: 'MP', timeline: 'ಟೈಮ್‌ಲೈನ್', citizenProfile: 'ನಾಗರಿಕ ಪ್ರೊಫೈಲ್', name: 'ಹೆಸರು', phone: 'ಫೋನ್', homeWard: 'ಹೋಮ್ ವಾರ್ಡ್',
    pothole: 'ಗುಂಡಿ', garbage: 'ಕಸ', water: 'ನೀರು', streetlight: 'ಬೀದಿ ದೀಪ', safety: 'ಸುರಕ್ಷತೆ', tree: 'ಮರ', other: 'ಇತರೆ',
  },
  ml: {
    feed: 'ഫീഡ്', raiseIssue: 'പ്രശ്നം റിപ്പോർട്ട് ചെയ്യുക', profile: 'പ്രൊഫൈൽ', admin: 'അഡ്മിൻ', signIn: 'സൈൻ ഇൻ', signOut: 'സൈൻ ഔട്ട്', register: 'രജിസ്റ്റർ', language: 'ഭാഷ',
    citizenPortal: 'പൗര പോർട്ടൽ', heroTitle: 'പൗരപ്രശ്നങ്ങൾ റിപ്പോർട്ട് ചെയ്ത് നിങ്ങളുടെ വാർഡ് മുന്നോട്ട് നയിക്കുക', heroCopy: 'കുഴികൾ, ചോർച്ച, മാലിന്യം, സുരക്ഷാ അപകടങ്ങൾ, തെരുവ് ലൈറ്റ് പ്രശ്നങ്ങൾ ഒരൊറ്റ ഡാഷ്ബോർഡിൽ നിന്ന് റിപ്പോർട്ട് ചെയ്യുക.', dailyPuzzle: 'ദൈനംദിന പസിൽ',
    liveFeed: 'ലൈവ് പൗര ഫീഡ്', browseReports: 'പുതിയ റിപ്പോർട്ടുകൾ', searchPlaceholder: 'പ്രശ്നം, വാർഡ് അല്ലെങ്കിൽ സ്ഥലം തിരയുക', allCategories: 'എല്ലാ വിഭാഗങ്ങളും', newest: 'പുതിയത്', trending: 'ട്രെൻഡിംഗ്', escalated: 'എസ്കലേറ്റഡ്', mostUpvoted: 'കൂടുതൽ പിന്തുണ',
    view: 'കാണുക', upvotes: 'അപ്‌വോട്ട്', fullName: 'പൂർണ്ണ പേര്', email: 'ഇമെയിൽ', password: 'പാസ്‌വേഡ്', createAccount: 'അക്കൗണ്ട് സൃഷ്ടിക്കുക', category: 'വിഭാഗം', issueTitle: 'പ്രശ്ന തലക്കെട്ട്', description: 'വിവരണം', locationLabel: 'സ്ഥലം', wardMapping: 'വാർഡ് മാപ്പിംഗ്', submitIssue: 'പ്രശ്നം സമർപ്പിക്കുക', saveProfile: 'പ്രൊഫൈൽ സേവ് ചെയ്യുക',
    back: 'പിന്നോട്ട്', mappedReps: 'മാപ്പ് ചെയ്ത പ്രതിനിധികൾ', corporator: 'കോർപ്പറേറ്റർ', mla: 'MLA', mp: 'MP', timeline: 'ടൈംലൈൻ', citizenProfile: 'പൗര പ്രൊഫൈൽ', name: 'പേര്', phone: 'ഫോൺ', homeWard: 'ഹോം വാർഡ്',
    pothole: 'കുഴി', garbage: 'മാലിന്യം', water: 'വെള്ളം', streetlight: 'തെരുവ് ലൈറ്റ്', safety: 'സുരക്ഷ', tree: 'മരം', other: 'മറ്റ്',
  },
  pa: {
    feed: 'ਫੀਡ', raiseIssue: 'ਸਮੱਸਿਆ ਦਰਜ ਕਰੋ', profile: 'ਪ੍ਰੋਫਾਈਲ', admin: 'ਐਡਮਿਨ', signIn: 'ਸਾਈਨ ਇਨ', signOut: 'ਸਾਈਨ ਆਉਟ', register: 'ਰਜਿਸਟਰ', language: 'ਭਾਸ਼ਾ',
    citizenPortal: 'ਨਾਗਰਿਕ ਪੋਰਟਲ', heroTitle: 'ਨਾਗਰਿਕ ਸਮੱਸਿਆਵਾਂ ਦਰਜ ਕਰੋ ਅਤੇ ਆਪਣਾ ਵਾਰਡ ਚਲਦਾ ਰੱਖੋ', heroCopy: 'ਖੱਡੇ, ਲੀਕ, ਕੂੜਾ, ਸੁਰੱਖਿਆ ਖਤਰੇ ਅਤੇ ਸਟ੍ਰੀਟਲਾਈਟ ਸਮੱਸਿਆਵਾਂ ਇੱਕ ਡੈਸ਼ਬੋਰਡ ਤੋਂ ਰਿਪੋਰਟ ਕਰੋ.', dailyPuzzle: 'ਰੋਜ਼ਾਨਾ ਪਜ਼ਲ',
    liveFeed: 'ਲਾਈਵ ਨਾਗਰਿਕ ਫੀਡ', browseReports: 'ਤਾਜ਼ਾ ਰਿਪੋਰਟਾਂ ਵੇਖੋ', searchPlaceholder: 'ਸਮੱਸਿਆ, ਵਾਰਡ ਜਾਂ ਸਥਾਨ ਖੋਜੋ', allCategories: 'ਸਭ ਸ਼੍ਰੇਣੀਆਂ', newest: 'ਨਵਾਂ', trending: 'ਟ੍ਰੈਂਡਿੰਗ', escalated: 'ਐਸਕਲੇਟਡ', mostUpvoted: 'ਸਭ ਤੋਂ ਵੱਧ ਸਮਰਥਨ',
    view: 'ਵੇਖੋ', upvotes: 'ਅਪਵੋਟ', fullName: 'ਪੂਰਾ ਨਾਮ', email: 'ਈਮੇਲ', password: 'ਪਾਸਵਰਡ', createAccount: 'ਖਾਤਾ ਬਣਾਓ', category: 'ਸ਼੍ਰੇਣੀ', issueTitle: 'ਸਮੱਸਿਆ ਸਿਰਲੇਖ', description: 'ਵੇਰਵਾ', locationLabel: 'ਸਥਾਨ', wardMapping: 'ਵਾਰਡ ਮੈਪਿੰਗ', submitIssue: 'ਸਮੱਸਿਆ ਜਮ੍ਹਾਂ ਕਰੋ', saveProfile: 'ਪ੍ਰੋਫਾਈਲ ਸੇਵ ਕਰੋ',
    back: 'ਵਾਪਸ', mappedReps: 'ਮੈਪ ਕੀਤੇ ਪ੍ਰਤੀਨਿਧੀ', corporator: 'ਕੌਰਪੋਰੇਟਰ', mla: 'MLA', mp: 'MP', timeline: 'ਟਾਈਮਲਾਈਨ', citizenProfile: 'ਨਾਗਰਿਕ ਪ੍ਰੋਫਾਈਲ', name: 'ਨਾਮ', phone: 'ਫੋਨ', homeWard: 'ਹੋਮ ਵਾਰਡ',
    pothole: 'ਖੱਡਾ', garbage: 'ਕੂੜਾ', water: 'ਪਾਣੀ', streetlight: 'ਸਟ੍ਰੀਟਲਾਈਟ', safety: 'ਸੁਰੱਖਿਆ', tree: 'ਰੁੱਖ', other: 'ਹੋਰ',
  },
};

Object.assign(dictionaries.gu, {
  authEyebrow: 'નાગરિક પ્રવેશ', authTitle: 'સમસ્યાઓ નોંધાવવા અને ટ્રેક કરવા માટે ખાતું બનાવો', authCopy: 'તમારી રિપોર્ટ્સ વાસ્તવિક બેકેન્ડ સાથે જોડાય છે અને સબમિશન પછી ફીડમાં દેખાય છે.', accountCreated: 'ખાતું બની ગયું', signedIn: 'સાઇન ઇન થયું', authFailed: 'પ્રમાણીકરણ નિષ્ફળ',
  emptyTitle: 'આ દૃશ્યમાં કોઈ સમસ્યા નથી', emptyCopy: 'તમારા વિસ્તારની પહેલી રિપોર્ટ નોંધાવો અથવા ફિલ્ટર સાફ કરો.', backToFeed: 'ફીડ પર પાછા', mappedReps: 'મેપ કરેલા પ્રતિનિધિઓ', notMapped: 'હજુ મેપ નથી', adminCanImport: 'એડમિન પ્રતિનિધિ ડેટા આયાત અથવા અપડેટ કરી શકે છે.', timeline: 'ટાઇમલાઇન',
  citizenProfile: 'નાગરિક પ્રોફાઇલ', profileTitle: 'પ્રોફાઇલ અને હોમ વોર્ડ', accountDetails: 'ખાતા વિગતો', saveProfile: 'પ્રોફાઇલ સેવ કરો', profileSaved: 'પ્રોફાઇલ સેવ થઈ', manualImport: 'મેન્યુઅલ આયાત', downloadSample: 'નમૂનો CSV ડાઉનલોડ કરો', loadSample: 'નમૂના રો લોડ કરો', importData: 'ડેટા આયાત અને મેપ કરો',
});

Object.assign(dictionaries.mr, {
  authCopy: 'तुमचे रिपोर्ट खऱ्या बॅकेंडशी जोडले जातात आणि सबमिट केल्यानंतर फीडमध्ये दिसतात.', accountCreated: 'खाते तयार झाले', signedIn: 'साइन इन झाले', authFailed: 'प्रमाणीकरण अयशस्वी',
  emptyTitle: 'या दृश्यात समस्या नाहीत', emptyCopy: 'तुमच्या भागातील पहिली तक्रार नोंदवा किंवा फिल्टर काढा.', profileSaved: 'प्रोफाइल सेव्ह झाले', importData: 'डेटा आयात आणि मॅप करा',
});

Object.assign(dictionaries.bn, {
  authEyebrow: 'নাগরিক প্রবেশ', authTitle: 'সমস্যা জানাতে ও ট্র্যাক করতে অ্যাকাউন্ট তৈরি করুন', authCopy: 'আপনার রিপোর্ট বাস্তব ব্যাকএন্ডে যুক্ত হবে এবং জমা দেওয়ার পর ফিডে দেখা যাবে.', accountCreated: 'অ্যাকাউন্ট তৈরি হয়েছে', signedIn: 'সাইন ইন হয়েছে', authFailed: 'প্রমাণীকরণ ব্যর্থ',
  emptyTitle: 'এই ভিউতে কোনো সমস্যা নেই', emptyCopy: 'আপনার এলাকার প্রথম রিপোর্ট জানান বা ফিল্টার পরিষ্কার করুন.', backToFeed: 'ফিডে ফিরে যান', mappedReps: 'ম্যাপ করা প্রতিনিধি', notMapped: 'এখনও ম্যাপ নয়', adminCanImport: 'অ্যাডমিন প্রতিনিধি ডেটা আমদানি বা আপডেট করতে পারে.', timeline: 'টাইমলাইন',
  citizenProfile: 'নাগরিক প্রোফাইল', profileTitle: 'প্রোফাইল ও হোম ওয়ার্ড', accountDetails: 'অ্যাকাউন্ট বিবরণ', saveProfile: 'প্রোফাইল সংরক্ষণ করুন', profileSaved: 'প্রোফাইল সংরক্ষিত', manualImport: 'ম্যানুয়াল আমদানি', downloadSample: 'নমুনা CSV ডাউনলোড', loadSample: 'নমুনা সারি লোড', importData: 'ডেটা আমদানি ও ম্যাপ করুন',
});

Object.assign(dictionaries.ta, {
  authEyebrow: 'குடிமக்கள் அணுகல்', authTitle: 'புகார்களை பதிவு செய்து கண்காணிக்க கணக்கு உருவாக்குங்கள்', authCopy: 'உங்கள் புகார்கள் உண்மையான பின்தளத்துடன் இணைக்கப்பட்டு சமர்ப்பித்த பின் ஊட்டத்தில் தெரியும்.', accountCreated: 'கணக்கு உருவாக்கப்பட்டது', signedIn: 'உள்நுழைந்தீர்கள்', authFailed: 'அங்கீகாரம் தோல்வி',
  emptyTitle: 'இந்த பார்வையில் புகார்கள் இல்லை', emptyCopy: 'உங்கள் பகுதியின் முதல் புகாரை பதிவு செய்யுங்கள் அல்லது வடிகட்டிகளை நீக்குங்கள்.', backToFeed: 'ஊட்டத்துக்கு திரும்பு', mappedReps: 'மேப் செய்யப்பட்ட பிரதிநிதிகள்', notMapped: 'இன்னும் மேப் செய்யவில்லை', adminCanImport: 'நிர்வாகி பிரதிநிதி தரவை இறக்குமதி அல்லது புதுப்பிக்கலாம்.', timeline: 'காலவரிசை',
  citizenProfile: 'குடிமக்கள் சுயவிவரம்', profileTitle: 'சுயவிவரம் மற்றும் வீட்டு வார்டு', accountDetails: 'கணக்கு விவரங்கள்', saveProfile: 'சுயவிவரம் சேமி', profileSaved: 'சுயவிவரம் சேமிக்கப்பட்டது', manualImport: 'கையேடு இறக்குமதி', downloadSample: 'மாதிரி CSV பதிவிறக்கு', loadSample: 'மாதிரி வரிகளை ஏற்று', importData: 'தரவை இறக்குமதி செய்து மேப் செய்',
});

Object.assign(dictionaries.te, {
  authEyebrow: 'పౌర ప్రవేశం', authTitle: 'సమస్యలను నమోదు చేసి ట్రాక్ చేయడానికి ఖాతా సృష్టించండి', authCopy: 'మీ రిపోర్టులు నిజమైన బ్యాకెండ్‌కు కనెక్ట్ అవుతాయి మరియు సమర్పించిన తర్వాత ఫీడ్‌లో కనిపిస్తాయి.', accountCreated: 'ఖాతా సృష్టించబడింది', signedIn: 'సైన్ ఇన్ అయింది', authFailed: 'ప్రామాణీకరణ విఫలమైంది',
  emptyTitle: 'ఈ వీక్షణలో సమస్యలు లేవు', emptyCopy: 'మీ ప్రాంతంలో మొదటి రిపోర్ట్ నమోదు చేయండి లేదా ఫిల్టర్లు తొలగించండి.', backToFeed: 'ఫీడ్‌కు తిరిగి', mappedReps: 'మ్యాప్ చేసిన ప్రతినిధులు', notMapped: 'ఇంకా మ్యాప్ కాలేదు', adminCanImport: 'అడ్మిన్ ప్రతినిధి డేటాను దిగుమతి లేదా నవీకరించగలరు.', timeline: 'టైమ్‌లైన్',
  citizenProfile: 'పౌర ప్రొఫైల్', profileTitle: 'ప్రొఫైల్ మరియు హోమ్ వార్డు', accountDetails: 'ఖాతా వివరాలు', saveProfile: 'ప్రొఫైల్ సేవ్ చేయి', profileSaved: 'ప్రొఫైల్ సేవ్ అయింది', manualImport: 'మాన్యువల్ దిగుమతి', downloadSample: 'నమూనా CSV డౌన్‌లోడ్', loadSample: 'నమూనా వరుసలు లోడ్', importData: 'డేటా దిగుమతి చేసి మ్యాప్ చేయి',
});

Object.assign(dictionaries.kn, {
  authEyebrow: 'ನಾಗರಿಕ ಪ್ರವೇಶ', authTitle: 'ಸಮಸ್ಯೆಗಳನ್ನು ದಾಖಲಿಸಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ಖಾತೆ ರಚಿಸಿ', authCopy: 'ನಿಮ್ಮ ವರದಿಗಳು ನಿಜವಾದ ಬ್ಯಾಕೆಂಡ್‌ಗೆ ಸಂಪರ್ಕಿಸಿ ಸಲ್ಲಿಸಿದ ನಂತರ ಫೀಡ್‌ನಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ.', accountCreated: 'ಖಾತೆ ರಚಿಸಲಾಗಿದೆ', signedIn: 'ಸೈನ್ ಇನ್ ಆಯಿತು', authFailed: 'ಪ್ರಮಾಣೀಕರಣ ವಿಫಲ',
  emptyTitle: 'ಈ ವೀಕ್ಷಣೆಯಲ್ಲಿ ಸಮಸ್ಯೆಗಳಿಲ್ಲ', emptyCopy: 'ನಿಮ್ಮ ಪ್ರದೇಶದ ಮೊದಲ ವರದಿ ದಾಖಲಿಸಿ ಅಥವಾ ಫಿಲ್ಟರ್ ತೆರವುಗೊಳಿಸಿ.', backToFeed: 'ಫೀಡ್‌ಗೆ ಹಿಂದಿರುಗಿ', mappedReps: 'ಮ್ಯಾಪ್ ಮಾಡಿದ ಪ್ರತಿನಿಧಿಗಳು', notMapped: 'ಇನ್ನೂ ಮ್ಯಾಪ್ ಆಗಿಲ್ಲ', adminCanImport: 'ಅಡ್ಮಿನ್ ಪ್ರತಿನಿಧಿ ಡೇಟಾವನ್ನು ಆಮದು ಅಥವಾ ನವೀಕರಿಸಬಹುದು.', timeline: 'ಟೈಮ್‌ಲೈನ್',
  citizenProfile: 'ನಾಗರಿಕ ಪ್ರೊಫೈಲ್', profileTitle: 'ಪ್ರೊಫೈಲ್ ಮತ್ತು ಹೋಮ್ ವಾರ್ಡ್', accountDetails: 'ಖಾತೆ ವಿವರಗಳು', saveProfile: 'ಪ್ರೊಫೈಲ್ ಉಳಿಸಿ', profileSaved: 'ಪ್ರೊಫೈಲ್ ಉಳಿಸಲಾಗಿದೆ', manualImport: 'ಕೈಯಾರೆ ಆಮದು', downloadSample: 'ಮಾದರಿ CSV ಡೌನ್‌ಲೋಡ್', loadSample: 'ಮಾದರಿ ಸಾಲುಗಳನ್ನು ಲೋಡ್', importData: 'ಡೇಟಾ ಆಮದು ಮತ್ತು ಮ್ಯಾಪ್ ಮಾಡಿ',
});

Object.assign(dictionaries.ml, {
  authEyebrow: 'പൗര പ്രവേശനം', authTitle: 'പ്രശ്നങ്ങൾ റിപ്പോർട്ട് ചെയ്ത് ട്രാക്ക് ചെയ്യാൻ അക്കൗണ്ട് സൃഷ്ടിക്കുക', authCopy: 'നിങ്ങളുടെ റിപ്പോർട്ടുകൾ യഥാർത്ഥ ബാക്കെൻഡിൽ ചേർന്ന് സമർപ്പിച്ചതിന് ശേഷം ഫീഡിൽ കാണിക്കും.', accountCreated: 'അക്കൗണ്ട് സൃഷ്ടിച്ചു', signedIn: 'സൈൻ ഇൻ ചെയ്തു', authFailed: 'ഓതന്റിക്കേഷൻ പരാജയപ്പെട്ടു',
  emptyTitle: 'ഈ കാഴ്ചയിൽ പ്രശ്നങ്ങളില്ല', emptyCopy: 'നിങ്ങളുടെ പ്രദേശത്തിലെ ആദ്യ റിപ്പോർട്ട് സമർപ്പിക്കുക അല്ലെങ്കിൽ ഫിൽട്ടറുകൾ നീക്കുക.', backToFeed: 'ഫീഡിലേക്ക് തിരികെ', mappedReps: 'മാപ്പ് ചെയ്ത പ്രതിനിധികൾ', notMapped: 'ഇനിയും മാപ്പ് ചെയ്തിട്ടില്ല', adminCanImport: 'അഡ്മിൻ പ്രതിനിധി ഡാറ്റ ഇറക്കുമതി അല്ലെങ്കിൽ പുതുക്കാം.', timeline: 'ടൈംലൈൻ',
  citizenProfile: 'പൗര പ്രൊഫൈൽ', profileTitle: 'പ്രൊഫൈൽയും ഹോം വാർഡും', accountDetails: 'അക്കൗണ്ട് വിവരങ്ങൾ', saveProfile: 'പ്രൊഫൈൽ സേവ് ചെയ്യുക', profileSaved: 'പ്രൊഫൈൽ സേവ് ചെയ്തു', manualImport: 'മാനുവൽ ഇറക്കുമതി', downloadSample: 'സാമ്പിൾ CSV ഡൗൺലോഡ്', loadSample: 'സാമ്പിൾ വരികൾ ലോഡ്', importData: 'ഡാറ്റ ഇറക്കുമതി ചെയ്ത് മാപ്പ് ചെയ്യുക',
});

Object.assign(dictionaries.pa, {
  authEyebrow: 'ਨਾਗਰਿਕ ਪਹੁੰਚ', authTitle: 'ਸਮੱਸਿਆਵਾਂ ਦਰਜ ਅਤੇ ਟ੍ਰੈਕ ਕਰਨ ਲਈ ਖਾਤਾ ਬਣਾਓ', authCopy: 'ਤੁਹਾਡੀਆਂ ਰਿਪੋਰਟਾਂ ਅਸਲ ਬੈਕਐਂਡ ਨਾਲ ਜੁੜਦੀਆਂ ਹਨ ਅਤੇ ਜਮ੍ਹਾਂ ਹੋਣ ਤੋਂ ਬਾਅਦ ਫੀਡ ਵਿੱਚ ਦਿਖਦੀਆਂ ਹਨ.', accountCreated: 'ਖਾਤਾ ਬਣ ਗਿਆ', signedIn: 'ਸਾਈਨ ਇਨ ਹੋ ਗਿਆ', authFailed: 'ਪ੍ਰਮਾਣੀਕਰਨ ਅਸਫਲ',
  emptyTitle: 'ਇਸ ਦ੍ਰਿਸ਼ ਵਿੱਚ ਕੋਈ ਸਮੱਸਿਆ ਨਹੀਂ', emptyCopy: 'ਆਪਣੇ ਖੇਤਰ ਦੀ ਪਹਿਲੀ ਰਿਪੋਰਟ ਦਰਜ ਕਰੋ ਜਾਂ ਫਿਲਟਰ ਸਾਫ ਕਰੋ.', backToFeed: 'ਫੀਡ ਵੱਲ ਵਾਪਸ', mappedReps: 'ਮੈਪ ਕੀਤੇ ਪ੍ਰਤੀਨਿਧੀ', notMapped: 'ਹਾਲੇ ਮੈਪ ਨਹੀਂ', adminCanImport: 'ਐਡਮਿਨ ਪ੍ਰਤੀਨਿਧੀ ਡੇਟਾ ਆਯਾਤ ਜਾਂ ਅਪਡੇਟ ਕਰ ਸਕਦਾ ਹੈ.', timeline: 'ਟਾਈਮਲਾਈਨ',
  citizenProfile: 'ਨਾਗਰਿਕ ਪ੍ਰੋਫਾਈਲ', profileTitle: 'ਪ੍ਰੋਫਾਈਲ ਅਤੇ ਹੋਮ ਵਾਰਡ', accountDetails: 'ਖਾਤਾ ਵੇਰਵੇ', saveProfile: 'ਪ੍ਰੋਫਾਈਲ ਸੇਵ ਕਰੋ', profileSaved: 'ਪ੍ਰੋਫਾਈਲ ਸੇਵ ਹੋਈ', manualImport: 'ਮੈਨੁਅਲ ਆਯਾਤ', downloadSample: 'ਨਮੂਨਾ CSV ਡਾਊਨਲੋਡ', loadSample: 'ਨਮੂਨਾ ਕਤਾਰਾਂ ਲੋਡ', importData: 'ਡੇਟਾ ਆਯਾਤ ਅਤੇ ਮੈਪ ਕਰੋ',
});

Object.assign(dictionaries.hi, {
  continueWithGoogle: 'Google से जारी रखें', googleNeedsSetup: 'Google साइन-इन सेटअप चाहिए', googleSigningIn: 'Google से साइन इन हो रहा है…', googleUnavailable: 'Google साइन-इन अभी उपलब्ध नहीं', googleSignInFailed: 'Google साइन-इन विफल',
  forgotPassword: 'पासवर्ड भूल गए', forgotPasswordQuestion: 'पासवर्ड भूल गए?', forgotPasswordCopy: 'अपना ईमेल डालें, CivicsPulse सुरक्षित रीसेट लिंक भेजेगा.', sendResetLink: 'रीसेट लिंक भेजें', resetLinkSent: 'रीसेट अनुरोध मिला', resetRequestFailed: 'रीसेट अनुरोध विफल', resetRequestReceived: 'रीसेट अनुरोध मिला',
  resetEmailConfigured: 'रीसेट लिंक के लिए अपना ईमेल देखें.', resetEmailNotConfigured: 'ईमेल डिलीवरी अभी सेट नहीं है. नीचे demo reset link उपयोग करें.', resetIfAccountExists: 'अगर यह खाता मौजूद है, ईमेल डिलीवरी सेट होने के बाद रीसेट लिंक काम करेगा.', openResetLink: 'रीसेट लिंक खोलें', backToSignIn: 'साइन इन पर वापस', or: 'या',
  passwordReset: 'पासवर्ड रीसेट', chooseNewPassword: 'नया पासवर्ड चुनें', resetPasswordCopy: 'नया पासवर्ड सेट करने के लिए ईमेल वाला सुरक्षित लिंक उपयोग करें.', resetTokenMissing: 'रीसेट टोकन गायब है. नया लिंक मांगें.', confirmPassword: 'पासवर्ड पुष्टि करें', resetPasswordButton: 'पासवर्ड रीसेट करें', passwordMismatch: 'पासवर्ड मेल नहीं खाते', passwordResetDone: 'पासवर्ड रीसेट पूरा', passwordResetFailed: 'पासवर्ड रीसेट विफल',
});

Object.assign(dictionaries.mr, {
  continueWithGoogle: 'Google ने पुढे जा', googleNeedsSetup: 'Google साइन-इन सेटअप हवा', googleSigningIn: 'Google ने साइन इन होत आहे…', googleUnavailable: 'Google साइन-इन सध्या उपलब्ध नाही', googleSignInFailed: 'Google साइन-इन अयशस्वी',
  forgotPassword: 'पासवर्ड विसरलात', forgotPasswordQuestion: 'पासवर्ड विसरलात?', forgotPasswordCopy: 'तुमचा ईमेल टाका, CivicsPulse सुरक्षित reset link पाठवेल.', sendResetLink: 'रीसेट लिंक पाठवा', resetLinkSent: 'रीसेट विनंती मिळाली', resetRequestFailed: 'रीसेट विनंती अयशस्वी', resetRequestReceived: 'रीसेट विनंती मिळाली',
  resetEmailConfigured: 'रीसेट लिंकसाठी ईमेल तपासा.', resetEmailNotConfigured: 'ईमेल डिलिव्हरी अजून सेट नाही. खालील demo reset link वापरा.', resetIfAccountExists: 'हे खाते असल्यास, ईमेल डिलिव्हरी सेट झाल्यावर रीसेट लिंक काम करेल.', openResetLink: 'रीसेट लिंक उघडा', backToSignIn: 'साइन इनकडे परत', or: 'किंवा',
  passwordReset: 'पासवर्ड रीसेट', chooseNewPassword: 'नवा पासवर्ड निवडा', resetPasswordCopy: 'नवा पासवर्ड सेट करण्यासाठी ईमेलमधील सुरक्षित लिंक वापरा.', resetTokenMissing: 'रीसेट टोकन नाही. नवीन लिंक मागवा.', confirmPassword: 'पासवर्ड पुष्टी', resetPasswordButton: 'पासवर्ड रीसेट करा', passwordMismatch: 'पासवर्ड जुळत नाहीत', passwordResetDone: 'पासवर्ड रीसेट झाला', passwordResetFailed: 'पासवर्ड रीसेट अयशस्वी',
});

Object.assign(dictionaries.gu, {
  continueWithGoogle: 'Google સાથે આગળ વધો', forgotPassword: 'પાસવર્ડ ભૂલ્યા', forgotPasswordQuestion: 'પાસવર્ડ ભૂલ્યા?', sendResetLink: 'રીસેટ લિંક મોકલો', resetLinkSent: 'રીસેટ વિનંતી મળી', openResetLink: 'રીસેટ લિંક ખોલો', backToSignIn: 'સાઇન ઇન પર પાછા', or: 'અથવા', passwordReset: 'પાસવર્ડ રીસેટ', chooseNewPassword: 'નવો પાસવર્ડ પસંદ કરો', confirmPassword: 'પાસવર્ડ પુષ્ટિ', resetPasswordButton: 'પાસવર્ડ રીસેટ કરો', passwordMismatch: 'પાસવર્ડ મેળ ખાતા નથી', passwordResetDone: 'પાસવર્ડ રીસેટ પૂર્ણ',
});

Object.assign(dictionaries.bn, {
  continueWithGoogle: 'Google দিয়ে চালিয়ে যান', forgotPassword: 'পাসওয়ার্ড ভুলে গেছেন', forgotPasswordQuestion: 'পাসওয়ার্ড ভুলে গেছেন?', sendResetLink: 'রিসেট লিঙ্ক পাঠান', resetLinkSent: 'রিসেট অনুরোধ নেওয়া হয়েছে', openResetLink: 'রিসেট লিঙ্ক খুলুন', backToSignIn: 'সাইন ইনে ফিরুন', or: 'অথবা', passwordReset: 'পাসওয়ার্ড রিসেট', chooseNewPassword: 'নতুন পাসওয়ার্ড দিন', confirmPassword: 'পাসওয়ার্ড নিশ্চিত করুন', resetPasswordButton: 'পাসওয়ার্ড রিসেট করুন', passwordMismatch: 'পাসওয়ার্ড মিলছে না', passwordResetDone: 'পাসওয়ার্ড রিসেট সম্পন্ন',
});

Object.assign(dictionaries.ta, {
  continueWithGoogle: 'Google மூலம் தொடர்க', forgotPassword: 'கடவுச்சொல் மறந்துவிட்டதா', forgotPasswordQuestion: 'கடவுச்சொல் மறந்துவிட்டதா?', sendResetLink: 'ரீசெட் இணைப்பு அனுப்பு', resetLinkSent: 'ரீசெட் கோரிக்கை பெறப்பட்டது', openResetLink: 'ரீசெட் இணைப்பு திற', backToSignIn: 'உள்நுழைவிற்கு திரும்பு', or: 'அல்லது', passwordReset: 'கடவுச்சொல் ரீசெட்', chooseNewPassword: 'புதிய கடவுச்சொல் தேர்வு', confirmPassword: 'கடவுச்சொல் உறுதி', resetPasswordButton: 'கடவுச்சொல் ரீசெட் செய்', passwordMismatch: 'கடவுச்சொற்கள் பொருந்தவில்லை', passwordResetDone: 'கடவுச்சொல் ரீசெட் முடிந்தது',
});

export function translate(language, key, values = {}) {
  const value = dictionaries[language]?.[key] || en[key] || key;
  return Object.entries(values).reduce((text, [name, replacement]) => (
    text.replace(new RegExp(`{${name}}`, 'g'), String(replacement))
  ), value);
}

export function useT() {
  const language = useLanguageStore((state) => state.language);
  return {
    language,
    languages: LANGUAGES,
    t: (key, values) => translate(language, key, values),
  };
}

export function categoryLabel(language, category) {
  const key = String(category || 'OTHER').toLowerCase();
  return translate(language, key);
}

export function statusLabel(language, status) {
  const map = {
    OPEN: 'open',
    ASSIGNED: 'assigned',
    IN_PROGRESS: 'inProgress',
    ESCALATED_TO_MLA: 'escalatedMla',
    ESCALATED_TO_MP: 'escalatedMp',
    RESOLVED: 'statsResolved',
    CLOSED: 'closed',
  };
  return translate(language, map[status] || 'open');
}
