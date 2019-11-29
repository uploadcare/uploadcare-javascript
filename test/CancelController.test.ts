import CancelController from '../src/CancelController'

describe('CancelController', () => {
  it('should work', (done) => {
    let ctrl = new CancelController()

    ctrl.onCancel(done)
    ctrl.cancel()
  })

  it('should run onCancel callback ones', async () => {
    let ctrl = new CancelController()
    let onCancel = jasmine.createSpy('cancel')

    ctrl.onCancel(onCancel)
    ctrl.cancel()
    ctrl.cancel()

    // onCancel works async
    // this hack for wait execution of CancelController
    let spy = await Promise.resolve(onCancel)

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('should ', async () => {
    let ctrl = new CancelController()
    let firstOnCancel = jasmine.createSpy('cancel')
    let secondOnCancel = jasmine.createSpy('cancel')

    ctrl.onCancel(firstOnCancel)
    ctrl.onCancel(secondOnCancel)

    ctrl.cancel()

    // onCancel works async
    // this hack for wait execution of CancelController
    let [spy1, spy2] = await Promise.resolve([firstOnCancel, secondOnCancel])

    expect(spy1).toHaveBeenCalledTimes(1)
    expect(spy2).toHaveBeenCalledTimes(1)
  })
})
