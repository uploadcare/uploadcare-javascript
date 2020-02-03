import { config } from 'dotenv'

config()

const PORT = 3000

const ALLOWED_PUBLIC_KEYS = [
  'demopublickey',
  'secret_public_key',
  'pub_test__no_storing'
]

export { PORT, ALLOWED_PUBLIC_KEYS }
