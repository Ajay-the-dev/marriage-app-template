// The printed invitation guests see on the home page (config.hero.printCard), picked in the
// editor (Settings.vue, Settings2.vue): a copy of one saved card, or a PDF uploaded in the
// card editor ({ type: "pdf", url, name }). The cards themselves are private to the owner.
import { computed, ref } from "vue";
import { listCards } from "@/services/weddings";
import { printCardCopy } from "@/utils/traditionalCard";

export const PDF_CHOICE = "__pdf";

export function usePrintCardChoice(wedding, weddingId) {
  const printCards = ref([]);
  const printCardsError = ref("");
  const loadPrintCards = async () => {
    try {
      printCards.value = await listCards(weddingId);
    } catch (error) {
      printCardsError.value = `Could not load your printed cards: ${error.message}`;
    }
  };
  const attachPrintCard = (c) => {
    wedding.hero.printCard = printCardCopy(c);
  };

  // The uploaded PDF is kept while another card is picked, so switching back doesn't need a new upload
  const lastPdf = ref(null);
  const printPdf = computed(() => (wedding.hero.printCard?.type === "pdf" ? wedding.hero.printCard : lastPdf.value));

  const printCardChoice = computed({
    get: () => (wedding.hero.printCard?.type === "pdf" ? PDF_CHOICE : wedding.hero.printCard?.id || ""),
    set: (id) => {
      if (wedding.hero.printCard?.type === "pdf") lastPdf.value = wedding.hero.printCard;
      const c = printCards.value.find((x) => x.id === id);
      if (id === PDF_CHOICE && printPdf.value) wedding.hero.printCard = { ...printPdf.value };
      else if (c) attachPrintCard(c);
      else delete wedding.hero.printCard;
    },
  });
  const printCardMissing = computed(() =>
    !!wedding.hero.printCard?.id && !printCards.value.some((c) => c.id === wedding.hero.printCard.id));
  // The attached card, when it was saved again after being attached
  const printCardOutdated = computed(() => {
    const c = printCards.value.find((x) => x.id === wedding.hero.printCard?.id);
    return c && (c.updatedAt?.getTime() ?? 0) > (wedding.hero.printCard.savedAt || 0) ? c : null;
  });

  return { printCards, printCardsError, loadPrintCards, attachPrintCard, printPdf, printCardChoice, printCardMissing, printCardOutdated };
}
