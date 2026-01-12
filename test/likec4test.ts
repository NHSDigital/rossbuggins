import { likec4model } from './likec4-model'
import { test } from 'vitest'

interface LikeC4TestFixtures {
  likec4: typeof likec4model
}

// This wil be our test function with the model in the context
export const likec4test = test.extend<LikeC4TestFixtures>({
  likec4: async ({}, use) => {
    await use(likec4model)
  },
})