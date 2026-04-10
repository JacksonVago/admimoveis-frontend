'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel'
import { Download, ImagePlus, X } from 'lucide-react'
import { useRef } from 'react'
import { useFormContext } from 'react-hook-form'
import { useMediaQuery } from 'react-responsive'

export function PropertyImageUpload({ disabled }: { disabled?: boolean }) {
  const isBigScreen = useMediaQuery({ query: '(min-width: 1824px)' })
  const isPortrait = useMediaQuery({ query: '(min-width: 1224px)' })
  const isTablet = useMediaQuery({ query: '(min-width: 746px)' })

  const { watch, setValue } = useFormContext()
  const images = watch('imovelPhotos') || []
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newImages = Array.from(files).map((file) => ({
        file,
        preview: URL.createObjectURL(file)
      }))
      setValue('imovelPhotos', [...images, ...newImages], {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      })
    }
  }

  const removeImage = (index: number) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    //set images to delete

    setValue('imovelPhotos', newImages, { shouldValidate: true, shouldDirty: true, shouldTouch: true })

    //also for existant images, set the id to delete
    if (images[index]?.id) {
      setValue(
        'imagesToDeleteIds',
        [...(watch('imagesToDeleteIds') || []), images[index].id],
        {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true
        })
    }
  }

  const handleAddImageClick = () => {
    fileInputRef.current?.click()
  }

  const downloadDocument = async (index:number) => {
    try {
      console.log('images', images[index]);
      const blobName = import.meta.env.VITE_AZURE_BLOB_CONTAINER + images[index]?.file.name;
      const a = document.createElement('a');
      a.href = blobName;
      a.download = images[index]?.file.name; // Desired filename for download
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  return (
    <div className="mb-6 w-full space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-2xlg font-semibold">Imagens do Imóvel</h3>
        {!disabled && (
          <Button onClick={handleAddImageClick} variant="outline" size="sm" type="button">
            <ImagePlus className="mr-2 h-4 w-4" />
            Adicionar imagem
          </Button>
        )}
      </div>
      <input
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        ref={fileInputRef}
        disabled={disabled}
        onChange={handleImageUpload}
      />
      {images.length > 0 ? (
        <Carousel>
          <CarouselContent className="max-w-[350px]">
            {images.map((image: { preview: string }, index: number) => (
              <CarouselItem key={index} className="basis-[30vw] md:basis-[15vw] lg:basis-[10vw]">
                <div className="p-1">
                  <Card>
                    <CardContent className="relative flex aspect-square items-center justify-center p-2">
                      <img
                        src={image.preview}
                        alt={`Property image ${index + 1}`}
                        className="h-full w-full rounded-md object-cover"
                      />
                        <Button                          
                          className="absolute left-98 top-7 h-6 w-2 opacity-0 hover:opacity-75"
                          onClick={() => downloadDocument(index)}
                          type="button"
                        >
                          <Download/>
                        </Button>
                      {!disabled && (
                        <Button
                          variant="destructive"
                          className="absolute right-1 top-1 h-6 w-2"
                          onClick={() => removeImage(index)}
                          type="button"
                        >
                          <X />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious type="button" className={(images.length > (isBigScreen ? 7 : isPortrait ? 4 : isTablet ? 4 : 2) ? "flex" : "hidden")} />
          <CarouselNext type="button" className={(images.length > (isBigScreen ? 7 : isPortrait ? 4 : isTablet ? 4 : 2) ? "flex" : "hidden")} />
        </Carousel>
      ) : (
        <div className="rounded-md bg-muted py-8 text-center">
          <p className="text-muted-foreground">Nenhuma imagem adicionada</p>
        </div>
      )}
    </div>
  )
}
