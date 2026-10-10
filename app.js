const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const templates = {
  vocabulary: [
    { key: 'word', label: 'Japanese word', placeholder: '日本語', font: 'jp', full: true },
    { key: 'reading', label: 'Hiragana reading', placeholder: 'にほんご', font: 'jp' },
    { key: 'meaning', label: 'English meaning', placeholder: 'Japanese language', font: 'en' }
  ],
  kanji: [
    { key: 'kanji', label: 'Kanji', placeholder: '学', font: 'jp' },
    { key: 'meaning', label: 'English meaning', placeholder: 'study; learning', font: 'en' },
    { key: 'on', label: 'On-reading', placeholder: 'ガク', font: 'jp' },
    { key: 'kun', label: 'Kun-reading', placeholder: 'まな.ぶ', font: 'jp' }
  ],
  compound: [
    { key: 'word', label: 'Compound word', placeholder: '学生', font: 'jp', full: true },
    { key: 'reading', label: 'Hiragana reading', placeholder: 'がくせい', font: 'jp' },
    { key: 'meaning', label: 'English meaning', placeholder: 'student', font: 'en' }
  ],
  'vocab-quiz': [
    { key: 'word', label: 'Japanese word or question', placeholder: '水 means…?', font: 'jp', full: true },
    { key: 'option1', label: 'Option 1', placeholder: 'water', font: 'en' },
    { key: 'option2', label: 'Option 2', placeholder: 'fire', font: 'en' },
    { key: 'option3', label: 'Option 3', placeholder: 'mountain', font: 'en' },
    { key: 'option4', label: 'Option 4', placeholder: 'tree', font: 'en' },
    { key: 'correct', label: 'Correct answer', type: 'select', options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'], values: ['1', '2', '3', '4'] },
    { key: 'underlineCorrect', label: 'Underline correct option', type: 'checkbox' },
    { key: 'revealAnswer', label: 'Show answer on card', type: 'checkbox' }
  ],
  'kanji-quiz': [
    { key: 'kanji', label: 'Kanji', placeholder: '川', font: 'jp', full: true },
    { key: 'option1', label: 'Reading 1', placeholder: 'やま', font: 'jp' },
    { key: 'option2', label: 'Reading 2', placeholder: 'かわ', font: 'jp' },
    { key: 'option3', label: 'Reading 3', placeholder: 'そら', font: 'jp' },
    { key: 'option4', label: 'Reading 4', placeholder: 'うみ', font: 'jp' },
    { key: 'correct', label: 'Correct answer', type: 'select', options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'], values: ['1', '2', '3', '4'] },
    { key: 'underlineCorrect', label: 'Underline correct option', type: 'checkbox' },
    { key: 'revealAnswer', label: 'Show answer on card', type: 'checkbox' }
  ],
  reading: [
    { key: 'word', label: 'Kanji or compound', placeholder: '図書館', font: 'jp', full: true },
    { key: 'reading', label: 'Hiragana reading', placeholder: 'としょかん', font: 'jp' },
    { key: 'meaning', label: 'English meaning', placeholder: 'library', font: 'en' }
  ]
};

const optionalFields = {
  vocabulary: [
    { key: 'example', label: 'Example sentence', placeholder: '日本語を勉強します。', font: 'jp', area: true, group: 'example' },
    { key: 'translation', label: 'Example translation', placeholder: 'I study Japanese.', font: 'en', area: true, group: 'example' }
  ],
  kanji: [{ key: 'words', label: 'Example words', placeholder: '学生、学校', font: 'jp', area: true, group: 'words' }],
  compound: [{ key: 'example', label: 'Example sentence', placeholder: '図書館で本を読みます。', font: 'jp', area: true, group: 'example' }],
  'vocab-quiz': [{ key: 'reveal', label: 'Answer reveal note', placeholder: 'Correct answer: Option 1', font: 'en', area: true, group: 'reveal' }],
  'kanji-quiz': [],
  reading: []
};

const sizePresets = {
  reel: { width: 1080, height: 1920 },
  facebook: { width: 1080, height: 1350 },
  portrait: { width: 1080, height: 1440 },
  square: { width: 1080, height: 1080 }
};
const imageCache = new Map();
const templateFiles = {
  reel: 'Untitled design (3).jpg',
  facebook: 'Untitled design (2).jpg'
};
const state = { size: 'reel', alignment: 'center', optional: new Set(), queued: [], uploadData: null, renderFrame: 0 };
state.richStyles = {};
state.richTarget = null;
const canvas = $('#preview-canvas');

function fieldNodes(template) {
  return [...templates[template], ...optionalFields[template].filter(field => state.optional.has(field.key))];
}

function renderFields(template, values = {}) {
  state.optional = new Set(Object.keys(values).filter(key => optionalFields[template].some(field => field.key === key)));
  const root = $('#content-fields');
  root.replaceChildren();
  for (const field of fieldNodes(template)) {
    const wrapper = document.createElement('div');
    wrapper.className = `content-field${field.full ? ' full-width' : ''}`;
    const label = document.createElement('label');
    label.textContent = field.label;
    label.htmlFor = `field-${field.key}`;
    let input;
    if (field.type === 'checkbox') {
      input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = Boolean(values[field.key]);
      input.className = 'quiz-toggle';
      input.id = `field-${field.key}`;
      input.dataset.field = field.key;
      label.className = 'quiz-toggle-label';
      wrapper.append(input, label);
      root.append(wrapper);
      continue;
    } else if (field.type === 'select') {
      input = document.createElement('select');
      field.options.forEach((text, index) => {
        const option = document.createElement('option');
        option.value = field.values[index];
        option.textContent = text;
        input.append(option);
      });
    } else {
      input = field.area ? document.createElement('textarea') : document.createElement('input');
      if (field.placeholder) input.placeholder = field.placeholder;
      if (field.font === 'jp') input.lang = 'ja';
      if (field.font === 'jp') input.setAttribute('autocomplete', 'off');
    }
    input.id = `field-${field.key}`;
    input.dataset.field = field.key;
    input.value = values[field.key] ?? '';
    wrapper.append(label, input);
    if (optionalFields[template].some(optional => optional.key === field.key)) {
      const remove = document.createElement('button');
      remove.className = 'remove-field';
      remove.type = 'button';
      remove.dataset.removeField = field.key;
      remove.textContent = 'Remove';
      wrapper.append(remove);
    }
    root.append(wrapper);
  }
  $('#add-optional').hidden = optionalFields[template].every(field => state.optional.has(field.key));
}

function getFormValues() {
  return Object.fromEntries($$('[data-field]').map(input => [input.dataset.field, input.type === 'checkbox' ? input.checked : input.value]));
}

function getDimensions() {
  if (state.size !== 'custom') return sizePresets[state.size];
  return {
    width: Math.max(200, Math.min(4000, Number($('#custom-width').value) || 1080)),
    height: Math.max(200, Math.min(4000, Number($('#custom-height').value) || 1920))
  };
}

function ratioName(width, height) {
  const divisor = (a, b) => b === 0 ? a : divisor(b, a % b);
  const factor = divisor(width, height);
  return `${width / factor}:${height / factor}`;
}

function updateDimensions() {
  const { width, height } = getDimensions();
  const ratio = ratioName(width, height);
  $('#dimension-readout').innerHTML = `${width} × ${height} px <span>·</span> ${ratio}`;
  $('#preview-dimensions').textContent = `${width} × ${height}`;
  canvas.width = width;
  canvas.height = height;
  scheduleRender();
}

function selectedSettings() {
  const { width, height } = getDimensions();
  return {
    template: $('#template-kind').value,
    values: getFormValues(),
    width,
    height,
    background: $('#background-style').value,
    backgroundColor: $('#background-color').value,
    textColor: $('#text-color').value,
    jpFont: $('#jp-font').value,
    enFont: $('#en-font').value,
    textSize: Number($('#text-size').value),
    lineSpacing: Number($('#line-spacing').value) / 100,
    x: Number($('#content-x').value) / 100,
    y: Number($('#content-y').value) / 100,
    alignment: state.alignment,
    richStyles: structuredClone(state.richStyles),
    showReading: $('#show-reading').checked,
    showMeaning: $('#show-meaning').checked,
    showExample: $('#show-example').checked,
    showBorder: $('#show-border').checked,
    transparent: $('#transparent-bg').checked,
    uploadData: state.uploadData
  };
}

function imageFor(src) {
  if (imageCache.has(src)) return imageCache.get(src);
  const promise = new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Could not load image: ${src}`));
    image.src = src;
  });
  imageCache.set(src, promise);
  return promise;
}

function imageForFormat(width, height) {
  const ratio = width / height;
  return Math.abs(ratio - 9 / 16) <= Math.abs(ratio - 4 / 5) ? 'reel' : 'facebook';
}

function drawCover(ctx, image, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  ctx.drawImage(image, (image.width - sourceWidth) / 2, (image.height - sourceHeight) / 2, sourceWidth, sourceHeight, 0, 0, width, height);
}

function drawLandscape(ctx, width, height, base) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);
  const scale = width / 1080;
  ctx.save();
  ctx.translate(0, height * .73);
  ctx.scale(scale, scale);
  const layers = [
    { y: 90, color: '#bdd8d3', peaks: [[0, 160], [145, 75], [270, 140], [420, 40], [590, 120], [760, 48], [920, 148], [1080, 65]] },
    { y: 145, color: '#729da0', peaks: [[0, 160], [175, 68], [340, 152], [510, 85], [710, 155], [890, 73], [1080, 140]] },
    { y: 205, color: '#355e62', peaks: [[0, 155], [125, 99], [310, 164], [480, 95], [650, 163], [835, 88], [1080, 153]] }
  ];
  for (const layer of layers) {
    ctx.beginPath();
    ctx.moveTo(0, layer.y + 240);
    for (const [x, y] of layer.peaks) ctx.lineTo(x, layer.y + y);
    ctx.lineTo(1080, layer.y + 280);
    ctx.closePath();
    ctx.fillStyle = layer.color;
    ctx.fill();
  }
  ctx.fillStyle = '#a9d4d3';
  ctx.fillRect(0, 435, 1080, 165);
  ctx.fillStyle = '#dff0e9';
  for (let y = 455; y < 570; y += 24) {
    ctx.fillRect(90 + (y % 3) * 55, y, 230, 3);
    ctx.fillRect(585 - (y % 4) * 22, y + 7, 310, 2);
  }
  ctx.restore();
}

function drawPastel(ctx, width, height, base) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.globalAlpha = .38;
  const scale = width / 1080;
  for (const [x, y, radius, color] of [[82, 130, 150, '#e99da1'], [960, 290, 185, '#eac884'], [875, 1070, 225, '#9ac5bd'], [160, 1550, 180, '#d1a9bc']]) {
    ctx.beginPath();
    ctx.arc(x * scale, y * scale, radius * scale, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
  ctx.restore();
}

function readLines(ctx, text, maxWidth) {
  const output = [];
  for (const paragraph of String(text).split('\n')) {
    if (!paragraph) { output.push(''); continue; }
    let line = '';
    for (const character of paragraph) {
      const candidate = line + character;
      if (line && ctx.measureText(candidate).width > maxWidth) {
        output.push(line);
        line = character;
      } else line = candidate;
    }
    if (line) output.push(line);
  }
  return output;
}

function buildBlocks(settings) {
  const v = settings.values;
  const blocks = [];
  const add = (text, role, font, key) => { if (text?.trim()) blocks.push({ text: text.trim(), role, font, style: settings.richStyles?.[key] || {} }); };
  const reading = settings.template === 'kanji' ? [v.on && `音 ${v.on}`, v.kun && `訓 ${v.kun}`].filter(Boolean).join('　') : v.reading;
  if (settings.template === 'vocabulary' || settings.template === 'compound' || settings.template === 'reading') {
    add(v.word || v.kanji, 'hero', 'jp');
    if (settings.showReading) add(reading, 'reading', 'jp');
    if (settings.showMeaning) add(v.meaning, 'meaning', 'en');
    if (settings.template === 'vocabulary' && settings.showExample) {
      add(v.example, 'example', 'jp');
      add(v.translation, 'translation', 'en');
    }
    if (settings.template === 'compound' && settings.showExample) add(v.example, 'example', 'jp');
  } else if (settings.template === 'kanji') {
    add(v.kanji, 'hero-kanji', 'jp');
    if (settings.showMeaning) add(v.meaning, 'meaning', 'en');
    if (settings.showReading) add(reading, 'reading', 'jp');
    if (settings.showExample) add(v.words, 'example', 'jp');
  } else {
    if (settings.template === 'kanji-quiz') {
      add(v.kanji, 'quiz-kanji', 'jp', 'kanji');
    } else add(v.word, 'hero', 'jp', 'word');
    const options = [v.option1, v.option2, v.option3, v.option4];
    if (options.some(value => value?.trim())) blocks.push({ role: 'options', options, correct: v.correct, font: settings.template === 'kanji-quiz' ? 'jp' : 'en', vertical: settings.template === 'kanji-quiz', optionStyles: options.map((_, index) => settings.richStyles?.[`option${index + 1}`] || {}) });
    if (v.revealAnswer && options[Number(v.correct) - 1]) add(`Answer: ${options[Number(v.correct) - 1]}`, 'reveal', settings.template === 'kanji-quiz' ? 'jp' : 'en');
    if (settings.template === 'vocab-quiz' && settings.showExample) add(v.reveal, 'reveal', 'en');
  }
  return blocks;
}

function measureBlock(ctx, block, scale, width, settings) {
  if (block.role === 'options') {
    const fontSize = Math.round(settings.textSize * (block.vertical ? 1.1 : .37) * scale);
    const lines = block.options.map((option, index) => {
      const number = block.vertical ? String.fromCharCode(0x2460 + index) : `${index + 1}.`;
      ctx.font = canvasFont(fontSize, block.font === 'jp' ? settings.jpFont : settings.enFont, block.optionStyles[index]);
      return readLines(ctx, option ? `${number} ${option}` : number, width * (block.vertical ? .75 : 1));
    });
    return { lines, fontSize, lineHeight: fontSize * settings.lineSpacing, gap: fontSize * .18 };
  }
  const multiplier = { hero: 1.35, 'hero-kanji': 1.8, 'quiz-title': .75, 'quiz-kanji': 4.4, reading: .5, meaning: .56, example: .4, translation: .36, reveal: .36 }[block.role] || .4;
  const fontSize = Math.round(settings.textSize * multiplier * scale);
  const weight = block.role.startsWith('hero') || block.role === 'quiz-kanji' ? 700 : block.role === 'quiz-title' ? 600 : 500;
  ctx.font = canvasFont(fontSize, block.font === 'jp' ? settings.jpFont : settings.enFont, block.style, weight);
  const gap = ['hero', 'hero-kanji', 'quiz-title', 'quiz-kanji'].includes(block.role) ? fontSize * .28 : fontSize * .17;
  return { lines: readLines(ctx, block.text, width), fontSize, lineHeight: fontSize * settings.lineSpacing, gap };
}

function canvasFont(size, family, style = {}, defaultWeight = 500) {
  return `${style.italic ? 'italic ' : ''}${style.bold ? 700 : defaultWeight} ${size}px ${family}`;
}

function measureLayoutHeight(layout) {
  return layout.reduce((sum, item) => {
    if (item.block.role !== 'options') return sum + item.lines.length * item.lineHeight + item.gap;
    const linesPerOption = Math.max(1, ...item.lines.map(lines => lines.length));
    const columns = item.block.vertical ? 1 : 2;
    return sum + Math.ceil(item.block.options.length / columns) * (linesPerOption * item.lineHeight + item.gap);
  }, 0);
}

function renderCanvas(target, settings, backgroundImage) {
  const ctx = target.getContext('2d');
  const { width, height } = settings;
  target.width = width;
  target.height = height;
  ctx.clearRect(0, 0, width, height);
  if (!settings.transparent) {
    if (settings.background === 'template' && backgroundImage) drawCover(ctx, backgroundImage, width, height);
    else if (settings.background === 'upload' && backgroundImage) drawCover(ctx, backgroundImage, width, height);
    else if (settings.background === 'landscape') drawLandscape(ctx, width, height, settings.backgroundColor);
    else if (settings.background === 'pastel') drawPastel(ctx, width, height, settings.backgroundColor);
    else {
      ctx.fillStyle = settings.backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }
  }

  let scale = Math.min(width / 1080, height / 1350);
  const maxTextWidth = width * .72;
  const blocks = buildBlocks(settings);
  let layout = blocks.map(block => ({ block, ...measureBlock(ctx, block, scale, maxTextWidth, settings) }));
  let textHeight = measureLayoutHeight(layout);
  for (let attempt = 0; attempt < 5 && textHeight > height * .66; attempt++) {
    scale *= Math.max(.72, height * .66 / textHeight);
    layout = blocks.map(block => ({ block, ...measureBlock(ctx, block, scale, maxTextWidth, settings) }));
    textHeight = measureLayoutHeight(layout);
  }
  const minCenterX = maxTextWidth / 2 + width * .04;
  const maxCenterX = width - maxTextWidth / 2 - width * .04;
  const left = Math.max(minCenterX, Math.min(maxCenterX, width * settings.x));
  const top = Math.max(height * .07, Math.min(height * .93 - textHeight, height * settings.y - textHeight / 2));

  if (settings.showBorder) {
    ctx.save();
    ctx.strokeStyle = 'rgba(82, 111, 99, .32)';
    ctx.lineWidth = Math.max(1, 1.5 * scale);
    ctx.strokeRect(width * .035, height * .025, width * .93, height * .95);
    ctx.restore();
  }

  let cursorY = top;
  for (const item of layout) {
    const { block, lines, fontSize, lineHeight, gap } = item;
    if (block.role === 'options') {
      const rowHeight = lineHeight * Math.max(1, ...lines.map(optionLines => optionLines.length)) + gap;
      const colWidth = maxTextWidth / 2;
      block.options.forEach((_, index) => {
        const column = block.vertical ? 0 : index % 2;
        const row = block.vertical ? index : Math.floor(index / 2);
        const textLines = lines[index];
        const x = block.vertical ? left - maxTextWidth * .2 + 8 * scale : left - maxTextWidth / 2 + column * colWidth + 8 * scale;
        const rowY = cursorY + row * rowHeight;
        ctx.font = canvasFont(fontSize, block.font === 'jp' ? settings.jpFont : settings.enFont, block.optionStyles[index]);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = settings.textColor;
        textLines.forEach((line, lineIndex) => ctx.fillText(line, x, rowY + lineIndex * lineHeight));
        if (block.optionStyles[index]?.underline) {
          const lineWidth = Math.max(...textLines.map(line => ctx.measureText(line).width));
          ctx.beginPath();
          ctx.moveTo(x, rowY + textLines.length * lineHeight - 2 * scale);
          ctx.lineTo(x + lineWidth, rowY + textLines.length * lineHeight - 2 * scale);
          ctx.strokeStyle = settings.textColor;
          ctx.lineWidth = Math.max(1, scale * 1.5);
          ctx.stroke();
        }
        if (settings.values.underlineCorrect && block.correct === String(index + 1)) {
          const longest = Math.max(...textLines.map(line => ctx.measureText(line).width));
          ctx.strokeStyle = settings.textColor;
          ctx.lineWidth = Math.max(1.5, scale * 2);
          ctx.beginPath();
          ctx.moveTo(x, rowY + textLines.length * lineHeight - 3 * scale);
          ctx.lineTo(x + longest, rowY + textLines.length * lineHeight - 3 * scale);
          ctx.stroke();
        }
      });
      cursorY += Math.ceil(block.options.length / (block.vertical ? 1 : 2)) * rowHeight + gap;
      continue;
    }
    const weight = block.role.startsWith('hero') || block.role === 'quiz-kanji' ? 700 : block.role === 'quiz-title' ? 600 : 500;
    ctx.font = canvasFont(fontSize, block.font === 'jp' ? settings.jpFont : settings.enFont, block.style, weight);
    ctx.textAlign = settings.alignment;
    ctx.textBaseline = 'top';
    ctx.fillStyle = settings.textColor;
    const x = settings.alignment === 'left' ? left - maxTextWidth / 2 : settings.alignment === 'right' ? left + maxTextWidth / 2 : left;
    lines.forEach((line, index) => ctx.fillText(line, x, cursorY + index * lineHeight));
    if (block.style?.underline) {
      const lineWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
      ctx.beginPath();
      ctx.moveTo(left - lineWidth / 2, cursorY + lines.length * lineHeight - 2 * scale);
      ctx.lineTo(left + lineWidth / 2, cursorY + lines.length * lineHeight - 2 * scale);
      ctx.strokeStyle = settings.textColor;
      ctx.lineWidth = Math.max(1, scale * 1.5);
      ctx.stroke();
    }
    if (block.role === 'reading') {
      ctx.strokeStyle = 'rgba(216, 125, 134, .65)';
      ctx.lineWidth = Math.max(1, scale * 1.5);
      ctx.beginPath();
      ctx.moveTo(left - maxTextWidth * .14, cursorY + lines.length * lineHeight + gap * .3);
      ctx.lineTo(left + maxTextWidth * .14, cursorY + lines.length * lineHeight + gap * .3);
      ctx.stroke();
    }
    cursorY += lines.length * lineHeight + gap;
  }
}

async function getBackground(settings) {
  if (settings.background === 'template') return imageFor(templateFiles[imageForFormat(settings.width, settings.height)]);
  if (settings.background === 'upload' && settings.uploadData) return imageFor(settings.uploadData);
  return null;
}

async function generate(target, settings) {
  const background = await getBackground(settings);
  renderCanvas(target, settings, background);
}

function scheduleRender() {
  cancelAnimationFrame(state.renderFrame);
  state.renderFrame = requestAnimationFrame(async () => {
    try {
      const settings = selectedSettings();
      await generate(canvas, settings);
      $('#preview-status').textContent = 'Preview updates as you edit.';
    } catch (error) {
      $('#preview-status').textContent = error.message;
    }
  });
}

function updateRangeOutputs() {
  $('#text-size-value').value = $('#text-size').value;
  $('#line-spacing-value').value = (Number($('#line-spacing').value) / 100).toFixed(2);
  $('#content-x-value').value = `${$('#content-x').value}%`;
  $('#content-y-value').value = `${$('#content-y').value}%`;
  $('#text-color-value').textContent = $('#text-color').value.toUpperCase();
  $('#background-color-value').textContent = $('#background-color').value.toUpperCase();
}

function setSize(size) {
  state.size = size;
  $$('.format-choice').forEach(button => button.classList.toggle('selected', button.dataset.size === size));
  $('#custom-size-enabled').checked = size === 'custom';
  $('#custom-width').disabled = size !== 'custom';
  $('#custom-height').disabled = size !== 'custom';
  if (size !== 'custom') {
    $('#custom-width').value = sizePresets[size].width;
    $('#custom-height').value = sizePresets[size].height;
  }
  updateDimensions();
}

function saveSettings(showStatus = true) {
  const prefs = {
    controls: Object.fromEntries(['background-style', 'background-color', 'text-color', 'jp-font', 'en-font', 'text-size', 'line-spacing', 'content-x', 'content-y', 'show-reading', 'show-meaning', 'show-example', 'show-border', 'transparent-bg'].map(id => {
      const element = $(`#${id}`);
      return [id, element.type === 'checkbox' ? element.checked : element.value];
    })),
    template: $('#template-kind').value,
    size: state.size,
    customWidth: $('#custom-width').value,
    customHeight: $('#custom-height').value,
    alignment: state.alignment,
    richStyles: state.richStyles,
    values: getFormValues()
  };
  localStorage.setItem('nihongo-image-maker-settings', JSON.stringify(prefs));
  if (showStatus) $('#preview-status').textContent = 'Settings saved on this device.';
}

function restoreSettings() {
  let prefs;
  try { prefs = JSON.parse(localStorage.getItem('nihongo-image-maker-settings')); } catch { prefs = null; }
  if (!prefs) return;
  for (const [id, value] of Object.entries(prefs.controls || {})) {
    const element = $(`#${id}`);
    if (element) element.type === 'checkbox' ? element.checked = Boolean(value) : element.value = value;
  }
  $('#upload-row').hidden = $('#background-style').value !== 'upload';
  if (templates[prefs.template]) $('#template-kind').value = prefs.template;
  renderFields($('#template-kind').value, prefs.values || {});
  if (prefs.size === 'custom') {
    $('#custom-width').value = prefs.customWidth || 1080;
    $('#custom-height').value = prefs.customHeight || 1920;
    setSize('custom');
  } else if (sizePresets[prefs.size]) setSize(prefs.size);
  state.alignment = ['left', 'center', 'right'].includes(prefs.alignment) ? prefs.alignment : 'center';
  state.richStyles = prefs.richStyles || {};
  $$('[data-align]').forEach(button => button.classList.toggle('selected', button.dataset.align === state.alignment));
  updateRangeOutputs();
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function safeName(value) {
  return String(value || 'nihongo-card').normalize('NFKC').replace(/[^\p{L}\p{N}-]+/gu, '-').replace(/^-|-$/g, '').slice(0, 48) || 'nihongo-card';
}

function canvasBlob(target, format) {
  return new Promise((resolve, reject) => {
    target.toBlob(blob => blob ? resolve(blob) : reject(new Error('Your browser could not export this image.')), format === 'jpeg' ? 'image/jpeg' : 'image/png', .95);
  });
}

async function downloadCurrent(format) {
  $('#preview-status').textContent = 'Preparing full-resolution image…';
  try {
    const settings = selectedSettings();
    if (format === 'jpeg') settings.transparent = false;
    const output = document.createElement('canvas');
    await generate(output, settings);
    const blob = await canvasBlob(output, format);
    const title = settings.values.word || settings.values.kanji || settings.values.meaning;
    downloadBlob(blob, `${safeName(title)}-${settings.width}x${settings.height}.${format === 'jpeg' ? 'jpg' : 'png'}`);
    $('#preview-status').textContent = `Downloaded at ${settings.width} × ${settings.height} px.`;
  } catch (error) {
    $('#preview-status').textContent = error.message;
  }
}

function renderQueue() {
  const root = $('#batch-list');
  root.replaceChildren();
  $('#batch-count').textContent = state.queued.length;
  $('#download-batch').disabled = !state.queued.length;
  if (!state.queued.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-queue';
    empty.textContent = 'Your queued cards will appear here.';
    root.append(empty);
    return;
  }
  state.queued.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'queue-item';
    const copy = document.createElement('div');
    copy.className = 'queue-item-copy';
    const name = document.createElement('strong');
    name.textContent = item.title;
    const meta = document.createElement('span');
    meta.textContent = `${item.settings.width} × ${item.settings.height} · ${item.templateName}`;
    const remove = document.createElement('button');
    remove.className = 'remove-queue';
    remove.type = 'button';
    remove.textContent = '×';
    remove.setAttribute('aria-label', `Remove ${item.title} from batch`);
    remove.addEventListener('click', () => { state.queued.splice(index, 1); renderQueue(); });
    copy.append(name, meta);
    row.append(copy, remove);
    root.append(row);
  });
}

function crc32(bytes) {
  let crc = -1;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ -1) >>> 0;
}

async function zipStore(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
  const dosDate = ((Math.max(1980, now.getFullYear()) - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  const put16 = (view, position, value) => view.setUint16(position, value, true);
  const put32 = (view, position, value) => view.setUint32(position, value, true);
  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = new Uint8Array(await file.blob.arrayBuffer());
    const crc = file.crc;
    const local = new Uint8Array(30 + name.length);
    const localView = new DataView(local.buffer);
    put32(localView, 0, 0x04034b50); put16(localView, 4, 20); put16(localView, 6, 0x0800); put16(localView, 8, 0);
    put16(localView, 10, dosTime); put16(localView, 12, dosDate); put32(localView, 14, crc); put32(localView, 18, data.length); put32(localView, 22, data.length);
    put16(localView, 26, name.length); put16(localView, 28, 0); local.set(name, 30);
    localParts.push({ header: local, data });
    const central = new Uint8Array(46 + name.length);
    const centralView = new DataView(central.buffer);
    put32(centralView, 0, 0x02014b50); put16(centralView, 4, 20); put16(centralView, 6, 20); put16(centralView, 8, 0x0800); put16(centralView, 10, 0);
    put16(centralView, 12, dosTime); put16(centralView, 14, dosDate); put32(centralView, 16, crc); put32(centralView, 20, data.length); put32(centralView, 24, data.length);
    put16(centralView, 28, name.length); put16(centralView, 30, 0); put16(centralView, 32, 0); put16(centralView, 34, 0); put16(centralView, 36, 0); put32(centralView, 38, 0); put32(centralView, 42, offset);
    central.set(name, 46);
    centralParts.push(central);
    offset += local.length + data.length;
  }
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  put32(endView, 0, 0x06054b50); put16(endView, 4, 0); put16(endView, 6, 0); put16(endView, 8, files.length); put16(endView, 10, files.length); put32(endView, 12, centralSize); put32(endView, 16, offset); put16(endView, 20, 0);
  return new Blob([...localParts.flatMap(part => [part.header, part.data]), ...centralParts, end], { type: 'application/zip' });
}

async function downloadBatch() {
  if (!state.queued.length) return;
  const button = $('#download-batch');
  const format = $('#batch-format').value;
  button.disabled = true;
  button.textContent = 'Preparing…';
  $('#preview-status').textContent = `Rendering ${state.queued.length} full-resolution images…`;
  try {
    const files = [];
    for (let index = 0; index < state.queued.length; index++) {
      const item = state.queued[index];
      const output = document.createElement('canvas');
      const settings = { ...item.settings, transparent: format === 'jpeg' ? false : item.settings.transparent };
      await generate(output, settings);
      const blob = await canvasBlob(output, format);
      const bytes = new Uint8Array(await blob.arrayBuffer());
      files.push({ blob: new Blob([bytes], { type: blob.type }), crc: crc32(bytes), name: `${String(index + 1).padStart(2, '0')}-${safeName(item.title)}-${settings.width}x${settings.height}.${format === 'jpeg' ? 'jpg' : 'png'}` });
    }
    downloadBlob(await zipStore(files), `nihongo-image-set-${files.length}-cards.zip`);
    $('#preview-status').textContent = `Downloaded ${files.length} images in one ZIP.`;
  } catch (error) {
    $('#preview-status').textContent = error.message;
  } finally {
    button.disabled = !state.queued.length;
    button.innerHTML = '↓ Download ZIP';
  }
}

function loadSample() {
  const template = $('#template-kind').value;
  const examples = {
    vocabulary: { word: '木漏れ日', reading: 'こもれび', meaning: 'sunlight filtering through trees', example: '木漏れ日がきれいです。', translation: 'The sunlight through the trees is beautiful.' },
    kanji: { kanji: '森', on: 'シン', kun: 'もり', meaning: 'forest', words: '森林、森の中' },
    compound: { word: '図書館', reading: 'としょかん', meaning: 'library', example: '図書館で本を読みます。' },
    'vocab-quiz': { word: '水 means…?', option1: 'water', option2: 'fire', option3: 'mountain', option4: 'tree', correct: '1', reveal: '水（みず）means water.' },
    'kanji-quiz': { kanji: '川', option1: 'うみ', option2: 'ひと', option3: 'かわ', option4: 'そら', correct: '3' },
    reading: { word: '図書館', reading: 'としょかん', meaning: 'library' }
  };
  renderFields(template, examples[template]);
  if (template === 'kanji-quiz') {
    $('#content-y').value = '50';
    updateRangeOutputs();
  }
  scheduleRender();
}

function resetEditor() {
  localStorage.removeItem('nihongo-image-maker-settings');
  state.uploadData = null;
  state.alignment = 'center';
  state.richStyles = {};
  state.richTarget = null;
  $('#format-target').textContent = 'Focus a text field to format';
  $$('[data-rich-style]').forEach(button => button.classList.remove('selected'));
  $('#template-kind').value = 'vocabulary';
  renderFields('vocabulary');
  $('#background-style').value = 'template';
  $('#background-color').value = '#f8f5ec';
  $('#text-color').value = '#243c44';
  $('#jp-font').value = 'Noto Sans JP, sans-serif';
  $('#en-font').value = 'Georgia, serif';
  $('#text-size').value = '64';
  $('#line-spacing').value = '135';
  $('#content-x').value = '50';
  $('#content-y').value = '54';
  $('#show-reading').checked = true;
  $('#show-meaning').checked = true;
  $('#show-example').checked = true;
  $('#show-border').checked = false;
  $('#transparent-bg').checked = false;
  $('#background-upload').value = '';
  $('#upload-name').textContent = 'No image selected';
  $('#upload-row').hidden = true;
  $$('[data-align]').forEach(button => button.classList.toggle('selected', button.dataset.align === 'center'));
  setSize('reel');
  updateRangeOutputs();
  $('#preview-status').textContent = 'Editor reset to defaults.';
}

function bindEvents() {
  $$('.format-choice').forEach(button => button.addEventListener('click', () => setSize(button.dataset.size)));
  $('#custom-size-enabled').addEventListener('change', event => setSize(event.target.checked ? 'custom' : 'reel'));
  ['custom-width', 'custom-height'].forEach(id => $(`#${id}`).addEventListener('input', updateDimensions));
  $('#template-kind').addEventListener('change', () => { state.optional.clear(); renderFields($('#template-kind').value); scheduleRender(); });
  $('#content-fields').addEventListener('input', scheduleRender);
  $('#content-fields').addEventListener('change', scheduleRender);
  $('#content-fields').addEventListener('focusin', event => {
    const input = event.target.closest('[data-field]');
    if (!input || input.type === 'checkbox' || input.tagName === 'SELECT') return;
    state.richTarget = input.dataset.field;
    $('#format-target').textContent = `Formatting: ${input.labels?.[0]?.textContent || input.dataset.field}`;
    $$('[data-rich-style]').forEach(button => button.classList.toggle('selected', Boolean(state.richStyles[state.richTarget]?.[button.dataset.richStyle])));
  });
  $$('[data-rich-style]').forEach(button => button.addEventListener('click', () => {
    if (!state.richTarget) {
      $('#preview-status').textContent = 'Focus a text field before applying formatting.';
      return;
    }
    const style = button.dataset.richStyle;
    state.richStyles[state.richTarget] ||= {};
    state.richStyles[state.richTarget][style] = !state.richStyles[state.richTarget][style];
    button.classList.toggle('selected', state.richStyles[state.richTarget][style]);
    scheduleRender();
  }));
  $('#add-optional').addEventListener('click', () => {
    const template = $('#template-kind').value;
    const next = optionalFields[template].find(field => !state.optional.has(field.key));
    if (next) {
      const values = getFormValues();
      values[next.key] = '';
      renderFields(template, values);
      scheduleRender();
    }
  });
  $('#content-fields').addEventListener('click', event => {
    const button = event.target.closest('[data-remove-field]');
    if (!button) return;
    const values = getFormValues();
    delete values[button.dataset.removeField];
    renderFields($('#template-kind').value, values);
    scheduleRender();
  });
  $('#clear-fields').addEventListener('click', () => { renderFields($('#template-kind').value); scheduleRender(); });
  $('#load-sample').addEventListener('click', loadSample);
  $$('input, select').forEach(input => {
    if (input.closest('#content-fields')) return;
    input.addEventListener('input', () => { updateRangeOutputs(); scheduleRender(); });
    input.addEventListener('change', () => { updateRangeOutputs(); scheduleRender(); });
  });
  $$('[data-align]').forEach(button => button.addEventListener('click', () => {
    state.alignment = button.dataset.align;
    $$('[data-align]').forEach(option => option.classList.toggle('selected', option === button));
    scheduleRender();
  }));
  $('#background-style').addEventListener('change', event => { $('#upload-row').hidden = event.target.value !== 'upload'; scheduleRender(); });
  $('#background-upload').addEventListener('change', event => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      state.uploadData = reader.result;
      $('#upload-name').textContent = file.name;
      scheduleRender();
    };
    reader.readAsDataURL(file);
  });
  $('#generate-preview').addEventListener('click', async () => {
    $('#preview-status').textContent = 'Rendering full-resolution preview…';
    try { await generate(canvas, selectedSettings()); $('#preview-status').textContent = 'Preview ready.'; }
    catch (error) { $('#preview-status').textContent = error.message; }
  });
  $('#download-png').addEventListener('click', () => downloadCurrent('png'));
  $('#download-jpg').addEventListener('click', () => downloadCurrent('jpeg'));
  $('#save-settings').addEventListener('click', () => saveSettings());
  $('#reset-editor').addEventListener('click', resetEditor);
  $('#add-to-batch').addEventListener('click', () => {
    const settings = selectedSettings();
    const title = settings.values.word || settings.values.kanji || settings.values.meaning || `${settings.template} card`;
    state.queued.push({ settings, title, templateName: $('#template-kind').selectedOptions[0].textContent });
    renderQueue();
    $('#preview-status').textContent = 'Card added to the batch queue.';
  });
  $('#download-batch').addEventListener('click', downloadBatch);
}

renderFields($('#template-kind').value);
restoreSettings();
bindEvents();
updateRangeOutputs();
updateDimensions();