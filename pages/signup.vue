<template>
  <div>
    <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
      Create your account
    </h2>
    <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
      Or
      <NuxtLink to="/signin" class="font-medium text-primary-600 hover:text-primary-500">
        sign in to existing account
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
            autocomplete="new-password"
            required
            placeholder="Create a password"
          />
        </UFormGroup>

        <UFormGroup label="Confirm Password">
          <UInput
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
            required
            placeholder="Confirm your password"
          />
        </UFormGroup>
      </div>

      <div>
        <UCheckbox
          v-model="agreeToTerms"
          name="agree-to-terms"
          label="I agree to the Terms of Service and Privacy Policy"
        />
      </div>

      <div>
        <UButton
          type="submit"
          block
          :loading="loading"
          :disabled="!agreeToTerms || password !== confirmPassword"
        >
          Create Account
        </UButton>
      </div>
    </form>
  </div>
</template>

<script setup>
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const agreeToTerms = ref(false)
const loading = ref(false)

definePageMeta({
  layout: 'auth'
})

const handleSubmit = async () => {
  if (password.value !== confirmPassword.value) {
    return
  }

  loading.value = true
  try {
    // TODO: Implement registration logic
    console.log('Sign up attempt with:', { email: email.value, password: password.value })
  } catch (error) {
    console.error('Sign up error:', error)
  } finally {
    loading.value = false
  }
}
</script>