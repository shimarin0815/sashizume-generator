import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Copy, Download, Twitter, Link as LinkIcon, RefreshCcw, Share2 } from "lucide-react";
import * as htmlToImage from "html-to-image";

// --- Utility helpers ---
const pick = (arr, rng) => arr[Math.floor(rng() * arr.length) % arr.length];

// Mulberry32 PRNG for stable randomness from seed
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromString(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// --- Data: phrases, emojis, palettes ---
const peopleTitles = [
  "覇者", "番長", "親方", "貴公子", "王", "帝王", "女王", "覇王", "仙人", "神", "妖精",
  "職人", "ソムリエ", "錬金術師", "伝道師", "革命家", "先駆者", "参謀", "エバンジェリスト",
  "監督", "司令塔", "魔術師", "守護神", "勇者", "哲学者", "賢者", "プロデューサー", "大臣", "CEO"
];

const qualifiers = [
  "非公式", "自称", "初代", "令和", "元祖", "純正", "真打", "公認(自分調べ)", "気まぐれ",
  "スピード違反級", "偏愛", "ガチ勢", "界隈最速", "全天候型", "24時間稼働", "兼業", "常設",
];

const connectors = ["界の", "の", "担当の", "方面の", "担当", "係"];

const starters = [
  (kw, rng) => `さしずめ俺は${kw}${pick(connectors, rng)}${pick(peopleTitles, rng)}`,
  (kw, rng) => `さしずめ俺は${pick(qualifiers, rng)}${kw}${pick(connectors, rng)}${pick(peopleTitles, rng)}`,
  (kw, rng) => `さしずめ俺は人間${kw}（の化身）`,
  (kw, rng) => `さしずめ俺は${kw}界の風雲児`,
  (kw, rng) => `さしずめ俺は${kw}アンバサダー`,
  (kw, rng) => `さしずめ俺は${kw}の申し子`,
  (kw, rng) => `さしずめ俺は${kw}請負人`,
  (kw, rng) => `さしずめ俺は${kw}の守護神`,
  (kw, rng) => `さしずめ俺は${kw}の伝道師`,
];

const emojiBanks = {
  food: ["🍔","🍣","🍜","🍛","🍫","🍿","🍩","🍵","☕️","🧃","🥤","🍙","🥟","🍕"],
  sport: ["💪","🏃","🏀","⚽️","🏋️","⛳️","🏸","🎾","🥇"],
  love: ["❤️","💕","💘","💖","💗","💞","💓"],
  tech: ["💻","🖱️","⌨️","🧠","🤖","🔧","🧪"],
  art: ["🎨","🖌️","📸","🎭","🎵","🎬"],
  sleep: ["😴","🛌","🌙","💤"],
  money: ["💰","🪙","💴","📈"],
  coffee: ["☕️","🫘","🥐","🍪"],
  chaos: ["✨","⚡️","🔥","🌈","🌀","🌟","🫨"],
};

function guessEmojis(keyword, rng) {
  const kw = keyword.toLowerCase();
  if (/[珈コこ]ーヒ|coffee/.test(kw)) return pickMany(emojiBanks.coffee, 2, rng);
  if (/寝|睡眠|zzz|sleep/.test(kw)) return pickMany(emojiBanks.sleep, 2, rng);
  if (/筋|ジム|workout|fit|筋トレ/.test(kw)) return pickMany(emojiBanks.sport, 2, rng);
  if (/愛|like|恋|推し/.test(kw)) return pickMany(emojiBanks.love, 2, rng);
  if (/アート|絵|写真|カメラ|paint|art/.test(kw)) return pickMany(emojiBanks.art, 2, rng);
  if (/お金|money|投資|株|稼/.test(kw)) return pickMany(emojiBanks.money, 2, rng);
  if (/IT|AI|tech|ガジェ|PC|プログ/.test(kw)) return pickMany(emojiBanks.tech, 2, rng);
  if (/寿司|ラーメン|ピザ|食|グルメ|飯|food|sweet/.test(kw)) return pickMany(emojiBanks.food, 2, rng);
  return pickMany(emojiBanks.chaos, 2, rng);
}

function pickMany(arr, n, rng) {
  const out = new Set();
  while (out.size < n) out.add(pick(arr, rng));
  return Array.from(out);
}

const palettes = [
  { name: "Neo Pop", from: "from-fuchsia-500", to: "to-amber-400" },
  { name: "Cyber Mint", from: "from-emerald-400", to: "to-cyan-500" },
  { name: "Soda Blue", from: "from-sky-400", to: "to-indigo-500" },
  { name: "Sunset", from: "from-rose-500", to: "to-orange-400" },
  { name: "Grape", from: "from-violet-500", to: "to-pink-400" },
  { name: "Matcha", from: "from-lime-400", to: "to-emerald-500" },
];

// Build title, caption, tags
function buildResult(keyword, variant = 0) {
  const seed = seedFromString(`${keyword}::${variant}`);
  const rng = mulberry32(seed);
  const title = pick(starters, rng)(keyword, rng);
  const emojis = guessEmojis(keyword, rng).join("");
  const full = `${title} ${emojis}`;
  const palette = palettes[Math.floor(rng() * palettes.length) % palettes.length];

  const captions = [
    `さしずめ俺は…『${full}』でした。あなたは？`,
    `診断結果：${full}\n当たってる？#さしずめ俺は` ,
    `${full} だった件。#称号 #診断 #さしずめ俺は`,
  ];
  const caption = pick(captions, rng);
  const tags = [`#さしずめ俺は`, `#診断メーカー`, `#称号`, `#${keyword}`];
  return { full, palette, caption, tags };
}

function encodeParam(str) {
  return encodeURIComponent(str);
}
function decodeParam(str) {
  try { return decodeURIComponent(str || ""); } catch { return str || ""; }
}

// --- Main Component ---
export default function App() {
  const [keyword, setKeyword] = useState("");
  const [variant, setVariant] = useState(0);
  const [result, setResult] = useState(() => buildResult("コーヒー", 0));
  const [permalink, setPermalink] = useState("");
  const cardRef = useRef(null);

  // Hydrate from URL
  useEffect(() => {
    const url = new URL(window.location.href);
    const t = url.searchParams.get("t");
    const k = url.searchParams.get("k");
    const v = parseInt(url.searchParams.get("v") || "0", 10);
    if (t) {
      setResult({
        full: decodeParam(t),
        palette: palettes[v % palettes.length],
        caption: `さしずめ俺は…『${decodeParam(t)}』でした。あなたは？`,
        tags: ["#さしずめ俺は", "#診断メーカー", k ? `#${decodeParam(k)}` : ""].filter(Boolean),
      });
      setKeyword(decodeParam(k || ""));
      setVariant(v);
    }
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("t", encodeParam(result.full));
    url.searchParams.set("k", encodeParam(keyword || ""));
    url.searchParams.set("v", String(variant));
    setPermalink(url.toString());
  }, [result, keyword, variant]);

  const doGenerate = (forceVariant) => {
    const v = typeof forceVariant === "number" ? forceVariant : variant;
    const next = buildResult(keyword || "なんでも", v);
    setResult(next);
    setVariant(v);
  };

  const randomize = () => {
    const v = Math.floor(Math.random() * 99999);
    doGenerate(v);
  };

  const copyText = async (text) => {
    try { await navigator.clipboard.writeText(text); toast("コピーしました"); } catch (e) { toast("コピーに失敗しました"); }
  };

  const shareX = () => {
    const text = `${result.full}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text + "\n" + result.caption)}&url=${encodeURIComponent(permalink)}&hashtags=${encodeURIComponent(result.tags.map(t=>t.replace('#','')).join(','))}`;
    window.open(url, "_blank");
  };

  const sysShare = async () => {
    const shareText = `${result.full}\n${result.caption}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "さしずめ俺はジェネレーター", text: shareText, url: permalink });
      } else {
        shareX();
      }
    } catch (e) {
      // user cancelled; do nothing
    }
  };

  const downloadImage = async () => {
    if (!cardRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `sashizume_${Date.now()}.png`;
      a.click();
    } catch (e) {
      toast("画像の生成に失敗しました");
    }
  };

  const exampleChips = ["コーヒー", "寝坊", "筋トレ", "推し", "写真", "旅", "ラーメン", "AI"];

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            さしずめ俺はジェネレーター <span className="text-neutral-400 text-base align-middle">β</span>
          </h1>
          <div className="hidden sm:flex gap-2">
            <button onClick={sysShare} className="px-3 py-2 rounded-2xl bg-neutral-800 hover:bg-neutral-700 transition flex items-center gap-2">
              <Share2 className="w-4 h-4"/> 共有
            </button>
            <button onClick={shareX} className="px-3 py-2 rounded-2xl bg-[#0f1419] hover:opacity-90 transition flex items-center gap-2">
              <Twitter className="w-4 h-4"/> Xでシェア
            </button>
          </div>
        </header>

        <div className="bg-neutral-900/60 backdrop-blur rounded-3xl p-4 sm:p-6 shadow-xl ring-1 ring-white/10">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e)=>{ if(e.key==='Enter') doGenerate(); }}
              className="flex-1 px-4 py-3 rounded-2xl bg-neutral-800/80 outline-none focus:ring-2 focus:ring-cyan-400/60 placeholder:text-neutral-400"
              placeholder="キーワードを入れてね（例：コーヒー、寝坊、筋トレ、推し）"/>
            <button onClick={()=>doGenerate(Math.max(0, variant))} className="px-5 py-3 rounded-2xl bg-gradient-to-tr from-cyan-400 to-violet-500 font-semibold shadow-lg hover:brightness-110">
              生成する
            </button>
            <button onClick={randomize} title="別バリエーション" className="px-4 py-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 transition flex items-center gap-2">
              <RefreshCcw className="w-4 h-4"/> もう一回
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {exampleChips.map((chip)=> (
              <button key={chip} onClick={()=>{ setKeyword(chip); setVariant(0); doGenerate(0); }} className="px-3 py-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-sm">
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Preview Card */}
        <motion.div
          ref={cardRef}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className={`mt-8 rounded-[2rem] p-6 sm:p-10 shadow-2xl ring-1 ring-white/10 bg-gradient-to-br ${result.palette.from} ${result.palette.to}`}
          style={{
            backgroundImage: `radial-gradient(60rem 60rem at -20% -10%, rgba(255,255,255,0.08), transparent 40%), radial-gradient(60rem 60rem at 120% 110%, rgba(255,255,255,0.10), transparent 40%)`
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm uppercase tracking-[.3em] font-semibold drop-shadow">SASHIZUME OREHA</span>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{result.palette.name}</span>
          </div>
          <h2 className="mt-4 sm:mt-6 text-3xl sm:text-5xl md:text-6xl font-black leading-tight drop-shadow-xl">
            {result.full}
          </h2>
          <p className="mt-4 text-base sm:text-lg opacity-90 whitespace-pre-wrap">
            {result.caption}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm opacity-90">
            {result.tags.map((t) => (
              <span key={t} className="px-2 py-1 bg-black/20 rounded-full">{t}</span>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onClick={()=>copyText(permalink)} className="w-full px-4 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 transition flex items-center gap-2 justify-center">
            <LinkIcon className="w-4 h-4"/> リンクをコピー
          </button>
          <button onClick={()=>copyText(`${result.full}\n${permalink}`)} className="w-full px-4 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 transition flex items-center gap-2 justify-center">
            <Copy className="w-4 h-4"/> 結果テキストをコピー
          </button>
          <button onClick={shareX} className="w-full px-4 py-3 rounded-2xl bg-[#0f1419] hover:opacity-90 transition flex items-center gap-2 justify-center">
            <Twitter className="w-4 h-4"/> Xで共有
          </button>
          <button onClick={downloadImage} className="w-full px-4 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 transition flex items-center gap-2 justify-center">
            <Download className="w-4 h-4"/> SNS用画像を保存
          </button>
        </div>

        {/* Tips */}
        <div className="mt-10 text-sm text-neutral-300 space-y-2">
          <p>・同じキーワードでも「もう一回」を押すと別バリエーションを生成します（URLで共有可能）。</p>
          <p>・画像保存はカード部分をそのままPNG化します。投稿プラットフォーム（X/Instagram/Threadsなど）に合わせてトリミングしてください。</p>
          <p>・ハッシュタグは自動付与されます。Xではテキスト+URL+ハッシュタグの形でシェアできます。</p>
        </div>

        <footer className="mt-12 border-t border-white/10 pt-6 text-xs text-neutral-400">
          © {new Date().getFullYear()} さしずめ俺はジェネレーター
        </footer>
      </div>
    </div>
  );
}

// --- tiny toast ---
let toasting = false;
function toast(msg) {
  if (toasting) return;
  toasting = true;
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.position = 'fixed';
  el.style.bottom = '24px';
  el.style.left = '50%';
  el.style.transform = 'translateX(-50%)';
  el.style.padding = '10px 14px';
  el.style.background = 'rgba(0,0,0,.8)';
  el.style.color = 'white';
  el.style.borderRadius = '999px';
  el.style.fontSize = '14px';
  el.style.zIndex = 9999;
  document.body.appendChild(el);
  setTimeout(()=>{ el.remove(); toasting = false; }, 1400);
}
