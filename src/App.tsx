import { useEffect, useMemo, useState } from 'react'
import { allKana, groupNames, kanaGroups, pairKana, pairs, shuffle, type Kana } from './data'
import { clearProgress, loadProgress, saveProgress, type Progress } from './storage'

type View = 'home' | 'select' | 'game' | 'book' | 'record'
type Level = 1 | 2 | 3
type Mode = 'practice' | 'challenge'
type Choice = { level: Level; set: string; random: boolean; mode: Mode }
const labels = { 1: '1つずつ おぼえよう', 2: '2つ つづけて しょうぶ！', 3: 'ぜんぶの もじ' }
const id = (c: Choice) => `${c.level}-${c.set}-${c.random ? 'random' : 'normal'}`

export function App() {
  const [view, setView] = useState<View>('home')
  const [progress, setProgress] = useState<Progress>(() => loadProgress())
  const [choice, setChoice] = useState<Choice | null>(null)
  useEffect(() => saveProgress(progress), [progress])
  const level2Open = groupNames.every(g => progress.completed.includes(`1-${g}-normal`))
  const level3Open = pairs.every(p => progress.completed.includes(`2-${p}-normal`))
  const randomOpen = progress.stars['3-all-normal']?.includes('no-miss')
  const select = (level: Level, set: string, random = false) => {
    setChoice({ level, set, random, mode: 'challenge' })
    setView('game')
  }
  if (view === 'game' && choice) return <Game choice={choice} back={() => setView('select')} finish={(result) => { setProgress(p => finish(p, choice, result)); setView('record') }} />
  return <main className="app"><header><button className="logo" onClick={() => setView('home')}>ろーまじ<br/><b>ますたー</b></button><nav><button onClick={() => setView('book')}>ひんと</button><button onClick={() => setView('record')}>きろく</button></nav></header>
    {view === 'home' && <section className="hero"><div className="mascot">🌟</div><h1>ろーまじを<br/>たのしく おぼえよう！</h1><p>もじを みて　ろーまじを えらぼう</p><button className="primary" onClick={() => setView('select')}>あそぶ ▶</button><div className="tip">ろーまじは　にほんしきだよ</div></section>}
    {view === 'select' && <section><h2>れべるを えらぼう</h2><div className="level-grid"><LevelCard level={1} text={labels[1]} open onClick={() => select(1, groupNames[0])}/><LevelCard level={2} text={labels[2]} open={level2Open} onClick={() => select(2, pairs[0])}/><LevelCard level={3} text={labels[3]} open={level3Open} onClick={() => select(3, 'all')}/></div>
      <div className="sets"><h3>れべる1　1つ えらぼう</h3><div>{groupNames.map(g => <button key={g} aria-label={`${g}ぎょう`} onClick={() => select(1,g)}>{g}</button>)}</div><h3>れべる2　2つ えらぼう</h3><div>{pairs.map(p => <button disabled={!level2Open} key={p} onClick={() => select(2,p)}>{p.split('').join('・')}</button>)}</div><h3>れべる3</h3><button disabled={!level3Open} onClick={() => select(3,'all')}>じゅんばん</button><button disabled={!randomOpen} onClick={() => select(3,'all',true)}>らんだむ</button></div></section>}
    {view === 'book' && <Book />}
    {view === 'record' && <Record progress={progress} reset={() => { if(confirm('きろくを ぜんぶ けしますか？')) { clearProgress(); setProgress(loadProgress()) }}} />}
  </main>
}

function LevelCard({level,text,open,onClick}:{level:number;text:string;open:boolean;onClick:()=>void}) { return <button className={`level-card ${open?'':'locked'}`} disabled={!open} onClick={onClick}><span>れべる {level}</span><strong>{open ? text : 'まだ あそべないよ 🔒'}</strong></button> }
function Game({choice, back, finish}:{choice:Choice;back:()=>void;finish:(result:{misses:number;seconds:number})=>void}) {
  const questions = useMemo(() => { const source: Kana[] = choice.level===1 ? kanaGroups[choice.set] : choice.level===2 ? pairKana(choice.set) : allKana; return choice.random ? shuffle(source) : source }, [choice])
  const [index,setIndex] = useState(0), [misses,setMisses]=useState(0), [combo,setCombo]=useState(0), [hint,setHint]=useState(false), [started]=useState(Date.now()), [wrong,setWrong]=useState<string|null>(null), [mode,setMode]=useState<Mode>(choice.mode)
  const q=questions[index]; const options=useMemo(()=>shuffle([q.roma,...shuffle(allKana.filter(x=>x.roma!==q.roma)).slice(0, Math.max(4, choice.level===2?9:4)).map(x=>x.roma)]),[q,choice.level])
  useEffect(()=>{ if(mode==='practice') { const timer=setTimeout(()=>setHint(true),3000); return()=>clearTimeout(timer) } },[index,mode])
  const answer=(roma:string)=> { if(roma===q.roma) { const next=index+1; setCombo(c=>c+1); setWrong(null); if(next===questions.length) finish({misses,seconds:(Date.now()-started)/1000}); else { setIndex(next);setHint(false) } } else { setMisses(m=>m+1);setCombo(0);setWrong(roma);setHint(true) } }
  return <section className="game"><div className="game-head"><button onClick={back}>もどる</button><span>{index+1} / {questions.length}</span><span>🔥 {combo}</span></div><div className="progress"><i style={{width:`${(index/questions.length)*100}%`}}/></div><button className="mode" onClick={()=>setMode(mode==='challenge'?'practice':'challenge')}>{mode==='challenge'?'ほんばん':'れんしゅう'}</button><p className="prompt">この もじの　ろーまじは？</p><div className="kana">{q.kana}</div>{combo>=2 && <p className="combo">{combo}れんぞく！ 🎉</p>}{hint && <p className="hint">こたえ：<b className="vowels">{q.roma}</b></p>}<div className="answers">{options.map(roma=><button key={roma} className={hint&&roma===q.roma?'answer right':wrong===roma?'answer wrong':'answer'} onClick={()=>answer(roma)}>{roma}</button>)}</div></section>
}
function Book(){return <section className="hint-page"><h2>ひんと</h2><p>もじを たっぷして みてみよう</p><div className="kana-chart" aria-label="あいうえお ひょう">{groupNames.map(g=><div className="kana-column" key={g}>{kanaGroups[g].map(x=><button key={x.kana} aria-label={`${x.kana} は ${x.roma}`}><b>{x.kana}</b><span>{x.roma}</span></button>)}</div>)}</div></section>}
function Record({progress,reset}:{progress:Progress;reset:()=>void}) { const entries=Object.entries(progress.stars); return <section><h2>きみの きろく</h2><div className="record"><strong>{progress.completed.length}</strong><span>くりあ した すてーじ</span></div>{entries.length===0?<p>まだ きろくが ないよ。あそんでみよう！</p>:<div className="records">{entries.map(([key,stars])=><p key={key}>{key}　{stars.includes('no-miss')?'⭐':''}{stars.includes('speed')?'⚡':''} {progress.bestTimes[key]&&`${progress.bestTimes[key].toFixed(1)}びょう`}</p>)}</div>}<button className="reset" onClick={reset}>きろくを りせっと</button></section>}
export function finish(progress:Progress, choice:Choice, result:{misses:number;seconds:number}):Progress { const key=id(choice); const stars=[...(progress.stars[key]||[])]; if(result.misses===0&&!stars.includes('no-miss')) stars.push('no-miss'); if(choice.level<3&&result.seconds < (choice.level===1?kanaGroups[choice.set].length:pairKana(choice.set).length)*2&&!stars.includes('speed')) stars.push('speed'); const best=progress.bestTimes[key]; return {...progress,completed:[...new Set([...progress.completed,key])],stars:{...progress.stars,[key]:stars},bestTimes:choice.level===3&&(!best||result.seconds<best)?{...progress.bestTimes,[key]:result.seconds}:progress.bestTimes} }
