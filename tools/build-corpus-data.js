/**
 * 语料入库脚本（Node.js，无需第三方依赖）
 * 作用：把「长乐斋古代文献」1.5 万+ txt 原始白文，抽取为 H5 可用的候选条目池，
 *       并验证种子数据中的经典是否真实存在于语料中。
 *
 * 用法：
 *   node tools/build-corpus-data.js scan    # 扫描语料 -> output/candidates.json
 *   node tools/build-corpus-data.js verify  # 校验种子条目在语料中的命中情况
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..'); // -> daizhigev20
const CORPUS_DIRS = ['儒藏', '道藏', '佛藏', '诗藏', '子藏', '史藏', '医藏', '易藏', '艺藏', '集藏'];
const OUT = path.resolve(__dirname, '..', 'output');
const CAT_MAP = { '儒藏': 'ru', '道藏': 'dao', '佛藏': 'fo', '诗藏': 'shi', '史藏': 'jian', '子藏': 'chu' };

// 四库全书常见的页眉/校勘噪声
const NOISE = [/钦定四库全书/g, /总纂官/g, /总　校　官/g, /【臣】/g, /乾隆\d+年/g, /\u3000/g];

function cleanLine(s) {
  s = s.replace(/\s+/g, ' ').trim();
  NOISE.forEach(function (re) { s = s.replace(re, ''); });
  return s.trim();
}

function walk(dir, out) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.txt')) out.push(p);
  }
}

function firstSnippet(file) {
  let buf;
  try { buf = fs.readFileSync(file, 'utf8'); } catch (e) { return ''; }
  const lines = buf.split('\n').map(cleanLine).filter(function (l) {
    return l.length > 6 && !/^提要/.test(l) && !/^卷[一二三四五六七八九十]+$/.test(l);
  });
  // 取前若干有效行拼接，截断到 ~140 字
  let snip = lines.slice(0, 6).join(' ').slice(0, 140);
  return snip;
}

function scan() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  const files = [];
  CORPUS_DIRS.forEach(function (d) { walk(path.join(ROOT, d), files); });
  const candidates = [];
  files.forEach(function (f) {
    const rel = path.relative(ROOT, f).split(path.sep);
    const top = rel[0];
    const title = path.basename(f, '.txt');
    const snippet = firstSnippet(f);
    if (!snippet) return;
    candidates.push({
      file: rel.join('/'),
      title: title,
      cat: CAT_MAP[top] || 'other',
      snippet: snippet
    });
  });
  fs.writeFileSync(path.join(OUT, 'candidates.json'), JSON.stringify(candidates, null, 2), 'utf8');
  console.log('扫描完成：' + files.length + ' 个文件，生成候选 ' + candidates.length + ' 条 -> output/candidates.json');
  // 简单统计各分类候选数
  const stat = {};
  candidates.forEach(function (c) { stat[c.cat] = (stat[c.cat] || 0) + 1; });
  console.log('分类候选分布：', JSON.stringify(stat));
}

function verify() {
  // data.js 为浏览器脚本（用 window 赋值、单引号字符串），用 vm 沙箱加载
  const vm = require('vm');
  const src = fs.readFileSync(path.resolve(__dirname, '..', 'js', 'data.js'), 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  const DATA = sandbox.window.GUOXUE_DATA;
  const quotes = DATA.quotes;
  console.log('种子条目数：' + quotes.length);

  // 每个种子取去标点前 10 字作为探针
  const probes = quotes.map(function (q) {
    return { id: q.id, title: q.title, probe: q.original.replace(/[，。？！、]/g, '').slice(0, 10) };
  });

  // 收集全部藏的文件列表（覆盖所有分类，确保校验完整）
  const files = [];
  CORPUS_DIRS.forEach(function (d) { walk(path.join(ROOT, d), files); });
  console.log('待扫描文件：' + files.length);

  const hitMap = {};
  probes.forEach(function (p) { hitMap[p.id] = false; });

  // 每个文件只读一次，批量匹配所有探针
  let done = 0;
  for (const f of files) {
    let buf; try { buf = fs.readFileSync(f, 'utf8'); } catch (e) { continue; }
    for (const p of probes) {
      if (!hitMap[p.id] && buf.indexOf(p.probe) >= 0) hitMap[p.id] = true;
    }
    if (++done % 2000 === 0) console.log('  已扫描 ' + done + ' 文件…');
    if (probes.every(function (p) { return hitMap[p.id]; })) break; // 全命中即可提前结束
  }

  let hit = 0;
  probes.forEach(function (p) {
    if (hitMap[p.id]) hit++;
    console.log((hitMap[p.id] ? '✓' : '✗') + ' ' + p.id + ' 《' + p.title + '》 探针「' + p.probe + '」');
  });
  console.log('\n命中 ' + hit + '/' + quotes.length + ' 条（证明种子经典确实存在于本地语料）');
}

const mode = process.argv[2] || 'scan';
try {
  if (mode === 'scan') scan();
  else if (mode === 'verify') verify();
  else console.log('用法: node tools/build-corpus-data.js [scan|verify]');
} catch (e) {
  console.error('运行出错：', e && e.stack ? e.stack : e);
  process.exit(1);
}
