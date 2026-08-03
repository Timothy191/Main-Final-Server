import { dispatchTask } from '../src/dispatcher/eve-dispatcher.js'

async function testDispatch() {
  try {
    console.log('Dispatching test task...')
    const dispatch = await dispatchTask({
      task: 'Test Task',
      prompt: 'This is a test task.',
      triggeredBy: 'manual',
    })
    console.log('Dispatch Result:', JSON.stringify(dispatch, null, 2))
  } catch (err) {
    console.error('Dispatch failed:', err)
  }
}

testDispatch()
