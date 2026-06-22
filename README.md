# 两人食单 · 健康餐管理 App

增肌 / 减脂 × 中式口味 × 养生。两个人一起规划每天吃什么,带食谱、卡路里、购物清单和可打印 PDF。

## 功能
- **今日**:按当前时间自动推断"现在该吃哪一餐",一键进入做法。
- **周计划**:7 天 × 早午晚加餐网格,点菜入餐,自动算每日热量与人均。改动**自动保存到本地**(`localStorage`),刷新/关掉再开都还在。
- **餐点库**:浏览全部菜品,按类型/目标(增肌·减脂·均衡)筛选,加入到指定某天某一餐。
- **食谱册**:翻页式分步做法,每步一张图,带可选倒计时。
- **购物清单**:根据周计划自动汇总本周食材,可勾选打钩。
- **打印 / PDF**:一键调起打印,选「另存为 PDF」即得文件。

## 本地运行
```bash
npm install
npm run dev      # 打开终端里给出的地址
npm run build    # 生产构建,产物在 dist/
npm run preview  # 预览生产构建
```
需要 Node.js 18+。

## 一键部署到 Vercel
这是一个纯前端 Vite 应用,Vercel 零配置识别。三选一:

**A. 网页导入(最省事)**
1. 把本项目推到一个 GitHub 仓库。
2. 打开 https://vercel.com/new ,选 Import,挑这个仓库。
3. 框架它会自动识别为 **Vite**,Build = `npm run build`,Output = `dist`,直接 Deploy。

**B. 命令行**
```bash
npm i -g vercel
vercel        # 首次会问几个问题,一路回车
vercel --prod # 部署到正式环境
```

**C. 一键 Deploy 按钮**
推到 GitHub 后,把下面链接里的 `你的用户名/仓库名` 换成自己的,放进仓库 README 即可得到一键按钮:
`https://vercel.com/new/clone?repository-url=https://github.com/你的用户名/仓库名`

> 路由用的是 HashRouter(地址里带 `#`),所以刷新任何页面都不会 404,Vercel 不需要额外的 rewrite 配置。

## 换上真实/AI 图片(每步配图)
应用里每个步骤的图当前是**统一风格的占位图**(用每道菜的主题色着色,同一道菜风格一致)。要换成真图:

把图片按这个命名放进 `public/recipes/` 即可,应用会自动加载、覆盖占位图:
```
public/recipes/<菜的id>/step-1.jpg
public/recipes/<菜的id>/step-2.jpg
...
```
- `<菜的id>` 见 `src/data/recipes.ts` 里每道菜的 `id`(如 `steamed-bass`、`pepper-chicken`)。
- `step-N` 对应第 N 步(从 1 开始)。
- 建议尺寸 4:3,如 1200×900,JPG。

**找免费图**:Unsplash / Pexels / Pixabay 搜英文关键词,如 `steamed sea bass`、`chopping vegetables`、`stir fry chicken`。

**用 AI 生成图(保持同一道菜风格统一)**:给每道菜用同一句"风格前缀",只改动作描述。例如:
> 统一前缀:*"top-down food photography, soft natural window light, light wood table, ceramic celadon plate, minimal Chinese home-kitchen style, warm muted tones —"*
> 再接当步动作:*"… scoring a whole sea bass with a knife"* / *"… steamed fish topped with scallion, hot oil being poured"*

同一道菜的所有步骤都用这套前缀,出来的图风格就一致。

## 加 / 改菜
全部菜品在 `src/data/recipes.ts`,照现有结构复制一份对象、改字段即可。预填的一周在 `src/lib/store.ts` 的 `seedWeek()` 里。
