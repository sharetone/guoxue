# 国学日课 · 成人国学启蒙 H5

一个**零依赖、零构建**的移动端 H5 应用，可作为「小程序 / App」的 webview 入口，
内容源自仓库内「长乐斋古代文献」语料（佛藏 / 儒藏 / 诗藏 / 道藏… 共 1.5 万+ 篇）。

## 功能
- **每日一句**：按日期确定性推送，含原文 / 译文 / 给成年人的解读
- **主题选读**：儒家 / 道家 / 佛家 / 诗词 / 史鉴 / 处世 六大类
- **详情页**：原文 + 译文 + 解读 + 标签 + 收藏
- **检索**：按原文 / 译文 / 主题 / 作者关键词搜索
- **打卡**：连续打卡天数 + 近 7 日打卡点（localStorage 本地保存）
- **收藏 / 我的**：阅读统计与收藏管理

## 目录结构
```
guoxue-h5/
├─ index.html          # 入口（含底部 tab 导航）
├─ css/style.css       # 国风移动端样式
├─ js/
│  ├─ data.js          # 种子数据（window.GUOXUE_DATA：分类 + 36 条启蒙条目）
│  ├─ storage.js       # 本地存储（收藏 / 打卡 / 已读）
│  └─ app.js           # 原生 JS 路由 + 页面渲染
├─ tools/
│  └─ build-corpus-data.js  # 语料入库脚本：scan 抽取候选 / verify 校验种子
└─ output/candidates.json   # scan 产物（候选条目池）
```

## 本地预览
```bash
cd guoxue-h5
python -m http.server 8080
# 浏览器打开 http://localhost:8080/  （建议用移动端模拟视图）
```

## 嵌入小程序 / App（webview）
- 把 `guoxue-h5/` 整目录部署到任意静态托管（对象存储 / CDN / 自有服务器）。
- 微信小程序：用 `<web-view src="https://你的域名/guoxue-h5/index.html">` 承载；
  App 端用 WKWebView / X5 内核加载同一 URL 即可。
- **原生能力接管**：分享、登录、跨设备同步等，由原生层通过 JSBridge 调用，
  见 `app.js` 中 `data-act="share"` 等埋点。

## 规模化：从 1.5 万 txt 扩内容
原始语料多为无标点白文，启蒙场景需补「译文 + 解读」。两步流水线：

1. **抽取候选**  
   ```bash
   node tools/build-corpus-data.js scan
   ```
   扫描语料 -> `output/candidates.json`（file / title / cat / snippet 候选池）。

2. **补译文与解读**（二选一）  
   - 人工/编辑在候选池上精校；  
   - 或调用大模型对 `snippet` 批量生成译文+解读，回写 `js/data.js`。

3. **校验种子是否在语料中真实存在**  
   ```bash
   node tools/build-corpus-data.js verify
   ```

## 说明
- 译文 / 解读为启蒙版通俗释义，非学术校注；正式出版前建议请专业审核。
- 数据默认存 localStorage（单设备）。生产环境应改为后端账号体系。
