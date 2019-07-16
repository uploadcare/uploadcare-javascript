import * as factory from '../_fixtureFactory'
import {getSettingsForTesting} from '../_helpers'
import groupFrom from '../../src/groupFrom/groupFrom'
import {GroupFrom} from '../../src/groupFrom/types'

describe('groupFrom', () => {
  describe('Uploaded[]', () => {
    const uuid = factory.uuid('image')

    it('should resolves when file is ready on CDN', (done) => {
      const settings = getSettingsForTesting({
        publicKey: factory.publicKey('image'),
      })
      const groupPromise = groupFrom(GroupFrom.Uploaded, [uuid], settings)

      groupPromise
        .then(group => {
          expect(group.cdnUrl).toBeTruthy()
          done()
        })
    })

    it('should accept doNotStore setting', async() => {
      const settings = getSettingsForTesting({
        publicKey: factory.publicKey('image'),
        doNotStore: true,
      })
      const groupPromise = groupFrom(GroupFrom.Uploaded, [uuid], settings)
      const group = await groupPromise

      expect(group.isStored).toBeFalsy()
    })

    it('should be able to cancel uploading', (done) => {
      const settings = getSettingsForTesting({
        publicKey: factory.publicKey('image'),
      })
      const groupPromise = groupFrom(GroupFrom.Uploaded, [uuid], settings)

      setTimeout(() => {
        groupPromise.cancel()
      }, 1)

      groupPromise
        .then(() => done.fail('Promise should not to be resolved'))
        .catch((error) => error.name === 'CancelError' ? done() : done.fail(error))
    })

    describe('should be able to handle', () => {
      it('cancel uploading', (done) => {
        const settings = getSettingsForTesting({
          publicKey: factory.publicKey('image'),
        })
        const groupPromise = groupFrom(GroupFrom.Uploaded, [uuid], settings)

        setTimeout(() => {
          groupPromise.cancel()
        }, 1)

        groupPromise.onCancel = () => {
          done()
        }

        groupPromise
          .then(() => done.fail('Promise should not to be resolved'))
          .catch((error) => {
            if (error.name !== 'CancelError') {
              done.fail(error)
            }
          })
      })

      it('progress', (done) => {
        let progressValue = 0
        const settings = getSettingsForTesting({
          publicKey: factory.publicKey('image'),
        })
        const groupPromise = groupFrom(GroupFrom.Uploaded, [uuid], settings)

        groupPromise.onProgress = (progress) => {
          const {value} = progress

          progressValue = value
        }

        groupPromise
          .then(() =>
            progressValue > 0
              ? done()
              : done.fail()
          )
          .catch(error => done.fail(error))
      })

      it('uploaded', (done) => {
        const settings = getSettingsForTesting({
          publicKey: factory.publicKey('image'),
        })
        const groupPromise = groupFrom(GroupFrom.Uploaded, [uuid], settings)

        groupPromise.onUploaded = () => {
          done()
        }

        groupPromise
          .catch(error => done.fail(error))
      })

      it('ready', (done) => {
        const settings = getSettingsForTesting({
          publicKey: factory.publicKey('image'),
        })
        const groupPromise = groupFrom(GroupFrom.Uploaded, [uuid], settings)

        groupPromise.onReady = () => {
          done()
        }

        groupPromise
          .catch(error => done.fail(error))
      })
    })
  })
})