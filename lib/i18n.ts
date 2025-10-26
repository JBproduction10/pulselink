'use client';

export type Language = 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ar' | 'hi';

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // App Name
    appName: 'PulseLink',
    tagline: 'Emergency Connection Without Internet',

    // Setup
    yourName: 'Your Name',
    enterName: 'Enter your name',
    connectNetwork: 'Connect to Network',
    meshInfo: 'Your device will connect to nearby peers using mesh networking',

    // Tabs
    emergency: 'Emergency',
    messages: 'Messages',
    resources: 'Resources',
    contacts: 'Contacts',
    map: 'Map',
    network: 'Network',

    // Status
    safe: 'Safe',
    help: 'Help',
    emergencyStatus: 'Emergency',
    offline: 'Offline',
    peers: 'Peers',

    // Emergency Actions
    emergencyActions: 'Emergency Actions',
    sendAlerts: 'Send emergency alerts to nearby peers',
    sendSOS: 'SEND SOS ALERT',
    needHelp: 'Need Help',
    imSafe: "I'm Safe",

    // Messages
    sendMessage: 'Send Message',
    typeMessage: 'Type a message...',
    send: 'Send',
    noMessages: 'No messages yet',
    addPhoto: 'Add Photo',
    voiceMessage: 'Voice Message',
    recording: 'Recording...',
    stopRecording: 'Stop Recording',
    playVoice: 'Play Voice Message',
    playing: 'Playing...',

    // Resources
    shareResource: 'Share Emergency Resource',
    resourceInfo: 'Let others know what resources you have available to share',
    resourceType: 'Resource Type',
    water: 'Water',
    food: 'Food',
    medical: 'Medical',
    shelter: 'Shelter',
    other: 'Other',
    quantity: 'Quantity/Amount',
    description: 'Description',
    selectType: 'Select a resource type to begin',
    availableResources: 'Available Resources',
    resourcesInArea: 'Resources shared by people in your area',
    noResources: 'No resources shared yet',

    // Contacts
    addLovedOne: 'Add Loved One',
    trackFamily: 'Keep track of family and friends during emergencies',
    name: 'Name',
    relation: 'Relation',
    relationExample: 'e.g., Mother, Brother, Friend',
    addContact: 'Add Contact',
    yourContacts: 'Your Contacts',
    noContacts: 'No contacts added yet',
    contactsHelp: 'Add loved ones to track during emergencies',
    lastSeen: 'Last seen',
    remove: 'Remove',
    contactNote: 'Contact status will automatically update when they send messages through the mesh network.',

    // Map
    locationMap: 'Location Map',
    mapInfo: 'View your location, nearby peers, and contacts on the map',
    mapLegend: 'Map Legend',
    you: 'You',
    unknown: 'Unknown',

    // Network
    meshStatus: 'Mesh Network Status',
    connectedPeers: 'Connected peers in your area',
    active: 'Active',
    relayThrough: 'Messages relay through',
    totalPeers: 'total peers',
    scanningPeers: 'Scanning for nearby peers...',
    nearby: 'Make sure other devices are nearby',
    away: 'away',
    distanceUnknown: 'Distance unknown',

    // Demo
    demoMode: 'Demo Mode',
    testApp: 'Test the app by simulating incoming messages from nearby users',
    simulateMessage: 'Simulate Incoming Message',

    // How It Works
    howItWorks: 'How It Works',
    worksOffline: 'Works without internet using mesh networking',
    messagesRelay: 'Messages relay through nearby devices',
    locationShared: 'Location shared with emergency alerts',
    offlineStorage: 'Offline storage for message history',

    // Settings
    language: 'Language',
    changeLanguage: 'Change Language',
    encryption: 'Encryption',
    encryptionEnabled: 'End-to-end encryption enabled',
    battery: 'Battery',
  },
  es: {
    // Spanish translations
    appName: 'PulseLink',
    tagline: 'Conexión de Emergencia Sin Internet',
    yourName: 'Tu Nombre',
    enterName: 'Ingresa tu nombre',
    connectNetwork: 'Conectar a la Red',
    meshInfo: 'Tu dispositivo se conectará a pares cercanos usando red de malla',
    emergency: 'Emergencia',
    messages: 'Mensajes',
    resources: 'Recursos',
    contacts: 'Contactos',
    map: 'Mapa',
    network: 'Red',
    safe: 'Seguro',
    help: 'Ayuda',
    emergencyStatus: 'Emergencia',
    offline: 'Desconectado',
    peers: 'Pares',
    emergencyActions: 'Acciones de Emergencia',
    sendAlerts: 'Enviar alertas de emergencia a pares cercanos',
    sendSOS: 'ENVIAR ALERTA SOS',
    needHelp: 'Necesito Ayuda',
    imSafe: 'Estoy Seguro',
    sendMessage: 'Enviar Mensaje',
    typeMessage: 'Escribe un mensaje...',
    send: 'Enviar',
    noMessages: 'No hay mensajes aún',
    addPhoto: 'Agregar Foto',
    voiceMessage: 'Mensaje de Voz',
    shareResource: 'Compartir Recurso de Emergencia',
    water: 'Agua',
    food: 'Comida',
    medical: 'Médico',
    shelter: 'Refugio',
    other: 'Otro',
    addLovedOne: 'Agregar Ser Querido',
    name: 'Nombre',
    relation: 'Relación',
    locationMap: 'Mapa de Ubicación',
    meshStatus: 'Estado de Red de Malla',
    active: 'Activo',
    howItWorks: 'Cómo Funciona',
    language: 'Idioma',
  },
  fr: {
    // French translations
    appName: 'PulseLink',
    tagline: 'Connexion d\'Urgence Sans Internet',
    yourName: 'Votre Nom',
    enterName: 'Entrez votre nom',
    connectNetwork: 'Se Connecter au Réseau',
    emergency: 'Urgence',
    messages: 'Messages',
    resources: 'Ressources',
    contacts: 'Contacts',
    map: 'Carte',
    network: 'Réseau',
    safe: 'En Sécurité',
    help: 'Aide',
    emergencyStatus: 'Urgence',
    sendSOS: 'ENVOYER ALERTE SOS',
    needHelp: 'Besoin d\'Aide',
    imSafe: 'Je Suis en Sécurité',
    water: 'Eau',
    food: 'Nourriture',
    medical: 'Médical',
    shelter: 'Abri',
    language: 'Langue',
  },
  de: {
    // German translations
    appName: 'PulseLink',
    tagline: 'Notfallverbindung Ohne Internet',
    yourName: 'Ihr Name',
    enterName: 'Geben Sie Ihren Namen ein',
    connectNetwork: 'Mit Netzwerk Verbinden',
    emergency: 'Notfall',
    messages: 'Nachrichten',
    resources: 'Ressourcen',
    contacts: 'Kontakte',
    map: 'Karte',
    network: 'Netzwerk',
    safe: 'Sicher',
    help: 'Hilfe',
    emergencyStatus: 'Notfall',
    sendSOS: 'SOS-ALARM SENDEN',
    needHelp: 'Brauche Hilfe',
    imSafe: 'Ich Bin Sicher',
    water: 'Wasser',
    food: 'Essen',
    medical: 'Medizinisch',
    shelter: 'Unterkunft',
    language: 'Sprache',
  },
  zh: {
    // Chinese translations
    appName: 'PulseLink',
    tagline: '无需互联网的紧急连接',
    yourName: '您的姓名',
    enterName: '输入您的姓名',
    connectNetwork: '连接到网络',
    emergency: '紧急',
    messages: '消息',
    resources: '资源',
    contacts: '联系人',
    map: '地图',
    network: '网络',
    safe: '安全',
    help: '帮助',
    emergencyStatus: '紧急',
    sendSOS: '发送求救信号',
    needHelp: '需要帮助',
    imSafe: '我安全',
    water: '水',
    food: '食物',
    medical: '医疗',
    shelter: '避难所',
    language: '语言',
  },
  ar: {
    // Arabic translations
    appName: 'PulseLink',
    tagline: 'اتصال طوارئ بدون إنترنت',
    yourName: 'اسمك',
    enterName: 'أدخل اسمك',
    connectNetwork: 'الاتصال بالشبكة',
    emergency: 'طوارئ',
    messages: 'رسائل',
    resources: 'موارد',
    contacts: 'جهات الاتصال',
    map: 'خريطة',
    network: 'شبكة',
    safe: 'آمن',
    help: 'مساعدة',
    emergencyStatus: 'طوارئ',
    sendSOS: 'إرسال إشارة استغاثة',
    needHelp: 'أحتاج مساعدة',
    imSafe: 'أنا بأمان',
    water: 'ماء',
    food: 'طعام',
    medical: 'طبي',
    shelter: 'مأوى',
    language: 'لغة',
  },
  hi: {
    // Hindi translations
    appName: 'PulseLink',
    tagline: 'इंटरनेट के बिना आपातकालीन संपर्क',
    yourName: 'आपका नाम',
    enterName: 'अपना नाम दर्ज करें',
    connectNetwork: 'नेटवर्क से कनेक्ट करें',
    emergency: 'आपातकाल',
    messages: 'संदेश',
    resources: 'संसाधन',
    contacts: 'संपर्क',
    map: 'नक्शा',
    network: 'नेटवर्क',
    safe: 'सुरक्षित',
    help: 'सहायता',
    emergencyStatus: 'आपातकाल',
    sendSOS: 'SOS अलर्ट भेजें',
    needHelp: 'मदद चाहिए',
    imSafe: 'मैं सुरक्षित हूं',
    water: 'पानी',
    food: 'भोजन',
    medical: 'चिकित्सा',
    shelter: 'आश्रय',
    language: 'भाषा',
  },
};

export function useTranslation(lang: Language = 'en') {
  const t = (key: string): string => {
    return translations[lang][key] || translations.en[key] || key;
  };

  return { t, lang };
}

export function setLanguage(lang: Language) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('pulselink-language', lang);
  }
}

export function getLanguage(): Language {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('pulselink-language');
    return (stored as Language) || 'en';
  }
  return 'en';
}

export const LANGUAGES: { code: Language; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
];
