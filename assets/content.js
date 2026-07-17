function escapeHTML(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function youtubeEmbedId(url) {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
}

function linkAttrs(href) {
    const external = /^https?:\/\//.test(href);
    const isVideo = !!youtubeEmbedId(href);
    const cls = isVideo ? ' class="video-link"' : '';
    const target = external ? ' target="_blank" rel="noopener"' : '';
    const prefix = isVideo ? '▶ ' : '';
    return { cls, target, prefix };
}

function inlineFormat(text) {
    let out = escapeHTML(text);
    out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/(^|[^*])\*([^*]+?)\*([^*]|$)/g, '$1<em>$2</em>$3');
    out = out.replace(/\[([^\]]+)\]\(([^\s)]+)\)/g, (m, label, href) => {
        const { cls, target, prefix } = linkAttrs(href);
        return `<a href="${href}"${cls}${target}>${prefix}${label}</a>`;
    });
    out = out.replace(/(^|[^"'>])(https?:\/\/[^\s<]+)/g, (match, pre, url) => {
        const trimmed = url.replace(/[.,;)]+$/, '');
        const trailing = url.slice(trimmed.length);
        const { cls, target, prefix } = linkAttrs(trimmed);
        return `${pre}<a href="${trimmed}"${cls}${target}>${prefix}${trimmed}</a>${trailing}`;
    });
    return out;
}

function renderMarkdown(md) {
    const lines = md.replace(/\r\n/g, '\n').split('\n');
    const blocks = [];
    let current = null;

    function flush() {
        if (current && current.lines.length) blocks.push(current);
        current = null;
    }

    for (const rawLine of lines) {
        const line = rawLine.replace(/​/g, '').trimEnd();
        const trimmed = line.trim();

        if (trimmed === '') { flush(); continue; }

        const headingMatch = trimmed.match(/^(#{1,4})\s+(.*)$/);
        if (headingMatch) {
            flush();
            blocks.push({ type: 'heading', level: headingMatch[1].length, text: headingMatch[2] });
            continue;
        }

        if (/^-{3,}$/.test(trimmed)) {
            flush();
            blocks.push({ type: 'hr' });
            continue;
        }

        const ulMatch = trimmed.match(/^[-*]\s+(.*)$/);
        const olMatch = trimmed.match(/^\d+\.\s+(.*)$/);
        const bqMatch = trimmed.match(/^>\s?(.*)$/);

        if (bqMatch) {
            if (!current || current.type !== 'aside') { flush(); current = { type: 'aside', lines: [] }; }
            current.lines.push(bqMatch[1]);
            continue;
        }

        if (ulMatch) {
            if (!current || current.type !== 'ul') { flush(); current = { type: 'ul', lines: [] }; }
            current.lines.push(ulMatch[1]);
            continue;
        }
        if (olMatch) {
            if (!current || current.type !== 'ol') { flush(); current = { type: 'ol', lines: [] }; }
            current.lines.push(olMatch[1]);
            continue;
        }

        if (!current || current.type !== 'p') { flush(); current = { type: 'p', lines: [] }; }
        current.lines.push(trimmed);
    }
    flush();

    const usedIds = new Set();
    let html = '';
    let olRunningCount = 0;
    let olCanContinue = false;

    for (const block of blocks) {
        if (block.type !== 'ol' && block.type !== 'ul') {
            olRunningCount = 0;
            olCanContinue = false;
        }

        if (block.type === 'heading') {
            const text = block.text;
            const level = block.level;

            if (level === 1) {
                html += `<h1>${inlineFormat(text)}</h1>`;
                continue;
            }

            let id = slugify(text);
            let suffix = 2;
            while (usedIds.has(id)) { id = `${slugify(text)}-${suffix++}`; }
            usedIds.add(id);

            const tag = 'h' + level;
            html += `<${tag} id="${id}"><span>${inlineFormat(text)}</span><button class="link-btn" title="Copy link to this section" onclick="copyLink(event, '${id}')">🔗</button></${tag}>`;
            continue;
        }

        if (block.type === 'hr') {
            html += '<hr>';
            continue;
        }

        if (block.type === 'ul') {
            html += '<ul>' + block.lines.map(l => `<li>${inlineFormat(l)}</li>`).join('') + '</ul>';
            continue;
        }

        if (block.type === 'ol') {
            const start = olCanContinue ? olRunningCount + 1 : 1;
            const startAttr = start > 1 ? ` start="${start}"` : '';
            html += `<ol${startAttr}>` + block.lines.map(l => `<li>${inlineFormat(l)}</li>`).join('') + '</ol>';
            olRunningCount = start + block.lines.length - 1;
            olCanContinue = true;
            continue;
        }

        if (block.type === 'aside') {
            html += `<div class="aside">${inlineFormat(block.lines.join(' '))}</div>`;
            continue;
        }

        if (block.type === 'p') {
            const joined = block.lines.join(' ');
            const isWhollyItalic = /^\*[^*]+\*$/.test(joined.trim());
            if (isWhollyItalic) {
                html += `<div class="reflect-box">${inlineFormat(joined.trim().slice(1, -1))}</div>`;
                continue;
            }
            html += `<p>${inlineFormat(joined)}</p>`;
        }
    }

    return html;
}

function copyLink(e, hash) {
    if (e) e.stopPropagation();
    const url = location.origin + location.pathname + '#' + hash;
    const btn = e && e.currentTarget;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => flashCopied(btn));
    }
}

function flashCopied(btn) {
    if (!btn) return;
    const original = btn.textContent;
    btn.textContent = '✓';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = original; btn.classList.remove('copied'); }, 1200);
}

function handleHash() {
    const id = location.hash.replace('#', '');
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;
    setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el.classList.add('highlight-flash');
        setTimeout(() => el.classList.remove('highlight-flash'), 1600);
    }, 50);
}

function addPrintButton() {
    const btn = document.createElement('button');
    btn.className = 'print-btn';
    btn.textContent = 'Save as PDF';
    btn.onclick = () => window.print();
    document.body.insertBefore(btn, document.body.firstChild);
}

document.addEventListener('DOMContentLoaded', () => {
    const source = document.getElementById('content');
    const target = document.getElementById('rendered');
    if (source && target) {
        target.innerHTML = renderMarkdown(source.textContent);
    }
    addPrintButton();
    handleHash();
    window.addEventListener('hashchange', handleHash);
});
