import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      /* 디자인 토큰의 radius 스케일을 tailwind-merge에 알려준다.
       * 등록하지 않으면 shadcn 기본 클래스(rounded-lg 등)와 같은 그룹으로
       * 병합되지 않아 둘 다 살아남고, 명시도가 같아 나중 선언이 이긴다. */
      rounded: [{ rounded: ['0', '2', '4', '6', '8', '10', '12', '16', '24'] }],
      'font-size': [
        {
          text: [
            'noto-title-lg-bold', 'noto-title-lg-normal', 'noto-title-lg-thin',
            'noto-title-md-bold', 'noto-title-md-normal', 'noto-title-md-thin',
            'noto-title-sm-bold', 'noto-title-sm-normal', 'noto-title-sm-thin',
            'noto-body-lg-bold', 'noto-body-lg-normal',
            'noto-body-md-bold', 'noto-body-md-normal',
            'noto-body-sm-bold', 'noto-body-sm-normal',
            'noto-body-xs-bold', 'noto-body-xs-normal',
            'noto-body-xxs-bold', 'noto-body-xxs-normal',
            'noto-label-lg-bold', 'noto-label-lg-normal', 'noto-label-lg-thin',
            'noto-label-md-bold', 'noto-label-md-normal', 'noto-label-md-thin',
            'noto-label-sm-bold', 'noto-label-sm-normal', 'noto-label-sm-thin',
            'noto-label-xs-bold', 'noto-label-xs-normal', 'noto-label-xs-thin',
            'noto-caption-lg-bold', 'noto-caption-lg-normal',
            'noto-caption-md-bold', 'noto-caption-md-normal',
            'noto-caption-sm-bold', 'noto-caption-sm-normal',
            'ibm-display-lg-bold', 'ibm-display-lg-normal', 'ibm-display-lg-thin',
            'ibm-display-md-bold', 'ibm-display-md-normal', 'ibm-display-md-thin',
            'ibm-display-sm-bold', 'ibm-display-sm-normal', 'ibm-display-sm-thin',
            'ibm-heading-lg-bold', 'ibm-heading-lg-normal', 'ibm-heading-lg-thin',
            'ibm-heading-md-bold', 'ibm-heading-md-normal', 'ibm-heading-md-thin',
            'ibm-heading-sm-bold', 'ibm-heading-sm-normal', 'ibm-heading-sm-thin',
            'ibm-title-lg-normal', 'ibm-title-lg-thin',
            'ibm-title-md-normal', 'ibm-title-md-thin',
            'ibm-title-sm-normal', 'ibm-title-sm-thin',
            'ibm-label-lg-bold', 'ibm-label-lg-normal', 'ibm-label-lg-thin',
            'ibm-label-md-bold', 'ibm-label-md-normal', 'ibm-label-md-thin',
            'ibm-label-sm-bold', 'ibm-label-sm-normal', 'ibm-label-sm-thin',
            'ibm-label-xs-bold', 'ibm-label-xs-normal', 'ibm-label-xs-thin',
          ],
        },
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
