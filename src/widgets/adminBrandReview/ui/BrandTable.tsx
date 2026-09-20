import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import {
  BRAND_REVIEW_STATUS_LABELS,
  type BrandSummaryDto,
} from '@/features/admin'

type Props = {
  brands: BrandSummaryDto[]
}

const yesNo = (v: boolean) => (v ? 'O' : '-')

export function BrandTable({ brands }: Props) {
  return (
    <div className='overflow-hidden rounded-12 border border-stroke-border-gray-stronger'>
      <div className='border-b border-stroke-border-gray-stronger bg-background-gray-default px-16 py-12 text-noto-label-sm-bold text-text-and-icon-secondary'>
        브랜드 목록
      </div>
      <Table>
        <TableHeader>
          <TableRow className='border-b border-stroke-border-gray-stronger'>
            <TableHead className='pl-24 text-left'>브랜드 명</TableHead>
            <TableHead className='text-left'>브랜드 ID</TableHead>
            <TableHead className='text-left'>AI 생성</TableHead>
            <TableHead className='text-left'>관리자 승인</TableHead>
            <TableHead className='pr-24 text-left'>검수 상태</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {brands.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className='py-40 text-text-and-icon-secondary'>
                브랜드가 없습니다.
              </TableCell>
            </TableRow>
          )}
          {brands.map((brand) => (
            <TableRow
              key={brand.id}
              className='border-b border-stroke-border-gray-stronger last:border-b-0'>
              <TableCell className='pl-24 text-left text-brand-primary'>
                {brand.name}
              </TableCell>
              <TableCell className='text-left text-text-and-icon-secondary'>
                {brand.id}
              </TableCell>
              <TableCell className='text-left'>
                {yesNo(brand.aiGenerated)}
              </TableCell>
              <TableCell className='text-left'>
                {yesNo(brand.adminApproved)}
              </TableCell>
              <TableCell className='pr-24 text-left'>
                {BRAND_REVIEW_STATUS_LABELS[brand.adminReviewStatus]}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
