import { useQuery } from '@tanstack/react-query'
import { relatedNftsQueryOptions } from '@/features/catalog/api/catalog-queries'
import { NftCarousel } from '@/features/catalog/components/nft-carousel'

interface RelatedNftsProps {
  nftId: string
  title?: string
}

export function RelatedNfts({ nftId, title = 'Mais desta coleção' }: RelatedNftsProps) {
  const { data, isPending, isError } = useQuery(relatedNftsQueryOptions(nftId))

  if (isError) {
    return null
  }

  return <NftCarousel title={title} items={data?.items ?? []} isPending={isPending} />
}
