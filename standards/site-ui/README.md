# 文档站可复用 UI 标准 v1.0

日期：2026-11-13。适用：Docusaurus 3.9、React 19、MDX、CSS Modules；当前参考实现为东山Π文档站。此文档可直接交给其他开发者作为接入与验收规范。

## 模块边界

| 模块 | 可复用实现 | 每个项目需要提供 |
| --- | --- | --- |
| 主板照片交互 | [BoardExplorer](../../src/components/BoardExplorer/index.jsx)、照片查看器、接口说明、索引、选择状态 | 板型名称、照片、裁切范围、接口坐标、说明、教程链接 |
| 博客分类页 | [BlogListPage](../../src/theme/BlogListPage/index.jsx)、全量索引、筛选与排序 | 分类、系列、文章映射、显示标题、真实缩略图 |
| 发布检查 | [测试](../../tests/site-ui.test.cjs)、[产物检查](../../scripts/verify-build.cjs)、[CI](../../.github/workflows/deploy.yml) | 本站关键路由、部署目标、仓库 Secrets |

公共模块不导入某一板型的数据。板型组件只负责数据、标题和自己的业务场景。博客数据在构建阶段生成，浏览器只做筛选和展示，不下载或解析 Markdown 正文。

发布遵循“验证一次，共用产物”：PR 只做检查；master 构建成功后，GitHub Pages 和 SSH 服务器同步独立执行。主站发布不应等待镜像服务器上传；仓库写权限仅授予需要更新 `gh-pages` 的任务。

这些模块依赖 Docusaurus 的路由、Link、baseUrl、主题和插件 API。迁往普通 React/Vite 项目时，需要替换这些适配层；并非直接安装即可使用的独立 npm 包。

当前主板组件文案为中文；在英文产品中复用时需补充翻译。中英文构建通过不会自动完成内容翻译。本仓库本次验证记录见 [检查报告](../../design/code-review.md)。

## 主板交互接入

普通产品页使用一个组件：

```jsx
import BoardExplorer from '@site/src/components/BoardExplorer';
import {VIEWS, PORTS} from './board-data';

<BoardExplorer
  name="MyBoard"
  title="认识主板接口"
  description="切换正反面，选择接口查看用途与教程。"
  views={VIEWS}
  ports={PORTS}
  scopeNote="照片对应底板版本；连接与供电要求请核对配套硬件资料。"
/>
```

[A1 接入示例](../../src/components/A1BoardExplorer/index.jsx)使用这个入口。需要任务步骤、学习场景或独立布局时，参考 [CM5 接入](../../src/components/CM5BoardExplorer/index.jsx)，组合以下公共模块：

- `PhotoViewer`：照片、热点、轮廓、缩放、拖动和全屏。
- `PortDetails`：接口说明、准备物品和教程链接；`children` 放置场景专有操作。
- `PortDirectory`：接口索引与分类按钮。
- `useBoardSelection`：选择接口、切换面、筛选及 `?port=` 同步。

### 数据契约

`VIEWS` 至少提供 `front`，通常包含 `front` 和 `back`：

```js
export const VIEWS = {
  front: {
    label: '正面',
    photo: '/img/my-board/front.jpg',
    imageWidth: 1600,
    crop: {x: 100, y: 200, width: 1400, height: 1100},
    defaultPort: 'hdmi',
  },
};
export const PORTS = [{
  id: 'hdmi',
  number: '01',
  name: 'HDMI',
  side: 'front',
  group: '常用接口',
  kind: '显示',
  rect: [250, 1000, 120, 250],
  description: '用于连接显示器。',
  supplies: ['HDMI 线', '显示器'],
  note: '分辨率与音频支持以当前系统为准。',
  href: '/docs/my-board/first-boot',
  link: '查看首次启动教程',
}];
```

| 字段/规则 | 约束 |
| --- | --- |
| `id` | 在该板型内唯一且稳定；分享链接使用该值 |
| `side` | 必须对应 `VIEWS` 中已有的面 |
| `defaultPort` | 必须存在，并且属于对应面 |
| `group` | 当前版本为“常用接口”或“扩展接口”；“全部”是筛选项 |
| `rect` | 原图像素坐标 `[x,y,width,height]`，不得使用浏览器显示后的尺寸 |
| `crop` | 原图裁切范围；热点矩形应完整位于范围内 |
| `photo` | 静态资源 URL 或打包后的图片导入；查看器通过 `useBaseUrl` 适配路径 |
| 说明与教程 | 使用本板型对应资料，不从接口外观推断协议、供电或烧录步骤 |

`validateBoard` 在组件首次渲染时校验数据，错误会使静态构建失败。新增板型需让其组件实际被页面引用，才能进入构建验收。

### 交互验收

- 默认正面选择其 `defaultPort`；背面显示全部接口。
- 点选接口同步更新热点、说明、索引及 URL；默认保留现有查询参数和哈希。
- 接口切换只维护一份选择状态，正反面由所选接口派生。
- 有效深链接定位到对应面；无效 ID 回到默认接口。
- 选择新接口、切换照片或全屏时恢复完整视图；缩放范围 100%–250%。
- 图片失败时索引与文字说明仍可用。
- 手机布局无横向溢出；热点支持键盘选择。场景标签支持左右键、Home、End。
- 当前 hook 使用单个 `port` 参数；一个路由放多个独立导览前，先扩展查询参数命名，避免选择冲突。

## 博客分类页接入

复制 `plugins/blog-catalog/`、`src/theme/BlogListPage/` 与其日期格式工具，并在 `docusaurus.config.js` 的 plugins 中注册 `./plugins/blog-catalog`。保留 Docusaurus 默认博客内容插件，文章 permalink 继续由它生成。

### 配置与逻辑分别维护

| 文件 | 内容 |
| --- | --- |
| [config.cjs](../../plugins/blog-catalog/config.cjs) | 分类、系列顺序、标签归类、旧文章兼容、标题覆盖 |
| [thumbnails.json](../../plugins/blog-catalog/thumbnails.json) | 文章 ID 对应的缩略图地址、原始图片来源与 fit |
| [catalog.cjs](../../plugins/blog-catalog/catalog.cjs) | 从全量公开博客元数据建立索引并校验配置 |
| [selectors.cjs](../../src/theme/BlogListPage/selectors.cjs) | 查询参数、日期排序、系列与旧分页、总览代表文章 |
| [样式](../../src/theme/BlogListPage/styles.module.css) | 仅作用于博客列表；继承站点主题变量 |

新文章优先在 frontmatter 写 `category: ai` 等有效主分类 ID，可用 `display_title` 指定简短显示标题。未指定分类时，依次使用文章映射、标签规则和默认分类。错误的显式分类应报错，避免拼写错误悄悄归入其他分类。

每篇公开文章只有一个主分类，可以属于多个专题；分类计数基于全部公开文章，不基于当前分页。草稿和 unlisted 文章不出现在目录中。发布日期必须有明确 frontmatter，缺少日期的文章始终排在日期排序末尾。

系列的 `posts` 是阅读顺序；分类的 `featured` 是总览优先顺序。某语言不存在的系列文章会被过滤，不能为凑数量伪造文章。配置与公开文章的 ID 不得重复。

### URL 与视觉约定

- `?category=ai`：分类；`?series=vision`：系列；`?view=latest`：按日期查看全部。
- `?sort=oldest`：最早优先，刷新和浏览器返回应恢复排序。
- 原有 `/blog/page/2` 等归档路径继续使用其原分页文章集合。
- 站内搜索只使用顶部现有搜索；内容区不另建搜索框。
- 使用真实原文图片。无图文章保持文字排版，不用任意占位图冒充配图。
- 桌面总览缩略图 136×84，完整列表 200×124，手机 88×66；`cover` 为默认，长图可选 `contain`。
- 原图保留；缩略图独立存于 `static/img/blog/`，记录来源，限制分辨率，并使用 lazy loading。
- 当前站点标题为总览 1.1rem、完整列表 1.2rem，卡片间距 1rem。移植可按字体与站点容器调整。
- 博客文章、系列入口、“查看全部”和页脚链接均不显示装饰右箭头。这是本博客的已确认设计，不扩展到主板导览的操作按钮。

缩略图清单示例：

```json
{
  "my-post": {
    "src": "/img/blog/my-post.jpg",
    "source": "blog/my-post/images/result.png",
    "fit": "cover"
  }
}
```

## 构建与发布标准

本仓库统一使用 npm 和提交到 Git 的 `package-lock.json`。首次安装使用 `npm ci`，不能只依赖本机现有 node_modules。CI 使用 Node 20；本次本地检查环境为 Node 20.20.1。

```sh
npm ci
npm run check
npm run serve -- --host 127.0.0.1 --port 3576
```

`check` 依次执行行为测试、完整中英文生产构建、产物校验。仅运行 `npm run build -- --locale zh-Hans` 属于中文预览检查，不能替代正式发布验收。

站点将失效链接与失效锚点都配置为构建错误，修复实际目标，不通过忽略警告规避检查。

产物检查包含关键中英文入口、这些入口的本地链接与资源、搜索索引、真实缩略图尺寸及博客右箭头回归。迁移到其他站点时更新 `scripts/verify-build.cjs` 的入口路由与图片要求。它不会遍历所有外部链接，也不能代替浏览器交互和硬件验证。

### CI 行为

- PR 到 master：安装锁定依赖、测试、构建、检查并保存产物；不部署。
- master 推送或在 master 手动运行：部署上述同一份已校验产物。
- 同一分支串行执行，避免两个部署交错覆盖。
- 构建任务仅需 contents:read；发布任务单独授予 contents:write。
- 发布保留现有 SSH 服务器和 GitHub Pages 两个目标；只改发布机制，不改变目标路径。

### 发布前交接

1. 确认本次新增组件、插件、图片、文档、tests 和 scripts 均已纳入提交；本地未跟踪文件不会出现在 CI。
2. 确认 HOST、USERNAME、PASSWORD、PORT 四个仓库 Secrets，以及 GitHub Pages 的 gh-pages 分支与域名配置。
3. 查看 `npm run check` 结果，并在浏览器核对主板正反面、深链接、博客筛选排序与手机布局。
4. 发布后确认两个目标的关键页面、资源和搜索均可访问，记录对应 commit。
5. 回滚使用上一个已验证提交的产物，不能只回退页面源码而保留不匹配资源。

现有 SSH 发布仍是覆盖复制，不会自动清理旧文件，也不是原子切换；两处发布不是一个事务，SSH 失败时后续 Pages 不会执行。需要无间断部署、旧文件清理或两处独立重试时，应在确认服务器目录和服务配置后设计发布目录/切换方案。
