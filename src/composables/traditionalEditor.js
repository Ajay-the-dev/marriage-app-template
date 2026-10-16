// The printed invitation editor, shared by its desktop (Traditional.vue) and
// phone (Traditional2.vue) layouts: the card, its wording versions, fonts,
// saved cards and the PDF. Bind printCard to <PrintCard> and stage to the
// element the card is fitted into.
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";
import weddingConfig from "@/config/wedding.json";
import { useWeddingStore } from "@/stores/wedding";
import { fetchWedding, listCards, saveCard, deleteCard } from "@/services/weddings";
import { getTheme, fontsUrl } from "@/config/themes";
import { CARD_VERSIONS, getVersion, versionHtml } from "@/config/cardWording";
import {
  getPaper, defaultCard, sanitizeCardHtml, pdfFileName,
  FONTS, fontFamilyName, usedFontSpecs,
} from "@/utils/traditionalCard";

export const BLOCKS = [
  { tag: "h1", label: "Names", hint: "Large script for the couple's names" },
  { tag: "h2", label: "Heading", hint: "Heading" },
  { tag: "h3", label: "Label", hint: "Small capitals, eg. event names" },
  { tag: "p", label: "Text", hint: "Body text" },
  { tag: "h6", label: "Small", hint: "Fine print, eg. parents and blessings" },
];
const MM_TO_PX = 96 / 25.4;
// Rendered at 300 dpi for print
const EXPORT_SCALE = 300 / 96;

// Indian-language fonts preview in their own script
const SCRIPT_SAMPLES = {
  "Noto Serif Malayalam": "വിവാഹം",
  "Noto Serif Tamil": "திருமணம்",
  "Noto Serif Devanagari": "विवाह",
  "Noto Serif Telugu": "వివాహం",
  "Noto Serif Kannada": "ಮದುವೆ",
};

// The page's own fonts, loaded with the card's
const PAGE_FONTS = ["Cinzel+Decorative:wght@400;700", "Montserrat:wght@300;400;500;600"];

// html2canvas draws inline SVGs poorly, and without the card's CSS variables.
// Swap each one for an image of itself with its colours and size written in,
// resolving once the images are ready to draw.
const svgsToImages = (root) => {
  const view = root.ownerDocument.defaultView;
  return Promise.all([...root.querySelectorAll("svg")].map((svg) => {
    const { width, height } = svg.getBoundingClientRect();
    const copy = svg.cloneNode(true);
    const sources = svg.querySelectorAll("[fill], [stroke]");
    copy.querySelectorAll("[fill], [stroke]").forEach((node, i) => {
      const style = view.getComputedStyle(sources[i]);
      if (node.hasAttribute("fill")) node.setAttribute("fill", style.fill);
      if (node.hasAttribute("stroke")) node.setAttribute("stroke", style.stroke);
    });
    // Its placement on the card (position, margins) would shift the drawing inside the image
    copy.removeAttribute("style");
    copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    copy.setAttribute("width", width);
    copy.setAttribute("height", height);
    const img = root.ownerDocument.createElement("img");
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(copy))}`;
    // The clone carries each element's computed styles inline, so this keeps its place on the card
    img.style.cssText = `${svg.getAttribute("style") || ""};width:${width}px;height:${height}px`;
    svg.replaceWith(img);
    return img.decode();
  }));
};

const htmlForm = (html) => {
  const el = document.createElement("div");
  el.innerHTML = sanitizeCardHtml(html);
  return el.innerHTML;
};

const formatDate = (date) => date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

const savedValues = ({ name, html, version, versions, paper, border, motif, theme }) =>
  ({ name, html, paper, border, motif, theme, ...(version && { version }), versions: { ...versions } });

// back: the route names to go back to ({ editor, list })
export function useTraditionalEditor({ back = { editor: "edit-wedding", list: "settings" } } = {}) {
  const route = useRoute();
  const router = useRouter();
  const wedding = useWeddingStore();

  // /traditional?id=<weddingId>&card=<cardId> opens that invitation's card; plain /traditional
  // starts from the invitation loaded on the site (nothing to save it against)
  const weddingId = computed(() => (typeof route.query.id === "string" ? route.query.id : ""));
  const backRoute = computed(() => (weddingId.value ? { name: back.editor, params: { id: weddingId.value } } : { name: back.list }));

  const config = ref(null);
  const loadError = ref("");
  const message = ref("");
  const messageType = ref("");
  const flash = (text, type) => {
    message.value = text;
    messageType.value = type;
    if (type === "ok") setTimeout(() => { if (message.value === text) message.value = ""; }, 3000);
  };
  const card = reactive({ name: "", html: "", paper: "a5", border: "temple", motif: "lotus", theme: "" });

  const coupleNames = computed(() => {
    const g = config.value?.groom?.shortName;
    const b = config.value?.bride?.shortName;
    return g && b ? `${g} & ${b}` : config.value?.site?.title || "";
  });

  // ── Look ──
  const theme = computed(() => getTheme(card.theme || config.value?.theme));
  const paper = computed(() => getPaper(card.paper));
  const cardPx = computed(() => ({ width: paper.value.width * MM_TO_PX, height: paper.value.height * MM_TO_PX }));
  // Type grows with the paper's area, so A4 isn't just A5 with wide margins
  const typeScale = computed(() => Math.sqrt((paper.value.width * paper.value.height) / (148 * 210)));

  const cardStyle = computed(() => {
    const { colors, fonts } = theme.value;
    return {
      width: `${paper.value.width}mm`,
      height: `${paper.value.height}mm`,
      "--u": typeScale.value,
      "--c-accent": colors.gold,
      "--c-accent-light": colors["gold-light"],
      "--c-accent-dark": colors["gold-dark"],
      "--c-bg": colors.cream,
      "--c-heading": colors.dark,
      "--c-text": colors.text,
      "--c-muted": colors.sage,
      "--f-display": fonts.display,
      "--f-serif": fonts.serif,
      "--f-sans": fonts.sans,
    };
  });

  const swatches = computed(() => [
    { name: "Accent", value: theme.value.colors["gold-dark"] },
    { name: "Heading", value: theme.value.colors.dark },
    { name: "Text", value: theme.value.colors.text },
  ]);

  // The card's fonts, plus the page's own, without touching the site's theme.
  // The font menu's own fonts load once it's first opened, to preview them.
  const fontMenuUsed = ref(false);
  const fontSpecs = computed(() => [
    ...theme.value.googleFonts,
    ...PAGE_FONTS,
    ...usedFontSpecs(card.html),
    ...(fontMenuUsed.value ? FONTS.map((f) => f.google) : []),
  ]);
  watch(fontSpecs, (specs) => {
    const families = [...new Map(specs.map((f) => [f.split(":")[0], f])).values()];
    let link = document.getElementById("traditional-fonts");
    if (!link) {
      link = document.createElement("link");
      link.id = "traditional-fonts";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = fontsUrl(families);
  }, { immediate: true });

  // ── Fit the card to the screen ──
  const stage = ref(null);
  const stageWidth = ref(0);
  const scale = computed(() => (stageWidth.value ? Math.min(1, stageWidth.value / cardPx.value.width) : 1));
  let resizeObserver = null;

  // ── Editing ──
  // The card's elements, from <PrintCard ref="printCard">
  const printCard = ref(null);
  const editorEl = computed(() => printCard.value?.editorEl);
  const contentEl = computed(() => printCard.value?.contentEl);
  const cardEl = computed(() => printCard.value?.cardEl);
  const state = reactive({ bold: false, italic: false, underline: false, align: "center", block: "", font: "" });
  const overflowing = ref(false);

  const checkOverflow = () => {
    const el = contentEl.value;
    overflowing.value = !!el && el.scrollHeight > el.clientHeight + 1;
  };

  const setEditorHtml = (html) => {
    if (editorEl.value) editorEl.value.innerHTML = html;
    nextTick(checkOverflow);
  };

  const onInput = () => {
    card.html = editorEl.value.innerHTML;
    checkOverflow();
  };

  // Pasted text comes in plain, so it takes on the card's styles
  const onPaste = (e) => {
    e.preventDefault();
    document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
  };

  const selectionInEditor = () => {
    const sel = window.getSelection();
    return sel.rangeCount > 0 && !!editorEl.value?.contains(sel.anchorNode);
  };

  // Toolbar buttons act on the selection, or at the end of the text when nothing on the card is selected
  const focusEditor = () => {
    if (selectionInEditor()) return;
    editorEl.value.focus();
    const range = document.createRange();
    range.selectNodeContents(editorEl.value);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  };

  const updateState = () => {
    if (!selectionInEditor()) return;
    state.bold = document.queryCommandState("bold");
    state.italic = document.queryCommandState("italic");
    state.underline = document.queryCommandState("underline");
    let node = window.getSelection().anchorNode;
    if (node?.nodeType === Node.TEXT_NODE) node = node.parentElement;
    const block = node?.closest?.("h1, h2, h3, h6, p, div");
    state.block = block && block !== editorEl.value ? block.tagName.toLowerCase() : "";
    const align = block ? getComputedStyle(block).textAlign : "center";
    state.align = align === "start" ? "left" : align === "end" ? "right" : align;
    const fontEl = node?.closest?.("font[face], [style*='font-family']");
    state.font = fontEl && editorEl.value.contains(fontEl) ? fontEl.getAttribute("face") || fontEl.style.fontFamily : "";
  };

  const run = (command, value = null) => {
    focusEditor();
    document.execCommand(command, false, value);
    onInput();
    updateState();
  };

  const setBlock = (tag) => run("formatBlock", `<${tag}>`);

  // ── Fonts ──
  // The theme's own fonts first, then the editor's list
  const fontGroups = computed(() => {
    const { display, serif, sans } = theme.value.fonts;
    const themeFonts = [
      { name: fontFamilyName(display), label: "Theme · names", css: display },
      { name: fontFamilyName(serif), label: "Theme · text", css: serif },
      { name: fontFamilyName(sans), label: "Theme · labels", css: sans },
    ].map((font) => ({ ...font, sample: font.css.split(",")[0].replace(/["']/g, "") }));
    const groups = [{ name: theme.value.name, fonts: themeFonts }];
    FONTS.forEach((font) => {
      let group = groups.find((g) => g.name === font.group);
      if (!group) groups.push((group = { name: font.group, fonts: [] }));
      const script = SCRIPT_SAMPLES[font.name];
      group.fonts.push({ ...font, sample: script ? `${script} · ${font.label}` : font.name, label: script ? "" : font.label });
    });
    return groups;
  });
  // Shown on the menu button: the family's name, or the language for the Indian-language fonts
  const currentFont = computed(() => {
    if (!state.font) return null;
    const known = FONTS.find((f) => fontFamilyName(f.css) === fontFamilyName(state.font));
    return { name: known?.label || state.font.split(",")[0].replace(/["']/g, "").trim(), css: state.font };
  });
  const isCurrentFont = (font) => !!currentFont.value && fontFamilyName(currentFont.value.css) === fontFamilyName(font.css);

  const fontMenuEl = ref(null);
  const fontMenuOpen = ref(false);
  const toggleFontMenu = () => {
    fontMenuOpen.value = !fontMenuOpen.value;
    fontMenuUsed.value = true;
  };
  const closeFontMenu = (e) => {
    if (fontMenuOpen.value && !fontMenuEl.value?.contains(e.target)) fontMenuOpen.value = false;
  };

  // With nothing selected, the font goes to the whole line the caret is on
  const selectCurrentBlock = () => {
    const sel = window.getSelection();
    if (!sel.isCollapsed) return;
    let node = sel.anchorNode;
    if (node?.nodeType === Node.TEXT_NODE) node = node.parentElement;
    const block = node?.closest?.("h1, h2, h3, h6, p, div");
    if (!block || block === editorEl.value || !editorEl.value.contains(block)) return;
    const range = document.createRange();
    range.selectNodeContents(block);
    sel.removeAllRanges();
    sel.addRange(range);
  };

  // null puts the selection back on its text style's font
  const applyFont = (font) => {
    fontMenuOpen.value = false;
    focusEditor();
    selectCurrentBlock();
    if (font) {
      run("fontName", font.css);
      return;
    }
    const range = window.getSelection().getRangeAt(0);
    editorEl.value.querySelectorAll("font[face], [style*='font-family']").forEach((el) => {
      if (!range.intersectsNode(el)) return;
      el.removeAttribute("face");
      el.style.removeProperty("font-family");
      if (!el.getAttribute("style")) el.removeAttribute("style");
      if (["FONT", "SPAN"].includes(el.tagName) && !el.attributes.length) el.replaceWith(...el.childNodes);
    });
    onInput();
    updateState();
  };

  // ── Versions ──
  // The card has a wording version per pill. Each keeps its own edits while you
  // switch between them; card.versions holds the edited ones other than the one shown.
  const freshHtml = (versionId) => htmlForm(versionHtml(config.value, versionId));

  // Edited text of every version, the one shown included
  const collectVersions = () => {
    const versions = { ...card.versions };
    delete versions[card.version];
    if (card.html !== freshHtml(card.version)) versions[card.version] = card.html;
    return versions;
  };
  const editedVersions = computed(() => new Set(config.value ? Object.keys(collectVersions()) : []));

  const setText = (html) => {
    card.html = html;
    setEditorHtml(html);
  };

  const versionPillsEl = ref(null);
  const switchVersion = (id) => {
    if (id === card.version) return;
    const versions = collectVersions();
    const html = versions[id] ?? freshHtml(id);
    delete versions[id];
    card.versions = versions;
    card.version = id;
    setText(html);
    nextTick(() => versionPillsEl.value?.querySelector(".active")?.scrollIntoView({ block: "nearest", inline: "nearest" }));
  };

  const resetText = () => {
    if (!confirm(`Start the ${getVersion(card.version).label} version again from the invitation's details? Your edits to it will be lost.`)) return;
    setText(freshHtml(card.version));
  };

  watch(() => [card.paper, card.border, card.motif, card.theme], () => nextTick(checkOverflow));

  // ── Saved cards ──
  // Each invitation keeps its cards (as HTML) in the cloud
  const cards = ref([]);
  const cardId = ref("");
  const lastSaved = ref(null);
  const saving = ref(false);
  const deletingId = ref("");
  const weddingLocked = ref(false);

  // What gets saved: every version's edits, plus the one shown
  const cardData = () => ({ ...card, versions: collectVersions() });
  const cardSnapshot = () => JSON.stringify(cardData());
  const isDirty = computed(() => cardSnapshot() !== lastSaved.value);
  const canSave = computed(() => !!weddingId.value && !weddingLocked.value);
  const saveHint = computed(() =>
    !weddingId.value ? "Open this page from one of your invitations to save cards"
      : weddingLocked.value ? "This invitation is read-only on your plan"
        : "Save this card with the invitation (Ctrl+S)");
  const statusText = computed(() =>
    !cardId.value ? "Not saved yet" : isDirty.value ? "Unsaved changes" : "Saved");

  // Shows a card on the editor; saved = whether it matches what's stored
  const showCard = (values, id, saved) => {
    Object.assign(card, defaultCard(config.value), values);
    // Cards saved before versions existed keep their text as the theme's version
    if (!CARD_VERSIONS.some((v) => v.id === card.version)) card.version = defaultCard(config.value).version;
    const versions = Object.fromEntries(Object.entries(card.versions || {}).map(([v, html]) => [v, htmlForm(html)]));
    delete versions[card.version];
    card.versions = versions;
    card.html = sanitizeCardHtml(card.html);
    setEditorHtml(card.html);
    // The editor's own form of the HTML, so the first keystroke isn't the only "change"
    if (editorEl.value) card.html = editorEl.value.innerHTML;
    cardId.value = id;
    lastSaved.value = saved ? cardSnapshot() : null;
    const { card: _, ...query } = route.query;
    router.replace({ query: id ? { ...query, card: id } : query });
  };

  const confirmDiscard = () => !isDirty.value || confirm("You have unsaved changes to this card. Discard them?");

  const openCard = (c) => {
    if (c.id === cardId.value || !confirmDiscard()) return false;
    showCard(savedValues(c), c.id, true);
    return true;
  };

  const newCard = () => {
    if (!confirmDiscard()) return false;
    showCard({ name: `Card ${cards.value.length + 1}` }, "", false);
    // A fresh card isn't a change worth warning about until it's edited
    lastSaved.value = cardSnapshot();
    return true;
  };

  const refreshCards = async () => {
    cards.value = await listCards(weddingId.value);
  };

  const saveCurrent = async (asCopy = false) => {
    if (!canSave.value || saving.value) return;
    saving.value = true;
    try {
      if (asCopy) card.name = `${card.name || "Card"} (copy)`.slice(0, 60);
      const id = await saveCard(weddingId.value, asCopy ? "" : cardId.value, cardData());
      cardId.value = id;
      lastSaved.value = cardSnapshot();
      const { card: _, ...query } = route.query;
      router.replace({ query: { ...query, card: id } });
      flash(asCopy ? "Saved as a new card" : "Card saved", "ok");
      await refreshCards().catch(() => {});
    } catch (error) {
      flash(`Could not save the card: ${error.message}`, "error");
    } finally {
      saving.value = false;
    }
  };

  const removeCard = async (c) => {
    if (!confirm(`Delete "${c.name || "Untitled card"}"? This can't be undone.`)) return;
    deletingId.value = c.id;
    try {
      await deleteCard(weddingId.value, c.id);
      cards.value = cards.value.filter((x) => x.id !== c.id);
      // The open card stays on screen, now unsaved
      if (c.id === cardId.value) {
        cardId.value = "";
        lastSaved.value = null;
      }
      flash("Card deleted", "ok");
    } catch (error) {
      flash(`Could not delete the card: ${error.message}`, "error");
    } finally {
      deletingId.value = "";
    }
  };

  const onKeydown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      if (!cardId.value || isDirty.value) saveCurrent();
    }
  };
  const beforeUnload = (e) => {
    if (!isDirty.value) return;
    e.preventDefault();
    e.returnValue = "";
  };
  onBeforeRouteLeave(() => !isDirty.value || confirm("You have unsaved changes to this card. Leave anyway?"));

  // ── PDF ──
  const exporting = ref(false);
  const downloadPdf = async () => {
    exporting.value = true;
    message.value = "";
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas-pro"), import("jspdf")]);
      await document.fonts.ready;
      const canvas = await html2canvas(cardEl.value, {
        scale: EXPORT_SCALE,
        useCORS: true,
        backgroundColor: theme.value.colors.cream,
        // Capture the card at full size, without the on-screen scaling
        onclone: (doc, el) => {
          const scaler = doc.querySelector(".card-scaler");
          if (scaler) scaler.style.transform = "none";
          return svgsToImages(el);
        },
      });
      const { width, height } = paper.value;
      const pdf = new jsPDF({ orientation: width > height ? "landscape" : "portrait", unit: "mm", format: [width, height] });
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, width, height);
      pdf.setProperties({ title: `${coupleNames.value || "Wedding"} invitation` });
      pdf.save(pdfFileName(config.value));
    } catch (error) {
      console.error("Could not create PDF:", error);
      flash(`Could not create the PDF: ${error.message}`, "error");
    } finally {
      exporting.value = false;
    }
  };

  // ── Load ──
  const load = async () => {
    try {
      if (weddingId.value) {
        const result = await fetchWedding(weddingId.value);
        if (!result) {
          loadError.value = "Invitation not found.";
          return;
        }
        config.value = { ...weddingConfig, ...result.config };
        weddingLocked.value = !!result.locked;
      } else {
        config.value = wedding.snapshot();
      }
    } catch (error) {
      loadError.value = `Could not load the invitation: ${error.message}`;
      return;
    }
    if (weddingId.value) {
      await refreshCards().catch((error) => flash(`Could not load saved cards: ${error.message}`, "error"));
    }
    await nextTick();
    // The card in the link, else the last saved one, else a new one from the invitation
    const saved = cards.value.find((c) => c.id === route.query.card) || cards.value[0];
    if (saved) {
      showCard(savedValues(saved), saved.id, true);
    } else {
      showCard({ name: "Card 1" }, "", false);
      lastSaved.value = cardSnapshot();
    }
    if (weddingLocked.value) flash("This invitation is read-only on your plan, so cards can't be saved. You can still download the PDF.", "warn");
    resizeObserver = new ResizeObserver(([entry]) => { stageWidth.value = entry.contentRect.width; });
    resizeObserver.observe(stage.value);
    // Fonts arriving late change how much text fits
    document.fonts.ready.then(checkOverflow);
  };

  onMounted(() => {
    // New lines start as paragraphs rather than <div>s
    document.execCommand("defaultParagraphSeparator", false, "p");
    document.execCommand("styleWithCSS", false, false);
    document.addEventListener("selectionchange", updateState);
    document.addEventListener("mousedown", closeFontMenu);
    document.addEventListener("keydown", onKeydown);
    window.addEventListener("beforeunload", beforeUnload);
    load();
  });

  onBeforeUnmount(() => {
    document.removeEventListener("selectionchange", updateState);
    document.removeEventListener("mousedown", closeFontMenu);
    document.removeEventListener("keydown", onKeydown);
    window.removeEventListener("beforeunload", beforeUnload);
    resizeObserver?.disconnect();
  });

  return {
    // invitation and card
    weddingId, backRoute, config, loadError, coupleNames, card,
    message, messageType,
    // look
    theme, cardPx, cardStyle, swatches, stage, scale,
    // editing
    printCard, editorEl, state, overflowing, onInput, onPaste, updateState, run, setBlock,
    // fonts
    fontGroups, currentFont, isCurrentFont, fontMenuEl, fontMenuOpen, fontMenuUsed, toggleFontMenu, applyFont,
    // versions
    editedVersions, versionPillsEl, switchVersion, resetText,
    // saved cards
    cards, cardId, saving, deletingId, isDirty, canSave, saveHint, statusText, formatDate,
    openCard, newCard, saveCurrent, removeCard,
    // PDF
    exporting, downloadPdf,
  };
}
