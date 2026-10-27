import { mkdir, readdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const SOURCE_DIR = path.resolve('assets/nfts')
const OUTPUT_DIR = path.resolve('public/images/nfts')
const WIDTHS = [160, 320, 640, 960]
const WEBP_QUALITY = 78

async function optimizeArtwork(fileName) {
  const slug = path.parse(fileName).name
  const source = sharp(path.join(SOURCE_DIR, fileName))

  await Promise.all(
    WIDTHS.map((width) =>
      source
        .clone()
        .resize({ width, height: width, fit: 'cover' })
        .webp({ quality: WEBP_QUALITY, effort: 6 })
        .toFile(path.join(OUTPUT_DIR, `${slug}-${width}.webp`)),
    ),
  )

  return slug
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true })
  const files = (await readdir(SOURCE_DIR)).filter((file) => file.endsWith('.png'))
  const slugs = await Promise.all(files.map(optimizeArtwork))
  console.warn(`Imagens geradas: ${slugs.join(', ')} em ${WIDTHS.join('/')}px`)
}

await main()
