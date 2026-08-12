import { useEffect, useMemo, useRef, useState } from 'react'
import { allKana, groupNames, kanaGroups, pairKana, pairs, shuffle, type Kana } from './data'
import { clearProgress, loadProgress, saveProgress, type Progress } from './storage'

type View = 'home' | 'select' | 'game' | 'result' | 'book' | 'record'
type Level = 1 | 2 | 3
type Mode = 'practice' | 'challenge'
export type Choice = { level: Level; set: string; random: boolean; mode: Mode }
type GameResult = { misses: number; seconds: number }
const labels: Record<Level, string> = { 1: '1つずつ おぼえよう', 2: '2つ つづけて しょうぶ', 3: 'ぜんぶの もじ' }
const id = (c: Choice) => `${c.level}-${c.set}-${c.random ? 'random' : 'normal'}`

export function App() {
  const [view, setView] = useState<View>('home')
  const [progress, setProgress] = useState<Progress>(() => loadProgress())
  const [choice, setChoice] = useState<Choice | null>(null)
  const [lastResult, setLastResult] = useState<GameResult | null>(null)
  useEffect(() => saveProgress(progress), [progress])
  const level2Open = groupNames.every(g => progress.completed.includes(`1-${g}-normal`))
  const level3Open = pairs.every(p => progress.completed.includes(`2-${p}-normal`))
  const randomOpen = progress.stars['3-all-normal']?.includes('no-miss')
  const select = (level: Level, set: string, random = false, mode: Mode = 'challenge') => { setChoice({ level, set, random, mode }); setView('game') }
  const nav = (next: View) => setView(next)

  if (view === 'game' && choice) return <Game choice={choice} back={() => nav('select')} finish={(result) => { setProgress(p => finish(p, choice, result)); setLastResult(result); nav('result') }} />
  return <main className="app-shell">
    <header className="topbar"><button className="brand" onClick={() => nav('home')} aria-label="ほーむへ"><span className="brand-mark">★</span><span>ろーまじ<br /><b>ますたー</b></span></button><nav><button className={view === 'book' ? 'nav-link active' : 'nav-link'} onClick={() => nav('book')}>いちらん</button><button className={view === 'record' ? 'nav-link active' : 'nav-link'} onClick={() => nav('record')}>きろく</button></nav></header>
    {view === 'home' && <Home onPlay={() => nav('select')} onHint={() => nav('book')} />}
    {view === 'select' && <Select level2Open={level2Open} level3Open={level3Open} randomOpen={randomOpen} onBack={() => nav('home')} onSelect={select} />}
    {view === 'result' && choice && lastResult && <Result choice={choice} result={lastResult} onRetry={() => nav('game')} onSelect={() => nav('select')} onRecord={() => nav('record')} />}
    {view === 'book' && <Book onBack={() => nav('home')} />}
    {view === 'record' && <Record progress={progress} onBack={() => nav('home')} reset={() => { if (confirm('きろくを ぜんぶ けしますか？')) { clearProgress(); setProgress(loadProgress()) } }} />}
  </main>
}

function Home({ onPlay, onHint }: { onPlay: () => void; onHint: () => void }) {
  return <section className="home-page"><div className="home-copy"><div className="sparkle sparkle-one">✦</div><div className="sparkle sparkle-two">✦</div><p className="eyebrow">たのしく まなぼう</p><h1>ろーまじを<br /><span>たのしく おぼえよう！</span></h1><p className="lead">ひらがなを みて、ろーまじを<br />タップで えらんでみよう。</p><button className="primary-button" onClick={onPlay}>あそぶ <span>→</span></button><button className="text-button" onClick={onHint}>いちらんを みる</button></div><div className="home-art" aria-hidden="true"><div className="sun">☀</div><div className="cloud cloud-a" /><div className="cloud cloud-b" /><div className="hill hill-back" /><div className="hill hill-front" /><div className="character"><div className="character-face"><i /><i /><span>⌣</span></div><div className="character-body" /></div><div className="floating-kana kana-a">あ</div><div className="floating-kana kana-ka">か</div></div><div className="home-footer"><span>★ じぶんの ペースで すすめよう</span><span>データは この たんまつに ほぞん</span></div></section>
}

function Select({ level2Open, level3Open, randomOpen, onBack, onSelect }: { level2Open: boolean; level3Open: boolean; randomOpen: boolean; onBack: () => void; onSelect: (level: Level, set: string, random?: boolean, mode?: Mode) => void }) {
  const [mode, setMode] = useState<Mode>('challenge')
  return <section className="content-page"><button className="back-button" onClick={onBack}>← もどる</button><div className="page-heading"><p className="eyebrow">すてっぷ 1</p><h2>れべるを えらぼう</h2><p>できそうな ところから はじめよう。</p></div><div className="mode-choice" aria-label="もーどを えらぶ"><span>もーど</span><button className={mode === 'practice' ? 'selected' : ''} onClick={() => setMode('practice')}>れんしゅう</button><button className={mode === 'challenge' ? 'selected' : ''} onClick={() => setMode('challenge')}>ほんばん</button></div><div className="level-list"><LevelCard number="01" text={labels[1]} note="あ・か・さ… 1つの ぎょう" open onClick={() => onSelect(1, groupNames[0], false, mode)} /><LevelCard number="02" text={labels[2]} note="2つの ぎょうを つづけて" open={level2Open} onClick={() => onSelect(2, pairs[0], false, mode)} /><LevelCard number="03" text={labels[3]} note="あ〜んを ぜんぶ" open={level3Open} onClick={() => onSelect(3, 'all', false, mode)} /></div><div className="sets-panel"><h3>もんだいを えらぶ</h3><div className="set-row">{groupNames.map(g => <button key={g} onClick={() => onSelect(1, g, false, mode)}>{g}</button>)}</div><div className="set-row secondary">{pairs.map(p => <button disabled={!level2Open} key={p} onClick={() => onSelect(2, p, false, mode)}>{p.split('').join('・')}</button>)}</div><div className="set-row wide"><button disabled={!level3Open} onClick={() => onSelect(3, 'all', false, mode)}>じゅんばん</button><button disabled={!randomOpen} onClick={() => onSelect(3, 'all', true, mode)}>らんだむ</button></div></div></section>
}

function LevelCard({ number, text, note, open, onClick }: { number: string; text: string; note: string; open: boolean; onClick: () => void }) { return <button className={`level-card ${open ? '' : 'locked'}`} disabled={!open} onClick={onClick}><span className="level-number">{number}</span><span className="level-info"><strong>{open ? text : 'まだ あそべないよ'}</strong><small>{open ? note : 'まえの れべるを くりあしてね'}</small></span><span className="level-arrow">{open ? '→' : '🔒'}</span></button> }

function Game({ choice, back, finish }: { choice: Choice; back: () => void; finish: (result: GameResult) => void }) {
  const questions = useMemo(() => { const source: Kana[] = choice.level === 1 ? kanaGroups[choice.set] : choice.level === 2 ? pairKana(choice.set) : allKana; return choice.random ? shuffle(source) : source }, [choice])
  const [index, setIndex] = useState(0), [, setMisses] = useState(0), [combo, setCombo] = useState(0), [hint, setHint] = useState(false), [hintUsed, setHintUsed] = useState(false), [started] = useState(Date.now()), [wrong, setWrong] = useState<string | null>(null)
  const missesRef = useRef(0)
  const q = questions[index]
  const options = useMemo(() => shuffle([q.roma, ...shuffle(allKana.filter(x => x.roma !== q.roma)).slice(0, choice.level === 2 ? 9 : 4).map(x => x.roma)]), [q, choice.level])
  useEffect(() => { if (choice.mode === 'practice') { const timer = setTimeout(() => setHint(true), 3000); return () => clearTimeout(timer) } }, [index, choice.mode])
  const addMiss = () => { missesRef.current += 1; setMisses(m => m + 1) }
  const useHint = () => { if (!hintUsed) { setHintUsed(true); addMiss() }; setHint(true) }
  const answer = (roma: string) => { if (roma === q.roma) { const next = index + 1; setCombo(c => c + 1); setWrong(null); if (next === questions.length) finish({ misses: missesRef.current, seconds: (Date.now() - started) / 1000 }); else { setIndex(next); setHint(false); setHintUsed(false) } } else { addMiss(); setCombo(0); setWrong(roma); setHint(true) } }
  return <section className="game-page"><div className="game-top"><button className="back-button" onClick={back}>← もどる</button><span className="game-count">{index + 1} / {questions.length}</span><span className="combo-count">{combo > 1 ? `★ ${combo}` : ''}</span></div><div className="progress-track"><i style={{ width: `${(index / questions.length) * 100}%` }} /></div><div className="game-card"><p className="mode-label">{choice.mode === 'practice' ? 'れんしゅう' : 'ほんばん'}</p><p className="prompt">この もじの ろーまじは？</p><div className="question-kana">{q.kana}</div><button className="in-game-hint" onClick={useHint}>{hint ? 'こたえを みたよ' : 'こたえを みる'}</button>{hint && <p className="hint-text">こたえは <b>{q.roma}</b> だよ<br /><small>みどりの こたえを タップ！</small></p>}<div className={`answer-grid ${choice.level === 2 ? 'many' : ''}`}>{options.map(roma => <button key={roma} className={hint && roma === q.roma ? 'answer right' : wrong === roma ? 'answer wrong' : 'answer'} onClick={() => answer(roma)}>{roma}</button>)}</div></div></section>
}

export function resultStars(choice: Choice, result: GameResult) {
  if (choice.mode === 'practice') return []
  const count = choice.level === 1 ? kanaGroups[choice.set].length : choice.level === 2 ? pairKana(choice.set).length : allKana.length
  return [result.misses === 0 ? 'no-miss' : '', choice.level < 3 && result.seconds < count * 2 ? 'speed' : ''].filter(Boolean)
}

export function questionCount(choice: Choice) {
  return choice.level === 1 ? kanaGroups[choice.set].length : choice.level === 2 ? pairKana(choice.set).length : allKana.length
}

function Result({ choice, result, onRetry, onSelect, onRecord }: { choice: Choice; result: GameResult; onRetry: () => void; onSelect: () => void; onRecord: () => void }) {
  const stars = resultStars(choice, result)
  const clean = stars.includes('no-miss')
  const quick = stars.includes('speed')
  return <section className="result-page"><div className="result-card"><p className="eyebrow">よく できました！</p><div className="result-mark" aria-hidden="true">{choice.mode === 'practice' ? '☺' : clean ? '★' : '○'}</div><h2>{questionCount(choice)}もん できたよ！</h2>{choice.mode === 'practice' ? <p className="result-copy">れんしゅうを おわったよ。<br />つぎは ほんばんにも ちょうせんしてみよう！</p> : <><p className="result-copy">{clean ? 'まちがえずに できたね！' : 'さいごまで がんばったね！'}</p><p className="earned-label">こんかい もらえた ほし</p><div className="earned-stars"><span className={clean ? 'earned' : ''}>★<small>まちがえ なし</small></span>{choice.level < 3 && <span className={quick ? 'earned' : ''}>⚡<small>はやく できた</small></span>}</div><p className="result-note">{choice.level === 3 ? `こんかいは ${result.seconds.toFixed(1)} びょう だったよ` : '⚡は 1もじ 2びょうより はやいと もらえるよ'}</p></>}<div className="result-actions">{choice.mode === 'practice' ? <button className="primary-button" onClick={onSelect}>ほんばんを えらぶ</button> : <button className="primary-button" onClick={onRetry}>もう いちど</button>}<button className="result-select" onClick={onSelect}>ちがう もんだい</button><button className="result-record" onClick={onRecord}>きろくを みる →</button></div></div></section>
}

function Book({ onBack }: { onBack: () => void }) { return <section className="content-page"><button className="back-button" onClick={onBack}>← もどる</button><div className="page-heading"><p className="eyebrow">いつでも かくにん</p><h2>いちらん</h2><p>もじと ろーまじを みくらべてみよう。</p></div><div className="kana-chart">{groupNames.map(g => <div className="kana-column" key={g}><span className="column-label">{g}ぎょう</span>{kanaGroups[g].map(x => <button key={x.kana} aria-label={`${x.kana} は ${x.roma}`}><b>{x.kana}</b><span>{x.roma}</span></button>)}</div>)}</div></section> }
function recordLabel(key: string) { const [level, set, variant] = key.split('-'); const range = set === 'all' ? 'ぜんぶ' : set.split('').join('・'); return `れべる${level} ${range} ${variant === 'random' ? 'らんだむ' : 'じゅんばん'}` }
function Record({ progress, onBack, reset }: { progress: Progress; onBack: () => void; reset: () => void }) { const entries = Object.entries(progress.stars); return <section className="content-page"><button className="back-button" onClick={onBack}>← もどる</button><div className="page-heading"><p className="eyebrow">ここまでの あゆみ</p><h2>きろく</h2><p>できた もんだいを みてみよう。</p></div><div className="record-summary"><strong>{progress.completed.length}</strong><span>すてーじ くりあ</span></div>{entries.length === 0 ? <p className="empty-state">まだ きろくが ないよ。<br />まずは ひとつ あそんでみよう！</p> : <div className="records">{entries.map(([key, stars]) => <div className="record-row" key={key}><span>{recordLabel(key)}</span><div className="record-result"><b>{stars.includes('no-miss') ? '★' : '☆'} {stars.includes('speed') ? '⚡' : ''}</b>{progress.bestTimes[key] !== undefined && <small>{progress.bestTimes[key].toFixed(1)} びょう</small>}</div></div>)}</div>}<button className="reset-button" onClick={reset}>きろくを りせっと</button></section> }

export function finish(progress: Progress, choice: Choice, result: { misses: number; seconds: number }): Progress { if (choice.mode === 'practice') return progress; const key = id(choice); const stars = [...(progress.stars[key] || [])]; if (result.misses === 0 && !stars.includes('no-miss')) stars.push('no-miss'); if (choice.level < 3 && result.seconds < (choice.level === 1 ? kanaGroups[choice.set].length : pairKana(choice.set).length) * 2 && !stars.includes('speed')) stars.push('speed'); const best = progress.bestTimes[key]; return { ...progress, completed: [...new Set([...progress.completed, key])], stars: { ...progress.stars, [key]: stars }, bestTimes: choice.level === 3 && (!best || result.seconds < best) ? { ...progress.bestTimes, [key]: result.seconds } : progress.bestTimes } }
