# Nihongo Image Maker

A static Japanese-learning image editor. Canvas rendering and downloads happen locally in your browser; no account, backend, or API is used.

## Run locally

Open `index.html` in a modern browser. Keep `app.js`, `styles.css`, and the two supplied JPG templates in the same directory. The page works without a local server. Google Fonts are an optional enhancement; Japanese text uses the selected system font and Japanese-capable fallback fonts when offline.

## Templates

- `Untitled design (3).jpg` is used for reel / 9:16 canvases.
- `Untitled design (2).jpg` is used for Facebook portrait / 4:5 canvases.
- Other aspect ratios use whichever supplied template has the closest ratio, cropped to fill without distortion.

The files are used as supplied. Pick another background style in Design to use a plain, drawn landscape, pastel, or your own uploaded image.

## Create a set

Choose a canvas size and card type, enter your content, and adjust the design. Add each finished card to the Batch queue; each entry saves its current content, dimensions, background, and style. Choose PNG or JPG and download the queue as one ZIP. A single card can also be downloaded directly. Exports use the exact selected pixel dimensions.

Use **Save settings** to store design preferences and the current card fields in this browser's local storage. This does not store uploaded images or batch entries.

## Import cards from CSV

Choose a card template, then select **Import CSV** in the Batch queue. The first row is a header row; remaining non-empty rows become separate queued cards and inherit the current canvas and design settings. Header names can use field keys or labels shown in the editor.

Download [sample-kanji.csv](sample-kanji.csv) or [sample-vocabulary.csv](sample-vocabulary.csv) from the project, then import the matching file in the editor.

Kanji card example:

```csv
kanji,furigana,meaning,words
森,もり,"forest, woods","森林、森の中"
川,かわ,river,河川
```

Vocabulary card example:

```csv
word,reading,meaning,example,translation
猫,ねこ,cat,猫が好きです。,I like cats.
犬,いぬ,dog,犬と散歩します。,I walk with my dog.
```

Common columns include `word`, `kanji`, `furigana`, `reading`, `meaning`, `example`, `translation`, `words`, `option1` through `option4`, and `correct`. Standard quoted CSV cells are supported.