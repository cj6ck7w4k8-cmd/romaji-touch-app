import { useEffect, useMemo, useRef, useState } from 'react'
import { allKana, groupNames, kanaGroups, pairKana, pairs, shuffle, type Kana } from './data'
import { clearProgress, loadProgress, saveProgress, type Progress } from './storage'

type View = 'home' | 'select' | 'game' | 'result' | 'book' | 'record'
type Level = 1 | 2 | 3
type Mode = 'practice' | 'challenge'
export type Choice = { level: Level; set: string; random: boolean; mode: Mode }
type GameResult = { misses: number; seconds: number }
const id = (c: Choice) => `${c.level}-${c.set}-${c.random ? 'random' : 'normal'}`
const hasAllStageBadges = (progress: Progress, key: string) => ['no-miss', 'speed'].every(badge => progress.stars[key]?.includes(badge))

export function App() {
  const [view, setView] = useState<View>('home')
  const [progress, setProgress] = useState<Progress>(() => loadProgress())
  const [choice, setChoice] = useState<Choice | null>(null)
  const [lastResult, setLastResult] = useState<GameResult | null>(null)
  useEffect(() => saveProgress(progress), [progress])
  const level2Open = groupNames.every(g => hasAllStageBadges(progress, `1-${g}-normal`))
  const level3Open = pairs.every(p => hasAllStageBadges(progress, `2-${p}-normal`))
  const randomOpen = progress.stars['3-all-normal']?.includes('no-miss')
  const select = (level: Level, set: string, random = false, mode: Mode = 'challenge') => { setChoice({ level, set, random, mode }); setView('game') }
  const nav = (next: View) => setView(next)

  if (view === 'game' && choice) return <Game choice={choice} back={() => nav('select')} finish={(result) => { setProgress(p => finish(p, choice, result)); setLastResult(result); nav('result') }} />
  return <main className="app-shell">
    <header className="topbar"><button className="brand" onClick={() => nav('home')} aria-label="ほーむへ"><span className="brand-mark">★</span><span>ローマ字<br /><b>ますたー</b></span></button><nav><button className={view === 'book' ? 'nav-link active' : 'nav-link'} onClick={() => nav('book')}>いちらん</button><button className={view === 'record' ? 'nav-link active' : 'nav-link'} onClick={() => nav('record')}>きろく</button></nav></header>
    {view === 'home' && <Home progress={progress} currentLevel={level3Open ? 3 : level2Open ? 2 : 1} onPlay={() => nav('select')} onRecord={() => nav('record')} />}
    {view === 'select' && <Select progress={progress} level2Open={level2Open} level3Open={level3Open} randomOpen={randomOpen} onBack={() => nav('home')} onSelect={select} />}
    {view === 'result' && choice && lastResult && <Result choice={choice} result={lastResult} onRetry={() => nav('game')} onSelect={() => nav('select')} onRecord={() => nav('record')} />}
    {view === 'book' && <Book onBack={() => nav('home')} />}
    {view === 'record' && <Record progress={progress} onBack={() => nav('home')} reset={() => { if (confirm('きろくを ぜんぶ けしますか？')) { clearProgress(); setProgress(loadProgress()) } }} />}
  </main>
}

function Home({ progress, currentLevel, onPlay, onRecord }: { progress: Progress; currentLevel: Level; onPlay: () => void; onRecord: () => void }) {
  const badges = progressBadges(progress)
  return <section className="home-page"><div className="home-copy"><h1>ローマ字を<br /><span>おぼえよう！</span></h1><p className="lead">ひらがなを みて、ローマ字を えらぼう。</p><button className="primary-button" onClick={onPlay}>あそぶ <span>→</span></button><button className="home-record" onClick={onRecord}><span className="home-record-title">いまの レベル</span><span className="home-record-stats"><strong>レベル{currentLevel}</strong><b>★ {badges.noMiss}</b><b>⚡ {badges.speed}</b></span><span className="home-record-help">くわしく みる →</span></button></div><div className="home-art romaji-lesson-art" aria-hidden="true"><div className="lesson-title">ひらがな　→　ローマ字</div><div className="lesson-card"><b>あ</b><span>→</span><strong>a</strong></div><div className="lesson-card"><b>し</b><span>→</span><strong>si</strong></div><div className="lesson-card"><b>つ</b><span>→</span><strong>tu</strong></div></div></section>
}

function Select({ progress, level2Open, level3Open, randomOpen, onBack, onSelect }: { progress: Progress; level2Open: boolean; level3Open: boolean; randomOpen: boolean; onBack: () => void; onSelect: (level: Level, set: string, random?: boolean, mode?: Mode) => void }) {
  const [mode, setMode] = useState<Mode>('challenge')
  const [level, setLevel] = useState<Level>(1)
  const [set, setSet] = useState(groupNames[0])
  const [random, setRandom] = useState(false)
  const chooseLevel = (next: Level) => { if (next === 2 && !level2Open || next === 3 && !level3Open) return; setLevel(next); setSet(next === 1 ? groupNames[0] : next === 2 ? pairs[0] : 'all'); setRandom(false) }
  const choices = level === 1 ? groupNames : level === 2 ? pairs : ['じゅんばん', 'らんだむ']
  const chooseSet = (value: string) => { if (level === 3) { if (value === 'らんだむ' && !randomOpen) return; setRandom(value === 'らんだむ'); setSet('all'); return } setSet(value) }
  const startLabel = level === 1 ? `${set}ぎょうで` : level === 2 ? `${set.split('').join('・')}で` : random ? 'ランダムで' : 'じゅんばんで'
  const unlockNote = !level2Open ? 'レベル2は レベル1の バッジを ぜんぶ ゲットしたら できるよ。' : !level3Open ? 'レベル3は レベル2の バッジを ぜんぶ ゲットしたら できるよ。' : ''
  const selectedStatus = stageStatus(progress, { level, set, random, mode: 'challenge' })
  return <section className="content-page select-page"><button className="back-button" onClick={onBack}>← もどる</button><div className="page-heading compact-heading"><h2>もんだいを えらぼう</h2><p>えらんだら スタートを おしてね。</p></div><div className="choice-box"><div className="choice-row"><span>モード</span><div className="mode-choice" aria-label="モードを えらぶ"><button className={mode === 'practice' ? 'selected' : ''} onClick={() => setMode('practice')}>れんしゅう</button><button className={mode === 'challenge' ? 'selected' : ''} onClick={() => setMode('challenge')}>ほんばん</button></div></div><div className="choice-row level-row"><span>レベル</span><div className="level-picks"><button className={level === 1 ? 'selected' : ''} onClick={() => chooseLevel(1)}>1</button><button disabled={!level2Open} className={level === 2 ? 'selected' : ''} onClick={() => chooseLevel(2)}>2</button><button disabled={!level3Open} className={level === 3 ? 'selected' : ''} onClick={() => chooseLevel(3)}>3</button></div>{unlockNote && <p className="unlock-note">{unlockNote}</p>}</div><div className="choice-row range-row"><span>{level === 1 ? 'ぎょう' : level === 2 ? 'くみ' : 'ならびかた'}</span><div className={`range-picks ${level === 3 ? 'level-three-picks' : ''}`}>{choices.map(value => { const nextRandom = level === 3 && value === 'らんだむ'; const nextSet = level === 3 ? 'all' : value; const status = stageStatus(progress, { level, set: nextSet, random: nextRandom, mode: 'challenge' }); return <button disabled={level === 3 && value === 'らんだむ' && !randomOpen} className={(level < 3 ? set === value : random === nextRandom) ? 'selected' : ''} key={value} onClick={() => chooseSet(value)}><span>{level === 2 ? value.split('').join('・') : value === 'らんだむ' ? 'ランダム' : value}</span><StatusMarks status={status} showEmpty /></button> })}</div></div><p className="choice-status">{selectedStatus.completed ? 'クリア ずみ' : 'まだ クリア していない'}　<StatusMarks status={selectedStatus} showEmpty /></p><p className="status-legend">○ クリア　★ まちがえなし　⚡ はやくできた<br />きろくが のこるのは ほんばん だけ</p><button className="start-button" onClick={() => onSelect(level, set, random, mode)}>レベル{level}　{startLabel}　スタート →</button></div></section>
}

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
  return <section className="game-page"><div className="game-top"><button className="back-button" onClick={back}>← もどる</button><span className="game-count">{index + 1} / {questions.length}</span><span className="combo-count">{combo > 1 ? `★ ${combo}` : ''}</span></div><div className="progress-track"><i style={{ width: `${(index / questions.length) * 100}%` }} /></div><div className="game-card"><p className="mode-label">{choice.mode === 'practice' ? 'れんしゅう' : 'ほんばん'}</p><p className="prompt">この もじの ローマ字は？</p><div className="question-kana">{q.kana}</div><button className="in-game-hint" onClick={useHint}>{hint ? 'こたえを みたよ' : 'こたえを みる'}</button>{hint && <p className="hint-text">こたえは <b>{q.roma}</b> だよ<br /><small>みどりの こたえを タップ！</small></p>}<div className={`answer-grid ${choice.level === 2 ? 'many' : ''}`}>{options.map(roma => <button key={roma} className={hint && roma === q.roma ? 'answer right' : wrong === roma ? 'answer wrong' : 'answer'} onClick={() => answer(roma)}>{roma}</button>)}</div></div></section>
}

export function resultStars(choice: Choice, result: GameResult) {
  if (choice.mode === 'practice') return []
  const count = choice.level === 1 ? kanaGroups[choice.set].length : choice.level === 2 ? pairKana(choice.set).length : allKana.length
  return [result.misses === 0 ? 'no-miss' : '', choice.level < 3 && result.seconds < count * 2 ? 'speed' : ''].filter(Boolean)
}

export function questionCount(choice: Choice) {
  return choice.level === 1 ? kanaGroups[choice.set].length : choice.level === 2 ? pairKana(choice.set).length : allKana.length
}

export function progressBadges(progress: Progress) {
  const values = Object.values(progress.stars)
  return { noMiss: values.filter(stars => stars.includes('no-miss')).length, speed: values.filter(stars => stars.includes('speed')).length }
}

export function stageStatus(progress: Progress, choice: Choice) {
  const key = id(choice)
  const stars = progress.stars[key] || []
  return { completed: progress.completed.includes(key), noMiss: stars.includes('no-miss'), speed: stars.includes('speed'), bestTime: progress.bestTimes[key] }
}

function StatusMarks({ status, showEmpty = false }: { status: ReturnType<typeof stageStatus>; showEmpty?: boolean }) {
  if (!showEmpty && !status.completed && !status.noMiss && !status.speed) return null
  const badges = [{ mark: '★', earned: status.noMiss, label: 'まちがえなし', kind: 'no-miss-badge' }, { mark: '⚡', earned: status.speed, label: 'はやくできた', kind: 'speed-badge' }]
  return <span className="status-marks" aria-label={badges.filter(badge => badge.earned).map(badge => badge.label).join('　') || 'まだ バッジがない'}>{badges.map(badge => <i className={badge.earned ? `filled ${badge.kind}` : ''} key={badge.mark} aria-hidden="true">{badge.earned ? badge.mark : ''}</i>)}{status.bestTime !== undefined && <small>{status.bestTime.toFixed(1)}びょう</small>}</span>
}

function Result({ choice, result, onRetry, onSelect, onRecord }: { choice: Choice; result: GameResult; onRetry: () => void; onSelect: () => void; onRecord: () => void }) {
  const stars = resultStars(choice, result)
  const clean = stars.includes('no-miss')
  const quick = stars.includes('speed')
  return <section className="result-page"><div className="result-card"><p className="eyebrow">よく できました！</p><div className="result-mark" aria-hidden="true">{choice.mode === 'practice' ? '☺' : clean ? '★' : '○'}</div><h2>{questionCount(choice)}もん できたよ！</h2>{choice.mode === 'practice' ? <p className="result-copy">れんしゅうを おわったよ。<br />つぎは ほんばんにも ちょうせんしてみよう！</p> : <><p className="result-copy">{clean ? 'まちがえずに できたね！' : 'さいごまで がんばったね！'}</p><p className="earned-label">こんかいの バッジ</p><div className="earned-stars"><span className={`badge-slot ${clean ? 'earned' : ''}`}><i aria-hidden="true">{clean ? '★' : ''}</i><small>まちがえ なし</small></span>{choice.level < 3 && <span className={`badge-slot ${quick ? 'earned' : ''}`}><i aria-hidden="true">{quick ? '⚡' : ''}</i><small>はやく できた</small></span>}</div><p className="result-note">{choice.level === 3 ? `こんかいは ${result.seconds.toFixed(1)} びょう だったよ` : '⚡は 1もじ 2びょうより はやいと もらえるよ'}</p></>}<div className="result-actions">{choice.mode === 'practice' ? <button className="primary-button" onClick={onSelect}>ほんばんを えらぶ</button> : <div className="result-primary-actions"><button className="primary-button" onClick={onRetry}>もう いちど</button><button className="next-button" onClick={onSelect}>ほかの もんだいを えらぶ →</button></div>}<button className="result-record" onClick={onRecord}>きろくを みる →</button></div></div></section>
}

function Book({ onBack }: { onBack: () => void }) { return <section className="content-page"><button className="back-button" onClick={onBack}>← もどる</button><div className="page-heading"><p className="eyebrow">いつでも かくにん</p><h2>いちらん</h2><p>もじと ローマ字を みくらべてみよう。</p></div><div className="kana-chart">{groupNames.map(g => <div className="kana-column" key={g}><span className="column-label">{g}ぎょう</span>{kanaGroups[g].map(x => <button key={x.kana} aria-label={`${x.kana} は ${x.roma}`}><b>{x.kana}</b><span>{x.roma}</span></button>)}</div>)}</div></section> }
function Record({ progress, onBack, reset }: { progress: Progress; onBack: () => void; reset: () => void }) {
  const [level, setLevel] = useState<Level>(1)
  const stages = level === 1
    ? groupNames.map(set => ({ label: set, choice: { level: 1 as Level, set, random: false, mode: 'challenge' as Mode } }))
    : level === 2
      ? pairs.map(set => ({ label: set.split('').join('・'), choice: { level: 2 as Level, set, random: false, mode: 'challenge' as Mode } }))
      : [{ label: 'じゅんばん', choice: { level: 3 as Level, set: 'all', random: false, mode: 'challenge' as Mode } }, { label: 'ランダム', choice: { level: 3 as Level, set: 'all', random: true, mode: 'challenge' as Mode } }]
  return <section className="content-page record-page"><button className="back-button" onClick={onBack}>← もどる</button><div className="page-heading record-heading"><h2>きろく</h2><p>クリアした ステージに いろが つくよ。</p></div><div className="record-level-tabs" aria-label="レベルを えらぶ">{([1, 2, 3] as Level[]).map(value => <button className={level === value ? 'selected' : ''} onClick={() => setLevel(value)} key={value}>レベル{value}</button>)}</div><div className={`record-stage-grid record-level-${level}`}>{stages.map(({ label, choice }) => { const status = stageStatus(progress, choice); return <div className={`record-stage ${status.completed ? 'completed' : ''}`} key={id(choice)}><strong>{label}</strong><StatusMarks status={status} showEmpty />{level === 3 && <small className="record-time">{status.bestTime === undefined ? 'さいたん －' : `さいたん ${status.bestTime.toFixed(1)}びょう`}</small>}</div> })}</div><button className="reset-button" onClick={reset}>きろくを リセット</button></section>
}

export function finish(progress: Progress, choice: Choice, result: { misses: number; seconds: number }): Progress { if (choice.mode === 'practice') return progress; const key = id(choice); const stars = [...(progress.stars[key] || [])]; if (result.misses === 0 && !stars.includes('no-miss')) stars.push('no-miss'); if (choice.level < 3 && result.seconds < (choice.level === 1 ? kanaGroups[choice.set].length : pairKana(choice.set).length) * 2 && !stars.includes('speed')) stars.push('speed'); const best = progress.bestTimes[key]; return { ...progress, completed: [...new Set([...progress.completed, key])], stars: { ...progress.stars, [key]: stars }, bestTimes: choice.level === 3 && (!best || result.seconds < best) ? { ...progress.bestTimes, [key]: result.seconds } : progress.bestTimes } }
