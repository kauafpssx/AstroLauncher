import { Plus, X } from 'lucide-react'
import type { Dispatch, MouseEvent, SetStateAction } from 'react'
import Cropper from 'react-easy-crop'
import type { Area, Point } from 'react-easy-crop'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import { resolveIconSrc } from '@/lib/icon-src'
import { tooltipProps } from '@/lib/tooltip'

import type { CustomIconDTO } from '../services/custom-icon.api'

interface IconUploadTabProps {
  uploadSrc: string | null
  crop: Point
  setCrop: Dispatch<SetStateAction<Point>>
  zoom: number
  setZoom: Dispatch<SetStateAction<number>>
  onCropComplete: (pixels: Area) => void
  isProcessing: boolean
  customIcons: CustomIconDTO[]
  onChooseFile: () => void
  onConfirmCrop: () => void
  onResetUpload: () => void
  onPickCustom: (icon: CustomIconDTO) => void
  onDeleteCustom: (icon: CustomIconDTO, e: MouseEvent) => void
}

export function IconUploadTab({
  uploadSrc,
  crop,
  setCrop,
  zoom,
  setZoom,
  onCropComplete,
  isProcessing,
  customIcons,
  onChooseFile,
  onConfirmCrop,
  onResetUpload,
  onPickCustom,
  onDeleteCustom,
}: IconUploadTabProps) {
  if (uploadSrc) {
    return (
      <>
        <div className="bg-muted relative h-64 w-full overflow-hidden rounded-lg">
          <Cropper
            image={uploadSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="rect"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_area, pixels) => onCropComplete(pixels)}
          />
        </div>
        <Slider
          value={[zoom]}
          min={1}
          max={3}
          step={0.01}
          onValueChange={([v]) => setZoom(v)}
        />
        <div className="flex justify-between">
          <Button variant="ghost" onClick={onResetUpload}>
            Escolher outra imagem
          </Button>
          <Button onClick={onConfirmCrop} disabled={isProcessing}>
            {isProcessing ? 'Salvando...' : 'Salvar imagem'}
          </Button>
        </div>
      </>
    )
  }

  return (
    <ScrollArea className="h-72">
      <div className="grid grid-cols-6 gap-2 pt-2 pr-3">
        <button
          type="button"
          onClick={onChooseFile}
          className="border-muted-foreground/40 text-muted-foreground hover:border-primary hover:text-primary flex aspect-square items-center justify-center rounded-md border border-dashed transition-colors"
          aria-label="Enviar imagem"
          {...tooltipProps('Enviar imagem')}
        >
          <Plus className="size-5" />
        </button>
        {customIcons.map((icon) => (
          <div key={icon.id} className="group relative aspect-square">
            <button
              type="button"
              onClick={() => onPickCustom(icon)}
              className="bg-muted hover:border-primary hover:bg-accent flex size-full items-center justify-center rounded-md border border-transparent p-2 transition-colors"
            >
              <img
                src={resolveIconSrc(icon.path)}
                alt=""
                className="size-full rounded-sm object-cover"
              />
            </button>
            <button
              type="button"
              onClick={(e) => onDeleteCustom(icon, e)}
              className="bg-destructive text-destructive-foreground absolute -top-1.5 -right-1.5 hidden size-5 items-center justify-center rounded-full group-hover:flex"
              aria-label="Excluir"
              {...tooltipProps('Excluir')}
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
        {customIcons.length === 0 && (
          <p className="text-muted-foreground col-span-5 flex items-center p-4 text-sm">
            Nenhuma imagem enviada ainda.
          </p>
        )}
      </div>
    </ScrollArea>
  )
}
