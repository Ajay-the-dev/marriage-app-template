// The help page's state, shared by its desktop/tablet (Help.vue) and phone (Help2.vue) layouts
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { HELP_TOPICS, getHelpTopic } from "@/config/help";

export function useHelpPage() {
  const route = useRoute();
  const router = useRouter();
  const auth = useAuthStore();

  // ?topic=invite | traditional | sitemap
  const topic = computed(() => getHelpTopic(route.query.topic));
  const nextTopic = computed(() => HELP_TOPICS[HELP_TOPICS.indexOf(topic.value) + 1] || null);
  const setTopic = (id) => {
    router.replace({ query: { ...route.query, topic: id } });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Back to where the help was opened from, else to the invitations (or the site)
  const goBack = () => {
    if (window.history.state?.back) router.back();
    else router.push(auth.isLoggedIn ? { name: "settings" } : "/");
  };

  // Sign-in links only for signed-out visitors (other account links send them to sign in first)
  const showAction = ({ to }) => to?.name !== "login" || !auth.isLoggedIn;

  return { topic, nextTopic, setTopic, goBack, showAction };
}
