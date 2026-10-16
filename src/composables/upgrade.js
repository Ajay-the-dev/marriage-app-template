import { ref } from 'vue'

// Which limit prompted the upgrade dialog ('' for none in particular);
// null while it's closed. One dialog, mounted in App.vue, serves every page.
export const upgradeReason = ref(null)

export const showUpgrade = (reason = '') => {
  upgradeReason.value = reason
}

export const closeUpgrade = () => {
  upgradeReason.value = null
}
