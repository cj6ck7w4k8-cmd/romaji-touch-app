export type Kana = { kana: string; roma: string; group: string }

// 型情報を保ったまま、行名を各文字に付与する。
const raw: Record<string, [string, string][]> = {
  'あ': [['あ','a'],['い','i'],['う','u'],['え','e'],['お','o']], 'か': [['か','ka'],['き','ki'],['く','ku'],['け','ke'],['こ','ko']],
  'さ': [['さ','sa'],['し','si'],['す','su'],['せ','se'],['そ','so']], 'た': [['た','ta'],['ち','ti'],['つ','tu'],['て','te'],['と','to']],
  'な': [['な','na'],['に','ni'],['ぬ','nu'],['ね','ne'],['の','no']], 'は': [['は','ha'],['ひ','hi'],['ふ','hu'],['へ','he'],['ほ','ho']],
  'ま': [['ま','ma'],['み','mi'],['む','mu'],['め','me'],['も','mo']], 'や': [['や','ya'],['ゆ','yu'],['よ','yo']],
  'ら': [['ら','ra'],['り','ri'],['る','ru'],['れ','re'],['ろ','ro']], 'わ': [['わ','wa'],['を','wo'],['ん','n']]
}
export const kanaGroups: Record<string, Kana[]> = Object.fromEntries(Object.entries(raw).map(([group, items]) => [group, items.map(([kana, roma]) => ({ kana, roma, group }))]))
export const groupNames = Object.keys(kanaGroups)
export const allKana = Object.values(kanaGroups).flat()
export const pairs = groupNames.slice(0, -1).map((name, i) => `${name}${groupNames[i + 1]}`)
export const pairKana = (pair: string) => pair.split('').flatMap((name) => kanaGroups[name])
export const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5)
