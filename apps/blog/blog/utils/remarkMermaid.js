import { visit } from 'unist-util-visit';

export function remarkMermaidToHtml() {
  return (tree) => {
    visit(tree, 'code', (node, index, parent) => {
      if (node.lang === 'mermaid') {
        const mermaidHtml = `<pre class="mermaid">\n${node.value}\n</pre>`;
        parent.children[index] = { type: 'html', value: mermaidHtml };
      }
    });
  };
}

export default remarkMermaidToHtml;
