// Pop Quiz question bank — hardcoded from the original HTML design
// Organized by subject, 10 questions each

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
}

export const popQuizData: Record<string, QuizQuestion[]> = {
  Mathematics: [
    { question: "Which of the following is a rational number?", options: ["√2", "π", "3/4", "√5"], correct: 2 },
    { question: "What type of decimal expansion does 1/3 have?", options: ["Terminating", "Non-terminating repeating", "Non-terminating non-repeating", "Finite"], correct: 1 },
    { question: "Which set contains all natural numbers?", options: ["{0, 1, 2, 3, ...}", "{1, 2, 3, 4, ...}", "{-1, 0, 1, 2, ...}", "{..., -2, -1, 0, 1, 2, ...}"], correct: 1 },
    { question: "√16 is an example of which type of number?", options: ["Irrational", "Rational", "Imaginary", "Complex only"], correct: 1 },
    { question: "The number 0 belongs to which of the following sets?", options: ["Natural numbers only", "Whole numbers and integers", "Rational numbers only", "Irrational numbers"], correct: 1 },
    { question: "What is the decimal form of 7/8?", options: ["0.875", "0.777...", "0.8888...", "0.78"], correct: 0 },
    { question: "Which number is between √2 and √3?", options: ["1.3", "1.5", "1.8", "2.1"], correct: 1 },
    { question: "The additive inverse of -5 is:", options: ["-5", "5", "1/5", "-1/5"], correct: 1 },
    { question: "Which property is demonstrated by: a + (b + c) = (a + b) + c?", options: ["Commutative", "Associative", "Distributive", "Identity"], correct: 1 },
    { question: "A number that can be expressed as p/q where q ≠ 0 is called:", options: ["Irrational", "Rational", "Whole", "Natural"], correct: 1 },
  ],

  Science: [
    { question: "What happens when light passes from air to water?", options: ["It speeds up", "It slows down", "Speed remains same", "It stops"], correct: 1 },
    { question: "The angle of incidence is equal to:", options: ["Angle of refraction", "Angle of reflection", "90 degrees", "45 degrees"], correct: 1 },
    { question: "Which type of mirror is used in car headlights?", options: ["Plane mirror", "Concave mirror", "Convex mirror", "Cylindrical mirror"], correct: 1 },
    { question: "The refractive index of water is approximately:", options: ["1.0", "1.33", "1.5", "2.0"], correct: 1 },
    { question: "Total internal reflection occurs when light travels from:", options: ["Denser to rarer medium", "Rarer to denser medium", "Same medium", "Vacuum to air"], correct: 0 },
    { question: "The focal length of a concave mirror is:", options: ["Always positive", "Always negative", "Zero", "Infinite"], correct: 1 },
    { question: "Which phenomenon explains the bending of light?", options: ["Reflection", "Refraction", "Dispersion", "Interference"], correct: 1 },
    { question: "A convex lens is also called:", options: ["Diverging lens", "Converging lens", "Plane lens", "Concave lens"], correct: 1 },
    { question: "The image formed by a plane mirror is:", options: ["Real and inverted", "Virtual and erect", "Real and erect", "Virtual and inverted"], correct: 1 },
    { question: "Snell's law relates:", options: ["Angles of incidence and reflection", "Angles of incidence and refraction", "Focal length and radius", "Speed and wavelength"], correct: 1 },
  ],

  English: [
    { question: "Who wrote 'A Letter to God'?", options: ["R.K. Narayan", "Premchand", "G.L. Fuentes", "Ruskin Bond"], correct: 2 },
    { question: "What was Lencho's occupation?", options: ["Teacher", "Farmer", "Postman", "Shopkeeper"], correct: 1 },
    { question: "What destroyed Lencho's crops?", options: ["Flood", "Drought", "Hailstorm", "Fire"], correct: 2 },
    { question: "How much money did Lencho ask from God?", options: ["50 pesos", "75 pesos", "100 pesos", "200 pesos"], correct: 2 },
    { question: "Who actually sent money to Lencho?", options: ["God", "Post office employees", "His neighbors", "His family"], correct: 1 },
    { question: "How much money did Lencho receive?", options: ["100 pesos", "70 pesos", "50 pesos", "30 pesos"], correct: 1 },
    { question: "What did Lencho call the post office employees?", options: ["Angels", "Crooks", "Helpers", "Friends"], correct: 1 },
    { question: "The story shows Lencho's:", options: ["Greed", "Faith in God", "Anger", "Laziness"], correct: 1 },
    { question: "What is the main theme of the story?", options: ["Love", "Faith and irony", "Friendship", "Adventure"], correct: 1 },
    { question: "Lencho's house was situated:", options: ["In the city", "On a hilltop", "Near the sea", "In a valley"], correct: 1 },
  ],

  "Social Science": [
    { question: "Resources that can be renewed are called:", options: ["Non-renewable", "Renewable", "Biotic", "Abiotic"], correct: 1 },
    { question: "Which is an example of human-made resource?", options: ["Forest", "Water", "Buildings", "Minerals"], correct: 2 },
    { question: "Sustainable development means:", options: ["Using all resources now", "Development without harming future needs", "No development", "Only industrial growth"], correct: 1 },
    { question: "Which is a biotic resource?", options: ["Rock", "Water", "Forest", "Metal"], correct: 2 },
    { question: "Coal is an example of:", options: ["Renewable resource", "Non-renewable resource", "Biotic resource", "Flow resource"], correct: 1 },
    { question: "Conservation of resources means:", options: ["Wasting resources", "Using resources wisely", "Not using resources", "Selling resources"], correct: 1 },
    { question: "Which type of farming uses chemical fertilizers extensively?", options: ["Organic farming", "Commercial farming", "Subsistence farming", "Shifting cultivation"], correct: 1 },
    { question: "Deforestation leads to:", options: ["More rainfall", "Soil erosion", "Better air quality", "More biodiversity"], correct: 1 },
    { question: "The Three R's of conservation are:", options: ["Read, Recite, Revise", "Reduce, Reuse, Recycle", "Run, Rest, Recover", "React, Respond, Resolve"], correct: 1 },
    { question: "Which resource is ubiquitous?", options: ["Coal", "Gold", "Air", "Petroleum"], correct: 2 },
  ],

  Hindi: [
    { question: "हिन्दी दिवस कब मनाया जाता है?", options: ["14 सितंबर", "15 अगस्त", "26 जनवरी", "2 अक्टूबर"], correct: 0 },
    { question: "'सूरदास' किस काल के कवि थे?", options: ["आदिकाल", "भक्तिकाल", "रीतिकाल", "आधुनिक काल"], correct: 1 },
    { question: "हिन्दी में कितने वचन होते हैं?", options: ["एक", "दो", "तीन", "चार"], correct: 1 },
    { question: "'पुस्तक' शब्द का लिंग क्या है?", options: ["पुल्लिंग", "स्त्रीलिंग", "नपुंसकलिंग", "उभयलिंग"], correct: 1 },
    { question: "संज्ञा के कितने भेद होते हैं?", options: ["तीन", "पाँच", "सात", "दो"], correct: 1 },
    { question: "'गाय' शब्द कौन सी संज्ञा है?", options: ["व्यक्तिवाचक", "जातिवाचक", "भाववाचक", "समूहवाचक"], correct: 1 },
    { question: "विलोम शब्द 'अमृत' का:", options: ["जल", "विष", "मधु", "रस"], correct: 1 },
    { question: "'कमल' का पर्यायवाची:", options: ["पंकज", "सागर", "पर्वत", "आकाश"], correct: 0 },
    { question: "हिन्दी वर्णमाला में कितने स्वर हैं?", options: ["10", "11", "13", "15"], correct: 2 },
    { question: "'राम ने रावण को मारा' — कर्म कारक:", options: ["राम ने", "रावण को", "मारा", "कोई नहीं"], correct: 1 },
  ],

  Sanskrit: [
    { question: "संस्कृत में 'विद्यालय' का अर्थ:", options: ["पुस्तकालय", "विद्या का घर", "खेल का मैदान", "बाजार"], correct: 1 },
    { question: "'गच्छति' का अर्थ:", options: ["आता है", "जाता है", "खाता है", "पढ़ता है"], correct: 1 },
    { question: "संस्कृत में कितने वचन होते हैं?", options: ["दो", "तीन", "चार", "पाँच"], correct: 1 },
    { question: "'बालकः' कौन सा लिंग है?", options: ["पुल्लिंग", "स्त्रीलिंग", "नपुंसकलिंग", "उभयलिंग"], correct: 0 },
    { question: "'रामः पठति' में क्रिया:", options: ["रामः", "पठति", "दोनों", "कोई नहीं"], correct: 1 },
    { question: "संस्कृत में 'पानी':", options: ["जलम्", "वायुः", "अग्निः", "पृथ्वी"], correct: 0 },
    { question: "'फलम्' का बहुवचन:", options: ["फलानि", "फलाः", "फलम्", "फलौ"], correct: 0 },
    { question: "संस्कृत को क्या कहा जाता है?", options: ["देव भाषा", "लोक भाषा", "मातृ भाषा", "राज भाषा"], correct: 0 },
    { question: "'सूर्यः' शब्द का अर्थ:", options: ["चंद्रमा", "सूरज", "तारा", "आकाश"], correct: 1 },
    { question: "संस्कृत में कितने पुरुष होते हैं?", options: ["दो", "तीन", "चार", "पाँच"], correct: 1 },
  ],
};

export interface DailyQuizQuestion extends QuizQuestion {
  subject: string;
}

// Get questions for a specific subject (shuffled, limited count)
export function getQuizForSubject(subject: string, count: number = 10): QuizQuestion[] {
  const questions = popQuizData[subject];
  if (!questions) return [];
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Get a daily cross-subject quiz (pulls from ALL subjects, shuffled)
export function getDailyQuiz(count: number = 10): DailyQuizQuestion[] {
  const allQuestions: DailyQuizQuestion[] = [];
  for (const [subject, questions] of Object.entries(popQuizData)) {
    for (const q of questions) {
      allQuestions.push({ ...q, subject });
    }
  }
  const shuffled = allQuestions.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
