<template>
  <div>
    <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
      Reset your password
    </h2>
    <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
      Enter your email address and we'll send you a link to reset your password.
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
      </div>

      <div>
        <UButton
          type="submit"
          block
          :loading="loading"
        >
          Send Reset Link
        </UButton>
      </div>

      <div class="text-center">
        <NuxtLink to="/signin" class="font-medium text-primary-600 hover:text-primary-500">
          Back to sign in
        </NuxtLink>
      </div>
    </form>

    <UAlert
      v-if="successMessage"
      title="Check your email"
      description="If an account exists with this email, you will receive password reset instructions."
      color="green"
    />
  </div>
</template>

<script setup>
const email = ref('')
const loading = ref(false)
const successMessage = ref(false)

definePageMeta({
  layout: 'auth'
})

const handleSubmit = async () => {
  loading.value = true
  try {
    // TODO: Implement password reset request logic
    console.log('Password reset requested for:', email.value)
    successMessage.value = true
    email.value = ''
  } catch (error) {
    console.error('Password reset request error:', error)
  } finally {
    loading.value = false
  }
}
</script>