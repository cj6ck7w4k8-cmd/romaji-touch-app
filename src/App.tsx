import { useEffect, useMemo, useRef, useState } from 'react'
import { allAvailableKana, allDakuten, allKana, allVoicedYouon, allYouon, dakutenGroupNames, dakutenGroups, groupNames, kanaGroups, pairKana, pairs, shortWords, shuffle, type Kana, voicedYouonGroupNames, voicedYouonGroups, youonGroupNames, youonGroups } from './data'
import { clearProgress, loadProgress, saveProgress, type Progress } from './storage'

type View = 'home' | 'select' | 'game' | 'result' | 'book' | 'record' | 'medals'
type Level = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
type Mode = 'practice' | 'challenge'
export type Choice = { level: Level; set: string; random: boolean; mode: Mode }
type GameResult = { misses: number; seconds: number }
type MedalId = 'level1-no-miss' | 'level1-speed' | 'level2-no-miss' | 'level2-speed' | 'normal-no-miss' | 'normal-90' | 'normal-75' | 'random-no-miss' | 'random-90' | 'random-75'
type Medal = { id: MedalId; level: Level; title: string; subtitle: string; icon: string; how: string }
const id = (c: Choice) => `${c.level}-${c.set}-${c.random ? 'random' : 'normal'}`
const hasAllStageBadges = (progress: Progress, key: string) => ['no-miss', 'speed'].every(badge => progress.stars[key]?.includes(badge))

export const medalDefinitions: Medal[] = [
  { id: 'level1-no-miss', level: 1, title: 'かんぺき', subtitle: 'レベル1', icon: '★', how: 'レベル1を ぜんぶ まちがえずに クリアしよう。' },
  { id: 'level1-speed', level: 1, title: 'はやさ', subtitle: 'レベル1', icon: '⚡', how: 'レベル1の はやさ バッジを ぜんぶ ゲットしよう。' },
  { id: 'level2-no-miss', level: 2, title: 'かんぺき', subtitle: 'レベル2', icon: '★', how: 'レベル2を ぜんぶ まちがえずに クリアしよう。' },
  { id: 'level2-speed', level: 2, title: 'はやさ', subtitle: 'レベル2', icon: '⚡', how: 'レベル2の はやさ バッジを ぜんぶ ゲットしよう。' },
  { id: 'normal-no-miss', level: 3, title: 'じゅんばん', subtitle: 'まちがえなし', icon: '★', how: 'レベル3の じゅんばんを まちがえずに クリアしよう。' },
  { id: 'normal-90', level: 3, title: 'じゅんばん', subtitle: '90びょう いない', icon: '⚡', how: 'レベル3の じゅんばんを まちがえずに 90びょう いないで クリアしよう。' },
  { id: 'normal-75', level: 3, title: 'じゅんばん', subtitle: '75びょう いない', icon: '✦', how: 'レベル3の じゅんばんを まちがえずに 75びょう いないで クリアしよう。' },
  { id: 'random-no-miss', level: 3, title: 'ランダム', subtitle: 'まちがえなし', icon: '★', how: 'レベル3の ランダムを まちがえずに クリアしよう。' },
  { id: 'random-90', level: 3, title: 'ランダム', subtitle: '90びょう いない', icon: '⚡', how: 'レベル3の ランダムを まちがえずに 90びょう いないで クリアしよう。' },
  { id: 'random-75', level: 3, title: 'ランダム', subtitle: '75びょう いない', icon: '✦', how: 'レベル3の ランダムを まちがえずに 75びょう いないで クリアしよう。' },
]

const hasBadge = (progress: Progress, key: string, badge: string) => progress.stars[key]?.includes(badge) ?? false
const cleanWithin = (progress: Progress, key: string, seconds: number) => hasBadge(progress, key, 'no-miss') && (progress.bestTimes[key] ?? Infinity) <= seconds

export function medalsFor(progress: Progress): MedalId[] {
  const earned: MedalId[] = []
  if (groupNames.every(group => hasBadge(progress, `1-${group}-normal`, 'no-miss'))) earned.push('level1-no-miss')
  if (groupNames.every(group => hasBadge(progress, `1-${group}-normal`, 'speed'))) earned.push('level1-speed')
  if (pairs.every(pair => hasBadge(progress, `2-${pair}-normal`, 'no-miss'))) earned.push('level2-no-miss')
  if (pairs.every(pair => hasBadge(progress, `2-${pair}-normal`, 'speed'))) earned.push('level2-speed')
  if (hasBadge(progress, '3-all-normal', 'no-miss')) earned.push('normal-no-miss')
  if (cleanWithin(progress, '3-all-normal', 90)) earned.push('normal-90')
  if (cleanWithin(progress, '3-all-normal', 75)) earned.push('normal-75')
  if (hasBadge(progress, '3-all-random', 'no-miss')) earned.push('random-no-miss')
  if (cleanWithin(progress, '3-all-random', 90)) earned.push('random-90')
  if (cleanWithin(progress, '3-all-random', 75)) earned.push('random-75')
  return earned
}

export function currentLevelFor(progress: Progress): Level {
  const level2Open = groupNames.every(g => hasAllStageBadges(progress, `1-${g}-normal`))
  const level3Open = pairs.every(p => hasAllStageBadges(progress, `2-${p}-normal`))
  const level4Open = hasBadge(progress, '3-all-normal', 'no-miss')
  const level5Open = dakutenGroupNames.every(group => hasBadge(progress, `4-${group}-normal`, 'no-miss'))
  const level6Open = youonGroupNames.every(group => hasBadge(progress, `5-${group}-normal`, 'no-miss'))
  const level7Open = voicedYouonGroupNames.every(group => hasBadge(progress, `6-${group}-normal`, 'no-miss'))
  const level8Open = hasBadge(progress, '7-all-random', 'no-miss')
  return level8Open ? 8 : level7Open ? 7 : level6Open ? 6 : level5Open ? 5 : level4Open ? 4 : level3Open ? 3 : level2Open ? 2 : 1
}

export function nextStageFor(progress: Progress): Choice {
  const level = currentLevelFor(progress)
  if (level === 1) return { level, set: groupNames.find(group => !hasAllStageBadges(progress, `1-${group}-normal`)) || groupNames[0], random: false, mode: 'challenge' }
  if (level === 2) return { level, set: pairs.find(pair => !hasAllStageBadges(progress, `2-${pair}-normal`)) || pairs[0], random: false, mode: 'challenge' }
  if (level === 3) return { level, set: 'all', random: hasBadge(progress, '3-all-normal', 'no-miss'), mode: 'challenge' }
  if (level === 4) return { level, set: dakutenGroupNames.find(group => !hasBadge(progress, `4-${group}-normal`, 'no-miss')) || dakutenGroupNames[0], random: false, mode: 'challenge' }
  if (level === 5) return { level, set: youonGroupNames.find(group => !hasBadge(progress, `5-${group}-normal`, 'no-miss')) || youonGroupNames[0], random: false, mode: 'challenge' }
  if (level === 6) return { level, set: voicedYouonGroupNames.find(group => !hasBadge(progress, `6-${group}-normal`, 'no-miss')) || voicedYouonGroupNames[0], random: false, mode: 'challenge' }
  if (level === 7) return { level, set: 'all', random: true, mode: 'challenge' }
  return { level, set: 'words', random: true, mode: 'challenge' }
}

export function App() {
  const [view, setView] = useState<View>('home')
  const [progress, setProgress] = useState<Progress>(() => loadProgress())
  const [choice, setChoice] = useState<Choice | null>(null)
  const [suggestedChoice, setSuggestedChoice] = useState<Choice | null>(null)
  const [lastResult, setLastResult] = useState<GameResult | null>(null)
  const [newMedals, setNewMedals] = useState<MedalId[]>([])
  useEffect(() => saveProgress(progress), [progress])
  const level2Open = groupNames.every(g => hasAllStageBadges(progress, `1-${g}-normal`))
  const level3Open = pairs.every(p => hasAllStageBadges(progress, `2-${p}-normal`))
  const level4Open = hasBadge(progress, '3-all-normal', 'no-miss')
  const level5Open = dakutenGroupNames.every(group => hasBadge(progress, `4-${group}-normal`, 'no-miss'))
  const level6Open = youonGroupNames.every(group => hasBadge(progress, `5-${group}-normal`, 'no-miss'))
  const level7Open = voicedYouonGroupNames.every(group => hasBadge(progress, `6-${group}-normal`, 'no-miss'))
  const level8Open = hasBadge(progress, '7-all-random', 'no-miss')
  const currentLevel = currentLevelFor(progress)
  const randomOpen = progress.stars['3-all-normal']?.includes('no-miss')
  const select = (level: Level, set: string, random = false, mode: Mode = 'challenge') => { setChoice({ level, set, random, mode }); setView('game') }
  const nav = (next: View) => setView(next)

  if (view === 'game' && choice) return <Game choice={choice} back={() => { setSuggestedChoice(choice); nav('select') }} finish={(result) => { const next = finish(progress, choice, result); const before = medalsFor(progress); setNewMedals(medalsFor(next).filter(medal => !before.includes(medal))); setProgress(next); setLastResult(result); nav('result') }} />
  return <main className="app-shell">
    <header className="topbar"><button className="brand" onClick={() => nav('home')} aria-label="ほーむへ"><span className="brand-mark">★</span><span className="brand-name">ローマじマスター</span></button><nav><button className={view === 'book' ? 'nav-link active' : 'nav-link'} onClick={() => nav('book')}>いちらん</button><button className={view === 'record' ? 'nav-link active' : 'nav-link'} onClick={() => nav('record')}>きろく</button></nav></header>
    {view === 'home' && <Home progress={progress} currentLevel={currentLevel} onStart={(next) => { setSuggestedChoice(next); nav('select') }} onRecord={() => nav('record')} onMedals={() => nav('medals')} />}
    {view === 'select' && <Select progress={progress} initialLevel={currentLevel} initialChoice={suggestedChoice} level2Open={level2Open} level3Open={level3Open} level4Open={level4Open} level5Open={level5Open} level6Open={level6Open} level7Open={level7Open} level8Open={level8Open} randomOpen={randomOpen} onBack={() => nav('home')} onSelect={select} />}
    {view === 'result' && choice && lastResult && <Result choice={choice} result={lastResult} newMedals={newMedals} onCloseMedals={() => setNewMedals([])} onViewMedals={() => { setNewMedals([]); nav('medals') }} onRetry={() => { setNewMedals([]); nav('game') }} onSelect={() => { setNewMedals([]); setSuggestedChoice(null); nav('select') }} onRecord={() => { setNewMedals([]); nav('record') }} />}
    {view === 'book' && <Book onBack={() => nav('home')} />}
    {view === 'record' && <Record progress={progress} onBack={() => nav('home')} reset={() => { if (confirm('きろくを ぜんぶ けしますか？')) { clearProgress(); setProgress(loadProgress()) } }} />}
    {view === 'medals' && <Medals progress={progress} onBack={() => nav('home')} />}
  </main>
}

function Home({ progress, currentLevel, onStart, onRecord, onMedals }: { progress: Progress; currentLevel: Level; onStart: (next: Choice) => void; onRecord: () => void; onMedals: () => void }) {
  const medalCount = medalsFor(progress).length
  const next = nextStageFor(progress)
  const nextLabel = next.level === 1 ? `レベル1 の「${next.set}」` : next.level === 2 ? `レベル2 の「${next.set.split('').join('・')}」` : next.level === 3 ? next.random ? 'レベル3 の ランダム' : 'レベル3 の じゅんばん' : next.level <= 6 ? `レベル${next.level} の「${next.set}」` : next.level === 7 ? 'レベル7 の ランダム' : 'レベル8 の ことば'
  return <section className="home-page"><div className="home-copy"><div className="home-title-line"><div className="home-logo" aria-hidden="true"><b>あ</b><span>→</span><strong>a</strong></div><h1>ローマじを<br /><span>おぼえよう！</span></h1></div><p className="lead">ひらがなを みて、ローマじを えらぼう。</p><div className="home-start"><p className="next-stage">つぎは　<strong>{nextLabel}</strong></p><button className="primary-button primary-action" onClick={() => onStart(next)}>はじめる <span>→</span></button></div><div className="home-status"><button className="home-record" onClick={onRecord} aria-label={`きろくを みる。いまの レベルは レベル${currentLevel}`}><span className="home-record-title">いまの レベル</span><span className="home-record-stats"><strong>レベル{currentLevel}</strong></span></button><button className="home-medal" onClick={onMedals} aria-label={`メダルを みる。${medalCount}こ ゲット`}><span>メダル</span><strong>{medalCount} / 10</strong></button></div></div></section>
}

function Select({ progress, initialLevel, initialChoice, level2Open, level3Open, level4Open, level5Open, level6Open, level7Open, level8Open, randomOpen, onBack, onSelect }: { progress: Progress; initialLevel: Level; initialChoice: Choice | null; level2Open: boolean; level3Open: boolean; level4Open: boolean; level5Open: boolean; level6Open: boolean; level7Open: boolean; level8Open: boolean; randomOpen: boolean; onBack: () => void; onSelect: (level: Level, set: string, random?: boolean, mode?: Mode) => void }) {
  const initialSet = (value: Level) => value === 1 ? groupNames[0] : value === 2 ? pairs[0] : value === 3 || value === 7 ? 'all' : value === 8 ? 'words' : value === 4 ? dakutenGroupNames[0] : value === 5 ? youonGroupNames[0] : voicedYouonGroupNames[0]
  const startingChoice = initialChoice || { level: initialLevel, set: initialSet(initialLevel), random: false, mode: 'challenge' as Mode }
  const [mode, setMode] = useState<Mode>(startingChoice.mode)
  const [level, setLevel] = useState<Level>(startingChoice.level)
  const [set, setSet] = useState(startingChoice.set)
  const [random, setRandom] = useState(startingChoice.random)
  const chooseLevel = (next: Level) => { if (next === 2 && !level2Open || next === 3 && !level3Open || next === 4 && !level4Open || next === 5 && !level5Open || next === 6 && !level6Open || next === 7 && !level7Open || next === 8 && !level8Open) return; setLevel(next); setSet(initialSet(next)); setRandom(next === 7 || next === 8) }
  const choices = level === 1 ? groupNames : level === 2 ? pairs : level === 3 ? ['じゅんばん', 'らんだむ'] : level === 4 ? dakutenGroupNames : level === 5 ? youonGroupNames : level === 6 ? voicedYouonGroupNames : level === 7 ? ['ランダム'] : ['ことば']
  const chooseSet = (value: string) => { if (level === 3) { if (value === 'らんだむ' && !randomOpen) return; setRandom(value === 'らんだむ'); setSet('all'); return }; if (level === 7 || level === 8) { setRandom(true); setSet(level === 7 ? 'all' : 'words'); return }; setSet(value) }
  const startLabel = level === 1 || level === 4 || level === 5 || level === 6 ? `${set}ぎょうで` : level === 2 ? `${set.split('').join('・')}で` : level === 7 ? '30もん ランダムで' : level === 8 ? 'ことば 10もんで' : 'ランダムで'
  const unlockNote = !level2Open ? 'レベル2は レベル1の バッジを ぜんぶ ゲットしたら できるよ。' : !level3Open ? 'レベル3は レベル2の バッジを ぜんぶ ゲットしたら できるよ。' : !level4Open ? 'レベル4は レベル3の じゅんばんを まちがえずに クリアしたら できるよ。' : !level5Open ? 'レベル5は レベル4の バッジを ぜんぶ ゲットしたら できるよ。' : !level6Open ? 'レベル6は レベル5の バッジを ぜんぶ ゲットしたら できるよ。' : !level7Open ? 'レベル7は レベル6の バッジを ぜんぶ ゲットしたら できるよ。' : !level8Open ? 'レベル8は レベル7を まちがえずに クリアしたら できるよ。' : ''
  const rangeLabel = level === 1 || level === 4 || level === 5 || level === 6 ? 'ぎょう' : level === 2 ? 'くみ' : level === 8 ? 'ことば' : level === 7 ? 'もんだい' : 'ならびかた'
  return <section className="content-page select-page"><button className="back-button" onClick={onBack}>← もどる</button><div className="page-heading compact-heading"><h2>もんだいを えらぼう</h2><p>えらんだら スタートを おしてね。</p></div><div className={`choice-box ${level >= 3 ? 'single-badge-level' : ''}`}><div className="choice-row"><span>モード</span><div className="mode-choice" aria-label="モードを えらぶ"><button aria-pressed={mode === 'practice'} className={mode === 'practice' ? 'selected' : ''} onClick={() => setMode('practice')}>れんしゅう</button><button aria-pressed={mode === 'challenge'} className={mode === 'challenge' ? 'selected' : ''} onClick={() => setMode('challenge')}>ほんばん</button></div></div><div className="choice-row level-row"><span>レベル</span><div className="level-picks">{([1, 2, 3, 4, 5, 6, 7, 8] as Level[]).map(value => { const open = value === 1 || value === 2 && level2Open || value === 3 && level3Open || value === 4 && level4Open || value === 5 && level5Open || value === 6 && level6Open || value === 7 && level7Open || value === 8 && level8Open; return <button disabled={!open} aria-pressed={level === value} className={level === value ? 'selected' : ''} key={value} onClick={() => chooseLevel(value)}>{value}</button> })}</div>{unlockNote && <p className="unlock-note">{unlockNote}</p>}</div><div className="choice-row range-row"><span>{rangeLabel}</span><div className={`range-picks ${level === 3 || level >= 7 ? 'level-three-picks' : level === 5 ? 'level-five-picks' : ''}`}>{choices.map(value => { const isLevelThree = level === 3; const nextRandom = isLevelThree ? value === 'らんだむ' : level >= 7; const nextSet = isLevelThree || level === 7 ? 'all' : level === 8 ? 'words' : value; const selected = isLevelThree ? random === nextRandom : set === nextSet; const status = stageStatus(progress, { level, set: nextSet, random: nextRandom, mode: 'challenge' }); return <button disabled={isLevelThree && value === 'らんだむ' && !randomOpen} aria-pressed={selected} className={selected ? 'selected' : ''} key={value} onClick={() => chooseSet(value)}><span>{level === 2 ? value.split('').join('・') : value === 'らんだむ' || value === 'ランダム' ? 'ランダム' : value}</span><StatusMarks status={status} showEmpty showSpeed={level < 3} /></button> })}</div></div><p className="status-legend">{level < 3 ? '★ まちがえなし　⚡ はやくできた' : '★ まちがえなし'}<br />きろくが のこるのは ほんばん だけ</p><button className="start-button primary-action" onClick={() => onSelect(level, set, random, mode)}>レベル{level}　{startLabel}　スタート →</button></div></section>
}

function Game({ choice, back, finish }: { choice: Choice; back: () => void; finish: (result: GameResult) => void }) {
  const questions = useMemo(() => { const source: Kana[] = choice.level === 1 ? kanaGroups[choice.set] : choice.level === 2 ? pairKana(choice.set) : choice.level === 3 ? allKana : choice.level === 4 ? dakutenGroups[choice.set] : choice.level === 5 ? youonGroups[choice.set] : choice.level === 6 ? voicedYouonGroups[choice.set] : choice.level === 7 ? shuffle(allAvailableKana).slice(0, 30) : shuffle(shortWords).slice(0, 10); return choice.random ? shuffle(source) : source }, [choice])
  const [index, setIndex] = useState(0), [, setMisses] = useState(0), [combo, setCombo] = useState(0), [hint, setHint] = useState(false), [hintUsed, setHintUsed] = useState(false), [started] = useState(Date.now()), [wrong, setWrong] = useState<string | null>(null)
  const missesRef = useRef(0)
  const q = questions[index]
  const options = useMemo(() => shuffle([q.roma, ...shuffle(allAvailableKana.filter(x => x.roma !== q.roma)).slice(0, choice.level === 2 ? 9 : 4).map(x => x.roma)]), [q, choice.level])
  useEffect(() => { if (choice.mode === 'practice') { const timer = setTimeout(() => setHint(true), 3000); return () => clearTimeout(timer) } }, [index, choice.mode])
  const addMiss = () => { missesRef.current += 1; setMisses(m => m + 1) }
  const useHint = () => { if (!hintUsed) { setHintUsed(true); addMiss() }; setHint(true) }
  const answer = (roma: string) => { if (roma === q.roma) { const next = index + 1; setCombo(c => c + 1); setWrong(null); if (next === questions.length) finish({ misses: missesRef.current, seconds: (Date.now() - started) / 1000 }); else { setIndex(next); setHint(false); setHintUsed(false) } } else { addMiss(); setCombo(0); setWrong(roma); setHint(true) } }
  return <section className="game-page"><div className="game-top"><button className="back-button" onClick={back}>← もどる</button><span className="game-count" aria-label={`${index + 1}もんめ。ぜんぶで ${questions.length}もん`}>{index + 1} / {questions.length}</span><span className="combo-count" aria-live="polite">{combo > 1 ? `★ ${combo}` : ''}</span></div><div className="progress-track" aria-hidden="true"><i style={{ width: `${(index / questions.length) * 100}%` }} /></div><div className="game-card"><p className="mode-label">{choice.mode === 'practice' ? 'れんしゅう' : 'ほんばん'}</p><p className="prompt">この もじの ローマじは？</p><div className="question-kana">{q.kana}</div><button className="in-game-hint" onClick={useHint}>{hint ? 'こたえを みたよ' : 'こたえを みる'}</button>{hint && <p className="hint-text" aria-live="polite">こたえは <b>{q.roma}</b> だよ<br /><small>みどりの こたえを タップ！</small></p>}<div className={`answer-grid ${choice.level === 2 ? 'many' : ''}`}>{options.map(roma => <button key={roma} className={hint && roma === q.roma ? 'answer right' : wrong === roma ? 'answer wrong' : 'answer'} onClick={() => answer(roma)}>{roma}</button>)}</div></div></section>
}

export function resultStars(choice: Choice, result: GameResult) {
  if (choice.mode === 'practice') return []
  const count = questionCount(choice)
  return [result.misses === 0 ? 'no-miss' : '', choice.level < 3 && result.seconds < count * 2 ? 'speed' : ''].filter(Boolean)
}

export function questionCount(choice: Choice) {
  return choice.level === 1 ? kanaGroups[choice.set].length : choice.level === 2 ? pairKana(choice.set).length : choice.level === 3 ? allKana.length : choice.level === 4 ? dakutenGroups[choice.set].length : choice.level === 5 ? youonGroups[choice.set].length : choice.level === 6 ? voicedYouonGroups[choice.set].length : choice.level === 7 ? 30 : 10
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

function StatusMarks({ status, showEmpty = false, showSpeed = true }: { status: ReturnType<typeof stageStatus>; showEmpty?: boolean; showSpeed?: boolean }) {
  if (!showEmpty && !status.completed && !status.noMiss && !status.speed) return null
  const badges = [{ mark: '★', earned: status.noMiss, label: 'まちがえなし', kind: 'no-miss-badge' }, ...(showSpeed ? [{ mark: '⚡', earned: status.speed, label: 'はやくできた', kind: 'speed-badge' }] : [])]
  return <span className={status.completed ? 'status-marks completed' : 'status-marks'} aria-label={badges.filter(badge => badge.earned).map(badge => badge.label).join('　') || 'まだ バッジがない'}>{badges.map(badge => <i className={badge.earned ? `filled ${badge.kind}` : ''} key={badge.mark} aria-hidden="true">{badge.earned ? badge.mark : ''}</i>)}{status.bestTime !== undefined && <small>{status.bestTime.toFixed(1)}びょう</small>}</span>
}

function Result({ choice, result, newMedals, onCloseMedals, onViewMedals, onRetry, onSelect, onRecord }: { choice: Choice; result: GameResult; newMedals: MedalId[]; onCloseMedals: () => void; onViewMedals: () => void; onRetry: () => void; onSelect: () => void; onRecord: () => void }) {
  const stars = resultStars(choice, result)
  const clean = stars.includes('no-miss')
  const quick = stars.includes('speed')
  const mainActionRef = useRef<HTMLButtonElement>(null)
  const missedBadges = choice.mode === 'challenge' && (!clean || (choice.level < 3 && !quick))
  const closeMedalPopup = () => { onCloseMedals(); requestAnimationFrame(() => mainActionRef.current?.focus()) }
  return <section className="result-page"><div className="result-card"><p className="eyebrow">よく できました！</p><div className="result-mark" aria-hidden="true">{choice.mode === 'practice' ? '☺' : clean ? '★' : '○'}</div><h2>{questionCount(choice)}もん できたよ！</h2>{choice.mode === 'practice' ? <p className="result-copy">れんしゅうを おわったよ。<br />つぎは ほんばんにも ちょうせんしてみよう！</p> : <><p className="result-copy">{clean ? 'まちがえずに できたね！' : 'さいごまで がんばったね！'}</p><p className="earned-label">こんかいの バッジ</p><div className="earned-stars"><span className={`badge-slot ${clean ? 'earned' : ''}`}><i aria-hidden="true">{clean ? '★' : ''}</i><small>まちがえ なし</small></span>{choice.level < 3 && <span className={`badge-slot ${quick ? 'earned' : ''}`}><i aria-hidden="true">{quick ? '⚡' : ''}</i><small>はやく できた</small></span>}</div><p className="result-note">{choice.level === 3 ? `こんかいは ${result.seconds.toFixed(1)} びょう だったよ` : choice.level >= 4 && clean ? 'まちがえなし バッジを ゲット！' : missedBadges ? 'つぎは まちがえなしで バッジを ゲットしよう！' : '⚡は 1もじ 2びょうより はやいと もらえるよ'}</p></>}<div className="result-actions">{choice.mode === 'practice' ? <button ref={mainActionRef} className="primary-button primary-action" onClick={onSelect}>ほんばんを えらぶ</button> : <div className="result-primary-actions"><button className="retry-button" onClick={onRetry}>もう いちど</button><button ref={mainActionRef} className="next-button primary-action" onClick={onSelect}>ほかの もんだいを えらぶ →</button></div>}<button className="result-record" onClick={onRecord}>きろくを みる →</button></div></div>{newMedals.length > 0 && <MedalPopup medals={newMedals} onClose={closeMedalPopup} onView={onViewMedals} />}</section>
}

function MedalPopup({ medals, onClose, onView, detail }: { medals: MedalId[]; onClose: () => void; onView?: () => void; detail?: boolean }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const items = medalDefinitions.filter(medal => medals.includes(medal.id))
  useEffect(() => { closeButtonRef.current?.focus(); const handleKeydown = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); onClose(); return } if (event.key !== 'Tab') return; const controls = popupRef.current?.querySelectorAll<HTMLButtonElement>('button'); if (!controls?.length) return; const first = controls[0]; const last = controls[controls.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() } }; window.addEventListener('keydown', handleKeydown); return () => window.removeEventListener('keydown', handleKeydown) }, [onClose])
  return <div className="medal-overlay" role="dialog" aria-modal="true" aria-label={detail ? 'メダルの せつめい' : 'メダルを ゲット'}><div className="medal-popup" ref={popupRef}><p className="eyebrow">{detail ? 'メダルの せつめい' : 'メダル ゲット！'}</p><div className="medal-popup-list">{items.map(medal => <div className="medal-popup-item" key={medal.id}><i aria-hidden="true">{medal.icon}</i><span><b>{medal.title}</b><small>{detail ? medal.how : medal.subtitle}</small></span></div>)}</div><div className="medal-popup-actions">{onView && <button className="text-button" onClick={onView}>メダルを みる</button>}<button ref={closeButtonRef} className="primary-button" onClick={onClose}>{detail ? 'もどる' : 'いいね！'}</button></div></div></div>
}

function Medals({ progress, onBack }: { progress: Progress; onBack: () => void }) {
  const [detail, setDetail] = useState<MedalId | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const shouldRestoreFocus = useRef(false)
  const earned = medalsFor(progress)
  useEffect(() => { if (!detail && shouldRestoreFocus.current) { shouldRestoreFocus.current = false; triggerRef.current?.focus() } }, [detail])
  const closeDetail = () => { shouldRestoreFocus.current = true; setDetail(null) }
  return <section className="content-page medals-page"><button className="back-button" onClick={onBack}>← もどる</button><div className="page-heading medal-heading"><h2>メダル</h2><p>{earned.length} / 10　ゲット</p></div><p className="medal-help">メダルを おすと ゲットの しかたが みられるよ。</p><div className="medal-grid">{medalDefinitions.map(medal => { const isEarned = earned.includes(medal.id); return <button key={medal.id} className={`medal-card ${isEarned ? 'earned' : ''}`} onClick={(event) => { triggerRef.current = event.currentTarget; setDetail(medal.id) }}><i aria-hidden="true">{isEarned ? medal.icon : ''}</i><span>{medal.title}</span><small>{medal.subtitle}</small></button> })}</div>{detail && <MedalPopup medals={[detail]} detail onClose={closeDetail} />}</section>
}

function Book({ onBack }: { onBack: () => void }) {
  const [part, setPart] = useState<1 | 4 | 5 | 6 | 8>(1)
  const items = part === 1 ? allKana : part === 4 ? allDakuten : part === 5 ? allYouon : part === 6 ? allVoicedYouon : shortWords
  return <section className="content-page book-page"><button className="back-button" onClick={onBack}>← もどる</button><div className="page-heading"><p className="eyebrow">いつでも かくにん</p><h2>いちらん</h2><p>もじと ローマじを みくらべてみよう。</p></div><div className="book-tabs" aria-label="いちらんの レベルを えらぶ"><button className={part === 1 ? 'selected' : ''} aria-pressed={part === 1} onClick={() => setPart(1)}>レベル1〜3</button><button className={part === 4 ? 'selected' : ''} aria-pressed={part === 4} onClick={() => setPart(4)}>レベル4</button><button className={part === 5 ? 'selected' : ''} aria-pressed={part === 5} onClick={() => setPart(5)}>レベル5</button><button className={part === 6 ? 'selected' : ''} aria-pressed={part === 6} onClick={() => setPart(6)}>レベル6</button><button className={part === 8 ? 'selected' : ''} aria-pressed={part === 8} onClick={() => setPart(8)}>ことば</button></div><div className={`kana-chart book-chart ${part === 8 ? 'word-chart' : ''}`} aria-label="ひらがなと ローマじの いちらん">{items.map(x => <div className="kana-item" key={x.kana}><b>{x.kana}</b><span>{x.roma}</span></div>)}</div></section>
}
function Record({ progress, onBack, reset }: { progress: Progress; onBack: () => void; reset: () => void }) {
  const [level, setLevel] = useState<Level>(1)
  const stages = level === 1
    ? groupNames.map(set => ({ label: set, choice: { level: 1 as Level, set, random: false, mode: 'challenge' as Mode } }))
    : level === 2
      ? pairs.map(set => ({ label: set.split('').join('・'), choice: { level: 2 as Level, set, random: false, mode: 'challenge' as Mode } }))
      : level === 3
        ? [{ label: 'じゅんばん', choice: { level: 3 as Level, set: 'all', random: false, mode: 'challenge' as Mode } }, { label: 'ランダム', choice: { level: 3 as Level, set: 'all', random: true, mode: 'challenge' as Mode } }]
        : level === 4
          ? dakutenGroupNames.map(set => ({ label: set, choice: { level: 4 as Level, set, random: false, mode: 'challenge' as Mode } }))
          : level === 5
            ? youonGroupNames.map(set => ({ label: set, choice: { level: 5 as Level, set, random: false, mode: 'challenge' as Mode } }))
            : level === 6
              ? voicedYouonGroupNames.map(set => ({ label: set, choice: { level: 6 as Level, set, random: false, mode: 'challenge' as Mode } }))
              : level === 7
                ? [{ label: '30もん ランダム', choice: { level: 7 as Level, set: 'all', random: true, mode: 'challenge' as Mode } }]
                : [{ label: 'ことば 10もん', choice: { level: 8 as Level, set: 'words', random: true, mode: 'challenge' as Mode } }]
  return <section className="content-page record-page"><button className="back-button" onClick={onBack}>← もどる</button><div className="page-heading record-heading"><h2>きろく</h2><p>クリアした ステージに いろが つくよ。</p></div><div className="record-level-tabs" aria-label="レベルを えらぶ">{([1, 2, 3, 4, 5, 6, 7, 8] as Level[]).map(value => <button aria-pressed={level === value} className={level === value ? 'selected' : ''} onClick={() => setLevel(value)} key={value}>レベル{value}</button>)}</div><div className={`record-stage-grid record-level-${level}`}>{stages.map(({ label, choice }) => { const status = stageStatus(progress, choice); return <div className={`record-stage ${status.completed ? 'completed' : ''}`} key={id(choice)}><strong>{label}</strong><StatusMarks status={status} showEmpty showSpeed={level < 3} />{level === 3 && <small className="record-time">{status.bestTime === undefined ? 'さいたん －' : `さいたん ${status.bestTime.toFixed(1)}びょう`}</small>}</div> })}</div><button className="reset-button" onClick={reset}>きろくを リセット</button></section>
}

export function finish(progress: Progress, choice: Choice, result: { misses: number; seconds: number }): Progress { if (choice.mode === 'practice') return progress; const key = id(choice); const stars = [...(progress.stars[key] || [])]; if (result.misses === 0 && !stars.includes('no-miss')) stars.push('no-miss'); if (choice.level < 3 && result.seconds < (choice.level === 1 ? kanaGroups[choice.set].length : pairKana(choice.set).length) * 2 && !stars.includes('speed')) stars.push('speed'); const best = progress.bestTimes[key]; return { ...progress, completed: [...new Set([...progress.completed, key])], stars: { ...progress.stars, [key]: stars }, bestTimes: choice.level === 3 && (!best || result.seconds < best) ? { ...progress.bestTimes, [key]: result.seconds } : progress.bestTimes } }
