import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '@/components/ui/carousel'
import { MAX_DOCUMENT_FILE_SIZE } from '@/pages/main/imoveis/constants/max_document_file_size'
import { ACCEPTED_DOCUMENT_TYPES } from '@/pages/main/proprietarios/constants/accepted-document-types'
import { Download, File, FileText, FileUp, Image, X } from 'lucide-react'
import { useRef } from 'react'
import { useFormContext } from 'react-hook-form'
import { useMediaQuery } from 'react-responsive'
import { AZURE_BLOB_CONTAINER } from '@/constants/azure-blob';

export function DocumentUpload({
  disabled,
  downloadDocuments,
  title = 'Documentos',
  documentField = 'documentos'
}: {
  disabled?: boolean
  downloadDocuments?: boolean
  title?: string
  documentField?: string
}) {

  const isBigScreen = useMediaQuery({ query: '(min-width: 1824px)' })
  const isPortrait = useMediaQuery({ query: '(min-width: 1224px)' })
  const isTablet = useMediaQuery({ query: '(min-width: 746px)' })
  //const isMobile = useMediaQuery({ query: '(min-width: 400px)' })

  const { watch, setValue, setError } = useFormContext()
  const documents = watch(documentField) || []
  const fileInputRef = useRef<HTMLInputElement>(null)
  console.log('document field', documentField)
  console.log('documents', documents);

  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newDocuments = Array.from(files)
        .map((file) => {
          if (file.size > MAX_DOCUMENT_FILE_SIZE) {
            setError(documentField, {
              type: 'manual',
              message: `O tamanho do documento não pode ser maior que ${MAX_DOCUMENT_FILE_SIZE / 1024 / 1024}MB.`
            })
            return null
          }
          if (!ACCEPTED_DOCUMENT_TYPES.includes(file.type)) {
            setError(documentField, {
              type: 'manual',
              message: 'Tipo de arquivo não suportado. Por favor, envie um formato válido.'
            })
            return null
          }
          return {
            file,
            name: file.name,
            type: file.type,
            size: file.size,
            preview: URL.createObjectURL(file)
          }
        })
        .filter((doc) => doc !== null)
        .filter(Boolean)
      console.log(newDocuments)
      setValue(documentField, [...documents, ...newDocuments], {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      })
    }
  }

  const removeDocument = (index: number) => {
    const newDocuments = [...documents]
    newDocuments.splice(index, 1)
    setValue(documentField, newDocuments, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    })

    //also for existant docs, set the id to delete
    if (documents[index]?.id) {
      /*setValue("documentosToDeleteIds", [...(watch("documentosToDeleteIds") || []), {id: documents[index].id, file: documents[index].name}], {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      })*/
      setValue(
        'documentosToDeleteIds',
        [...(watch('documentosToDeleteIds') || []), documents[index].id],
        {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true
        }
      );
    }
  }

  const handleAddDocumentClick = () => {
    fileInputRef.current?.click()
  }

  const getDocumentIcon = (type: string) => {
    if (type?.startsWith('image/')) return <Image className="h-12 w-12" />
    if (type === 'application/pdf') return <FileText className="h-12 w-12" />
    return <File className="h-12 w-12" />
  }

  //const supabaseUrl = "https://jrseqfittadsxfbmlwvz.supabase.co";
  //SUPABASE_URL="https://jrseqfittadsxfbmlwvz.supabase.co"
  //SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impyc2VxZml0dGFkc3hmYm1sd3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg3ODIxNzAsImV4cCI6MjA0NDM1ODE3MH0.37dIwEoJYD-btVZCyEjq1ESY8TN2J3uJlD5nTqw2Hmg"
  //const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impyc2VxZml0dGFkc3hmYm1sd3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg3ODIxNzAsImV4cCI6MjA0NDM1ODE3MH0.37dIwEoJYD-btVZCyEjq1ESY8TN2J3uJlD5nTqw2Hmg";

  //const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const downloadDocument = async (index:number) => {
    try {
      /*console.log(documents[index]?.url);
      
      const { data, error } = await supabase.storage
        .from('imoveis_photos') // Replace with your bucket name
        .download(documents[index]?.url.replace('imoveis_photos/',''));

      if (error) {
        throw error;
      }

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = documents[index]?.name; // Desired filename for download
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);*/

      const blobName = AZURE_BLOB_CONTAINER + documents[index]?.url;
      const a = document.createElement('a');
      a.href = blobName;
      a.download = documents[index]?.name; // Desired filename for download
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  return (
    <div className="mb-6 w-full space-y-4 font-[Poppins-Regular]">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        {!disabled && (
        <Button onClick={handleAddDocumentClick} variant="outline" size="sm" type="button" className='hover:cursor-pointer hover:bg-gray-200'>
          <FileUp className="mr-2 h-4 w-4" />
          Adicionar documento
        </Button>
        )}
      </div>
      <input
        type="file"
        accept={ACCEPTED_DOCUMENT_TYPES.join(',')}
        multiple
        className="hidden"
        ref={fileInputRef}
        disabled={disabled}
        onChange={handleDocumentUpload}
      />
      {documents.length > 0 ? (
        <Carousel autoplay={true}>
          <CarouselContent className='max-w-[300px]'>
            {documents.map((doc:any, index: number) => (
              <CarouselItem key={index} className="basis-[30vw] md:basis-[15vw] lg:basis-[10vw]">
                <div className="p-1">
                  <Card>
                    <CardContent className="relative flex aspect-square items-center justify-center p-2">
                      <div className="flex w-full flex-col items-center">
                        {getDocumentIcon(doc.type)}
                        <span className="mt-2 max-w-full truncate text-center text-sm">
                          {doc.name}
                        </span>
                      </div>
                      {
                        downloadDocuments && (
                        <Button                          
                          className="absolute left-98 top-7 h-6 w-2 opacity-0 hover:opacity-75"
                          onClick={() => downloadDocument(index)}
                          type="button"
                        >
                          <Download/>
                        </Button>

                        )
                      }
                      {!disabled && (
                        <Button
                          variant="destructive"                          
                          className="absolute right-1 top-1 h-6 w-2"
                          onClick={() => removeDocument(index)}
                          type="button"
                        >
                          <X/>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious type="button" className={(documents.length > (isBigScreen ? 7 : isPortrait ? 4 : isTablet ? 4 : 2) ? "flex" : "hidden")}/>
          <CarouselNext type="button" className={(documents.length > (isBigScreen ? 7 : isPortrait ? 4 : isTablet ? 4 : 2) ? "flex" : "hidden")}/>
        </Carousel>
      ) : (
        <div className="rounded-md bg-muted py-8 text-center">
          <p className="text-muted-foreground">Nenhum documento adicionado</p>
        </div>
      )}
      {/*formState.errors[documentField] && (
        <p className="text-sm text-red-500">{formState?.errors?.[documentField].message}</p>
      )*/}
    </div>
  )
}
