// ---------- Quiz Arena question bank: 3 tiers × 5 questions, EN/HI/TE ----------

export const QUIZ_BANK = [
  // ---- TIER 1 (levels 1–2) ----
  {
    tier: 1,
    topic: 'fractions',
    q: {
      en: 'If a pizza is cut into 8 equal slices and you eat 2, what fraction did you eat?',
      hi: 'अगर पिज़्ज़ा के 8 बराबर टुकड़े हों और तुम 2 खाओ, तो कितना भिन्न खाया?',
      te: 'పిజ్జాను 8 సమాన ముక్కలుగా కోసి 2 తిన్నావంటే, ఎంత భిన్నం తిన్నావు?'
    },
    options: [
      { en: '1/4', hi: '1/4', te: '1/4' },
      { en: '1/2', hi: '1/2', te: '1/2' },
      { en: '1/8', hi: '1/8', te: '1/8' },
      { en: '2/6', hi: '2/6', te: '2/6' }
    ],
    answer: 0
  },
  {
    tier: 1,
    topic: 'gravity',
    q: {
      en: 'Why does a ball thrown up always come back down?',
      hi: 'ऊपर फेंकी गई गेंद हमेशा नीचे क्यों लौटती है?',
      te: 'పైకి విసిరిన బంతి ఎప్పుడూ కిందికి ఎందుకు వస్తుంది?'
    },
    options: [
      { en: 'Because of gravity', hi: 'गुरुत्वाकर्षण की वजह से', te: 'గురుత్వాకర్షణ వల్ల' },
      { en: 'Because of wind', hi: 'हवा की वजह से', te: 'గాలి వల్ల' },
      { en: 'Because it is heavy', hi: 'क्योंकि वह भारी है', te: 'అది బరువుగా ఉండటం వల్ల' },
      { en: 'Because of friction', hi: 'घर्षण की वजह से', te: 'రాపిడి వల్ల' }
    ],
    answer: 0
  },
  {
    tier: 1,
    topic: 'watercycle',
    q: {
      en: 'Water vapour turning into clouds is called…',
      hi: 'जलवाष्प का बादल बनना कहलाता है…',
      te: 'నీటి ఆవిరి మేఘాలుగా మారడాన్ని ఏమంటారు…'
    },
    options: [
      { en: 'Evaporation', hi: 'वाष्पीकरण', te: 'బాష్పీభవనం' },
      { en: 'Condensation', hi: 'संघनन', te: 'ఘనీభవనం' },
      { en: 'Precipitation', hi: 'वर्षण', te: 'వర్షపాతం' },
      { en: 'Collection', hi: 'संग्रहण', te: 'సేకరణ' }
    ],
    answer: 1
  },
  {
    tier: 1,
    topic: 'cell',
    q: {
      en: 'What is the smallest living unit of your body?',
      hi: 'आपके शरीर की सबसे छोटी जीवित इकाई क्या है?',
      te: 'మీ శరీరంలో అతి చిన్న జీవ యూనిట్ ఏది?'
    },
    options: [
      { en: 'The cell', hi: 'कोशिका', te: 'కణం' },
      { en: 'The heart', hi: 'हृदय', te: 'గుండె' },
      { en: 'The atom', hi: 'परमाणु', te: 'అణువు' },
      { en: 'The organ', hi: 'अंग', te: 'అవయవం' }
    ],
    answer: 0
  },
  {
    tier: 1,
    topic: 'algebra',
    q: {
      en: 'If x + 3 = 7, what is x?',
      hi: 'अगर x + 3 = 7, तो x क्या है?',
      te: 'x + 3 = 7 అయితే, x ఎంత?'
    },
    options: [
      { en: '4', hi: '4', te: '4' },
      { en: '10', hi: '10', te: '10' },
      { en: '3', hi: '3', te: '3' },
      { en: '7', hi: '7', te: '7' }
    ],
    answer: 0
  },

  // ---- TIER 2 (level 3) ----
  {
    tier: 2,
    topic: 'photosynthesis',
    q: {
      en: 'Which gas do plants release during photosynthesis?',
      hi: 'प्रकाश संश्लेषण के दौरान पौधे कौन-सी गैस छोड़ते हैं?',
      te: 'కిరణజన్య సంయోగక్రియలో మొక్కలు ఏ వాయువును విడుదల చేస్తాయి?'
    },
    options: [
      { en: 'Oxygen', hi: 'ऑक्सीजन', te: 'ఆక్సిజన్' },
      { en: 'Carbon dioxide', hi: 'कार्बन डाइऑक्साइड', te: 'కార్బన్ డయాక్సైడ్' },
      { en: 'Nitrogen', hi: 'नाइट्रोजन', te: 'నైట్రోజన్' },
      { en: 'Hydrogen', hi: 'हाइड्रोजन', te: 'హైడ్రోజన్' }
    ],
    answer: 0
  },
  {
    tier: 2,
    topic: 'newton',
    q: {
      en: "Newton's Second Law is written as…",
      hi: 'न्यूटन का दूसरा नियम लिखा जाता है…',
      te: 'న్యూటన్ రెండవ నియమాన్ని ఇలా రాస్తారు…'
    },
    options: [
      { en: 'F = ma', hi: 'F = ma', te: 'F = ma' },
      { en: 'E = mc²', hi: 'E = mc²', te: 'E = mc²' },
      { en: 'F = m/a', hi: 'F = m/a', te: 'F = m/a' },
      { en: 'v = u + at', hi: 'v = u + at', te: 'v = u + at' }
    ],
    answer: 0
  },
  {
    tier: 2,
    topic: 'fractions',
    q: {
      en: 'Which fraction is equivalent to 1/2?',
      hi: 'कौन-सी भिन्न 1/2 के बराबर है?',
      te: 'ఏ భిన్నం 1/2 కి సమానం?'
    },
    options: [
      { en: '2/4', hi: '2/4', te: '2/4' },
      { en: '2/3', hi: '2/3', te: '2/3' },
      { en: '3/4', hi: '3/4', te: '3/4' },
      { en: '1/3', hi: '1/3', te: '1/3' }
    ],
    answer: 0
  },
  {
    tier: 2,
    topic: 'watercycle',
    q: {
      en: 'Where does most of Earth\u2019s water live?',
      hi: 'पृथ्वी का अधिकांश पानी कहाँ है?',
      te: 'భూమిపై చాలా నీరు ఎక్కడ ఉంది?'
    },
    options: [
      { en: 'Oceans', hi: 'महासागरों में', te: 'మహాసముద్రాలలో' },
      { en: 'Rivers', hi: 'नदियों में', te: 'నదులలో' },
      { en: 'Glaciers', hi: 'ग्लेशियरों में', te: 'హిమానీనదాలలో' },
      { en: 'Groundwater', hi: 'भूजल में', te: 'భూగర్భ జలంలో' }
    ],
    answer: 0
  },
  {
    tier: 2,
    topic: 'cell',
    q: {
      en: 'Which organelle is called the "powerhouse" of the cell?',
      hi: 'किस अंगक को कोशिका का "पावरहाउस" कहते हैं?',
      te: 'ఏ అవయవాన్ని కణం యొక్క "పవర్ హౌస్" అంటారు?'
    },
    options: [
      { en: 'Mitochondria', hi: 'माइटोकॉन्ड्रिया', te: 'మైటోకాండ్రియా' },
      { en: 'Nucleus', hi: 'नाभिक', te: 'న్యూక్లియస్' },
      { en: 'Ribosome', hi: 'राइबोसोम', te: 'రైబోజోమ్' },
      { en: 'Golgi body', hi: 'गॉल्जी बॉडी', te: 'గోల్గి బాడీ' }
    ],
    answer: 0
  },

  // ---- TIER 3 (levels 4–5) ----
  {
    tier: 3,
    topic: 'algebra',
    q: {
      en: 'Solve: 2x + 6 = 20. What is x?',
      hi: 'हल करें: 2x + 6 = 20। x क्या है?',
      te: 'సాధించండి: 2x + 6 = 20. x ఎంత?'
    },
    options: [
      { en: '7', hi: '7', te: '7' },
      { en: '6', hi: '6', te: '6' },
      { en: '13', hi: '13', te: '13' },
      { en: '14', hi: '14', te: '14' }
    ],
    answer: 0
  },
  {
    tier: 3,
    topic: 'newton',
    q: {
      en: 'A 10 kg object accelerates at 2 m/s². What is the net force?',
      hi: '10 किलो की वस्तु 2 m/s² से त्वरित होती है। नेट बल क्या है?',
      te: '10 కేజీల వస్తువు 2 m/s² త్వరణంతో కదులుతుంది. నికర బలం ఎంత?'
    },
    options: [
      { en: '20 N', hi: '20 N', te: '20 N' },
      { en: '5 N', hi: '5 N', te: '5 N' },
      { en: '12 N', hi: '12 N', te: '12 N' },
      { en: '0.2 N', hi: '0.2 N', te: '0.2 N' }
    ],
    answer: 0
  },
  {
    tier: 3,
    topic: 'gravity',
    q: {
      en: 'Approximate gravitational acceleration near Earth\u2019s surface is…',
      hi: 'पृथ्वी की सतह के पास गुरुत्वीय त्वरण लगभग…',
      te: 'భూమి ఉపరితలం దగ్గర గురుత్వ త్వరణం సుమారు…'
    },
    options: [
      { en: '9.8 m/s²', hi: '9.8 m/s²', te: '9.8 m/s²' },
      { en: '3.0 m/s²', hi: '3.0 m/s²', te: '3.0 m/s²' },
      { en: '98 m/s²', hi: '98 m/s²', te: '98 m/s²' },
      { en: '0.98 m/s²', hi: '0.98 m/s²', te: '0.98 m/s²' }
    ],
    answer: 0
  },
  {
    tier: 3,
    topic: 'photosynthesis',
    q: {
      en: 'Where exactly does the Calvin cycle happen?',
      hi: 'कैल्विन चक्र वास्तव में कहाँ होता है?',
      te: 'కాల్విన్ చక్రం సరిగ్గా ఎక్కడ జరుగుతుంది?'
    },
    options: [
      { en: 'In the stroma', hi: 'स्ट्रोमा में', te: 'స్ట్రోమాలో' },
      { en: 'In the thylakoid membrane', hi: 'थायलाकोइड झिल्ली में', te: 'థైలాకాయిడ్ పొరలో' },
      { en: 'In the nucleus', hi: 'नाभिक में', te: 'న్యూక్లియస్ లో' },
      { en: 'In the cell wall', hi: 'कोशिका भित्ति में', te: 'కణ గోడలో' }
    ],
    answer: 0
  },
  {
    tier: 3,
    topic: 'fractions',
    q: {
      en: 'Which is the largest: 2/3, 3/5, 5/8?',
      hi: 'सबसे बड़ा कौन है: 2/3, 3/5, 5/8?',
      te: 'అతిపెద్దది ఏది: 2/3, 3/5, 5/8?'
    },
    options: [
      { en: '2/3', hi: '2/3', te: '2/3' },
      { en: '3/5', hi: '3/5', te: '3/5' },
      { en: '5/8', hi: '5/8', te: '5/8' },
      { en: 'All equal', hi: 'सभी बराबर', te: 'అన్నీ సమానం' }
    ],
    answer: 0
  }
]

export function pickQuiz(level) {
  const tier = level >= 4 ? 3 : level >= 3 ? 2 : 1
  const bank = QUIZ_BANK.filter(q => q.tier === tier)
  // shuffle and take 5
  const shuffled = [...bank].sort(() => Math.random() - 0.5)
  return { questions: shuffled.slice(0, 5), tier }
}

export const QUIZ_XP = { 1: 10, 2: 15, 3: 20 } // XP per correct answer per tier
