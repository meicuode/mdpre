import { expect, test, describe, beforeAll } from 'vitest';
import { marked } from 'marked';

describe('Markdown List Rendering', () => {
  beforeAll(() => {
    const renderer = new marked.Renderer();
    renderer.listitem = function (this: any, data: any) {
      const tokens = data?.tokens;
      const task = data?.task ?? false;
      const checked = data?.checked ?? false;

      let content: string;
      if (tokens && this.parser) {
        try {
          content = this.parser.parse(tokens);
        } catch (_) {
          content = typeof data === 'string' ? data : data?.text ?? '';
        }
      } else {
        content = typeof data === 'string' ? data : data?.text ?? '';
      }

      if (task) {
        // Strip default marked checkbox which is automatically injected by marked lexer
        content = content.replace(/^(<p>)?\s*<input[^>]*type="checkbox"[^>]*>\s*/i, '$1');

        const checkbox = checked
          ? '<input type="checkbox" checked disabled class="task-checkbox" />'
          : '<input type="checkbox" disabled class="task-checkbox" />';
          
        let finalContent = content.trim();
        if (finalContent.startsWith('<p>')) {
          finalContent = finalContent.replace(/^<p>/, `<p>${checkbox} `);
        } else {
          finalContent = `${checkbox} ${finalContent}`;
        }
        return `<li class="task-list-item">${finalContent}</li>`;
      }
      return `<li>${content}</li>`;
    };

    marked.setOptions({ renderer, breaks: true, gfm: true } as any);
  });

  test('紧凑型任务列表 (Tight task list)', async () => {
    const md = `- [x] 任务一`;
    const html = await marked.parse(md);
    expect(html).toContain('<li class="task-list-item"><input type="checkbox" checked disabled class="task-checkbox" /> 任务一</li>');
  });

  test('松散型任务列表包裹 P 标签 (Loose task list with P tag)', async () => {
    const md = `- [ ] 任务二\n\n  第二段落`;
    const html = await marked.parse(md);
    // 验证 checkbox 是否成功被注入到了第一个 <p> 标签内部，而不是在外面
    expect(html).toContain('<li class="task-list-item"><p><input type="checkbox" disabled class="task-checkbox" /> 任务二</p>');
    expect(html).toContain('<p>第二段落</p></li>');
  });

  test('列表内嵌套代码块场景 (Nested code block in list)', async () => {
    const md = `1. **标准化的生成提示词**：\n   \`\`\`\n   请根据以下场景生成\n   \`\`\``;
    const html = await marked.parse(md);
    // 验证粗体和代码块都被正确渲染（如果是 parseInline 会丢失 code 标签）
    expect(html).toContain('<strong>标准化的生成提示词</strong>');
    expect(html).toContain('<pre><code>请根据以下场景生成\n</code></pre>');
  });
});
