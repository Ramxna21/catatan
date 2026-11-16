import { DiaryEntry, Mood, User } from '../types';
import {
  formatDate,
  getDominantMood,
  getMoodLabel,
  getTotalWords,
  getWritingStreak
} from './moods';

export interface ChatIdea {
  id: string;
  title: string;
  content: string;
  mood: Mood;
  tags: string[];
}

export interface AssistantReply {
  content: string;
  chips?: string[];
  ideas?: ChatIdea[];
}

export interface AssistantContext {
  user: User;
  entries: DiaryEntry[];
}

interface IdeaTemplate {
  title: string;
  content: string;
  mood: Mood;
  tags: string[];
}

const makeId = () =>
  globalThis.crypto?.randomUUID?.() ?? `idea_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

function pickRandom<T>(pool: T[], count: number): T[] {
  const copy = [...pool];
  const picked: T[] = [];
  while (copy.length > 0 && picked.length < count) {
    const index = Math.floor(Math.random() * copy.length);
    picked.push(copy.splice(index, 1)[0]);
  }
  return picked;
}

function toIdea(template: IdeaTemplate): ChatIdea {
  return { ...template, id: makeId() };
}

const GENERAL_IDEAS: IdeaTemplate[] = [
  {
    title: 'Hal kecil yang membuatku tersenyum hari ini',
    content:
      'Hari ini ada satu hal kecil yang membuatku tersenyum: ...\n\nKenapa hal itu berarti bagiku?\nAku ingin mengingat perasaan ini karena ...',
    mood: 'happy',
    tags: ['bahagia', 'syukur-harian']
  },
  {
    title: 'Percakapan yang tidak ingin kulupakan',
    content:
      'Ada percakapan hari ini yang masih terngiang: ...\n\nYang paling menyentuhku adalah ketika ...\nSetelah itu aku merasa ...',
    mood: 'love',
    tags: ['kenangan', 'manis']
  },
  {
    title: 'Kalau hari ini bisa kuulang, aku ingin...',
    content:
      'Kalau aku bisa mengulang satu bagian dari hari ini, aku akan memilih ...\n\nKarena ...\nDan aku ingin mencoba ... besok.',
    mood: 'hopeful',
    tags: ['refleksi', 'harapan']
  },
  {
    title: 'Satu hal yang aku syukuri hari ini',
    content:
      'Hari ini aku bersyukur untuk ...\n\nHal ini mungkin terlihat sederhana, tetapi ...\nAku ingin lebih sering menyadari ...',
    mood: 'grateful',
    tags: ['bersyukur', 'syukur-harian']
  },
  {
    title: 'Tempat yang membuatku merasa pulang',
    content:
      'Ada satu tempat yang selalu membuatku merasa pulang: ...\n\nDi sana aku bisa ...\nBau, suara, dan suasananya mengingatkanku pada ...',
    mood: 'love',
    tags: ['kenangan', 'tempat']
  },
  {
    title: 'Hal yang sedang ingin aku pelajari',
    content:
      'Akhir-akhir ini aku penasaran tentang ...\n\nAku ingin mempelajarinya karena ...\nLangkah kecil pertama yang bisa aku ambil adalah ...',
    mood: 'hopeful',
    tags: ['mimpi', 'masa-depan']
  },
  {
    title: 'Lagu yang menemaniku belakangan ini',
    content:
      'Lagu yang sering kuputar akhir-akhir ini adalah ...\n\nLagu ini mengingatkanku pada ...\nSaat mendengarnya, aku merasa ...',
    mood: 'hopeful',
    tags: ['musik', 'refleksi']
  },
  {
    title: 'Pesan yang ingin kusampaikan pada diriku di masa lalu',
    content:
      'Kalau aku bisa bicara pada diriku satu tahun lalu, aku akan berkata ...\n\nYang dulu kutakutkan ternyata ...\nSekarang aku ingin ...',
    mood: 'grateful',
    tags: ['refleksi', 'diri-sendiri']
  },
  {
    title: 'Mimpi yang belum sempat kuceritakan',
    content:
      'Semalam aku bermimpi ...\n\nYang paling aneh/indah dari mimpi itu adalah ...\nKalau mimpi itu punya pesan, mungkin ...',
    mood: 'hopeful',
    tags: ['mimpi', 'refleksi']
  },
  {
    title: 'Hal yang berhasil aku lewati hari ini',
    content:
      'Hari ini aku berhasil melewati ...\n\nAwalnya aku merasa ...\nTernyata aku mampu karena ...\nAku bangga pada diriku karena ...',
    mood: 'happy',
    tags: ['pencapaian', 'refleksi']
  },
  {
    title: 'Hal yang ingin aku maafkan pada diriku',
    content:
      'Ada satu hal yang masih ingin aku maafkan dari diriku sendiri: ...\n\nAku menyadari bahwa ...\nMulai sekarang aku ingin lebih ...',
    mood: 'sad',
    tags: ['refleksi', 'diri-sendiri']
  },
  {
    title: 'Orang yang diam-diam menginspirasiku',
    content:
      'Aku ingin menulis tentang ...\n\nYang membuatku kagum darinya adalah ...\nSatu hal yang ingin kucontoh darinya adalah ...',
    mood: 'grateful',
    tags: ['orang-terdekat', 'inspirasi']
  },
  {
    title: 'Rencana kecil yang membuatku bersemangat',
    content:
      'Belakangan ini aku menantikan ...\n\nAku membayangkan ...\nHal yang paling membuatku bersemangat adalah ...',
    mood: 'hopeful',
    tags: ['rencana', 'masa-depan']
  },
  {
    title: 'Suara yang selalu menenangkanku',
    content:
      'Ada suara yang selalu membuatku tenang: ...\n\nSuara itu mengingatkanku pada ...\nSaat mendengarnya, tubuhku terasa ...',
    mood: 'grateful',
    tags: ['kenangan', 'ketenangan']
  },
  {
    title: 'Kebiasaan kecil yang ingin kubangun',
    content:
      'Aku ingin mulai membiasakan diri untuk ...\n\nAku memilih kebiasaan ini karena ...\nKalau berhasil, aku akan merasa ...',
    mood: 'hopeful',
    tags: ['kebiasaan', 'masa-depan']
  },
  {
    title: 'Momen ketika aku merasa benar-benar hadir',
    content:
      'Hari ini ada momen ketika aku benar-benar merasa hadir: ...\n\nAku tidak memegang ponsel, tidak memikirkan apa pun selain ...\nAku ingin lebih sering ...',
    mood: 'happy',
    tags: ['kesadaran', 'refleksi']
  },
  {
    title: 'Sesuatu yang ingin kucoba tanpa rasa takut',
    content:
      'Ada satu hal yang ingin kucoba tetapi masih kutunda: ...\n\nKetakutanku adalah ...\nKalau aku berani mencoba, kemungkinan terbaiknya adalah ...',
    mood: 'hopeful',
    tags: ['keberanian', 'mimpi']
  },
  {
    title: 'Bau atau rasa yang membawaku kembali',
    content:
      'Bau/rasa yang selalu membawaku kembali ke masa lalu adalah ...\n\nItu mengingatkanku pada ...\nPerasaan yang muncul saat itu adalah ...',
    mood: 'love',
    tags: ['kenangan', 'indera']
  }
];

const MOOD_IDEAS: Record<Mood, IdeaTemplate[]> = {
  love: [
    {
      title: 'Hal yang membuatku jatuh cinta lagi hari ini',
      content:
        'Hari ini aku kembali menyadari alasan aku menyayangi ...\n\nHal kecil yang ia lakukan adalah ...\nAku ingin ia tahu bahwa ...',
      mood: 'love',
      tags: ['romantis', 'cinta']
    },
    {
      title: 'Rindu yang belum sempat kuceritakan',
      content:
        'Aku sedang merindukan ...\n\nYang paling kurindukan adalah ...\nKalau bisa, aku ingin mengatakan ...',
      mood: 'love',
      tags: ['rindu', 'romantis']
    },
    {
      title: 'Cara sederhana ia membuat hariku lebih baik',
      content:
        'Hari ini ... membuat hariku lebih baik dengan ...\n\nAku mungkin jarang mengatakannya, tetapi ...\nAku bersyukur karena ...',
      mood: 'love',
      tags: ['romantis', 'bersyukur']
    },
    {
      title: 'Kenangan pertama yang selalu membuatku tersenyum',
      content:
        'Kenangan pertama tentang kami yang selalu membuatku tersenyum adalah ...\n\nWaktu itu ...\nKalau bisa mengulanginya, aku ingin ...',
      mood: 'love',
      tags: ['kenangan', 'anniversary']
    }
  ],
  happy: [
    {
      title: 'Hari yang ingin kusimpan dalam botol',
      content:
        'Hari ini terasa ringan karena ...\n\nAku ingin mengingat ...\nKalau hari ini punya warna, mungkin ...',
      mood: 'happy',
      tags: ['bahagia', 'kenangan']
    },
    {
      title: 'Tawa yang masih terasa di telinga',
      content:
        'Aku masih ingat tawa ...\n\nKami menertawakan ...\nSederhana sekali, tetapi ...',
      mood: 'happy',
      tags: ['lucu', 'bahagia']
    },
    {
      title: 'Kabar baik yang ingin kubagikan',
      content:
        'Ada kabar baik hari ini: ...\n\nAku merasa ...\nAku ingin merayakannya dengan ...',
      mood: 'happy',
      tags: ['pencapaian', 'bahagia']
    }
  ],
  sad: [
    {
      title: 'Yang ingin kusampaikan ketika hati sedang berat',
      content:
        'Hari ini hatiku terasa berat karena ...\n\nYang paling menyakitkan adalah ...\nAku ingin ... tetapi ...',
      mood: 'sad',
      tags: ['sedih', 'refleksi']
    },
    {
      title: 'Pelukan yang sedang kuharapkan',
      content:
        'Saat ini aku hanya ingin ...\n\nAku tidak butuh jawaban, aku hanya ingin ...\nKalau aku boleh meminta satu hal, itu adalah ...',
      mood: 'sad',
      tags: ['sedih', 'dukungan']
    },
    {
      title: 'Hal kecil yang menenangkanku hari ini',
      content:
        'Di tengah perasaan yang tidak nyaman, ada satu hal yang sedikit menenangkanku: ...\n\nAku mencoba bernapas dan ...\nBesok aku ingin ...',
      mood: 'sad',
      tags: ['sedih', 'ketenangan']
    }
  ],
  hopeful: [
    {
      title: 'Surat untuk diriku satu tahun ke depan',
      content:
        'Hai aku di masa depan,\n\nSaat ini aku sedang ...\nAku berharap kamu sudah ...\nYang ingin kuingatkan padamu adalah ...',
      mood: 'hopeful',
      tags: ['masa-depan', 'mimpi']
    },
    {
      title: 'Hal baik yang sedang aku nantikan',
      content:
        'Aku sedang menantikan ...\n\nAku membayangkan ...\nUntuk sampai ke sana, langkah pertamaku adalah ...',
      mood: 'hopeful',
      tags: ['harapan', 'rencana']
    },
    {
      title: 'Kemungkinan yang belum pernah kuberani bayangkan',
      content:
        'Akhir-akhir ini aku mulai membayangkan ...\n\nDulu itu terasa mustahil, tetapi ...\nKalau semuanya berjalan baik, aku akan ...',
      mood: 'hopeful',
      tags: ['mimpi', 'keberanian']
    }
  ],
  grateful: [
    {
      title: 'Tiga hal kecil yang kusyukuri hari ini',
      content:
        'Hari ini aku bersyukur untuk:\n1. ...\n2. ...\n3. ...\n\nDari ketiganya, yang paling menyentuhku adalah ...',
      mood: 'grateful',
      tags: ['bersyukur', 'syukur-harian']
    },
    {
      title: 'Orang yang kehadirannya terasa seperti rumah',
      content:
        'Aku bersyukur untuk ...\n\nKehadirannya membuatku merasa ...\nSatu hal yang ingin kuucapkan padanya adalah ...',
      mood: 'grateful',
      tags: ['bersyukur', 'orang-terdekat']
    },
    {
      title: 'Pelajaran yang datang dari hal yang tidak terduga',
      content:
        'Aku tidak menyangka ...\n\nTernyata hal itu mengajarkanku ...\nAku bersyukur karena ...',
      mood: 'grateful',
      tags: ['bersyukur', 'pelajaran']
    }
  ]
};

const REFLECTION_QUESTIONS = [
  'Apa satu hal yang hari ini terasa lebih mudah dari yang kuduga?',
  'Siapa yang ingin kuucapkan terima kasih hari ini, dan kenapa?',
  'Perasaan apa yang paling sering muncul hari ini?',
  'Apa yang ingin kudengar dari diriku sendiri malam ini?',
  'Hal kecil apa yang ingin kuingat dari hari ini?',
  'Kalau hari ini punya satu kalimat, kalimat apa itu?',
  'Apa yang ingin kulepaskan sebelum tidur?',
  'Apa satu hal yang ingin kucoba lagi besok?'
];

const QUICK_CHIPS = [
  'Beri aku ide menulis',
  'Aku sedang sedih',
  'Bantu buat judul',
  'Saran tag untuk catatanku',
  'Ringkas pola catatanku'
];

const GREETINGS = ['hai', 'hi', 'halo', 'hello', 'hey', 'pagi', 'siang', 'sore', 'malam', 'assalamualaikum', 'permisi'];

const containsAny = (text: string, keywords: string[]) => keywords.some((keyword) => text.includes(keyword));

function detectMood(text: string): Mood | null {
  if (containsAny(text, ['sedih', 'nangis', 'menangis', 'kecewa', 'patah hati', 'galau', 'sepi', 'kesepian', 'stres', 'cemas', 'lelah', 'capek', 'berat'])) {
    return 'sad';
  }
  if (containsAny(text, ['rindu', 'kangen', 'cinta', 'sayang', 'pacar', 'pasangan', 'dia', 'anniversary'])) {
    return 'love';
  }
  if (containsAny(text, ['syukur', 'bersyukur', 'berkat', 'terima kasih atas'])) {
    return 'grateful';
  }
  if (containsAny(text, ['bahagia', 'senang', 'gembira', 'lucu', 'happy'])) {
    return 'happy';
  }
  if (containsAny(text, ['harapan', 'berharap', 'mimpi', 'cita', 'masa depan', 'rencana'])) {
    return 'hopeful';
  }
  return null;
}

function buildIdeas(mood: Mood | null, entries: DiaryEntry[], count = 3): ChatIdea[] {
  if (mood) {
    return pickRandom(MOOD_IDEAS[mood], Math.min(count, MOOD_IDEAS[mood].length)).map(toIdea);
  }

  const dominant = getDominantMood(entries);
  const pool =
    dominant && Math.random() > 0.4
      ? [...MOOD_IDEAS[dominant.value], ...GENERAL_IDEAS]
      : GENERAL_IDEAS;
  return pickRandom(pool, count).map(toIdea);
}

function ideaIntro(mood: Mood | null, entries: DiaryEntry[]): string {
  const total = entries.length;
  const moodLabel = mood ? getMoodLabel(mood) : null;

  if (total === 0) {
    return 'Tentu! Karena ini catatan pertamamu, mari mulai dari hal yang paling dekat denganmu hari ini. Ini beberapa ide yang bisa langsung kamu pakai:';
  }
  if (moodLabel) {
    return `Aku siapkan beberapa ide yang bernuansa ${moodLabel.toLowerCase()} untukmu. Pilih yang paling terasa, lalu tulis dengan caramu sendiri:`;
  }
  return 'Aku sudah menyiapkan beberapa ide. Pilih satu yang paling menarik, lalu klik "Tulis catatan ini" untuk mulai menulis:';
}

function statsReply(entries: DiaryEntry[]): AssistantReply {
  if (entries.length === 0) {
    return {
      content:
        'Belum ada catatan yang bisa kuringkas. Begitu kamu menulis satu catatan, aku bisa membantu melihat pola mood, total kata, dan kebiasaan menulismu. Mau mulai dari sebuah ide?',
      chips: ['Beri aku ide menulis', 'Apa yang bisa kamu lakukan?']
    };
  }

  const dominant = getDominantMood(entries);
  const streak = getWritingStreak(entries);
  const words = getTotalWords(entries);
  const latest = entries[0];

  return {
    content: [
      `Ini ringkasan kecil dari ${entries.length} catatanmu:`,
      '',
      `• Mood yang paling sering muncul: ${dominant ? `${dominant.emoji} ${dominant.label}` : '-'}`,
      `• Total kata yang sudah kamu tulis: ${words.toLocaleString('id-ID')} kata`,
      `• Streak menulis saat ini: ${streak} hari`,
      `• Catatan terakhir: "${latest.title}" (${formatDate(latest.createdAt)})`,
      '',
      streak === 0
        ? 'Belum ada catatan hari ini. Satu paragraf kecil saja sudah cukup untuk menjaga kebiasaan ini.'
        : 'Konsistensimu bagus. Teruskan satu catatan kecil setiap hari, ya.'
    ].join('\n'),
    chips: ['Beri aku ide menulis', 'Saran tag untuk catatanku']
  };
}

function titleReply(entries: DiaryEntry[], mood: Mood | null): AssistantReply {
  const ideas = buildIdeas(mood, entries, 4);
  return {
    content:
      'Ini beberapa judul yang bisa kamu pakai atau ubah sesuai gayamu. Klik salah satu untuk langsung membuka editor:',
    ideas
  };
}

function tagsReply(entries: DiaryEntry[]): AssistantReply {
  const dominant = getDominantMood(entries);
  const tagPool = new Set<string>(['refleksi', 'harapan', 'syukur-harian', 'kenangan', 'diri-sendiri']);
  entries.forEach((entry) => entry.tags.forEach((tag) => tagPool.add(tag)));
  if (dominant) {
    const moodTag: Record<Mood, string> = {
      love: 'romantis',
      happy: 'bahagia',
      sad: 'sedih',
      hopeful: 'masa-depan',
      grateful: 'bersyukur'
    };
    tagPool.add(moodTag[dominant.value]);
  }

  const tags = Array.from(tagPool).slice(0, 8);
  return {
    content: `Beberapa tag yang cocok untuk catatanmu: ${tags.map((tag) => `#${tag}`).join(', ')}.\n\nGunakan maksimal 5 tag agar catatan tetap mudah dicari. Mau aku bantu membuat ide catatan yang pas dengan salah satu tag itu?`,
    chips: ['Beri aku ide menulis', 'Ringkas pola catatanku']
  };
}

function supportReply(mood: Mood, entries: DiaryEntry[]): AssistantReply {
  const idea = buildIdeas(mood, entries, 1)[0];
  return {
    content: [
      'Terima kasih sudah mau menceritakannya. Perasaan berat itu nyata, dan kamu tidak harus langsung bisa membereskannya.',
      '',
      'Kalau hari ini terasa terlalu penuh, coba tulis satu kalimat saja: apa yang paling ingin kamu lepaskan malam ini? Tidak perlu rapi, tidak perlu panjang.',
      '',
      'Aku di sini menemanimu. Kalau kamu mau, kita bisa mulai dari ide kecil ini:'
    ].join('\n'),
    chips: ['Beri aku ide menulis', 'Aku hanya ingin didengar'],
    ideas: idea ? [idea] : undefined
  };
}

function happyReply(mood: Mood, entries: DiaryEntry[]): AssistantReply {
  const idea = buildIdeas(mood, entries, 1)[0];
  return {
    content: [
      'Aku ikut senang membacanya! Momen seperti ini layak disimpan sebelum terasa biasa.',
      '',
      'Coba tangkap detail kecilnya: siapa yang ada di sana, apa yang kamu dengar, dan bagaimana rasanya di badanmu. Detail seperti itu yang akan menghidupkan kembali kenangan nanti.'
    ].join('\n'),
    chips: ['Beri aku ide menulis', 'Bantu buat judul'],
    ideas: idea ? [idea] : undefined
  };
}

function loveReply(mood: Mood, entries: DiaryEntry[]): AssistantReply {
  const idea = buildIdeas(mood, entries, 1)[0];
  return {
    content:
      'Rasa sayang paling indah ketika dicatat dengan jujur. Coba tulis satu hal kecil yang ia lakukan dan bagaimana hal itu membuatmu merasa. Kalau kamu mau, aku punya ide untuk memulainya:',
    chips: ['Beri aku ide menulis', 'Bantu buat judul'],
    ideas: idea ? [idea] : undefined
  };
}

export function getQuickChips(): string[] {
  return QUICK_CHIPS;
}

export function getWelcomeReply(user: User, entries: DiaryEntry[]): AssistantReply {
  const name = user.name?.split(' ')[0] || 'teman';
  const hasEntries = entries.length > 0;
  return {
    content: [
      `Halo ${name}! 👋 Aku asisten Kenang.`,
      '',
      'Aku bisa menemanimu mengobrol, membantu menemukan ide menulis, memberi pertanyaan refleksi, sampai menyarankan judul dan tag. Semua bisa dipakai tanpa API key.',
      '',
      hasEntries
        ? `Aku sudah melihat ${entries.length} catatanmu. Mau mulai dari ide baru atau melihat pola catatanmu?`
        : 'Kamu belum punya catatan. Mau mulai dari satu ide kecil hari ini?',
      '',
      'Klik salah satu tombol di bawah atau tulis apa saja. Aku tidak akan menghakimi. 💙'
    ].join('\n'),
    chips: hasEntries
      ? ['Beri aku ide menulis', 'Ringkas pola catatanku', 'Bantu buat judul']
      : ['Beri aku ide menulis', 'Apa yang bisa kamu lakukan?', 'Aku sedang sedih']
  };
}

export function generateLocalReply(input: string, context: AssistantContext): AssistantReply {
  const raw = input.trim();
  const text = raw.toLowerCase();
  const { user, entries } = context;
  const mood = detectMood(text);
  const firstName = user.name?.split(' ')[0] || 'teman';

  if (!raw) {
    return {
      content: 'Tulis apa saja yang ada di pikiranmu. Aku siap mendengarkan. 💙',
      chips: QUICK_CHIPS.slice(0, 3)
    };
  }

  // Sapaan singkat
  if (text.length <= 24 && GREETINGS.some((greeting) => text === greeting || text.startsWith(`${greeting} `))) {
    return {
      content: `Halo ${firstName}! 🌷 Senang kamu mampir. Mau mengobrol tentang hari ini, atau mencari ide untuk catatan baru?`,
      chips: ['Beri aku ide menulis', 'Aku sedang sedih', 'Ringkas pola catatanku']
    };
  }

  if (containsAny(text, ['apa yang bisa kamu lakukan', 'bisa apa', 'bantuan', 'help', 'fitur', 'kamu bisa apa', 'siapa kamu'])) {
    return {
      content: [
        'Aku asisten diary lokal di Kenang. Yang bisa kubantu:',
        '',
        '💡 Memberi ide dan pembuka catatan',
        '🪞 Menyiapkan pertanyaan refleksi',
        '🏷️ Menyarankan judul dan tag',
        '📊 Meringkas pola mood dan kebiasaan menulismu',
        '💙 Menemani saat kamu sedang butuh didengar',
        '',
        'Untuk mode AI online yang lebih bebas, kamu bisa menambahkan Gemini API key di pengaturan.'
      ].join('\n'),
      chips: ['Beri aku ide menulis', 'Bantu buat judul', 'Saran tag untuk catatanku']
    };
  }

  if (containsAny(text, ['makasih', 'terima kasih', 'thanks', 'thank you'])) {
    return {
      content: `Sama-sama, ${firstName}. 🌼 Senang bisa menemani. Kalau nanti ada yang ingin kamu tuliskan, aku masih di sini.`,
      chips: ['Beri aku ide menulis', 'Sampai nanti']
    };
  }

  if (containsAny(text, ['ide', 'inspirasi', 'bingung', 'mau nulis apa', 'menulis apa', 'topik', 'prompt', 'mulai dari mana', 'cari ide'])) {
    const ideas = buildIdeas(mood, entries, 3);
    return {
      content: ideaIntro(mood, entries),
      chips: ['Beri ide lain', 'Bantu buat judul', 'Saran tag untuk catatanku'],
      ideas
    };
  }

  if (containsAny(text, ['judul'])) {
    return titleReply(entries, mood);
  }

  if (containsAny(text, ['tag', 'label'])) {
    return tagsReply(entries);
  }

  if (containsAny(text, ['ringkas', 'statistik', 'analisis', 'pola', 'berapa catatan', 'mood ku', 'moodku', 'perkembangan'])) {
    return statsReply(entries);
  }

  if (containsAny(text, ['pertanyaan', 'refleksi', 'tanya aku', 'tanyakan'])) {
    const questions = pickRandom(REFLECTION_QUESTIONS, 3);
    return {
      content: `Ini beberapa pertanyaan refleksi untuk malam ini. Pilih satu yang paling mengena, lalu tulis jawabannya pelan-pelan:\n\n${questions.map((question) => `• ${question}`).join('\n')}`,
      chips: ['Beri aku ide menulis', 'Beri pertanyaan lain']
    };
  }

  if (mood === 'sad') {
    return supportReply(mood, entries);
  }

  if (mood === 'love') {
    return loveReply(mood, entries);
  }

  if (mood === 'happy' || mood === 'grateful' || mood === 'hopeful') {
    return happyReply(mood, entries);
  }

  // Default: tetap terasa seperti mengobrol, lalu tawarkan ide.
  const idea = buildIdeas(null, entries, 1)[0];
  const openers = [
    `Aku mendengarmu, ${firstName}. Kadang menuliskan satu kalimat saja sudah membuat pikiran terasa lebih lega.`,
    'Terima kasih sudah bercerita. Mau kita perlahan mengubahnya menjadi satu catatan kecil?',
    `Aku di sini, ${firstName}. Kalau bingung mulai dari mana, kita bisa mulai dari hal yang paling terasa hari ini.`
  ];

  return {
    content: `${openers[Math.floor(Math.random() * openers.length)]}\n\nKalau kamu mau, ini satu ide yang bisa langsung kamu pakai:`,
    chips: ['Beri aku ide menulis', 'Tanyakan aku pertanyaan refleksi', 'Ringkas pola catatanku'],
    ideas: idea ? [idea] : undefined
  };
}
