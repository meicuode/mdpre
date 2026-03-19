# Markdown Previewer SPA

## 项目介绍
这是一个基于完全浏览器端技术（无服务端解析）的纯静态单页面应用（SPA）。本应用允许用户通过拖拽本地的 Markdown 文件直接在浏览器中进行高质量预览。

该项目基于 Cloudflare Pages 架构，可以一键部署为全球加速的静态网页。

## 核心功能

1. **纯前端解析**
   - 依赖 `marked` 进行 Markdown 语法解析为 HTML。
   - 依赖 `highlight.js` 实现包含多种主流语言的代码高亮。
   - 依赖 `dompurify` 提供 XSS 安全过滤，确保直接渲染拖拽传入或导入的文件依然安全可靠。

2. **多窗口管理**
   - 采用 `react-draggable` 实现仿桌面的多悬浮窗机制。
   - 每个文档在拖拽进入时，都会打开一个独立窗口。
   - 窗口支持点击置顶（Z-index管理）、在页面内自由拖拽定位。
   - 窗口顶部控制栏支持**全屏最大化**与**关闭**功能。

3. **拖拽实时预览**
   - 实现全局拖拽事件拦截（Drag & Drop）。
   - 用户任何时候将系统的 `.md` 文件拖拽至浏览器窗口中并释放，即可立刻加载并打开该文件。无缝体验无网络延迟（纯本地读取）。

4. **现代化 UI / 高质感设计**
   - 界面整体采用 Vanilla CSS，应用大量毛玻璃材质（Glassmorphism）。
   - 主页背景采用动态 Mesh Gradient 网格渐变，充满高级感与活力。
   - 为正文排版（Typography）加入精心调优的各类边距和字号设计（内联 Github-Like 轻简美学风格）。

## 本地开发指南

该项目基于 Vite + React + TypeScript 初始化。
```bash
# 1. 安装依赖
npm install

# 2. 启动本地开发服务器
npm run dev

# 3. 产成生产打包
npm run build
```

部署时，将打包后的 `dist` 文件夹上传至 Cloudflare Pages，前端单页面应用即可直接运行。
