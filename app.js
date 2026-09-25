/* ほおぶくろ — やりたいことをためて、かなえて、ハムスターを育てる */
'use strict';
(function () {
  // ---------- 小道具 ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const DAY = 86400000;
  const HOUR = 3600000;

  // ---------- 決まりごと ----------
  // place: true の種類は、入れるときに場所さがしを最初から開いておく
  const CATS = {
    go: { label: '行きたい', ph: '例：夜の東京タワー、北海道で温泉旅行', tags: ['おでかけ', '旅行', 'イベント', '自然'], place: true },
    eat: { label: '食べたい', ph: '例：駅前のパン屋のクロワッサン', tags: ['お店', 'グルメ', '作ってみる', 'お取り寄せ'], place: true },
    do: { label: 'やりたい', ph: '例：子どもとキャッチボール、朝焼けを見る', tags: ['スポーツ', '家族', '体験', 'イベント'], place: false },
    watch: { label: '観たい', ph: '例：話題のドラマを1話から', tags: ['映画', 'ドラマ', 'アニメ', 'ライブ', 'スポーツ観戦'], place: false },
    learn: { label: '学びたい', ph: '例：積んでる本を読む、簿記の勉強', tags: ['本', '勉強', '資格', '講座'], place: false },
    try: { label: '試したい', ph: '例：流行りのボードゲーム、新しいアプリ', tags: ['流行り', '新商品', '習慣', 'チャレンジ'], place: false },
    buy: { label: '買いたい', ph: '例：ちょっといい傘', tags: ['ほしい物', 'ギフト', '家のもの'], place: false },
  };
  const CAT_KEYS = Object.keys(CATS);
  const DIFFS = { 1: { label: 'かんたん', exp: 10 }, 2: { label: 'ふつう', exp: 25 }, 3: { label: 'むずかしい', exp: 45 } };
  const TIMES = {
    s: { label: '〜30分', min: 30, bonus: 0 },
    m: { label: '〜2時間', min: 120, bonus: 5 },
    h: { label: '半日', min: 300, bonus: 10 },
    d: { label: '1日', min: 600, bonus: 20 },
    t: { label: '泊まり', min: 1440, bonus: 30 },
  };
  const TIME_KEYS = Object.keys(TIMES);
  const BUDGETS = ['指定なし', '〜1,000円', '〜5,000円', '〜2万円', '2万円〜'];
  const RADII = [100, 300, 1000, 3000];
  const ACC_NEED = 3;
  const ACCS = { go: 'むぎわら帽子', eat: 'ひまわりの種', do: 'マフラー', watch: 'ポップコーン', learn: 'まるメガネ', try: 'お花のかざり', buy: 'ポシェット' };
  const NOTIFY_COOLDOWN = 12 * HOUR; // 同じ場所は12時間に1回まで
  const NEAR_KM = 5;
  const FORGOT_DAYS = 14;

  // ---------- アイコン ----------
  const P = {
    go: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
    eat: '<path d="M3.5 12.5h17a8.5 8.5 0 0 1-17 0z"/><path d="M9 3l2 6.5M15.5 3l-2 6.5"/>',
    do: '<path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/>',
    watch: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8.5 21h7M12 17v4"/><path d="M10.5 8.8v4.4l3.8-2.2z"/>',
    learn: '<path d="M2.5 9.5L12 5l9.5 4.5L12 14z"/><path d="M6.5 11.5V16c0 1.5 2.5 3 5.5 3s5.5-1.5 5.5-3v-4.5"/>',
    try: '<path d="M9.5 3h5M10.5 3v6.2L5.3 18a2 2 0 0 0 1.7 3h10a2 2 0 0 0 1.7-3l-5.2-8.8V3"/><path d="M7.8 15h8.4"/>',
    buy: '<path d="M5 8.5h14l-1.2 11.5H6.2z"/><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5"/>',
    home: '<path d="M4 11l8-7 8 7"/><path d="M6 9.5V20h12V9.5"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
    map: '<path d="M9 4L3 6.5V20l6-2.5 6 2.5 6-2.5V4l-6 2.5z"/><path d="M9 4v13.5M15 6.5V20"/>',
    book: '<path d="M4 4.5h5.5A2.5 2.5 0 0 1 12 7v13a2 2 0 0 0-2-2H4z"/><path d="M20 4.5h-5.5A2.5 2.5 0 0 0 12 7v13a2 2 0 0 1 2-2h6z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    gear: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    locate: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    chev: '<path d="M9 5l7 7-7 7"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    walk: '<circle cx="13" cy="4.5" r="2"/><path d="M9 21l2.5-6.5L14 17v4M8 12l2-4.5 3.5 1 2 3.5 2.5 1"/><path d="M11.5 14.5l-1-7"/>',
  };
  const ic = (n, c = '') => `<svg class="ic ${c}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;

  // ---------- 保存 ----------
  const KEY = 'hoobukuro:v1';
  const baseItem = () => ({ memo: '', tag: '', link: '', place: null, diff: 1, time: 'm', budget: 0, radius: 300, createdAt: Date.now(), doneAt: null, doneNote: '', exp: 0, lastNotified: 0, remindedAt: 0, sample: false });

  function sampleItems() {
    const t = Date.now();
    const mk = (o, ago) => Object.assign(baseItem(), { id: uid(), createdAt: t - ago * DAY, sample: true }, o);
    return [
      mk({ cat: 'go', tag: 'おでかけ', title: '夜の東京タワーを見に行く', diff: 1, time: 'm', place: { lat: 35.65858, lng: 139.74543, name: '東京タワー' } }, 3),
      mk({ cat: 'go', tag: '旅行', title: '北海道で温泉旅行', diff: 3, time: 't', budget: 4, place: { lat: 42.4959, lng: 141.147, name: '登別温泉' }, memo: '地獄谷も見たい' }, 60),
      mk({ cat: 'eat', tag: 'お店', title: 'まだ入ったことない近所の店でランチ', diff: 1, time: 'm', budget: 1 }, 20),
      mk({ cat: 'do', tag: '家族', title: '子どもと公園でキャッチボール', diff: 1, time: 'm' }, 8),
      mk({ cat: 'watch', tag: 'ドラマ', title: '話題のドラマを1話から見る', diff: 2, time: 'd' }, 25),
      mk({ cat: 'learn', tag: '本', title: '積んでる本を1冊読みきる', diff: 2, time: 'h' }, 41),
      mk({ cat: 'try', tag: '流行り', title: 'いま流行ってるボードゲームをやってみる', diff: 1, time: 'm' }, 12),
      mk({ cat: 'buy', tag: 'ほしい物', title: 'ちょっといい万年筆を買う', diff: 1, time: 'm', budget: 3, memo: 'お店で書き味を試してから決める' }, 9),
    ];
  }
  const fresh = (items) => ({ v: 1, items, pet: { name: 'ぼた' }, settings: { notify: false, radius: 300, showDone: true }, remind: { day: '', id: null } });

  function normalize(d) {
    if (!d || !Array.isArray(d.items)) return null;
    d.pet = Object.assign({ name: 'ぼた' }, d.pet || {});
    d.settings = Object.assign({ notify: false, radius: 300, showDone: true }, d.settings || {});
    d.remind = Object.assign({ day: '', id: null }, d.remind || {});
    d.items = d.items
      .filter((i) => i && i.id && i.title && CATS[i.cat])
      .map((i) => Object.assign(baseItem(), i));
    return d;
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const d = normalize(JSON.parse(raw)); if (d) return d; }
    } catch (e) { /* 壊れてたら作り直す */ }
    return fresh(sampleItems());
  }
  let S = load();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('保存できなかったよ。スマホの空き容量を確認してね'); }
  }
  save();
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

  // 画面だけの状態(保存しない)
  const UI = { tab: 'home', filter: 'all', sort: 'easy', sugTime: 'm', sugMood: 'any', shuffle: 0, pos: null, locErr: '', watching: false, lastRenderPos: null, installEvt: null, walk: false };

  // ---------- 計算 ----------
  function distM(a, b) {
    const R = 6371000, r = Math.PI / 180;
    const dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }
  const fmtDist = (m) => (m < 1000 ? `${Math.max(10, Math.round(m / 10) * 10)}m` : m < 10000 ? `${(m / 1000).toFixed(1)}km` : `${Math.round(m / 1000)}km`);
  const daysAgo = (t) => Math.max(0, Math.floor((Date.now() - t) / DAY));
  const fmtDate = (t) => { const d = new Date(t); return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`; };
  const ymd = (t) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const todayKey = () => ymd(Date.now());
  const itemDist = (i) => (UI.pos && i.place ? distM(UI.pos, i.place) : null);
  const expFor = (i) => DIFFS[i.diff].exp + TIMES[i.time].bonus;
  const getItem = (id) => S.items.find((i) => i.id === id);
  const undone = () => S.items.filter((i) => !i.doneAt);
  const doneIn = (cat) => S.items.filter((i) => i.doneAt && i.cat === cat).length;
  const accState = () => Object.fromEntries(CAT_KEYS.map((c) => [c, doneIn(c) >= ACC_NEED]));
  const totalExp = () => S.items.reduce((s, i) => s + (i.doneAt ? i.exp || 0 : 0), 0);
  const needFor = (lv) => 20 + lv * 15;
  function levelInfo(exp = totalExp()) {
    let lv = 1, rest = exp;
    while (rest >= needFor(lv)) { rest -= needFor(lv); lv++; }
    return { lv, cur: rest, need: needFor(lv) };
  }
  const stageOf = (lv) => (lv >= 10 ? { k: 4, name: 'たびハム' } : lv >= 6 ? { k: 3, name: 'おとなハム' } : lv >= 3 ? { k: 2, name: 'こハム' } : { k: 1, name: 'ちびハム' });
  const isSleepy = () => { const l = S.items.reduce((m, i) => Math.max(m, i.doneAt || 0), 0); return l > 0 && Date.now() - l > 7 * DAY; };
  // 日ごとに変わるけど、画面を描き直しても変わらない乱数
  function rnd(str) { let h = 2166136261; for (let k = 0; k < str.length; k++) { h ^= str.charCodeAt(k); h = Math.imul(h, 16777619); } return ((h >>> 0) % 1000) / 1000; }
  const diffDots = (d) => `<span class="diff-dots" aria-hidden="true">${[1, 2, 3].map((n) => `<i class="${n <= d ? 'on' : ''}"></i>`).join('')}</span>`;
  const gmapUrl = (p) => `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`;
  const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return 'リンク'; } };

  // ---------- ハムスター ----------
  function hamster({ stage = 1, acc = {}, sleepy = false, puff = false } = {}) {
    const sc = [1, 0.74, 0.87, 1, 1][stage];
    const ink = '#2B211A';
    const cr = puff ? 16 : 11;
    const back = stage >= 4 ? '<rect x="136" y="90" width="40" height="58" rx="13" fill="#4F7B5B"/><rect x="143" y="114" width="26" height="18" rx="6" fill="#3F6649"/>' : '';
    const strap = stage >= 4 ? '<path d="M138 96c7 22 7 42 0 60" stroke="#3F6649" stroke-width="6" fill="none" stroke-linecap="round"/>' : '';
    const eyes = sleepy
      ? `<path d="M73 103q7 5 14 0M113 103q7 5 14 0" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`
      : `<circle cx="80" cy="102" r="7" fill="${ink}"/><circle cx="120" cy="102" r="7" fill="${ink}"/><circle cx="82.6" cy="99.3" r="2.4" fill="#fff"/><circle cx="122.6" cy="99.3" r="2.4" fill="#fff"/>`;
    const glasses = acc.learn ? `<circle cx="80" cy="102" r="12.5" fill="rgba(255,255,255,.18)" stroke="#3A2A20" stroke-width="3"/><circle cx="120" cy="102" r="12.5" fill="rgba(255,255,255,.18)" stroke="#3A2A20" stroke-width="3"/><path d="M92.5 101h15M67.5 100l-10-3M132.5 100l10-3" stroke="#3A2A20" stroke-width="3" stroke-linecap="round"/>` : '';
    const scarf = acc.do ? '<path d="M44 131c33 16 79 16 112 0l-2 15c-33 15-75 15-108 0z" fill="#C8414B"/><path d="M126 141l13 29-13 3-10-28z" fill="#A9343D"/>' : '';
    const seed = acc.eat ? '<g transform="translate(100 146) rotate(-18)"><path d="M0-14c6 0 9 9 9 15s-4 10-9 10-9-4-9-10 3-15 9-15z" fill="#3A3633"/><path d="M-3.2-9v17M3.2-9v17" stroke="#EDE6D6" stroke-width="1.8" stroke-linecap="round"/></g>' : '';
    const bagStrap = acc.buy ? '<path d="M34 122L128 162" stroke="#8A5A3B" stroke-width="3.5" stroke-linecap="round"/>' : '';
    const bag = acc.buy ? '<rect x="120" y="150" width="30" height="24" rx="7" fill="#C24A95"/><path d="M120 159h30" stroke="#9A3877" stroke-width="2"/><circle cx="135" cy="160" r="2.6" fill="#F7D66B"/>' : '';
    const popcorn = acc.watch ? '<g transform="translate(40 150)"><circle cx="-7" cy="-11" r="5.5" fill="#FFF3C4"/><circle cx="1" cy="-14" r="6.5" fill="#FFF3C4"/><circle cx="8" cy="-10" r="5.5" fill="#FFF3C4"/><path d="M-12-8h24l-3 26h-18z" fill="#fff"/><path d="M-5.5-8l1.4 26M5.5-8l-1.4 26" stroke="#CF3F4F" stroke-width="4"/></g>' : '';
    const flower = acc.try ? `<g transform="translate(50 54)">${[0, 72, 144, 216, 288].map((a) => `<circle cx="${(7 * Math.cos((a * Math.PI) / 180)).toFixed(1)}" cy="${(7 * Math.sin((a * Math.PI) / 180)).toFixed(1)}" r="5.5" fill="#F4A3C0"/>`).join('')}<circle r="4.5" fill="#F7D66B"/></g>` : '';
    const hat = acc.go ? '<ellipse cx="100" cy="50" rx="36" ry="8.5" fill="#E2BB5C"/><path d="M80 50c0-14 8-22 20-22s20 8 20 22z" fill="#F0D17F"/><path d="M80.6 42.5h38.8v7H80.6z" fill="#C8414B"/>' : '';
    return `<svg class="ham${sleepy ? ' is-sleepy' : ''}" viewBox="0 0 200 190" role="img" aria-label="ハムスターの${esc(S.pet.name)}">
      <ellipse class="ham-shadow" cx="100" cy="179" rx="${Math.round(58 * sc)}" ry="7"/>
      <g transform="translate(100 178) scale(${sc}) translate(-100 -178)"><g class="ham-body">
        ${back}
        <circle cx="62" cy="62" r="15" fill="var(--fur)"/><circle cx="62" cy="62" r="8" fill="#F2A7A0"/>
        <circle cx="138" cy="62" r="15" fill="var(--fur)"/><circle cx="138" cy="62" r="8" fill="#F2A7A0"/>
        <path d="M100 46c-45 0-72 35-72 74 0 38 29 57 72 57s72-19 72-57c0-39-27-74-72-74z" fill="var(--fur)"/>
        <path d="M100 48c-9 0-14 9-15 20 8-3 22-3 30 0-1-11-6-20-15-20z" fill="#C07A26" opacity=".45"/>
        <ellipse cx="100" cy="146" rx="44" ry="31" fill="var(--cream)"/>
        <ellipse cx="100" cy="119" rx="31" ry="20" fill="var(--cream)"/>
        <ellipse cx="69" cy="121" rx="${cr}" ry="${(cr * 0.72).toFixed(1)}" fill="var(--cheek)" opacity=".6"/>
        <ellipse cx="131" cy="121" rx="${cr}" ry="${(cr * 0.72).toFixed(1)}" fill="var(--cheek)" opacity=".6"/>
        ${eyes}${glasses}
        <ellipse cx="100" cy="113" rx="4.5" ry="3.2" fill="#D9707A"/>
        <path d="M100 116.5v3.5M93 120q3.5 4 7 0q3.5 4 7 0" stroke="${ink}" stroke-width="2" fill="none" stroke-linecap="round"/>
        ${scarf}${bagStrap}${seed}
        <ellipse cx="87" cy="148" rx="8" ry="6" fill="#F4C7B6"/><ellipse cx="113" cy="148" rx="8" ry="6" fill="#F4C7B6"/>
        ${bag}${popcorn}
        <ellipse cx="80" cy="176" rx="12" ry="5" fill="#F4C7B6"/><ellipse cx="120" cy="176" rx="12" ry="5" fill="#F4C7B6"/>
        ${strap}${hat}${flower}
      </g></g>
      ${sleepy ? '<text class="zzz" x="150" y="48">z<tspan dy="-9" font-size="15">z</tspan><tspan dy="-7" font-size="11">z</tspan></text>' : ''}
    </svg>`;
  }

  function petLine() {
    const u = undone();
    if (!S.items.length) return 'やりたいこと、ぼくのほおぶくろにつめこもう！';
    const n = nearList()[0];
    if (n && n.d < 1000) return `すぐそこに「${n.i.title}」があるよ！寄ってく？`;
    if (isSleepy()) return 'ひさしぶり…。かんたんなのから、ひとつやってみない？';
    if (!u.length) return 'ぜんぶかなえちゃった！次のやりたいを入れよ！';
    const lines = ['今日はなにする？', 'ちいさいことでも、ちゃんと経験値になるよ', `ほおぶくろに${u.length}個たまってるよ`, 'できたら「できた！」を押してね。ぼく育つから', '予定してなかったことも「もうやった！」で記録できるよ'];
    return lines[new Date().getHours() % lines.length];
  }

  // ---------- おすすめ ----------
  function nearList(maxKm = NEAR_KM) {
    if (!UI.pos) return [];
    return undone().filter((i) => i.place)
      .map((i) => ({ i, d: distM(UI.pos, i.place) }))
      .filter((x) => x.d <= maxKm * 1000)
      .sort((a, b) => a.d - b.d);
  }

  function suggest() {
    const maxMin = UI.sugTime === 'd' ? Infinity : TIMES[UI.sugTime].min;
    // 使える時間ごとの「行ける距離」の目安
    const reach = { s: 1500, m: 8000, h: 30000, d: 200000 }[UI.sugTime];
    const seed = todayKey() + UI.shuffle;
    return undone()
      .filter((i) => TIMES[i.time].min <= maxMin)
      .map((i) => {
        let s = 0;
        const why = [];
        if (UI.sugMood === 'light') s += (3 - i.diff) * 2.2;
        else if (UI.sugMood === 'hard') s += (i.diff - 1) * 2.2;
        else s += 1;
        const d = itemDist(i);
        if (d != null) {
          if (d > reach * 3) return null; // 遠すぎて今日は無理
          if (d <= reach) { s += 3 * (1 - d / reach) + 1; why.push(fmtDist(d)); } else s -= 2;
        }
        const age = daysAgo(i.createdAt);
        if (age >= FORGOT_DAYS) { s += Math.min(age / 20, 2.5); why.push(`${age}日前から`); }
        s += rnd(i.id + seed) * 2;
        return { i, s, why };
      })
      .filter(Boolean)
      .sort((a, b) => b.s - a.s)
      .slice(0, 3);
  }

  function remindItem() {
    const today = todayKey();
    const cur = S.remind.id && getItem(S.remind.id);
    if (S.remind.day === today) return cur && !cur.doneAt ? cur : null;
    const olds = undone()
      .filter((i) => daysAgo(i.createdAt) >= FORGOT_DAYS)
      .sort((a, b) => (a.remindedAt || 0) - (b.remindedAt || 0) || a.createdAt - b.createdAt);
    const pick = olds[0] || null;
    S.remind = { day: today, id: pick ? pick.id : null };
    if (pick) pick.remindedAt = Date.now();
    save();
    return pick;
  }

  function nextChallenge(done) {
    const u = undone();
    if (!u.length) return null;
    const target = Math.min(3, done.diff + 1);
    const score = (x) => (x.cat === done.cat ? 0 : 2) + Math.abs(x.diff - target) + (x.diff < done.diff ? 1 : 0);
    return u.slice().sort((a, b) => score(a) - score(b) || a.createdAt - b.createdAt)[0];
  }

  // ---------- 部品 ----------
  function row(i, o = {}) {
    const d = itemDist(i);
    const chips = [];
    (o.why || []).forEach((w) => chips.push(`<span class="chip hi">${esc(w)}</span>`));
    if (i.tag) chips.push(`<span class="chip tagc cat-${i.cat}">${esc(i.tag)}</span>`);
    if (i.doneAt) {
      chips.push(`<span class="chip">${fmtDate(i.doneAt)}</span>`, `<span class="chip hi">+${i.exp}exp</span>`);
    } else {
      chips.push(`<span class="chip">${DIFFS[i.diff].label}</span>`, `<span class="chip">${TIMES[i.time].label}</span>`);
      if (!o.why && d != null) chips.push(`<span class="chip">${fmtDist(d)}</span>`);
      else if (!o.why && i.place) chips.push('<span class="chip">場所あり</span>');
    }
    if (i.link) chips.push('<span class="chip">リンク</span>');
    if (i.sample) chips.push('<span class="chip sample">サンプル</span>');
    const note = i.doneAt && i.doneNote ? `<span class="note">${esc(i.doneNote)}</span>` : '';
    return `<button class="row" type="button" data-act="open" data-id="${i.id}">
      <span class="cat-ic cat-${i.cat}">${ic(i.doneAt ? 'check' : i.cat)}</span>
      <span class="row-main"><span class="row-title">${esc(i.title)}</span><span class="chips">${chips.join('')}</span>${note}</span>
      ${ic('chev', 'chev')}</button>`;
  }
  const segBtns = (act, opts, cur) => opts.map(([v, l]) => `<button type="button" data-act="${act}" data-v="${v}" aria-pressed="${cur === v}">${l}</button>`).join('');

  // ---------- 画面:ホーム ----------
  function renderHome() {
    const L = levelInfo(), st = stageOf(L.lv), acc = accState();
    const got = CAT_KEYS.filter((c) => acc[c]).length;
    const sug = suggest();
    const near = nearList();
    const rem = remindItem();
    const hasSamples = S.items.some((i) => i.sample);

    let nearBody;
    if (!UI.pos) {
      nearBody = `<p class="hint">現在地を使うと、近くにある行きたい所を出したり、近づいたときにお知らせしたりできるよ。</p>
        ${UI.locErr ? `<p class="err">${esc(UI.locErr)}</p>` : ''}
        <button class="btn" type="button" data-act="locate"${UI.watching ? ' disabled' : ''}>${ic('locate')}${UI.watching ? '現在地をさがしてるよ…' : '現在地を使う'}</button>`;
    } else if (!near.length) {
      nearBody = `<p class="empty">${NEAR_KM}km以内にはまだないみたい。</p>`;
    } else {
      nearBody = `<div class="rows">${near.slice(0, 5).map((x) => row(x.i)).join('')}</div>`;
    }
    const ideasCard = `<section class="card ideas-card">
      <div class="card-head"><h2>なにを入れたらいい？</h2></div>
      <p class="hint">近くでできそうなことや、いろんなアイデアを出すよ。気になったら「＋」で入れるだけ。</p>
      <div class="btn-row"><button class="btn" type="button" data-act="ideas" data-v="near">${ic('go')}近くのスポット</button><button class="btn ghost" type="button" data-act="ideas" data-v="list">${ic('do')}いろんなアイデア</button></div>
    </section>`;
    const fewItems = undone().filter((i) => !i.sample).length < 8;
    const walkCta = UI.walk ? '' :`<div class="walk-cta"><button class="btn ghost" type="button" data-act="walkStart">${ic('walk')}おさんぽモード</button><p class="hint">画面をつけたまま歩くと、行きたい所に近づいたときに通知とバイブで知らせるよ。</p></div>`;

    return `
    <header class="top">
      <h1 class="logo">ほお<span>ぶくろ</span></h1>
      <button class="icon-btn" type="button" data-act="settings" aria-label="設定">${ic('gear')}</button>
    </header>
    ${UI.installEvt ? `<div class="notice"><p>ホーム画面に追加すると、アプリみたいに使えるよ。</p><button class="btn small" type="button" data-act="install">追加する</button></div>` : ''}
    ${hasSamples ? `<div class="notice"><p>いまはお試し用のサンプルが入ってるよ。自分のを入れたら消してね。</p><button class="btn small ghost" type="button" data-act="clearSamples">サンプルを消す</button></div>` : ''}
    <section class="pet" aria-label="${esc(S.pet.name)}のようす">
      <div class="pet-art">${hamster({ stage: st.k, acc, sleepy: isSleepy() })}</div>
      <div class="pet-info">
        <p class="bubble">${esc(petLine())}</p>
        <div class="pet-name"><strong>${esc(S.pet.name)}</strong><span class="tag">${st.name}</span></div>
        <div class="lv-row"><span class="lv">Lv.<b>${L.lv}</b></span><span class="exp-text">次まで あと${L.need - L.cur}exp</span></div>
        <div class="exp-bar" role="progressbar" aria-label="経験値" aria-valuemin="0" aria-valuemax="${L.need}" aria-valuenow="${L.cur}"><i style="width:${((L.cur / L.need) * 100).toFixed(1)}%"></i></div>
      </div>
      <div class="acc-wrap">
        <div class="acc-head"><span>アイテム</span><b>${got}/${CAT_KEYS.length}</b></div>
        <ul class="acc">${CAT_KEYS.map((c) => {
          const n = Math.min(doneIn(c), ACC_NEED), ok = acc[c];
          return `<li><button type="button" class="acc-b cat-${c}${ok ? ' is-on' : ''}" data-act="accInfo" data-v="${c}" aria-label="${CATS[c].label}のアイテム ${ok ? ACCS[c] : `${n}/${ACC_NEED}`}">${ic(c)}</button><small>${ok ? 'GET' : `${n}/${ACC_NEED}`}</small></li>`;
        }).join('')}</ul>
      </div>
    </section>
    ${fewItems ? ideasCard : ''}

    <section class="card">
      <div class="card-head"><h2>いまヒマ？</h2><button class="link-btn" type="button" data-act="reshuffle">ほかの案</button></div>
      <div class="seg" role="group" aria-label="使える時間">${segBtns('sugTime', [['s', '30分'], ['m', '2時間'], ['h', '半日'], ['d', '1日以上']], UI.sugTime)}</div>
      <div class="seg" role="group" aria-label="気分">${segBtns('sugMood', [['light', '軽めがいい'], ['any', 'なんでも'], ['hard', 'がっつり']], UI.sugMood)}</div>
      <div class="rows">${sug.length ? sug.map((x) => row(x.i, { why: x.why })).join('') : '<p class="empty">この時間に合うのがまだないみたい。「＋」で入れてみよ！</p>'}</div>
    </section>

    <section class="card">
      <div class="card-head"><h2>近くの行ってみたかった所</h2>${UI.pos ? `<span class="meta">${NEAR_KM}km以内</span>` : ''}</div>
      ${nearBody}
      ${walkCta}
    </section>

    ${rem ? `<section class="card">
      <div class="card-head"><h2>忘れてない？</h2></div>
      <p class="remind-text">「${esc(rem.title)}」<small>ほおぶくろに入れてから${daysAgo(rem.createdAt)}日たったよ</small></p>
      <div class="btn-row"><button class="btn" type="button" data-act="open" data-id="${rem.id}">見てみる</button><button class="btn ghost" type="button" data-act="remindNext">ほかのにして</button></div>
    </section>` : ''}
    ${fewItems ? '' : ideasCard}`;
  }

  // ---------- 画面:リスト ----------
  function renderList() {
    const all = undone();
    const counts = Object.fromEntries(CAT_KEYS.map((c) => [c, all.filter((i) => i.cat === c).length]));
    const items = all.filter((i) => UI.filter === 'all' || i.cat === UI.filter);
    const sorters = {
      easy: (a, b) => a.diff - b.diff || TIMES[a.time].min - TIMES[b.time].min || a.createdAt - b.createdAt,
      near: (a, b) => (itemDist(a) ?? Infinity) - (itemDist(b) ?? Infinity),
      new: (a, b) => b.createdAt - a.createdAt,
      old: (a, b) => a.createdAt - b.createdAt,
    };
    items.sort(sorters[UI.sort]);
    let body;
    if (!items.length) body = `<p class="empty">${all.length ? 'この種類はまだないよ。' : 'まだ何もないよ。下の「＋」から入れてね。'}</p><div class="btn-row center"><button class="btn ghost" type="button" data-act="ideas" data-v="list">${ic('do')}アイデアをもらう</button></div>`;
    else if (UI.sort === 'easy') {
      body = [1, 2, 3].map((d) => {
        const g = items.filter((i) => i.diff === d);
        return g.length ? `<h3 class="group">${diffDots(d)}${DIFFS[d].label}<span>${g.length}個</span></h3><div class="rows">${g.map((i) => row(i)).join('')}</div>` : '';
      }).join('');
    } else body = `<div class="rows">${items.map((i) => row(i)).join('')}</div>`;
    const nearHint = UI.sort === 'near' && !UI.pos
      ? `<div class="notice"><p>近い順にするには現在地が必要だよ。</p><button class="btn small" type="button" data-act="locate">現在地を使う</button></div>` : '';
    const chip = (k, label, n) => `<button class="fchip ${k !== 'all' ? 'cat-' + k : ''}" type="button" data-act="filter" data-v="${k}" aria-pressed="${UI.filter === k}">${k !== 'all' ? ic(k) : ''}${label}<span>${n}</span></button>`;
    return `
    <header class="top"><h1 class="page-title">やりたいリスト</h1><span class="meta">${all.length}個</span></header>
    <div class="filters" role="group" aria-label="種類">${chip('all', 'すべて', all.length)}${CAT_KEYS.map((c) => chip(c, CATS[c].label, counts[c])).join('')}</div>
    <div class="sortbar"><label for="sortSel">並び順</label><select id="sortSel">${[['easy', 'かんたん順'], ['near', '近い順'], ['new', '新しい順'], ['old', '古い順']].map(([k, l]) => `<option value="${k}"${UI.sort === k ? ' selected' : ''}>${l}</option>`).join('')}</select></div>
    ${nearHint}${body}`;
  }

  // ---------- 画面:思い出 ----------
  function renderDone() {
    const done = S.items.filter((i) => i.doneAt).sort((a, b) => b.doneAt - a.doneAt);
    let body = '', month = '';
    if (!done.length) body = '<p class="empty">まだ思い出はないよ。ひとつかなえたら、ここにたまっていくよ。</p>';
    done.forEach((i) => {
      const d = new Date(i.doneAt), m = `${d.getFullYear()}年${d.getMonth() + 1}月`;
      if (m !== month) { body += `${month ? '</div>' : ''}<h3 class="group">${m}</h3><div class="rows">`; month = m; }
      body += row(i);
    });
    if (month) body += '</div>';
    return `
    <header class="top"><h1 class="page-title">思い出</h1><span class="meta">ぜんぶで${totalExp()}exp</span></header>
    <button class="btn big ghost log-btn" type="button" data-act="logDone">${ic('check')}もうやったことを記録する</button>
    <div class="stats">${CAT_KEYS.map((c) => `<div class="stat cat-${c}"><b>${doneIn(c)}</b><span>${CATS[c].label}</span></div>`).join('')}<div class="stat stat-all"><b>${done.length}</b><span>ぜんぶ</span></div></div>
    ${body}`;
  }

  // ---------- 描画 ----------
  function render() {
    $$('.tab[data-tab]').forEach((b) => b.setAttribute('aria-current', b.dataset.tab === UI.tab ? 'page' : 'false'));
    const v = $('#view'), mv = $('#mapView');
    updateWalkBar();
    if (UI.tab === 'map') { v.hidden = true; mv.hidden = false; showMap(); return; }
    mv.hidden = true; v.hidden = false;
    v.innerHTML = UI.tab === 'home' ? renderHome() : UI.tab === 'list' ? renderList() : renderDone();
  }

  // ---------- 地図 ----------
  let map = null, mapLayer = null, meLayer = null, mapFitted = false;
  const TILE = 'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png';
  const TILE_ATTR = '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener">地理院タイル</a>';
  const pinIcon = (cls, name) => L.divIcon({ className: 'pin-wrap', html: `<span class="pin ${cls}">${ic(name)}</span>`, iconSize: [34, 34], iconAnchor: [17, 41] });
  const numIcon = (n) => L.divIcon({ className: 'pin-wrap', html: `<span class="pin is-num"><b>${n}</b></span>`, iconSize: [30, 30], iconAnchor: [15, 36] });

  function showMap() {
    if (!window.L) { $('#map').innerHTML = '<p class="empty">地図を読みこめなかったよ。電波のいいところでもう一度開いてね。</p>'; return; }
    if (!map) {
      map = L.map('map', { zoomControl: false }).setView([35.681, 139.767], 12);
      L.tileLayer(TILE, { maxZoom: 18, attribution: TILE_ATTR }).addTo(map);
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      mapLayer = L.layerGroup().addTo(map);
      meLayer = L.layerGroup().addTo(map);
      map.on('contextmenu', (e) => openEdit(null, { cat: 'go', place: { lat: e.latlng.lat, lng: e.latlng.lng, name: '' } }));
    }
    $('#showDone').checked = S.settings.showDone;
    requestAnimationFrame(() => map.invalidateSize());
    drawMarkers();
    if (!mapFitted) fitMap();
  }
  function mapItems() { return S.items.filter((i) => i.place && (!i.doneAt || S.settings.showDone)); }
  function fitMap() {
    if (!map) return;
    const pts = mapItems().map((i) => [i.place.lat, i.place.lng]);
    if (UI.pos) { map.setView([UI.pos.lat, UI.pos.lng], 14); mapFitted = true; }
    else if (pts.length) { map.fitBounds(pts, { padding: [50, 50], maxZoom: 15 }); mapFitted = true; }
  }
  function drawMarkers() {
    if (!map) return;
    mapLayer.clearLayers();
    const items = mapItems();
    items.forEach((i) => {
      L.marker([i.place.lat, i.place.lng], { icon: pinIcon(`cat-${i.cat}${i.doneAt ? ' is-done' : ''}`, i.doneAt ? 'check' : i.cat), title: i.title })
        .on('click', () => openDetail(i.id))
        .addTo(mapLayer);
    });
    $('#mapCount').textContent = `場所つき ${items.length}件`;
    drawMe();
  }
  function drawMe() {
    if (!map) return;
    meLayer.clearLayers();
    if (!UI.pos) return;
    L.circle([UI.pos.lat, UI.pos.lng], { radius: Math.min(UI.pos.acc || 30, 500), className: 'me-acc', interactive: false }).addTo(meLayer);
    L.circleMarker([UI.pos.lat, UI.pos.lng], { radius: 7, className: 'me-dot', interactive: false }).addTo(meLayer);
  }

  // ---------- 現在地 ----------
  let watchId = null;
  const locErrMsg = (e) => (e && e.code === 1 ? '位置情報が許可されてないよ。Chromeのサイト設定で「位置情報」を許可してね。' : '位置がうまく取れなかった…。外に出るか、少し待ってもう一度ためしてね。');

  function startWatch() {
    if (!('geolocation' in navigator)) { UI.locErr = 'この端末では位置情報が使えないみたい。'; render(); return; }
    if (watchId !== null) return;
    UI.watching = true;
    watchId = navigator.geolocation.watchPosition(onPos, (e) => {
      UI.locErr = locErrMsg(e);
      stopWatch();
      if (UI.walk) toast(UI.locErr);
      if (UI.tab !== 'map') render();
    }, { enableHighAccuracy: true, maximumAge: 15000, timeout: 30000 });
  }
  function stopWatch() {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    watchId = null;
    UI.watching = false;
  }
  function onPos(p) {
    const first = !UI.pos;
    UI.pos = { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy, t: Date.now() };
    UI.locErr = '';
    checkProximity();
    updateWalkBar();
    if (map) { drawMe(); if (first && UI.tab === 'map') map.setView([UI.pos.lat, UI.pos.lng], 14); }
    const moved = !UI.lastRenderPos || distM(UI.lastRenderPos, UI.pos) > 80;
    if (moved && UI.tab !== 'map' && $('#sheet').hidden) { UI.lastRenderPos = UI.pos; render(); }
  }
  function getPos() {
    return new Promise((res, rej) => {
      if (UI.pos && Date.now() - UI.pos.t < 60000) return res(UI.pos);
      if (!('geolocation' in navigator)) return rej('この端末では位置情報が使えないみたい。');
      navigator.geolocation.getCurrentPosition((p) => {
        UI.pos = { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy, t: Date.now() };
        startWatch();
        res(UI.pos);
      }, (e) => rej(locErrMsg(e)), { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 });
    });
  }

  // ---------- 近づいたらお知らせ ----------
  function checkProximity() {
    if (!UI.pos) return;
    const t = Date.now();
    let changed = false;
    for (const i of S.items) {
      if (i.doneAt || !i.place || !i.radius) continue;
      const d = distM(UI.pos, i.place);
      if (d <= i.radius && t - (i.lastNotified || 0) > NOTIFY_COOLDOWN) {
        i.lastNotified = t;
        changed = true;
        const body = `${fmtDist(d)}先に「${i.title}」があるよ。寄ってく？`;
        // 入力中のフォームは消さない
        toast(body, { label: '見る', fn: () => { if (!$('#sheet form')) openDetail(i.id); } });
        sysNotify(`${CATS[i.cat].label}が近いよ`, body, i.id);
        if (UI.walk && navigator.vibrate) navigator.vibrate([200, 100, 200]);
      }
    }
    if (changed) save();
  }
  function sysNotify(title, body, id) {
    if ((!S.settings.notify && !UI.walk) || !('Notification' in window) || Notification.permission !== 'granted' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.showNotification(title, { body, tag: id ? 'near-' + id : 'hoobukuro', icon: 'icons/icon-192.png', badge: 'icons/badge-96.png', data: { id }, vibrate: [60, 40, 60] }))
      .catch(() => {});
  }

  // ---------- おさんぽモード ----------
  let wakeLock = null;
  async function lockScreen() {
    if (!('wakeLock' in navigator) || wakeLock) return;
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } catch (e) { /* 取れなくても見張りは続ける */ }
  }
  function startWalk() {
    UI.walk = true;
    UI.locErr = '';
    startWatch();
    lockScreen();
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    render();
    toast('おさんぽモード開始！画面をつけたまま歩いてね');
  }
  function stopWalk() {
    UI.walk = false;
    if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
    render();
  }
  function updateWalkBar() {
    const bar = $('#walkBar');
    document.body.classList.toggle('walking', UI.walk);
    bar.hidden = !UI.walk;
    if (!UI.walk) return;
    let text = '現在地をさがしてるよ…';
    if (UI.pos) {
      const n = nearList(50)[0];
      text = n ? `いちばん近い「${n.i.title}」まで ${fmtDist(n.d)}` : '50km以内に場所つきのやりたいはないみたい';
    }
    bar.innerHTML = `<span class="walk-dot" aria-hidden="true"></span><span class="walk-text"><b>おさんぽ中</b><span>${esc(text)}</span></span><button class="btn small ghost" type="button" data-act="walkStop">おわる</button>`;
  }
  document.addEventListener('visibilitychange', () => { if (UI.walk && document.visibilityState === 'visible') lockScreen(); });

  // ---------- 場所さがし ----------
  const KIND = {
    restaurant: '飲食店', cafe: 'カフェ', fast_food: 'ファストフード', bar: 'バー', pub: '居酒屋', food_court: 'フードコート', ice_cream: 'アイス',
    bakery: 'パン屋', confectionery: 'お菓子', pastry: 'ケーキ', museum: '博物館・美術館', gallery: 'ギャラリー', attraction: '観光スポット',
    viewpoint: '展望スポット', park: '公園', garden: '庭園', zoo: '動物園', aquarium: '水族館', theme_park: 'テーマパーク', station: '駅',
    place_of_worship: '寺社', hotel: 'ホテル', guest_house: '宿', hostel: '宿', mall: 'ショッピングモール', department_store: '百貨店',
    supermarket: 'スーパー', convenience: 'コンビニ', clothes: '服', books: '本屋', cinema: '映画館', theatre: '劇場', public_bath: '温泉・銭湯',
    stadium: 'スタジアム', sports_centre: 'スポーツ施設', beach: 'ビーチ', peak: '山', camp_site: 'キャンプ場', library: '図書館',
    city: '市', town: '町', village: '村', hot_spring: '温泉',
  };
  // 返事が来ないサーバーを待ち続けないように
  const fetchT = (url, ms = 12000, init = {}) => fetch(url, Object.assign({ signal: AbortSignal.timeout ? AbortSignal.timeout(ms) : undefined }, init));
  async function photonSearch(q) {
    const p = new URLSearchParams({ q, limit: '10', bbox: '122,20,154,46' });
    if (UI.pos) { p.set('lat', UI.pos.lat.toFixed(5)); p.set('lon', UI.pos.lng.toFixed(5)); }
    const j = await (await fetchT('https://photon.komoot.io/api/?' + p)).json();
    return (j.features || []).map((f) => {
      const pr = f.properties || {};
      const area = [];
      [pr.state, pr.city || pr.county, pr.district || pr.locality, pr.street].forEach((a) => { if (a && !/^[\d-]+$/.test(a) && !area.includes(a)) area.push(a); });
      return { name: pr.name || pr.street || area[area.length - 1] || '名前なし', sub: [KIND[pr.osm_value], area.join(' ')].filter(Boolean).join('・'), lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] };
    });
  }
  async function nominatimSearch(q) {
    const p = new URLSearchParams({ format: 'jsonv2', q, limit: '6', 'accept-language': 'ja', countrycodes: 'jp' });
    if (UI.pos) { const d = 0.4; p.set('viewbox', [UI.pos.lng - d, UI.pos.lat + d, UI.pos.lng + d, UI.pos.lat - d].join(',')); }
    const j = await (await fetchT('https://nominatim.openstreetmap.org/search?' + p)).json();
    return j.map((x) => ({ name: x.name || x.display_name.split(',')[0], sub: x.display_name.split(',').slice(1, 4).reverse().join(' ').trim(), lat: +x.lat, lng: +x.lon }));
  }
  async function gsiSearch(q) {
    const j = await (await fetchT('https://msearch.gsi.go.jp/address-search/AddressSearch?q=' + encodeURIComponent(q))).json();
    return j.slice(0, 5).map((x) => ({ name: x.properties.title, sub: '住所', lat: x.geometry.coordinates[1], lng: x.geometry.coordinates[0] }));
  }
  function mergeResults(lists) {
    const out = [];
    for (const l of lists) for (const r of l) {
      if (!isFinite(r.lat) || !isFinite(r.lng)) continue;
      if (out.some((o) => o.name === r.name && distM(o, r) < 200)) continue;
      out.push(r);
    }
    return out;
  }
  // deep=false は打ちながらの候補(軽い検索だけ)。deep=true は「さがす」を押したとき
  async function searchPlaces(q, deep) {
    const safe = (p) => p.catch(() => []);
    const lists = await Promise.all(deep ? [safe(photonSearch(q)), safe(nominatimSearch(q))] : [safe(photonSearch(q))]);
    let out = mergeResults(lists);
    if (deep && out.length < 2) out = mergeResults([out, await safe(gsiSearch(q))]);
    out = out.slice(0, 8);
    if (UI.pos) out.forEach((o) => { o.d = distM(UI.pos, o); });
    return out;
  }
  async function reverseName(p) {
    try {
      const r = await fetchT(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&accept-language=ja&lat=${p.lat}&lon=${p.lng}`);
      const j = await r.json();
      const a = j.address || {};
      return j.name || a.amenity || a.shop || a.tourism || a.leisure || [a.city || a.town || a.village, a.suburb || a.quarter || a.neighbourhood].filter(Boolean).join(' ') || '';
    } catch (e) { return ''; }
  }
  // GoogleマップのURLや「35.6, 139.7」から場所を取り出す
  function parseMapText(s) {
    let t = s;
    try { t = decodeURIComponent(s); } catch (e) { /* そのまま */ }
    const m = t.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
      || t.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
      || t.match(/[?&](?:q|query|ll|destination)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/)
      || t.match(/^\s*(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/);
    if (!m) return null;
    const nm = t.match(/\/place\/([^/@?]+)/);
    return { lat: +m[1], lng: +m[2], name: nm ? nm[1].replace(/\+/g, ' ') : '' };
  }
  // 共有されたページのタイトルから、お店や作品の名前らしいところだけ取り出す
  function cleanTitle(s) {
    if (!s) return '';
    let t = String(s).replace(/\s+/g, ' ').trim();
    t = t.split(/\s[-|｜–—]\s|【|\[|［|｜/)[0].trim();
    t = t.replace(/\s*[（(][^）)]*[）)]\s*$/, '').trim();
    t = t.replace(/(の)?(クチコミ|口コミ|メニュー|アクセス|地図).*$/, '').trim();
    return t.slice(0, 60);
  }
  function guessCat(url) {
    const h = hostOf(url);
    if (/tabelog|retty|hotpepper|gnavi|gurunavi|ubereats|demae-can|cookpad|kurashiru|delishkitchen/.test(h)) return 'eat';
    if (/filmarks|eiga|imdb|netflix|tver|abema|unext|hulu|disneyplus|primevideo|youtube|youtu\.be|tiget|eplus|pia/.test(h)) return 'watch';
    if (/bookmeter|honto|booklog|udemy|schoo|coursera|kindle/.test(h)) return 'learn';
    if (/amazon|rakuten|mercari|zozo|yahoo-shopping|shopping\.yahoo|muji|nitori|uniqlo/.test(h)) return 'buy';
    return 'go';
  }

  // ---------- シート(下から出る画面) ----------
  let sheetCleanup = null;
  function openSheet(html, mount) {
    teardownSheet();
    const bd = $('#sheet');
    bd.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">${html}</div>`;
    bd.hidden = false;
    document.body.classList.add('lock');
    requestAnimationFrame(() => bd.classList.add('open'));
    sheetCleanup = mount ? mount(bd.firstElementChild) || null : null;
    // Androidの「戻る」でシートが閉じるように
    if (!(history.state && history.state.sheet)) history.pushState({ sheet: 1 }, '');
  }
  function teardownSheet() {
    if (typeof sheetCleanup === 'function') sheetCleanup();
    sheetCleanup = null;
    const bd = $('#sheet');
    bd.classList.remove('open');
    bd.hidden = true;
    bd.innerHTML = '';
    document.body.classList.remove('lock');
  }
  function closeSheet() {
    if (history.state && history.state.sheet) history.back();
    else teardownSheet();
  }
  window.addEventListener('popstate', () => { if (!$('#sheet').hidden) teardownSheet(); });

  // ---------- シート:くわしく ----------
  function openDetail(id) {
    const i = getItem(id);
    if (!i) return;
    const d = itemDist(i);
    openSheet(`
      <div class="sheet-head"><span class="cat-pill cat-${i.cat}">${ic(i.cat)}${CATS[i.cat].label}</span>${i.tag ? `<span class="chip tagc cat-${i.cat}">${esc(i.tag)}</span>` : ''}${i.sample ? '<span class="chip sample">サンプル</span>' : ''}<button class="icon-btn" type="button" data-act="close" aria-label="閉じる">${ic('close')}</button></div>
      <h2 class="sheet-title">${esc(i.title)}</h2>
      ${i.memo ? `<p class="memo">${esc(i.memo).replace(/\n/g, '<br>')}</p>` : ''}
      ${i.link ? `<a class="link-card" href="${esc(i.link)}" target="_blank" rel="noopener">${ic('link')}<span><b>${esc(hostOf(i.link))}</b><small>${esc(i.link)}</small></span>${ic('ext')}</a>` : ''}
      <dl class="facts">
        <div><dt>むずかしさ</dt><dd>${diffDots(i.diff)}${DIFFS[i.diff].label}</dd></div>
        <div><dt>かかる時間</dt><dd>${TIMES[i.time].label}</dd></div>
        <div><dt>予算</dt><dd>${BUDGETS[i.budget] || BUDGETS[0]}</dd></div>
        <div><dt>もらえる経験値</dt><dd>${expFor(i)}exp</dd></div>
        <div><dt>入れた日</dt><dd>${fmtDate(i.createdAt)}</dd></div>
        <div><dt>ためてる日数</dt><dd>${i.doneAt ? '―' : `${daysAgo(i.createdAt)}日`}</dd></div>
      </dl>
      ${i.place ? `
        <div class="place-card">${ic('go')}<div><strong>${esc(i.place.name || '登録した場所')}</strong><span>${d != null ? `ここから${fmtDist(d)}・` : ''}${i.radius ? `${fmtDist(i.radius)}以内でお知らせ` : 'お知らせなし'}</span></div></div>
        <div class="btn-row"><button class="btn ghost" type="button" data-act="showOnMap" data-id="${i.id}">${ic('map')}地図で見る</button><a class="btn ghost" href="${gmapUrl(i.place)}" target="_blank" rel="noopener">${ic('ext')}Googleマップ</a></div>` : ''}
      ${i.doneAt
        ? `<div class="done-box"><p><strong>${fmtDate(i.doneAt)}にかなえた！</strong> +${i.exp}exp</p>${i.doneNote ? `<p>${esc(i.doneNote)}</p>` : ''}<button class="btn small ghost" type="button" data-act="undo" data-id="${i.id}">まだだったことにする</button></div>`
        : `<div class="detail-main"><button class="btn big" type="button" data-act="complete" data-id="${i.id}">${ic('check')}できた！</button></div>`}
      <div class="sheet-foot" id="delZone"><button class="btn ghost" type="button" data-act="edit" data-id="${i.id}">編集</button><button class="btn ghost danger" type="button" data-act="del" data-id="${i.id}">削除</button></div>`);
  }

  // ---------- シート:できた! ----------
  function openComplete(id) {
    const i = getItem(id);
    if (!i) return;
    openSheet(`
      <div class="sheet-head"><span class="cat-pill cat-${i.cat}">${ic(i.cat)}${CATS[i.cat].label}</span><button class="icon-btn" type="button" data-act="close" aria-label="閉じる">${ic('close')}</button></div>
      <h2 class="sheet-title">やったね！</h2>
      <p class="lead">「${esc(i.title)}」をかなえたよ。</p>
      <form id="doneForm" class="form">
        <label class="field"><span>ひとことメモ（なくてもOK）</span><textarea id="doneNote" rows="3" placeholder="どうだった？ だれと行った？"></textarea></label>
        <button class="btn big" type="submit">記録する ＋${expFor(i)}exp</button>
      </form>`, (el) => {
      $('#doneForm', el).addEventListener('submit', (e) => { e.preventDefault(); finishItem(i.id, $('#doneNote', el).value.trim()); });
    });
  }
  function finishItem(id, note, when) {
    const i = getItem(id);
    if (!i || i.doneAt) return;
    const before = levelInfo(), accBefore = accState();
    i.doneAt = when || Date.now();
    i.doneNote = note;
    i.exp = expFor(i);
    save();
    const after = levelInfo(), accAfter = accState();
    const newAcc = CAT_KEYS.filter((c) => accAfter[c] && !accBefore[c]);
    const stB = stageOf(before.lv), stA = stageOf(after.lv);
    const next = nextChallenge(i);
    openSheet(`
      <div class="celebrate">
        <div class="pet-art jump">${hamster({ stage: stA.k, acc: accAfter, puff: true })}</div>
        <p class="gain">+${i.exp}<small>exp</small></p>
        ${after.lv > before.lv ? `<p class="lvup">レベルアップ！ Lv.${before.lv} → <b>Lv.${after.lv}</b></p>` : `<p class="lead">次のレベルまで あと${after.need - after.cur}exp</p>`}
        ${stA.k > stB.k ? `<p class="unlock">${esc(S.pet.name)}が「${stA.name}」に育った！</p>` : ''}
        ${newAcc.map((c) => `<p class="unlock">「${ACCS[c]}」を手に入れた！</p>`).join('')}
      </div>
      ${next ? `<div class="next"><p class="next-label">次はこれ、どう？</p>${row(next)}</div>` : ''}
      <button class="btn big ghost" type="button" data-act="close">とじる</button>`);
    render();
  }

  // ---------- シート:入れる・編集 ----------
  // preset: 最初から入れておく値 / opts.search: 場所さがしに入れておく言葉 / opts.done: 「もうやった！」で開く
  function openEdit(id, preset = {}, opts = {}) {
    const src = id ? getItem(id) : null;
    const dr = src
      ? JSON.parse(JSON.stringify(src))
      : Object.assign({ cat: UI.filter !== 'all' ? UI.filter : 'go', tag: '', title: '', memo: '', link: '', diff: 1, time: 'm', budget: 0, place: null, radius: S.settings.radius }, preset);
    const radios = (name, list, val) => `<div class="seg" role="radiogroup">${list.map(([v, l]) => `<label class="seg-opt"><input type="radio" name="${name}" value="${v}"${String(val) === String(v) ? ' checked' : ''}><span>${l}</span></label>`).join('')}</div>`;
    const today = todayKey();

    openSheet(`
      <div class="sheet-head"><h2 class="sheet-title">${src ? '編集する' : opts.done ? 'もうやったことを記録' : 'ほおぶくろに入れる'}</h2>${src || opts.done ? '' : '<button class="link-btn head-link" type="button" data-act="ideas" data-v="list">アイデアから選ぶ</button>'}<button class="icon-btn" type="button" data-act="close" aria-label="閉じる">${ic('close')}</button></div>
      <form id="editForm" class="form" novalidate>
        <fieldset class="field"><legend>種類</legend>
          <div class="cat-pick">${CAT_KEYS.map((c) => `<label class="cat-opt cat-${c}"><input type="radio" name="cat" value="${c}"${dr.cat === c ? ' checked' : ''}><span>${ic(c)}${CATS[c].label}</span></label>`).join('')}</div>
          <div class="tag-pick" id="tagPick"></div>
        </fieldset>
        <label class="field"><span>なにをする？</span><input id="fTitle" name="title" type="text" maxlength="80" value="${esc(dr.title)}" placeholder="${esc(CATS[dr.cat].ph)}"></label>

        <fieldset class="field" id="placeField"><legend>場所 <small>（なくてもOK）</small></legend>
          <div id="placeBox"></div>
          <div id="placeFind">
            <div class="search big-search">${ic('search')}<input id="fSearch" type="search" placeholder="場所やお店の名前でさがす" enterkeyhint="search" autocomplete="off" aria-label="場所やお店の名前でさがす"><button class="btn" type="button" id="fSearchBtn">さがす</button></div>
            <div class="results" id="fResults"></div>
            <div class="place-tools"><button class="btn small ghost" type="button" data-pl="here">${ic('locate')}いまいる場所</button><button class="btn small ghost" type="button" data-pl="map">${ic('map')}地図でえらぶ</button></div>
          </div>
          <div id="pickWrap" hidden><div class="pick-map" id="pickMap"></div><p class="hint" id="pickHint">番号のピンか、地図をタップした所を場所にするよ。</p></div>
        </fieldset>
        <button class="btn ghost add-place" type="button" id="addPlaceBtn" hidden>${ic('go')}場所もつける</button>

        <label class="field"><span>リンク <small>（記事・SNS・食べログ・Googleマップなど）</small></span><input id="fLink" name="link" type="url" inputmode="url" placeholder="https://…" value="${esc(dr.link)}"></label>
        <p class="hint" id="fLinkHint" hidden></p>
        <label class="field"><span>メモ</span><textarea id="fMemo" name="memo" rows="2" placeholder="気になった理由、だれと行きたいか など">${esc(dr.memo)}</textarea></label>
        <fieldset class="field"><legend>むずかしさ</legend>${radios('diff', [[1, 'かんたん'], [2, 'ふつう'], [3, 'むずかしい']], dr.diff)}</fieldset>
        <fieldset class="field"><legend>かかる時間</legend>${radios('time', TIME_KEYS.map((k) => [k, TIMES[k].label]), dr.time)}</fieldset>
        <label class="field"><span>予算</span><select id="fBudget" name="budget">${BUDGETS.map((b, k) => `<option value="${k}"${dr.budget === k ? ' selected' : ''}>${b}</option>`).join('')}</select></label>

        ${src ? '' : `<fieldset class="field done-field"><legend>もうやった？</legend>
          <label class="switch"><input type="checkbox" id="fDone"${opts.done ? ' checked' : ''}>もうやった！（思い出として記録する）</label>
          <div id="doneExtra"${opts.done ? '' : ' hidden'}>
            <label class="field inline"><span>やった日</span><input id="fDoneDate" type="date" max="${today}" value="${today}"></label>
            <label class="field"><span>ひとこと</span><textarea id="fDoneNote" rows="2" placeholder="どうだった？ だれと？"></textarea></label>
          </div>
        </fieldset>`}
        <p class="err" id="fErr" hidden></p>
        <button class="btn big" type="submit" id="fSubmit">${src ? '保存する' : opts.done ? '思い出に記録する' : 'ほおぶくろに入れる'}</button>
      </form>`, (el) => {
      const form = $('#editForm', el);
      const titleEl = $('#fTitle', el), searchEl = $('#fSearch', el), resEl = $('#fResults', el), findEl = $('#placeFind', el);
      let pick = null, pickMarker = null, resultLayer = null, seq = 0, timer = null;
      let showPlace = CATS[dr.cat].place || !!dr.place || !!opts.search;

      const showErr = (msg) => { const e = $('#fErr', el); e.textContent = msg; e.hidden = !msg; };

      function renderTags() {
        const tags = CATS[currentCat()].tags;
        if (!tags.includes(dr.tag)) dr.tag = '';
        $('#tagPick', el).innerHTML = tags.map((t) => `<button type="button" class="tag-b cat-${currentCat()}" data-tag="${esc(t)}" aria-pressed="${dr.tag === t}">${esc(t)}</button>`).join('');
      }
      const currentCat = () => (form.querySelector('input[name="cat"]:checked') || {}).value || dr.cat;

      function renderPlaceVisibility() {
        $('#placeField', el).hidden = !showPlace;
        $('#addPlaceBtn', el).hidden = showPlace;
      }

      const setPickMarker = () => {
        if (!pick) return;
        if (pickMarker) { pickMarker.remove(); pickMarker = null; }
        if (dr.place) {
          pickMarker = L.marker([dr.place.lat, dr.place.lng], { icon: pinIcon('is-pick', 'check'), interactive: false }).addTo(pick);
          pick.setView([dr.place.lat, dr.place.lng], Math.max(pick.getZoom(), 16));
        }
      };
      const setPlace = (p, fillName) => {
        dr.place = { lat: +(+p.lat).toFixed(6), lng: +(+p.lng).toFixed(6), name: p.name || '' };
        if (resultLayer) resultLayer.clearLayers();
        resEl.innerHTML = '';
        renderPlace();
        setPickMarker();
        if (fillName && !dr.place.name) {
          const target = dr.place;
          reverseName(target).then((n) => { if (n && dr.place === target && !target.name) { target.name = n; renderPlace(); } });
        }
      };
      // 候補から「ここ！」を選んだとき
      const choose = (r) => {
        setPlace({ lat: r.lat, lng: r.lng, name: r.name });
        if (!titleEl.value.trim()) titleEl.value = r.name;
      };

      function renderPlace() {
        const box = $('#placeBox', el);
        findEl.hidden = !!dr.place;
        if (!dr.place) { box.innerHTML = ''; $('#pickHint', el).textContent = '番号のピンか、地図をタップした所を場所にするよ。'; return; }
        const d = UI.pos ? distM(UI.pos, dr.place) : null;
        $('#pickHint', el).textContent = 'ちがったら、地図をタップして直せるよ。';
        box.innerHTML = `
          <div class="place-card chosen">${ic('check')}<div>
            <small class="chosen-label">ここに決定</small>
            <input id="fPlaceName" type="text" maxlength="60" value="${esc(dr.place.name)}" placeholder="場所の名前（例：〇〇カフェ）" aria-label="場所の名前">
            <span>${d != null ? `ここから${fmtDist(d)}` : `${dr.place.lat.toFixed(4)}, ${dr.place.lng.toFixed(4)}`}</span>
          </div></div>
          <label class="field inline"><span>近づいたら</span><select id="fRadius">${RADII.map((r) => `<option value="${r}"${dr.radius === r ? ' selected' : ''}>${fmtDist(r)}以内でお知らせ</option>`).join('')}<option value="0"${!dr.radius ? ' selected' : ''}>お知らせしない</option></select></label>
          <div class="place-tools"><button class="btn small ghost" type="button" data-pl="map">${ic('map')}地図で見る・直す</button><button class="btn small ghost" type="button" data-pl="clear">えらびなおす</button></div>`;
        $('#fPlaceName', box).addEventListener('input', (e) => { if (dr.place) dr.place.name = e.target.value; });
        $('#fRadius', box).addEventListener('change', (e) => { dr.radius = +e.target.value; });
      }

      function openPick() {
        $('#pickWrap', el).hidden = false;
        if (!window.L) { $('#pickMap', el).innerHTML = '<p class="empty">地図を読みこめなかったよ。</p>'; return false; }
        if (!pick) {
          const c = dr.place || UI.pos || { lat: 35.681, lng: 139.767 };
          pick = L.map($('#pickMap', el), { zoomControl: true }).setView([c.lat, c.lng], dr.place || UI.pos ? 15 : 11);
          L.tileLayer(TILE, { maxZoom: 18, attribution: TILE_ATTR }).addTo(pick);
          resultLayer = L.layerGroup().addTo(pick);
          pick.on('click', (e) => setPlace({ lat: e.latlng.lat, lng: e.latlng.lng }, true));
          setPickMarker();
        }
        pick.invalidateSize();
        return true;
      }

      function showResults(list) {
        resEl.innerHTML = list.map((r, k) => `<button class="result" type="button" data-k="${k}"><span class="num">${k + 1}</span><span class="result-main"><b>${esc(r.name)}</b><small>${esc(r.sub || '')}</small></span>${r.d != null ? `<span class="result-d">${fmtDist(r.d)}</span>` : ''}</button>`).join('');
        $$('.result', resEl).forEach((b) => b.addEventListener('click', () => choose(list[+b.dataset.k])));
        if (!openPick()) return;
        resultLayer.clearLayers();
        list.forEach((r, k) => L.marker([r.lat, r.lng], { icon: numIcon(k + 1), title: r.name }).on('click', () => choose(r)).addTo(resultLayer));
        const pts = list.map((r) => [r.lat, r.lng]);
        if (pts.length === 1) pick.setView(pts[0], 16);
        else pick.fitBounds(pts, { padding: [30, 30], maxZoom: 16 });
      }

      async function runSearch(q, deep) {
        q = (q || '').trim();
        if (!q) return;
        const coords = parseMapText(q);
        if (coords) { setPlace(coords, true); return; }
        const my = ++seq;
        resEl.innerHTML = '<p class="hint">さがしてるよ…</p>';
        const list = await searchPlaces(q, deep);
        if (my !== seq || dr.place) return;
        if (!list.length) {
          resEl.innerHTML = deep
            ? '<p class="hint">見つからなかった…。地名やエリアを足すか（例：「一蘭 渋谷」）、「地図でえらぶ」でタップしてね。</p>'
            : '<p class="hint">「さがす」を押すと、もっと広くさがすよ。</p>';
          return;
        }
        showResults(list);
      }

      function onLink() {
        const v = $('#fLink', el).value.trim();
        const hint = $('#fLinkHint', el);
        hint.hidden = true;
        if (!v) return;
        const p = parseMapText(v);
        if (p) {
          showPlace = true; renderPlaceVisibility();
          if (!dr.place) setPlace(p, true);
          if (!titleEl.value.trim() && p.name) titleEl.value = p.name;
          hint.textContent = 'Googleマップの場所を読みこんだよ。';
          hint.hidden = false;
        } else if (/maps\.app\.goo\.gl|goo\.gl\/maps/.test(v) && !dr.place) {
          hint.textContent = '短いGoogleマップのリンクからは場所が読めないの。上の「場所」で名前をさがしてね。';
          hint.hidden = false;
          showPlace = true; renderPlaceVisibility();
        }
      }

      el.addEventListener('click', (e) => {
        const tb = e.target.closest('[data-tag]');
        if (tb) { dr.tag = dr.tag === tb.dataset.tag ? '' : tb.dataset.tag; renderTags(); return; }
        const b = e.target.closest('[data-pl]');
        if (!b) return;
        const a = b.dataset.pl;
        if (a === 'clear') {
          dr.place = null;
          if (pickMarker) { pickMarker.remove(); pickMarker = null; }
          renderPlace();
          searchEl.focus();
        } else if (a === 'map') {
          openPick();
          $('#pickWrap', el).scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else if (a === 'here') {
          b.disabled = true;
          getPos().then((p) => { setPlace({ lat: p.lat, lng: p.lng }, true); openPick(); setPickMarker(); }).catch((m) => { showErr(m); b.disabled = false; });
        }
      });
      $('#addPlaceBtn', el).addEventListener('click', () => { showPlace = true; renderPlaceVisibility(); searchEl.focus(); });
      $$('input[name="cat"]', form).forEach((r) => r.addEventListener('change', () => {
        titleEl.placeholder = CATS[r.value].ph;
        if (CATS[r.value].place) showPlace = true;
        renderPlaceVisibility();
        renderTags();
      }));
      searchEl.addEventListener('input', () => {
        clearTimeout(timer);
        const q = searchEl.value.trim();
        if (q.length < 2) { seq++; resEl.innerHTML = ''; return; }
        timer = setTimeout(() => runSearch(q, false), 450);
      });
      searchEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); clearTimeout(timer); runSearch(searchEl.value, true); } });
      $('#fSearchBtn', el).addEventListener('click', () => { clearTimeout(timer); runSearch(searchEl.value, true); });
      $('#fLink', el).addEventListener('change', onLink);
      $('#fLink', el).addEventListener('paste', () => setTimeout(onLink, 0));
      const doneCb = $('#fDone', el);
      if (doneCb) doneCb.addEventListener('change', () => {
        $('#doneExtra', el).hidden = !doneCb.checked;
        $('#fSubmit', el).textContent = doneCb.checked ? '思い出に記録する' : 'ほおぶくろに入れる';
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const title = String(fd.get('title') || '').trim();
        if (!title) { showErr('「なにをする？」を書いてね。'); titleEl.focus(); return; }
        let link = String(fd.get('link') || '').trim();
        if (link && !/^https?:\/\//i.test(link)) link = 'https://' + link;
        const data = {
          cat: fd.get('cat'), tag: dr.tag, title, link, memo: String(fd.get('memo') || '').trim(),
          diff: +fd.get('diff'), time: fd.get('time'), budget: +fd.get('budget'),
          place: dr.place ? { lat: dr.place.lat, lng: dr.place.lng, name: dr.place.name.trim() } : null,
          radius: dr.place ? dr.radius : S.settings.radius,
        };
        // いま目の前にいる場所を入れた直後に通知が鳴らないように
        const here = data.place && UI.pos && data.radius && distM(UI.pos, data.place) <= data.radius;
        if (src) {
          const moved = JSON.stringify(src.place) !== JSON.stringify(data.place);
          Object.assign(src, data, { sample: false });
          if (moved) src.lastNotified = here ? Date.now() : 0;
          save();
          closeSheet();
          toast('保存したよ');
          render();
          return;
        }
        const item = Object.assign(baseItem(), data, { id: uid(), createdAt: Date.now(), lastNotified: here ? Date.now() : 0 });
        S.items.unshift(item);
        if (doneCb && doneCb.checked) {
          // 「もうやった！」→ そのまま思い出に。お祝い画面にうつる
          const dv = $('#fDoneDate', el).value;
          let when = Date.now();
          if (dv && dv !== today) { const [y, m, d] = dv.split('-').map(Number); when = new Date(y, m - 1, d, 12).getTime(); }
          item.createdAt = Math.min(item.createdAt, when);
          finishItem(item.id, $('#fDoneNote', el).value.trim(), when);
          return;
        }
        save();
        closeSheet();
        toast('ほおぶくろに入れたよ！');
        render();
      });

      renderTags();
      renderPlaceVisibility();
      renderPlace();
      if (dr.place) { openPick(); if (!dr.place.name) setPlace(dr.place, true); }
      if (opts.search && !dr.place) { searchEl.value = opts.search; runSearch(opts.search, true); }
      return () => { clearTimeout(timer); if (pick) { pick.remove(); pick = null; } };
    });
  }

  // ---------- アイデア ----------
  // [種類, タグ, やること, むずかしさ, 時間]
  const IDEAS = [
    ['go', 'おでかけ', '近所の知らない道を散歩してみる', 1, 's'],
    ['go', 'おでかけ', '降りたことない駅で降りてみる', 1, 'h'],
    ['go', 'おでかけ', '夜景がきれいな場所に行く', 1, 'm'],
    ['go', 'おでかけ', '美術館の企画展を見に行く', 1, 'h'],
    ['go', 'おでかけ', '水族館に行く', 1, 'h'],
    ['go', 'おでかけ', '日帰り温泉でのんびりする', 2, 'h'],
    ['go', '自然', '季節の花を見に行く', 1, 'h'],
    ['go', '自然', '星がよく見える場所で星を見る', 2, 'h'],
    ['go', 'イベント', '花火大会に行く', 2, 'h'],
    ['go', 'イベント', '地元のお祭りに行く', 1, 'h'],
    ['go', '旅行', '行ったことない県に旅行する', 3, 't'],
    ['go', '旅行', '一泊で温泉旅行に行く', 3, 't'],
    ['eat', 'お店', '気になってた近所のお店に入ってみる', 1, 'm'],
    ['eat', 'お店', '朝ごはんを外で食べる', 1, 's'],
    ['eat', 'お店', '行列ができるお店に並んでみる', 2, 'm'],
    ['eat', 'グルメ', 'ご当地グルメを食べに行く', 2, 'd'],
    ['eat', 'グルメ', 'フルーツ狩りに行く', 2, 'h'],
    ['eat', '作ってみる', 'スパイスから本格カレーを作る', 2, 'h'],
    ['eat', '作ってみる', 'パンを焼いてみる', 2, 'h'],
    ['eat', 'お取り寄せ', '気になってたお取り寄せグルメを頼む', 1, 's'],
    ['do', '家族', '子どもとキャッチボールする', 1, 'm'],
    ['do', '家族', '家族でピクニックする', 1, 'h'],
    ['do', '家族', '子どもの行事の写真をアルバムにまとめる', 2, 'h'],
    ['do', 'スポーツ', 'バッティングセンターに行く', 1, 'm'],
    ['do', 'スポーツ', 'ボウリングでスコア150を目指す', 2, 'm'],
    ['do', 'スポーツ', '10km歩いてみる', 2, 'h'],
    ['do', 'スポーツ', '日帰りで山に登る', 3, 'd'],
    ['do', '体験', '早起きして朝焼けを見る', 2, 's'],
    ['do', '体験', '陶芸やものづくりの体験をする', 2, 'h'],
    ['do', '体験', 'キャンプで一泊する', 3, 't'],
    ['watch', '映画', '話題の映画を映画館で観る', 1, 'm'],
    ['watch', '映画', 'ずっと観てなかった名作映画を観る', 1, 'm'],
    ['watch', 'ドラマ', '話題のドラマを1話から一気に観る', 2, 'd'],
    ['watch', 'アニメ', '子どもがハマってるアニメを一緒に観る', 1, 'm'],
    ['watch', 'ライブ', '好きなアーティストのライブに行く', 2, 'h'],
    ['watch', 'ライブ', 'お笑いや落語を生で観る', 2, 'h'],
    ['watch', 'スポーツ観戦', 'プロ野球を球場で観戦する', 2, 'h'],
    ['learn', '本', '積んでる本を1冊読みきる', 2, 'h'],
    ['learn', '本', '図書館で気になる本を借りる', 1, 'm'],
    ['learn', '本', '本屋で直感で1冊えらんで読む', 1, 'h'],
    ['learn', '勉強', 'お金の基本を勉強する', 2, 'h'],
    ['learn', '勉強', '英語のフレーズを毎日1つ覚える', 1, 's'],
    ['learn', '資格', '気になる資格の勉強を始める', 3, 'd'],
    ['learn', '講座', 'オンライン講座を1つ受けてみる', 2, 'h'],
    ['learn', '講座', '料理教室に参加する', 2, 'h'],
    ['try', '流行り', 'いま流行ってるスイーツを食べてみる', 1, 's'],
    ['try', '流行り', 'サウナで「ととのう」を体験する', 1, 'm'],
    ['try', '流行り', 'SNSで話題のレシピを作ってみる', 1, 'm'],
    ['try', '新商品', 'コンビニの新商品を試す', 1, 's'],
    ['try', '新商品', '気になってたアプリを使ってみる', 1, 's'],
    ['try', '習慣', '1週間早起きしてみる', 2, 's'],
    ['try', '習慣', '日記を1週間つけてみる', 1, 's'],
    ['try', 'チャレンジ', 'いつもと違う髪型にしてみる', 2, 'm'],
    ['buy', 'ほしい物', '新しいスニーカーを買う', 1, 'm'],
    ['buy', 'ほしい物', 'ちょっといい文房具を買う', 1, 's'],
    ['buy', 'ギフト', '家族にサプライズでプレゼントを贈る', 2, 'm'],
    ['buy', '家のもの', 'ちょっといい枕に買いかえる', 1, 'm'],
    ['buy', '家のもの', '観葉植物を1つ迎える', 1, 's'],
  ].map(([cat, tag, title, diff, time]) => ({ cat, tag, title, diff, time, place: null }));

  // 地図データ(OpenStreetMap)の種類 → どんなやりたいにするか
  const SPOT = {
    park: { cat: 'go', tag: 'おでかけ', kind: '公園', diff: 1, time: 'm', t: (n) => `${n}を散歩する` },
    garden: { cat: 'go', tag: '自然', kind: '庭園', diff: 1, time: 'm', t: (n) => `${n}をのんびり歩く` },
    museum: { cat: 'go', tag: 'おでかけ', kind: '博物館・美術館', diff: 1, time: 'h', t: (n) => `${n}に行ってみる` },
    gallery: { cat: 'go', tag: 'おでかけ', kind: 'ギャラリー', diff: 1, time: 'm', t: (n) => `${n}をのぞいてみる` },
    attraction: { cat: 'go', tag: 'おでかけ', kind: '観光スポット', diff: 1, time: 'm', t: (n) => `${n}に行ってみる` },
    viewpoint: { cat: 'go', tag: '自然', kind: '展望スポット', diff: 1, time: 'm', t: (n) => `${n}から景色を見る` },
    zoo: { cat: 'go', tag: 'おでかけ', kind: '動物園', diff: 2, time: 'h', t: (n) => `${n}に行く` },
    aquarium: { cat: 'go', tag: 'おでかけ', kind: '水族館', diff: 2, time: 'h', t: (n) => `${n}に行く` },
    theme_park: { cat: 'go', tag: 'おでかけ', kind: 'テーマパーク', diff: 2, time: 'd', t: (n) => `${n}で1日遊ぶ` },
    public_bath: { cat: 'go', tag: 'おでかけ', kind: '温泉・銭湯', diff: 1, time: 'm', t: (n) => `${n}でひとっ風呂` },
    place_of_worship: { cat: 'go', tag: 'おでかけ', kind: '寺社', diff: 1, time: 'm', t: (n) => `${n}にお参りする` },
    sports_centre: { cat: 'do', tag: 'スポーツ', kind: 'スポーツ施設', diff: 1, time: 'm', t: (n) => `${n}で体を動かす` },
    stadium: { cat: 'watch', tag: 'スポーツ観戦', kind: 'スタジアム', diff: 2, time: 'h', t: (n) => `${n}で試合を観る` },
    cinema: { cat: 'watch', tag: '映画', kind: '映画館', diff: 1, time: 'm', t: (n) => `${n}で映画を観る` },
    theatre: { cat: 'watch', tag: 'ライブ', kind: '劇場', diff: 2, time: 'h', t: (n) => `${n}で舞台を観る` },
    library: { cat: 'learn', tag: '本', kind: '図書館', diff: 1, time: 'm', t: (n) => `${n}で本を借りる` },
    books: { cat: 'learn', tag: '本', kind: '本屋', diff: 1, time: 's', t: (n) => `${n}で気になる本を1冊えらぶ` },
    cafe: { cat: 'eat', tag: 'お店', kind: 'カフェ', diff: 1, time: 's', t: (n) => `${n}でお茶する` },
    restaurant: { cat: 'eat', tag: 'お店', kind: '飲食店', diff: 1, time: 'm', t: (n) => `${n}で食べてみる` },
    bakery: { cat: 'eat', tag: 'お店', kind: 'パン屋', diff: 1, time: 's', t: (n) => `${n}のパンを買ってみる` },
    confectionery: { cat: 'eat', tag: 'お店', kind: 'お菓子屋', diff: 1, time: 's', t: (n) => `${n}のおやつを買ってみる` },
  };
  const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter'];

  async function fetchSpots(pos, r) {
    const lat = pos.lat.toFixed(3), lng = pos.lng.toFixed(3);
    const cacheKey = `hoobukuro:spots:${lat},${lng},${r}`;
    try {
      const c = JSON.parse(sessionStorage.getItem(cacheKey) || 'null');
      if (c && Date.now() - c.t < HOUR) return spotIdeas(c.el, pos);
    } catch (e) { /* 取れなければ聞きに行く */ }
    const a = `(around:${r},${lat},${lng})`;
    // 広い範囲で小さな公園やお店まで取ると重すぎるので、範囲で中身を変える
    const q = r <= 3000
      ? `[out:json][timeout:25];(nw["tourism"~"^(museum|gallery|attraction|viewpoint|zoo|aquarium|theme_park)$"]${a};nw["leisure"~"^(park|garden|sports_centre|stadium)$"]${a};nw["amenity"~"^(cinema|library|public_bath|theatre)$"]${a};)->.s;.s out center tags 250;(nw["amenity"~"^(cafe|restaurant)$"]${a};nw["shop"~"^(bakery|confectionery|books)$"]${a};)->.f;.f out center tags 150;`
      : `[out:json][timeout:25];(nw["tourism"~"^(museum|attraction|viewpoint|zoo|aquarium|theme_park)$"]${a};nw["leisure"~"^(garden|stadium)$"]${a};nw["amenity"~"^(cinema|public_bath|theatre)$"]${a};);out center tags 250;`;
    // 2つのサーバーに同時に聞いて、早く返ってきたほうを使う(40秒で打ち切り)
    const ctrls = OVERPASS.map(() => new AbortController());
    const timer = setTimeout(() => ctrls.forEach((c) => c.abort()), 40000);
    try {
      const j = await Promise.any(OVERPASS.map(async (ep, k) => {
        const res = await fetch(ep, { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, signal: ctrls[k].signal });
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      }));
      const el = (j.elements || []).filter((e) => e.tags && e.tags.name);
      try { sessionStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), el })); } catch (e) { /* 覚えられなくても大丈夫 */ }
      return spotIdeas(el, pos);
    } finally {
      clearTimeout(timer);
      ctrls.forEach((c) => c.abort());
    }
  }
  function spotIdeas(elements, pos) {
    const seen = new Set();
    const all = [];
    for (const el of elements) {
      const t = el.tags || {};
      const lat = el.lat ?? (el.center && el.center.lat), lng = el.lon ?? (el.center && el.center.lon);
      const name = t['name:ja'] || t.name;
      const key = [t.tourism, t.leisure, t.amenity, t.shop].find((k) => k && SPOT[k]);
      if (lat == null || !name || !key || seen.has(name)) continue;
      if (/児童遊園|児童公園|ちびっこ|遊び場|ひろば$|広場$/.test(name)) continue; // 小さすぎる公園ははぶく
      seen.add(name);
      const sp = SPOT[key];
      const place = { lat: +lat.toFixed(6), lng: +lng.toFixed(6), name };
      const d = distM(pos, place);
      all.push({ cat: sp.cat, tag: sp.tag, title: sp.t(name), diff: sp.diff, time: sp.time, place, d, kind: sp.kind, score: d - (t.wikidata ? 600 : 0) - (t.website ? 150 : 0) });
    }
    // 種類がかたよらないように、種類ごとに近い順で交互にならべる
    const byKind = {};
    all.sort((a, b) => a.score - b.score).forEach((x) => { (byKind[x.kind] = byKind[x.kind] || []).push(x); });
    const groups = Object.values(byKind).map((g) => g.slice(0, 5));
    const out = [];
    for (let k = 0; out.length < 40 && groups.some((g) => g[k]); k++) groups.forEach((g) => { if (g[k] && out.length < 40) out.push(g[k]); });
    return out;
  }
  const alreadyIn = (idea) => S.items.some((i) => i.title === idea.title || (idea.place && i.place && i.place.name === idea.place.name && distM(i.place, idea.place) < 200));

  function addIdea(idea) {
    const here = idea.place && UI.pos && distM(UI.pos, idea.place) <= S.settings.radius;
    S.items.unshift(Object.assign(baseItem(), {
      id: uid(), cat: idea.cat, tag: idea.tag, title: idea.title, diff: idea.diff, time: idea.time,
      place: idea.place ? { ...idea.place } : null, radius: S.settings.radius, lastNotified: here ? Date.now() : 0,
    }));
    save();
    render();
  }

  function openIdeas(mode = 'near') {
    const st = { mode, cat: 'all', radius: 1000, spots: {}, loading: false, err: '' };
    let list = [];
    openSheet(`
      <div class="sheet-head"><h2 class="sheet-title">アイデアをもらう</h2><button class="icon-btn" type="button" data-act="close" aria-label="閉じる">${ic('close')}</button></div>
      <p class="lead">気になったら「＋」でほおぶくろに入れてね。タップすると中身を変えてから入れられるよ。</p>
      <div class="seg" role="group" aria-label="アイデアの種類" id="ideaMode"></div>
      <div id="ideaBody"></div>`, (el) => {
      const body = $('#ideaBody', el);

      const ideaRow = (x, k) => {
        const added = alreadyIn(x);
        const chips = [`<span class="chip tagc cat-${x.cat}">${esc(x.kind || x.tag)}</span>`, `<span class="chip">${DIFFS[x.diff].label}</span>`, `<span class="chip">${TIMES[x.time].label}</span>`];
        if (x.d != null) chips.unshift(`<span class="chip hi">${fmtDist(x.d)}</span>`);
        return `<div class="idea">
          <button class="idea-main" type="button" data-iedit="${k}"><span class="cat-ic cat-${x.cat}">${ic(x.cat)}</span><span class="row-main"><span class="row-title">${esc(x.title)}</span><span class="chips">${chips.join('')}</span></span></button>
          <button class="idea-add${added ? ' is-added' : ''}" type="button" data-iadd="${k}" aria-label="${added ? '入れ済み' : 'ほおぶくろに入れる'}"${added ? ' disabled' : ''}>${ic(added ? 'check' : 'plus')}</button>
        </div>`;
      };

      function draw() {
        $('#ideaMode', el).innerHTML = segBtns('imode', [['near', '近くのスポット'], ['list', 'いろんなアイデア']], st.mode).replace(/data-act="imode"/g, 'data-imode="1"');
        const catChips = `<div class="filters in-sheet" role="group" aria-label="種類">${[['all', 'すべて'], ...CAT_KEYS.map((c) => [c, CATS[c].label])].map(([k, l]) => `<button class="fchip ${k !== 'all' ? 'cat-' + k : ''}" type="button" data-icat="${k}" aria-pressed="${st.cat === k}">${k !== 'all' ? ic(k) : ''}${l}</button>`).join('')}</div>`;
        if (st.mode === 'list') {
          list = IDEAS.filter((x) => st.cat === 'all' || x.cat === st.cat)
            .map((x) => ({ x, s: rnd(x.title + todayKey()) + (alreadyIn(x) ? 2 : 0) }))
            .sort((a, b) => a.s - b.s).map((o) => o.x);
          body.innerHTML = `${catChips}<div class="rows">${list.map(ideaRow).join('')}</div>`;
          return;
        }
        const radSeg = `<div class="seg" role="group" aria-label="範囲">${[[1000, '歩いて 1km'], [3000, '自転車 3km'], [10000, '車 10km']].map(([r, l]) => `<button type="button" data-irad="${r}" aria-pressed="${st.radius === r}">${l}</button>`).join('')}</div>`;
        if (!UI.pos) {
          body.innerHTML = `<p class="hint">現在地のまわりの公園・美術館・カフェ・映画館・図書館・温泉などから、できそうなことを出すよ。</p>
            ${UI.locErr ? `<p class="err">${esc(UI.locErr)}</p>` : ''}<button class="btn" type="button" data-iloc="1">${ic('locate')}現在地を使う</button>`;
          return;
        }
        if (st.loading) { body.innerHTML = `${radSeg}<p class="hint">近くをさがしてるよ…（少し時間がかかることがあるよ）</p>`; return; }
        if (st.err) { body.innerHTML = `${radSeg}<p class="err">${esc(st.err)}</p><button class="btn ghost" type="button" data-iretry="1">もう一回さがす</button>`; return; }
        const spots = st.spots[st.radius];
        if (!spots) { loadSpots(); return; }
        list = spots.filter((x) => st.cat === 'all' || x.cat === st.cat);
        body.innerHTML = `${radSeg}${catChips}${list.length ? `<div class="rows">${list.map(ideaRow).join('')}</div>` : '<p class="empty">この範囲では見つからなかったよ。範囲を広げてみてね。</p>'}<p class="hint small">場所のデータ：OpenStreetMap。のってないお店もあるよ。</p>`;
      }

      async function loadSpots() {
        st.loading = true; st.err = ''; draw();
        const r = st.radius;
        try { st.spots[r] = await fetchSpots(UI.pos, r); } catch (e) { st.err = '近くのスポットを取ってこれなかった…。電波のいいところで、もう一回ためしてね。'; }
        st.loading = false;
        if (!$('#ideaBody')) return; // シートが閉じられた
        draw();
      }

      el.addEventListener('click', (e) => {
        const t = e.target.closest('[data-imode],[data-icat],[data-irad],[data-iadd],[data-iedit],[data-iloc],[data-iretry]');
        if (!t) return;
        const ds = t.dataset;
        if (ds.imode) { st.mode = t.dataset.v; draw(); }
        else if (ds.icat) { st.cat = ds.icat; draw(); }
        else if (ds.irad) { st.radius = +ds.irad; draw(); }
        else if (ds.iretry) { delete st.spots[st.radius]; loadSpots(); }
        else if (ds.iloc) {
          t.disabled = true;
          getPos().then(() => draw()).catch((m) => { UI.locErr = m; draw(); });
        } else if (ds.iadd) {
          const x = list[+ds.iadd];
          if (!x || alreadyIn(x)) return;
          addIdea(x);
          toast(`「${x.title}」を入れたよ！`);
          draw();
        } else if (ds.iedit) {
          const x = list[+ds.iedit];
          if (x) openEdit(null, { cat: x.cat, tag: x.tag, title: x.title, diff: x.diff, time: x.time, place: x.place ? { ...x.place } : null });
        }
      });
      draw();
    });
  }

  // ---------- シート:設定 ----------
  function openSettings() {
    const perm = 'Notification' in window ? Notification.permission : 'unsupported';
    const hasSamples = S.items.some((i) => i.sample);
    const notifyHint = {
      denied: '通知がブロックされてるよ。Chromeのサイト設定で「通知」を許可してね。',
      unsupported: 'このブラウザは通知に対応してないみたい。',
    }[perm] || 'いまは試作版なので、ほおぶくろを開いている間だけ見張ってるよ。歩きながら使うなら「おさんぽモード」がおすすめ。';
    openSheet(`
      <div class="sheet-head"><h2 class="sheet-title">設定</h2><button class="icon-btn" type="button" data-act="close" aria-label="閉じる">${ic('close')}</button></div>
      <form id="setForm" class="form">
        <label class="field"><span>ハムスターの名前</span><input id="sName" type="text" maxlength="12" value="${esc(S.pet.name)}"></label>
        <fieldset class="field"><legend>お知らせ</legend>
          <label class="switch"><input type="checkbox" id="sNotify"${S.settings.notify && perm === 'granted' ? ' checked' : ''}${perm === 'unsupported' ? ' disabled' : ''}>行きたい所に近づいたら通知する</label>
          <p class="hint" id="sNotifyHint">${notifyHint}</p>
          <label class="field inline"><span>最初の範囲</span><select id="sRadius">${RADII.map((r) => `<option value="${r}"${S.settings.radius === r ? ' selected' : ''}>${fmtDist(r)}以内</option>`).join('')}</select></label>
          <button class="btn small ghost" type="button" id="sTest">ためしに通知してみる</button>
        </fieldset>
        <fieldset class="field"><legend>データ</legend>
          <p class="hint">データはこのスマホの中だけに入ってるよ。機種変更にそなえて、ときどきバックアップしてね。</p>
          <div class="btn-row"><button class="btn ghost" type="button" data-act="export">バックアップを保存</button><label class="btn ghost file-btn">バックアップから戻す<input type="file" id="sImport" accept="application/json,.json" hidden></label></div>
          <div id="importZone"></div>
          ${hasSamples ? '<button class="btn ghost" type="button" data-act="clearSamples">サンプルを消す</button>' : ''}
          <div class="sheet-foot" id="resetZone"><button class="btn ghost danger" type="button" data-act="resetAsk">ぜんぶ消す</button></div>
        </fieldset>
        <button class="btn big" type="submit">保存する</button>
      </form>`, (el) => {
      const cb = $('#sNotify', el);
      cb.addEventListener('change', () => {
        if (cb.checked && Notification.permission !== 'granted') {
          Notification.requestPermission().then((p) => {
            if (p !== 'granted') { cb.checked = false; $('#sNotifyHint', el).textContent = '通知が許可されなかったよ。Chromeのサイト設定から許可できるよ。'; }
          });
        }
      });
      $('#sTest', el).addEventListener('click', () => {
        if (!('Notification' in window) || Notification.permission !== 'granted') { toast('先に通知をオンにしてね'); return; }
        navigator.serviceWorker.ready
          .then((reg) => reg.showNotification('ほおぶくろ', { body: 'こんな感じでお知らせするよ！', icon: 'icons/icon-192.png', badge: 'icons/badge-96.png', tag: 'test' }))
          .catch(() => toast('通知を出せなかったよ'));
      });
      $('#sImport', el).addEventListener('change', (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = () => {
          let d = null;
          try { d = normalize(JSON.parse(reader.result)); } catch (err) { d = null; }
          const z = $('#importZone', el);
          if (!d) { z.innerHTML = '<p class="err">ほおぶくろのバックアップじゃないみたい。</p>'; return; }
          z.innerHTML = `<div class="sheet-foot"><p>${d.items.length}個入ってるよ。いまのデータと置きかえる？</p><button class="btn danger-fill" type="button" id="impYes">置きかえる</button><button class="btn ghost" type="button" id="impNo">やめる</button></div>`;
          $('#impYes', z).addEventListener('click', () => { S = d; save(); closeSheet(); render(); toast('バックアップから戻したよ'); });
          $('#impNo', z).addEventListener('click', () => { z.innerHTML = ''; e.target.value = ''; });
        };
        reader.readAsText(f);
      });
      $('#setForm', el).addEventListener('submit', (e) => {
        e.preventDefault();
        S.pet.name = $('#sName', el).value.trim() || 'ぼた';
        S.settings.notify = cb.checked && 'Notification' in window && Notification.permission === 'granted';
        S.settings.radius = +$('#sRadius', el).value;
        save();
        closeSheet();
        render();
        toast('設定を保存したよ');
      });
    });
  }

  function exportData() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = `hoobukuro-${todayKey().replace(/-/g, '')}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast('バックアップを保存したよ');
  }

  // ---------- トースト ----------
  let toastTimer = null;
  function toast(msg, action) {
    const t = $('#toast');
    t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button class="toast-btn" type="button">${esc(action.label)}</button>` : ''}`;
    if (action) t.querySelector('button').onclick = () => { t.classList.remove('show'); action.fn(); };
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), action ? 8000 : 2600);
  }

  // ---------- ボタンの動き ----------
  const actions = {
    tab: (b) => { UI.tab = b.dataset.tab; render(); window.scrollTo(0, 0); },
    add: () => openEdit(null),
    logDone: () => openEdit(null, { cat: 'do' }, { done: true }),
    ideas: (b) => openIdeas(b.dataset.v || 'near'),
    open: (b) => openDetail(b.dataset.id),
    close: () => closeSheet(),
    settings: () => openSettings(),
    locate: () => { UI.locErr = ''; startWatch(); render(); },
    walkStart: () => startWalk(),
    walkStop: () => stopWalk(),
    accInfo: (b) => {
      const c = b.dataset.v, n = doneIn(c);
      toast(n >= ACC_NEED ? `「${ACCS[c]}」ゲット済み！` : `${CATS[c].label}を${ACC_NEED}回かなえると、なにかもらえるよ（いま${n}回）`);
    },
    mapLocate: () => {
      if (UI.pos && map) map.setView([UI.pos.lat, UI.pos.lng], 15);
      else getPos().then((p) => map && map.setView([p.lat, p.lng], 15)).catch((m) => toast(m));
    },
    sugTime: (b) => { UI.sugTime = b.dataset.v; render(); },
    sugMood: (b) => { UI.sugMood = b.dataset.v; render(); },
    reshuffle: () => { UI.shuffle++; render(); },
    filter: (b) => { UI.filter = b.dataset.v; render(); },
    remindNext: () => {
      const cur = S.remind.id && getItem(S.remind.id);
      if (cur) cur.remindedAt = Date.now();
      S.remind.day = '';
      save(); render();
    },
    complete: (b) => openComplete(b.dataset.id),
    edit: (b) => openEdit(b.dataset.id),
    del: (b) => {
      const i = getItem(b.dataset.id);
      $('#delZone').innerHTML = `<p>「${esc(i.title)}」を消すよ。もとに戻せないけど、いい？</p><button class="btn danger-fill" type="button" data-act="delYes" data-id="${i.id}">消す</button><button class="btn ghost" type="button" data-act="open" data-id="${i.id}">やめる</button>`;
    },
    delYes: (b) => { S.items = S.items.filter((i) => i.id !== b.dataset.id); save(); closeSheet(); render(); toast('消したよ'); },
    undo: (b) => {
      const i = getItem(b.dataset.id);
      Object.assign(i, { doneAt: null, doneNote: '', exp: 0 });
      save(); render(); openDetail(i.id); toast('まだのリストに戻したよ');
    },
    showOnMap: (b) => {
      const i = getItem(b.dataset.id);
      closeSheet();
      UI.tab = 'map'; render();
      if (map && i.place) { map.setView([i.place.lat, i.place.lng], 16); mapFitted = true; }
    },
    clearSamples: () => {
      S.items = S.items.filter((i) => !i.sample);
      save();
      if (!$('#sheet').hidden) closeSheet();
      render(); toast('サンプルを消したよ');
    },
    resetAsk: () => {
      $('#resetZone').innerHTML = '<p>ハムスターの経験値もふくめて、ぜんぶ消えるよ。もとに戻せないけど、いい？</p><button class="btn danger-fill" type="button" data-act="resetYes">ぜんぶ消す</button><button class="btn ghost" type="button" data-act="resetNo">やめる</button>';
    },
    resetNo: () => { $('#resetZone').innerHTML = '<button class="btn ghost danger" type="button" data-act="resetAsk">ぜんぶ消す</button>'; },
    resetYes: () => { S = fresh([]); save(); closeSheet(); UI.tab = 'home'; render(); toast('ぜんぶ消したよ'); },
    export: () => exportData(),
    install: () => {
      const ev = UI.installEvt;
      UI.installEvt = null;
      if (ev) ev.prompt();
      render();
    },
  };

  document.addEventListener('click', (e) => {
    const sheet = $('#sheet');
    if (e.target === sheet) { closeSheet(); return; }
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    const fn = actions[b.dataset.act];
    if (fn) fn(b, e);
  });
  document.addEventListener('change', (e) => {
    if (e.target.id === 'sortSel') {
      UI.sort = e.target.value;
      if (UI.sort === 'near' && !UI.pos && !UI.watching && navigator.permissions) {
        navigator.permissions.query({ name: 'geolocation' }).then((r) => { if (r.state === 'granted') startWatch(); }).catch(() => {});
      }
      render();
    }
    if (e.target.id === 'showDone') { S.settings.showDone = e.target.checked; save(); drawMarkers(); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#sheet').hidden) closeSheet(); });

  // ---------- はじまり ----------
  $$('[data-ic]').forEach((b) => b.insertAdjacentHTML('afterbegin', ic(b.dataset.ic)));

  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); UI.installEvt = e; if (UI.tab === 'home') render(); });
  window.addEventListener('appinstalled', () => { UI.installEvt = null; render(); });

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
    navigator.serviceWorker.addEventListener('message', (e) => { if (e.data && e.data.open) openDetail(e.data.open); });
  }
  if (navigator.permissions) {
    navigator.permissions.query({ name: 'geolocation' }).then((r) => { if (r.state === 'granted') startWatch(); }).catch(() => {});
  }

  render();

  // 通知から開いたとき(#item-xxx)
  const hm = location.hash.match(/^#item-([a-z0-9]+)$/);
  if (hm) { history.replaceState(null, '', location.pathname); openDetail(hm[1]); }

  // ほかのアプリの「共有」から来たとき(Chrome、Googleマップ、食べログ、Instagram など)
  const sp = new URLSearchParams(location.search);
  if (sp.has('text') || sp.has('url') || sp.has('title')) {
    const title = sp.get('title') || '';
    const text = sp.get('text') || '';
    history.replaceState(null, '', location.pathname);
    const urls = (`${sp.get('url') || ''}\n${text}`).match(/https?:\/\/[^\s]+/g) || [];
    const link = urls[0] || '';
    const lines = text.split(/\n+/).map((s) => s.trim()).filter((s) => s && !/https?:\/\//.test(s));
    const name = cleanTitle(title) || cleanTitle(lines[0] || '');
    let place = null;
    for (const u of urls) { place = parseMapText(u); if (place) break; }
    if (place && !place.name) place.name = name;
    const cat = /google\.[^/]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps/.test(link) ? 'go' : guessCat(link);
    const wantsPlace = CATS[cat].place;
    openEdit(null, { cat, title: name, place, link }, { search: !place && wantsPlace ? name : '' });
  }
})();
