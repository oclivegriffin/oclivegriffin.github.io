import fs from 'fs';
import { Marked } from 'marked';
import hljs from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import markedFootnote from 'marked-footnote';

// Then register the languages you need
hljs.registerLanguage('python', python);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);

const HTML_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
    <title>{{title}}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta charset="utf-8">
    <link rel="stylesheet" href="index.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css">
    <script>
        window.MathJax = {
            tex: {
                inlineMath: [['\\\\(', '\\\\)']],
                displayMath: [['\\\\[', '\\\\]']],
                processEscapes: true
            },
            svg: {
                fontCache: 'global'
            }
        };
    </script>
    <script id="MathJax-script" async 
        src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js">
    </script>

    <!-- Copy to clipboard -->
    <script>
        function copyMathToClipboard(element) {
            const latex = element.getAttribute('data-latex');
            navigator.clipboard.writeText(latex).then(() => {
                element.style.opacity = '0.5';
                setTimeout(() => element.style.opacity = '1', 200);
            });
        }
    </script>
</head>
<body>
    {{content}}
</body>
</html> 
`;

// Add math extension
const mathExtension = {
    name: 'math',
    level: 'inline',
    start(src) { return src.match(/\$/)?.index; },
    tokenizer(src, tokens) {
        const blockRule = /^\$\$([\s\S]*?)\$\$/;
        const inlineRule = /^\$((?:\\\$|[^$])+)\$/;

        let match;
        if (match = blockRule.exec(src)) {
            return {
                type: 'math',
                raw: match[0],
                text: match[1],
                display: true
            };
        } else if (match = inlineRule.exec(src)) {
            return {
                type: 'math',
                raw: match[0],
                text: match[1],
                display: false
            };
        }
    },
    renderer(token) {
        const latex = token.text.replace(/"/g, '&quot;');
        const clipboardIcon = '<svg class="copy-icon" viewBox="0 0 24 24"><path fill="currentColor" d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"/></svg>';

        if (token.display) {
            return `<span class="math-container math-block" onclick="copyMathToClipboard(this)" data-latex="$$${latex}$$">\\[${token.text}\\]${clipboardIcon}</span>`;
        }
        return `<span class="math-container math-inline" onclick="copyMathToClipboard(this)" data-latex="$${latex}$">\\(${token.text}\\)${clipboardIcon}</span>`;
    }
};

const marked = new Marked({
    gfm: true,
    breaks: true,
    extensions: [mathExtension],
    highlight: function(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return hljs.highlight(code, { language: lang }).value;
            } catch (err) {
                console.error('Error highlighting code:', err);
            }
        }
        return code;
    }
});

marked.use(markedFootnote());

function blogMdTemplate(title, content) {
    return `
**[home](./index.html)**

# ${title}

${content}
`;
}

async function convertMarkdownToHtml(mdPath, htmlFile, title, type) {
    // Read markdown and template files
    let mdContent = fs.readFileSync(mdPath, 'utf-8');

    if (type === 'blog') {
        mdContent = blogMdTemplate(title, mdContent);
    }

    // Convert markdown to HTML
    const html = marked.parse(mdContent);

    const baseHtml = HTML_TEMPLATE
        .replace('{{content}}', html)
        .replace('{{title}}', title);

    // Write the final HTML file
    fs.writeFileSync(htmlFile, baseHtml);

    console.log(`Converted ${mdPath} to ${htmlFile}`);
}

export async function convertMarkdownIndex() {
    const publishIndex = JSON.parse(
        fs.readFileSync('./content/publish_index.json', 'utf-8')
    );

    if (!Array.isArray(publishIndex)) {
        throw new Error('publish_index.json is not a valid array');
    }

    for (const entry of publishIndex) {
        await convertMarkdownToHtml(
            entry.source,
            `./htdocs/${entry.url_path}`,
            entry.title,
            entry.type
        );
    }
}