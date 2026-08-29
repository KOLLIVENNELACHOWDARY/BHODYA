// ---------- Bodhya avatar catalog — user picks their favorite kawaii mascot ----------
// Each avatar has: id, kawaii image (imported), emoji (for text), label + meaning in 3 languages.

import banyan from "../assets/avatars/banyan.png";
import owl from "../assets/avatars/owl.png";
import diya from "../assets/avatars/diya.png";
import book from "../assets/avatars/book.png";
import brain from "../assets/avatars/brain.png";
import bulb from "../assets/avatars/bulb.png";
import books from "../assets/avatars/books.png";
import rocket from "../assets/avatars/rocket.png";
import lotus from "../assets/avatars/lotus.png";
import peacock from "../assets/avatars/peacock.png";

export const AVATARS = [
  { id: "banyan", img: banyan, emoji: "🌳", label: { en: "Banyan tree", hi: "वटवृक्ष", te: "మర్రి చెట్టు" }, meaning: { en: "The tree of knowledge", hi: "ज्ञान का वृक्ष", te: "జ్ఞాన వృక్షం" } },
  { id: "owl", img: owl, emoji: "🦉", label: { en: "Wise owl", hi: "ज्ञानी उल्लू", te: "జ్ఞాని గుడ్లగూబ" }, meaning: { en: "Wisdom & focus", hi: "ज्ञान और एकाग्रता", te: "జ్ఞానం & ఏకాగ్రత" } },
  { id: "diya", img: diya, emoji: "🪔", label: { en: "Diya lamp", hi: "दीपक", te: "దీపం" }, meaning: { en: "Light of knowledge", hi: "ज्ञान की रोशनी", te: "జ్ఞాన దీపం" } },
  { id: "book", img: book, emoji: "📖", label: { en: "Book & sprout", hi: "किताब और अंकुर", te: "పుస్తకం & మొలక" }, meaning: { en: "Knowledge grows", hi: "ज्ञान बढ़ता है", te: "జ్ఞానం పెరుగుతుంది" } },
  { id: "brain", img: brain, emoji: "🧠", label: { en: "Brain", hi: "दिमाग़", te: "మెదడు" }, meaning: { en: "Smart thinking", hi: "तेज़ सोच", te: "తెలివైన ఆలోచన" } },
  { id: "bulb", img: bulb, emoji: "💡", label: { en: "Idea bulb", hi: "आइडिया बल्ब", te: "ఐడియా బల్బ్" }, meaning: { en: "The aha! moment", hi: "अहा! पल", te: "అహా! క్షణం" } },
  { id: "books", img: books, emoji: "📚", label: { en: "Book stack", hi: "किताबों का ढेर", te: "పుస్తకాల కుప్ప" }, meaning: { en: "Study buddy", hi: "पढ़ाई का साथी", te: "చదువు స్నేహితుడు" } },
  { id: "rocket", img: rocket, emoji: "🚀", label: { en: "Rocket", hi: "रॉकेट", te: "రాకెట్" }, meaning: { en: "Learning takes off", hi: "सीखने की उड़ान", te: "నేర్చుకునే పయనం" } },
  { id: "lotus", img: lotus, emoji: "🪷", label: { en: "Lotus", hi: "कमल", te: "పద్మం" }, meaning: { en: "Wisdom & purity", hi: "ज्ञान और पवित्रता", te: "జ్ఞానం & పవిత్రత" } },
  { id: "peacock", img: peacock, emoji: "🦚", label: { en: "Peacock", hi: "मोर", te: "నెమలి" }, meaning: { en: "Saraswati's ride", hi: "सरस्वती की सवारी", te: "సరస్వతి వాహనం" } },
];

export function avatarEmoji(id) {
  const a = AVATARS.find((x) => x.id === id);
  return a ? a.emoji : "🌳";
}

export function avatarImg(id) {
  const a = AVATARS.find((x) => x.id === id);
  return a ? a.img : banyan;
}
