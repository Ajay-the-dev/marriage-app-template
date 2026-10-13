<template>
  <Basic>
    <section class="auth-section">
      <div class="auth-card">
        <router-link to="/" class="back-link" title="Back to site">
          <i class="fa-solid fa-arrow-left"></i>
        </router-link>

        <div class="auth-head">
          <!-- <span class="monogram">{{ wedding.site.monogram }}</span> -->
          <h1>{{ heading }}</h1>
          <p>{{ subheading }}</p>
        </div>

        <div v-if="mode !== 'reset'" class="auth-tabs" role="tablist">
          <button type="button" role="tab" :class="{ active: mode === 'login' }" @click="switchMode('login')">Sign in</button>
          <button type="button" role="tab" :class="{ active: mode === 'register' }" @click="switchMode('register')">Create account</button>
        </div>

        <form class="auth-form" @submit.prevent="submit" novalidate>
          <label v-if="mode === 'register'" class="field">
            <span>Your name</span>
            <input v-model.trim="form.name" type="text" autocomplete="name" placeholder="Jane Doe" required />
          </label>

          <label class="field">
            <span>Email</span>
            <input v-model.trim="form.email" type="email" autocomplete="email" placeholder="you@example.com" required />
          </label>

          <label v-if="mode !== 'reset'" class="field">
            <span class="field-row">
              Password
              <button v-if="mode === 'login'" type="button" class="link-btn" @click="switchMode('reset')">Forgot?</button>
            </span>
            <span class="password-wrap">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                :autocomplete="mode === 'register' ? 'new-password' : 'current-password'"
                placeholder="••••••••"
                required
              />
              <button type="button" class="eye" :title="showPassword ? 'Hide password' : 'Show password'" @click="showPassword = !showPassword">
                <i class="fa-solid" :class="showPassword ? 'fa-eye-slash' : 'fa-eye'"></i>
              </button>
            </span>
          </label>

          <label v-if="mode === 'register'" class="field">
            <span>Confirm password</span>
            <input v-model="form.confirm" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" placeholder="••••••••" required />
          </label>

          <p v-if="error" class="alert error"><i class="fa-solid fa-circle-exclamation"></i> {{ error }}</p>
          <p v-if="notice" class="alert notice"><i class="fa-solid fa-circle-check"></i> {{ notice }}</p>

          <button type="submit" class="btn-primary" :disabled="busy">
            <span v-if="busy" class="spinner"></span>
            {{ submitLabel }}
          </button>

          <button v-if="mode === 'reset'" type="button" class="link-btn center" @click="switchMode('login')">
            <i class="fa-solid fa-arrow-left"></i> Back to sign in
          </button>
        </form>

        <template v-if="mode !== 'reset'">
          <div class="divider"><span>or</span></div>
          <button type="button" class="btn-oauth" :disabled="busy" @click="oauth('google')">
            <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
              <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
            </svg>
            Continue with Google
          </button>
        </template>
      </div>
    </section>
  </Basic>
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import Basic from "@/views/Basic.vue";
import { useWeddingStore } from "@/stores/wedding";
import { useAuthStore, authErrorMessage } from "@/stores/auth";

const wedding = useWeddingStore();
const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const mode = ref(route.query.mode === "register" ? "register" : "login");
const form = reactive({ name: "", email: "", password: "", confirm: "" });
const showPassword = ref(false);
const busy = ref(false);
const error = ref("");
const notice = ref("");

const heading = computed(() => ({ login: "Welcome back", register: "Create your account", reset: "Reset password" })[mode.value]);
const subheading = computed(() => ({
  login: "Sign in to manage your wedding site",
  register: "Start building your wedding invitation",
  reset: "We'll email you a link to set a new password",
})[mode.value]);
const submitLabel = computed(() => ({ login: "Sign in", register: "Create account", reset: "Send reset link" })[mode.value]);

// Only follow in-app redirects (blocks "//evil.com" style values)
const redirectTarget = () => {
  const target = route.query.redirect;
  return typeof target === "string" && target.startsWith("/") && !target.startsWith("//") ? target : "/settings";
};

const switchMode = (next) => {
  mode.value = next;
  error.value = "";
  notice.value = "";
};

const validate = () => {
  if (!/^\S+@\S+\.\S+$/.test(form.email)) return "Please enter a valid email address.";
  if (mode.value === "reset") return "";
  if (!form.password) return "Please enter your password.";
  if (mode.value === "register") {
    if (!form.name) return "Please enter your name.";
    if (form.password.length < 8) return "Password should be at least 8 characters.";
    if (form.password !== form.confirm) return "Passwords do not match.";
  }
  return "";
};

const run = async (action) => {
  error.value = "";
  notice.value = "";
  busy.value = true;
  try {
    await action();
  } catch (e) {
    error.value = authErrorMessage(e);
  } finally {
    busy.value = false;
  }
};

const submit = () => {
  const problem = validate();
  if (problem) {
    error.value = problem;
    return;
  }
  run(async () => {
    if (mode.value === "reset") {
      await auth.resetPassword(form.email);
      notice.value = "If an account exists for that email, a reset link is on its way.";
      return;
    }
    if (mode.value === "register") await auth.register(form);
    else await auth.login(form);
    router.replace(redirectTarget());
  });
};

const oauth = (provider) =>
  run(async () => {
    await auth.loginWith(provider);
    router.replace(redirectTarget());
  });
</script>

<style scoped lang="scss">
.auth-section {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  background:
    radial-gradient(circle at 20% 10%, color-mix(in srgb, var(--gold-light) 45%, transparent), transparent 55%),
    radial-gradient(circle at 85% 90%, color-mix(in srgb, var(--blush) 80%, transparent), transparent 55%),
    var(--cream);
  font-family: var(--font-sans);
  color: var(--text);
}

.auth-card {
  position: relative;
  width: 100%;
  max-width: 420px;
  background: var(--card);
  border: 1px solid color-mix(in srgb, var(--gold) 30%, transparent);
  border-radius: 20px;
  padding: 40px 32px 32px;
  box-shadow: 0 24px 60px -24px color-mix(in srgb, var(--shadow) 35%, transparent);
}

.back-link {
  position: absolute;
  top: 16px;
  left: 16px;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: var(--text);
  text-decoration: none;
  transition: background 0.2s;
  &:hover { background: var(--blush); }
}

.auth-head {
  text-align: center;
  margin-bottom: 24px;

  .monogram {
    display: inline-grid;
    place-items: center;
    min-width: 56px;
    height: 56px;
    padding: 0 12px;
    border-radius: 50%;
    border: 1px solid var(--gold);
    color: var(--gold-dark);
    font-family: var(--font-display);
    font-size: 1.1rem;
    margin-bottom: 14px;
  }
  h1 {
    font-family: var(--font-display);
    color: var(--dark);
    font-size: 1.7rem;
    margin: 0 0 6px;
  }
  p {
    font-family: var(--font-serif);
    font-size: 1.05rem;
    color: var(--sage);
    margin: 0;
  }
}

.auth-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: var(--blush);
  border-radius: 999px;
  padding: 4px;
  margin-bottom: 22px;

  button {
    border: 0;
    background: transparent;
    padding: 9px 0;
    border-radius: 999px;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text);
    transition: background 0.2s, color 0.2s;
    &.active {
      background: var(--card);
      color: var(--dark);
      box-shadow: 0 2px 8px -2px color-mix(in srgb, var(--shadow) 25%, transparent);
    }
  }
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.02em;

  input {
    width: 100%;
    padding: 11px 14px;
    border: 1px solid color-mix(in srgb, var(--gold) 35%, transparent);
    border-radius: 10px;
    background: var(--cream);
    color: var(--dark);
    font-size: 0.95rem;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    &:focus {
      border-color: var(--gold);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--gold) 20%, transparent);
    }
  }
}

.field-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.password-wrap {
  position: relative;
  input { padding-right: 44px; }
  .eye {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    border: 0;
    background: none;
    color: var(--sage);
    padding: 6px 8px;
  }
}

.link-btn {
  border: 0;
  background: none;
  padding: 0;
  color: var(--gold-dark);
  font-size: 0.8rem;
  font-weight: 500;
  &:hover { text-decoration: underline; }
  &.center { align-self: center; margin-top: 4px; }
}

.alert {
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 0.85rem;
  display: flex;
  gap: 8px;
  align-items: baseline;
  &.error { background: #fdecec; color: #9b1c1c; }
  &.notice { background: #e8f5ec; color: #1e5b33; }
}

.btn-primary,
.btn-oauth {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 500;
  transition: transform 0.15s, opacity 0.2s, background 0.2s;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
  &:not(:disabled):active { transform: scale(0.98); }
}

.btn-primary {
  margin-top: 4px;
  border: 0;
  background: var(--gold);
  color: var(--on-accent);
  &:not(:disabled):hover { background: var(--gold-dark); color: var(--cream); }
}

.btn-oauth {
  border: 1px solid color-mix(in srgb, var(--gold) 35%, transparent);
  background: var(--card);
  color: var(--dark);
  &:not(:disabled):hover { background: var(--blush); }
}

.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0;
  color: var(--sage);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  &::before,
  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: color-mix(in srgb, var(--gold) 30%, transparent);
  }
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 420px) {
  .auth-card { padding: 36px 20px 24px; }
}
</style>
