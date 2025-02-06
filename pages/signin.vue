<script setup lang="ts">
const email = ref("");
const password = ref("");
const rememberMe = ref(false);
const loading = ref(false);

definePageMeta({
  layout: "auth",
});

const handleSubmit = async () => {
  loading.value = true;
  try {
    // TODO: Implement authentication logic
    console.log("Sign in attempt with:", {
      email: email.value,
      password: password.value,
      rememberMe: rememberMe.value,
    });
  } catch (error) {
    console.error("Sign in error:", error);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div>
    <h2
      class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white"
    >
      Sign in to your account
    </h2>
    <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
      Or
      <NuxtLink
        to="/signup"
        class="font-medium text-primary-600 hover:text-primary-500"
      >
        create a new account
      </NuxtLink>
    </p>
    <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
      <div class="rounded-md shadow-sm space-y-4">
        <UFormGroup label="Email address">
          <UInput
            v-model="email"
            type="email"
            autocomplete="email"
            required
            placeholder="Enter your email"
          />
        </UFormGroup>

        <UFormGroup label="Password">
          <UInput
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            placeholder="Enter your password"
          />
        </UFormGroup>
      </div>

      <div class="flex items-center justify-between">
        <UCheckbox
          v-model="rememberMe"
          name="remember-me"
          label="Remember me"
        />
        <div class="text-sm">
          <NuxtLink
            to="/forgot-password"
            class="font-medium text-primary-600 hover:text-primary-500"
          >
            Forgot your password?
          </NuxtLink>
        </div>
      </div>

      <div>
        <UButton type="submit" block :loading="loading"> Sign in </UButton>
      </div>
    </form>
  </div>
</template>
