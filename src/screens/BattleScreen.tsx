import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { AttackButton, ErrorMessage, HealthBar, Loading, PokemonType } from '../components/Common';
import { Fighter, applyLevel, buildFighter, calcDamage, effectiveness, expForLevel, expProgress } from '../utils/battle';
import { friendlyError, getEvolutionFor, getMove } from '../services/pokeApi';
import { playCry, playSfx } from '../services/audio';
import { useGame } from '../store/GameContext';
import { GYMS, MACHINES, STONES } from '../data/world';
import { MoveInfo, TeamMember } from '../types';
import { cap } from '../utils/typeColors';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
type Mode = 'menu' | 'moves' | 'bag' | 'team' | 'learn' | 'busy';

export default function BattleScreen({ navigation, route }: any) {
  const gymIdx: number | undefined = route.params?.gym;
  const gym = gymIdx !== undefined ? GYMS[gymIdx] : null;
  const { team, settings, bag, badges, setTeam, setBag, addBadge, respawn } = useGame();
  const local = useRef<TeamMember[]>(team.map(m => ({ ...m })));      // cópia de trabalho da equipe
  const party = useRef<(Fighter | null)[]>(team.map(() => null));
  const cur = useRef(0), eIdx = useRef(0), part = useRef(new Set<number>());
  const E = useRef<Fighter | null>(null), bagR = useRef({ ...bag }), totalXp = useRef(0);
  const [player, setPlayer] = useState<Fighter | null>(null);
  const [enemy, setEnemy] = useState<Fighter | null>(null);
  const [msg, setMsg] = useState(''); const [mode, setMode] = useState<Mode>('busy'); const [err, setErr] = useState<string | null>(null);
  const shake = useRef(new Animated.Value(0)).current;
  const leveled = useRef(new Set<number>());
  const learnRes = useRef<((i: number) => void) | null>(null);
  const [learning, setLearning] = useState<{ f: Fighter; info: MoveInfo } | null>(null);
  const P = () => party.current[cur.current]!;

  const say = async (t: string, ms = 900) => { setMsg(t); await sleep(ms); };
  const ready = () => { setMsg(`O que ${cap(P().name)} fará?`); setMode('menu'); };
  const hit = (v: number) => settings.animations && Animated.sequence([-1, 1, 0].map(k => Animated.timing(shake, { toValue: k * v, duration: 60, useNativeDriver: true }))).start();
  const sync = (i: number) => { const f = party.current[i]; if (f) local.current[i].hp = f.hp; };
  const mk = async (i: number) => {
    let f = party.current[i];
    if (!f) {
      const m = local.current[i];
      f = await buildFighter(m.id, m.level, m.hp, m.moves?.length ? m.moves : undefined, 2); // começa com 2 golpes
      party.current[i] = f; m.maxHp = f.maxHp; m.hp = f.hp; m.moves = f.moves.map(x => x.name);
    }
    return f;
  };
  const exit = (params: any) => { setTeam(local.current.map(m => ({ ...m }))); setBag(bagR.current); navigation.replace('Result', params); };
  const evolveAll = async () => {
    for (const i of leveled.current) {
      try {
        const m = local.current[i], old = party.current[i]!;
        const evo = await getEvolutionFor(m.id, m.level); if (!evo) continue;
        const oldName = old.name;
        await say(`O quê? ${cap(oldName)} está evoluindo!`, 1200);
        const nf = await buildFighter(evo.id, m.level, null, m.moves);
        nf.hp = Math.min(nf.maxHp, old.hp + (nf.maxHp - old.maxHp));
        if (settings.animations && i === cur.current) for (let k = 0; k < 6; k++) { setPlayer({ ...(k % 2 ? nf : old) }); await sleep(250); }
        party.current[i] = nf; m.id = evo.id; m.name = evo.name; m.maxHp = nf.maxHp; m.hp = nf.hp;
        if (i === cur.current) setPlayer({ ...nf });
        playSfx('win'); playCry(nf.cry);
        await say(`Parabéns! ${cap(oldName)} evoluiu para ${cap(evo.name)}!`, 1500);
      } catch { /* falha na API não impede o fim da batalha */ }
    }
  };
  const win = async (caught?: string) => {
    playSfx('win'); await evolveAll();
    if (gym) { addBadge(gymIdx!); bagR.current = { ...bagR.current, potions: bagR.current.potions + 3, balls: bagR.current.balls + 5 }; }
    if (!caught && (gym || Math.random() < 0.12)) { // pedra de evolução: sempre em ginásio, 12% em batalha selvagem
      const st = STONES[Math.floor(Math.random() * STONES.length)], have = bagR.current.stones ?? {};
      bagR.current = { ...bagR.current, stones: { ...have, [st]: (have[st] ?? 0) + 1 } };
      await say(`Você encontrou ${cap(st)}!`, 1200);
    }
    const rewards: string[] = [];
    if (gym && (gym.tm || gym.hm)) {
      const mc = { ...(bagR.current.machines ?? {}) };
      for (const k of [gym.tm, gym.hm]) if (k) { mc[k] = MACHINES[k].hm ? 1 : (mc[k] ?? 0) + 1; rewards.push(`${MACHINES[k].label} ${cap(k)}`); }
      bagR.current = { ...bagR.current, machines: mc };
    }
    exit({ win: true, xp: totalXp.current, badge: gym?.badge, caught, rewards });
  };
  const lose = () => { playSfx('lose'); local.current = local.current.map(m => ({ ...m, hp: null })); respawn(); exit({ win: false, xp: 0 }); };

  const sendEnemy = async () => {
    let e: Fighter;
    if (gym) { const s = gym.team[eIdx.current]; e = await buildFighter(s.id, s.level); }
    else e = await buildFighter(1 + Math.floor(Math.random() * 1025), Math.max(2, P().level - 2 + Math.floor(Math.random() * 4)));
    E.current = e; setEnemy({ ...e }); playSfx('enter'); playCry(e.cry);
    part.current = new Set([cur.current]);
    await say(gym ? `${gym.leader} enviou ${cap(e.name)}!` : `Um ${cap(e.name)} selvagem apareceu!`);
  };
  const start = async () => {
    setErr(null); setMode('busy');
    try {
      const lead = local.current.findIndex(m => m.hp === null || m.hp > 0);
      if (lead < 0) throw new Error('NOHP');
      cur.current = lead; const p = await mk(lead); setPlayer({ ...p }); await sendEnemy(); ready();
    } catch (x: any) { setErr(x.message === 'NOHP' ? 'Todos os seus Pokémon estão sem HP. Visite um Centro Pokémon (🏥).' : friendlyError(x)); }
  };
  useEffect(() => { start(); }, []);

  // executa um ataque; devolve true se o alvo desmaiou
  const run = async (a: Fighter, d: Fighter, m: MoveInfo, isPlayer: boolean) => {
    await say(`${cap(a.name)} usou ${cap(m.name)}!`); playSfx('attack');
    if (m.accuracy && Math.random() * 100 > m.accuracy) { await say('O ataque errou!'); return false; }
    const eff = await effectiveness(m.type.name, d.types);
    if (eff === 0) { await say(`Não afeta ${cap(d.name)}...`); return false; }
    const crit = Math.random() < 1 / 16;
    const dmg = m.power ? calcDamage(a, d, m, eff, crit, isPlayer && badges.includes(0) ? 1.1 : 1) : 0; // Insígnia Pedra: +10% Ataque
    d.hp = Math.max(0, d.hp - dmg);
    isPlayer ? setEnemy({ ...d }) : (setPlayer({ ...d }), sync(cur.current));
    hit(isPlayer ? 10 : -10); playSfx(eff > 1 ? 'super' : eff < 1 ? 'weak' : 'hit');
    if (crit) await say('Golpe crítico!', 700);
    if (eff > 1) await say('É super efetivo!', 700); else if (eff < 1) await say('Não é muito efetivo...', 700);
    if (dmg) await say(`${cap(d.name)} perdeu ${dmg} HP!`, 800);
    return d.hp <= 0;
  };
  const askReplace = (f: Fighter, info: MoveInfo) => new Promise<number>(res => {
    setLearning({ f, info }); setMsg(`${cap(f.name)} quer aprender ${cap(info.name)}, mas já sabe 4 golpes. Esquecer qual?`);
    learnRes.current = (k: number) => { setLearning(null); setMode('busy'); res(k); }; setMode('learn');
  });
  const learnMoves = async (f: Fighter, m: TeamMember, oldLv: number, lv: number) => {
    const fresh = f.learn.filter(l => l.level > oldLv && l.level <= lv && !f.moves.some(x => x.name === l.name)).sort((a, b) => a.level - b.level);
    for (const l of fresh) {
      let info: MoveInfo; try { info = await getMove(l.name); } catch { continue; }
      if (f.moves.length < 4) { f.moves.push(info); await say(`${cap(f.name)} aprendeu ${cap(info.name)}!`); }
      else {
        const k = await askReplace(f, info);
        if (k >= 0) { const o = f.moves[k].name; f.moves[k] = info; await say(`${cap(f.name)} esqueceu ${cap(o)} e aprendeu ${cap(info.name)}!`); }
        else await say(`${cap(f.name)} não aprendeu ${cap(info.name)}.`);
      }
      m.moves = f.moves.map(x => x.name);
    }
  };
  const gainXp = async (e: Fighter) => {
    const gain = Math.floor(((e.baseExp * e.level) / 7) * (gym ? 1.5 : 1));
    const who = [...part.current].filter(i => party.current[i] && party.current[i]!.hp > 0);
    const each = Math.max(1, Math.floor(gain / Math.max(1, who.length)));
    for (const i of who) {
      const f = party.current[i]!, m = local.current[i];
      m.exp += each; totalXp.current += each; await say(`${cap(f.name)} ganhou ${each} pontos de EXP!`);
      let lv = m.level; while (lv < 100 && m.exp >= expForLevel(lv + 1)) lv++;
      if (lv > m.level) {
        const old = f.maxHp, oldLv = m.level; leveled.current.add(i); m.level = lv; applyLevel(f, lv); f.hp = Math.min(f.maxHp, f.hp + f.maxHp - old);
        m.maxHp = f.maxHp; m.hp = f.hp; if (i === cur.current) setPlayer({ ...f });
        playSfx('win'); await say(`${cap(f.name)} subiu para o nível ${lv}!`);
        await learnMoves(f, m, oldLv, lv);
      }
    }
  };
  const playerFainted = async () => {
    await say(`${cap(P().name)} desmaiou!`); sync(cur.current);
    if (local.current.some((m, i) => i !== cur.current && (m.hp === null || m.hp > 0))) { setMsg('Escolha o próximo Pokémon.'); setMode('team'); } else lose();
  };
  const enemyFainted = async () => {
    const e = E.current!; await say(`${cap(e.name)} desmaiou!`); await gainXp(e);
    if (gym && eIdx.current < gym.team.length - 1) { eIdx.current++; await sendEnemy(); ready(); } else await win();
  };
  const enemyTurn = async () => {
    const e = E.current!; const m = e.moves[Math.floor(Math.random() * e.moves.length)];
    if (await run(e, P(), m, false)) await playerFainted(); else ready();
  };
  const fight = async (move: MoveInfo) => {
    const p = P(), e = E.current!; setMode('busy'); playSfx('select');
    try {
      const em = e.moves[Math.floor(Math.random() * e.moves.length)];
      const order: [Fighter, Fighter, MoveInfo, boolean][] = p.spe >= e.spe ? [[p, e, move, true], [e, p, em, false]] : [[e, p, em, false], [p, e, move, true]];
      for (const [a, d, m, isP] of order) {
        if (await run(a, d, m, isP)) { await (isP ? enemyFainted() : playerFainted()); return; }
      }
      ready();
    } catch (x) { setMsg(friendlyError(x)); setMode('menu'); }
  };
  const swap = async (i: number) => {
    setMode('busy');
    try {
      const forced = P().hp <= 0; const f = await mk(i);
      if (f.hp <= 0) { setMsg(`${cap(f.name)} não pode lutar!`); return setMode('team'); }
      cur.current = i; part.current.add(i); setPlayer({ ...f }); playSfx('enter'); playCry(f.cry);
      await say(`Vai, ${cap(f.name)}!`); forced ? ready() : await enemyTurn();
    } catch (x) { setMsg(friendlyError(x)); setMode('menu'); }
  };
  const potion = async () => {
    const p = P();
    if (bagR.current.potions <= 0) return setMsg('Você não tem Poções!');
    if (p.hp >= p.maxHp) return setMsg('O HP já está cheio!');
    bagR.current.potions--; setMode('busy'); p.hp = Math.min(p.maxHp, p.hp + 20); sync(cur.current); setPlayer({ ...p });
    await say(`${cap(p.name)} recuperou HP! (Poções: ${bagR.current.potions})`); await enemyTurn();
  };
  const ball = async () => {
    if (gym) return setMsg('Não dá para capturar o Pokémon de um treinador!');
    if (bagR.current.balls <= 0) return setMsg('Você não tem Poké Bolas!');
    bagR.current.balls--; setMode('busy'); const e = E.current!;
    await say('Você jogou uma Poké Bola!');
    if (Math.random() < 0.15 + 0.6 * (1 - e.hp / e.maxHp)) {
      if (local.current.length >= 6) { await say(`${cap(e.name)} foi capturado, mas sua equipe está cheia!`); return win(); }
      local.current.push({ id: e.id, name: e.name, level: e.level, exp: expForLevel(e.level), hp: e.hp, maxHp: e.maxHp, moves: e.moves.slice(0, 2).map(x => x.name) });
      await say(`${cap(e.name)} foi capturado!`); return win(cap(e.name));
    }
    await say('Quase! O Pokémon escapou.'); await enemyTurn();
  };
  const flee = () => {
    if (gym) return setMsg('Não dá para fugir de um líder de ginásio!');
    setTeam(local.current.map(m => ({ ...m }))); setBag(bagR.current); navigation.navigate('Map');
  };

  if (err) return <View style={{ flex: 1 }}><ErrorMessage message={err} onRetry={start} /><Button onPress={() => navigation.navigate('Map')}>Voltar ao mapa</Button></View>;
  if (!player || !enemy) return <Loading label="Preparando batalha..." />;
  const pm = local.current[cur.current];
  const Box = ({ f, back }: { f: Fighter; back?: boolean }) => (
    <View style={{ flexDirection: back ? 'row-reverse' : 'row', alignItems: 'center', marginVertical: 6 }}>
      <Animated.View style={{ transform: [{ translateX: back ? 0 : shake }] }}>
        <Image source={{ uri: (back ? f.back : f.front) ?? undefined }} style={{ width: 110, height: 110 }} resizeMode="contain" /></Animated.View>
      <View style={s.box}><Text variant="titleSmall">{cap(f.name)}  Nv.{f.level}</Text>
        <HealthBar hp={f.hp} max={f.maxHp} animate={settings.animations} /><Text style={{ fontSize: 11 }}>{f.hp}/{f.maxHp} HP</Text>
        {back && <View style={{ height: 5, backgroundColor: '#ddd', borderRadius: 3, marginTop: 3 }}><View style={{ height: 5, borderRadius: 3, backgroundColor: '#3B82F6', width: `${expProgress(pm.level, pm.exp) * 100}%` }} /></View>}
        <View style={{ flexDirection: 'row', marginTop: 2 }}>{f.types.map(t => <PokemonType key={t} type={t} />)}</View></View></View>);
  return (
    <View style={{ flex: 1, padding: 12, justifyContent: 'space-between' }}>
      <View><Box f={enemy} /><Box f={player} back /></View>
      <View>
        <View style={s.msg}><Text>{msg}</Text></View>
        {mode === 'menu' && <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {([['Lutar', () => setMode('moves')], ['Pokémon', () => setMode('team')], ['Mochila', () => setMode('bag')], ['Fugir', flee]] as [string, () => void][]).map(([l, fn]) =>
            <Button key={l} mode="contained" style={{ width: '48%', margin: '1%' }} onPress={() => { playSfx('select'); fn(); }}>{l}</Button>)}</View>}
        {mode === 'moves' && <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {player.moves.map(m => <AttackButton key={m.name} name={m.name} type={m.type.name} power={m.power} acc={m.accuracy} pp={m.pp} cat={m.damage_class.name} onPress={() => fight(m)} />)}
          <Button onPress={() => setMode('menu')}>Voltar</Button></View>}
        {mode === 'bag' && <View>
          <Button mode="outlined" style={{ marginVertical: 2 }} onPress={potion}>Poção (+20 HP) x{bagR.current.potions}</Button>
          <Button mode="outlined" style={{ marginVertical: 2 }} onPress={ball}>Poké Bola x{bagR.current.balls}</Button>
          <Button onPress={() => setMode('menu')}>Voltar</Button></View>}
        {mode === 'team' && <View>{local.current.map((m, i) => <Button key={i} mode="outlined" disabled={(i === cur.current && player.hp > 0) || m.hp === 0} style={{ marginVertical: 2 }} onPress={() => swap(i)}>{cap(m.name)} Nv.{m.level}{m.hp !== null ? ` — ${m.hp} HP` : ''}</Button>)}
          {player.hp > 0 && <Button onPress={() => setMode('menu')}>Voltar</Button>}</View>}
        {mode === 'learn' && learning && <View>
          {learning.f.moves.map((mv, k) => <Button key={mv.name} mode="outlined" style={{ marginVertical: 2 }} onPress={() => learnRes.current?.(k)}>Esquecer {cap(mv.name)}</Button>)}
          <Button onPress={() => learnRes.current?.(-1)}>Não aprender {cap(learning.info.name)}</Button></View>}
        {mode === 'busy' && <Loading label="" />}
      </View></View>);
}
const s = StyleSheet.create({ box: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 8, marginHorizontal: 8 },
  msg: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, minHeight: 48 } });
