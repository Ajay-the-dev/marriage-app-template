// The printed invitation editor, shared by its desktop (Traditional.vue) and
// phone (Traditional2.vue) layouts: the card, its wording versions, fonts,
// saved cards and the PDF. Bind printCard to <PrintCard> and stage to the
// element the card is fitted into.
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { onBeforeRouteLeave, useRoute, useRouter } from "vue-router";
import weddingConfig from "@/config/wedding.json";
import { useWeddingStore, holdsWedding } from "@/stores/wedding";
import { useAuthStore } from "@/stores/auth";
import { uploadDocument } from "@/services/cloudinary";
import { fetchWedding, listCards, saveCard, deleteCard, setPrintCard, recordUpload, CARD_SLOTS } from "@/services/weddings";
import { getPlan } from "@/config/plans";
import { useMyPlan } from "@/composables/plan";
import { getTheme, fontsUrl } from "@/config/themes";
import { CARD_VERSIONS, getVersion, versionHtml } from "@/config/cardWording";
import {
  getPaper, defaultCard, sanitizeCardHtml, pdfFileName,
  FONTS, fontFamilyName, usedFontSpecs, MM_TO_PX, cardStyleFor, downloadCardPdf, printCardCopy,
} from "@/utils/traditionalCard";

export const BLOCKS = [
  { tag: "h1", label: "Names", hint: "Large script for the couple's names" },
  { tag: "h2", label: "Heading", hint: "Heading" },
  { tag: "h3", label: "Label", hint: "Small capitals, eg. event names" },
  { tag: "p", label: "Text", hint: "Body text" },
  { tag: "h6", label: "Small", hint: "Fine print, eg. parents and blessings" },
];
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

const htmlForm = (html) => {
  const el = document.createElement("div");
  el.innerHTML = sanitizeCardHtml(html);
  return el.innerHTML;
};

const formatDate = (date) => date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

const savedValues = ({ name, html, version, versions, paper, border, motif, motifSize, theme }) =>
  ({ name, html, paper, border, motif, motifSize: motifSize || "m", theme, ...(version && { version }), versions: { ...versions } });

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
  const card = reactive({ name: "", html: "", paper: "a5", border: "temple", motif: "lotus", motifSize: "m", theme: "" });

  const coupleNames = computed(() => {
    const g = config.value?.groom?.shortName;
    const b = config.value?.bride?.shortName;
    return g && b ? `${g} & ${b}` : config.value?.site?.title || "";
  });

  // ── Look ──
  const theme = computed(() => getTheme(card.theme || config.value?.theme));
  const paper = computed(() => getPaper(card.paper));
  const cardPx = computed(() => ({ width: paper.value.width * MM_TO_PX, height: paper.value.height * MM_TO_PX }));
  const cardStyle = computed(() => cardStyleFor(theme.value, paper.value));

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

  watch(() => [card.paper, card.border, card.motif, card.motifSize, card.theme], () => nextTick(checkOverflow));

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

  // Cards per invitation on the owner's plan
  const myPlan = useMyPlan();
  const plan = computed(() => getPlan(myPlan.value));
  const cardLimit = computed(() => plan.value.cards);
  const freeSlot = computed(() => CARD_SLOTS.slice(0, cardLimit.value).find((id) => !cards.value.some((c) => c.id === id)) || "");
  // Room for one more saved card (cards from before the limit count too)
  const canAddCard = computed(() => cards.value.length < cardLimit.value && !!freeSlot.value);
  const limitText = computed(() =>
    `${plan.value.label} allows ${cardLimit.value} printed cards per invitation. Delete one to save another${plan.value.cards < getPlan("plus").cards ? ", or upgrade to Plus for more" : ""}.`);

  const saveHint = computed(() =>
    !weddingId.value ? "Open this page from one of your invitations to save cards"
      : weddingLocked.value ? "This invitation is read-only on your plan"
        : !cardId.value && !canAddCard.value ? limitText.value
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
    if (c.id === cardId.value) {
      pdfView.value = false;
      return true;
    }
    if (!confirmDiscard()) return false;
    showCard(savedValues(c), c.id, true);
    pdfView.value = false;
    return true;
  };

  const newCard = () => {
    if (weddingId.value && !canAddCard.value) {
      flash(limitText.value, "warn");
      return false;
    }
    if (!confirmDiscard()) return false;
    pdfView.value = false;
    showCard({ name: `Card ${cards.value.length + 1}` }, "", false);
    // A fresh card isn't a change worth warning about until it's edited
    lastSaved.value = cardSnapshot();
    return true;
  };

  const refreshCards = async () => {
    cards.value = await listCards(weddingId.value);
  };

  // The card shown to guests on the home page follows its saved changes
  const updateGuestCopy = async (id) => {
    const saved = cards.value.find((c) => c.id === id);
    if (!saved || config.value.hero?.printCard?.id !== id) return;
    const copy = printCardCopy(saved);
    try {
      await setPrintCard(weddingId.value, copy);
      config.value.hero.printCard = copy;
      // Settings keeps the invitation loaded; keep its copy in step so a later save there doesn't undo this
      if (holdsWedding(weddingId.value)) wedding.hero.printCard = copy;
      flash("Card saved and updated on the home page", "ok");
    } catch (error) {
      flash(`Card saved, but guests still see the old version: ${error.message}`, "warn");
    }
  };

  const saveCurrent = async (asCopy = false) => {
    if (!canSave.value || saving.value) return;
    const creating = asCopy || !cardId.value;
    if (creating && !canAddCard.value) {
      flash(limitText.value, "error");
      return;
    }
    saving.value = true;
    try {
      if (asCopy) card.name = `${card.name || "Card"} (copy)`.slice(0, 60);
      const id = await saveCard(weddingId.value, creating ? "" : cardId.value, cardData(), freeSlot.value);
      cardId.value = id;
      lastSaved.value = cardSnapshot();
      const { card: _, ...query } = route.query;
      router.replace({ query: { ...query, card: id } });
      flash(asCopy ? "Saved as a new card" : "Card saved", "ok");
      await refreshCards().catch(() => {});
      await updateGuestCopy(id);
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
      if (!pdfView.value && (!cardId.value || isDirty.value)) saveCurrent();
    }
  };
  const beforeUnload = (e) => {
    if (!isDirty.value) return;
    e.preventDefault();
    e.returnValue = "";
  };
  onBeforeRouteLeave(() => !isDirty.value || confirm("You have unsaved changes to this card. Leave anyway?"));

  // ── Your own PDF ──
  // A ready-made invitation PDF shown to guests instead of a designed card. It goes live
  // straight away (config.hero.printCard = { type: "pdf", url, name }) and counts as one upload.
  const auth = useAuthStore();
  const uploads = ref(0);
  const uploadingPdf = ref(false);
  const ownPdf = computed(() => (config.value?.hero?.printCard?.type === "pdf" ? config.value.hero.printCard : null));
  // Showing the uploaded PDF in place of the card (and hiding the editing tools);
  // opening a card or starting a new one goes back to the editor
  const pdfView = ref(false);
  const showOwnPdf = () => { if (ownPdf.value) pdfView.value = true; };
  const hideOwnPdf = () => { pdfView.value = false; };
  // A designed card is on the home page now (the PDF would replace it)
  const cardOnHome = computed(() => !!config.value?.hero?.printCard && !ownPdf.value);
  const uploadOwnPdf = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file || !canSave.value) return;
    if (file.type !== "application/pdf") return flash(`${file.name} is not a PDF`, "error");
    if (uploads.value >= plan.value.uploads) return flash(`You've used all ${plan.value.uploads} uploads for this invitation`, "error");
    if (cardOnHome.value && !confirm("Guests see one of your designed cards on the home page. Show this PDF instead?")) return;
    uploadingPdf.value = true;
    try {
      const url = await uploadDocument(file, { uid: auth.user.uid, key: "invitation" });
      await recordUpload(weddingId.value);
      uploads.value++;
      const printCard = { type: "pdf", url, name: file.name.slice(0, 100) };
      await setPrintCard(weddingId.value, printCard);
      config.value.hero = { ...config.value.hero, printCard };
      if (holdsWedding(weddingId.value)) wedding.hero.printCard = printCard;
      pdfView.value = true;
      flash("PDF uploaded, guests now see it on the home page", "ok");
    } catch (error) {
      flash(`Could not upload the PDF: ${error.message}`, "error");
    } finally {
      uploadingPdf.value = false;
    }
  };

  // Takes the PDF off the home page (the file stays on Cloudinary; the upload still counts)
  const removingPdf = ref(false);
  const removeOwnPdf = async () => {
    if (!ownPdf.value || !confirm("Remove your PDF? Guests will no longer see it on the home page.")) return;
    removingPdf.value = true;
    try {
      await setPrintCard(weddingId.value, null);
      const { printCard: _, ...hero } = config.value.hero;
      config.value.hero = hero;
      if (holdsWedding(weddingId.value)) delete wedding.hero.printCard;
      pdfView.value = false;
      flash("PDF removed from the home page", "ok");
    } catch (error) {
      flash(`Could not remove the PDF: ${error.message}`, "error");
    } finally {
      removingPdf.value = false;
    }
  };

  // ── PDF ──
  const exporting = ref(false);
  const downloadPdf = async () => {
    exporting.value = true;
    message.value = "";
    try {
      await downloadCardPdf(cardEl.value, {
        paper: paper.value,
        background: theme.value.colors.cream,
        title: `${coupleNames.value || "Wedding"} invitation`,
        fileName: pdfFileName(config.value),
      });
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
        uploads.value = result.uploads;
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
    // The invitation shows guests its own PDF: open on that
    pdfView.value = !!ownPdf.value;
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
    cardLimit, canAddCard, limitText,
    // your own PDF
    ownPdf, cardOnHome, uploadingPdf, uploadOwnPdf, pdfView, showOwnPdf, hideOwnPdf, removingPdf, removeOwnPdf,
    openCard, newCard, saveCurrent, removeCard,
    // PDF
    exporting, downloadPdf,
  };
}
