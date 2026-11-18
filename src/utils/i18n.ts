import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Language } from '../types';

export const enTranslations = {
  nav: {
    dashboard: 'Dashboard',
    announcements: 'Announcements',
    citizens: 'Citizens',
    government: 'Government',
    admin: 'Admin',
    reportIssue: 'Report Issue',
    signIn: 'Sign In',
    signOut: 'Sign Out',
    myDashboard: 'My Dashboard',
    smartCity: 'SMART CITY',
    municipalPortal: 'Municipal Issue Portal',
    citizenDashboard: 'Citizen Dashboard',
    complaintTracking: 'Complaint Tracking',
    interactiveMap: 'Interactive Map',
    communityFeed: 'Community Feed',
    executiveOverview: 'Executive Overview',
    grievanceManagement: 'Grievance Management',
    gisHeatmap: 'GIS Spatial Heatmap',
    dispatchCenter: 'Dispatch Center',
    citizenMessaging: 'Citizen Messaging',
    auditReports: 'Audit & Reports',
  },
  landing: {
    heroTitle: 'Empowering Citizens, Building Responsive Cities',
    heroSubtitle: 'Report municipal issues, track resolution in real-time, and collaborate with city officials for a cleaner, safer city.',
    reportIssueCta: 'Report Municipal Issue',
    trackReportCta: 'Track Status',
    exploreMapCta: 'Explore GIS Map',
    viewAnnouncements: 'View Official Notices',
    liveStats: 'Live City Resolution Metrics',
    totalComplaints: 'Total Complaints',
    resolved: 'Resolved Issues',
    inProgress: 'In Progress',
    avgResolutionTime: 'Avg Resolution Time',
    satisfactionRate: 'Citizen Satisfaction',
    hours: 'Hours',
    topCategories: 'Report Common Municipal Issues',
    recentResolved: 'Live Resolved Complaints',
    howItWorks: 'How Civic Issue Resolution Works',
    step1Title: '1. Spot & Capture',
    step1Desc: 'Take a photo of the road damage, garbage dump, or streetlight issue.',
    step2Title: '2. Smart AI Processing',
    step2Desc: 'CivicPulse Local AI automatically classifies the issue type and detects location.',
    step3Title: '3. Municipal Assignment',
    step3Desc: 'The ticket is routed directly to the designated field officer.',
    step4Title: '4. Track & Verify',
    step4Desc: 'Receive live updates with before/after photos and rate the resolution.',
  },
  dashboard: {
    stats: {
      total: 'Total Complaints',
      pending: 'Pending Triage',
      inProgress: 'In Progress',
      resolved: 'Resolved Issues',
    },
    complaints: {
      priority: 'Priority Level',
      status: 'Status',
    },
    announcements: {
      title: 'Official Announcements & Advisories',
    },
  },
  categories: {
    'Potholes & Road Damage': 'Potholes & Road Damage',
    'Garbage & Solid Waste': 'Garbage & Solid Waste',
    'Water Leakage & Supply': 'Water Leakage & Supply',
    'Streetlighting & Electrical': 'Streetlighting & Electrical',
    'Drainage & Sewage Overflow': 'Drainage & Sewage Overflow',
    'Illegal Dumping & Encroachment': 'Illegal Dumping & Encroachment',
    'Fallen Tree & Horticulture': 'Fallen Tree & Horticulture',
    'Parks & Public Amenities': 'Parks & Public Amenities',
    'Public Health & Sanitation': 'Public Health & Sanitation',
    'Traffic & Signage Issues': 'Traffic & Signage Issues',
  },
  status: {
    Pending: 'Pending',
    Submitted: 'Submitted',
    Verified: 'Verified',
    Assigned: 'Assigned',
    'Work Started': 'Work Started',
    'In Inspection': 'In Inspection',
    Resolved: 'Resolved',
    Closed: 'Closed',
    Rejected: 'Rejected',
  },
  priority: {
    Low: 'Low',
    Medium: 'Medium',
    High: 'High',
    Critical: 'Critical',
  },
  citizen: {
    welcome: 'Welcome',
    myReports: 'My Complaints',
    newReport: 'Report New Issue',
    mapView: 'Interactive City Map',
    communityUpvotes: 'Community Reports',
    titlePlaceholder: 'Brief title describing the issue...',
    descPlaceholder: 'Provide detailed information including landmarks...',
    categoryLabel: 'Issue Category',
    locationLabel: 'Location & Ward',
    uploadImage: 'Upload Image',
    submitReport: 'Submit Complaint',
    anonymous: 'Report Anonymously',
    upvote: 'Upvote',
    upvoted: 'Upvoted',
    searchPlaceholder: 'Search complaints by title, category, ticket # or location...',
    noComplaints: 'No complaints found.',
    voiceInput: 'Voice Report',
    listening: 'Listening...',
  },
  government: {
    dashboardTitle: 'Municipal Official Workspace',
    activeTickets: 'Active Tickets',
    assignedOfficer: 'Assigned Officer',
    department: 'Department',
    updateStatus: 'Update Status',
    addComment: 'Add Comment',
    aiTriage: 'AI Automated Triage',
    slaBreachWarning: 'SLA Breach Risk',
    allDepartments: 'All Departments',
  },
  announcements: {
    portalTitle: 'Municipal Notice Board & Alerts',
    searchNotices: 'Search advisories, notices, or emergencies...',
    createNotice: 'Publish New Notice',
    emergencyAlert: 'Emergency Broadcast',
    englishTitle: 'Title (English)',
    hindiTitle: 'Title (Hindi)',
    englishContent: 'Content (English)',
    hindiContent: 'Content (Hindi)',
    publishedOn: 'Published on',
    readMore: 'Read Details',
  },
  superadmin: {
    portalTitle: 'Super Admin Command Center',
    userManagement: 'User & Staff Management',
    systemHealth: 'System Health',
    auditLogs: 'Audit Logs',
    languageManagement: 'Language Settings (i18n)',
    languageDesc: 'Supported System Languages',
    englishLanguage: 'English (Default)',
    hindiLanguage: 'Hindi (हिन्दी)',
    activeUsers: 'Active Users',
  },
  auth: {
    citizenPortal: 'Citizen Portal',
    governmentOfficial: 'Government Official',
    signInTitle: 'Sign In to CivicPulse',
    emailAddress: 'Email Address',
    password: 'Password',
    signInButton: 'Sign In to Portal',
    registerButton: 'Create New Citizen Account',
    quickDemo: 'Quick Demo Sign-In:',
  },
  validation: {
    required: 'This field is required.',
    invalidEmail: 'Please enter a valid email address.',
    minPassword: 'Password must be at least 6 characters.',
  },
  footer: {
    rights: 'All rights reserved. Smart City Municipal Infrastructure.',
    helpline: '24/7 Municipal Helpline:',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
  },
};

export const hiTranslations = {
  nav: {
    dashboard: 'डैशबोर्ड',
    announcements: 'सूचनाएं',
    citizens: 'नागरिक पोर्टल',
    government: 'सरकारी पोर्टल',
    admin: 'सुपर एडमिन',
    reportIssue: 'समस्या दर्ज करें',
    signIn: 'साइन इन',
    signOut: 'साइन आउट',
    myDashboard: 'मेरा डैशबोर्ड',
    smartCity: 'स्मार्ट सिटी',
    municipalPortal: 'नगर निगम समस्या पोर्टल',
    citizenDashboard: 'नागरिक डैशबोर्ड',
    complaintTracking: 'शिकायत ट्रैकिंग',
    interactiveMap: 'इंटरएक्टिव नक्शा',
    communityFeed: 'समुदाय फ़ीड',
    executiveOverview: 'कार्यकारी अवलोकन',
    grievanceManagement: 'शिकायत निवारण प्रबंधन',
    gisHeatmap: 'जीआईएस मैपिंग',
    dispatchCenter: 'आवंटन केंद्र',
    citizenMessaging: 'नागरिक संवाद',
    auditReports: 'ऑडिट एवं रिपोर्ट',
  },
  landing: {
    heroTitle: 'नागरिकों को सशक्त बनाना, त्वरित उत्तरदायी शहर बनाना',
    heroSubtitle: 'नगर निगम की समस्याओं की रिपोर्ट करें, वास्तविक समय में समाधान ट्रैक करें, और स्वच्छ व सुरक्षित शहर के लिए अधिकारियों के साथ सहयोग करें।',
    reportIssueCta: 'नगर निगम समस्या दर्ज करें',
    trackReportCta: 'स्थिति ट्रैक करें',
    exploreMapCta: 'जीआईएस मानचित्र देखें',
    viewAnnouncements: 'सरकारी सूचनाएं देखें',
    liveStats: 'शहर की ताज़ा समाधान स्थितियाँ',
    totalComplaints: 'कुल शिकायतें',
    resolved: 'हल की गई समस्याएं',
    inProgress: 'प्रगति पर है',
    avgResolutionTime: 'औसत समाधान समय',
    satisfactionRate: 'नागरिक संतुष्टि दर',
    hours: 'घंटे',
    topCategories: 'सामान्य समस्याओं की रिपोर्ट करें',
    recentResolved: 'हाल ही में हल की गई शिकायतें',
    howItWorks: 'यह कैसे काम करता है',
    step1Title: '1. फोटो खींचें',
    step1Desc: 'सड़क क्षति, कचरे या स्ट्रीटलाइट की तस्वीर लें।',
    step2Title: '2. एआई प्रोसेसिंग',
    step2Desc: 'एआई स्वचालित रूप से श्रेणी और स्थान पहचानता है।',
    step3Title: '3. विभाग आवंटन',
    step3Desc: 'शिकायत सीधे संबंधित सरकारी अधिकारी को भेजी जाती है।',
    step4Title: '4. लाइव ट्रैकिंग एवं सत्यापन',
    step4Desc: 'फोटो के साथ लाइव अपडेट पाएं और काम को रेट करें।',
  },
  dashboard: {
    stats: {
      total: 'कुल शिकायतें',
      pending: 'लंबित शिकायतें',
      inProgress: 'प्रगति पर है',
      resolved: 'हल की गई समस्याएं',
    },
    complaints: {
      priority: 'प्राथमिकता',
      status: 'स्थिति',
    },
    announcements: {
      title: 'आधिकारिक सूचनाएं व परामर्श',
    },
  },
  categories: {
    'Potholes & Road Damage': 'गड्ढे और सड़क क्षति',
    'Garbage & Solid Waste': 'कचरा और ठोस अपशिष्ट',
    'Water Leakage & Supply': 'पानी का रिसाव और आपूर्ति',
    'Streetlighting & Electrical': 'स्ट्रीट लाइट और विद्युत',
    'Drainage & Sewage Overflow': 'जल निकासी और सीवर ओवरफ्लो',
    'Illegal Dumping & Encroachment': 'अवैध डंपिंग और अतिक्रमण',
    'Fallen Tree & Horticulture': 'गिरा हुआ पेड़ और उद्यानिकी',
    'Parks & Public Amenities': 'पार्क और सार्वजनिक सुविधाएं',
    'Public Health & Sanitation': 'जनस्वास्थ्य और स्वच्छता',
    'Traffic & Signage Issues': 'यातायात और संकेतक समस्याएं',
  },
  status: {
    Pending: 'लंबित',
    Submitted: 'दर्ज की गई',
    Verified: 'सत्यापित',
    Assigned: 'आवंटित',
    'Work Started': 'कार्य शुरू हुआ',
    'In Inspection': 'निरीक्षण में',
    Resolved: 'हल किया गया',
    Closed: 'बंद किया गया',
    Rejected: 'अस्वीकृत',
  },
  priority: {
    Low: 'कम',
    Medium: 'मध्यम',
    High: 'उच्च',
    Critical: 'गंभीर',
  },
  citizen: {
    welcome: 'स्वागत है',
    myReports: 'मेरी शिकायतें',
    newReport: 'नई समस्या दर्ज करें',
    mapView: 'शहर का नक्शा',
    communityUpvotes: 'समुदाय की शिकायतें',
    titlePlaceholder: 'समस्या का संक्षिप्त विवरण लिखें...',
    descPlaceholder: 'लैंडमार्क सहित विस्तृत जानकारी प्रदान करें...',
    categoryLabel: 'समस्या श्रेणी',
    locationLabel: 'स्थान एवं वार्ड',
    uploadImage: 'तस्वीर अपलोड करें',
    submitReport: 'शिकायत सबमिट करें',
    anonymous: 'गुमनाम रूप से रिपोर्ट करें',
    upvote: 'समर्थन दें',
    upvoted: 'समर्थन दिया',
    searchPlaceholder: 'शीर्षक, श्रेणी, टिकट # या स्थान से शिकायतें खोजें...',
    noComplaints: 'कोई शिकायत नहीं मिली।',
    voiceInput: 'बोलकर शिकायत दर्ज करें',
    listening: 'सुन रहा है...',
  },
  government: {
    dashboardTitle: 'नगर निगम अधिकारी कार्यस्थल',
    activeTickets: 'सक्रिय टिकट',
    assignedOfficer: 'आवंटित अधिकारी',
    department: 'विभाग',
    updateStatus: 'स्थिति बदलें',
    addComment: 'टिप्पणी जोड़ें',
    aiTriage: 'एआई स्वचालित जांच',
    slaBreachWarning: 'एसएलए उल्लंघन जोखिम',
    allDepartments: 'सभी विभाग',
  },
  announcements: {
    portalTitle: 'नगर निगम सूचना पट एवं अलर्ट',
    searchNotices: 'सूचनाएं या आपातकालीन अलर्ट खोजें...',
    createNotice: 'नई सूचना प्रकाशित करें',
    emergencyAlert: 'आपातकालीन अलर्ट',
    englishTitle: 'शीर्षक (अंग्रेजी)',
    hindiTitle: 'शीर्षक (हिंदी)',
    englishContent: 'विवरण (अंग्रेजी)',
    hindiContent: 'विवरण (हिंदी)',
    publishedOn: 'प्रकाशन तिथि',
    readMore: 'पूरा विवरण पढ़ें',
  },
  superadmin: {
    portalTitle: 'सुपर एडमिन कमांड सेंटर',
    userManagement: 'उपयोगकर्ता प्रबंधन',
    systemHealth: 'सिस्टम स्वास्थ्य',
    auditLogs: 'ऑडिट लॉग',
    languageManagement: 'भाषा सेटिंग्स (i18n)',
    languageDesc: 'समर्थित सिस्टम भाषाएं',
    englishLanguage: 'अंग्रेजी (डिफ़ॉल्ट)',
    hindiLanguage: 'हिंदी (हिन्दी)',
    activeUsers: 'सक्रिय उपयोगकर्ता',
  },
  auth: {
    citizenPortal: 'नागरिक पोर्टल',
    governmentOfficial: 'सरकारी अधिकारी',
    signInTitle: 'सिविकपल्स में साइन इन करें',
    emailAddress: 'ईमेल पता',
    password: 'पासवर्ड',
    signInButton: 'पोर्टल पर साइन इन करें',
    registerButton: 'नया नागरिक खाता बनाएं',
    quickDemo: 'त्वरित डेमो साइन-इन:',
  },
  validation: {
    required: 'यह फ़ील्ड आवश्यक है।',
    invalidEmail: 'कृपया एक वैध ईमेल पता दर्ज करें।',
    minPassword: 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।',
  },
  footer: {
    rights: 'सर्वाधिकार सुरक्षित। स्मार्ट सिटी म्यूनिसिपल इंफ्रास्ट्रक्चर।',
    helpline: '24/7 नगर निगम हेल्पलाइन:',
    privacyPolicy: 'गोपनीयता नीति',
    termsOfService: 'सेवा की शर्तें',
  },
};

const initialLang = (localStorage.getItem('civicpulse_language') as Language) || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      hi: { translation: hiTranslations },
    },
    lng: initialLang === 'hi' ? 'hi' : 'en',
    fallbackLng: 'en',
    returnEmptyString: false,
    parseMissingKeyHandler: (key: string) => {
      const lastPart = key.split('.').pop() || key;
      return lastPart
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
    },
    missingKeyHandler: (lngs, ns, key) => {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[i18n] Missing translation key: "${key}" in language(s) "${lngs}"`);
      }
    },
    interpolation: {
      escapeValue: false,
    },
  });

export function changeLanguage(lang: Language): void {
  const targetLang: Language = lang === 'hi' ? 'hi' : 'en';
  i18n.changeLanguage(targetLang);
  localStorage.setItem('civicpulse_language', targetLang);
}

export function getCurrentLanguage(): Language {
  return (i18n.language as Language) === 'hi' ? 'hi' : 'en';
}

export function formatDate(dateInput: string | Date | undefined, lang?: Language): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return String(dateInput);

  const currentLang = lang || getCurrentLanguage();
  const locale = currentLang === 'hi' ? 'hi-IN' : 'en-US';

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatNumber(num: number | undefined | null, lang?: Language): string {
  if (num === undefined || num === null) return '0';
  const currentLang = lang || getCurrentLanguage();
  const locale = currentLang === 'hi' ? 'hi-IN' : 'en-US';
  return new Intl.NumberFormat(locale).format(num);
}

export function translateCategory(cat: string | undefined, lang?: Language): string {
  if (!cat) return '';
  const currentLang = lang || getCurrentLanguage();
  if (currentLang === 'hi' && hiTranslations.categories[cat as keyof typeof hiTranslations.categories]) {
    return hiTranslations.categories[cat as keyof typeof hiTranslations.categories];
  }
  return cat;
}

export function translateStatus(status: string | undefined, lang?: Language): string {
  if (!status) return '';
  const currentLang = lang || getCurrentLanguage();
  if (currentLang === 'hi' && hiTranslations.status[status as keyof typeof hiTranslations.status]) {
    return hiTranslations.status[status as keyof typeof hiTranslations.status];
  }
  return status;
}

export function translatePriority(priority: string | undefined, lang?: Language): string {
  if (!priority) return '';
  const currentLang = lang || getCurrentLanguage();
  if (currentLang === 'hi' && hiTranslations.priority[priority as keyof typeof hiTranslations.priority]) {
    return hiTranslations.priority[priority as keyof typeof hiTranslations.priority];
  }
  return priority;
}

export function getLocalizedText(enText: string | undefined, hiText: string | undefined, lang?: Language): string {
  const currentLang = lang || getCurrentLanguage();
  if (currentLang === 'hi' && hiText && hiText.trim().length > 0) {
    return hiText;
  }
  return enText || '';
}

export default i18n;
